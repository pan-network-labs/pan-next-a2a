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

    const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];
    if (rpcOverrideUrl) {
      // 使用配置的 RPC URL
      rpcFallbacks = [http(rpcOverrideUrl)];
    } else {
      // 尝试使用 Alchemy RPC
      const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
      if (alchemyHttpUrl) {
        rpcFallbacks = [http(alchemyHttpUrl)];
      } else {
        // 如果没有配置，使用链的默认 RPC（从 chain.rpcUrls 获取）
        // 但避免使用不支持 CORS 的公共 RPC
        const defaultRpcUrl = chain.rpcUrls.default.http[0];
        if (defaultRpcUrl) {
          rpcFallbacks = [http(defaultRpcUrl)];
        } else {
          // 最后的 fallback：使用支持 CORS 的公共 RPC
          // 对于 BSC Testnet，使用 Binance 官方 RPC
          if (chain.id === 97) {
            rpcFallbacks = [http("https://data-seed-prebsc-1-s1.binance.org:8545")];
          } else {
            // 其他链：使用链的默认 RPC
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
