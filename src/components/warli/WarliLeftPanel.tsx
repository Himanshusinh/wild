"use client";

import React from "react";
import { ModeToggle } from "./ModeToggle";
import { SceneInput } from "./SceneInput";
import { UploadZone } from "./UploadZone";
import { ModelSelector } from "./ModelSelector";
import { SettingsPanel } from "./SettingsPanel";
import { GenerateButton } from "./GenerateButton";
import { SelectionSummary } from "./SelectionSummary";
import { WarliState, InputMode, ModelId, ImageCount, AspectRatio } from "./types";

interface WarliLeftPanelProps {
  state: WarliState;
  ratioSummary: string;
  onModeChange: (v: InputMode) => void;
  onSceneTextChange: (v: string) => void;
  onUpload: (v: string) => void;
  onImageNoteChange: (v: string) => void;
  onModelChange: (v: ModelId) => void;
  onResolutionChange: (v: string) => void;
  onCountChange: (v: ImageCount) => void;
  onRatioChange: (v: AspectRatio) => void;
  onIncludeBenchmarkChange: (v: boolean) => void;
  onIncludeVariableChange: (v: boolean) => void;
  onIncludeRestyleChange: (v: boolean) => void;
  onGenerate: () => void;
  onOpenStudio: () => void;
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
  ratioSummary,
  onModeChange,
  onSceneTextChange,
  onUpload,
  onImageNoteChange,
  onModelChange,
  onResolutionChange,
  onCountChange,
  onRatioChange,
  onIncludeBenchmarkChange,
  onIncludeVariableChange,
  onIncludeRestyleChange,
  onGenerate,
  onOpenStudio,
}: WarliLeftPanelProps) {
  const loading = state.panelState === "loading";

  return (
    <aside className="flex flex-col overflow-hidden border-r border-white/10 bg-[#0a0a0f]">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1">
        <div className="flex flex-col gap-2">
          <SectionLabel>Input</SectionLabel>
          <ModeToggle mode={state.inputMode} onChange={onModeChange} />
        </div>

        {state.inputMode === "text" ? (
          <SceneInput value={state.sceneText} onChange={onSceneTextChange} />
        ) : (
          <div className="flex flex-col gap-3">
            <UploadZone uploadedImage={state.uploadedImage} onUpload={onUpload} />
            <textarea
              value={state.imageNote}
              onChange={(e) => onImageNoteChange(e.target.value)}
              rows={3}
              placeholder="Add instructions or context... e.g. focus on the woman's posture, convert to 2D mural, keep park setting"
              className="w-full resize-none rounded-xl border border-white/10 bg-transparent px-4 py-3 text-[13px] leading-relaxed text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/20"
            />
            <p className="px-0.5 text-[11px] text-white/20">
              Optional — describe what you want to emphasize or change.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <SectionLabel>Model</SectionLabel>
          <ModelSelector value={state.model} onChange={onModelChange} />
        </div>

        <SettingsPanel
          model={state.model}
          resolution={state.resolution}
          imageCount={state.imageCount}
          ratio={state.ratio}
          includeBenchmark={state.includeBenchmark}
          includeVariable={state.includeVariable}
          includeRestyle={state.includeRestyle}
          onCountChange={onCountChange}
          onResolutionChange={onResolutionChange}
          onRatioChange={onRatioChange}
          onIncludeBenchmarkChange={onIncludeBenchmarkChange}
          onIncludeVariableChange={onIncludeVariableChange}
          onIncludeRestyleChange={onIncludeRestyleChange}
        />
      </div>

      <SelectionSummary
        style={state.style}
        model={state.model}
        resolution={state.resolution}
        imageCount={state.imageCount}
        ratioSummary={ratioSummary}
      />
      <GenerateButton imageCount={state.imageCount} loading={loading} onClick={onGenerate} />
    </aside>
  );
}
