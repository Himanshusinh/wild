"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
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
}

function DropdownSelector<T extends string | number>({
  items,
  value,
  onChange,
  renderLabel,
}: {
  items: readonly T[];
  value: T;
  onChange: (v: T) => void;
  renderLabel: (v: T) => string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-150 ${
          open
            ? "border-white/20 bg-transparent"
            : "border-white/10 bg-transparent hover:border-white/15"
        }`}
      >
        <span className="font-medium text-white/80">{renderLabel(value)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#0a0a0f]/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.6)] [scrollbar-width:thin]">
          {items.map((item) => {
            const isActive = item === value;
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-sm transition-colors duration-100 ${
                  isActive
                    ? "bg-[#2F6BFF]/10 text-white"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white/85"
                }`}
              >
                <span className="font-medium">{renderLabel(item)}</span>
                {isActive && <Check className="h-3 w-3 text-[#2F6BFF]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
          : "border-white/10 bg-transparent text-white/30 hover:border-white/20 hover:text-white/60"
      }`}
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
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25">Count</span>
        <DropdownSelector
          items={IMAGE_COUNTS as unknown as number[]}
          value={imageCount}
          onChange={(v) => onCountChange(v as ImageCount)}
          renderLabel={(v) => v.toString()}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25">
          Ratio ({model === "google/nano-banana-pro" ? "Pro" : "Nano 2"})
        </span>
        <DropdownSelector
          items={ratioOptions}
          value={ratio}
          onChange={(v) => onRatioChange(v as AspectRatio)}
          renderLabel={(v) => (v === "auto" ? "Auto" : String(v))}
        />
      </div>

      <details className="rounded-xl border border-white/[0.06] bg-transparent px-3 py-2">
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
