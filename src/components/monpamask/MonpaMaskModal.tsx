"use client";

import React, { useCallback, useEffect, useMemo, useReducer } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { saveUpload } from "@/lib/libraryApi";
import { MONPA_MASK_PROMPT_FAMILIES } from "@/app/view/HomePage/compo/styles/monpamask/monpaMaskPromptCatalog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store";
import { falGenerate } from "@/store/slices/generationsApi";
import { setFrameSize } from "@/store/slices/generationSlice";
import { downloadAllImageUrls, downloadImageUrl } from "@/components/warli/warliDownload";
import { ModeToggle } from "@/components/warli/ModeToggle";
import { SceneInput } from "@/components/warli/SceneInput";
import { UploadZone } from "@/components/warli/UploadZone";
import { ModelSelector } from "@/components/warli/ModelSelector";
import { SettingsPanel } from "@/components/warli/SettingsPanel";
import { OutputGrid } from "@/components/warli/OutputGrid";
import { PromptPreview } from "@/components/warli/PromptPreview";
import {
  coerceStyleModalResolution,
  coerceWarliAspectRatio,
} from "@/components/warli/warliNanoAspect";
import { FullscreenImageViewer } from "@/components/common/FullscreenImageViewer";
import { MonpaMaskHeader } from "./MonpaMaskHeader";
import {
  INITIAL_STATE,
  MonpaMaskState,
  StyleFamily,
  InputMode,
  ModelId,
  ImageCount,
  AspectRatio,
  MODELS,
  STYLE_LABELS,
} from "./types";

const STYLE_TAG = "MonpaMask";

function toAbsoluteFromProxy(url: string): string {
  try {
    if (!url) return url;
    if (url.startsWith("data:")) return url;
    const ZATA_PREFIX = "https://idr01.zata.ai/devstoragev1/";
    const RESOURCE_SEG = "/api/proxy/resource/";
    if (url.startsWith(RESOURCE_SEG)) {
      const decoded = decodeURIComponent(url.substring(RESOURCE_SEG.length));
      return `${ZATA_PREFIX}${decoded}`;
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const u = new URL(url);
      if (u.pathname.startsWith(RESOURCE_SEG)) {
        const decoded = decodeURIComponent(u.pathname.substring(RESOURCE_SEG.length));
        return `${ZATA_PREFIX}${decoded}`;
      }
    }
    return url;
  } catch {
    return url;
  }
}

async function ensureHostedImageUrl(url: string): Promise<string> {
  const normalized = toAbsoluteFromProxy(String(url || "").trim());
  if (!normalized) return normalized;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  if (normalized.startsWith("data:") || normalized.startsWith("blob:")) {
    const resp = await saveUpload({ url: normalized, type: "image" });
    if (resp.responseStatus === "success" && resp.data?.url) {
      return resp.data.url;
    }
    throw new Error(resp.message || "Failed to prepare input image");
  }
  return normalized;
}

function extractImageUrls(result: unknown): string[] {
  const r = result as { images?: Array<{ url?: string } | string> };
  const imgs = r?.images;
  if (!Array.isArray(imgs)) return [];
  return imgs
    .map((item) => (typeof item === "string" ? item : item?.url))
    .filter((u): u is string => Boolean(u));
}

type Action =
  | { type: "SET_STYLE"; payload: StyleFamily }
  | { type: "SET_MODE"; payload: InputMode }
  | { type: "SET_SCENE_TEXT"; payload: string }
  | { type: "SET_UPLOADED_IMAGE"; payload: string }
  | { type: "SET_IMAGE_NOTE"; payload: string }
  | { type: "SET_MODEL"; payload: ModelId }
  | { type: "SET_RESOLUTION"; payload: string }
  | { type: "SET_COUNT"; payload: ImageCount }
  | { type: "SET_RATIO"; payload: AspectRatio }
  | { type: "SET_INCLUDE_VARIABLE"; payload: boolean }
  | { type: "SET_PANEL_STATE"; payload: MonpaMaskState["panelState"] }
  | { type: "SET_GENERATED_IMAGES"; payload: string[] }
  | { type: "SET_ASSEMBLED_PROMPT"; payload: string }
  | { type: "RESET" };

