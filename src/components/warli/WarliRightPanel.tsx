"use client";

import React from "react";
import { RefreshCw, Download } from "lucide-react";
import { OutputGrid } from "./OutputGrid";
import { PromptPreview } from "./PromptPreview";
import { RightPanelState, StyleFamily, ImageCount, ModelId, MODELS } from "./types";

interface WarliRightPanelProps {
  panelState: RightPanelState;
  generatedImages: string[];
  imageCount: ImageCount;
  assembledPrompt: string;
  style: StyleFamily;
  model: ModelId;
  onRegenerate: () => void;
  onSaveAll: () => void;
  onSaveImage: (index: number) => void;
  onExpandImage: (index: number) => void;
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
      <p className="text-sm font-medium text-white/20">Your Warli art will appear here</p>
      <p className="max-w-[200px] text-xs leading-relaxed text-white/10">
        Describe a scene or upload a photo, then hit Generate
      </p>
    </div>
  );
}

function LoadingState({ imageCount }: { imageCount: ImageCount }) {
  const slots = Array.from({ length: imageCount });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div
        className={`grid w-full gap-3 ${
          imageCount === 1 ? "grid-cols-1 max-w-lg" : "grid-cols-2"
        }`}
      >
        {slots.map((_, i) => (
          <div
            key={i}
            className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[#111117]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/styles/Logo.gif"
              alt="Generating..."
              className="h-16 w-16 object-contain opacity-40"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <p className="text-[11px] text-white/20">Generating Warli art...</p>
    </div>
  );
}

function ResultsState({
  images,
  imageCount,
  assembledPrompt,
  onSaveImage,
  onExpandImage,
}: {
  images: string[];
  imageCount: ImageCount;
  assembledPrompt: string;
  onSaveImage: (index: number) => void;
  onExpandImage: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <OutputGrid
        images={images}
        count={imageCount}
        onSaveImage={onSaveImage}
        onExpandImage={onExpandImage}
      />
      <PromptPreview prompt={assembledPrompt} />
    </div>
  );
}

function modelShortLabel(model: ModelId): string {
  return MODELS.find((m) => m.id === model)?.label ?? model;
}

export function WarliRightPanel({
  panelState,
  generatedImages,
  imageCount,
  assembledPrompt,
  style,
  model,
  onRegenerate,
  onSaveAll,
  onSaveImage,
  onExpandImage,
}: WarliRightPanelProps) {
  const modelLabel = modelShortLabel(model);
  const rightTitle =
    panelState === "empty"
      ? "Output will appear here"
      : panelState === "loading"
        ? "Generating..."
        : `${imageCount} ${imageCount === 1 ? "image" : "images"} · ${style} · ${modelLabel}`;

  const hasImages = generatedImages.some(Boolean);

  return (
    <main className="flex min-h-0 flex-col overflow-hidden bg-[#0a0a0f]">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0E0E12] px-5 py-3.5">
        <span className="text-xs font-medium text-white/25">{rightTitle}</span>

        {panelState === "results" && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onRegenerate}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/40 transition-all hover:border-white/20 hover:text-white/70"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
            <button
              type="button"
              disabled={!hasImages}
              onClick={onSaveAll}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/40 transition-all hover:border-white/20 hover:text-white/70 disabled:pointer-events-none disabled:opacity-35"
            >
              <Download className="h-3 w-3" />
              Save all
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-5 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1">
        {panelState === "empty" && <EmptyState />}
        {panelState === "loading" && <LoadingState imageCount={imageCount} />}
        {panelState === "results" && (
          <ResultsState
            images={generatedImages}
            imageCount={imageCount}
            assembledPrompt={assembledPrompt}
            onSaveImage={onSaveImage}
            onExpandImage={onExpandImage}
          />
        )}
      </div>
    </main>
  );
}
