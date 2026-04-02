"use client";

import React from "react";
import { ImageCount, AspectRatio, IMAGE_COUNTS, RATIOS } from "./types";

interface SettingsPanelProps {
  imageCount: ImageCount;
  ratio: AspectRatio;
  onCountChange: (c: ImageCount) => void;
  onRatioChange: (r: AspectRatio) => void;
}

function Chip<T extends string | number>({
  value,
  active,
  onClick,
}: {
  value: T;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all duration-150 ${
        active
          ? "border-[#2F6BFF]/30 bg-[#2F6BFF]/[0.1] text-[#60a5fa]"
          : "border-white/10 bg-[#13131a] text-white/30 hover:border-white/20 hover:text-white/60"
      }`}
    >
      {value}
    </button>
  );
}

export function SettingsPanel({ imageCount, ratio, onCountChange, onRatioChange }: SettingsPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25">Count</span>
        <div className="flex flex-wrap gap-1.5">
          {IMAGE_COUNTS.map((c) => (
            <Chip key={c} value={c} active={imageCount === c} onClick={() => onCountChange(c)} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25">Ratio</span>
        <div className="flex flex-wrap gap-1.5">
          {RATIOS.map((r) => (
            <Chip key={r} value={r} active={ratio === r} onClick={() => onRatioChange(r)} />
          ))}
        </div>
      </div>
    </div>
  );
}