function reducer(state: MonpaMaskState, action: Action): MonpaMaskState {
  switch (action.type) {
    case "SET_STYLE":
      return { ...state, style: action.payload };
    case "SET_MODE":
      return { ...state, inputMode: action.payload };
    case "SET_SCENE_TEXT":
      return { ...state, sceneText: action.payload };
    case "SET_UPLOADED_IMAGE":
      return { ...state, uploadedImage: action.payload || null };
    case "SET_IMAGE_NOTE":
      return { ...state, imageNote: action.payload };
    case "SET_MODEL": {
      const nextModel = action.payload;
      const nextRatio = coerceWarliAspectRatio(state.ratio, nextModel);
      const nextResolution = coerceStyleModalResolution(state.resolution, nextModel);
      return { ...state, model: nextModel, ratio: nextRatio, resolution: nextResolution };
    }
    case "SET_RESOLUTION":
      return { ...state, resolution: coerceStyleModalResolution(action.payload, state.model) };
    case "SET_COUNT":
      return { ...state, imageCount: action.payload };
    case "SET_RATIO":
      return { ...state, ratio: action.payload };
    case "SET_INCLUDE_VARIABLE":
      return { ...state, includeVariable: Boolean(action.payload) };
    case "SET_PANEL_STATE":
      return { ...state, panelState: action.payload };
    case "SET_GENERATED_IMAGES":
      return { ...state, generatedImages: action.payload };
    case "SET_ASSEMBLED_PROMPT":
      return { ...state, assembledPrompt: action.payload };
    case "RESET":
      return INITIAL_STATE;
    default:
      return state;
  }
}

