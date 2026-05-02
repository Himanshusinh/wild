"use client";

import React from "react";
import { ImageCount, AspectRatio, IMAGE_COUNTS, ModelId } from "./types";
import { getAspectRatioMenuForModel, getResolutionMenuForModel } from "./warliNanoAspect";

interface SettingsPanelProps {
  model: ModelId;
  resolution: string;
  imageCount: ImageCount;
  ratio: AspectRatio;
  includeBenchmark: boolean;
  includeVariable: boolean;
  includeRestyle: boolean;
  onCountChange: (c: ImageCount) => void;
  onResolutionChange: (v: string) => void;
  onRatioChange: (r: AspectRatio) => void;
  onIncludeBenchmarkChange: (v: boolean) => void;
  onIncludeVariableChange: (v: boolean) => void;
  onIncludeRestyleChange: (v: boolean) => void;
  disabled?: boolean;
}

const RATIO_CATEGORIES = [
  { id: "portrait", label: "Portrait" },
  { id: "square", label: "Square" },
  { id: "landscape", label: "Landscape" },
];

const RATIO_GROUPS: Record<string, string[]> = {
  portrait: ["1:8", "1:4", "9:21", "9:16", "10:16", "2:3", "3:4", "4:5", "10:14", "6:10", "1:3", "1:2"],
  square: ["1:1", "auto", "default", "square_hd"],
  landscape: ["5:4", "4:3", "14:10", "3:2", "16:9", "16:10", "21:9", "2:1", "3:1", "4:1", "8:1"],
};

function Chip<T extends string | number>({
  value,
  label,
  active,
  onClick,
  disabled,
}: {
  value: T;
  label?: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-4 py-1.5 text-[11px] font-medium transition-all duration-200 ${active
        ? "border-[#2F6BFF] bg-[#2F6BFF]/[0.12] text-[#60a5fa]"
        : "border-white/10 bg-white/[0.04] text-white/40 hover:border-white/20 hover:bg-white/[0.08]"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {label ?? value}
    </button>
  );
}

export function SettingsPanel({
  model,
  resolution,
  imageCount,
  ratio,
  includeBenchmark,
  includeVariable,
  includeRestyle,
  onCountChange,
  onResolutionChange,
  onRatioChange,
  onIncludeBenchmarkChange,
  onIncludeVariableChange,
  onIncludeRestyleChange,
  disabled,
}: SettingsPanelProps) {
  const ratioOptions = getAspectRatioMenuForModel(model);
  const resolutionOptions = getResolutionMenuForModel(model);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25">
          Resolution ({model === "google/nano-banana-pro" ? "Pro" : "Nano 2"})
        </span>
        <div className="flex flex-wrap gap-1">
          {resolutionOptions.map((res) => (
            <Chip
              key={res}
              value={res}
              active={resolution === res}
              onClick={() => onResolutionChange(res)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25">Count</span>
        <div className="flex flex-wrap gap-1">
          {(IMAGE_COUNTS as unknown as number[]).map((c) => (
            <Chip
              key={c}
              value={c}
              active={imageCount === c}
              onClick={() => onCountChange(c as ImageCount)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">
          Ratio ({model === "google/nano-banana-pro" ? "Pro" : "Nano 2"})
        </span>

        <VisualRatioSelector
          ratio={ratio}
          options={ratioOptions}
          onRatioChange={onRatioChange}
          disabled={disabled}
        />
      </div>

    </div>
  );
}

function VisualRatioSelector({
  ratio,
  options,
  onRatioChange,
  disabled,
}: {
  ratio: string;
  options: readonly string[];
  onRatioChange: (r: any) => void;
  disabled?: boolean;
}) {
  const [category, setCategory] = React.useState(() => {
    if (RATIO_GROUPS.portrait.includes(ratio)) return "portrait";
    if (RATIO_GROUPS.landscape.includes(ratio)) return "landscape";
    return "square";
  });

  const filteredRatios = options.filter((opt) => {
    if (category === "square") return RATIO_GROUPS.square.includes(opt);
    if (category === "portrait") return RATIO_GROUPS.portrait.includes(opt);
    if (category === "landscape") return RATIO_GROUPS.landscape.includes(opt);
    return false;
  });

  const currentIndex = filteredRatios.indexOf(ratio);

  // Preview Box dimensions logic
  const getPreviewDims = () => {
    const [w, h] = ratio === "auto" ? [1, 1] : ratio.split(":").map(Number);
    const max = 40;
    const scale = max / Math.max(w, h);
    return { width: w * scale, height: h * scale };
  };

  const dims = getPreviewDims();

  return (
    <div className="flex items-center gap-5 py-2">
      {/* Left: Preview Area with stacked effect */}
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-transparent">
        {/* Ghost background rectangles for 'stacked' look */}
        <div className="absolute h-10 w-10 rounded-md border border-white/5 bg-white/[0.02] opacity-20" style={{ transform: 'rotate(-8deg) translate(-2px, -2px)' }} />
        <div className="absolute h-10 w-10 rounded-md border border-white/5 bg-white/[0.02] opacity-20" style={{ transform: 'rotate(8deg) translate(2px, 2px)' }} />

        {/* Actual Preview Box */}
        <div
          className="relative flex items-center justify-center rounded-md border border-white/20 bg-white/5 shadow-2xl transition-all duration-300"
          style={{
            width: `${dims.width}px`,
            height: `${dims.height}px`,
          }}
        >
          <span className="text-[10px] font-bold text-white/90">
            {ratio === "auto" ? "1:1" : ratio}
          </span>
        </div>
      </div>

      {/* Right: Controls Area */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Category Toggles */}
        <div className="flex rounded-lg bg-white/[0.03] p-1 shadow-inner">
          {RATIO_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                if (disabled) return;
                setCategory(cat.id);
                const newFiltered = options.filter((opt) => RATIO_GROUPS[cat.id].includes(opt));
                if (newFiltered.length > 0) {
                  onRatioChange(newFiltered[0]);
                }
              }}
              disabled={disabled}
              className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all duration-200 ${category === cat.id
                  ? "bg-[#1e1e28] text-white shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
                  : "text-white/30 hover:text-white/60"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Slider Area */}
        <div className="flex flex-col gap-1.5 px-0.5">
          <input
            type="range"
            min={0}
            max={Math.max(0, filteredRatios.length - 1)}
            value={currentIndex === -1 ? 0 : currentIndex}
            disabled={disabled}
            onChange={(e) => {
              const idx = parseInt(e.target.value);
              if (filteredRatios[idx]) {
                onRatioChange(filteredRatios[idx]);
              }
            }}
            className="slider-white-thumb h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          />
          <style jsx>{`
            .slider-white-thumb::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 12px;
              height: 12px;
              background: #ffffff;
              border-radius: 50%;
              cursor: pointer;
              box-shadow: 0 0 5px rgba(0,0,0,0.3);
            }
            .slider-white-thumb::-moz-range-thumb {
              width: 12px;
              height: 12px;
              background: #ffffff;
              border-radius: 50%;
              cursor: pointer;
              border: none;
              box-shadow: 0 0 5px rgba(0,0,0,0.3);
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
