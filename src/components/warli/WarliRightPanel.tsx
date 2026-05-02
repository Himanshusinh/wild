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
  ratio: string;
  onRegenerate: () => void;
  onSaveAll: () => void;
  onSaveImage: (index: number) => void;
  onExpandImage: (index: number) => void;
}

const TEST_IMAGES: Record<StyleFamily, string> = {
  V1: "/HomePage/creativeStyle/warlistyles/warliv1.jpg",
  V2: "/HomePage/creativeStyle/warlistyles/warliv2.jpg",
  V3: "/HomePage/creativeStyle/warlistyles/warliv3.jpg",
};

const DEFAULT_THUMBNAIL = "/HomePage/creativeStyle/warlistyles/warlistyle.png";

function EmptyState({ style, hoveredStyle, onExpand }: { style: StyleFamily; hoveredStyle: StyleFamily | null; onExpand: (url: string) => void }) {
  const testImageUrl = hoveredStyle ? TEST_IMAGES[hoveredStyle] : DEFAULT_THUMBNAIL;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="group relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/5 bg-black/40">
        <div className="aspect-[2/3] w-full overflow-hidden">
          <img
            src={testImageUrl}
            alt="Warli Style Preview"
            className="h-full w-full cursor-zoom-in object-cover transition-transform duration-700 group-hover:scale-105"
            onMouseEnter={() => onExpand(testImageUrl)}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            {hoveredStyle ? `${hoveredStyle} Preview` : "Warli Styles Overview"}
          </p>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        <p className="text-[13px] font-medium text-white/40">No output yet</p>
        <p className="text-[11px] text-white/20">
          Hover over V1, V2, or V3 to preview styles
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
  onExpandImage: (index: number) => void;
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
            <EmptyState
              style={style}
              hoveredStyle={hoveredStyle}
              onExpand={(url) => onExpandImage(-1, url)}
            />
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
