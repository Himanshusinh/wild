"use client";

import React, { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveAutoResumeIntent } from "@/lib/autoResume";
import { saveStudioDraft } from "@/lib/studioDraft";
import { WARLI_PROMPT_FAMILIES } from "@/app/view/HomePage/compo/warliPromptCatalog";
import { WarliHeader } from "./WarliHeader";
import { WarliLeftPanel } from "./WarliLeftPanel";
import { WarliRightPanel } from "./WarliRightPanel";
import {
  INITIAL_STATE,
  WarliState,
  StyleFamily,
  InputMode,
  Variation,
  ModelId,
  ImageCount,
  AspectRatio,
} from "./types";

// ─── State reducer ────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_STYLE"; payload: StyleFamily }
  | { type: "SET_MODE"; payload: InputMode }
  | { type: "SET_SCENE_TEXT"; payload: string }
  | { type: "SET_UPLOADED_IMAGE"; payload: string }
  | { type: "SET_IMAGE_NOTE"; payload: string }
  | { type: "SET_VARIATION"; payload: Variation }
  | { type: "SET_MODEL"; payload: ModelId }
  | { type: "SET_COUNT"; payload: ImageCount }
  | { type: "SET_RATIO"; payload: AspectRatio }
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
    case "SET_VARIATION":
      return { ...state, variation: action.payload };
    case "SET_MODEL":
      return { ...state, model: action.payload };
    case "SET_COUNT":
      return { ...state, imageCount: action.payload };
    case "SET_RATIO":
      return { ...state, ratio: action.payload };
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

function buildPrompt(state: WarliState): string {
  const family = WARLI_PROMPT_FAMILIES[state.style];
  const variant = family.variations[state.variation];
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
      : "- Use the benchmark Warli scene guidance and locked style instructions above as the base composition.";

  return [
    variant.prompt.trim(),
    "",
    "BENCHMARK SCENE:",
    family.benchmarkScene.trim(),
    "",
    "PROJECT INPUTS:",
    sceneSection,
    "",
    "RENDER SETTINGS:",
    `- Preferred aspect ratio: ${state.ratio}`,
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
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [isVisible, setIsVisible] = React.useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal open/close lifecycle
  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }

    dispatch({ type: "RESET" });

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
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [isOpen, onClose]);

  // Keep prompt in sync
  const assembledPrompt = useMemo(() => buildPrompt(state), [state]);

  const handleGenerate = useCallback(() => {
    const prompt = buildPrompt(state);
    dispatch({ type: "SET_ASSEMBLED_PROMPT", payload: prompt });
    dispatch({ type: "SET_PANEL_STATE", payload: "loading" });

    // Seam: replace setTimeout with real API call when backend is ready
    // Example: generateWarliArt({ prompt, model: state.model, ... })
    //   .then(images => dispatch({ type: "SET_GENERATED_IMAGES", payload: images }))
    //   .catch(err => dispatch({ type: "SET_PANEL_STATE", payload: "empty" }))
    loadingTimerRef.current = setTimeout(() => {
      dispatch({ type: "SET_PANEL_STATE", payload: "results" });
      dispatch({ type: "SET_GENERATED_IMAGES", payload: [] }); // placeholder — real API fills this
    }, 2800);
  }, [state]);

  const handleRegenerate = useCallback(() => {
    dispatch({ type: "SET_PANEL_STATE", payload: "empty" });
    setTimeout(() => handleGenerate(), 50);
  }, [handleGenerate]);

  const handleOpenStudio = useCallback(() => {
    const prompt = assembledPrompt;
    const payload = {
      prompt,
      model: state.model,
      imageCount: state.imageCount,
      frameSize: state.ratio,
      style: "Warli",
      metadata: {
        source: "homepage-warli-modal",
        warliType: state.style,
        warliVariation: state.variation,
      },
    };
    saveStudioDraft(payload);
    saveAutoResumeIntent("image", payload);
    router.push("/text-to-image");
  }, [assembledPrompt, state, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 p-6 backdrop-blur-xl">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      {/* Modal container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Warli Generator"
        className={`relative flex h-full w-full max-h-[calc(100vh-48px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E12] shadow-[0_32px_80px_rgba(0,0,0,0.85)] transition-all duration-300 ${
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.985]"
        }`}
      >
        {/* Header — full width */}
        <WarliHeader
          style={state.style}
          onStyleChange={(s) => dispatch({ type: "SET_STYLE", payload: s })}
          onClose={onClose}
        />

        {/* Body — left panel + right panel */}
        <div className="grid flex-1 overflow-hidden" style={{ gridTemplateColumns: "420px 1fr" }}>
          <WarliLeftPanel
            state={state}
            onModeChange={(v) => dispatch({ type: "SET_MODE", payload: v })}
            onSceneTextChange={(v) => dispatch({ type: "SET_SCENE_TEXT", payload: v })}
            onUpload={(v) => dispatch({ type: "SET_UPLOADED_IMAGE", payload: v })}
            onImageNoteChange={(v) => dispatch({ type: "SET_IMAGE_NOTE", payload: v })}
            onVariationChange={(v) => dispatch({ type: "SET_VARIATION", payload: v })}
            onModelChange={(v) => dispatch({ type: "SET_MODEL", payload: v })}
            onCountChange={(v) => dispatch({ type: "SET_COUNT", payload: v })}
            onRatioChange={(v) => dispatch({ type: "SET_RATIO", payload: v })}
            onGenerate={handleGenerate}
          />

          <WarliRightPanel
            panelState={state.panelState}
            generatedImages={state.generatedImages}
            imageCount={state.imageCount}
            assembledPrompt={assembledPrompt}
            style={state.style}
            variation={state.variation}
            onRegenerate={handleRegenerate}
          />
        </div>
      </div>
    </div>
  );
}
