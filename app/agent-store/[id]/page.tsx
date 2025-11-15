"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { Address } from "@scaffold-ui/components";
import Link from "next/link";
import { formatEther, parseEther, decodeEventLog } from "viem";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useLanguage } from "~~/utils/i18n/LanguageContext";
import { useAgentCard } from "~~/hooks/useAgentCard";
import { AgentCardDetail } from "~~/components/AgentCard/AgentCardDetail";

// SBT卡片组件
const SBTCard = ({ 
  tokenId, 
  paymentSBTContract, 
  targetNetwork 
}: { 
  tokenId: bigint; 
  paymentSBTContract: any; 
  targetNetwork: any;
}) => {
  const { t } = useLanguage();
  const [sbtInfo, setSbtInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!paymentSBTContract) {
        setLoading(false);
        return;
      }
      try {
        const info = await paymentSBTContract.read.getPaymentInfo([tokenId]) as any;
        setSbtInfo({
          amount: info.amount,
          payer: info.payer,
          recipient: info.recipient,
          timestamp: info.timestamp,
          description: info.description,
        });
      } catch (e) {
        console.error("获取SBT信息失败:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [tokenId, paymentSBTContract]);

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-[#1A110A]/50 border border-[#FF6B00]/20">
        <span className="loading loading-spinner loading-sm"></span>
        <span className="ml-2 text-white/70">{t("loading")}</span>
      </div>
    );
  }

  if (!sbtInfo) {
    return (
      <div className="p-4 rounded-lg bg-[#1A110A]/50 border border-red-500/20">
        <p className="text-red-400">{t("sbtLoadError")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-[#1A110A]/50 border border-[#FF6B00]/20 hover:border-[#FF6B00]/40 transition-all">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-xs text-white/50">{t("tokenId")}</span>
          <span className="ml-2 text-white font-mono">{tokenId.toString()}</span>
        </div>
        <div className="badge badge-sm bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30">
          SBT
        </div>
      </div>
      <div className="space-y-2 text-sm mt-3">
        <div className="flex justify-between">
          <span className="text-white/70">{t("paymentAmount")}</span>
          <span className="text-white">{formatEther(sbtInfo.amount)} ETH</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">{t("recipientAddress")}</span>
          <Address address={sbtInfo.recipient} />
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">{t("paymentTime")}</span>
          <span className="text-white/80 text-xs">
            {new Date(Number(sbtInfo.timestamp) * 1000).toLocaleString()}
          </span>
        </div>
        {sbtInfo.description && (
          <div className="mt-2 pt-2 border-t border-[#FF6B00]/20">
            <span className="text-white/70">{t("description")}</span>
            <p className="text-white/80 text-xs mt-1">{sbtInfo.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AgentDetail = () => {
  const params = useParams();
  const agentId = params?.id ? BigInt(params.id as string) : BigInt(0);
  const { t } = useLanguage();

  // 评价功能已移除
  // const [rating, setRating] = useState(5);
  // const [comment, setComment] = useState("");
  // const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [requestResult, setRequestResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
  } | null>(null);
  const [mintedSBT, setMintedSBT] = useState<{
    tokenId: bigint;
    txHash: string;
    recipient: string;
    amount: string;
  } | null>(null);
  const [showMySBTs, setShowMySBTs] = useState(false);
  const [isUnlisting, setIsUnlisting] = useState(false);
  const { address } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  // 获取 Agent 完整信息
  const { data: agentInfo, refetch } = useScaffoldReadContract({
    contractName: "AgentStore",
    functionName: "getAgentFullInfo",
    args: [agentId],
  });

  // 评价功能已移除
  // const { data: feedbacks } = useScaffoldReadContract({
  //   contractName: "ReputationRegistry",
  //   functionName: "getFeedbacks",
  //   args: agentId > 0n ? [agentId] : ([0n] as readonly [bigint]),
  //   query: {
  //     enabled: agentId > 0n,
  //   },
  // });

  // 获取用户拥有的所有SBT
  const mySBTsQuery = useScaffoldReadContract({
    contractName: "PaymentSBT" as any,
    functionName: "getTokensByOwner",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && showMySBTs,
    },
  } as any);
  const mySBTs = mySBTsQuery.data as bigint[] | undefined;
  const refetchMySBTs = mySBTsQuery.refetch;

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "AgentStore",
  });

  // 获取PaymentSBT合约信息（如果已部署）
  const { data: paymentSBTContractData } = useDeployedContractInfo({
    contractName: "PaymentSBT" as any,
  });
  
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { data: paymentSBTContract } = useScaffoldContract({
    contractName: "PaymentSBT" as any,
    walletClient: walletClient || undefined,
  });

  const methods = ["GET", "POST", "PUT", "DELETE"];

  // 编码交易哈希到base64（用于请求头）
  const encodeTx = (txHash: string): string => {
    return Buffer.from(txHash).toString("base64");
  };

  const handleCallAgent = async () => {
    if (!listing) {
      console.error("Listing is null");
      return;
    }
    
    setIsCalling(true);
    setRequestResult(null);
    
    try {
      // 从 Agent Card 获取请求方式和 URL（所有信息从 Agent Card 获取）
      if (!agentCard) {
        throw new Error("Agent Card is required to call this Agent");
      }
      
      const method = agentCard.calling?.method?.toUpperCase() || "GET";
      const url = agentCard.endpoints?.task;
      
      if (!url) {
        throw new Error("Agent Card must contain 'endpoints.task'");
      }
      
      console.log("调用Agent, method:", method, "url:", url);
      console.log("Agent Card calling config:", agentCard.calling);
      
      // 请求参数从用户输入获取（如果有输入框的话）
      let requestParams = {};
      // 注意：如果需要从 Agent Card 的 inputSchema 生成默认参数，可以在这里处理
      
      // 构建请求配置
      let targetUrl = url;
      const requestConfig: RequestInit = {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
      };
      
      // 如果 Agent Card 中有 calling.headers，合并到请求头中
      if (agentCard?.calling?.headers) {
        Object.entries(agentCard.calling.headers).forEach(([key, value]) => {
          // 如果值是占位符（如 "base64_encoded_transaction_hash"），暂时跳过，后续会在付款后添加
          if (value && !value.includes("base64_encoded_transaction_hash") && !value.includes("必需")) {
            requestConfig.headers = {
              ...requestConfig.headers,
              [key]: value,
            };
          }
        });
      }
      
      // 根据请求方式处理参数
      if (method === "POST" || method === "PUT") {
        // POST和PUT请求，将参数放入body
        // 如果 Agent Card 的 note 说请求体可以为空，且没有参数，则使用空对象
        if (agentCard?.calling?.note?.includes("请求体可以为空") && Object.keys(requestParams).length === 0) {
          requestConfig.body = JSON.stringify({});
        } else {
          requestConfig.body = JSON.stringify(requestParams);
        }
        console.log("请求body:", requestConfig.body);
      } else if (method === "GET" || method === "DELETE") {
        // GET和DELETE请求，将参数添加到URL
        if (Object.keys(requestParams).length > 0) {
          try {
            const urlObj = new URL(url);
            Object.keys(requestParams).forEach((key) => {
              urlObj.searchParams.append(key, String(requestParams[key as keyof typeof requestParams]));
            });
            targetUrl = urlObj.toString();
            console.log("带参数的URL:", targetUrl);
          } catch (e) {
            console.error("URL解析失败:", e);
            setRequestResult({
              success: false,
              error: t("agentLinkFormatError"),
            });
            setIsCalling(false);
            return;
          }
        }
      }
      
      // 发送HTTP请求（优先直接访问，遇到 CORS 错误时使用代理）
      console.log("发送请求到:", targetUrl);
      let response: Response;
      try {
        // 优先尝试直接访问
        response = await fetch(targetUrl, requestConfig);
        console.log("HTTP响应状态:", response.status, response.statusText);
      } catch (directError: any) {
        // 如果是 CORS 错误，使用代理
        const errorMessage = directError.message || directError.toString();
        if (
          errorMessage.includes("CORS") ||
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError") ||
          errorMessage.includes("Access-Control")
        ) {
          console.log("Direct access failed due to CORS, using proxy...");
          try {
            // 使用 Next.js API 代理路由
            response = await fetch("/api/proxy-agent", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: targetUrl,
                method: method,
                headers: requestConfig.headers,
                body: requestConfig.body,
              }),
            });
            console.log("HTTP响应状态 (via proxy):", response.status, response.statusText);
          } catch (proxyError: any) {
            // 代理也失败了
            const networkErrorMsg = (t("networkConnectionError" as any) as string) || "Network connection failed. Please check the Agent URL and your network connection.";
            throw new Error(networkErrorMsg);
          }
        } else {
          // 其他错误直接抛出
          throw directError;
        }
      }
      
      // 处理402 Payment Required错误
      if (response.status === 402) {
        console.log("收到402错误，需要付款");
        
        // 检查钱包连接
        if (!address) {
          throw new Error(t("connectWalletForPayment"));
        }
        
        // 解析付款详情（代理返回的 JSON）
        let paymentDetails;
        try {
          paymentDetails = await response.json();
        } catch (e) {
          throw new Error(t("cannotParse402Response"));
        }
        
        console.log("付款详情:", paymentDetails);
        
        // 安全检查：验证付款详情格式（现在只需要验证价格，address不再需要）
        if (!paymentDetails.price) {
          throw new Error(t("paymentDetailsFormatError"));
        }
        
        // 安全检查：验证价格是有效数字
        const priceValue = typeof paymentDetails.price === 'string' 
          ? parseFloat(paymentDetails.price) 
          : Number(paymentDetails.price);
        
        if (isNaN(priceValue) || priceValue <= 0) {
          throw new Error(`${t("priceFormatError")} ${paymentDetails.price}`);
        }
        
        // 安全检查：防止价格过大（防止溢出，例如超过 1000 ETH）
        if (priceValue > 1000) {
          throw new Error(`Price too large: ${priceValue} ETH. Maximum allowed: 1000 ETH`);
        }
        
        // 处理价格转换（支持字符串格式）
        let priceInWei: bigint;
        try {
          const priceStr = paymentDetails.price.toString();
          priceInWei = parseEther(priceStr);
          
          // 安全检查：确保转换后的值大于 0
          if (priceInWei <= 0n) {
            throw new Error(`${t("priceFormatError")} ${paymentDetails.price}`);
          }
          
          console.log("价格转换:", priceStr, "=>", priceInWei.toString(), "wei");
        } catch (e) {
          throw new Error(`${t("priceFormatError")} ${paymentDetails.price}`);
        }
        
        // 检查网络是否匹配（如果有指定）
        if (paymentDetails.network) {
          console.log("Agent要求的网络:", paymentDetails.network);
          // 这里可以添加网络切换逻辑
        }
        
        // 调用PaymentSBT合约付款（mint SBT，资金存储在合约中）
        console.log("开始调用PaymentSBT合约的makePayment进行付款...");
        console.log("付款参数:", {
          amount: priceInWei.toString(),
          amountInEth: formatEther(priceInWei),
          description: `Payment for Agent: ${agentCard?.name || `Agent #${listing.agentId}`}`,
        });
        
        if (!paymentSBTContract) {
          throw new Error(t("paymentSBTContractNotDeployed"));
        }
        
        if (!paymentSBTContractData) {
          throw new Error(t("paymentSBTContractInfoNotFound"));
        }
        
        if (!walletClient) {
          throw new Error(t("walletClientNotConnected"));
        }
        
        let txHash: string;
        try {
          console.log("发送makePayment交易...");
          
          // 安全检查：验证 description 长度（合约限制 500 字符）
          const description = `Payment for Agent: ${agentCard?.name || `Agent #${listing.agentId}`}`;
          if (description.length > 500) {
            throw new Error("Description too long (maximum 500 characters)");
          }
          
          // 获取推荐码（从 URL 参数或 localStorage，如果没有则为空字符串）
          let referrerCode: string = "";
          
          // 尝试从 URL 参数获取 referrer
          if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const referrerParam = urlParams.get("referrer");
            if (referrerParam && referrerParam.trim().length > 0 && referrerParam.length <= 100) {
              referrerCode = referrerParam.trim();
            } else {
              // 尝试从 localStorage 获取
              const storedReferrer = localStorage.getItem("referrer");
              if (storedReferrer && storedReferrer.trim().length > 0 && storedReferrer.length <= 100) {
                referrerCode = storedReferrer.trim();
              }
            }
          }
          
          // 调用makePayment函数：会自动mint SBT，资金存储在合约中（合约作为收款方）
          // recipient 参数：SBT将发放给调用Agent的用户地址
          // referrer 参数：推荐码（可选，可为空字符串）
          const hash = await paymentSBTContract.write.makePayment(
            [address as `0x${string}`, description, referrerCode],
            {
              value: priceInWei,
            }
          );
          
          if (!hash) {
            throw new Error(t("transactionFailedNoHash"));
          }
          
          txHash = hash;
          console.log("✅ 付款交易已发送，交易哈希:", txHash);
          console.log("等待交易确认...");
          
          // 等待交易确认
          if (!publicClient) {
            throw new Error(t("publicClientNotConnected"));
          }
          
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash as `0x${string}`,
            timeout: 60_000, // 60秒超时
          });
          
          console.log("✅ 交易已确认，区块号:", receipt.blockNumber);
          
          // 解析SBTMinted事件获取tokenId
          let tokenId: bigint = 0n;
          if (paymentSBTContractData?.abi) {
            try {
              for (const log of receipt.logs) {
                try {
                  const decoded = decodeEventLog({
                    abi: paymentSBTContractData.abi as any,
                    data: log.data,
                    topics: log.topics,
                  }) as any;
                  if (decoded.eventName === "SBTMinted") {
                    tokenId = decoded.args.tokenId as bigint;
                    console.log("✅ SBT已铸造，Token ID:", tokenId.toString());
                    break;
                  }
                } catch (e) {
                  // 不是目标事件，继续
                }
              }
            } catch (e) {
              console.error("解析事件失败，尝试备用方法:", e);
            }
          }
          
          // 如果事件解析失败，尝试从totalSupply获取（最后一个tokenId）
          if (tokenId === 0n && paymentSBTContract) {
            try {
              const totalSupply = await paymentSBTContract.read.totalSupply([]) as bigint;
              tokenId = totalSupply; // 最后一个就是刚铸造的
              console.log("✅ 通过totalSupply获取Token ID:", tokenId.toString());
            } catch (e) {
              console.error("获取totalSupply失败:", e);
            }
          }
          
          // 保存SBT信息用于显示
          if (tokenId > 0n) {
            // 获取合约地址作为收款方
            const contractAddress = paymentSBTContractData.address;
            setMintedSBT({
              tokenId,
              txHash,
              recipient: contractAddress,
              amount: formatEther(priceInWei),
            });
          }
          
          console.log("✅ SBT已铸造，付款已存储到合约:", paymentSBTContractData.address);
          
        } catch (error: any) {
          console.error("付款失败:", error);
          
          // 检查用户拒绝交易的多种情况
          const errorMessage = error.message || error.shortMessage || error.details || "";
          const errorString = errorMessage.toLowerCase();
          
          if (
            errorString.includes("user rejected") ||
            errorString.includes("user denied") ||
            errorString.includes("user cancelled") ||
            errorString.includes("rejected") ||
            errorString.includes("denied") ||
            error.name === "UserRejectedRequestError" ||
            error.code === 4001 // MetaMask用户拒绝错误码
          ) {
            throw new Error(t("paymentCancelled"));
          } else if (
            errorString.includes("insufficient funds") ||
            errorString.includes("balance") ||
            error.code === "INSUFFICIENT_FUNDS"
          ) {
            throw new Error(t("insufficientFunds"));
          } else if (errorString.includes("network") || errorString.includes("chain")) {
            throw new Error(t("networkError"));
          } else {
            // 提取更友好的错误信息
            const friendlyError = errorMessage.includes("ContractFunctionExecutionError")
              ? t("transactionExecutionFailed")
              : errorMessage || t("unknownError");
            throw new Error(`${t("paymentFailed")} ${friendlyError}`);
          }
        }
        
        // 传递txHash给Agent，Agent可以通过链上查询验证付款信息
        const encodedTx = encodeTx(txHash);
        requestConfig.headers = {
          ...requestConfig.headers,
          "X-PAYMENT": encodedTx,
        };
        
        console.log("重新发送请求，包含X-PAYMENT头（交易哈希）:", txHash);
        try {
          // 优先尝试直接访问
          response = await fetch(targetUrl, requestConfig);
          console.log("重新请求后的HTTP响应状态:", response.status, response.statusText);
        } catch (directError: any) {
          // 如果是 CORS 错误，使用代理
          const errorMessage = directError.message || directError.toString();
          if (
            errorMessage.includes("CORS") ||
            errorMessage.includes("Failed to fetch") ||
            errorMessage.includes("NetworkError") ||
            errorMessage.includes("Access-Control")
          ) {
            console.log("Direct access failed due to CORS, using proxy for retry...");
            try {
              // 使用 Next.js API 代理路由
              response = await fetch("/api/proxy-agent", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  url: targetUrl,
                  method: method,
                  headers: requestConfig.headers,
                  body: requestConfig.body,
                }),
              });
              console.log("重新请求后的HTTP响应状态 (via proxy):", response.status, response.statusText);
            } catch (proxyError: any) {
              // 代理也失败了
              const networkErrorMsg = (t("networkConnectionError" as any) as string) || "Network connection failed. Please check the Agent URL and your network connection.";
              throw new Error(networkErrorMsg);
            }
          } else {
            // 其他错误直接抛出
            throw directError;
          }
        }
      }
      
      // 处理最终响应（代理返回的 JSON）
      let responseData: any;
      try {
        responseData = await response.json();
      } catch (e) {
        // 如果解析失败，尝试作为文本
        responseData = await response.text();
      }
      
      if (response.ok) {
        setRequestResult({
          success: true,
          data: responseData,
        });
        
        // 注意：使用次数记录已移除，避免每次调用都产生链上交易
        // 如果需要记录使用次数，可以考虑：
        // 1. 只在付款时记录（通过 PaymentSBT 事件）
        // 2. 使用链下索引服务
        // 3. 让用户手动选择是否记录
      } else {
        setRequestResult({
          success: false,
          error: `请求失败: ${response.status} ${response.statusText}`,
          data: responseData, // 即使失败也显示响应数据
        });
      }
    } catch (error: any) {
      console.error("调用Agent失败:", error);
      setRequestResult({
        success: false,
        error: error.message || t("requestFailed") + " " + t("networkError"),
      });
    } finally {
      setIsCalling(false);
    }
  };

  // 下架 Agent
  const handleUnlistAgent = async () => {
    if (!listing) return;
    
    if (!confirm(t("confirmUnlist"))) {
      return;
    }

    setIsUnlisting(true);
    try {
      await writeContractAsync({
        functionName: "unlistAgent",
        args: [agentId],
      });
      alert(t("agentUnlistedSuccess"));
      // 跳转回商店页面
      window.location.href = "/agent-store";
    } catch (error: any) {
      console.error("Unlist agent error:", error);
      const errorMessage = error.message || error.shortMessage || error.details || "";
      const errorString = errorMessage.toLowerCase();
      
      if (
        errorString.includes("user rejected") ||
        errorString.includes("user denied") ||
        errorString.includes("user cancelled") ||
        errorString.includes("rejected") ||
        errorString.includes("denied") ||
        error.name === "UserRejectedRequestError" ||
        error.code === 4001
      ) {
        alert(t("unlistCancelled"));
      } else if (errorString.includes("not owner")) {
        alert(t("onlyOwnerCanUnlist"));
      } else {
        const unknownErrorText = t("unlistFailed") + " " + (errorMessage || "Unknown error");
        alert(unknownErrorText);
      }
    } finally {
      setIsUnlisting(false);
    }
  };

  // 评价功能已移除
  // const handleSubmitRating = async () => {
  //   if (!comment.trim()) {
  //     alert("请输入评价内容");
  //     return;
  //   }

  //   setIsSubmitting(true);
  //   try {
  //     await writeContractAsync({
  //       functionName: "submitRating",
  //       args: [agentId, rating, comment],
  //     });
  //     setComment("");
  //     refetch();
  //     alert("评价提交成功！");
  //   } catch (error) {
  //     console.error("Submit rating error:", error);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };


  // 解析 agentInfo（这是一个元组）
  const listing = agentInfo?.[0];
  const identity = agentInfo?.[1];
  const averageRating = agentInfo?.[2];
  const feedbackCount = agentInfo?.[3];

  // 检查是否是 Agent 的所有者
  const isOwner = address && listing && listing.owner?.toLowerCase() === address.toLowerCase();

  // 获取 Agent Card 数据（如果 agentCardLink 存在）
  const { agentCard, loading: cardLoading, error: cardError } = useAgentCard(
    listing?.agentCardLink,
    !!listing?.agentCardLink
  );

  return (
    <>
      <div className="flex items-center flex-col grow pt-10 pb-10">
        <div className="px-5 w-full max-w-4xl">
          <Link href="/agent-store" className="btn btn-sm mb-4 rounded-lg bg-[#1A110A]/50 border-2 border-[#261A10]/50 text-white hover:bg-[#261A10]/70 hover:border-[#FF6B00]/50 transition-all duration-300">
            {t("backToStore")}
          </Link>

          {listing && identity ? (
            <>
              {/* Agent Card 详情（如果有 agentCardLink，优先显示） */}
              {listing.agentCardLink && (
                <div className="mb-6">
                  <AgentCardDetail 
                    agentCard={agentCard} 
                    loading={cardLoading} 
                    error={cardError}
                  />
                </div>
              )}

              {/* 所有者信息（仅显示必要的权限信息） */}
              <div className="card bg-gradient-to-br from-[#1A110A]/90 to-[#261A10]/90 backdrop-blur-xl border border-[#FF6B00]/30 rounded-lg mb-6 animate-border-glow">
                <div className="card-body">
                  <h2 className="card-title text-xl text-white mb-4">{t("agentOwner") || "Owner"}</h2>
                  <Address address={listing.owner} />

                  <div className="card-actions justify-between mt-6">
                    {/* 所有者操作按钮 */}
                    {isOwner && (
                      <button
                        className="btn btn-sm rounded-lg bg-[#1A110A]/50 border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 transition-all duration-300"
                        onClick={handleUnlistAgent}
                        disabled={isUnlisting || !listing.listed}
                      >
                        {isUnlisting ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            {t("unlisting")}
                          </>
                        ) : (
                          t("unlistAgent")
                        )}
                      </button>
                    )}
                    
                    {/* 调用 Agent 按钮 */}
                    <button
                      className={`btn btn-lg rounded-lg bg-[#FF6B00] hover:bg-[#FF8C00] text-white border-0 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isOwner ? "ml-auto" : ""}`}
                      onClick={handleCallAgent}
                      disabled={isCalling || !listing.listed}
                    >
                      {isCalling ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          {t("calling")}
                        </>
                      ) : (
                        t("callAgent")
                      )}
                    </button>
                  </div>

                  {/* 请求结果展示 */}
                  {requestResult && (
                    <div className={`mt-6 p-4 rounded-lg border-2 ${
                      requestResult.success
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}>
                      <h3 className={`text-lg font-semibold mb-2 ${
                        requestResult.success ? "text-green-400" : "text-red-400"
                      }`}>
                        {requestResult.success ? t("callSuccess") : t("callFailed")}
                      </h3>
                      {requestResult.error && (
                        <div className="mb-3 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                          <p className="text-sm text-red-300 font-medium">{t("errorMessage")}</p>
                          <p className="text-sm text-red-200 mt-1 whitespace-pre-wrap">{requestResult.error}</p>
                        </div>
                      )}
                      {requestResult.data !== undefined && (
                        <div className="mt-2">
                          <p className="text-sm text-white/70 mb-1">{t("httpResponseData")}</p>
                          {(() => {
                            // 尝试提取图片 URL
                            let imageUrl: string | null = null;
                            
                            if (typeof requestResult.data === "string") {
                              // 如果是字符串，尝试解析为 JSON
                              try {
                                const parsed = JSON.parse(requestResult.data);
                                if (parsed?.data?.data && typeof parsed.data.data === "string") {
                                  imageUrl = parsed.data.data;
                                } else if (parsed?.data && typeof parsed.data === "string") {
                                  imageUrl = parsed.data;
                                }
                              } catch (e) {
                                // 不是 JSON，检查是否是 URL
                                if (requestResult.data.startsWith("http://") || requestResult.data.startsWith("https://")) {
                                  imageUrl = requestResult.data;
                                }
                              }
                            } else if (typeof requestResult.data === "object" && requestResult.data !== null) {
                              // 如果是对象，查找 data.data 字段
                              const data = requestResult.data as any;
                              if (data?.data?.data && typeof data.data.data === "string") {
                                imageUrl = data.data.data;
                              } else if (data?.data && typeof data.data === "string") {
                                imageUrl = data.data;
                              } else if (data?.url && typeof data.url === "string") {
                                imageUrl = data.url;
                              }
                            }
                            
                            // 如果找到图片 URL，显示图片
                            if (imageUrl && (imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || imageUrl.includes("image") || imageUrl.includes("png") || imageUrl.includes("jpg"))) {
                              return (
                                <div className="bg-[#261A10]/50 p-3 rounded-lg border border-[#FF6B00]/20">
                                  <img 
                                    src={imageUrl} 
                                    alt="Agent Response" 
                                    className="max-w-full h-auto rounded-lg border border-[#FF6B00]/30"
                                    onError={(e) => {
                                      // 如果图片加载失败，显示原始数据
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = "block";
                                    }}
                                  />
                                  <pre className="bg-[#261A10]/50 p-3 rounded-lg text-xs overflow-x-auto text-white/80 border border-[#FF6B00]/20 font-mono max-h-64 overflow-y-auto hidden">
                                    {typeof requestResult.data === "string" 
                                      ? requestResult.data 
                                      : JSON.stringify(requestResult.data, null, 2)}
                                  </pre>
                                </div>
                              );
                            }
                            
                            // 否则显示 JSON 文本
                            return (
                              <pre className="bg-[#261A10]/50 p-3 rounded-lg text-xs overflow-x-auto text-white/80 border border-[#FF6B00]/20 font-mono max-h-64 overflow-y-auto">
                                {typeof requestResult.data === "string" 
                                  ? requestResult.data 
                                  : JSON.stringify(requestResult.data, null, 2)}
                              </pre>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 新铸造的SBT信息 */}
                  {mintedSBT && (
                    <div className="mt-6 p-4 rounded-lg border-2 bg-[#FF6B00]/10 border-[#FF6B00]/30 animate-border-glow">
                      <h3 className="text-lg font-semibold mb-3 text-[#FF6B00]">
                        {t("sbtMinted")}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/70">{t("tokenId")}</span>
                          <span className="text-white font-mono">{mintedSBT.tokenId.toString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">{t("paymentAmount")}</span>
                          <span className="text-white">{mintedSBT.amount} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">{t("recipientAddress")}</span>
                          <Address address={mintedSBT.recipient as `0x${string}`} />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">{t("transactionHash")}</span>
                          <a
                            href={`${targetNetwork.blockExplorers?.default?.url || '#'}/tx/${mintedSBT.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link text-[#FF6B00] hover:text-[#FFA040] text-xs font-mono break-all"
                          >
                            {mintedSBT.txHash.slice(0, 10)}...{mintedSBT.txHash.slice(-8)}
                          </a>
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#FF6B00]/20">
                          <p className="text-xs text-yellow-400">
                            {t("sbtTip")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 我的SBT区域 */}
              {address && (
                <div className="card bg-gradient-to-br from-[#1A110A]/90 to-[#261A10]/90 backdrop-blur-xl border border-[#FF6B00]/30 rounded-lg mb-6">
                  <div className="card-body">
                    <div className="flex justify-between items-center">
                      <h2 className="card-title text-white">{t("myPaymentSBTs")}</h2>
                      <button
                        className="btn btn-sm rounded-lg bg-[#FF6B00] hover:bg-[#FF8C00] text-white border-0 transition-all duration-300"
                        onClick={() => {
                          setShowMySBTs(!showMySBTs);
                          if (!showMySBTs) {
                            refetchMySBTs();
                          }
                        }}
                      >
                        {showMySBTs ? t("hide") : t("viewMySBTs")}
                      </button>
                    </div>

                    {showMySBTs && (
                      <div className="mt-4">
                        {mySBTs && Array.isArray(mySBTs) && (mySBTs as bigint[]).length > 0 ? (
                          <div className="space-y-3">
                            {(mySBTs as bigint[]).map((tokenId: bigint, index: number) => (
                              <SBTCard key={index} tokenId={tokenId} paymentSBTContract={paymentSBTContract} targetNetwork={targetNetwork} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-white/70">{t("noSBTRecords")}</p>
                            <p className="text-sm text-white/50 mt-2">{t("sbtHint")}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 评价功能已移除 */}
            </>
          ) : (
            <div className="text-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-xl text-white/70 mt-4">{t("loading")}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AgentDetail;

