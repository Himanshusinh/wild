"use client";

import React from "react";
import { ImageCount, AspectRatio, IMAGE_COUNTS, ModelId } from "./types";
import { getAspectRatioMenuForModel } from "./warliNanoAspect";

interface SettingsPanelProps {
  model: ModelId;
  imageCount: ImageCount;
  ratio: AspectRatio;
  onCountChange: (c: ImageCount) => void;
  onRatioChange: (r: AspectRatio) => void;
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
  onCountChange,
  onRatioChange,
}: SettingsPanelProps) {
  const ratioOptions = getAspectRatioMenuForModel(model);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25">Count</span>
        <div className="flex flex-wrap gap-1.5">
          {IMAGE_COUNTS.map((c) => (
            <Chip key={c} value={c} active={imageCount === c} onClick={() => onCountChange(c)} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25">
          Ratio ({model === "google/nano-banana-pro" ? "Pro" : "Nano 2"})
        </span>
        <p className="text-[10px] leading-snug text-white/20">
          {model === "google/nano-banana-pro"
            ? "Pro FAL enum (default in API: 1:1). Pick auto to let the model choose from your prompt."
            : "Nano Banana 2 FAL enum includes extreme ratios; default in API is auto."}
        </p>
        <div className="max-h-36 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#13131a]/50 p-2 [scrollbar-width:thin]">
          <div className="flex flex-wrap gap-1.5">
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
    </div>
  );
}
