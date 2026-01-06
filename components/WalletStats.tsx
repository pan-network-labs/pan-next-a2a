"use client";

import { useEffect, useState } from "react";

interface WalletStats {
  totalUniqueWallets: number;
  totalConnections: number;
  totalPaidWallets: number;
  totalPayments: number;
  totalPaymentAmount: string;
  conversionRate: string;
}

export function WalletStats() {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsResponse = await fetch("/api/wallet-connections");
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (error) {
        console.error("获取统计失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center">加载中...</div>;
  if (!stats) return null;

  const formatAmount = (wei: string) => {
    try {
      const eth = BigInt(wei) / BigInt(10 ** 18);
      const remainder = BigInt(wei) % BigInt(10 ** 18);
      if (remainder === 0n) {
        return `${eth} ETH`;
      }
      return `${Number(wei) / 10 ** 18} ETH`;
    } catch {
      return `${wei} wei`;
    }
  };

  return (
    <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
      <div className="stat">
        <div className="stat-title">连接钱包数</div>
        <div className="stat-value text-primary">{stats.totalUniqueWallets}</div>
      </div>
      <div className="stat">
        <div className="stat-title">付费钱包数</div>
        <div className="stat-value text-secondary">{stats.totalPaidWallets}</div>
      </div>
      <div className="stat">
        <div className="stat-title">转化率</div>
        <div className="stat-value text-accent">{stats.conversionRate}</div>
      </div>
      <div className="stat">
        <div className="stat-title">总付费金额</div>
        <div className="stat-value text-info">{formatAmount(stats.totalPaymentAmount)}</div>
      </div>
      <div className="stat">
        <div className="stat-title">总付费次数</div>
        <div className="stat-value">{stats.totalPayments}</div>
      </div>
    </div>
  );
}

