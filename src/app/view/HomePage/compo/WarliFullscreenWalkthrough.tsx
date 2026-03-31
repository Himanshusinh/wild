'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  LayoutTemplate,
  Mountain,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { saveAutoResumeIntent } from "@/lib/autoResume";
import { saveStudioDraft } from "@/lib/studioDraft";
import {
  WARLI_PROMPT_FAMILIES,
  WARLI_PROMPT_FAMILY_LIST,
  type WarliStyleType,
  type WarliVariationKey,
} from "./warliPromptCatalog";

interface WarliFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

type WarliModelId = "flux-2-pro" | "seedream-4.5" | "imagen-4";
type QualityPreset = "Balanced" | "High" | "Premium";
type AspectRatio = "1:1" | "4:5" | "16:9" | "9:16";

interface WarliFormState {
  model: WarliModelId;
  imageCount: number;
  frameSize: AspectRatio;
  quality: QualityPreset;
  primarySubject: string;
  supportingSubjects: string;
  keyObject: string;
  environment: string;
  preserveIntent: string;
  additionalNotes: string;
}

const STEP_LABELS = [
  { id: 1, label: "Style Type", description: "Choose the Warli rendering family" },
  { id: 2, label: "Variation", description: "Pick the prompt structure you want to use" },
  { id: 3, label: "Configure", description: "Set model and scene inputs" },
  { id: 4, label: "Generate", description: "Review the package and open the studio" },
] as const;

const MODEL_OPTIONS: Array<{
  id: WarliModelId;
  label: string;
  badge: string;
  description: string;
}> = [
  {
    id: "flux-2-pro",
    label: "Flux 2 Pro",
    badge: "Detailed",
    description: "Best fit for premium style exploration with strong prompt fidelity.",
  },
  {
    id: "seedream-4.5",
    label: "Seedream 4.5",
    badge: "Balanced",
    description: "Reliable detail and good material handling for Warli-derived scenes.",
  },
  {
    id: "imagen-4",
    label: "Imagen 4",
    badge: "Clean",
    description: "Clean composition for environment-heavy prompts and readable layouts.",
  },
] as const;

const QUALITY_OPTIONS: QualityPreset[] = ["Balanced", "High", "Premium"];
const ASPECT_RATIO_OPTIONS: AspectRatio[] = ["1:1", "4:5", "16:9", "9:16"];
const IMAGE_COUNT_OPTIONS = [1, 2, 4] as const;

const INITIAL_FORM_STATE: WarliFormState = {
  model: "flux-2-pro",
  imageCount: 2,
  frameSize: "1:1",
  quality: "High",
  primarySubject: "",
  supportingSubjects: "",
  keyObject: "",
  environment: "",
  preserveIntent: "",
  additionalNotes: "",
};

const typeIconMap: Record<WarliStyleType, typeof LayoutTemplate> = {
  A: LayoutTemplate,
  B: Mountain,
  C: Sparkles,
};

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#3B82F6]/60 focus:bg-black/45 placeholder:text-white/30";

