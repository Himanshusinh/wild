"use client";

import React from "react";
import { ModeToggle } from "./ModeToggle";
import { SceneInput } from "./SceneInput";
import { UploadZone } from "./UploadZone";
import { VariationSelector } from "./VariationSelector";
import { ModelSelector } from "./ModelSelector";
import { SettingsPanel } from "./SettingsPanel";
import { SelectionSummary } from "./SelectionSummary";
import { GenerateButton } from "./GenerateButton";
import { WarliState, InputMode, Variation, ModelId, ImageCount, AspectRatio } from "./types";

interface WarliLeftPanelProps {
  state: WarliState;
  onModeChange: (v: InputMode) => void;
  onSceneTextChange: (v: string) => void;
  onUpload: (v: string) => void;
  onImageNoteChange: (v: string) => void;
  onVariationChange: (v: Variation) => void;
  onModelChange: (v: ModelId) => void;
  onCountChange: (v: ImageCount) => void;
  onRatioChange: (v: AspectRatio) => void;
  onGenerate: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">
      {children}
    </span>
  );
}

export function WarliLeftPanel({
  state,
  onModeChange,
  onSceneTextChange,
  onUpload,
  onImageNoteChange,
  onVariationChange,
  onModelChange,
  onCountChange,
  onRatioChange,
  onGenerate,
}: WarliLeftPanelProps) {
  const loading = state.panelState === "loading";

  return (
    <aside className="flex flex-col overflow-hidden border-r border-white/10 bg-[#0E0E12]">
      {/* Scrollable area */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1">

        {/* Input mode */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Input</SectionLabel>
          <ModeToggle mode={state.inputMode} onChange={onModeChange} />
        </div>

        {/* Scene / upload */}
        {state.inputMode === "text" ? (
          <SceneInput value={state.sceneText} onChange={onSceneTextChange} />
        ) : (
          <div className="flex flex-col gap-3">
            <UploadZone uploadedImage={state.uploadedImage} onUpload={onUpload} />
            {/* Additional context — always visible in image mode */}
            <textarea
              value={state.imageNote}
              onChange={(e) => onImageNoteChange(e.target.value)}
              rows={3}
              placeholder="Add instructions or context... e.g. focus on the woman's posture, convert to 2D mural, keep park setting"
              className="w-full resize-none rounded-xl border border-white/10 bg-[#13131a] px-4 py-3 text-[13px] leading-relaxed text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/20"
            />
            <p className="px-0.5 text-[11px] text-white/20">
              Optional — describe what you want to emphasize or change.
            </p>
          </div>
        )}

        {/* Variation */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Variation</SectionLabel>
          <VariationSelector value={state.variation} onChange={onVariationChange} />
        </div>

        {/* Model */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Model</SectionLabel>
          <ModelSelector value={state.model} onChange={onModelChange} />
        </div>

        {/* Settings */}
        <SettingsPanel
          imageCount={state.imageCount}
          ratio={state.ratio}
          onCountChange={onCountChange}
          onRatioChange={onRatioChange}
        />
      </div>

      {/* Sticky footer */}
      <SelectionSummary
        style={state.style}
        variation={state.variation}
        model={state.model}
        imageCount={state.imageCount}
        ratio={state.ratio}
      />
      <GenerateButton imageCount={state.imageCount} loading={loading} onClick={onGenerate} />
    </aside>
  );
}
