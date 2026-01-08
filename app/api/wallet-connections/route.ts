import { NextRequest, NextResponse } from "next/server";

// 动态导入 Redis 客户端（支持标准 Redis URL、Vercel KV 和 Upstash Redis）
let redisClient: any = null;
let redisType: "redis" | "vercel-kv" | "upstash" | null = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  // 优先使用标准 Redis URL (node-redis)
  if (process.env.REDIS_URL) {
    try {
      const { createClient } = require("redis");
      redisClient = createClient({
        url: process.env.REDIS_URL,
      });
      // 确保连接已建立
      if (!redisClient.isOpen) {
        redisClient.connect().catch((err: any) => {
          console.error("Redis 连接失败:", err);
        });
      }
      redisType = "redis";
      console.log("✅ 使用 REDIS_URL 连接 Redis (node-redis)");
      return redisClient;
    } catch (e) {
      console.warn("⚠️ redis (node-redis) 未安装:", e);
    }
  }

  // 使用 Vercel KV
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = require("@vercel/kv");
      redisClient = kv;
      redisType = "vercel-kv";
      console.log("✅ 使用 Vercel KV 作为 Redis 客户端");
      return redisClient;
    } catch (e) {
      console.warn("⚠️ Vercel KV 未安装:", e);
    }
  }

  // 使用 Upstash Redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = require("@upstash/redis");
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      redisType = "upstash";
      console.log("✅ 使用 Upstash Redis 作为 Redis 客户端");
      return redisClient;
    } catch (e) {
      console.warn("⚠️ Upstash Redis 未安装:", e);
    }
  }

  console.warn("⚠️ 未找到 Redis 配置");
  return null;
}

// Redis 操作封装函数，统一处理不同客户端的 API 差异
async function redisZAdd(client: any, key: string, score: number, member: string) {
  if (redisType === "redis") {
    return await client.zAdd(key, { score, value: member });
  } else if (redisType === "vercel-kv") {
    return await client.zadd(key, score, member);
  } else {
    return await client.zadd(key, { score, member });
  }
}

async function redisZRange(client: any, key: string, start: number, stop: number, options?: { rev?: boolean }) {
  if (redisType === "redis") {
    const result = await client.zRange(key, start, stop, options?.rev ? { REV: true } : {});
    return result;
  } else if (redisType === "vercel-kv") {
    return await client.zrange(key, start, stop, options?.rev ? { rev: true } : {});
  } else {
    return await client.zrange(key, start, stop, options);
  }
}

async function redisZCard(client: any, key: string) {
  if (redisType === "redis") {
    return await client.zCard(key);
  } else {
    return await client.zcard(key);
  }
}

async function redisSAdd(client: any, key: string, member: string) {
  if (redisType === "redis") {
    return await client.sAdd(key, member);
  } else {
    return await client.sadd(key, member);
  }
}

async function redisSIsMember(client: any, key: string, member: string) {
  if (redisType === "redis") {
    return (await client.sIsMember(key, member)) ? 1 : 0;
  } else {
    return await client.sismember(key, member);
  }
}

async function redisSCard(client: any, key: string) {
  if (redisType === "redis") {
    return await client.sCard(key);
  } else {
    return await client.scard(key);
  }
}

async function redisSMembers(client: any, key: string) {
  if (redisType === "redis") {
    return await client.sMembers(key);
  } else {
    return await client.smembers(key);
  }
}

// 使用独立前缀避免冲突
const PREFIX = "wallet_tracker:";

interface WalletConnection {
  address: string;
  timestamp: number;
  chainId?: number;
  connectorId?: string;
}

interface PaymentRecord {
  address: string;
  amount: string;
  tokenId?: number;
  timestamp: number;
  transactionHash?: string;
  rarity?: string;
}

