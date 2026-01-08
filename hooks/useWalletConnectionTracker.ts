import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";

/**
 * Hook to track wallet connections and send them to the API
 */
export function useWalletConnectionTracker() {
  const { address, isConnected, chain, connector } = useAccount();
  const trackedRef = useRef<Set<string>>(new Set());
  const lastAddressRef = useRef<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      const normalizedAddress = address.toLowerCase();

      if (lastAddressRef.current === normalizedAddress) {
        return;
      }

      if (trackedRef.current.has(normalizedAddress)) {
        lastAddressRef.current = normalizedAddress;
        return;
      }

      trackedRef.current.add(normalizedAddress);
      lastAddressRef.current = normalizedAddress;

      fetch("/api/wallet-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          address: normalizedAddress,
          chainId: chain?.id,
          connectorId: connector?.id,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log("✅ 钱包连接已记录:", {
              isNewAddress: data.isNewAddress,
              totalUniqueWallets: data.totalUniqueWallets,
            });
          } else {
            console.warn("⚠️ 钱包连接记录失败:", data.message || "未知错误");
            // 如果 Redis 未配置，不删除 trackedRef，以便重试
            if (data.message && data.message.includes("Redis")) {
              console.warn("💡 提示: 请配置 Redis 环境变量 (KV_REST_API_URL/KV_REST_API_TOKEN 或 UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN)");
            } else {
              trackedRef.current.delete(normalizedAddress);
            }
          }
        })
        .catch((error) => {
          console.error("❌ 记录钱包连接失败:", error);
          trackedRef.current.delete(normalizedAddress);
        });
    } else if (!isConnected) {
      lastAddressRef.current = null;
    }
  }, [isConnected, address, chain?.id, connector?.id]);

  useEffect(() => {
    if (address) {
      const normalizedAddress = address.toLowerCase();
      if (lastAddressRef.current !== normalizedAddress) {
        trackedRef.current.clear();
        trackedRef.current.add(normalizedAddress);
      }
    }
  }, [address]);
}

