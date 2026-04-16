"use client";

import React, { useCallback, useEffect, useMemo, useReducer } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveAutoResumeIntent } from "@/lib/autoResume";
import { saveStudioDraft } from "@/lib/studioDraft";
import { saveUpload } from "@/lib/libraryApi";
import { WARLI_PROMPT_FAMILIES } from "@/app/view/HomePage/compo/warliPromptCatalog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store";
import { falGenerate } from "@/store/slices/generationsApi";
import { setFrameSize } from "@/store/slices/generationSlice";
import { WarliHeader } from "./WarliHeader";
import { WarliLeftPanel } from "./WarliLeftPanel";
import { WarliRightPanel } from "./WarliRightPanel";
import {
  INITIAL_STATE,
  WarliState,
  StyleFamily,
  InputMode,
  ModelId,
  ImageCount,
  AspectRatio,
} from "./types";
import { coerceWarliAspectRatio } from "./warliNanoAspect";
import { downloadAllImageUrls, downloadImageUrl } from "./warliDownload";

const STYLE_TAG = "Warli";

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

// ─── State reducer ────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_STYLE"; payload: StyleFamily }
  | { type: "SET_MODE"; payload: InputMode }
  | { type: "SET_SCENE_TEXT"; payload: string }
  | { type: "SET_UPLOADED_IMAGE"; payload: string }
  | { type: "SET_IMAGE_NOTE"; payload: string }
  | { type: "SET_MODEL"; payload: ModelId }
  | { type: "SET_COUNT"; payload: ImageCount }
  | { type: "SET_RATIO"; payload: AspectRatio }
  | { type: "SET_INCLUDE_BENCHMARK"; payload: boolean }
  | { type: "SET_INCLUDE_VARIABLE"; payload: boolean }
  | { type: "SET_INCLUDE_RESTYLE"; payload: boolean }
  | { type: "SET_PANEL_STATE"; payload: WarliState["panelState"] }
  | { type: "SET_GENERATED_IMAGES"; payload: string[] }
  | { type: "SET_ASSEMBLED_PROMPT"; payload: string }
  | { type: "RESET" };

function reducer(state: WarliState, action: Action): WarliState {
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
      return { ...state, model: nextModel, ratio: nextRatio };
    }
    case "SET_COUNT":
      return { ...state, imageCount: action.payload };
    case "SET_RATIO":
      return { ...state, ratio: action.payload };
    case "SET_INCLUDE_BENCHMARK":
      return { ...state, includeBenchmark: Boolean(action.payload) };
    case "SET_INCLUDE_VARIABLE":
      return { ...state, includeVariable: Boolean(action.payload) };
    case "SET_INCLUDE_RESTYLE":
      return { ...state, includeRestyle: Boolean(action.payload) };
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

// ─── Prompt assembly ──────────────────────────────────────────────────────────

function compactWarliStyleLock(template: string): string {
  const t0 = String(template || "").trim();
  if (!t0) return t0;

  const start = t0.indexOf("DETAIL RULE:");
  const end = t0.indexOf("NEGATIVE LOCK:");
  if (start >= 0 && end > start) {
    const before = t0.slice(0, start).trimEnd();
    const after = t0.slice(end).trimStart();
    return `${before}\n\n${after}`.trim();
  }
  return t0;
}

