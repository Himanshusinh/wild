"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Sparkles, Zap } from "lucide-react";

type ModelAlternative = {
  modelId: string;
  label: string;
  provider: string;
  creditCost: number;
};

type PlanStep = {
  stepId: string;
  label: string;
  creditCost?: number;
  selectedModel?: {
    modelId: string;
    label: string;
    provider?: string;
    creditCost: number;
  };
  alternatives?: ModelAlternative[];
};

type PlanData = {
  taskType: string;
  totalEstimatedCredits?: number;
  totalEstimatedDurationSeconds?: number;
  steps: PlanStep[];
};

export function PlanApprovalCard({
  planId,
  plan,
  userCredits,
  onApprove,
  onReject,
  onModelSwitch,
}: {
  planId: string;
  plan: PlanData;
  userCredits?: number | null;
  onApprove: (modelOverrides?: Record<string, string>) => void;
  onReject: () => void;
  onModelSwitch?: (stepId: string, modelId: string) => void;
}) {
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});

  const steps = plan.steps ?? [];

  const totalCredits = useMemo(() => {
    return steps.reduce((sum, step) => {
      const overrideModelId = selectedModels[step.stepId];
      if (overrideModelId) {
        const alt = step.alternatives?.find((a) => a.modelId === overrideModelId);
        return sum + (alt?.creditCost ?? step.creditCost ?? 0);
      }
      return sum + (step.creditCost ?? 0);
    }, 0);
  }, [selectedModels, steps]);

  const canAfford = userCredits == null || userCredits >= totalCredits;

  const handleModelSelect = (stepId: string, modelId: string) => {
    setSelectedModels((prev) => ({ ...prev, [stepId]: modelId }));
    onModelSwitch?.(stepId, modelId);
  };

  const handleApprove = () => {
    onApprove(Object.keys(selectedModels).length > 0 ? selectedModels : undefined);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur-sm overflow-hidden w-full max-w-sm">
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 rounded-xl bg-amber-500/10 p-2 ring-1 ring-amber-400/20 shrink-0">
            <Sparkles className="h-4 w-4 text-amber-300" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white capitalize">
              {plan.taskType} Generation Plan
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Plan ID: <span className="text-zinc-300">{planId}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] text-zinc-500">Est. cost</div>
          <div
            className={`text-sm font-bold flex items-center gap-1 justify-end ${
              canAfford ? "text-amber-400" : "text-red-400"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {totalCredits}
          </div>
          {userCredits != null && (
            <div className="text-[10px] text-zinc-600">
              {canAfford ? `${userCredits - totalCredits} left after` : `need ${totalCredits - userCredits} more`}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 space-y-2.5">
        {steps.map((step, i) => {
          const activeModelId = selectedModels[step.stepId] ?? step.selectedModel?.modelId;
          const activeModel = selectedModels[step.stepId]
            ? step.alternatives?.find((a) => a.modelId === selectedModels[step.stepId]) ?? step.selectedModel
            : step.selectedModel;

          return (
            <div key={step.stepId} className="space-y-1.5">
              <div className="flex items-start gap-2">
                <div className="shrink-0 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-500 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-zinc-200 font-medium">{step.label}</div>
                  {activeModel && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-zinc-400">{activeModel.label}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-[11px] text-amber-500">
                        {(activeModel as any).creditCost ?? step.creditCost ?? 0} cr
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {step.alternatives && step.alternatives.length > 0 && (
                <div className="ml-7 flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="px-2 py-1 rounded-full text-[10px] bg-violet-500/20 border border-violet-500/40 text-violet-300"
                  >
                    ✓ {activeModel?.label ?? "Selected"}
                  </button>
                  {step.alternatives
                    .filter((a) => a.modelId !== activeModelId)
                    .map((alt) => (
                      <button
                        key={alt.modelId}
                        type="button"
                        onClick={() => handleModelSelect(step.stepId, alt.modelId)}
                        className="px-2 py-1 rounded-full text-[10px] border border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {alt.label} ({alt.creditCost}cr)
                      </button>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!canAfford && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-[12px] text-red-400">
            Not enough credits.{" "}
            <button
              type="button"
              className="underline hover:text-red-300"
              onClick={() => (window.location.href = "/pricing")}
            >
              Upgrade →
            </button>
          </p>
        </div>
      )}

      <div className="px-4 pb-4 pt-2 flex gap-2 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={handleApprove}
          disabled={!canAfford}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[13px] font-semibold transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          Approve & Generate
        </button>
        <button
          type="button"
          onClick={onReject}
          className="flex items-center justify-center p-2.5 rounded-xl border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