export default function WarliFullscreenWalkthrough({
  isOpen,
  onClose,
}: WarliFullscreenWalkthroughProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<WarliStyleType>("A");
  const [selectedVariation, setSelectedVariation] = useState<WarliVariationKey>("template");
  const [formState, setFormState] = useState<WarliFormState>(INITIAL_FORM_STATE);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const selectedFamily = WARLI_PROMPT_FAMILIES[selectedType];
  const selectedVariant = selectedFamily.variations[selectedVariation];

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }

    setCurrentStep(1);
    setSelectedType("A");
    setSelectedVariation("template");
    setFormState(INITIAL_FORM_STATE);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const openTimer = window.setTimeout(() => setIsVisible(true), 16);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(openTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
      setCopiedPrompt(false);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!copiedPrompt) {
      return;
    }

    const timer = window.setTimeout(() => setCopiedPrompt(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedPrompt]);

  const assembledPrompt = useMemo(() => {
    const customInputLines = [
      formState.primarySubject && `- Primary subject: ${formState.primarySubject.trim()}`,
      formState.supportingSubjects && `- Supporting subjects: ${formState.supportingSubjects.trim()}`,
      formState.keyObject && `- Important object or prop: ${formState.keyObject.trim()}`,
      formState.environment && `- Environment: ${formState.environment.trim()}`,
      formState.preserveIntent && `- Preserve this intent: ${formState.preserveIntent.trim()}`,
      formState.additionalNotes && `- Additional scene notes: ${formState.additionalNotes.trim()}`,
    ].filter(Boolean) as string[];

    const sceneSection = customInputLines.length
      ? customInputLines.join("\n")
      : "- Use the benchmark Warli scene guidance and locked style instructions above as the base composition.";

    return [
      selectedVariant.prompt.trim(),
      "",
      "BENCHMARK SCENE:",
      selectedFamily.benchmarkScene.trim(),
      "",
      "PROJECT INPUTS:",
      sceneSection,
      "",
      "RENDER SETTINGS:",
      `- Preferred quality preset: ${formState.quality}`,
      `- Preferred aspect ratio: ${formState.frameSize}`,
      `- Preferred image count: ${formState.imageCount}`,
      "- Keep the visible output aligned to WildMind's Warli style experience.",
    ].join("\n");
  }, [formState, selectedFamily, selectedVariant]);

  const handoffPayload = useMemo(
    () => ({
      prompt: assembledPrompt,
      model: formState.model,
      imageCount: formState.imageCount,
      frameSize: formState.frameSize,
      style: "Warli",
      metadata: {
        source: "homepage-warli-walkthrough",
        warliType: selectedType,
        warliVariation: selectedVariation,
        qualityPreset: formState.quality,
        benchmarkScene: selectedFamily.benchmarkScene,
        inputs: {
          primarySubject: formState.primarySubject,
          supportingSubjects: formState.supportingSubjects,
          keyObject: formState.keyObject,
          environment: formState.environment,
          preserveIntent: formState.preserveIntent,
          additionalNotes: formState.additionalNotes,
        },
      },
    }),
    [assembledPrompt, formState, selectedFamily.benchmarkScene, selectedType, selectedVariation]
  );

  if (!isOpen) {
    return null;
  }

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(assembledPrompt);
      setCopiedPrompt(true);
    } catch {
      setCopiedPrompt(false);
    }
  };

  const openStudio = () => {
    saveStudioDraft(handoffPayload);
    saveAutoResumeIntent("image", handoffPayload);
    router.push("/text-to-image");
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="grid gap-4 xl:grid-cols-3">
          {WARLI_PROMPT_FAMILY_LIST.map((family) => {
            const Icon = typeIconMap[family.id];
            const isSelected = family.id === selectedType;

            return (
              <button
                key={family.id}
                type="button"
                onClick={() => setSelectedType(family.id)}
                className={`group rounded-[28px] border p-5 text-left transition ${
                  isSelected
                    ? "border-[#B86A3A] bg-[#1a1410] shadow-[0_0_0_1px_rgba(184,106,58,0.25)]"
                    : "border-white/10 bg-white/[0.03] hover:border-[#3B82F6]/35 hover:bg-white/[0.05]"
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-[#E2A574]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
                    {family.styleChip}
                  </span>
                </div>
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="text-[44px] uppercase leading-none text-white"
                    style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}
                  >
                    {family.id}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{family.title}</h3>
                    <p className="text-sm text-white/55">{family.summary}</p>
                  </div>
                </div>
                <p className="line-clamp-6 text-sm leading-6 text-white/68">{family.benchmarkScene}</p>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="text-white/45">Uses the prompt family you provided</span>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#B86A3A]/45 bg-[#B86A3A]/12 px-3 py-1 text-[#F1C6A6]">
                      <Check className="h-3.5 w-3.5" />
                      Selected
                    </span>
                  ) : (
                    <span className="text-[#3B82F6]">Choose family</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-3">
            {Object.values(selectedFamily.variations).map((variation) => {
              const isSelected = variation.id === selectedVariation;

              return (
                <button
                  key={variation.id}
                  type="button"
                  onClick={() => setSelectedVariation(variation.id)}
                  className={`rounded-[24px] border p-5 text-left transition ${
                    isSelected
                      ? "border-[#3B82F6]/65 bg-[#0f1b30]"
                      : "border-white/10 bg-white/[0.03] hover:border-[#3B82F6]/35 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-[#8FB8FF]">
                      {variation.id === "template" ? (
                        <LayoutTemplate className="h-4 w-4" />
                      ) : variation.id === "variable" ? (
                        <Wand2 className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#3B82F6]/15 px-2.5 py-1 text-[11px] text-[#7FB0FF]">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mb-2 text-base font-semibold text-white">{variation.shortLabel}</div>
                  <p className="text-sm leading-6 text-white/60">{variation.description}</p>
                </button>
              );
            })}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">
                  Prompt Preview
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{selectedVariant.label}</h3>
              </div>
              <button
                type="button"
                onClick={copyPrompt}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedPrompt ? "Copied" : "Copy preview"}
              </button>
            </div>
            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-[22px] border border-white/10 bg-[#0A0A0D] p-4 text-sm leading-6 text-white/68">
              {selectedVariant.prompt}
            </pre>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">Model</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {MODEL_OPTIONS.map((model) => {
                const isSelected = model.id === formState.model;

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        model: model.id,
                      }))
                    }
                    className={`rounded-[24px] border p-5 text-left transition ${
                      isSelected
                        ? "border-[#3B82F6]/70 bg-[#0f1b30]"
                        : "border-white/10 bg-white/[0.03] hover:border-[#3B82F6]/35 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="h-11 w-11 rounded-2xl border border-white/10 bg-black/25" />
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-white/55">
                        {model.badge}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-white">{model.label}</div>
                    <p className="mt-2 text-sm leading-6 text-white/60">{model.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Image Count</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {IMAGE_COUNT_OPTIONS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        imageCount: count,
                      }))
                    }
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      formState.imageCount === count
                        ? "bg-[#B86A3A] text-white"
                        : "border border-white/10 bg-black/25 text-white/60 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Aspect Ratio</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ASPECT_RATIO_OPTIONS.map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        frameSize: ratio,
                      }))
                    }
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      formState.frameSize === ratio
                        ? "bg-[#3B82F6] text-white"
                        : "border border-white/10 bg-black/25 text-white/60 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Quality</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUALITY_OPTIONS.map((quality) => (
                  <button
                    key={quality}
                    type="button"
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        quality,
                      }))
                    }
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      formState.quality === quality
                        ? "bg-[#E2A574] text-[#1B120B]"
                        : "border border-white/10 bg-black/25 text-white/60 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">Scene Inputs</p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                Fill only what matters. Anything left blank falls back to the benchmark scene.
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/55">
                This keeps the modal styling-only on the homepage while staying ready for the real prompt payload.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Primary subject</label>
                <textarea
                  rows={3}
                  value={formState.primarySubject}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      primarySubject: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Example: Warli woman in a saree beside a bench"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Supporting subjects</label>
                <textarea
                  rows={3}
                  value={formState.supportingSubjects}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      supportingSubjects: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Example: Girl holding a book, seated man, distant background people"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Important object or prop</label>
                <textarea
                  rows={3}
                  value={formState.keyObject}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      keyObject: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Example: Bench, book, tea cart, pathway motif"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Environment</label>
                <textarea
                  rows={3}
                  value={formState.environment}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      environment: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Example: Small public park courtyard with trees and walking path"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Preserve</label>
                <textarea
                  rows={3}
                  value={formState.preserveIntent}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      preserveIntent: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Example: Keep subject relationship, pose logic, and folk readability"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Additional notes</label>
                <textarea
                  rows={3}
                  value={formState.additionalNotes}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      additionalNotes: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Any extra prompt instructions from the backend prompt pack"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="rounded-[28px] border border-[#3B82F6]/20 bg-[#0B1018] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">Ready for Studio</p>
              <h3 className="mt-2 text-xl font-semibold text-white">The Warli package is assembled and ready to open in generation.</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
                The homepage walkthrough keeps the style UX here, then hands the full prompt package into the image studio for real generation.
              </p>
            </div>
            <button
              type="button"
              onClick={copyPrompt}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/75 transition hover:border-white/20 hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedPrompt ? "Prompt copied" : "Copy full prompt"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {[
            { label: "Family", value: `${selectedType} - ${selectedFamily.title}` },
            { label: "Variation", value: selectedVariant.shortLabel },
            { label: "Model", value: MODEL_OPTIONS.find((item) => item.id === formState.model)?.label || formState.model },
            { label: "Format", value: `${formState.frameSize} / ${formState.imageCount} images` },
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">{item.label}</div>
              <div className="mt-3 text-base font-semibold text-white">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">Final Prompt</p>
              <h4 className="mt-2 text-lg font-semibold text-white">Assembled backend-ready prompt payload</h4>
            </div>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-[22px] border border-white/10 bg-[#07070A] p-4 text-sm leading-6 text-white/68">
              {assembledPrompt}
            </pre>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Handoff Summary</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-white/65">
                <p>The full prompt, model, ratio, image count, and Warli metadata will be stored for the studio handoff.</p>
                <p>The homepage keeps only the walkthrough UX. Actual generation stays inside `/text-to-image`.</p>
                <p>Reference image upload can happen later in the generation screen if the final backend flow requires it.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={openStudio}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2F6FE2]"
            >
              Open In Studio
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const currentStepMeta = STEP_LABELS[currentStep - 1];

  return (
    <div className="fixed inset-0 z-[160] overflow-hidden bg-black/55 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,106,58,0.16),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_24%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:46px_46px] opacity-30" />

      <div className="relative flex h-full w-full items-center justify-center p-2 sm:p-4 lg:p-6">
        <div
          className={`flex h-full max-h-[calc(100vh-16px)] w-full max-w-[1720px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#07080D]/92 shadow-[0_30px_120px_rgba(0,0,0,0.55)] transition duration-300 sm:max-h-[calc(100vh-32px)] lg:rounded-[36px] ${
            isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-3 opacity-0 scale-[0.985]"
          }`}
        >
        <div className="border-b border-white/10 px-4 py-4 md:px-6 lg:px-8">
          <div className="flex w-full items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#B86A3A]/35 bg-[#B86A3A]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E2A574]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E2A574]" />
                Warli Style Walkthrough
              </div>
              <h2
                className="text-[34px] uppercase leading-none text-white sm:text-[46px] xl:text-[54px]"
                style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}
              >
                Build Your Warli Flow
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58 sm:text-[15px]">
                Full-screen homepage walkthrough based on the standalone Warli modal, reworked for the WildMind theme and prepared for real studio handoff.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Warli walkthrough"
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 lg:px-8">
          <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]">
            <aside className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] xl:max-h-full">
              <div className="relative h-[240px] overflow-hidden border-b border-white/10">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: "url('/HomePage/creativeStyle/warli.jpeg')" }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.18),rgba(5,5,7,0.96))]" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3B82F6]">Style Card Preview</div>
                  <div
                    className="text-[42px] uppercase leading-none text-white"
                    style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}
                  >
                    Warli
                  </div>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">
                    The homepage card now opens this walkthrough directly instead of jumping straight to generation.
                  </p>
                </div>
              </div>

              <div className="space-y-5 overflow-y-auto p-5">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Current Selection</div>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <div className="text-sm font-semibold text-white">{selectedType} - {selectedFamily.title}</div>
                      <p className="mt-2 text-sm leading-6 text-white/55">{selectedFamily.summary}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <div className="text-sm font-semibold text-white">{selectedVariant.shortLabel}</div>
                      <p className="mt-2 text-sm leading-6 text-white/55">{selectedVariant.description}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">Benchmark Scene</div>
                  <p className="mt-3 max-h-[196px] overflow-auto text-sm leading-6 text-white/60">
                    {selectedFamily.benchmarkScene}
                  </p>
                </div>

                <div className="rounded-[22px] border border-[#3B82F6]/18 bg-[#08111D] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">Step Focus</div>
                  <div className="mt-3 text-base font-semibold text-white">{currentStepMeta.label}</div>
                  <p className="mt-2 text-sm leading-6 text-white/60">{currentStepMeta.description}</p>
                </div>
              </div>
            </aside>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#090A0E]/90 shadow-[0_22px_80px_rgba(0,0,0,0.45)]">
              <div className="border-b border-white/10 px-4 py-4 md:px-5 lg:px-6">
                <div className="flex flex-wrap items-start gap-3 xl:items-center">
                  {STEP_LABELS.map((step, index) => {
                    const isActive = currentStep === step.id;
                    const isDone = currentStep > step.id;

                    return (
                      <React.Fragment key={step.id}>
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                              isDone
                                ? "border-[#3B82F6] bg-[#3B82F6] text-white"
                                : isActive
                                ? "border-[#B86A3A] bg-[#B86A3A]/15 text-[#F0BF9B]"
                                : "border-white/10 bg-white/5 text-white/35"
                            }`}
                          >
                            {isDone ? <Check className="h-4 w-4" /> : step.id}
                          </div>
                          <div>
                            <div className={`text-sm font-medium ${isActive || isDone ? "text-white" : "text-white/40"}`}>
                              {step.label}
                            </div>
                            <div className="text-xs text-white/35">{step.description}</div>
                          </div>
                        </div>
                        {index < STEP_LABELS.length - 1 && <div className="hidden h-px flex-1 bg-white/10 xl:block" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6">{renderStepContent()}</div>

              <div className="border-t border-white/10 px-4 py-4 md:px-5 lg:px-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <p className="max-w-2xl text-sm leading-6 text-white/50">
                    Styling stays on the homepage. Real generation continues in the studio with the assembled Warli prompt package.
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/75 transition hover:border-white/20 hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </button>
                    )}

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentStep((step) => Math.min(4, step + 1))}
                        className="inline-flex items-center gap-2 rounded-full bg-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2F6FE2]"
                      >
                        {currentStep === 3 ? "Review Prompt" : "Continue"}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={openStudio}
                        className="inline-flex items-center gap-2 rounded-full bg-[#B86A3A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A55B2F]"
                      >
                        Generate In Studio
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
