"use client";

import React from "react";
import { useLanguage } from "~~/utils/i18n/LanguageContext";

type ExecutionStep = {
  id: string;
  label: string;
  status: "pending" | "executing" | "completed" | "error";
};

type ExecutionChecklistProps = {
  isOpen: boolean;
  steps: ExecutionStep[];
  onComplete?: () => void;
};

export const ExecutionChecklist: React.FC<ExecutionChecklistProps> = ({
  isOpen,
  steps,
  onComplete,
}) => {
  const { t } = useLanguage();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 检查是否所有步骤都完成
  const allCompleted = steps.every(step => step.status === "completed");
  
  // 如果所有步骤完成，延迟一点后调用 onComplete
  React.useEffect(() => {
    if (allCompleted && onComplete && isOpen) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [allCompleted, onComplete, isOpen]);

  // 确保每次打开时滚动到顶部
  React.useEffect(() => {
    if (isOpen && containerRef.current) {
      // 立即滚动到顶部
      containerRef.current.scrollTop = 0;
      
      // 使用 requestAnimationFrame 确保在下一帧执行
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      });
      
      // 延迟一点再次确保
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md py-8 px-4">
      {/* 动态背景光效 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6B00]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#FF8C00]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FF6B00]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* 主卡片 */}
      <div 
        ref={containerRef}
        className="relative z-10 bg-gradient-to-br from-[#1A110A]/95 via-[#261A10]/95 to-[#1A110A]/95 backdrop-blur-2xl border-2 border-[#FF6B00]/40 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl shadow-[#FF6B00]/20 max-h-[90vh] overflow-y-auto"
      >
        {/* 发光边框效果 */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#FF6B00]/0 via-[#FF6B00]/30 to-[#FF6B00]/0 opacity-50 blur-xl animate-pulse"></div>
        
        {/* 标题 */}
        <div className="relative mb-8">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] via-[#FF8C00] to-[#FF6B00] text-center animate-text-shimmer">
            {t("executionInProgress") || "执行中..."}
          </h2>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent rounded-full"></div>
        </div>
        
        {/* 步骤列表 */}
        <div className="relative space-y-3">
          {steps.map((step, index) => {
            const isActive = step.status === "executing";
            const isCompleted = step.status === "completed";
            const isError = step.status === "error";
            
            return (
              <div key={step.id} className="relative">
                {/* 步骤卡片 */}
                <div className={`relative flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-500 ${
                  isActive
                    ? "bg-gradient-to-r from-[#FF6B00]/20 via-[#FF8C00]/20 to-[#FF6B00]/20 border-[#FF6B00] shadow-lg shadow-[#FF6B00]/50 scale-105"
                    : isCompleted
                    ? "bg-gradient-to-r from-[#FF6B00]/10 to-[#FF8C00]/10 border-[#FF6B00]/50 shadow-md shadow-[#FF6B00]/30"
                    : isError
                    ? "bg-red-500/10 border-red-500/50 shadow-md shadow-red-500/30"
                    : "bg-[#1A110A]/50 border-[#FF6B00]/20"
                }`}>
                  {/* 执行中的光效 */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-[#FF6B00]/30 to-transparent animate-shimmer"></div>
                  )}
                  
                  {/* 状态图标 */}
                  <div className="relative flex-shrink-0 z-10">
                    {step.status === "pending" && (
                      <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white/30"></div>
                      </div>
                    )}
                    {step.status === "executing" && (
                      <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full border-4 border-[#FF6B00] border-t-transparent animate-spin"></div>
                        <div className="absolute inset-2 rounded-full border-2 border-[#FF8C00] border-r-transparent animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-[#FF6B00] animate-pulse shadow-lg shadow-[#FF6B00]"></div>
                        </div>
                      </div>
                    )}
                    {step.status === "completed" && (
                      <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] flex items-center justify-center shadow-lg shadow-[#FF6B00]/50 animate-scale-in">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 rounded-full bg-[#FF6B00] animate-ping opacity-20"></div>
                      </div>
                    )}
                    {step.status === "error" && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/50">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* 步骤标签 */}
                  <div className="flex-1 z-10">
                    <p className={`text-lg font-semibold transition-all duration-500 ${
                      isCompleted 
                        ? "text-white drop-shadow-lg" 
                        : isActive
                        ? "text-[#FF6B00] drop-shadow-lg"
                        : isError
                        ? "text-red-400 drop-shadow-lg"
                        : "text-white/60"
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  
                  {/* 完成时的粒子效果 */}
                  {isCompleted && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1.5 h-1.5 bg-[#FF6B00] rounded-full shadow-lg shadow-[#FF6B00] animate-particle"
                          style={{
                            left: "50%",
                            top: "50%",
                            animationDelay: `${i * 0.1}s`,
                          }}
                        ></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 底部进度指示 */}
        <div className="mt-8 pt-6 border-t border-[#FF6B00]/20">
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            <span>{t("progress")}</span>
            <span className="text-[#FF6B00] font-semibold">
              {steps.filter(s => s.status === "completed").length} / {steps.length}
            </span>
          </div>
          <div className="h-2 bg-[#1A110A] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] rounded-full transition-all duration-500 shadow-lg shadow-[#FF6B00]/50"
              style={{ 
                width: `${(steps.filter(s => s.status === "completed").length / steps.length) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

