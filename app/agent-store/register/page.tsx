"use client";

import type { NextPage } from "next";
import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseEther } from "viem";
import { useLanguage } from "~~/utils/i18n/LanguageContext";

const RegisterAgent: NextPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    link: "",
    method: 0, // 0=GET, 1=POST, 2=PUT, 3=DELETE
    requestParams: "",
    price: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "AgentStore",
  });

  const methods = [
    { label: "GET", value: 0 },
    { label: "POST", value: 1 },
    { label: "PUT", value: 2 },
    { label: "DELETE", value: 3 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      // 将价格从 ETH 转换为 wei
      const priceInWei = parseEther(formData.price || "0");

      await writeContractAsync({
        functionName: "registerAndListAgent",
        args: [
          formData.name,
          formData.description,
          formData.link,
          formData.method,
          formData.requestParams,
          priceInWei,
        ],
      });

      // 成功后跳转
      router.push("/agent-store");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10 pb-10 bg-gradient-to-br from-[#1A110A] via-[#261A10] to-[#1A110A] min-h-screen animate-gradient">
        <div className="px-5 w-full max-w-3xl">
          <div className="mb-8">
            <Link href="/agent-store" className="btn btn-sm mb-4 bg-[#261A10]/50 backdrop-blur-sm border-[#FF6B00]/20 text-white hover:bg-[#FF6B00]/20 transition-all">
              {t("backToStore")}
            </Link>
            <h1 className="text-4xl font-bold mb-3 animate-text-shimmer">
              {t("registerNewAgentTitle")}
            </h1>
            <p className="text-white/70 mt-3 text-lg">
              {t("registerDescription")}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-[#1A110A]/90 to-[#261A10]/90 backdrop-blur-xl border border-[#FF6B00]/30 animate-border-glow">
            <div className="card-body p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Agent 名称 */}
                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text text-base font-semibold text-white">
                      {t("agentName")} <span className="text-[#FF6B00]">{t("required")}</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("exampleName")}
                    className="input w-full h-12 text-base rounded-lg bg-[#1A110A]/50 border-2 border-[#FF6B00]/30 text-white placeholder:text-gray-500 focus:border-[#FF6B00] focus:bg-[#261A10]/70 focus:outline-none focus:ring-0 transition-all duration-300"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* 简介 */}
                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text text-base font-semibold text-white">
                      {t("description")} <span className="text-[#FF6B00]">{t("required")}</span>
                    </span>
                  </label>
                  <textarea
                    placeholder={t("exampleDesc")}
                    className="textarea w-full min-h-28 text-base rounded-lg bg-[#1A110A]/50 border-2 border-[#FF6B00]/30 text-white placeholder:text-gray-500 focus:border-[#FF6B00] focus:bg-[#261A10]/70 focus:outline-none focus:ring-0 transition-all duration-300 resize-y"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>

                {/* 链接 */}
                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text text-base font-semibold text-white">
                      {t("registerLink")} <span className="text-[#FF6B00]">{t("required")}</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("exampleLink")}
                    className="input w-full h-12 text-base font-mono rounded-lg bg-[#1A110A]/50 border-2 border-[#FF6B00]/30 text-white placeholder:text-gray-500 focus:border-[#FF6B00] focus:bg-[#261A10]/70 focus:outline-none focus:ring-0 transition-all duration-300"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value })
                    }
                    required
                  />
                  <label className="label pt-1">
                    <span className="label-text-alt text-sm text-[#FF6B00]/70">
                      {t("linkHint")}
                    </span>
                  </label>
                </div>

                {/* 请求方式和价格在同一行 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 请求方式 */}
                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text text-base font-semibold text-white">
                        {t("registerRequestMethod")} <span className="text-[#FF6B00]">{t("required")}</span>
                      </span>
                    </label>
                    <select
                      className="select w-full h-12 text-base rounded-lg bg-[#1A110A]/50 border-2 border-[#FF6B00]/30 text-white focus:border-[#FF6B00] focus:bg-[#261A10]/70 focus:outline-none focus:ring-0 transition-all duration-300"
                      value={formData.method}
                      onChange={(e) =>
                        setFormData({ ...formData, method: parseInt(e.target.value) })
                      }
                      required
                    >
                      {methods.map((method) => (
                        <option key={method.value} value={method.value} className="bg-[#1A110A] text-white">
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 价格 */}
                  <div className="form-control">
                    <label className="label pb-2">
                      <span className="label-text text-base font-semibold text-white">
                        {t("registerPriceETH")} <span className="text-[#FF6B00]">{t("required")}</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder={t("pricePlaceholder")}
                        className="input w-full h-12 text-base pr-12 rounded-lg bg-[#1A110A]/50 border-2 border-[#FF6B00]/30 text-white placeholder:text-gray-500 focus:border-[#FF6B00] focus:bg-[#261A10]/70 focus:outline-none focus:ring-0 transition-all duration-300"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF6B00] font-medium">
                        ETH
                      </span>
                    </div>
                    <label className="label pt-1">
                      <span className="label-text-alt text-sm text-[#FF6B00]/70">
                        {t("priceHint")}
                      </span>
                    </label>
                  </div>
                </div>

                {/* 请求参数 */}
                <div className="form-control">
                  <label className="label pb-2">
                    <span className="label-text text-base font-semibold text-white">
                      {t("registerRequestParams")} <span className="text-[#FF6B00]">{t("required")}</span>
                    </span>
                  </label>
                  <textarea
                    placeholder={t("paramsExample")}
                    className="textarea w-full min-h-36 text-sm font-mono rounded-lg bg-[#1A110A]/50 border-2 border-[#FF6B00]/30 text-white placeholder:text-gray-500 focus:border-[#FF6B00] focus:bg-[#261A10]/70 focus:outline-none focus:ring-0 transition-all duration-300 resize-y"
                    value={formData.requestParams}
                    onChange={(e) =>
                      setFormData({ ...formData, requestParams: e.target.value })
                    }
                    required
                  />
                  <label className="label pt-1">
                    <span className="label-text-alt text-sm text-[#FF6B00]/70">
                      {t("paramsHint")}
                    </span>
                  </label>
                </div>

                {/* 提交按钮 */}
                <div className="flex gap-4 pt-4">
                  <Link 
                    href="/agent-store" 
                    className="btn flex-1 h-14 text-base rounded-lg bg-[#1A110A]/50 border-2 border-[#261A10]/50 text-white hover:bg-[#261A10]/70 hover:border-[#FF6B00]/50 transition-all duration-300"
                  >
                    {t("cancel")}
                  </Link>
                  <button
                    type="submit"
                    className="btn flex-1 h-14 text-base font-semibold rounded-lg bg-[#FF6B00] hover:bg-[#FF8C00] text-white border-0 transition-all duration-300 transform hover:scale-[1.02] animate-pulse-glow"
                    disabled={isRegistering}
                  >
                    {isRegistering ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        {t("registering")}
                      </>
                    ) : (
                      t("register")
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterAgent;