function buildPrompt(state: MonpaMaskState): string {
  const family = MONPA_MASK_PROMPT_FAMILIES[state.style];
  const aspect = coerceWarliAspectRatio(state.ratio, state.model);

  const projectInputs =
    state.inputMode === "text" ? state.sceneText.trim() : state.imageNote.trim();

  const projectLine = projectInputs
    ? `- ${projectInputs}`
    : "- (none). Do not invent extra figures, props, or environments; keep the ritual object logic minimal and plausible.";

  const variableBlock = state.includeVariable
    ? `\n\nREFERENCE (OPTIONAL) — VARIABLE (slot-based):\n${family.promptVariable.trim()}\n`
    : "";

  return [
    "PRIMARY DIRECTIVE (STYLE LOCK — follow strictly):",
    family.promptHard.trim(),
    variableBlock.trimEnd(),
    "",
    "PROJECT INPUTS:",
    projectLine,
    "",
    "CONTENT CONSTRAINT (STRICT):",
    "- Do not add or invent new people, animals, objects, scenery, borders, symbols, text, ornaments, or background elements unless explicitly requested in PROJECT INPUTS.",
    "- If something is unspecified, omit it rather than guessing.",
    "- Keep the output mask-first, carved woodcraft and ceremonial — not fantasy/horror.",
    "",
    "RENDER SETTINGS:",
    `- Preferred aspect ratio: ${aspect === "auto" ? "auto" : aspect}`,
    `- Preferred resolution: ${state.resolution}`,
    `- Preferred image count: ${state.imageCount}`,
    "- Keep the visible output aligned to WildMind's Monpa mask style experience.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function MonpaMaskModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [state, dispatchLocal] = useReducer(reducer, INITIAL_STATE);
  const [isVisible, setIsVisible] = React.useState(false);
  const [fullscreenUrl, setFullscreenUrl] = React.useState<string | null>(null);

  const nanoBananaGoogleSearch = useAppSelector(
    (s: RootState) => s.generation.nanoBananaGoogleSearch,
  );
  const nanoBananaThinkingLevel = useAppSelector(
    (s: RootState) => s.generation.nanoBananaThinkingLevel,
  );
  const nanoBananaLimitGenerations = useAppSelector(
    (s: RootState) => s.generation.nanoBananaLimitGenerations,
  );
  const outputFormat = useAppSelector((s: RootState) => s.generation.outputFormat || "jpeg");

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }

    dispatchLocal({ type: "RESET" });
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const openTimer = setTimeout(() => setIsVisible(true), 16);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(openTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  const assembledPrompt = useMemo(() => buildPrompt(state), [state]);

  const ratioSummary = useMemo(() => {
    const a = coerceWarliAspectRatio(state.ratio, state.model);
    return a === "auto" ? "auto" : a;
  }, [state.ratio, state.model]);

  const handleRatioChange = useCallback(
    (r: AspectRatio) => {
      dispatchLocal({ type: "SET_RATIO", payload: r });
      dispatch(setFrameSize(r));
    },
    [dispatch],
  );

  const handleGenerate = useCallback(async () => {
    const prompt = buildPrompt(state);
    dispatchLocal({ type: "SET_ASSEMBLED_PROMPT", payload: prompt });
    dispatchLocal({ type: "SET_PANEL_STATE", payload: "loading" });

    const promptForModel = `${prompt} [Style: ${STYLE_TAG}]`;

    let uploadedForFal: string[] = [];
    try {
      if (state.inputMode === "image" && state.uploadedImage?.trim()) {
        const hosted = await ensureHostedImageUrl(state.uploadedImage);
        uploadedForFal = hosted ? [hosted] : [];
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not upload reference image";
      toast.error(msg);
      dispatchLocal({ type: "SET_PANEL_STATE", payload: "empty" });
      return;
    }

    const aspect = coerceWarliAspectRatio(state.ratio, state.model);
    const generationType =
      state.inputMode === "image" && uploadedForFal.length > 0 ? "image-to-image" : "text-to-image";

    try {
      const res = await dispatch(
        falGenerate({
          generationType,
          model: state.model,
          prompt: promptForModel,
          meta: {
            style_premium: true,
            style_key: "monpa_mask",
            style_version: state.style,
            source: "homepage-monpa-mask-modal",
          },
          aspect_ratio: aspect as any,
          num_images: state.imageCount,
          output_format: outputFormat,
          resolution: state.resolution,
          thinking_level: nanoBananaThinkingLevel,
          enable_web_search: nanoBananaGoogleSearch,
          limit_generations: nanoBananaLimitGenerations,
          ...(uploadedForFal.length ? { image_urls: uploadedForFal } : {}),
        }) as any,
      ).unwrap();

      const images = extractImageUrls((res as any)?.data ?? res);
      dispatchLocal({ type: "SET_GENERATED_IMAGES", payload: images });
      dispatchLocal({ type: "SET_PANEL_STATE", payload: images.length ? "results" : "empty" });
      if (!images.length) toast.error("No images returned");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      toast.error(msg);
      dispatchLocal({ type: "SET_PANEL_STATE", payload: "empty" });
    }
  }, [
    dispatch,
    nanoBananaGoogleSearch,
    nanoBananaLimitGenerations,
    nanoBananaThinkingLevel,
    outputFormat,
    state,
  ]);

  const handleRegenerate = useCallback(async () => {
    await handleGenerate();
  }, [handleGenerate]);

  const handleSaveAll = useCallback(async () => {
    const urls = state.generatedImages.filter(Boolean);
    if (!urls.length) return;
    const t = toast.loading("Saving images…");
    try {
      await downloadAllImageUrls(urls, `monpa-mask-${state.style}`);
      toast.dismiss(t);
      toast.success("All downloads started");
    } catch {
      toast.dismiss(t);
      toast.error("Save all failed");
    }
  }, [state.generatedImages, state.style]);

  const handleSaveImage = useCallback(
    async (index: number) => {
      const url = state.generatedImages[index];
      if (!url) return;
      const t = toast.loading("Saving…");
      try {
        await downloadImageUrl(url, `monpa-mask-${state.style}-${index + 1}`);
        toast.dismiss(t);
        toast.success("Download started");
      } catch {
        toast.dismiss(t);
        toast.error("Save failed");
      }
    },
    [state.generatedImages, state.style],
  );

  if (!isOpen) return null;

  const familyMeta = MONPA_MASK_PROMPT_FAMILIES[state.style];
  const styleTitle = `${state.style} · ${familyMeta.chip}`;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/45 p-3 sm:p-6 backdrop-blur-2xl">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Monpa Mask Generator"
        className={`relative flex w-[min(1080px,calc(100vw-24px))] h-[min(760px,calc(100vh-24px))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E12]/95 shadow-[0_24px_70px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.04] transition-all duration-300 ${
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.985]"
        }`}
      >
        <MonpaMaskHeader
 style={state.style}
          onStyleChange={(s) => dispatchLocal({ type: "SET_STYLE", payload: s })}
          onClose={onClose} disabled={state.panelState === "loading"} />

        <div className="grid min-h-0 flex-1 overflow-hidden lg:[grid-template-columns:420px_1fr]">
          <aside className="flex flex-col overflow-hidden border-r border-white/10 bg-[#0E0E12]">
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">
                  Input
                </span>
                <ModeToggle disabled={state.panelState === "loading"}
                  mode={state.inputMode}
                  onChange={(v) => dispatchLocal({ type: "SET_MODE", payload: v })}
                />
              </div>

              {state.inputMode === "text" ? (
                <SceneInput disabled={state.panelState === "loading"}
                  value={state.sceneText}
                  onChange={(v) => dispatchLocal({ type: "SET_SCENE_TEXT", payload: v })}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  <UploadZone disabled={state.panelState === "loading"}
                    uploadedImage={state.uploadedImage}
                    onUpload={(v) => dispatchLocal({ type: "SET_UPLOADED_IMAGE", payload: v })}
                  />
                  <textarea disabled={state.panelState === "loading"}
                    value={state.imageNote}
                    onChange={(e) => dispatchLocal({ type: "SET_IMAGE_NOTE", payload: e.target.value })}
                    rows={3}
                    placeholder="Optional notes... e.g. bold silhouette, carved planes, ritual-facing frontality"
                    className="disabled:opacity-50 disabled:cursor-not-allowed w-full resize-none rounded-xl border border-white/10 bg-[#13131a] px-4 py-3 text-[13px] leading-relaxed text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/20"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">
                  Model
                </span>
                <ModelSelector disabled={state.panelState === "loading"}
                  value={state.model}
                  onChange={(v) => dispatchLocal({ type: "SET_MODEL", payload: v })}
                />
              </div>

              <SettingsPanel disabled={state.panelState === "loading"}
                model={state.model}
                resolution={state.resolution}
                imageCount={state.imageCount}
                ratio={state.ratio}
                includeBenchmark={false}
                includeVariable={state.includeVariable}
                includeRestyle={false}
                onCountChange={(v) => dispatchLocal({ type: "SET_COUNT", payload: v })}
                onResolutionChange={(v) => dispatchLocal({ type: "SET_RESOLUTION", payload: v })}
                onRatioChange={handleRatioChange}
                onIncludeBenchmarkChange={() => {}}
                onIncludeVariableChange={(v) => dispatchLocal({ type: "SET_INCLUDE_VARIABLE", payload: v })}
                onIncludeRestyleChange={() => {}}
              />
            </div>

            <div className="border-t border-white/[0.06] bg-[#0E0E12] px-5 py-4">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={state.panelState === "loading"}
                className="w-full rounded-lg bg-[#2F6BFF] py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#2F6BFF]/90 disabled:opacity-50"
              >
                Generate Monpa Mask
              </button>
            </div>
          </aside>

          <main className="flex min-h-0 flex-col overflow-hidden bg-[#0a0a0f]">
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0E0E12] px-5 py-3.5">
              <span className="text-xs font-medium text-white/25">
                {state.panelState === "results"
                  ? `${state.imageCount} ${state.imageCount === 1 ? "image" : "images"} · ${
                      STYLE_LABELS[state.style].title
                    }`
                  : state.panelState === "loading"
                    ? "Generating..."
                    : "Output will appear here"}
              </span>
              {state.panelState === "results" ? (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => void handleRegenerate()}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/40 transition-all hover:border-white/20 hover:text-white/70"
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveAll()}
                    disabled={!state.generatedImages.some(Boolean)}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/40 transition-all hover:border-white/20 hover:text-white/70 disabled:pointer-events-none disabled:opacity-35"
                  >
                    Save all
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1">
              {state.panelState === "empty" ? (
                <div className="p-5">
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
                  <p className="text-sm font-medium text-white/20">No output yet</p>
                  <p className="max-w-[280px] text-xs leading-relaxed text-white/10">
                    Describe a ritual mask scene (or upload an image), then Generate.
                  </p>
                </div>
                </div>
              ) : null}

              {state.panelState === "loading" ? (
                <div className="p-5">
                  <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
                  <div
                    className={`grid w-full gap-3 ${
                      state.imageCount === 1 ? "grid-cols-1 max-w-lg" : "grid-cols-2"
                    }`}
                  >
                    {Array.from({ length: state.imageCount }).map((_, i) => (
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
              </div>
            ) : null}

              {state.panelState === "results" ? (
                <div className="flex flex-col gap-0">
                  <OutputGrid
                    images={state.generatedImages}
                    count={state.imageCount} ratio={state.ratio}
                    onSaveImage={(i) => void handleSaveImage(i)}
                    onExpandImage={(i) => {
                      const url = state.generatedImages[i];
                      if (!url) return;
                      setFullscreenUrl(url);
                    }}
                  />
                  <div className="px-5 py-5">
                    <PromptPreview prompt={assembledPrompt} />
                  </div>
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </div>

      <FullscreenImageViewer
        isOpen={Boolean(fullscreenUrl)}
        src={fullscreenUrl || ""}
        onClose={() => setFullscreenUrl(null)}
      />
    </div>
  , document.body
  );
}

