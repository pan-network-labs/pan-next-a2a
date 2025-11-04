"use client";

import type { NextPage } from "next";
import { useState, useEffect, useMemo } from "react";
import { useScaffoldReadContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import Link from "next/link";
import { useLanguage } from "~~/utils/i18n/LanguageContext";

const AgentStore: NextPage = () => {
  const { t } = useLanguage();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取合约实例
  const { data: agentStoreContract } = useScaffoldContract({
    contractName: "AgentStore",
  });

  // 获取所有上架的 Agents
  const { data: allAgentIds, isLoading: isLoadingIds } = useScaffoldReadContract({
    contractName: "AgentStore",
    functionName: "getAllListedAgents",
  });

  // 使用 useMemo 来稳定 allAgentIds 的引用
  const agentIdsStable = useMemo(() => {
    if (!allAgentIds || !Array.isArray(allAgentIds)) return null;
    return allAgentIds.map(id => id.toString()).join(",");
  }, [allAgentIds]);

  // 更新 loading 状态
  useEffect(() => {
    // 如果还在加载 IDs 或合约未准备好，显示加载中
    if (isLoadingIds || !agentStoreContract) {
      setLoading(true);
      return;
    }

    // 如果 IDs 加载完成，但 useEffect 会处理实际的数据加载
    // 这里不设置 loading 为 false，让 useEffect 来控制
  }, [isLoadingIds, agentStoreContract]);

  useEffect(() => {
    let isMounted = true;

    const loadAgents = async () => {
      // 检查依赖项是否准备好
      if (!agentStoreContract || isLoadingIds) {
        return;
      }

      // allAgentIds 已经加载完成，处理数据
      if (!Array.isArray(allAgentIds)) {
        if (isMounted) {
          setAgents([]);
          setLoading(false);
        }
        return;
      }

      // 如果数组为空，直接设置空列表
      if (allAgentIds.length === 0) {
        if (isMounted) {
          setAgents([]);
          setLoading(false);
        }
        return;
      }

      // 开始加载详细信息
      setLoading(true);
      const agentList = [];
      
      for (const id of allAgentIds) {
        if (!isMounted) break;
        
        try {
          const fullInfo = await agentStoreContract.read.getAgentFullInfo([id]);
          const [listing, identity, averageRating, feedbackCount] = fullInfo;
          
          // 只显示已上架的
          if (listing.listed) {
            agentList.push({
              id: id.toString(),
              name: listing.name,
              description: listing.description,
              link: listing.link,
              method: Number(listing.method),
              requestParams: listing.requestParams,
              price: listing.price?.toString() || "0",
              owner: listing.owner,
              usageCount: listing.usageCount?.toString() || "0",
              averageRating: averageRating ? (Number(averageRating) / 1000).toFixed(1) : "N/A",
              feedbackCount: feedbackCount?.toString() || "0",
            });
          }
        } catch (error) {
          console.error("Error loading agent:", error);
        }
      }
      
      if (isMounted) {
        setAgents(agentList);
        setLoading(false);
      }
    };

    loadAgents();

    return () => {
      isMounted = false;
    };
    // 依赖项：当合约地址或 Agent IDs 稳定值变化时重新加载
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentIdsStable, agentStoreContract?.address, allAgentIds, isLoadingIds]);

  const methods = ["GET", "POST", "PUT", "DELETE"];

  const formatEther = (wei: string) => {
    const value = BigInt(wei);
    return Number(value) / 1e18;
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10 pb-10">
        <div className="px-5 w-full max-w-7xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold animate-text-shimmer">
              {t("agentShop")}
            </h1>
            <Link 
              href="/agent-store/register" 
              className="btn rounded-lg bg-[#FF6B00] hover:bg-[#FF8C00] text-white border-0 transition-all duration-300 transform hover:scale-105 animate-pulse-glow"
            >
              {t("registerNewAgent")}
            </Link>
          </div>

          {/* Agent 列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <span className="loading loading-spinner loading-lg text-[#FF6B00]"></span>
                <p className="text-xl text-white/70 mt-4">{t("loading")}</p>
              </div>
            ) : agents.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-white/70">
                  {t("noAgentsYet")}
                </p>
              </div>
            ) : (
              agents.map((agent) => (
                <div 
                  key={agent.id} 
                  className="card bg-gradient-to-br from-[#1A110A]/90 to-[#261A10]/90 backdrop-blur-xl border border-[#FF6B00]/30 rounded-lg hover:border-[#FF6B00]/50 transition-all duration-300 transform hover:scale-[1.02] animate-border-glow"
                  style={{ animationDelay: `${(parseInt(agent.id) % 3) * 0.3}s` }}
                >
                  <div className="card-body">
                    <h2 className="card-title text-white">{agent.name || `Agent #${agent.id}`}</h2>
                    <p className="text-sm text-white/70 line-clamp-2">
                      {agent.description || t("noDescription")}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="badge badge-sm bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30">
                        {methods[agent.method] || "GET"}
                      </div>
                      <div className="badge badge-sm bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30">
                        ⭐ {agent.averageRating}
                      </div>
                      <div className="badge badge-sm bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30">
                        {formatEther(agent.price).toFixed(4)} ETH
                      </div>
                      <div className="badge badge-sm bg-[#261A10]/50 text-white/70 border border-[#FF6B00]/30">
                        {t("usage")} {agent.usageCount} {t("times")}
                      </div>
                    </div>
                    <div className="card-actions justify-end mt-4">
                      <Link
                        href={`/agent-store/${agent.id}`}
                        className="btn btn-sm rounded-lg bg-[#FF6B00] hover:bg-[#FF8C00] text-white border-0 transition-all duration-300"
                      >
                        {t("viewDetails")}
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentStore;

