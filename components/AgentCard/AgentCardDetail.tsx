import { AgentCard, Capability } from "~~/hooks/useAgentCard";
import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";

interface AgentCardDetailProps {
  agentCard: AgentCard | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * Agent Card 详情组件（用于详情页）
 * 显示完整的 Agent Card 信息
 */
export function AgentCardDetail({ agentCard, loading, error, className = "" }: AgentCardDetailProps) {
  if (loading) {
    return (
      <div className={`${className} card bg-gradient-to-br from-[#1A110A]/90 to-[#261A10]/90 border border-[#FF6B00]/30 rounded-lg`}>
        <div className="card-body">
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg text-[#FF6B00]"></span>
            <span className="ml-4 text-white/70">Loading Agent Card...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} card bg-gradient-to-br from-[#1A110A]/90 to-[#261A10]/90 border border-red-500/30 rounded-lg`}>
        <div className="card-body">
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Failed to load Agent Card: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!agentCard) {
    return null;
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* 基本信息卡片 */}
      <div className="card bg-gradient-to-br from-[#1A110A]/90 to-[#261A10]/90 border border-[#FF6B00]/30 rounded-lg">
        <div className="card-body">
          <h2 className="card-title text-2xl text-white mb-4">
            {agentCard.name}
            {agentCard.version && (
              <span className="badge badge-sm bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 ml-2">
                v{agentCard.version}
              </span>
            )}
          </h2>
          <p className="text-white/80 mb-4">{agentCard.description}</p>

          {/* 元数据 */}
          {agentCard.metadata && (
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#FF6B00]/20">
              {agentCard.metadata.author && (
                <div>
                  <span className="text-xs text-white/50">Author:</span>
                  <span className="ml-2 text-white/70">{agentCard.metadata.author}</span>
                </div>
              )}
              {agentCard.metadata.license && (
                <div>
                  <span className="text-xs text-white/50">License:</span>
                  <span className="ml-2 text-white/70">{agentCard.metadata.license}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 能力列表 */}
      {agentCard.capabilities && agentCard.capabilities.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Capabilities</h3>
          {agentCard.capabilities.map((capability, index) => (
            <CapabilityCard key={index} capability={capability} />
          ))}
        </div>
      )}

      {/* 端点信息 */}
      {/* Endpoints section temporarily hidden - may be enabled later */}
      {false && agentCard?.endpoints && (
        <div className="card bg-gradient-to-br from-[#1A110A]/90 to-[#261A10]/90 border border-[#FF6B00]/30 rounded-lg">
          <div className="card-body">
            <h3 className="card-title text-lg text-white mb-4">Endpoints</h3>
            <div className="space-y-2">
              {agentCard?.endpoints?.task && (
                <div>
                  <span className="text-sm text-white/50">Task:</span>
                  <code className="ml-2 text-sm text-[#FF6B00] font-mono break-all">
                    {agentCard?.endpoints?.task}
                  </code>
                </div>
              )}
              {agentCard?.endpoints?.agentCard && (
                <div>
                  <span className="text-sm text-white/50">Agent Card:</span>
                  <code className="ml-2 text-sm text-[#FF6B00] font-mono break-all">
                    {agentCard?.endpoints?.agentCard}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 支付信息 */}
      {agentCard.payment && (
        <div className="card bg-gradient-to-br from-[#1A110A]/90 to-[#261A10]/90 border border-[#FF6B00]/30 rounded-lg">
          <div className="card-body">
            <h3 className="card-title text-lg text-white mb-4">Payment Configuration</h3>
            <div className="space-y-2">
              {agentCard.payment.scheme && (
                <div>
                  <span className="text-sm text-white/50">Scheme:</span>
                  <span className="ml-2 text-white/70">{agentCard.payment.scheme}</span>
                </div>
              )}
              {agentCard.payment.currency && (
                <div>
                  <span className="text-sm text-white/50">Currency:</span>
                  <span className="ml-2 text-white/70">{agentCard.payment.currency}</span>
                </div>
              )}
              {agentCard.payment.network && (
                <div>
                  <span className="text-sm text-white/50">Network:</span>
                  <span className="ml-2 text-white/70">{agentCard.payment.network}</span>
                </div>
              )}
              {agentCard.payment.address && (
                <div>
                  <span className="text-sm text-white/50">Address:</span>
                  <Address address={agentCard.payment.address as `0x${string}`} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 格式化价格（将 wei 转换为可读格式）
 */
function formatPrice(price: string | number | undefined, currency?: string): string {
  if (!price) return "0";
  
  try {
    // 如果是字符串，尝试转换为 BigInt 然后格式化
    if (typeof price === "string") {
      // 检查是否是有效的数字字符串（可能是 wei）
      const priceBigInt = BigInt(price);
      const formatted = formatEther(priceBigInt);
      // 保留 6 位小数，去掉末尾的 0
      return parseFloat(formatted).toFixed(6).replace(/\.?0+$/, "");
    }
    // 如果是数字，假设已经是 ETH 单位
    return typeof price === "number" ? price.toFixed(6).replace(/\.?0+$/, "") : "0";
  } catch (error) {
    // 如果转换失败，返回原始值
    return typeof price === "string" ? price : String(price);
  }
}

/**
 * 单个能力卡片组件
 */
function CapabilityCard({ capability }: { capability: Capability }) {
  const formattedPrice = formatPrice(
    capability.pricing?.price,
    capability.pricing?.currency
  );
  
  return (
    <div className="card bg-gradient-to-br from-[#1A110A]/90 to-[#261A10]/90 border border-[#FF6B00]/30 rounded-lg">
      <div className="card-body">
        <div className="flex items-start justify-between mb-4">
          <h4 className="text-lg font-semibold text-white">{capability.name}</h4>
          {capability.pricing && (
            <div className="badge badge-lg bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30">
              {formattedPrice} {capability.pricing.currency || "ETH"}
            </div>
          )}
        </div>

        <p className="text-white/80 mb-4">{capability.description}</p>

        {/* 定价详情 */}
        {capability.pricing && (
          <div className="mb-4 p-3 bg-[#261A10]/50 rounded-lg border border-[#FF6B00]/20">
            <div className="text-sm font-semibold text-white/70 mb-2">Pricing</div>
            <div className="space-y-1 text-sm">
              {capability.pricing.price && (
                <div className="flex justify-between">
                  <span className="text-white/50">Price:</span>
                  <span className="text-white">
                    {formattedPrice} {capability.pricing.currency || "ETH"}
                  </span>
                </div>
              )}
              {capability.pricing.network && (
                <div className="flex justify-between">
                  <span className="text-white/50">Network:</span>
                  <span className="text-white">{capability.pricing.network}</span>
                </div>
              )}
              {capability.pricing.address && (
                <div className="flex justify-between">
                  <span className="text-white/50">Address:</span>
                  <Address address={capability.pricing.address as `0x${string}`} />
                </div>
              )}
              {capability.pricing.note && (
                <div className="mt-2 pt-2 border-t border-[#FF6B00]/20">
                  <span className="text-xs text-white/50 italic">{capability.pricing.note}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 输入模式 */}
        {capability.inputSchema && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-white/70 mb-2">Input Schema</div>
            <div className="p-3 bg-[#261A10]/50 rounded-lg border border-[#FF6B00]/20">
              <pre className="text-xs text-white/80 overflow-x-auto">
                {JSON.stringify(capability.inputSchema, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* 输出模式 */}
        {capability.outputSchema && (
          <div>
            <div className="text-sm font-semibold text-white/70 mb-2">Output Schema</div>
            <div className="p-3 bg-[#261A10]/50 rounded-lg border border-[#FF6B00]/20">
              <pre className="text-xs text-white/80 overflow-x-auto">
                {JSON.stringify(capability.outputSchema, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

