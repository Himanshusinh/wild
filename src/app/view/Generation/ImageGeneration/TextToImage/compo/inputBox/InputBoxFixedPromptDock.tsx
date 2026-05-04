"use client";

import React, { useCallback, useMemo } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { AppDispatch } from "@/store/index";
import toast from "react-hot-toast";
import { saveAutoResumeIntent } from "@/lib/autoResume";
import { getSignInUrl } from "@/routes/routes";
import { addActiveGeneration } from "@/store/slices/generationSlice";
import ModelsDropdown from "../ModelsDropdown";
import { PromptDockParameterControls } from "./PromptDockParameterControls";
import { PromptDockEditorRow } from "./PromptDockEditorRow";
import { PromptDockGenerateButton } from "./PromptDockGenerateButton";
import { handlePromptDockDrop } from "./promptDockDropHandlers";

export type InputBoxFixedPromptDockProps = {
  dispatch: AppDispatch;
  router: AppRouterInstance;
  contentEditableRef: React.RefObject<HTMLDivElement | null>;
  pluginsMenuRef: React.RefObject<HTMLDivElement | null>;
  inputEl: React.RefObject<HTMLTextAreaElement | null>;
  isUpdatingRef: React.MutableRefObject<boolean>;
  promptInputIdleTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  prompt: string;
  selectedCharacters: unknown[];
  isInputBoxHovered: boolean;
  setIsInputBoxHovered: (v: boolean) => void;
  isPluginsMenuOpen: boolean;
  setIsPluginsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAssistantOpen: boolean;
  setIsAssistantOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCharacterModalOpen: (v: boolean) => void;
  setIsUploadOpen: (v: boolean) => void;
  uploadedImages: string[];
  selectedModel: string;
  isEnhancing: boolean;
  userData: unknown;
  runningGenerationsCount: number;
  expectedCredits: number;
  planCode?: string | null;
  credits: { freeTurboUsed?: number; freeTurboLimit?: number } | null | undefined;
  imageCount: number;
  frameSize: string;
  style: string;
  gptImage2CustomWidth: number;
  setGptImage2CustomWidth: React.Dispatch<React.SetStateAction<number>>;
  gptImage2CustomHeight: number;
  setGptImage2CustomHeight: React.Dispatch<React.SetStateAction<number>>;
  nanoBananaProResolution: "1K" | "2K" | "4K";
  setNanoBananaProResolution: (v: "1K" | "2K" | "4K") => void;
  outputFormat: string;
  nanoSupportedOutputFormats: Array<"jpg" | "png" | "webp">;
  nanoBananaProResolutionCredits?: Record<string, number>;
  nanoBananaResolution: string;
  nanoBanana2ResolutionCredits?: Record<string, number>;
  flux2ProResolution: "1K" | "2K";
  setFlux2ProResolution: (v: "1K" | "2K") => void;
  qwenResolution: "1K" | "2K";
  setQwenResolution: (v: "1K" | "2K") => void;
  seedream45Resolution: "2K" | "4K";
  setSeedream45Resolution: (v: "2K" | "4K") => void;
  seedream45ResolutionCredits: Record<string, number> | undefined;
  seedreamSize: "1K" | "2K" | "4K" | "custom";
  setSeedreamSize: (v: "1K" | "2K" | "4K" | "custom") => void;
  seedreamWidth: number;
  setSeedreamWidth: (v: number) => void;
  seedreamHeight: number;
  setSeedreamHeight: (v: number) => void;
  seedream5LiteResolution: "2K" | "3K";
  setSeedream5LiteResolution: (v: "2K" | "3K") => void;
  seedream5LiteResolutionCredits: Record<string, number> | undefined;
  zTurboOutputFormat: "png" | "jpg" | "webp";
  setZTurboOutputFormat: (v: "png" | "jpg" | "webp") => void;
  gptImage15Quality: "low" | "medium" | "high" | "auto";
  setGptImage15Quality: (v: "low" | "medium" | "high" | "auto") => void;
  updateContentEditable: () => void;
  handleEnhancePrompt: () => void | Promise<void>;
  handleGenerate: (generationId: string, overridePrompt?: string) => void | Promise<void>;
  getCombinedUploadedImages: () => string[];
};

