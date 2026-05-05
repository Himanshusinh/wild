"use client";

import React, { memo, useCallback } from "react";

type PromptDockGenerateButtonProps = {
  variant: "hidden" | "mobile" | "desktop";
  expectedCredits: number;
  selectedModel: string;
  planCode?: string | null;
  credits: { freeTurboUsed?: number; freeTurboLimit?: number } | null | undefined;
  isEnhancing: boolean;
  queueAtCapacity: boolean;
  runningGenerationsCount: number;
  isGenerateDisabled: boolean;
  onGenerate: (source: "hidden" | "mobile" | "desktop") => Promise<void>;
};

function PromptDockGenerateButtonComponent({
  variant,
  expectedCredits,
  selectedModel,
  planCode,
  credits,
  isEnhancing,
  queueAtCapacity,
  runningGenerationsCount,
  isGenerateDisabled,
  onGenerate,
}: PromptDockGenerateButtonProps) {
  const handleGenerate = useCallback(async () => {
    await onGenerate(variant);
  }, [onGenerate, variant]);

  const isTurboFree =
    (selectedModel === "z-image-turbo" || selectedModel === "new-turbo-model") &&
    (planCode?.toLowerCase() || "free") === "free";

  if (variant === "mobile") {
    return (
      <>
        {expectedCredits > 0 && (
          <div className="text-[11px] text-white/40 whitespace-nowrap px-1">
            {Math.round(expectedCredits).toLocaleString()} credits
          </div>
        )}
        {isTurboFree && (
          <div className="text-[11px] text-white/40 whitespace-nowrap px-1">
            {credits?.freeTurboUsed || 0}/{credits?.freeTurboLimit || 10} Gens
          </div>
        )}
        <button
          onClick={handleGenerate}
          disabled={isGenerateDisabled}
          className="flex h-7 px-3 items-center justify-center bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-70 disabled:hover:bg-[#2F6BFF] text-white rounded-md transition shadow-[0_4px_16px_rgba(47,107,255,.45)] flex-shrink-0"
          aria-busy={isEnhancing}
          aria-label={
            isEnhancing
              ? "Enhancing prompt"
              : queueAtCapacity
                ? "Queue full"
                : runningGenerationsCount > 0
                  ? `Generate (${runningGenerationsCount}/4)`
                  : "Generate"
          }
        >
          {isEnhancing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle
                cx="6"
                cy="6"
                r="4.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeDasharray="7 18"
                strokeLinecap="round"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 6 6"
                  to="360 6 6"
                  dur="0.6s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          ) : queueAtCapacity ? (
            <span className="text-[10px] font-semibold">4/4</span>
          ) : (
            <span className="text-[11px] font-bold">Generate</span>
          )}
        </button>
      </>
    );
  }

  return (
    <>
      {expectedCredits > 0 && (
        <div className="text-white/60 text-[11px] pr-1">
          Total credits:{" "}
          <span className="font-medium text-white/80">
            {Math.round(expectedCredits).toLocaleString()}
          </span>
        </div>
      )}
      {isTurboFree && (
        <div className="text-white/60 text-[11px] pr-1">
          Generations:{" "}
          <span className="font-medium text-white/80">
            {credits?.freeTurboUsed || 0}/{credits?.freeTurboLimit || 10}
          </span>
        </div>
      )}
      <button
        onClick={handleGenerate}
        disabled={isGenerateDisabled}
        className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-70 disabled:hover:bg-[#2F6BFF] text-white px-4 py-2 rounded-lg text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
        aria-busy={isEnhancing}
      >
        {isEnhancing ? "Enhancing..." : queueAtCapacity ? "Queue Full" : "Generate"}
      </button>
    </>
  );
}

export const PromptDockGenerateButton = memo(PromptDockGenerateButtonComponent);
