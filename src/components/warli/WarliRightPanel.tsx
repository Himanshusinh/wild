"use client";

import React from "react";
import { RefreshCw, Download } from "lucide-react";
import { OutputGrid } from "./OutputGrid";
import { PromptPreview } from "./PromptPreview";
import { CREATIVE_STYLE_IMAGE_BASE } from "@/constants/creativeStyleCdn";
import { RightPanelState, StyleFamily, ImageCount, ModelId, MODELS } from "./types";

interface WarliRightPanelProps {
  panelState: RightPanelState;
  generatedImages: string[];
  imageCount: ImageCount;
  assembledPrompt: string;
  style: StyleFamily;
  hoveredStyle: StyleFamily | null;
  model: ModelId;
  ratio: string;
  onRegenerate: () => void;
  onSaveAll: () => void;
  onSaveImage: (index: number) => void;
  /** Optional `previewUrl` for empty-state sample images (not in `generatedImages`). */
  onExpandImage: (index: number, previewUrl?: string) => void;
}

const TEST_IMAGES: Record<StyleFamily, string> = {
  V1: `${CREATIVE_STYLE_IMAGE_BASE}warlistyles/warliv1.jpg`,
  V2: `${CREATIVE_STYLE_IMAGE_BASE}warlistyles/warliv2.jpg`,
  V3: `${CREATIVE_STYLE_IMAGE_BASE}warlistyles/warliv3.jpg`,
};

const DEFAULT_THUMBNAIL = `${CREATIVE_STYLE_IMAGE_BASE}warlistyles/warlistyle.png`;

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-white/20">No output yet</p>
        <p className="max-w-[280px] text-xs leading-relaxed text-white/10">
          Describe a Warli scene (or upload an image), then Generate.
        </p>
      </div>
    </div>
  );
}

function LoadingState({ imageCount }: { imageCount: ImageCount }) {
  const slots = Array.from({ length: imageCount });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div
        className={`grid w-full gap-3 ${imageCount === 1 ? "grid-cols-1 max-w-lg" : "grid-cols-2"
          }`}
      >
        {slots.map((_, i) => (
          <div
            key={i}
            className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-transparent"
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

    </div>
  );
}

function ResultsState({
  images,
  imageCount,
  assembledPrompt,
  ratio,
  onSaveImage,
  onExpandImage,
}: {
  images: string[];
  imageCount: ImageCount;
  assembledPrompt: string;
  ratio: string;
  onSaveImage: (index: number) => void;
  onExpandImage: (index: number, previewUrl?: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0">
      <OutputGrid
        images={images}
        count={imageCount}
        ratio={ratio}
        onSaveImage={onSaveImage}
        onExpandImage={onExpandImage}
      />
      <div className="px-5 py-5">
        <PromptPreview prompt={assembledPrompt} />
      </div>
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
  hoveredStyle,
  model,
  ratio,
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
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0a0a0f] px-5 py-3.5">
        <span className="text-xs font-medium text-white/25">{rightTitle}</span>

        {panelState === "results" && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onRegenerate}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-[11px] font-medium text-white/40 transition-all hover:border-white/20 hover:text-white/70"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
            <button
              type="button"
              disabled={!hasImages}
              onClick={onSaveAll}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-[11px] font-medium text-white/40 transition-all hover:border-white/20 hover:text-white/70 disabled:pointer-events-none disabled:opacity-35"
            >
              <Download className="h-3 w-3" />
              Save all
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1">
        {panelState === "empty" && (
          <div className="p-5">
            <EmptyState />
          </div>
        )}
        {panelState === "loading" && <div className="p-5"><LoadingState imageCount={imageCount} /></div>}
        {panelState === "results" && (
          <ResultsState
            images={generatedImages}
            imageCount={imageCount}
            ratio={ratio}
            assembledPrompt={assembledPrompt}
            onSaveImage={onSaveImage}
            onExpandImage={onExpandImage}
          />
        )}
      </div>
    </main>
  );
}