function buildPrompt(state: WarliState): string {
  const family = WARLI_PROMPT_FAMILIES[state.style];
  const sceneLines: string[] = [];

  if (state.inputMode === "text" && state.sceneText.trim()) {
    sceneLines.push(`- Scene description: ${state.sceneText.trim()}`);
  }
  if (state.inputMode === "image" && state.imageNote.trim()) {
    sceneLines.push(`- Additional instructions: ${state.imageNote.trim()}`);
  }

  const sceneSection =
    sceneLines.length > 0
      ? sceneLines.join("\n")
      : "- Scene description: (none). Do not invent any scene content; keep output minimal and style-accurate only.";

  const aspectForPrompt = coerceWarliAspectRatio(state.ratio, state.model);
  const ratioLine =
    aspectForPrompt === "auto"
      ? "auto (API: model chooses aspect from prompt)"
      : aspectForPrompt;

  const styleLock = compactWarliStyleLock(family.promptTemplate);
  const extraBlocks: string[] = [];
  if (state.includeBenchmark) {
    extraBlocks.push("REFERENCE (OPTIONAL) — BENCHMARK SCENE:");
    extraBlocks.push(family.benchmarkScene.trim());
    extraBlocks.push("");
  }
  if (state.includeVariable) {
    extraBlocks.push("REFERENCE (OPTIONAL) — VARIABLE (slot-based):");
    extraBlocks.push(family.promptVariable.trim());
    extraBlocks.push("");
  }
  if (state.includeRestyle) {
    extraBlocks.push("REFERENCE (OPTIONAL) — RESTYLE:");
    extraBlocks.push(family.promptRestyle.trim());
    extraBlocks.push("");
  }

  return [
    "PRIMARY DIRECTIVE (STYLE LOCK — follow strictly):",
    styleLock,
    "",
    ...(extraBlocks.length > 0 ? extraBlocks : []),
    "PROJECT INPUTS:",
    sceneSection,
    "",
    "CONTENT CONSTRAINT (STRICT):",
    "- Do not add or invent new people, animals, objects, scenery, borders, symbols, text, ornaments, or background elements unless explicitly requested in PROJECT INPUTS.",
    "- If something is unspecified, omit it rather than guessing.",
    "- Keep composition simple; avoid decorative fillers unless requested.",
    "",
    "RENDER SETTINGS:",
    `- Preferred aspect ratio: ${ratioLine}`,
    `- Preferred image count: ${state.imageCount}`,
    "- Keep the visible output aligned to WildMind's Warli style experience.",
  ].join("\n");
}

// ─── Main modal component ─────────────────────────────────────────────────────