// 记录钱包连接或付费
export async function POST(request: NextRequest) {
  try {
    const client = getRedisClient();
    if (!client) {
      console.error("❌ Redis 未配置 - 请设置环境变量:");
      console.error("   标准 Redis: REDIS_URL");
      console.error("   Vercel KV: KV_REST_API_URL, KV_REST_API_TOKEN");
      console.error("   或 Upstash: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN");
      return NextResponse.json({
        success: false,
        message: "Redis 未配置，请设置 REDIS_URL 或 KV_REST_API_URL/KV_REST_API_TOKEN 或 UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN",
      });
    }

    const body = await request.json();
    const { action, address, chainId, connectorId, amount, tokenId, transactionHash, rarity } = body;

    if (action === "connect") {
      if (!address || typeof address !== "string") {
        return NextResponse.json({ error: "address 参数是必需的" }, { status: 400 });
      }

      const normalizedAddress = address.toLowerCase();
      const timestamp = Date.now();
      const existsResult = await client.exists(PREFIX + normalizedAddress);
      const isNewAddress = redisType === "redis" ? existsResult === 0 : !existsResult;

      const connection: WalletConnection = {
        address: normalizedAddress,
        timestamp,
        chainId,
        connectorId,
      };

      await Promise.all([
        redisZAdd(client, PREFIX + "connections", timestamp, JSON.stringify(connection)),
        redisSAdd(client, PREFIX + "unique_addresses", normalizedAddress),
        client.set(PREFIX + normalizedAddress, timestamp.toString()),
        client.incr(PREFIX + "total_connections"),
      ]);

      const uniqueCount = await redisSCard(client, PREFIX + "unique_addresses");

      return NextResponse.json({
        success: true,
        isNewAddress,
        totalUniqueWallets: uniqueCount,
        timestamp,
      });
    } else if (action === "payment") {
      if (!address || typeof address !== "string") {
        return NextResponse.json({ error: "address 参数是必需的" }, { status: 400 });
      }
      if (!amount) {
        return NextResponse.json({ error: "amount 参数是必需的" }, { status: 400 });
      }

      const normalizedAddress = address.toLowerCase();
      const timestamp = Date.now();
      const isMemberResult = await redisSIsMember(client, PREFIX + "paid_addresses", normalizedAddress);
      const isNewPayer = isMemberResult === 0;

      const payment: PaymentRecord = {
        address: normalizedAddress,
        amount: amount.toString(),
        tokenId,
        timestamp,
        transactionHash,
        rarity,
      };

      await Promise.all([
        redisZAdd(client, PREFIX + "payments", timestamp, JSON.stringify(payment)),
        redisSAdd(client, PREFIX + "paid_addresses", normalizedAddress),
        client.incr(PREFIX + normalizedAddress + ":payment_count"),
      ]);

      const currentTotal = (await client.get(PREFIX + normalizedAddress + ":total_amount")) || "0";
      const newTotal = (BigInt(currentTotal) + BigInt(amount)).toString();
      await client.set(PREFIX + normalizedAddress + ":total_amount", newTotal);

      await client.incr(PREFIX + "total_payments");
      const globalTotal = (await client.get(PREFIX + "total_payment_amount")) || "0";
      const newGlobalTotal = (BigInt(globalTotal) + BigInt(amount)).toString();
      await client.set(PREFIX + "total_payment_amount", newGlobalTotal);

      const paidCount = await redisSCard(client, PREFIX + "paid_addresses");

      return NextResponse.json({
        success: true,
        isNewPayer,
        totalPaidWallets: paidCount,
        timestamp,
      });
    } else {
      return NextResponse.json({ error: "无效的 action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("记录失败:", error);
    return NextResponse.json({ error: "记录失败", message: error.message }, { status: 500 });
  }
}

// 获取统计信息
export async function GET(request: NextRequest) {
  try {
    const client = getRedisClient();
    if (!client) {
      return NextResponse.json({
        totalUniqueWallets: 0,
        totalPaidWallets: 0,
        totalPayments: 0,
        totalPaymentAmount: "0",
        message: "Redis 未配置",
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const address = searchParams.get("address");
    const limit = parseInt(searchParams.get("limit") || "10");

    // 查询特定地址的统计
    if (address) {
      const normalizedAddress = address.toLowerCase();
      const [paymentCount, totalAmount, hasPaidResult, connectionTime] = await Promise.all([
        client.get(PREFIX + normalizedAddress + ":payment_count") || 0,
        client.get(PREFIX + normalizedAddress + ":total_amount") || "0",
        redisSIsMember(client, PREFIX + "paid_addresses", normalizedAddress),
        client.get(PREFIX + normalizedAddress) || null,
      ]);

      return NextResponse.json({
        address: normalizedAddress,
        paymentCount: Number(paymentCount) || 0,
        totalAmount,
        hasPaid: hasPaidResult === 1,
        firstConnectionTime: connectionTime ? Number(connectionTime) : null,
      });
    }

    // 查询特定地址的所有付费记录
    if (action === "payments" && address) {
      const normalizedAddress = address.toLowerCase();
      const allPayments = await redisZRange(client, PREFIX + "payments", 0, -1, { rev: true });

      const addressPayments = allPayments
        .map((p: string) => {
          try {
            return JSON.parse(p);
          } catch {
            return null;
          }
        })
        .filter((p: PaymentRecord | null): p is PaymentRecord => p !== null && p.address === normalizedAddress)
        .slice(0, limit || 100);

      return NextResponse.json({ address: normalizedAddress, payments: addressPayments, total: addressPayments.length });
    }

    // 获取全局统计
    const [uniqueCount, totalConnections, paidCount, totalPayments, totalPaymentAmount] = await Promise.all([
      redisSCard(client, PREFIX + "unique_addresses"),
      client.get(PREFIX + "total_connections") || 0,
      redisSCard(client, PREFIX + "paid_addresses"),
      client.get(PREFIX + "total_payments") || 0,
      client.get(PREFIX + "total_payment_amount") || "0",
    ]);

    return NextResponse.json({
      totalUniqueWallets: uniqueCount || 0,
      totalConnections: Number(totalConnections) || 0,
      totalPaidWallets: paidCount || 0,
      totalPayments: Number(totalPayments) || 0,
      totalPaymentAmount: totalPaymentAmount || "0",
      conversionRate: uniqueCount > 0 ? ((paidCount / uniqueCount) * 100).toFixed(2) + "%" : "0%",
    });
  } catch (error: any) {
    console.error("获取统计失败:", error);
    return NextResponse.json({ error: "获取统计失败", message: error.message }, { status: 500 });
  }
}

