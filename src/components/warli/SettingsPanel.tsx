"use client";

import React from "react";
import { ImageCount, AspectRatio, IMAGE_COUNTS, ModelId } from "./types";
import { getAspectRatioMenuForModel } from "./warliNanoAspect";

interface SettingsPanelProps {
  model: ModelId;
  imageCount: ImageCount;
  ratio: AspectRatio;
  includeBenchmark: boolean;
  includeVariable: boolean;
  includeRestyle: boolean;
  onCountChange: (c: ImageCount) => void;
  onRatioChange: (r: AspectRatio) => void;
  onIncludeBenchmarkChange: (v: boolean) => void;
  onIncludeVariableChange: (v: boolean) => void;
  onIncludeRestyleChange: (v: boolean) => void;
}

function Chip<T extends string | number>({
  value,
  label,
  active,
  onClick,
}: {
  value: T;
  label?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all duration-150 ${
        active
          ? "border-[#2F6BFF]/30 bg-[#2F6BFF]/[0.1] text-[#60a5fa]"
          : "border-white/10 bg-[#13131a] text-white/30 hover:border-white/20 hover:text-white/60"
      }`}
    >
      {label ?? value}
    </button>
  );
}

export function SettingsPanel({
  model,
  imageCount,
  ratio,
  includeBenchmark,
  includeVariable,
  includeRestyle,
  onCountChange,
  onRatioChange,
  onIncludeBenchmarkChange,
  onIncludeVariableChange,
  onIncludeRestyleChange,
}: SettingsPanelProps) {
  const ratioOptions = getAspectRatioMenuForModel(model);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25">Count</span>
        <div className="flex flex-wrap gap-1">
          {IMAGE_COUNTS.map((c) => (
            <Chip key={c} value={c} active={imageCount === c} onClick={() => onCountChange(c)} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25">
          Ratio ({model === "google/nano-banana-pro" ? "Pro" : "Nano 2"})
        </span>
        <div className="max-h-32 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#13131a]/50 p-2 [scrollbar-width:thin]">
          <div className="flex flex-wrap gap-1">
            {ratioOptions.map((r) => (
              <Chip
                key={r}
                value={r}
                label={r === "auto" ? "Auto" : r}
                active={ratio === r}
                onClick={() => onRatioChange(r as AspectRatio)}
              />
            ))}
          </div>
        </div>
      </div>

      <details className="rounded-xl border border-white/[0.06] bg-[#13131a]/40 px-3 py-2">
        <summary className="cursor-pointer select-none text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25">
          Advanced prompt
        </summary>
        <div className="mt-2 flex flex-wrap gap-1">
          <Chip
            value="benchmark"
            label="Benchmark"
            active={includeBenchmark}
            onClick={() => onIncludeBenchmarkChange(!includeBenchmark)}
          />
          <Chip
            value="variable"
            label="Variable"
            active={includeVariable}
            onClick={() => onIncludeVariableChange(!includeVariable)}
          />
          <Chip
            value="restyle"
            label="Restyle"
            active={includeRestyle}
            onClick={() => onIncludeRestyleChange(!includeRestyle)}
          />
        </div>
        <p className="mt-2 text-[10px] leading-snug text-white/15">
          Off by default to reduce added details.
        </p>
      </details>
    </div>
  );
}
