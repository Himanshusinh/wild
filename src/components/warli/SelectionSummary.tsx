"use client";

import React from "react";
import { StyleFamily, ModelId, ImageCount, AspectRatio, Variation, STYLE_LABELS } from "./types";

interface SelectionSummaryProps {
  style: StyleFamily;
  variation: Variation;
  model: ModelId;
  imageCount: ImageCount;
  ratio: AspectRatio;
}

function Tag({ label, value }: { label?: string; value: string }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-[3px]">
      {label && <span className="text-[10px] text-white/20">{label}</span>}
      <span className="text-[10px] font-medium text-white/45">{value}</span>
    </div>
  );
}

const MODEL_LABELS: Record<ModelId, string> = {
  "flux-2-pro": "Flux 2 Pro",
  "seedream-4.5": "Seedream 4.5",
  "imagen-4": "Imagen 4",
};

const VARIATION_LABELS: Record<Variation, string> = {
  template: "Template",
  variable: "Variable",
  restyle: "Restyle",
};

export function SelectionSummary({ style, variation, model, imageCount, ratio }: SelectionSummaryProps) {
  return (
    <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] bg-[#0E0E12] px-4 py-3">
      <Tag label="Style" value={`${style} · ${STYLE_LABELS[style].badge.split(" ")[0]}`} />
      <Tag value={VARIATION_LABELS[variation]} />
      <Tag label="Model" value={MODEL_LABELS[model]} />
      <Tag value={`${imageCount}×`} />
      <Tag value={ratio} />
    </div>
  );
}