interface WarliModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WarliModal({ isOpen, onClose }: WarliModalProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [state, dispatchLocal] = useReducer(reducer, INITIAL_STATE);
  const [isVisible, setIsVisible] = React.useState(false);

  const nanoBananaResolution = useAppSelector(
    (s: RootState) => s.generation.nanoBananaResolution || "1K",
  );
  const nanoBananaGoogleSearch = useAppSelector((s: RootState) => s.generation.nanoBananaGoogleSearch);
  const nanoBananaThinkingLevel = useAppSelector((s: RootState) => s.generation.nanoBananaThinkingLevel);
  const nanoBananaLimitGenerations = useAppSelector((s: RootState) => s.generation.nanoBananaLimitGenerations);
  const outputFormat = useAppSelector((s: RootState) => s.generation.outputFormat || "jpeg");

  // Modal open/close lifecycle
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
      if (state.model === "google/nano-banana-pro") {
        const prepared = uploadedForFal.map((u) => toAbsoluteFromProxy(u));
        const result = await dispatch(
          falGenerate({
            prompt: promptForModel,
            userPrompt: prompt,
            model: "google/nano-banana-pro",
            meta: {
              style_premium: true,
              style_key: "warli",
              style_version: state.style,
              source: "homepage-warli-modal",
            },
            num_images: state.imageCount,
            aspect_ratio: aspect as any,
            resolution: "2K",
            uploadedImages: prepared,
            output_format: outputFormat,
            generationType,
          }),
        ).unwrap();

        const urls = extractImageUrls(result);
        dispatchLocal({ type: "SET_GENERATED_IMAGES", payload: urls });
        dispatchLocal({ type: "SET_PANEL_STATE", payload: "results" });
        return;
      }

      const result = await dispatch(
        falGenerate({
          prompt: promptForModel,
          userPrompt: prompt,
          model: "google/nano-banana-2",
          meta: {
            style_premium: true,
            style_key: "warli",
            style_version: state.style,
            source: "homepage-warli-modal",
          },
          num_images: state.imageCount,
          aspect_ratio: aspect as any,
          resolution: nanoBananaResolution,
          enable_web_search: nanoBananaGoogleSearch,
          thinking_level: nanoBananaThinkingLevel,
          limit_generations: nanoBananaLimitGenerations,
          uploadedImages: uploadedForFal,
          output_format: outputFormat,
          generationType,
        }),
      ).unwrap();

      const urls = extractImageUrls(result);
      dispatchLocal({ type: "SET_GENERATED_IMAGES", payload: urls });
      dispatchLocal({ type: "SET_PANEL_STATE", payload: "results" });
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message || "Generation failed");
      dispatchLocal({ type: "SET_PANEL_STATE", payload: "empty" });
    }
  }, [
    state,
    dispatch,
    nanoBananaResolution,
    nanoBananaGoogleSearch,
    nanoBananaThinkingLevel,
    nanoBananaLimitGenerations,
    outputFormat,
  ]);

  const handleRegenerate = useCallback(() => {
    dispatchLocal({ type: "SET_PANEL_STATE", payload: "empty" });
    setTimeout(() => void handleGenerate(), 50);
  }, [handleGenerate]);

  const handleSaveImage = useCallback(
    async (index: number) => {
      const url = state.generatedImages[index];
      if (!url) {
        toast.error("Nothing to save for this slot");
        return;
      }
      try {
        await downloadImageUrl(url, `warli-${state.style}-${index + 1}`);
        toast.success("Download started");
      } catch {
        toast.error("Could not save image");
      }
    },
    [state.generatedImages, state.style],
  );

  const handleExpandImage = useCallback(
    (index: number) => {
      const url = state.generatedImages[index];
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [state.generatedImages],
  );

  const handleSaveAll = useCallback(async () => {
    const urls = state.generatedImages.filter(Boolean);
    if (!urls.length) {
      toast.error("No images to download");
      return;
    }
    const t = toast.loading("Saving images…");
    try {
      await downloadAllImageUrls(urls, `warli-${state.style}`);
      toast.dismiss(t);
      toast.success("All downloads started");
    } catch {
      toast.dismiss(t);
      toast.error("Save all failed");
    }
  }, [state.generatedImages, state.style]);

  const handleOpenStudio = useCallback(async () => {
    const prompt = assembledPrompt;
    let uploadedImages: string[] | undefined;

    try {
      if (state.inputMode === "image" && state.uploadedImage?.trim()) {
        const hosted = await ensureHostedImageUrl(state.uploadedImage);
        if (hosted) uploadedImages = [hosted];
      }
    } catch {
      toast.error("Could not prepare reference image for studio");
      return;
    }

    const frameForDraft = coerceWarliAspectRatio(state.ratio, state.model);

    const payload = {
      prompt,
      model: state.model,
      imageCount: state.imageCount,
      frameSize: frameForDraft,
      style: "Warli",
      ...(uploadedImages?.length ? { uploadedImages } : {}),
      metadata: {
        source: "homepage-warli-modal",
        warliType: state.style,
        warliModal: true,
      },
    };
    saveStudioDraft(payload);
    saveAutoResumeIntent("image", payload);
    router.push("/text-to-image");
  }, [assembledPrompt, state, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-3 sm:p-6 backdrop-blur-2xl">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Warli Generator"
        className={`relative flex w-[min(1080px,calc(100vw-24px))] h-[min(760px,calc(100vh-24px))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f]/95 shadow-[0_24px_70px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.04] transition-all duration-300 ${
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.985]"
        }`}
      >
        <WarliHeader
          style={state.style}
          onStyleChange={(s) => dispatchLocal({ type: "SET_STYLE", payload: s })}
          onClose={onClose}
        />

        <div className="grid min-h-0 flex-1 overflow-hidden lg:[grid-template-columns:420px_1fr]">
          <WarliLeftPanel
            state={state}
            ratioSummary={ratioSummary}
            onModeChange={(v) => dispatchLocal({ type: "SET_MODE", payload: v })}
            onSceneTextChange={(v) => dispatchLocal({ type: "SET_SCENE_TEXT", payload: v })}
            onUpload={(v) => dispatchLocal({ type: "SET_UPLOADED_IMAGE", payload: v })}
            onImageNoteChange={(v) => dispatchLocal({ type: "SET_IMAGE_NOTE", payload: v })}
            onModelChange={(v) => dispatchLocal({ type: "SET_MODEL", payload: v })}
            onCountChange={(v) => dispatchLocal({ type: "SET_COUNT", payload: v })}
            onRatioChange={handleRatioChange}
            onIncludeBenchmarkChange={(v) =>
              dispatchLocal({ type: "SET_INCLUDE_BENCHMARK", payload: v })
            }
            onIncludeVariableChange={(v) =>
              dispatchLocal({ type: "SET_INCLUDE_VARIABLE", payload: v })
            }
            onIncludeRestyleChange={(v) =>
              dispatchLocal({ type: "SET_INCLUDE_RESTYLE", payload: v })
            }
            onGenerate={() => void handleGenerate()}
            onOpenStudio={() => void handleOpenStudio()}
          />

          <WarliRightPanel
            panelState={state.panelState}
            generatedImages={state.generatedImages}
            imageCount={state.imageCount}
            assembledPrompt={assembledPrompt}
            style={state.style}
            model={state.model}
            onRegenerate={() => void handleRegenerate()}
            onSaveAll={() => void handleSaveAll()}
            onSaveImage={(i) => void handleSaveImage(i)}
            onExpandImage={handleExpandImage}
          />
        </div>
      </div>
    </div>
  );
}
