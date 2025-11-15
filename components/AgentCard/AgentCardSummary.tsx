import { AgentCard } from "~~/hooks/useAgentCard";
import { formatEther } from "viem";

interface AgentCardSummaryProps {
  agentCard: AgentCard | null;
  loading?: boolean;
  className?: string;
}

/**
 * Agent Card 摘要组件（用于列表页）
 * 显示 Agent 的核心信息：名称、描述、主要能力、价格
 */
export function AgentCardSummary({ agentCard, loading, className = "" }: AgentCardSummaryProps) {
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2">
          <span className="loading loading-spinner loading-sm text-[#FF6B00]"></span>
          <span className="text-sm text-white/50">Loading Agent Card...</span>
        </div>
      </div>
    );
  }

  if (!agentCard) {
    return (
      <div className={`${className}`}>
        <div className="text-sm text-white/50 italic">
          Agent Card data not available
        </div>
      </div>
    );
  }

  // 调试：检查 Agent Card 数据
  console.log("AgentCardSummary - agentCard:", agentCard);
  console.log("AgentCardSummary - description:", agentCard.description);
  console.log("AgentCardSummary - description type:", typeof agentCard.description);
  console.log("AgentCardSummary - description length:", agentCard.description?.length);
  console.log("AgentCardSummary - description truthy:", !!agentCard.description);

  // 获取所有能力
  const capabilities = agentCard.capabilities || [];
  const capabilityCount = capabilities.length;
  
  // 获取第一个能力（主要能力）
  const primaryCapability = capabilities[0];
  
  // 计算价格范围
  const prices = capabilities
    .map(cap => cap.pricing?.price)
    .filter((p): p is string | number => p !== undefined && p !== null);
  
  const formatPrice = (price: string | number | undefined): string => {
    if (!price) return "0";
    
    try {
      if (typeof price === "string") {
        const priceBigInt = BigInt(price);
        const formatted = formatEther(priceBigInt);
        return parseFloat(formatted).toFixed(6).replace(/\.?0+$/, "");
      }
      return typeof price === "number" ? price.toFixed(6).replace(/\.?0+$/, "") : "0";
    } catch (error) {
      return typeof price === "string" ? price : String(price);
    }
  };

  // 格式化价格用于显示
  const formatPriceForDisplay = (price: string | number | undefined): number => {
    if (!price) return 0;
    try {
      if (typeof price === "string") {
        const priceBigInt = BigInt(price);
        return parseFloat(formatEther(priceBigInt));
      }
      return typeof price === "number" ? price : 0;
    } catch {
      return 0;
    }
  };

  // 计算价格范围
  const priceValues = prices.map(p => formatPriceForDisplay(p)).filter(p => p > 0);
  const minPrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;
  const maxPrice = priceValues.length > 0 ? Math.max(...priceValues) : 0;
  const hasPriceRange = minPrice > 0 && maxPrice > 0 && Math.abs(maxPrice - minPrice) > 0.000001;
  
  // 获取主要能力的价格和货币
  const primaryPrice = primaryCapability?.pricing?.price;
  const currency = primaryCapability?.pricing?.currency || agentCard.payment?.currency;
  const formattedPrimaryPrice = formatPrice(primaryPrice);
  
  // 显示的能力数量（最多3个）
  const maxVisibleCapabilities = 3;
  const visibleCapabilities = capabilities.slice(0, maxVisibleCapabilities);
  const remainingCount = capabilityCount - maxVisibleCapabilities;

  return (
    <div className={`${className} space-y-5`}>
      {/* Agent 名称和版本 */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-white tracking-tight mb-1.5 leading-tight">
              {agentCard.name}
            </h3>
            {agentCard.version && (
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/30 rounded-full backdrop-blur-sm">
                v{agentCard.version}
              </span>
            )}
          </div>
        </div>

        {/* 描述（截断显示） */}
        {agentCard.description && agentCard.description.trim() ? (
          <p className="text-sm text-white/75 line-clamp-2 leading-relaxed">
            {agentCard.description}
          </p>
        ) : (
          <p className="text-sm text-white/50 italic line-clamp-2 leading-relaxed">
            No description available
          </p>
        )}
      </div>

      {/* 能力信息和价格 */}
      {capabilityCount > 0 && (
        <div className="space-y-3 pt-2">
          {/* 能力数量标签 */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-[#FF6B00]/10 text-[#FF6B00]/80 border border-[#FF6B00]/30 rounded-md">
              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {capabilityCount} {capabilityCount === 1 ? "Capability" : "Capabilities"}
            </div>
          </div>

          {/* 能力标签列表 */}
          <div className="flex flex-wrap items-center gap-2">
            {visibleCapabilities.map((capability, index) => (
              <div
                key={index}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-gradient-to-br from-[#FF6B00]/20 via-[#FF6B00]/15 to-[#FF8C00]/15 text-[#FF6B00] border border-[#FF6B00]/40 rounded-lg backdrop-blur-sm shadow-sm shadow-[#FF6B00]/10"
              >
                {index === 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] mr-2 animate-pulse"></span>
                )}
                {capability.name}
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-[#FF6B00]/10 text-[#FF6B00]/70 border border-[#FF6B00]/30 rounded-lg">
                +{remainingCount} more
              </div>
            )}
          </div>

          {/* 价格信息 */}
          <div className="flex flex-wrap items-center gap-2.5">
            {hasPriceRange ? (
              <div className="inline-flex items-center px-3.5 py-2 text-xs font-semibold bg-gradient-to-br from-emerald-500/20 via-emerald-500/15 to-teal-500/15 text-emerald-300 border border-emerald-500/40 rounded-lg backdrop-blur-sm shadow-sm shadow-emerald-500/10">
                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                </svg>
                {minPrice.toFixed(6).replace(/\.?0+$/, "")} - {maxPrice.toFixed(6).replace(/\.?0+$/, "")} {currency || "ETH"}
              </div>
            ) : primaryPrice ? (
              <div className="inline-flex items-center px-3.5 py-2 text-xs font-semibold bg-gradient-to-br from-emerald-500/20 via-emerald-500/15 to-teal-500/15 text-emerald-300 border border-emerald-500/40 rounded-lg backdrop-blur-sm shadow-sm shadow-emerald-500/10">
                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                </svg>
                {formattedPrimaryPrice} {currency || "ETH"}
              </div>
            ) : null}
          </div>
          
          {/* 作者信息 */}
          {agentCard.metadata?.author && (
            <div className="flex items-center gap-2 text-xs text-white/50 pt-1">
              <svg className="w-3.5 h-3.5 text-[#FF6B00]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">by {agentCard.metadata.author}</span>
            </div>
          )}
        </div>
      )}

      {/* 如果没有能力但有作者，单独显示作者 */}
      {capabilityCount === 0 && agentCard.metadata?.author && (
        <div className="flex items-center gap-2 text-xs text-white/50 pt-2">
          <svg className="w-3.5 h-3.5 text-[#FF6B00]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="font-medium">by {agentCard.metadata.author}</span>
        </div>
      )}
    </div>
  );
}

