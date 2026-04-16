"use client";

import React from "react";
import { StyleFamily, ModelId, ImageCount, STYLE_LABELS, MODELS } from "./types";

interface SelectionSummaryProps {
  style: StyleFamily;
  model: ModelId;
  resolution: string;
  imageCount: ImageCount;
  ratioSummary: string;
}

function Tag({ label, value }: { label?: string; value: string }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-[3px]">
      {label && <span className="text-[10px] text-white/20">{label}</span>}
      <span className="text-[10px] font-medium text-white/45">{value}</span>
    </div>
  );
}

export function SelectionSummary({
  style,
  model,
  resolution,
  imageCount,
  ratioSummary,
}: SelectionSummaryProps) {
  const modelLabel = MODELS.find((m) => m.id === model)?.label ?? model;

  return (
    <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] bg-[#0E0E12] px-4 py-3">
      <Tag label="Style" value={`${style} · ${STYLE_LABELS[style].badge.split(" ")[0]}`} />
      <Tag label="Model" value={modelLabel} />
      <Tag label="Res" value={resolution} />
      <Tag value={`${imageCount}×`} />
      <Tag label="Ratio" value={ratioSummary} />
    </div>
  );
}
