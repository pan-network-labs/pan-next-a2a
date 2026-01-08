import { NextRequest, NextResponse } from "next/server";

// 动态导入 Redis 客户端（支持 Vercel KV 和 Upstash Redis）
let redisClient: any = null;
let redisType: "vercel-kv" | "upstash" | null = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  // 优先使用 Vercel KV
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
      console.error("   Vercel KV: KV_REST_API_URL, KV_REST_API_TOKEN");
      console.error("   或 Upstash: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN");
      return NextResponse.json({
        success: false,
        message: "Redis 未配置，请设置 KV_REST_API_URL/KV_REST_API_TOKEN 或 UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN",
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
      const isNewAddress = !(await client.exists(PREFIX + normalizedAddress));

      const connection: WalletConnection = {
        address: normalizedAddress,
        timestamp,
        chainId,
        connectorId,
      };

      await Promise.all([
        redisType === "vercel-kv"
          ? client.zadd(PREFIX + "connections", timestamp, JSON.stringify(connection))
          : client.zadd(PREFIX + "connections", { score: timestamp, member: JSON.stringify(connection) }),
        client.sadd(PREFIX + "unique_addresses", normalizedAddress),
        client.set(PREFIX + normalizedAddress, timestamp.toString()),
        client.incr(PREFIX + "total_connections"),
      ]);

      const uniqueCount = await client.scard(PREFIX + "unique_addresses");

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
      const isNewPayer = (await client.sismember(PREFIX + "paid_addresses", normalizedAddress)) === 0;

      const payment: PaymentRecord = {
        address: normalizedAddress,
        amount: amount.toString(),
        tokenId,
        timestamp,
        transactionHash,
        rarity,
      };

      await Promise.all([
        redisType === "vercel-kv"
          ? client.zadd(PREFIX + "payments", timestamp, JSON.stringify(payment))
          : client.zadd(PREFIX + "payments", { score: timestamp, member: JSON.stringify(payment) }),
        client.sadd(PREFIX + "paid_addresses", normalizedAddress),
        client.incr(PREFIX + normalizedAddress + ":payment_count"),
      ]);

      const currentTotal = (await client.get(PREFIX + normalizedAddress + ":total_amount")) || "0";
      const newTotal = (BigInt(currentTotal) + BigInt(amount)).toString();
      await client.set(PREFIX + normalizedAddress + ":total_amount", newTotal);

      await client.incr(PREFIX + "total_payments");
      const globalTotal = (await client.get(PREFIX + "total_payment_amount")) || "0";
      const newGlobalTotal = (BigInt(globalTotal) + BigInt(amount)).toString();
      await client.set(PREFIX + "total_payment_amount", newGlobalTotal);

      const paidCount = await client.scard(PREFIX + "paid_addresses");

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
      const [paymentCount, totalAmount, hasPaid, connectionTime] = await Promise.all([
        client.get(PREFIX + normalizedAddress + ":payment_count") || 0,
        client.get(PREFIX + normalizedAddress + ":total_amount") || "0",
        client.sismember(PREFIX + "paid_addresses", normalizedAddress),
        client.get(PREFIX + normalizedAddress) || null,
      ]);

      return NextResponse.json({
        address: normalizedAddress,
        paymentCount: Number(paymentCount) || 0,
        totalAmount,
        hasPaid: hasPaid === 1,
        firstConnectionTime: connectionTime ? Number(connectionTime) : null,
      });
    }

    // 查询特定地址的所有付费记录
    if (action === "payments" && address) {
      const normalizedAddress = address.toLowerCase();
      const allPayments =
        redisType === "vercel-kv"
          ? await client.zrange(PREFIX + "payments", 0, -1, { rev: true })
          : await client.zrange(PREFIX + "payments", 0, -1, { rev: true });

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
      client.scard(PREFIX + "unique_addresses"),
      client.get(PREFIX + "total_connections") || 0,
      client.scard(PREFIX + "paid_addresses"),
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

