import { usePublicClient } from "wagmi";
import { useScaffoldWatchContractEvent } from "~~/hooks/scaffold-eth/useScaffoldWatchContractEvent";
import deployedContracts from "~~/contracts/deployedContracts";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Hook to track payment events from PaymentSBT contract
 */
export function usePaymentTracker() {
  const publicClient = usePublicClient();
  const { targetNetwork } = useTargetNetwork();

  // 监听 SBTMinted 事件
  useScaffoldWatchContractEvent({
    contractName: "PaymentSBT",
    eventName: "SBTMinted",
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const { tokenId, owner, amount, rarity } = log.args;

          if (tokenId && owner && publicClient) {
            try {
              // 使用 as any 因为 deployedContracts 的类型定义不支持动态 number 索引
              // 但在运行时 targetNetwork.id 是有效的键
              const contract = (deployedContracts as any)[targetNetwork.id]?.PaymentSBT;
              if (contract) {
                const paymentInfo = await publicClient.readContract({
                  address: contract.address,
                  abi: contract.abi,
                  functionName: "getPaymentInfo",
                  args: [tokenId],
                }) as any;

                await recordPayment({
                  address: owner as string,
                  amount: paymentInfo?.amount?.toString() || amount?.toString() || "0",
                  tokenId: Number(tokenId),
                  timestamp: Number(paymentInfo?.timestamp || BigInt(Date.now())),
                  transactionHash: log.transactionHash,
                  rarity: rarity === 0 ? "N" : rarity === 1 ? "R" : "S",
                });
              }
            } catch (error) {
              console.error("获取 PaymentInfo 失败:", error);
              await recordPayment({
                address: owner as string,
                amount: amount?.toString() || "0",
                tokenId: Number(tokenId),
                timestamp: Date.now(),
                transactionHash: log.transactionHash,
                rarity: rarity === 0 ? "N" : rarity === 1 ? "R" : "S",
              });
            }
          }
        } catch (error) {
          console.error("处理 SBTMinted 事件失败:", error);
        }
      }
    },
  });

  // 监听 PaymentReceived 事件（备用）
  useScaffoldWatchContractEvent({
    contractName: "PaymentSBT",
    eventName: "PaymentReceived",
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const { tokenId, payer, amount, timestamp } = log.args;

          if (tokenId && tokenId > 0n && payer) {
            await recordPayment({
              address: payer as string,
              amount: amount?.toString() || "0",
              tokenId: Number(tokenId),
              timestamp: Number(timestamp || BigInt(Date.now())),
              transactionHash: log.transactionHash,
            });
          }
        } catch (error) {
          console.error("处理 PaymentReceived 事件失败:", error);
        }
      }
    },
  });
}

async function recordPayment(payment: {
  address: string;
  amount: string;
  tokenId?: number;
  timestamp: number;
  transactionHash?: string;
  rarity?: string;
}) {
  try {
    const response = await fetch("/api/wallet-connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "payment",
        ...payment,
      }),
    });

    if (!response.ok) {
      throw new Error(`记录付费失败: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success) {
      console.log("付费已记录:", {
        address: payment.address,
        amount: payment.amount,
        isNewPayer: data.isNewPayer,
        totalPaidWallets: data.totalPaidWallets,
      });
    }
  } catch (error) {
    console.error("记录付费失败:", error);
  }
}

