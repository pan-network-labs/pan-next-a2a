import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, createClient, fallback, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

// 只使用配置的目标网络，不自动添加 mainnet（因为用户只使用 BSC Testnet）
export const enabledChains = targetNetworks;

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: wagmiConnectors(),
  ssr: true,
  client({ chain }) {
    let rpcFallbacks: ReturnType<typeof http>[] = [];

    // BSC Testnet (chainId: 97) 的特殊处理：默认优先使用 Alchemy
    if (chain.id === 97) {
      const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];
      const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
      
      // 构建多个 fallback RPC，按优先级排序
      // 公共 RPC 作为可靠的 fallback
      const publicRpcs = [
        http("https://data-seed-prebsc-1-s1.binance.org:8545"),
        http("https://data-seed-prebsc-2-s1.binance.org:8545"),
        http("https://bsc-testnet-rpc.publicnode.com"),
      ];
      
      // 始终优先使用 Alchemy（如果可用）
      if (alchemyHttpUrl) {
        if (rpcOverrideUrl && rpcOverrideUrl.includes("alchemy.com")) {
          // 如果 rpcOverrideUrl 已经是 Alchemy，直接使用它
          rpcFallbacks = [
            http(rpcOverrideUrl),
            // 添加公共 RPC 作为 fallback
            ...publicRpcs,
          ];
        } else {
          // 优先使用 Alchemy，即使有 rpcOverrideUrl（除非明确指定了其他 RPC）
          rpcFallbacks = [
            http(alchemyHttpUrl),
            // 如果配置了非 Alchemy 的 RPC，也添加到 fallback
            ...(rpcOverrideUrl && !rpcOverrideUrl.includes("alchemy.com") 
              ? [http(rpcOverrideUrl)] 
              : []),
            // 添加公共 RPC 作为 fallback
            ...publicRpcs,
          ];
        }
      } else if (rpcOverrideUrl) {
        // 如果 Alchemy 不可用，使用配置的 RPC
        rpcFallbacks = [
          http(rpcOverrideUrl),
          // 添加公共 RPC 作为 fallback
          ...publicRpcs,
        ];
      } else {
        // 如果都没有配置，使用公共 RPC
        rpcFallbacks = publicRpcs;
      }
    } else {
      // 其他链的处理逻辑
      const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];
      if (rpcOverrideUrl) {
        rpcFallbacks = [http(rpcOverrideUrl)];
      } else {
        const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
        if (alchemyHttpUrl) {
          rpcFallbacks = [http(alchemyHttpUrl)];
        } else {
          const defaultRpcUrl = chain.rpcUrls.default.http[0];
          if (defaultRpcUrl) {
            rpcFallbacks = [http(defaultRpcUrl)];
          } else {
            rpcFallbacks = [http()];
          }
        }
      }
    }

    return createClient({
      chain,
      transport: fallback(rpcFallbacks),
      ...(chain.id !== (hardhat as Chain).id
        ? {
            pollingInterval: scaffoldConfig.pollingInterval,
          }
        : {}),
    });
  },
});