export function InputBoxFixedPromptDock(props: InputBoxFixedPromptDockProps) {
  const {
    dispatch,
    router,
    contentEditableRef,
    pluginsMenuRef,
    inputEl,
    isUpdatingRef,
    promptInputIdleTimeoutRef,
    prompt,
    selectedCharacters,
    isInputBoxHovered,
    setIsInputBoxHovered,
    isPluginsMenuOpen,
    setIsPluginsMenuOpen,
    isAssistantOpen,
    setIsAssistantOpen,
    setIsCharacterModalOpen,
    setIsUploadOpen,
    uploadedImages,
    selectedModel,
    isEnhancing,
    userData,
    runningGenerationsCount,
    expectedCredits,
    planCode,
    credits,
    imageCount,
    frameSize,
    style,
    gptImage2CustomWidth,
    setGptImage2CustomWidth,
    gptImage2CustomHeight,
    setGptImage2CustomHeight,
    nanoBananaProResolution,
    setNanoBananaProResolution,
    outputFormat,
    nanoSupportedOutputFormats,
    nanoBananaProResolutionCredits,
    nanoBananaResolution,
    nanoBanana2ResolutionCredits,
    flux2ProResolution,
    setFlux2ProResolution,
    qwenResolution,
    setQwenResolution,
    seedream45Resolution,
    setSeedream45Resolution,
    seedream45ResolutionCredits,
    seedreamSize,
    setSeedreamSize,
    seedreamWidth,
    setSeedreamWidth,
    seedreamHeight,
    setSeedreamHeight,
    seedream5LiteResolution,
    setSeedream5LiteResolution,
    seedream5LiteResolutionCredits,
    zTurboOutputFormat,
    setZTurboOutputFormat,
    gptImage15Quality,
    setGptImage15Quality,
    updateContentEditable,
    handleEnhancePrompt,
    handleGenerate,
    getCombinedUploadedImages,
  } = props;

  const promptParameterControlsProps = useMemo(
    () => ({
    dispatch,
    selectedModel,
    frameSize,
    gptImage2CustomWidth,
    setGptImage2CustomWidth,
    gptImage2CustomHeight,
    setGptImage2CustomHeight,
    nanoBananaProResolution,
    setNanoBananaProResolution,
    outputFormat,
    nanoSupportedOutputFormats,
    nanoBananaProResolutionCredits,
    nanoBananaResolution,
    nanoBanana2ResolutionCredits,
    flux2ProResolution,
    setFlux2ProResolution,
    qwenResolution,
    setQwenResolution,
    seedream45Resolution,
    setSeedream45Resolution,
    seedream45ResolutionCredits,
    seedreamSize,
    setSeedreamSize,
    seedreamWidth,
    setSeedreamWidth,
    seedreamHeight,
    setSeedreamHeight,
    seedream5LiteResolution,
    setSeedream5LiteResolution,
    seedream5LiteResolutionCredits,
    zTurboOutputFormat,
    setZTurboOutputFormat,
    gptImage15Quality,
    setGptImage15Quality,
    }),
    [
      dispatch,
      selectedModel,
      frameSize,
      gptImage2CustomWidth,
      setGptImage2CustomWidth,
      gptImage2CustomHeight,
      setGptImage2CustomHeight,
      nanoBananaProResolution,
      setNanoBananaProResolution,
      outputFormat,
      nanoSupportedOutputFormats,
      nanoBananaProResolutionCredits,
      nanoBananaResolution,
      nanoBanana2ResolutionCredits,
      flux2ProResolution,
      setFlux2ProResolution,
      qwenResolution,
      setQwenResolution,
      seedream45Resolution,
      setSeedream45Resolution,
      seedream45ResolutionCredits,
      seedreamSize,
      setSeedreamSize,
      seedreamWidth,
      setSeedreamWidth,
      seedreamHeight,
      setSeedreamHeight,
      seedream5LiteResolution,
      setSeedream5LiteResolution,
      seedream5LiteResolutionCredits,
      zTurboOutputFormat,
      setZTurboOutputFormat,
      gptImage15Quality,
      setGptImage15Quality,
    ],
  );
  const queueAtCapacity = runningGenerationsCount >= 4;
  const isGenerateDisabled = !prompt.trim() || queueAtCapacity || isEnhancing;

  const startGenerationFromDock = useCallback(async (
    source: "hidden" | "mobile" | "desktop",
  ) => {
    if (!userData) {
      saveAutoResumeIntent("image", {
        prompt,
        model: selectedModel,
        imageCount,
        frameSize,
        style,
        uploadedImages: getCombinedUploadedImages(),
        selectedCharacters: selectedCharacters,
      });
      router.push(getSignInUrl());
      return;
    }
    try {
      if (queueAtCapacity) {
        toast.error(
          source === "mobile"
            ? "Queue full (4/4 active). Please wait."
            : "Queue full (4/4 active). Please wait for a generation to complete.",
        );
        return;
      }

      const generationId = `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const queuedAt = Date.now();
      dispatch(
        addActiveGeneration({
          id: generationId,
          prompt: prompt,
          model: selectedModel,
          status: "pending",
          createdAt: queuedAt,
          startedAt: queuedAt,
          updatedAt: queuedAt,
          generationType: "text-to-image",
          params: {
            imageCount,
            frameSize,
            style,
            uploadedImages: getCombinedUploadedImages(),
          },
        }),
      );
      handleGenerate(generationId);
    } catch (e) {
      console.error(`Failed to start generation (${source}):`, e);
    }
  }, [
    userData,
    prompt,
    selectedModel,
    imageCount,
    frameSize,
    style,
    getCombinedUploadedImages,
    selectedCharacters,
    router,
    queueAtCapacity,
    dispatch,
    handleGenerate,
  ]);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsInputBoxHovered(true);
    },
    [setIsInputBoxHovered],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsInputBoxHovered(false);
    },
    [setIsInputBoxHovered],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      await handlePromptDockDrop({
        event: e,
        setIsInputBoxHovered,
        dispatch,
        selectedModel,
        uploadedImages,
      });
    },
    [setIsInputBoxHovered, dispatch, selectedModel, uploadedImages],
  );

  return (
        <div className="fixed md:bottom-6 bottom-2 left-1/2 -translate-x-1/2 md:w-[90%] w-[92%] md:max-w-[900px] max-w-[92%] z-[50] h-auto">
          <div
            className="relative rounded-lg md:rounded-b-lg backdrop-blur-3xl ring-1 shadow-2xl md:p-2 p-0.5 pt-0.5 space-y-0 md:space-y-0 bg-black/20 ring-white/20 hover:ring-white/30 hover:shadow-2xl transition-all duration-300"
            onMouseEnter={() => setIsInputBoxHovered(true)}
            onMouseLeave={() => setIsInputBoxHovered(false)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Outline Glow Effect - shows on hover or when typing */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 transition-opacity duration-700 blur-xl pointer-events-none rounded-lg"
              style={{
                opacity: prompt.trim() || isInputBoxHovered ? 0.2 : 0,
              }}
            ></div>
            {/* Top row: prompt + actions */}
            <PromptDockEditorRow
              dispatch={dispatch}
              contentEditableRef={contentEditableRef}
              pluginsMenuRef={pluginsMenuRef}
              inputEl={inputEl}
              isUpdatingRef={isUpdatingRef}
              promptInputIdleTimeoutRef={promptInputIdleTimeoutRef}
              prompt={prompt}
              selectedCharacters={selectedCharacters}
              isPluginsMenuOpen={isPluginsMenuOpen}
              setIsPluginsMenuOpen={setIsPluginsMenuOpen}
              isAssistantOpen={isAssistantOpen}
              setIsAssistantOpen={setIsAssistantOpen}
              setIsCharacterModalOpen={setIsCharacterModalOpen}
              setIsUploadOpen={setIsUploadOpen}
              uploadedImages={uploadedImages}
              selectedModel={selectedModel}
              isEnhancing={isEnhancing}
              updateContentEditable={updateContentEditable}
              handleEnhancePrompt={handleEnhancePrompt}
            />

              {/* Fixed position Generate button - Desktop only */}
              <div className="hidden">
                <PromptDockGenerateButton
                  variant="hidden"
                  expectedCredits={expectedCredits}
                  selectedModel={selectedModel}
                  planCode={planCode}
                  credits={credits}
                  isEnhancing={isEnhancing}
                  queueAtCapacity={queueAtCapacity}
                  runningGenerationsCount={runningGenerationsCount}
                  isGenerateDisabled={isGenerateDisabled}
                  onGenerate={startGenerationFromDock}
                />
              </div>

            {/* Bottom row: pill options */}

            <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-0 md:gap-1 pt-1 md:pt-1.5">


              {/* Mobile/Tablet: First row - Model dropdown and Generate button */}

              <div className="flex items-center justify-between gap-2 md:hidden w-full px-1 md:px-0 mt-1 relative z-50">
                <div className="flex-shrink-0 max-w-[45%]">
                  <ModelsDropdown />
                </div>

                <div className="flex-1 min-w-0" />
                <PromptDockGenerateButton
                  variant="mobile"
                  expectedCredits={expectedCredits}
                  selectedModel={selectedModel}
                  planCode={planCode}
                  credits={credits}
                  isEnhancing={isEnhancing}
                  queueAtCapacity={queueAtCapacity}
                  runningGenerationsCount={runningGenerationsCount}
                  isGenerateDisabled={isGenerateDisabled}
                  onGenerate={startGenerationFromDock}
                />
                
              </div>

              {/* Removed Mobile Separator Line for cleaner look matching Image 2 */}

              {/* Mobile/Tablet: Second row - Other dropdowns */}
              <div
                className="flex flex-nowrap items-center gap-1.5 md:gap-2 md:hidden w-full overflow-x-auto no-scrollbar relative py-1 md:py-1.5 px-1 bg-transparent"
                style={{ zIndex: 70 }}
              >
                <PromptDockParameterControls
                  layout="mobile"
                  {...promptParameterControlsProps}
                />
              </div>

              {/* Desktop: Model fixed, only parameters scroll */}
              <div className="hidden md:flex flex-1 min-w-0 items-center gap-2">
                <div className="shrink-0">
                  <ModelsDropdown />
                </div>
                <div className="flex min-w-0 flex-1 items-center overflow-x-auto overflow-y-visible no-scrollbar pr-0">
                  <div className="flex min-w-max items-center gap-2">
                    <PromptDockParameterControls
                      layout="desktop"
                      {...promptParameterControlsProps}
                    />
                  </div>
                </div>
                <div className="ml-auto flex shrink-0 items-end gap-2">
                  <div className="flex flex-col items-end gap-1">
                    <PromptDockGenerateButton
                      variant="desktop"
                      expectedCredits={expectedCredits}
                      selectedModel={selectedModel}
                      planCode={planCode}
                      credits={credits}
                      isEnhancing={isEnhancing}
                      queueAtCapacity={queueAtCapacity}
                      runningGenerationsCount={runningGenerationsCount}
                      isGenerateDisabled={isGenerateDisabled}
                      onGenerate={startGenerationFromDock}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}
