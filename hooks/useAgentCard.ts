import { useState, useEffect } from "react";

/**
 * Agent Card 数据结构（符合 A2A 标准）
 */
export interface AgentCard {
  "@context"?: string;
  "@type"?: string;
  name: string;
  description: string;
  version?: string;
  capabilities?: Capability[];
  endpoints?: {
    task?: string;
    agentCard?: string;
  };
  calling?: {
    method?: string;
    headers?: Record<string, string>;
    format?: string;
    note?: string;
  };
  payment?: {
    scheme?: string;
    currency?: string;
    network?: string;
    address?: string;
  };
  metadata?: {
    author?: string;
    license?: string;
    [key: string]: any;
  };
}

export interface Capability {
  name: string;
  description: string;
  pricing?: {
    price?: string | number;
    currency?: string;
    network?: string;
    address?: string;
    note?: string;
  };
  inputSchema?: {
    type?: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  outputSchema?: {
    type?: string;
    properties?: Record<string, any>;
  };
}

interface UseAgentCardResult {
  agentCard: AgentCard | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook 用于获取和缓存 Agent Card 数据
 * @param agentCardLink Agent Card 的 URL
 * @param enabled 是否启用（用于条件加载）
 */
export function useAgentCard(
  agentCardLink: string | undefined,
  enabled: boolean = true
): UseAgentCardResult {
  const [agentCard, setAgentCard] = useState<AgentCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentCard = async () => {
    if (!agentCardLink || !enabled) {
      setAgentCard(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 优先直接访问，如果遇到 CORS 错误再使用代理
      let response: Response;
      try {
        // 尝试直接访问
        response = await fetch(agentCardLink, {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        });
      } catch (directError: any) {
        // 如果是 CORS 错误，使用代理
        const errorMessage = directError.message || directError.toString();
        if (
          errorMessage.includes("CORS") ||
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError") ||
          errorMessage.includes("Access-Control")
        ) {
          const proxyUrl = `/api/proxy-agent?url=${encodeURIComponent(agentCardLink)}`;
          response = await fetch(proxyUrl, {
            method: "GET",
            headers: {
              "Accept": "application/json",
            },
          });
        } else {
          throw directError;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `Failed to fetch Agent Card: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      setAgentCard(data as AgentCard);
    } catch (err: any) {
      setError(err.message || "Failed to load Agent Card");
      setAgentCard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentCardLink, enabled]);

  return {
    agentCard,
    loading,
    error,
    refetch: fetchAgentCard,
  };
}

