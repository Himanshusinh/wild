"use client";

"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FilePlus, ChevronUp, Edit3 } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { getIsPublic } from "@/lib/publicFlag";
import FrameSizeDropdown from "@/app/view/Generation/ImageGeneration/TextToImage/compo/FrameSizeDropdown";
import StyleSelector from "@/app/view/Generation/ImageGeneration/TextToImage/compo/StyleSelector";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import UploadModal from "@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal";
import { loadMoreHistory, loadHistory } from "@/store/slices/historySlice";
import { useHistoryLoader } from "@/hooks/useHistoryLoader";
import { downloadFileWithNaming } from "@/utils/downloadUtils";
import { getCreditsForModel } from "@/utils/modelCredits";
import { estimateCrystalUpscalerCredits } from "@/utils/pricing/crystalUpscalerCredits";
import { toast } from "react-hot-toast";
import { EditImageEraseFrame } from "./EditImageEraseFrame";
import { EditImageEraseControls } from "./EditImageEraseControls";
import { EditImageExpandFrame } from "./EditImageExpandFrame";
import { EditImageSidebar } from "./EditImageSidebar";
import { EditImageCanvasArea, CanvasTopBar } from "./EditImageCanvasArea";
import { EditImageStatusBar } from "./EditImageStatusBar";
import { EditImageExpandControls } from "./EditImageExpandControls";
import { saveUpload } from "@/lib/libraryApi";
import { useCredits } from "@/hooks/useCredits";
import { AUTH_ROUTES, getSignInUrl } from "@/routes/routes";
import {
  saveAutoResumeIntent,
  getAutoResumeIntent,
  clearAutoResumeIntent,
} from "@/lib/autoResume";
import { STYLE_CATALOG } from "@/styles/stylesCatalog";
import { ALL_INDIAN_STYLES } from "@/styles/indianStyles";
import {
  INDIAN_STYLE_LOOKUP,
  getIndianBasePrompt,
} from "@/app/view/Generation/ImageGeneration/TextToImage/compo/inputBox/indianStylePrompts";

import type { EditFeature } from "./editImageTypes";
import {
  STYLE_COMBO_GENERAL_IDS,
  STYLE_COMBO_MAX_SELECTIONS,
  STYLE_COMBO_BASE_MODELS,
  aspectPresets,
} from "./editImageConstants";
import {
  maskDataUrlHasPaintedRegion,
  normalizeEditImageUrl,
  isSvgUrl,
  isInlineImageUrl,
} from "./editImageUtils";


import type { EditImageInterfaceVm } from "./useEditImageInterface";

export function EditImageInterfaceView({
  vm,
}: {
  vm: EditImageInterfaceVm;
}) {
  const {
    activeDropdown,
    activeLiveIndex,
    allHistoryEntries,
    availableModels,
    backgroundType,
    beginMaskStroke,
    brushSize,
    chatListRef,
    clampOffset,
    continueMaskStroke,
    copyToClipboard,
    crystalEstimate,
    currentHistoryId,
    currentVectorizeCredits,
    dispatch,
    dragStart,
    dragStartRef,
    draggingEdge,
    drawExpandCanvas,
    dynamic,
    effectiveVectorizeCredits,
    endMaskStroke,
    ensureZataUrl,
    eraseActionMode,
    eraseBrushSize,
    eraseCredits,
    eraseFrameMaskResetNonce,
    eraseIsDrawing,
    eraseIsPreviewing,
    eraseMaskData,
    eraseMode,
    eraseModel,
    erasePrompt,
    errorMsg,
    estimateTopazCredits,
    expandAspectRatio,
    expandBottomPx,
    expandBounds,
    expandCanvasRef,
    expandContainerRef,
    expandCredits,
    expandCustomHeight,
    expandCustomWidth,
    expandEffectiveHeight,
    expandEffectiveWidth,
    expandHoverEdge,
    expandImageRef,
    expandLeftPx,
    expandOriginalSize,
    expandResizing,
    expandRightPx,
    expandTopPx,
    faceEnhance,
    featureDisplayName,
    featurePreviewGif,
    featureTabsRef,
    features,
    fileInputRef,
    fillCanvasRef,
    fillContainerRef,
    fillNegativePrompt,
    fillNumImages,
    fillSeed,
    fillSyncMode,
    fitScale,
    frameSize,
    getCanvasContext,
    getExpandCanvasContext,
    getExpandHandle,
    getLiveModelCredits,
    getRenderedImageRect,
    getSwinTaskLabel,
    getUpscaleModelLabel,
    handleDeleteLiveChatImage,
    handleDownloadOutput,
    handleExpandMouseDown,
    handleExpandMouseMove,
    handleExpandMouseUp,
    handleFeatureSelect,
    handleFeatureTabsScroll,
    handleFileSelect,
    handleImageClick,
    handleKeyDown,
    handleLiveGenerate,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleOpenUploadModal,
    handleReset,
    handleRun,
    handleShareOutput,
    handleWheel,
    hasLeftScroll,
    hasMask,
    historyEntries,
    historyError,
    historyFilters,
    historyHasMore,
    historyLoading,
    hoveredThumbnailIdx,
    imageContainerRef,
    imageRef,
    inputNaturalSize,
    inputs,
    isAdjustingBrush,
    isDraggingSelection,
    isDrawingRectangle,
    isMasking,
    isPanning,
    isUploadOpen,
    lastMsgRef,
    lastPoint,
    lastTabChangeRef,
    liveActiveDropdown,
    liveAllowedModels,
    liveChatMessages,
    liveCredits,
    liveFrameSize,
    liveFrameSizes,
    liveHistory,
    liveModel,
    liveOriginalInput,
    livePrompt,
    liveQuality,
    liveResolution,
    liveResolutionOptions,
    liveResolutionOptionsByModel,
    menuButtonRef,
    menuRef,
    modalOpenedRef,
    model,
    naturalSize,
    normalizeExpandDims,
    offset,
    output,
    outputs,
    parseOutputUrl,
    pointFromMouseEvent,
    pointFromTouchEvent,
    processing,
    prompt,
    realEsrganEstimate,
    rectangleCurrent,
    rectangleStart,
    reduxUploadedImages,
    reimagineLiveBounds,
    reimagineModel,
    reimaginePrompt,
    reimagineReferenceImage,
    reimagineSelectionBounds,
    reimagineSelectionConfirmed,
    reimagineSelectionMode,
    resetZoom,
    resizeAspectRatio,
    resizeCanvasH,
    resizeCanvasToContainer,
    resizeCanvasW,
    resizeExpandBottom,
    resizeExpandLeft,
    resizeExpandRight,
    resizeExpandTop,
    resizeNegativePrompt,
    resizeNumImages,
    resizeOrigH,
    resizeOrigW,
    resizeOrigX,
    resizeOrigY,
    resizeOutputFormat,
    resizeSafetyChecker,
    resizeSeed,
    resizeSyncMode,
    resizeZoomOutPercentage,
    reverseBg,
    router,
    scale,
    scaleFactor,
    searchParams,
    seedvrEstimate,
    seedvrUpscaleFactor,
    selectedFeature,
    selectedGeneratorModel,
    selectedStyle,
    setActiveDropdown,
    setActiveLiveIndex,
    setBackgroundType,
    setBrushSize,
    setCurrentHistoryId,
    setDragStart,
    setDraggingEdge,
    setDynamic,
    setEraseActionMode,
    setEraseBrushSize,
    setEraseFrameMaskResetNonce,
    setEraseIsDrawing,
    setEraseIsPreviewing,
    setEraseMaskData,
    setEraseMode,
    setEraseModel,
    setErasePrompt,
    setErrorMsg,
    setExpandAspectRatio,
    setExpandBottomPx,
    setExpandBounds,
    setExpandCustomHeight,
    setExpandCustomWidth,
    setExpandEffectiveHeight,
    setExpandEffectiveWidth,
    setExpandHoverEdge,
    setExpandLeftPx,
    setExpandOriginalSize,
    setExpandResizing,
    setExpandRightPx,
    setExpandTopPx,
    setFaceEnhance,
    setFillNegativePrompt,
    setFillNumImages,
    setFillSeed,
    setFillSyncMode,
    setFitScale,
    setHasLeftScroll,
    setHasMask,
    setHoveredThumbnailIdx,
    setInputNaturalSize,
    setInputs,
    setIsAdjustingBrush,
    setIsDraggingSelection,
    setIsDrawingRectangle,
    setIsMasking,
    setIsPanning,
    setIsUploadOpen,
    setLastPoint,
    setLiveActiveDropdown,
    setLiveChatMessages,
    setLiveFrameSize,
    setLiveHistory,
    setLiveModel,
    setLiveOriginalInput,
    setLivePrompt,
    setLiveQuality,
    setLiveResolution,
    setModel,
    setNaturalSize,
    setOffset,
    setOutput,
    setOutputs,
    setProcessing,
    setPrompt,
    setRectangleCurrent,
    setRectangleStart,
    setReimagineLiveBounds,
    setReimagineModel,
    setReimaginePrompt,
    setReimagineReferenceImage,
    setReimagineSelectionBounds,
    setReimagineSelectionConfirmed,
    setReimagineSelectionMode,
    setResizeAspectRatio,
    setResizeCanvasH,
    setResizeCanvasW,
    setResizeExpandBottom,
    setResizeExpandLeft,
    setResizeExpandRight,
    setResizeExpandTop,
    setResizeNegativePrompt,
    setResizeNumImages,
    setResizeOrigH,
    setResizeOrigW,
    setResizeOrigX,
    setResizeOrigY,
    setResizeOutputFormat,
    setResizeSafetyChecker,
    setResizeSeed,
    setResizeSyncMode,
    setResizeZoomOutPercentage,
    setReverseBg,
    setScale,
    setScaleFactor,
    setSeedvrUpscaleFactor,
    setSelectedFeature,
    setShareCopied,
    setSharpen,
    setShowImageMenu,
    setShowThumbnailMenuIdx,
    setSliderPosition,
    setStyleComboDropdown,
    setStyleComboExtraPrompt,
    setStyleComboFrameSize,
    setStyleComboIndianSearch,
    setStyleComboIndianVersion,
    setStyleComboMaskPainted,
    setStyleComboModel,
    setStyleComboResolution,
    setStyleComboSelectedIds,
    setStyleComboTab,
    setSwinTask,
    setThreshold,
    setTopazCropToFill,
    setTopazFaceCreativity,
    setTopazFaceEnhance,
    setTopazFaceStrength,
    setTopazModel,
    setTopazOutputFormat,
    setTopazSubjectDetection,
    setTopazUpscaleFactor,
    setUpscaleViewMode,
    setVColorMode,
    setVColorPrecision,
    setVCornerThreshold,
    setVFilterSpeckle,
    setVHierarchical,
    setVLayerDifference,
    setVLengthThreshold,
    setVMaxIterations,
    setVMode,
    setVPathPrecision,
    setVSpliceThreshold,
    setVectorizeModel,
    setVectorizeSuperMode,
    shareCopied,
    sharpen,
    showImageMenu,
    showThumbnailMenuIdx,
    sliderPosition,
    styleComboCredits,
    styleComboDropdown,
    styleComboExtraPrompt,
    styleComboFrameSize,
    styleComboGeneralStyles,
    styleComboIndianRows,
    styleComboIndianSearch,
    styleComboIndianVersion,
    styleComboMaskPainted,
    styleComboModel,
    styleComboResolution,
    styleComboSelectedIds,
    styleComboTab,
    swinTask,
    threshold,
    thumbnailMenuRef,
    toProxyDownloadUrl,
    toProxyPath,
    toggleStyleComboId,
    topazCropToFill,
    topazEstimate,
    topazFaceCreativity,
    topazFaceEnhance,
    topazFaceStrength,
    topazModel,
    topazOutputFormat,
    topazSubjectDetection,
    topazUpscaleFactor,
    uploadModalHistoryEntries,
    upscaleViewMode,
    user,
    vColorMode,
    vColorPrecision,
    vCornerThreshold,
    vFilterSpeckle,
    vHierarchical,
    vLayerDifference,
    vLengthThreshold,
    vMaxIterations,
    vMode,
    vPathPrecision,
    vSpliceThreshold,
    vectorizeArtExtraCredits,
    vectorizeImage2SvgCredits,
    vectorizeModel,
    vectorizeRecraftCredits,
    vectorizeSuperMode,
    zoomToPoint,
  } = vm;
  return (
    <div className="body box-border flex flex-col md:flex-row flex-1 overflow-hidden relative w-full h-[100svh] md:h-[100vh] bg-[#0E0E12] font-sans text-white pt-0 md:pt-12">
      {/* Sticky header like ArtStation */}
      {/* <div className="w-full fixed top-0 z-30 px-4 md:px-1  pb-2 bg-[#0E0E12] backdrop-blur-xl shadow-xl md:pr-5 pt-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0  sm:ml-8 md:ml-7 lg:ml-7 ">
            <h1 className="text-white text-xl sm:text-xl md:text-2xl font-semibold">Edit Images</h1>
            <p className="text-white/80 text-xs sm:text-sm md:text-sm">Transform your images with AI</p>
          </div>
          feature tabs moved to left sidebar
        </div>
      </div> */}
      {/* Spacer to offset fixed header height */}
      {/* <div className="h-[110px]"></div> */}
      {/* Upload from Library/Computer Modal */}
      <UploadModal
        key={`upload-modal-${isUploadOpen}`}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        historyEntries={uploadModalHistoryEntries as any}
        remainingSlots={1}
        hasMore={historyHasMore}
        loading={historyLoading}
        onTabChange={useCallback((tab: "library" | "computer" | "uploads") => {
          // Tab change handled internally by UploadModal
        }, [])}
        onAdd={(urls: string[]) => {
          const first = urls[0] ? normalizeEditImageUrl(urls[0]) : "";
          if (first) {
            // Apply selected image from modal to all features
            setInputs({
              upscale: first,
              "remove-bg": first,
              resize: first,
              fill: first,
              vectorize: first,
              erase: first,
              expand: first,
              // Keep reimagine present for type-safety but unused in UI
              reimagine: null,
              "live-chat": first,
              "style-combination": first,
            });
            // Clear all outputs when a new image is selected so the output area re-renders
            setOutputs({
              upscale: null,
              "remove-bg": null,
              resize: null,
              fill: null,
              vectorize: null,
              erase: null,
              expand: null,
              // Keep reimagine present for type-safety but unused in UI
              reimagine: null,
              "live-chat": null,
              "style-combination": null,
            });
            // Also reset zoom and pan state
            setScale(1);
            setOffset({ x: 0, y: 0 });
          }
        }}
      />
      {/* Error Message - Moved to top absolute */}
      {errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur border border-red-500/20 rounded-xl px-4 py-2 shadow-2xl">
          <p className="text-white text-sm font-medium">{errorMsg}</p>
        </div>
      )}
      <div className="md:hidden sticky top-0 z-40 bg-[#0E0E12]/95 backdrop-blur-xl border-b border-white/10 px-4 pt-11 pb-1">
        {/* <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[1.08rem] font-semibold tracking-[0.03em] text-white">
              Image Generation
            </div>
            <div className="mt-2 flex items-center gap-3 text-[12px] text-white/40">
              <span>Image</span>
              <span className="border-b-2 border-[#3B6BFF] pb-1 font-semibold text-[#4E7BFF]">
                Edit
              </span>
              <span>Editor</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadOutput}
            disabled={!outputs[selectedFeature]}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            title="Download"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          </button>
        </div> */}

        <div className="mt-2 -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-2 no-scrollbar">
          {features
            .filter((feature) => feature.id !== "live-chat")
            .map((feature) => (
              <button
                key={feature.id}
                type="button"
                onClick={() => handleFeatureSelect(feature.id as EditFeature)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium leading-none transition ${selectedFeature === feature.id
                    ? "border-[#3B6BFF] bg-[#3B6BFF] text-white shadow-[0_10px_30px_rgba(59,107,255,0.28)]"
                    : "border-white/10 bg-transparent text-white/55"
                  }`}
              >
                {feature.id === "fill" ? "Erase/Replace" : feature.label}
              </button>
            ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-1 md:flex-row md:gap-7 md:px-0 md:pb-0 md:pt-0">
        <EditImageSidebar
          imagePreview={
            selectedFeature !== "live-chat" ? (
              <div className="hidden px-1 pt-4 z-10 md:block md:px-4 md:mb-2">
                <div className="preview-wrap relative h-[148px] bg-[#1a1a20] border-b border-white/10 rounded-t-[15px] shrink-0 overflow-hidden cursor-pointer group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featurePreviewGif[selectedFeature]}
                    alt="Feature preview"
                    className="w-full h-full object-contain opacity-90"
                  />
                  <div className="absolute top-1 left-1 bg-black/70 text-white text-[11px] md:text-xs px-2 py-0.5 rounded">
                    {featureDisplayName[selectedFeature]}
                  </div>
                </div>
              </div>
            ) : null
          }
          parameters={
            <div
              className={`flex flex-col pt-0 thin-scrollbar ${selectedFeature === "live-chat" ? "h-full min-h-0 gap-3" : "gap-4"}`}
            >
              {/* Reimagine Reference Image */}
              {selectedFeature === "reimagine" && (
                <div className="px-1 md:px-4">
                  <label className="block text-[10px] font-medium text-white/70 mb-2 md:text-sm">
                    Reference Image (Optional)
                  </label>

                  {!reimagineReferenceImage ? (
                    <div
                      className="border border-white/20 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors group"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setReimagineReferenceImage(
                                ev.target?.result as string,
                              );
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white/60"
                        >
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="3"
                            rx="2"
                            ry="2"
                          />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                      <span className="text-xs text-white/50 text-center">
                        Click to upload reference
                      </span>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                      <img
                        src={reimagineReferenceImage}
                        alt="Reference"
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setReimagineReferenceImage(null)}
                          className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                          title="Remove"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                        <span className="text-[10px] text-white/80">
                          Reference Image
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-white/40 mt-2">
                    Upload an image to extract details, texture, or style. This
                    will be used as a guide for the generation.
                  </p>
                </div>
              )}

              {/* Style Combination model & parameters */}
              {selectedFeature === "style-combination" && (
                <div className="px-1 md:px-4">
                  <p className="mb-3 text-[11px] leading-snug text-white/55 md:text-xs">
                    Paint over the region you want to restyle (brush on the
                    image). White marks where styles apply; the rest of the image
                    stays as-is. Then pick one or more styles (General and/or
                    Indian); they merge into one prompt with the base model below.
                  </p>
                  <div className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                        Brush size
                      </span>
                      <span className="text-[10px] font-semibold text-white/50">
                        {eraseBrushSize}px
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEraseBrushSize((s) => Math.max(5, s - 5))
                        }
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2a2a34] bg-[#1c1c22] text-xs text-white/80 transition hover:bg-white/5 active:scale-95"
                      >
                        −
                      </button>
                      <input
                        type="range"
                        min={5}
                        max={200}
                        value={eraseBrushSize}
                        onChange={(e) =>
                          setEraseBrushSize(Number(e.target.value))
                        }
                        onMouseDown={() => setIsAdjustingBrush(true)}
                        onMouseUp={() => setIsAdjustingBrush(false)}
                        onTouchStart={() => setIsAdjustingBrush(true)}
                        onTouchEnd={() => setIsAdjustingBrush(false)}
                        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#3B6BFF] hover:[&::-webkit-slider-thumb]:scale-110"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEraseBrushSize((s) => Math.min(200, s + 5))
                        }
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2a2a34] bg-[#1c1c22] text-xs text-white/80 transition hover:bg-white/5 active:scale-95"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEraseFrameMaskResetNonce((n) => n + 1)
                      }
                      className="w-full rounded-lg border border-white/12 py-2 text-[12px] font-medium text-white/80 transition hover:bg-white/8"
                    >
                      Clear brush
                    </button>
                  </div>
                  <div className="mb-3 space-y-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Base model
                    </label>
                    <div className="relative edit-dropdown">
                      <button
                        type="button"
                        onClick={() =>
                          setStyleComboDropdown(
                            styleComboDropdown === "model" ? "" : "model",
                          )
                        }
                        className="flex h-[38px] w-full items-center justify-between rounded-xl border border-white/12 px-4 text-left text-[13px] font-medium text-white/90 transition hover:bg-white/3"
                      >
                        <span className="truncate">
                          {STYLE_COMBO_BASE_MODELS.find(
                            (m) => m.value === styleComboModel,
                          )?.label ?? styleComboModel}
                        </span>
                        <ChevronUp
                          className={`ml-2 h-4 w-4 shrink-0 transition-transform duration-200 ${styleComboDropdown === "model" ? "" : "rotate-180"}`}
                        />
                      </button>
                      {styleComboDropdown === "model" && (
                        <div className="absolute left-0 top-full z-[100] mt-1 max-h-64 w-full overflow-y-auto rounded-xl bg-black py-0 ring-1 ring-white/15 backdrop-blur-xl dropdown-scrollbar">
                          {STYLE_COMBO_BASE_MODELS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setStyleComboModel(opt.value);
                                const nextOpts =
                                  liveResolutionOptionsByModel[opt.value] ||
                                  (["1K", "2K", "4K"] as const);
                                if (
                                  !nextOpts.includes(
                                    styleComboResolution as (typeof nextOpts)[number],
                                  )
                                ) {
                                  setStyleComboResolution(
                                    nextOpts[0] as "1K" | "2K" | "4K",
                                  );
                                }
                                setStyleComboDropdown("");
                              }}
                              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] ${styleComboModel === opt.value ? "bg-white/10 font-medium text-white" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                            >
                              {styleComboModel === opt.value && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F6BFF]" />
                              )}
                              <span className="flex-1 truncate">{opt.label}</span>
                              <span className="text-[11px] text-white/45">
                                {getLiveModelCredits(
                                  opt.value,
                                  styleComboResolution,
                                  "auto",
                                )}{" "}
                                credits
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/40">
                          Resolution
                        </label>
                        <div className="relative edit-dropdown">
                          <button
                            type="button"
                            onClick={() =>
                              setStyleComboDropdown(
                                styleComboDropdown === "resolution"
                                  ? ""
                                  : "resolution",
                              )
                            }
                            className="flex h-[38px] w-full items-center justify-between rounded-xl border border-white/12 px-3 text-left text-[13px] font-medium text-white/90 transition hover:bg-white/3"
                          >
                            <span>{styleComboResolution}</span>
                            <ChevronUp
                              className={`ml-1 h-4 w-4 shrink-0 transition-transform duration-200 ${styleComboDropdown === "resolution" ? "" : "rotate-180"}`}
                            />
                          </button>
                          {styleComboDropdown === "resolution" && (
                            <div className="absolute left-0 top-full z-[100] mt-1 max-h-48 w-full overflow-y-auto rounded-xl bg-black py-0 ring-1 ring-white/15 backdrop-blur-xl dropdown-scrollbar">
                              {(
                                liveResolutionOptionsByModel[styleComboModel] ||
                                (["1K", "2K", "4K"] as const)
                              )
                                .filter(
                                  (r): r is "1K" | "2K" | "4K" =>
                                    r === "1K" || r === "2K" || r === "4K",
                                )
                                .map((r) => (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => {
                                      setStyleComboResolution(r);
                                      setStyleComboDropdown("");
                                    }}
                                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] ${styleComboResolution === r ? "bg-white/10 font-medium text-white" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                  >
                                    {styleComboResolution === r && (
                                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F6BFF]" />
                                    )}
                                    {r}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/40">
                          Frame size
                        </label>
                        <div className="relative edit-dropdown">
                          <button
                            type="button"
                            onClick={() =>
                              setStyleComboDropdown(
                                styleComboDropdown === "frame" ? "" : "frame",
                              )
                            }
                            className="flex h-[38px] w-full items-center justify-between rounded-xl border border-white/12 px-3 text-left text-[13px] font-medium text-white/90 transition hover:bg-white/3"
                          >
                            <span className="truncate">
                              {liveFrameSizes.find(
                                (s) => s.value === styleComboFrameSize,
                              )?.name ?? styleComboFrameSize}
                            </span>
                            <ChevronUp
                              className={`ml-1 h-4 w-4 shrink-0 transition-transform duration-200 ${styleComboDropdown === "frame" ? "" : "rotate-180"}`}
                            />
                          </button>
                          {styleComboDropdown === "frame" && (
                            <div className="absolute left-0 top-full z-[100] mt-1 max-h-48 w-full overflow-y-auto rounded-xl bg-black py-0 ring-1 ring-white/15 backdrop-blur-xl dropdown-scrollbar">
                              {liveFrameSizes.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    setStyleComboFrameSize(
                                      opt.value as typeof styleComboFrameSize,
                                    );
                                    setStyleComboDropdown("");
                                  }}
                                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] ${styleComboFrameSize === opt.value ? "bg-white/10 font-medium text-white" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                >
                                  {styleComboFrameSize === opt.value && (
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F6BFF]" />
                                  )}
                                  {opt.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/70">
                      <span className="text-white/45">Est. this run</span>
                      <span className="font-semibold text-white">
                        {styleComboCredits} credits
                      </span>
                    </div>
                  </div>
                  <div className="mb-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStyleComboTab("general")}
                      className={`flex-1 rounded-full px-3 py-1.5 text-[11px] font-medium transition md:text-xs ${
                        styleComboTab === "general"
                          ? "bg-white text-black"
                          : "border border-white/15 bg-white/5 text-white/60 hover:text-white"
                      }`}
                    >
                      General
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyleComboTab("indian")}
                      className={`flex-1 rounded-full px-3 py-1.5 text-[11px] font-medium transition md:text-xs ${
                        styleComboTab === "indian"
                          ? "bg-white text-black"
                          : "border border-white/15 bg-white/5 text-white/60 hover:text-white"
                      }`}
                    >
                      Indian
                    </button>
                  </div>
                  {styleComboTab === "indian" && (
                    <div className="mb-3 space-y-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/40">
                        Indian style version
                      </label>
                      <div className="flex gap-1.5">
                        {(["V1", "V2", "V3"] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setStyleComboIndianVersion(v)}
                            className={`flex-1 rounded-lg py-1.5 text-[11px] font-medium md:text-xs ${
                              styleComboIndianVersion === v
                                ? "bg-[#3B6BFF] text-white"
                                : "bg-white/5 text-white/55 hover:bg-white/10"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <input
                        type="search"
                        value={styleComboIndianSearch}
                        onChange={(e) => setStyleComboIndianSearch(e.target.value)}
                        placeholder="Search Indian styles…"
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-white placeholder:text-white/35 outline-none focus:border-white/25"
                      />
                    </div>
                  )}
                  <div className="mb-3 max-h-[220px] overflow-y-auto thin-scrollbar rounded-xl border border-white/10 bg-black/20 p-2">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {styleComboTab === "general"
                        ? styleComboGeneralStyles.map((s) => {
                            const on = styleComboSelectedIds.includes(s.value);
                            return (
                              <button
                                key={s.value}
                                type="button"
                                onClick={() => toggleStyleComboId(s.value)}
                                className={`relative overflow-hidden rounded-lg border text-left transition ${
                                  on
                                    ? "border-[#3B6BFF] ring-1 ring-[#3B6BFF]/50"
                                    : "border-white/10 hover:border-white/25"
                                }`}
                              >
                                <div className="relative aspect-[4/3] w-full bg-[#18181f]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={s.image}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                  {on ? (
                                    <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B6BFF] text-[10px] text-white">
                                      ✓
                                    </div>
                                  ) : null}
                                </div>
                                <div className="truncate px-1.5 py-1 text-[9px] font-medium text-white/90">
                                  {s.name}
                                </div>
                              </button>
                            );
                          })
                        : styleComboIndianRows.map((row) => {
                            const on = styleComboSelectedIds.includes(row.id);
                            return (
                              <button
                                key={row.id}
                                type="button"
                                onClick={() => toggleStyleComboId(row.id)}
                                className={`relative overflow-hidden rounded-lg border text-left transition ${
                                  on
                                    ? "border-[#3B6BFF] ring-1 ring-[#3B6BFF]/50"
                                    : "border-white/10 hover:border-white/25"
                                }`}
                              >
                                <div className="relative aspect-[4/3] w-full bg-[#18181f]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={row.image}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                  {on ? (
                                    <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B6BFF] text-[10px] text-white">
                                      ✓
                                    </div>
                                  ) : null}
                                </div>
                                <div className="truncate px-1.5 py-1 text-[8px] font-semibold uppercase leading-tight text-white/90">
                                  {row.title}
                                </div>
                              </button>
                            );
                          })}
                    </div>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-[10px] text-white/45">
                    <span>
                      {styleComboSelectedIds.length} selected (max{" "}
                      {STYLE_COMBO_MAX_SELECTIONS})
                    </span>
                    {styleComboSelectedIds.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setStyleComboSelectedIds([])}
                        className="text-[#7aa3ff] hover:underline"
                      >
                        Clear all
                      </button>
                    ) : null}
                  </div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    Optional extra instructions
                  </label>
                  <textarea
                    value={styleComboExtraPrompt}
                    onChange={(e) => setStyleComboExtraPrompt(e.target.value)}
                    rows={3}
                    placeholder="e.g. keep skin tones natural, stronger shadows…"
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-white placeholder:text-white/35 outline-none focus:border-white/25"
                  />
                </div>
              )}

              {/* Vectorize model & parameters */}
              {selectedFeature === "vectorize" && (
                <div className="px-1 md:px-4">
                  {/* <h3 className="text-xs pl-1 font-medium text-white/80 mb-1 md:text-lg">Vectorize Options</h3> */}
                  <div className="space-y-2">
                    {/* Super Mode Toggle */}
                    <div>
                      <label className="block text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1 mt-1">
                        Mode
                      </label>
                      <div className="relative bg-[#1c1c22] border border-[#2a2a34] rounded-[10px] md:rounded-xl md:p-1 p-1 flex">
                        <button
                          onClick={() => setVectorizeSuperMode(false)}
                          className={`flex-1 md:px-3 px-3 md:py-2 py-2 md:text-[12px] text-[13px] font-medium rounded-[8px] md:rounded-xl transition-colors ${!vectorizeSuperMode
                              ? "bg-white text-black shadow-[0_4px_16px_rgba(59,107,255,0.28)]"
                              : "text-white/60 hover:text-white/85"
                            }`}
                        >
                          Line Vector
                        </button>
                        <button
                          onClick={() => setVectorizeSuperMode(true)}
                          className={`flex-1 md:px-3 px-3 md:py-2 py-2 md:text-[12px] text-[13px] font-medium rounded-[8px] md:rounded-xl transition-colors whitespace-nowrap ${vectorizeSuperMode
                              ? "bg-white text-black shadow-[0_4px_16px_rgba(59,107,255,0.28)]"
                              : "text-white/60 hover:text-white/85"
                            }`}
                        >
                          Art Vector
                        </button>
                      </div>
                      {vectorizeSuperMode && (
                        <div className="text-[12px] md:text-[10px] text-white/50 mt-2">
                          First converts image to 2D vector using Seedream, then
                          vectorizes the result
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2 mt-2">
                        Model
                      </label>
                      <div className="relative edit-dropdown">
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "vectorizeModel"
                                ? ""
                                : "vectorizeModel",
                            )
                          }
                          className={`h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90 z-70`}
                        >
                          <span className="truncate">
                            {vectorizeModel === "fal-ai/recraft/vectorize"
                              ? "Recraft Vectorize"
                              : "Image to SVG"}
                          </span>
                          <ChevronUp
                            className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "vectorizeModel" ? "rotate-180" : ""}`}
                          />
                        </button>
                        {activeDropdown === "vectorizeModel" && (
                          <div
                            className={`absolute top-full mt-1 z-30 left-0 w-auto bg-black backdrop-blur-xl rounded-xl ring-1 ring-white/15 py-0 max-h-64 overflow-y-auto dropdown-scrollbar`}
                          >
                            {[
                              {
                                label: "Recraft Vectorize",
                                value: "fal-ai/recraft/vectorize",
                                credits:
                                  vectorizeRecraftCredits +
                                  (vectorizeSuperMode
                                    ? vectorizeArtExtraCredits
                                    : 0),
                              },
                              {
                                label: "Image to SVG",
                                value: "fal-ai/image2svg",
                                credits:
                                  vectorizeImage2SvgCredits +
                                  (vectorizeSuperMode
                                    ? vectorizeArtExtraCredits
                                    : 0),
                              },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setVectorizeModel(opt.value as any);
                                  setActiveDropdown("");
                                }}
                                className={`w-full px-4 py-2.5 text-left text-[13px] z-70 ${vectorizeModel === opt.value ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate">{opt.label}</span>
                                  <span className="text-[11px]">
                                    {opt.credits} credits
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {vectorizeModel === "fal-ai/image2svg" && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                              Colormode
                            </label>
                            <div className="relative edit-dropdown">
                              <button
                                onClick={() =>
                                  setActiveDropdown(
                                    activeDropdown === "vColorMode"
                                      ? ""
                                      : "vColorMode",
                                  )
                                }
                                className={`h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90`}
                              >
                                <span className="truncate">{vColorMode}</span>
                                <ChevronUp
                                  className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${activeDropdown === "vColorMode" ? "" : "rotate-180"}`}
                                />
                              </button>
                              {activeDropdown === "vColorMode" && (
                                <div
                                  className={`absolute z-30 top-full mt-1 left-0 w-full bg-black backdrop-blur-xl rounded-xl ring-1 ring-white/15 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}
                                >
                                  {["color", "binary"].map((opt) => (
                                    <button
                                      key={opt}
                                      onClick={() => {
                                        setVColorMode(opt as any);
                                        setActiveDropdown("");
                                      }}
                                      className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${vColorMode === opt ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                    >
                                      {vColorMode === opt && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                      )}
                                      <span>{opt}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                              Hierarchical
                            </label>
                            <div className="relative edit-dropdown">
                              <button
                                onClick={() =>
                                  setActiveDropdown(
                                    activeDropdown === "vHierarchical"
                                      ? ""
                                      : "vHierarchical",
                                  )
                                }
                                className={`h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90`}
                              >
                                <span className="truncate">{vHierarchical}</span>
                                <ChevronUp
                                  className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${activeDropdown === "vHierarchical" ? "" : "rotate-180"}`}
                                />
                              </button>
                              {activeDropdown === "vHierarchical" && (
                                <div
                                  className={`absolute z-30 top-full mt-1 left-0 w-full bg-black backdrop-blur-xl rounded-xl ring-1 ring-white/15 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}
                                >
                                  {["stacked", "cutout"].map((opt) => (
                                    <button
                                      key={opt}
                                      onClick={() => {
                                        setVHierarchical(opt as any);
                                        setActiveDropdown("");
                                      }}
                                      className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${vHierarchical === opt ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                    >
                                      {vHierarchical === opt && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                      )}
                                      <span>{opt}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                              Mode
                            </label>
                            <div className="relative edit-dropdown">
                              <button
                                onClick={() =>
                                  setActiveDropdown(
                                    activeDropdown === "vMode" ? "" : "vMode",
                                  )
                                }
                                className={`h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90`}
                              >
                                <span className="truncate">{vMode}</span>
                                <ChevronUp
                                  className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${activeDropdown === "vMode" ? "" : "rotate-180"}`}
                                />
                              </button>
                              {activeDropdown === "vMode" && (
                                <div
                                  className={`absolute z-30 top-full mt-1 left-0 w-full bg-black backdrop-blur-xl rounded-xl ring-1 ring-white/15 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}
                                >
                                  {["spline", "polygon"].map((opt) => (
                                    <button
                                      key={opt}
                                      onClick={() => {
                                        setVMode(opt as any);
                                        setActiveDropdown("");
                                      }}
                                      className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${vMode === opt ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                    >
                                      {vMode === opt && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                      )}
                                      <span>{opt}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                              Filter Speckle
                            </label>
                            <input
                              type="number"
                              value={vFilterSpeckle}
                              onChange={(e) =>
                                setVFilterSpeckle(Number(e.target.value))
                              }
                              className="w-full h-[38px] px-3 bg-white/3 border border-white/12 rounded-xl text-white text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                              Color Precision
                            </label>
                            <input
                              type="number"
                              value={vColorPrecision}
                              onChange={(e) =>
                                setVColorPrecision(Number(e.target.value))
                              }
                              className="w-full h-[38px] px-3 bg-white/3 border border-white/12 rounded-xl text-white text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                              Layer Difference
                            </label>
                            <input
                              type="number"
                              value={vLayerDifference}
                              onChange={(e) =>
                                setVLayerDifference(Number(e.target.value))
                              }
                              className="w-full h-[38px] px-3 bg-white/3 border border-white/12 rounded-xl text-white text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                              Corner Threshold
                            </label>
                            <input
                              type="number"
                              value={vCornerThreshold}
                              onChange={(e) =>
                                setVCornerThreshold(Number(e.target.value))
                              }
                              className="w-full h-[38px] px-3 bg-white/3 border border-white/12 rounded-xl text-white text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                              Length Threshold
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={vLengthThreshold}
                              onChange={(e) =>
                                setVLengthThreshold(Number(e.target.value))
                              }
                              className="w-full h-[38px] px-3 bg-white/3 border border-white/12 rounded-xl text-white text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                              Max Iterations
                            </label>
                            <input
                              type="number"
                              value={vMaxIterations}
                              onChange={(e) =>
                                setVMaxIterations(Number(e.target.value))
                              }
                              className="w-full h-[38px] px-3 bg-white/3 border border-white/12 rounded-xl text-white text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                              Splice Threshold
                            </label>
                            <input
                              type="number"
                              value={vSpliceThreshold}
                              onChange={(e) =>
                                setVSpliceThreshold(Number(e.target.value))
                              }
                              className="w-full h-[38px] px-3 bg-white/3 border border-white/12 rounded-xl text-white text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                              Path Precision
                            </label>
                            <input
                              type="number"
                              value={vPathPrecision}
                              onChange={(e) =>
                                setVPathPrecision(Number(e.target.value))
                              }
                              className="w-full h-[38px] px-3 bg-white/3 border border-white/12 rounded-xl text-white text-[13px]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Standardized Estimated Output card */}
                    <div className="pt-1">
                      <p className="text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase md:pt-0 mb-1">
                        Estimated Output
                      </p>
                      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-2">
                        <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                            Resolution
                          </span>
                          <span className="text-[12px]  font-semibold text-white leading-tight uppercase">
                            Vector (SVG)
                          </span>
                        </div>
                        <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                            Est. Cost
                          </span>
                          <span className="text-[12px]  font-semibold text-white leading-tight">
                            {vectorizeModel === "fal-ai/recraft/vectorize"
                              ? `${vectorizeRecraftCredits + (vectorizeSuperMode ? vectorizeArtExtraCredits : 0)} credits`
                              : `${vectorizeImage2SvgCredits + (vectorizeSuperMode ? vectorizeArtExtraCredits : 0)} credits`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons moved to bottom under Parameters */}

              {/* Configuration area (no scroll). Add bottom padding so footer doesn't overlap. */}
              <div
                className={`edit-image-mobile-params flex-1 min-h-0 md:p-4 p-3 ${selectedFeature === "live-chat" ? "overflow-hidden flex flex-col" : "overflow-visible"}`}
              >
                {selectedFeature === "live-chat" && (
                  <>
                    <p className="text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                      Live Chat Controls
                    </p>
                    <div className="h-full min-h-0 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Model dropdown */}
                        <div>
                          <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                            Model
                          </label>
                          <div className="relative edit-dropdown">
                            <button
                              onClick={() =>
                                setLiveActiveDropdown(
                                  liveActiveDropdown === "liveModel"
                                    ? ""
                                    : "liveModel",
                                )
                              }
                              className="h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90"
                            >
                              <span className="min-w-0 flex-1 truncate whitespace-nowrap text-left">
                                {liveAllowedModels.find(
                                  (m) => m.value === liveModel,
                                )?.label || "Select model"}
                              </span>
                              <ChevronUp
                                className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${liveActiveDropdown === "liveModel" ? "" : "rotate-180"}`}
                              />
                            </button>
                            {liveActiveDropdown === "liveModel" && (
                              <div className="absolute top-full z-100 left-0 w-60 bg-black backdrop-blur-xl rounded-xl mt-1 ring-1 ring-white/15 max-h-64 overflow-y-auto dropdown-scrollbar">
                                {liveAllowedModels
                                  .filter(
                                    (opt) =>
                                      opt.value !== "qwen-image-edit-2511" ||
                                      inputs["live-chat"],
                                  )
                                  .map((opt) => (
                                    <button
                                      key={opt.value}
                                      onClick={() => {
                                        setLiveModel(opt.value);
                                        const nextResolutionOptions =
                                          liveResolutionOptionsByModel[
                                          opt.value
                                        ] || ["1K", "2K", "4K"];
                                      if (
                                        !nextResolutionOptions.includes(
                                          liveResolution,
                                        )
                                      ) {
                                        setLiveResolution(
                                          nextResolutionOptions[0],
                                        );
                                      }
                                      setLiveActiveDropdown("");
                                    }}
                                    className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${liveModel === opt.value ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                  >
                                    {liveModel === opt.value && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                    )}
                                    <span className="truncate flex-1">
                                      {opt.label}
                                    </span>
                                    <span className="text-[11px] text-white/45">
                                      {getLiveModelCredits(
                                        opt.value,
                                        liveResolution,
                                        opt.value === "openai/gpt-image-2"
                                          ? liveQuality
                                          : undefined,
                                      )}{" "}
                                      credits
                                    </span>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Frame size */}
                      <div>
                        <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                          Frame Size
                        </label>
                        <div className="relative edit-dropdown">
                          <button
                            onClick={() =>
                              setLiveActiveDropdown(
                                liveActiveDropdown === "liveFrame"
                                  ? ""
                                  : "liveFrame",
                              )
                            }
                            className="h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90"
                          >
                            <span className="truncate">
                              {liveFrameSizes.find(
                                (s) => s.value === liveFrameSize,
                              )?.name || liveFrameSize}
                            </span>
                            <ChevronUp
                              className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${liveActiveDropdown === "liveFrame" ? "" : "rotate-180"}`}
                            />
                          </button>
                          {liveActiveDropdown === "liveFrame" && (
                            <div className="absolute top-full z-100 left-0 w-full bg-black backdrop-blur-xl rounded-xl mt-1 ring-1 ring-white/15 max-h-64 overflow-y-auto dropdown-scrollbar">
                              {liveFrameSizes.map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    setLiveFrameSize(opt.value as any);
                                    setLiveActiveDropdown("");
                                  }}
                                  className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${liveFrameSize === opt.value ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                >
                                  {liveFrameSize === opt.value && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                  )}
                                  <span className="truncate flex-1">
                                    {opt.name}
                                  </span>
                                  <span className="text-[11px] text-white/45">
                                    {opt.value}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Resolution shown when supported by selected model (not for GPT Image 2) */}
                    {liveModel !== "openai/gpt-image-2" &&
                      liveResolutionOptions.length > 0 && (
                      <div>
                        <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                          Resolution
                        </label>
                        <div className="relative edit-dropdown">
                          <button
                            onClick={() =>
                              setLiveActiveDropdown(
                                liveActiveDropdown === "liveResolution"
                                  ? ""
                                  : "liveResolution",
                              )
                            }
                            className="h-[38px] w-64 px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90"
                          >
                            <span className="truncate">{liveResolution}</span>
                            <ChevronUp
                              className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${liveActiveDropdown === "liveResolution" ? "" : "rotate-180"}`}
                            />
                          </button>
                          {liveActiveDropdown === "liveResolution" && (
                            <div className="absolute top-full z-100 left-0 w-full bg-black backdrop-blur-xl rounded-xl mt-1 ring-1 ring-white/15">
                              {liveResolutionOptions.map((r) => (
                                <button
                                  key={r}
                                  onClick={() => {
                                    setLiveResolution(r);
                                    setLiveActiveDropdown("");
                                  }}
                                  className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${liveResolution === r ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                >
                                  {liveResolution === r && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                  )}
                                  <span className="truncate">{r}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* GPT Image 2 quality */}
                    {liveModel === "openai/gpt-image-2" && (
                      <div>
                        <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                          Quality
                        </label>
                        <div className="relative edit-dropdown">
                          <button
                            onClick={() =>
                              setLiveActiveDropdown(
                                liveActiveDropdown === "liveQuality"
                                  ? ""
                                  : "liveQuality",
                              )
                            }
                            className="h-[38px] w-64 px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90"
                          >
                            <span className="truncate">
                              {liveQuality === "auto"
                                ? "Auto"
                                : liveQuality === "low"
                                  ? "Low"
                                  : liveQuality === "medium"
                                    ? "Medium"
                                    : "High"}
                            </span>
                            <ChevronUp
                              className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${liveActiveDropdown === "liveQuality" ? "" : "rotate-180"}`}
                            />
                          </button>
                          {liveActiveDropdown === "liveQuality" && (
                            <div className="absolute top-full z-100 left-0 w-full bg-black backdrop-blur-xl rounded-xl mt-1 ring-1 ring-white/15">
                              {(
                                ["low", "medium", "high", "auto"] as const
                              ).map((q) => {
                                const label =
                                  q === "auto"
                                    ? "Auto"
                                    : q === "low"
                                      ? "Low"
                                      : q === "medium"
                                        ? "Medium"
                                        : "High";
                                const qCredits = getLiveModelCredits(
                                  "openai/gpt-image-2",
                                  undefined,
                                  q,
                                );
                                return (
                                  <button
                                    key={q}
                                    onClick={() => {
                                      setLiveQuality(q);
                                      setLiveActiveDropdown("");
                                    }}
                                    className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${liveQuality === q ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                  >
                                    {liveQuality === q && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                    )}
                                    <span className="truncate flex-1">
                                      {label}
                                    </span>
                                    <span className="text-[11px] text-white/45">
                                      {qCredits} credits
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                      {/* Chat UI */}
                      <div className="mt-3 flex-1 min-h-0 flex flex-col">
                        <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
                          Chat to Edit
                        </label>
                        <div
                          className={` border border-white/12 rounded-xl p-2.5 flex flex-col flex-1 min-h-0 ${liveResolutionOptions.length > 0 ? "h-[16rem] md:h-full" : "h-[20rem] md:h-full"}`}
                        >
                          <div
                            ref={(el) => {
                              chatListRef.current = el;
                            }}
                            className="flex-1 overflow-y-auto space-y-2 md:pr-1 pr-0.5 md:pb-1 pb-0.5 very-thin-scrollbar"
                          >
                            {liveChatMessages.length === 0 && (
                              <div className="text-[13px] text-white/45">
                                Start by uploading an image on the right, then
                                tell me what to change.
                              </div>
                            )}
                            {liveChatMessages.map((m, i) => (
                              <div
                                key={i}
                                ref={(el) => {
                                  if (i === liveChatMessages.length - 1)
                                    lastMsgRef.current = el;
                                }}
                                className={`flex items-start gap-2 transition-transform duration-150 ${m.role === "user" ? "justify-end" : ""}`}
                              >
                                <div
                                  className={`px-3 py-2 rounded-xl text-[13px] ${m.role === "user" ? "bg-[#2F6BFF] text-white" : "bg-white/8 border border-white/12 text-white/90"}`}
                                >
                                  {m.text}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-2 gap-4">
                            <div className="relative gap-2">
                              <input
                                value={livePrompt}
                                onChange={(e) => setLivePrompt(e.target.value)}
                                placeholder="Tell me your edit request"
                                className="w-full h-[38px] px-3 pr-[44px] bg-white/3 border border-white/12 rounded-xl text-[13px] text-white placeholder-white/50"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleLiveGenerate();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleLiveGenerate}
                                disabled={
                                  processing["live-chat"] || !livePrompt.trim()
                                }
                                aria-label="Generate"
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#2F6BFF] text-white rounded-xl flex items-center justify-center border border-white/12 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  width="32"
                                  height="32"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                >
                                  {/* <circle cx="12" cy="12" r="9" /> */}
                                  <path
                                    d="M10 8l4 4-4 4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {selectedFeature !== "vectorize" &&
                  selectedFeature !== "live-chat" && (
                    <>
                      <div className="space-y-">
                        {selectedFeature !== "fill" &&
                          selectedFeature !== "erase" &&
                          selectedFeature !== "expand" &&
                          selectedFeature !== "style-combination" && (
                            <div>
                              <p className="text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase pb-1">
                                AI Model
                              </p>
                              <div className="relative edit-dropdown">
                                {availableModels.length > 1 ? (
                                  <button
                                    onClick={() =>
                                      setActiveDropdown(
                                        activeDropdown === "model" ? "" : "model",
                                      )
                                    }
                                    className={`h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between text-white/90`}
                                  >
                                    <span className="truncate">
                                      {model
                                        ? getUpscaleModelLabel(model)
                                        : "Select model"}
                                    </span>
                                    <ChevronUp
                                      className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${activeDropdown === "model" ? "" : "rotate-180"}`}
                                    />
                                  </button>
                                ) : (
                                  <div className="h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 flex items-center text-white/90 bg-white/2">
                                    <span className="truncate">
                                      {model
                                        ? getUpscaleModelLabel(model)
                                        : "Select model"}
                                    </span>
                                  </div>
                                )}

                                {activeDropdown === "model" &&
                                  availableModels.length > 1 && (
                                    <div
                                      className={`absolute top-full z-100 left-0 w-full bg-black backdrop-blur-xl rounded-xl mt-1 ring-1 ring-white/15 md:max-h-64 max-h-48 overflow-y-auto dropdown-scrollbar`}
                                    >
                                      {availableModels.map((opt) => (
                                        <button
                                          key={opt.value}
                                          onClick={() => {
                                            setModel(opt.value as any);
                                            setActiveDropdown("");
                                          }}
                                          className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${model === opt.value ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                        >
                                          {model === opt.value && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                          )}
                                          <span className="truncate">
                                            {opt.label}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
                        {selectedFeature === "remove-bg" &&
                          String(model).startsWith("bria/eraser") && (
                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-0 md:text-sm">
                                Brush Size
                              </label>
                              <input
                                type="range"
                                min={3}
                                max={150}
                                value={brushSize}
                                onChange={(e) =>
                                  setBrushSize(Number(e.target.value))
                                }
                                className="w-full"
                              />
                              <div className="text-[11px] text-white/50 mt-0">
                                {brushSize}px
                              </div>
                            </div>
                          )}
                        {/* Remove-BG (851-labs) specialized controls */}
                      </div>

                      {selectedFeature === "fill" && (
                        <EditImageEraseControls
                          brushSize={eraseBrushSize}
                          setBrushSize={setEraseBrushSize}
                          prompt={erasePrompt}
                          setPrompt={setErasePrompt}
                          mode={eraseActionMode}
                          setMode={setEraseActionMode}
                          model={eraseModel}
                          setModel={setEraseModel}
                          isProcessing={processing["fill"]}
                          onGenerate={handleRun}
                          onClearMask={() => {
                            setEraseFrameMaskResetNonce((n) => n + 1);
                          }}
                          onBrushAdjustStart={() => setIsAdjustingBrush(true)}
                          onBrushAdjustEnd={() => setIsAdjustingBrush(false)}
                        />
                      )}
                      {/* Removed old fill/erase controls logic */}
                      {selectedFeature === "erase" && (
                        <div className="p-2 text-white/50 text-xs">
                          Erase feature is merged into Replace/Erase.
                        </div>
                      )}

                      {/* Erase feature - no prompt input, uses hardcoded prompt */}
                      {selectedFeature === "erase" && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-white/70 mb-0 md:text-sm">
                              Brush Size
                            </label>
                            <input
                              type="range"
                              min={3}
                              max={150}
                              value={brushSize}
                              onChange={(e) =>
                                setBrushSize(Number(e.target.value))
                              }
                              className="w-full"
                            />
                            <div className="text-[11px] text-white/50 mt-0">
                              {brushSize}px
                            </div>
                          </div>
                          <div className="text-xs text-white/60 mb-0">
                            Draw on the image to mark areas you want to erase. The
                            masked areas will be removed automatically.
                          </div>
                        </>
                      )}

                      {/* Expand feature */}
                      {selectedFeature === "expand" && (
                        <>
                          {expandOriginalSize.width > 0 &&
                            expandOriginalSize.height > 0 && (
                              <div className="mb-2">
                                <div className="text-xs text-white/70">
                                  Original: {expandOriginalSize.width} ×{" "}
                                  {expandOriginalSize.height}px
                                </div>
                                <div className="text-xs text-white/70 mt-1">
                                  New: {expandCustomWidth} × {expandCustomHeight}
                                  px
                                  {(expandEffectiveWidth !== expandCustomWidth ||
                                    expandEffectiveHeight !==
                                    expandCustomHeight) && (
                                      <>
                                        <span className="mx-1 text-white/40">
                                          •
                                        </span>
                                        <span className="text-white/70">
                                          Generated: {expandEffectiveWidth} ×{" "}
                                          {expandEffectiveHeight}px
                                        </span>
                                      </>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExpandBounds({
                                        left: 0,
                                        top: 0,
                                        right: 0,
                                        bottom: 0,
                                      });
                                    }}
                                    className="px-3 py-1.5 text-[11px] rounded bg-white/10 hover:bg-white/20 text-white/80 "
                                  >
                                    Reset
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Center the selection rectangle relative to original image
                                      const w = expandCustomWidth;
                                      const h = expandCustomHeight;
                                      const dw = w - expandOriginalSize.width; // can be negative (crop) or positive (expand)
                                      const dh = h - expandOriginalSize.height;
                                      let left: number,
                                        right: number,
                                        top: number,
                                        bottom: number;
                                      if (dw >= 0) {
                                        left = Math.floor(dw / 2);
                                        right = dw - left;
                                      } else {
                                        const crop = -dw; // pixels to remove
                                        const cLeft = Math.floor(crop / 2);
                                        const cRight = crop - cLeft;
                                        left = -cLeft;
                                        right = -cRight;
                                      }
                                      if (dh >= 0) {
                                        top = Math.floor(dh / 2);
                                        bottom = dh - top;
                                      } else {
                                        const crop = -dh;
                                        const cTop = Math.floor(crop / 2);
                                        const cBottom = crop - cTop;
                                        top = -cTop;
                                        bottom = -cBottom;
                                      }
                                      setExpandBounds({
                                        left,
                                        top,
                                        right,
                                        bottom,
                                      });
                                    }}
                                    className="px-3 py-1.5 text-[11px] rounded bg-white/10 hover:bg-white/20 text-white/80 border border-white/20"
                                  >
                                    Center
                                  </button>
                                </div>
                              </div>
                            )}
                          <div>
                            <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1">
                              Aspect Ratio
                            </label>
                            <div className="relative edit-dropdown">
                              <button
                                onClick={() =>
                                  setActiveDropdown(
                                    activeDropdown === "expandAspect"
                                      ? ""
                                      : "expandAspect",
                                  )
                                }
                                className={`h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90`}
                              >
                                <span className="truncate">
                                  {expandAspectRatio === "custom"
                                    ? "Custom"
                                    : expandAspectRatio}
                                </span>
                                <ChevronUp
                                  className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${activeDropdown === "expandAspect" ? "" : "rotate-180"}`}
                                />
                              </button>
                              {activeDropdown === "expandAspect" && (
                                <div
                                  className={`absolute top-full mt-1 z-100 left-0 w-full bg-black backdrop-blur-xl rounded-xl ring-1 ring-white/15 py-2 max-h-64 overflow-y-auto dropdown-scrollbar shadow-2xl`}
                                >
                                  {[
                                    "custom",
                                    "1:1",
                                    "4:3",
                                    "3:4",
                                    "16:9",
                                    "9:16",
                                    "21:9",
                                    "3:2",
                                    "2:3",
                                  ].map((ar) => (
                                    <button
                                      key={ar}
                                      onClick={() => {
                                        setExpandAspectRatio(ar);
                                        setActiveDropdown("");
                                        if (
                                          ar !== "custom" &&
                                          expandOriginalSize.width > 0 &&
                                          expandOriginalSize.height > 0
                                        ) {
                                          const [w, h] = ar
                                            .split(":")
                                            .map(Number);
                                          const aspect = w / h;
                                          const origAspect =
                                            expandOriginalSize.width /
                                            expandOriginalSize.height;
                                          let newWidth = expandOriginalSize.width;
                                          let newHeight =
                                            expandOriginalSize.height;
                                          if (aspect > origAspect) {
                                            newWidth = Math.round(
                                              expandOriginalSize.height * aspect,
                                            );
                                          } else {
                                            newHeight = Math.round(
                                              expandOriginalSize.width / aspect,
                                            );
                                          }
                                          const left = Math.max(
                                            0,
                                            Math.floor(
                                              (newWidth -
                                                expandOriginalSize.width) /
                                              2,
                                            ),
                                          );
                                          const right =
                                            newWidth -
                                            expandOriginalSize.width -
                                            left;
                                          const top = Math.max(
                                            0,
                                            Math.floor(
                                              (newHeight -
                                                expandOriginalSize.height) /
                                              2,
                                            ),
                                          );
                                          const bottom =
                                            newHeight -
                                            expandOriginalSize.height -
                                            top;
                                          setExpandBounds({
                                            left,
                                            top,
                                            right,
                                            bottom,
                                          });
                                        }
                                      }}
                                      className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${expandAspectRatio === ar ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                    >
                                      {expandAspectRatio === ar && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                      )}
                                      <span className="truncate">
                                        {ar === "custom" ? "Custom" : ar}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-white/60 mt-2">
                            Drag the edges of the image on the canvas to expand or
                            crop. The new dimensions will be calculated
                            automatically.
                          </div>
                        </>
                      )}

                      {/* Prompt not used by current backend operations; keep hidden unless resize later needs it */}
                      {selectedFeature === "resize" &&
                        model === "fal-ai/bria/expand" && (
                          <div className="space-y-2">
                            <EditImageExpandControls
                              aspectPreset={resizeAspectRatio || "custom"}
                              expandPrompt={resizeNegativePrompt}
                              isExpanding={processing.resize}
                              sourceImageUrl={inputs.resize}
                              onAspectPresetChange={(preset) =>
                                setResizeAspectRatio(preset as any)
                              }
                              onExpandPromptChange={setResizeNegativePrompt}
                              onExpand={() => { }}
                              aspectPresets={aspectPresets}
                              customWidth={Number(resizeCanvasW) || 1024}
                              customHeight={Number(resizeCanvasH) || 1024}
                              onCustomWidthChange={(w) => setResizeCanvasW(w)}
                              onCustomHeightChange={(h) => setResizeCanvasH(h)}
                              imageSize={{
                                width: Number(resizeOrigW) || 0,
                                height: Number(resizeOrigH) || 0,
                              }}
                            />

                            {/* Standardized Estimated Output card */}
                            <div className="pt-1">
                              <p className="text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase pt-0 md:pt-0 mb-1">
                                Estimated Output
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                                    Resolution
                                  </span>
                                  <span className="text-[12px] font-semibold text-white leading-tight">
                                    {resizeCanvasW && resizeCanvasH
                                      ? `${resizeCanvasW} × ${resizeCanvasH}`
                                      : "—"}
                                  </span>
                                </div>
                                <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                                    Est. Cost
                                  </span>
                                  <span className="text-[12px] font-semibold text-white leading-tight">
                                    {10} credits
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      {selectedFeature === "remove-bg" &&
                        (model.startsWith("851-labs/") ||
                          String(model).startsWith("lucataco/")) && (
                          <div className="space-y-2 w-full">
                            <div className="grid grid-cols-2 gap-2">
                              {/* Output format (left) */}
                              <div>
                                <label className="block text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1 pt-1">
                                  Output Format
                                </label>
                                <div className="relative edit-dropdown">
                                  <button
                                    onClick={() =>
                                      setActiveDropdown(
                                        activeDropdown === "output"
                                          ? ""
                                          : "output",
                                      )
                                    }
                                    className={`h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90`}
                                  >
                                    <span className="truncate uppercase">
                                      {output || "png"}
                                    </span>
                                    <ChevronUp
                                      className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${activeDropdown === "output" ? "" : "rotate-180"}`}
                                    />
                                  </button>
                                  {activeDropdown === "output" && (
                                    <div
                                      className={`absolute z-[100] top-full mt-1 left-0 w-full bg-black backdrop-blur-xl rounded-xl ring-1 ring-white/15 py-1 max-h-64 overflow-y-auto dropdown-scrollbar`}
                                    >
                                      {["png", "jpg"].map((fmt) => (
                                        <button
                                          key={fmt}
                                          onClick={() => {
                                            setOutput(fmt as any);
                                            setActiveDropdown("");
                                          }}
                                          className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${output === fmt ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                        >
                                          {output === fmt && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                          )}
                                          <span className="uppercase">{fmt}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Background type (right) */}
                              <div>
                                <label className="block text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1 pt-1">
                                  Background Type
                                </label>
                                <div className="relative edit-dropdown">
                                  <button
                                    onClick={() =>
                                      setActiveDropdown(
                                        activeDropdown === "backgroundType"
                                          ? ""
                                          : "backgroundType",
                                      )
                                    }
                                    className={`h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90`}
                                  >
                                    <span className="truncate">
                                      {backgroundType || "Select type"}
                                    </span>
                                    <ChevronUp
                                      className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${activeDropdown === "backgroundType" ? "" : "rotate-180"}`}
                                    />
                                  </button>
                                  {activeDropdown === "backgroundType" && (
                                    <div
                                      className={`absolute top-full z-[100] mt-1 left-0 w-full bg-black backdrop-blur-xl rounded-xl ring-1 ring-white/15 py-1 max-h-40 overflow-y-auto dropdown-scrollbar`}
                                    >
                                      {[
                                        {
                                          label: "RGBA (Transparent)",
                                          value: "rgba",
                                        },
                                        { label: "White", value: "white" },
                                        { label: "Green", value: "green" },
                                        { label: "Blur", value: "blur" },
                                        { label: "Overlay", value: "overlay" },
                                        { label: "Depth-Map", value: "map" },
                                      ].map((opt) => (
                                        <button
                                          key={opt.value}
                                          onClick={() => {
                                            setBackgroundType(opt.value);
                                            setActiveDropdown("");
                                          }}
                                          className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${backgroundType === opt.value ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                        >
                                          {backgroundType === opt.value && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                          )}
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {model.startsWith("851-labs/") && (
                              <div>
                                <label className="block text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1">
                                  Reverse
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setReverseBg((v) => !v)}
                                  className={`h-[30px] w-full px-4 rounded-xl border text-[13px] font-medium transition ${reverseBg ? "bg-white border-[#2F6BFF] text-black shadow-[0_4px_16px_rgba(47,107,255,0.28)]" : "bg-white/3 border-white/20 text-white/60 hover:border-white/35 hover:text-white/85"}`}
                                >
                                  {reverseBg ? "Enabled" : "Disabled"}
                                </button>
                              </div>
                            )}

                            {/* Standardized Estimated Output card */}
                            <div className="pt-1">
                              <p className="text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase md:pt-0 mb-1">
                                Estimated Output
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                                    Resolution
                                  </span>
                                  <span className="text-[12px] md:text-[10px] font-semibold text-white leading-tight">
                                    {inputNaturalSize.width > 0
                                      ? `${inputNaturalSize.width} × ${inputNaturalSize.height}`
                                      : "Original size"}
                                  </span>
                                </div>
                                <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                                    Est. Cost
                                  </span>
                                  <span className="text-[12px] md:text-[10px]font-semibold text-white leading-tight">
                                    1 credit
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      {selectedFeature === "erase" && (
                        <div className="p-2 text-white/50 text-xs">
                          Erase feature is merged into Replace/Erase.
                        </div>
                      )}

                      {selectedFeature === "upscale" && (
                        <>
                          {model === "fal-ai/seedvr/upscale/image" && (
                            <div className="space-y-2">
                              {/* AI MODEL label */}
                              <div>
                                <p className="text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase pt-1">
                                  Upscale Factor (N)
                                </p>
                                {/* Range label row */}
                                <div className="flex items-center justify-between mb-0">
                                  <span className="text-[12px] md:text-[10px] text-white/50">
                                    1× — 8×
                                  </span>
                                  <span className="bg-[#2F6BFF] text-white text-[11px] font-semibold px-2 py-0.5 rounded-md leading-tight">
                                    {seedvrUpscaleFactor}×
                                  </span>
                                </div>
                                {/* Slider */}
                                <input
                                  type="range"
                                  min={1}
                                  max={8}
                                  step={1}
                                  value={seedvrUpscaleFactor}
                                  onChange={(e) =>
                                    setSeedvrUpscaleFactor(Number(e.target.value))
                                  }
                                  className="w-full h-[3px] appearance-none rounded-full cursor-pointer"
                                  style={{
                                    background: `linear-gradient(to right, #2F6BFF 0%, #2F6BFF ${((seedvrUpscaleFactor - 1) / 7) * 100}%, rgba(255,255,255,0.15) ${((seedvrUpscaleFactor - 1) / 7) * 100}%, rgba(255,255,255,0.15) 100%)`,
                                  }}
                                />
                                {/* Tick marks */}
                                <div className="flex justify-between mt-1.5 px-[8px]">
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map((v) => (
                                    <span
                                      key={v}
                                      className="text-[10px] text-white/30 w-0 flex justify-center"
                                    >
                                      {v}×
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Standardized Estimated Output card */}
                              <div className="pt-1">
                                <p className="text-[12px]  md:text-[10px] font-semibold tracking-widest text-white/40 uppercase pt-1 md:pt-0 mb-1">
                                  Estimated Output
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                                      Resolution
                                    </span>
                                    <span className="text-[12px] md:text-[10px] font-semibold text-white leading-tight">
                                      {seedvrEstimate
                                        ? `${seedvrEstimate.outW} × ${seedvrEstimate.outH}`
                                        : "—"}
                                    </span>
                                  </div>
                                  <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                                      Est. Cost
                                    </span>
                                    <span className="text-[12px] md:text-[10px] font-semibold text-white leading-tight">
                                      {seedvrEstimate
                                        ? `${seedvrEstimate.credits} credits`
                                        : "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="hidden md:block text-[11px] text-white/40 leading-relaxed bg-white/[0.02] p-2 rounded-xl border border-white/5">
                                Uses factor-only upscaling. Estimated cost is 1
                                credits per output megapixel.
                              </div>
                            </div>
                          )}
                          {model === "nightmareai/real-esrgan" && (
                            <div className="space-y-2">
                              {/* Scale slider */}
                              <div>
                                <p className="text-[12px] md:text-[10px]font-semibold tracking-widest text-white/40 uppercase mb-1 pt-2">
                                  Scale (1x-10x)
                                </p>
                                {/* Range label row */}
                                <div className="flex items-center justify-between mb-0">
                                  <span className="text-[12px] md:text-[10px] text-white/50">
                                    1× — 10×
                                  </span>
                                  <span className="bg-[#2F6BFF] text-white text-[11px] font-semibold px-2 py-0.5 rounded-md leading-tight">
                                    {Number(
                                      String(scaleFactor).replace("x", ""),
                                    ) || 4}
                                    ×
                                  </span>
                                </div>
                                {/* Slider */}
                                <input
                                  type="range"
                                  min={1}
                                  max={10}
                                  step={1}
                                  value={
                                    Number(
                                      String(scaleFactor).replace("x", ""),
                                    ) || 4
                                  }
                                  onChange={(e) =>
                                    setScaleFactor(String(e.target.value))
                                  }
                                  className="w-full h-[3px] appearance-none rounded-full cursor-pointer"
                                  style={{
                                    background: `linear-gradient(to right, #2F6BFF 0%, #2F6BFF ${(((Number(String(scaleFactor).replace("x", "")) || 4) - 1) / 9) * 100}%, rgba(255,255,255,0.15) ${(((Number(String(scaleFactor).replace("x", "")) || 4) - 1) / 9) * 100}%, rgba(255,255,255,0.15) 100%)`,
                                  }}
                                />
                                {/* Tick marks */}
                                <div className="flex justify-between mt-1.5 px-[8px]">
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                                    <span
                                      key={v}
                                      className="text-[10px] text-white/30 w-0 flex justify-center"
                                    >
                                      {v}×
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Face enhance toggle */}
                              <div>
                                <p className="text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase pt-1 mb-2">
                                  Face enhance
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setFaceEnhance((v) => !v)}
                                  className={`h-[30px] w-full px-4 rounded-xl border text-[13px] font-medium transition ${faceEnhance ? "bg-white border-[#2F6BFF] text-black shadow-[0_4px_16px_rgba(47,107,255,0.28)]" : "bg-transparent border-white/20 text-white/60 hover:border-white/35 hover:text-white/85"}`}
                                >
                                  {faceEnhance ? "Enabled" : "Disabled"}
                                </button>
                              </div>

                              {/* Standardized Estimated Output card */}
                              <div className="pt-1">
                                <p className="text-[12px]  md:text-[10px] font-semibold tracking-widest text-white/40 uppercase pt-1 md:pt-0 mb-1">
                                  Estimated Output
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                                      Resolution
                                    </span>
                                    <span className="text-[12px]  font-semibold text-white leading-tight">
                                      {realEsrganEstimate
                                        ? `${realEsrganEstimate.outW} × ${realEsrganEstimate.outH}`
                                        : "—"}
                                    </span>
                                  </div>
                                  <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                                      Est. Cost
                                    </span>
                                    <span className="text-[12px]  font-semibold text-white leading-tight">
                                      {realEsrganEstimate
                                        ? `${realEsrganEstimate.credits} credits`
                                        : "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {model === "philz1337x/crystal-upscaler" && (
                            <div className="space-y-2">
                              {/* AI MODEL label */}
                              <div>
                                <p className="text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-0 pt-1">
                                  Scale Factor
                                </p>
                                {/* Range label row */}
                                <div className="flex items-center justify-between mb-0">
                                  <span className="text-[12px]  text-white/50">
                                    1× — 6×
                                  </span>
                                  <span className="bg-[#2F6BFF] text-white text-[11px] font-semibold px-2 py-0.5 rounded-md leading-tight">
                                    {Number(
                                      String(scaleFactor).replace("x", ""),
                                    ) || 2}
                                    ×
                                  </span>
                                </div>
                                {/* Slider */}
                                <input
                                  type="range"
                                  min={1}
                                  max={6}
                                  step={1}
                                  value={
                                    Number(
                                      String(scaleFactor).replace("x", ""),
                                    ) || 2
                                  }
                                  onChange={(e) =>
                                    setScaleFactor(String(e.target.value))
                                  }
                                  className="w-full h-[3px] appearance-none rounded-full cursor-pointer"
                                  style={{
                                    background: `linear-gradient(to right, #2F6BFF 0%, #2F6BFF ${(((Number(String(scaleFactor).replace("x", "")) || 2) - 1) / 5) * 100}%, rgba(255,255,255,0.15) ${(((Number(String(scaleFactor).replace("x", "")) || 2) - 1) / 5) * 100}%, rgba(255,255,255,0.15) 100%)`,
                                  }}
                                />
                                {/* Tick marks */}
                                <div className="flex justify-between mt-1.5 px-[8px]">
                                  {[1, 2, 3, 4, 5, 6].map((v) => (
                                    <span
                                      key={v}
                                      className="text-[10px] text-white/30 w-0 flex justify-center"
                                    >
                                      {v}×
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Output Format */}
                              {/* Output Format — Only for models that support explicit format selection */}
                              {[
                                "philz1337x/crystal-upscaler",
                                "fal-ai/topaz/upscale/image",
                                "nightmareai/real-esrgan",
                                "philz1337x/clarity-upscaler",
                                "fal-ai/seedvr/upscale/image",
                              ].includes(model as any) && (
                                  <div>
                                    <p className="text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1">
                                      Output Format
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {["png", "jpg"].map((fmt) => (
                                        <button
                                          key={fmt}
                                          onClick={() => setOutput(fmt as any)}
                                          className={`px-3 py-1 rounded-xl text-[12px] font-medium border transition-all ${(output || "png") === fmt
                                              ? "bg-[#2F6BFF] border-[#2F6BFF] text-white"
                                              : "bg-transparent border-white/20 text-white/60 hover:border-white/40 hover:text-white/80"
                                            }`}
                                        >
                                          {fmt.toUpperCase()}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {/* Estimated Output card — always visible */}
                              <div>
                                <p className="text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase pt-1 md:pt-0 mb-1">
                                  Estimated Output
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35 pb-1 md:pb-0">
                                      Resolution
                                    </span>
                                    <span className="text-[12px] font-semibold text-white leading-tight">
                                      {inputNaturalSize.width > 0
                                        ? `${inputNaturalSize.width * (Number(String(scaleFactor).replace("x", "")) || 2)} × ${inputNaturalSize.height * (Number(String(scaleFactor).replace("x", "")) || 2)}`
                                        : `${Number(String(scaleFactor).replace("x", "")) || 2}× size`}
                                    </span>
                                  </div>
                                  <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35 pb-1 md:pb-0">
                                      Est. Cost
                                    </span>
                                    <span className="text-[12px]  font-semibold text-white leading-tight">
                                      {crystalEstimate
                                        ? `${crystalEstimate.credits} credits`
                                        : "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {model === "fal-ai/topaz/upscale/image" && (
                            <div className="space-y-2">
                              <div>
                                <label className="block text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1 md:mb-1 pt-2 md:pt-1">
                                  Model
                                </label>
                                <div className="relative edit-dropdown">
                                  <button
                                    onClick={() =>
                                      setActiveDropdown(
                                        activeDropdown === "topazModel"
                                          ? ""
                                          : "topazModel",
                                      )
                                    }
                                    className={`h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90`}
                                  >
                                    <span className="truncate">{topazModel}</span>
                                    <ChevronUp
                                      className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${activeDropdown === "topazModel" ? "" : "rotate-180"}`}
                                    />
                                  </button>
                                  {activeDropdown === "topazModel" && (
                                    <div
                                      className={`absolute z-30 top-full mt-1 left-0 w-full bg-black backdrop-blur-xl rounded-xl ring-1 ring-white/15 py-1 max-h-64 overflow-y-auto dropdown-scrollbar`}
                                    >
                                      {[
                                        "Low Resolution V2",
                                        "Standard V2",
                                        "CGI",
                                        "High Fidelity V2",
                                        "Text Refine",
                                        "Recovery",
                                        "Redefine",
                                        "Recovery V2",
                                      ].map((opt) => (
                                        <button
                                          key={opt}
                                          onClick={() => {
                                            setTopazModel(opt as any);
                                            setActiveDropdown("");
                                          }}
                                          className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${topazModel === opt ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                        >
                                          {topazModel === opt && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                          )}
                                          <span>{opt}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <p className="text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1 md:mb-0 pt-2 md:pt-1">
                                  Upscale Factor
                                </p>
                                {/* Range label row */}
                                <div className="flex items-center justify-between mb-0">
                                  <span className="text-[12px]  text-white/50">
                                    1× — 6×
                                  </span>
                                  <span className="bg-[#2F6BFF] text-white text-[11px] font-semibold px-2 py-0.5 rounded-md leading-tight">
                                    {topazUpscaleFactor}×
                                  </span>
                                </div>
                                {/* Slider */}
                                <input
                                  type="range"
                                  min={1}
                                  max={6}
                                  step={1}
                                  value={topazUpscaleFactor}
                                  onChange={(e) =>
                                    setTopazUpscaleFactor(Number(e.target.value))
                                  }
                                  className="w-full h-[3px] appearance-none rounded-full cursor-pointer"
                                  style={{
                                    background: `linear-gradient(to right, #2F6BFF 0%, #2F6BFF ${((topazUpscaleFactor - 1) / 5) * 100}%, rgba(255,255,255,0.15) ${((topazUpscaleFactor - 1) / 5) * 100}%, rgba(255,255,255,0.15) 100%)`,
                                  }}
                                />
                                {/* Tick marks */}
                                <div className="flex justify-between mt-1.5 px-[8px]">
                                  {[1, 2, 3, 4, 5, 6].map((v) => (
                                    <span
                                      key={v}
                                      className="text-[10px] text-white/30 w-0 flex justify-center"
                                    >
                                      {v}×
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1">
                                    Subject detection
                                  </label>
                                  <div className="relative edit-dropdown">
                                    <button
                                      onClick={() =>
                                        setActiveDropdown(
                                          activeDropdown === "backgroundType"
                                            ? ""
                                            : "backgroundType",
                                        )
                                      }
                                      className={`h-[30px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90`}
                                    >
                                      <span className="truncate">
                                        {topazSubjectDetection}
                                      </span>
                                      <ChevronUp
                                        className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${activeDropdown === "backgroundType" ? "" : "rotate-180"}`}
                                      />
                                    </button>
                                    {activeDropdown === "backgroundType" && (
                                      <div
                                        className={`absolute z-30 top-full mt-1 left-0 w-full bg-black backdrop-blur-xl rounded-xl ring-1 ring-white/15 py-1 max-h-64 overflow-y-auto dropdown-scrollbar`}
                                      >
                                        {(
                                          [
                                            "All",
                                            "Foreground",
                                            "Background",
                                          ] as const
                                        ).map((opt) => (
                                          <button
                                            key={opt}
                                            onClick={() => {
                                              setTopazSubjectDetection(opt);
                                              setActiveDropdown("");
                                            }}
                                            className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${topazSubjectDetection === opt ? "bg-white/10 text-white font-medium" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
                                          >
                                            {topazSubjectDetection === opt && (
                                              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                                            )}
                                            <span>{opt}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1">
                                    Face enhancement
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setTopazFaceEnhance((v) => !v)}
                                    className={`h-[30px] w-full px-4 rounded-xl border text-[13px] font-medium transition ${topazFaceEnhance ? "bg-white border-[#2F6BFF] text-black shadow-[0_4px_16px_rgba(47,107,255,0.28)]" : "bg-transparent border-white/20 text-white/60 hover:border-white/35 hover:text-white/85"}`}
                                  >
                                    {topazFaceEnhance ? "Enabled" : "Disabled"}
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1">
                                    Face creativity (0-1)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    value={topazFaceCreativity}
                                    onChange={(e) =>
                                      setTopazFaceCreativity(
                                        Math.max(
                                          0,
                                          Math.min(
                                            1,
                                            Number(e.target.value) || 0,
                                          ),
                                        ),
                                      )
                                    }
                                    className="w-full h-[30px] px-4 bg-transparent border border-white/12 rounded-xl text-white text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1">
                                    Crop to fill
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setTopazCropToFill((v) => !v)}
                                    className={`h-[30px] w-full px-4 rounded-xl border text-[13px] font-medium transition ${topazCropToFill ? "bg-white border-[#2F6BFF] text-black shadow-[0_4px_16px_rgba(47,107,255,0.28)]" : "bg-transparent border-white/20 text-white/60 hover:border-white/35 hover:text-white/85"}`}
                                  >
                                    {topazCropToFill ? "Enabled" : "Disabled"}
                                  </button>
                                </div>
                              </div>

                              {/* Standardized Estimated Output card */}
                              <div className="pt-1">
                                <p className="text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase pt-1 md:pt-0 mb-1">
                                  Estimated Output
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                                      Resolution
                                    </span>
                                    <span className="text-[12px] font-semibold text-white leading-tight">
                                      {topazEstimate
                                        ? `${topazEstimate.outW} × ${topazEstimate.outH}`
                                        : "—"}
                                    </span>
                                  </div>
                                  <div className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                                      Est. Cost
                                    </span>
                                    <span className="text-[12px]  font-semibold text-white leading-tight">
                                      {topazEstimate
                                        ? `${topazEstimate.credits} credits`
                                        : "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
              </div>
            </div>
          }
          footer={
            selectedFeature !== "live-chat" ? (
              <div className="flex items-center gap-2 2xl:gap-3">
                <button
                  onClick={handleReset}
                  className="w-[93px] md:flex-1 md:w-auto px-2 py-2 md:px-2 md:py-2 text-sm md:text-xs font-semibold md:font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl md:rounded-xl transition-colors 2xl:text-sm"
                >
                  Reset
                </button>
                <button
                  onClick={handleRun}
                  disabled={
                    !inputs[selectedFeature] ||
                    processing[selectedFeature] ||
                    (selectedFeature === "style-combination" &&
                      (styleComboSelectedIds.length === 0 ||
                        !styleComboMaskPainted))
                  }
                  className="flex-1 px-2 py-2 md:px-2 md:py-2 text-sm md:text-xs font-semibold text-white bg-[#3B6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl md:rounded-xl shadow-[0_10px_30px_rgba(59,107,255,0.28)] transition-colors 2xl:text-sm"
                >
                  {processing[selectedFeature] ? "Processing..." : "Generate"}
                </button>
                {(selectedFeature === "fill" ||
                  selectedFeature === "expand" ||
                  selectedFeature === "style-combination") && (
                  <div className=" w-[92px] flex items-center text-[11px] text-white/70 px-2 py-2 rounded-xl bg-white/5 border border-white/10">
                    {selectedFeature === "fill"
                      ? eraseCredits
                      : selectedFeature === "expand"
                        ? expandCredits
                        : styleComboCredits}{" "}
                    credits
                  </div>
                )}
              </div>
            ) : null
          }
        />

        {/* Right Main Area - Image Display */}
        <EditImageCanvasArea
          className="order-1 flex-none shrink-0 h-[18rem] md:order-2 md:flex-1 md:h-auto min-h-0 md:min-h-0 md:rounded-none md:border-0 md:bg-[#0E0E12]"
          topBarClassName="hidden md:flex"
          topBar={
            <div className="flex items-center w-full h-full gap-2">
              {/* Left: Breadcrumb */}

            {/* Center: Feature tabs */}
            <div
              className="flex-1 flex items-center overflow-x-auto no-scrollbar h-full"
              ref={featureTabsRef}
              onScroll={handleFeatureTabsScroll}
            >
              <div className="flex items-center gap-[2px] h-full">
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureSelect(feature.id as EditFeature)}
                    className={`relative flex items-center gap-[6px] px-[10px] h-full text-[12px] whitespace-nowrap transition-all duration-150 ${
                      selectedFeature === feature.id
                        ? "text-white font-medium after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:rounded-t-full after:bg-white/40"
                        : "text-white/40 font-normal hover:text-white/70"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-[14px] h-[14px] shrink-0 transition-opacity ${selectedFeature === feature.id ? "opacity-80" : "opacity-40"}`}
                    >
                      {feature.id === "upscale" && (
                        <img
                          src="https://idr01.zata.ai/devstoragev1/public/icons/scaling.svg"
                          alt=""
                          className="w-[14px] h-[14px]"
                        />
                      )}
                      {feature.id === "remove-bg" && (
                        <img
                          src="https://idr01.zata.ai/devstoragev1/public/icons/image-minus.svg"
                          alt=""
                          className="w-[14px] h-[14px]"
                        />
                      )}
                      {feature.id === "resize" && (
                        <img
                          src="https://idr01.zata.ai/devstoragev1/public/icons/resize.svg"
                          alt=""
                          className="w-[13px] h-[13px]"
                        />
                      )}
                      {feature.id === "fill" && (
                        <img
                          src="https://idr01.zata.ai/devstoragev1/public/icons/inpaint.svg"
                          alt=""
                          className="w-[14px] h-[14px]"
                        />
                      )}
                      {feature.id === "vectorize" && (
                        <img
                          src="https://idr01.zata.ai/devstoragev1/public/icons/vector.svg"
                          alt=""
                          className="w-[14px] h-[14px]"
                        />
                      )}
                      {feature.id === "live-chat" && (
                        <img
                          src="https://idr01.zata.ai/devstoragev1/public/icons/chat.svg"
                          alt=""
                          className="w-[14px] h-[14px]"
                        />
                      )}
                    </span>
                    <span>
                      {feature.id === "fill"
                        ? "Erase / Replace"
                        : feature.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

              {/* Right: Action icons */}
              <div className="hidden md:flex items-center gap-1 shrink-0">
                {/* Zoom in */}
                <button
                  title="Zoom in"
                  className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
                  </svg>
                </button>
                {/* Zoom out */}
                <button
                  title="Zoom out"
                  className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35M8 11h6" />
                  </svg>
                </button>
                {/* Divider */}
                <span className="w-px h-4 bg-white/10 mx-1" />
                {/* Download */}
                <button
                  title="Download"
                  onClick={handleDownloadOutput}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </button>
                {/* Share */}
                <button
                  title="Share"
                  onClick={handleShareOutput}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                  </svg>
                </button>
              </div>
            </div>
          }
          canvas={
            <div className="flex-1 flex flex-col relative w-full h-full px-0 pb-1 pt-0 md:p-10 bg-transparent md:bg-[#0E0E12] overflow-hidden">
              {/* Right Main Area - Output preview parallel to input image */}
              <div className="md:p-0 p-0 flex flex-col md:flex-row items-start justify-center md:gap-0 gap-2 md:pt-1 lg:pt-2 xl:pt-3 pt-0">
                <div
                  className={`relative w-full max-w-6xl md:max-w-[100rem] ${(selectedFeature as any) === "live-chat"
                      ? "min-h-[18rem] md:min-h-[28rem] lg:min-h-[28rem]"
                      : inputs[selectedFeature]
                        ? "min-h-[18rem] md:min-h-0"
                        : "md:min-h-0"
                    }`}
                  onDragOver={(e) => {
                    try {
                      e.preventDefault();
                    } catch { }
                  }}
                  onDrop={(e) => {
                    try {
                      e.preventDefault();
                      const file = e.dataTransfer?.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const img = ev.target?.result as string;
                        // Apply dropped image to all features so switching tabs preserves the same input
                        setInputs({
                          upscale: img,
                          "remove-bg": img,
                          resize: img,
                          fill: img,
                          vectorize: img,
                          erase: img,
                          expand: img,
                          reimagine: img,
                          "live-chat": img,
                          "style-combination": img,
                        });
                        // Clear all outputs when a new image is dropped so the output area re-renders
                        setOutputs({
                          upscale: null,
                          "remove-bg": null,
                          resize: null,
                          fill: null,
                          vectorize: null,
                          erase: null,
                          expand: null,
                          reimagine: null,
                          "live-chat": null,
                          "style-combination": null,
                        });
                        // Also reset zoom and pan state
                        setScale(1);
                        setOffset({ x: 0, y: 0 });
                      };
                      reader.readAsDataURL(file);
                    } catch { }
                  }}
                >
                  {/* {inputs[selectedFeature] && (
                  <div className="absolute top-0 left-1 z-30 md:hidden">
                    <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
                      <button
                        title="Zoom in"
                        onClick={() => {
                          const newScale = Math.min(6, scale + 0.1);
                          setScale(newScale);
                          setOffset(clampOffset(offset, newScale));
                        }}
                        disabled={scale >= 6}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
                        </svg>
                      </button>
                      <button
                        title="Zoom out"
                        onClick={() => {
                          const newScale = Math.max(0.1, scale - 0.1);
                          setScale(newScale);
                          setOffset(clampOffset(offset, newScale));
                        }}
                        disabled={scale <= 0.1}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="M21 21l-4.35-4.35M8 11h6" />
                        </svg>
                      </button>
                      <span className="w-px h-4 bg-white/15 mx-0.5" />
                      <button
                        title="Download"
                        onClick={handleDownloadOutput}
                        disabled={!outputs[selectedFeature]}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                      </button>
                      <button
                        title="Share"
                        onClick={handleShareOutput}
                        disabled={!outputs[selectedFeature]}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )} */}

                  {outputs[selectedFeature] && (
                    <div className="absolute md:top-5 top-0 md:left-4 left-1 z-10  ">
                      <span className="text-[10px] font-medium text-white bg-white/5 border border-white/10 px-1.5 py-0.5 rounded rounded-xl md:text-sm md:px-3 md:py-1.5">
                        {selectedFeature === "upscale" &&
                          upscaleViewMode === "comparison"
                          ? "Input Image"
                          : "Output Image"}
                      </span>
                    </div>
                  )}

                {/* Bottom-left controls: menu (if output) and upload (always when image present) */}
                {(outputs[selectedFeature] || inputs[selectedFeature]) && (
                  <div className="absolute md:bottom-3 bottom-0 md:left-3 left-1 z-50 md:bottom-4 md:left-4 flex items-center md:gap-2 gap-1">
                    {outputs[selectedFeature] && (
                      <div className="relative">
                        <button
                          ref={menuButtonRef}
                          className="md:p-2.5 p-0.5 bg-white/5 hover:bg-black/70 text-white rounded-xl transition-all duration-200 border border-white/10 md:p-2"
                          aria-haspopup="menu"
                          aria-expanded={showImageMenu}
                          onClick={() => setShowImageMenu((v) => !v)}
                        >
                          <svg
                            className="w-4 h-4 2xl:w-5 2xl:h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="5" cy="12" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="19" cy="12" r="2" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {/* Upload other button next to menu */}
                    <button
                      onClick={() => {
                        // Do not clear existing image/output here. Only open the modal.
                        // If user picks a new image, onAdd will replace the input.
                        try {
                          handleOpenUploadModal();
                        } catch {}
                      }}
                      className="md:p-4 md:px-2 px-1.25 md:py-2 py-1 md:mt-0 -mt-1 bg-white/5 hover:bg-black/70 text-white rounded-xl transition-all duration-200 border border-white/10"
                      title="Upload other"
                    >
                      <Image
                        src="https://idr01.zata.ai/devstoragev1/public/icons/fileupload.svg"
                        alt="Upload"
                        width={16}
                        height={16}
                        className="md:w-6 md:h-6 w-3 h-3"
                      />
                    </button>

                      {/* Themed dropdown menu */}
                      {outputs[selectedFeature] && showImageMenu && (
                        <div
                          ref={menuRef}
                          className="absolute md:bottom-10 bottom-7 left-0 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl w-auto min-w-[100px] overflow-hidden md:min-w-[150px]"
                        >
                          <button
                            onClick={async () => {
                              console.log("Download clicked!");
                              await handleDownloadOutput();
                              setShowImageMenu(false);
                            }}
                            className="w-full md:px-4 px-2 md:py-3 py-1 text-left text-white hover:bg-green-500/20 md:text-sm text-xs flex items-center md:gap-3 gap-1 transition-colors duration-200 border-b border-white/10 md:text-base md:py-2"
                          >
                            <svg
                              className="md:w-4 md:h-4 w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                              />
                            </svg>
                            Download
                          </button>
                          <button
                            onClick={async () => {
                              console.log("Share clicked!");
                              await handleShareOutput();
                              setShowImageMenu(false);
                            }}
                            className="w-full md:px-4 px-2 md:py-3 py-1 text-left text-white hover:bg-blue-500/20 md:text-sm text-xs flex items-center md:gap-3 gap-1 transition-colors duration-200 md:text-base md:py-2"
                          >
                            <svg
                              className="md:w-4 md:h-4 w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z"
                              />
                            </svg>
                            {shareCopied ? "Copied!" : "Share"}
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                if (selectedFeature === "live-chat") {
                                  // Special case: deleting the input/original image
                                  if (activeLiveIndex === -1) {
                                    // Clear the input images
                                    setLiveOriginalInput(null);
                                    setInputs((prev) => ({
                                      ...prev,
                                      ["live-chat"]: null,
                                    }));

                                    // If there are generated images, switch to the last one
                                    if (liveHistory.length > 0) {
                                      const lastIdx = liveHistory.length - 1;
                                      const lastImage = liveHistory[lastIdx];
                                      setActiveLiveIndex(lastIdx);
                                      setOutputs((prev) => ({
                                        ...prev,
                                        ["live-chat"]: lastImage.url,
                                      }));
                                      setInputs((prev) => ({
                                        ...prev,
                                        ["live-chat"]: lastImage.url,
                                      }));
                                      setCurrentHistoryId(lastImage.id || null);
                                    } else {
                                      // No generated images, reset everything
                                      setOutputs((prev) => ({
                                        ...prev,
                                        ["live-chat"]: null,
                                      }));
                                      setCurrentHistoryId(null);
                                    }
                                  } else {
                                    // Deleting a generated image from history
                                    await handleDeleteLiveChatImage(
                                      activeLiveIndex,
                                      currentHistoryId || undefined,
                                    );
                                  }
                                } else {
                                  // For other features, just delete from server and clear output
                                  const id = currentHistoryId;
                                  if (id) {
                                    await axiosInstance.delete(
                                      `/api/generations/${id}`,
                                    );
                                  }
                                  setOutputs((prev) => ({
                                    ...prev,
                                    [selectedFeature]: null,
                                  }));
                                }
                                setShowImageMenu(false);
                              } catch (e) {
                                console.error("Delete failed:", e);
                                setShowImageMenu(false);
                              }
                            }}
                            className="w-full md:px-4 px-2 md:py-3 py-1 text-left text-red-300 hover:bg-red-500/10 md:text-sm text-xs flex items-center md:gap-3 gap-1 transition-colors duration-200 border-t border-white/10 md:text-base md:py-2"
                          >
                            <svg
                              className="md:w-4 md:h-4 w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {outputs[selectedFeature] ? (
                    <div className="w-full h-full relative">
                      {inputs[selectedFeature] ? (
                        // Upscale (toggle compare/zoom) OR Remove-BG (compare only)
                        <div
                          className={`w-full h-full relative min-h-[24rem] md:min-h-[28rem] lg:min-h-[28rem]`}
                        >
                          {selectedFeature === "resize" && (
                            <div className="absolute inset-0 z-10">
                              <EditImageExpandFrame
                                sourceImageUrl={inputs.resize}
                                localExpandedImageUrl={null}
                                expandedImageUrl={outputs.resize}
                                aspectPreset={resizeAspectRatio || "custom"}
                                aspectPresets={aspectPresets}
                                customWidth={Number(resizeCanvasW) || 1024}
                                customHeight={Number(resizeCanvasH) || 1024}
                                onFrameInfoChange={(info) => {
                                  if (info) {
                                    // Only update if values actually changed to avoid infinite loops
                                    if (
                                      info.canvasSize[0] !== Number(resizeCanvasW)
                                    )
                                      setResizeCanvasW(info.canvasSize[0]);
                                    if (
                                      info.canvasSize[1] !== Number(resizeCanvasH)
                                    )
                                      setResizeCanvasH(info.canvasSize[1]);
                                    // We don't necessarily want to overwrite original size if it was set by image load,
                                    // but the frame info reflects the current image state in the canvas.
                                    // setResizeOrigW(info.originalImageSize[0]);
                                    // setResizeOrigH(info.originalImageSize[1]);

                                    // Update location
                                    setResizeOrigX(info.originalImageLocation[0]);
                                    setResizeOrigY(info.originalImageLocation[1]);
                                  }
                                }}
                                onImageSizeChange={(size) => {
                                  if (size) {
                                    setResizeOrigW(size.width);
                                    setResizeOrigH(size.height);
                                  }
                                }}
                              />
                            </div>
                          )}
                          {inputs[selectedFeature] &&
                            selectedFeature !== "resize" &&
                            selectedFeature !== "live-chat" && (
                              <div className="absolute md:bottom-3 bottom-1 md:left-1/2 left-1/2 -translate-x-1/2 transform z-30 2xl:bottom-4">
                                <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl md:p-1 p-0.5">
                                  <button
                                    onClick={() =>
                                      setUpscaleViewMode("comparison")
                                    }
                                    className={`md:px-2 px-1 md:py-1 py-0.5 md:text-xs text-[10px] rounded transition-colors ${upscaleViewMode === "comparison" ? "bg-white text-black" : "text-white hover:bg-white/20"}`}
                                  >
                                    Compare
                                  </button>
                                  <button
                                    onClick={() => setUpscaleViewMode("zoom")}
                                    className={`md:px-2 px-1 md:py-1 py-0.5 md:text-xs text-[10px] rounded transition-colors ${upscaleViewMode === "zoom" ? "bg-white text-black" : "text-white hover:bg-white/20"}`}
                                  >
                                    Zoom
                                  </button>
                                </div>
                              </div>
                            )}

                        {selectedFeature !== "resize" &&
                        selectedFeature !== "live-chat" &&
                        upscaleViewMode === "comparison" ? (
                          // Comparison slider mode: Original on left, Generated on right, no overlap
                          <>
                            {/* Original (left) */}
                            <div
                              className="absolute inset-0"
                              style={{
                                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                              }}
                            >
                              {isInlineImageUrl(inputs[selectedFeature]) ||
                              isSvgUrl(inputs[selectedFeature]) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={normalizeEditImageUrl(
                                    inputs[selectedFeature] as string,
                                  )}
                                  alt="Original"
                                  className="absolute inset-0 w-full h-full object-contain object-center"
                                />
                              ) : (
                                <Image
                                  src={normalizeEditImageUrl(
                                    inputs[selectedFeature] as string,
                                  )}
                                  alt="Original"
                                  fill
                                  unoptimized
                                  className="object-contain object-center"
                                />
                              )}
                            </div>

                            {/* Generated (right) */}
                            <div
                              className="absolute inset-0"
                              style={{
                                clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                              }}
                            >
                              {isSvgUrl(outputs[selectedFeature]) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={normalizeEditImageUrl(
                                    outputs[selectedFeature] as string,
                                  )}
                                  alt="Generated"
                                  className="absolute inset-0 w-full h-full object-contain object-center"
                                  style={{ objectPosition: "center center" }}
                                  onError={(e) => {
                                    console.error(
                                      "[EditImage] Output image failed to load:",
                                      {
                                        src: outputs[selectedFeature],
                                        selectedFeature,
                                        error: e,
                                      },
                                    );
                                  }}
                                  onLoad={() => {
                                    console.log(
                                      "[EditImage] Output image loaded successfully:",
                                      {
                                        src: outputs[selectedFeature],
                                        selectedFeature,
                                      },
                                    );
                                  }}
                                />
                              ) : (
                                <Image
                                  src={normalizeEditImageUrl(
                                    outputs[selectedFeature] as string,
                                  )}
                                  alt="Generated"
                                  fill
                                  unoptimized
                                  className="object-contain object-center"
                                  style={{ objectPosition: "center center" }}
                                  onError={(e) => {
                                    console.error(
                                      "[EditImage] Output image failed to load:",
                                      {
                                        src: outputs[selectedFeature],
                                        selectedFeature,
                                        error: e,
                                      },
                                    );
                                  }}
                                  onLoad={() => {
                                    console.log(
                                      "[EditImage] Output image loaded successfully:",
                                      {
                                        src: outputs[selectedFeature],
                                        selectedFeature,
                                      },
                                    );
                                  }}
                                />
                              )}
                            </div>

                              {/* Slider */}
                              <div className="absolute inset-0">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={sliderPosition}
                                  onChange={(e) =>
                                    setSliderPosition(Number(e.target.value))
                                  }
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                                />
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                                  style={{ left: `${sliderPosition}%` }}
                                />
                              </div>

                            <div className="absolute md:top-5 top-0 md:right-4 right-1 z-30 2xl:top-6 2xl:right-6">
                              <span className="text-[10px] font-medium text-white bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-xl md:text-sm md:px-3 md:py-1.5">
                                Generated
                              </span>
                            </div>
                          </>
                        ) : (
                          // Zoom mode (all features)
                          <div
                            ref={imageContainerRef}
                            className={`w-full h-full relative cursor-move select-none min-h-[24rem] md:min-h-[28rem] lg:min-h-[28rem]`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onWheel={handleWheel}
                            onKeyDown={handleKeyDown}
                            tabIndex={0}
                            style={{ outline: "none" }}
                          >
                            {isSvgUrl(outputs[selectedFeature]) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                ref={imageRef as any}
                                src={normalizeEditImageUrl(
                                  outputs[selectedFeature] as string,
                                )}
                                alt="Output"
                                className="absolute inset-0 w-full h-full object-contain object-center"
                                style={{
                                  transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                                  transformOrigin: "center center",
                                  objectPosition: "center center",
                                }}
                                onLoad={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  setNaturalSize({
                                    width: img.naturalWidth || img.width || 1024,
                                    height:
                                      img.naturalHeight || img.height || 1024,
                                  });
                                  console.log(
                                    "[EditImage] Zoom mode output image loaded:",
                                    {
                                      src: outputs[selectedFeature],
                                      selectedFeature,
                                      dimensions: {
                                        width: img.naturalWidth,
                                        height: img.naturalHeight,
                                      },
                                    },
                                  );
                                }}
                                onError={(e) => {
                                  console.error(
                                    "[EditImage] Zoom mode output image failed to load:",
                                    {
                                      src: outputs[selectedFeature],
                                      selectedFeature,
                                      error: e,
                                    },
                                  );
                                }}
                                onClick={handleImageClick}
                              />
                            ) : (
                              <Image
                                ref={imageRef}
                                src={normalizeEditImageUrl(
                                  outputs[selectedFeature] as string,
                                )}
                                alt="Output"
                                fill
                                unoptimized
                                className="object-contain object-center"
                                style={{
                                  transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                                  transformOrigin: "center center",
                                  objectPosition: "center center",
                                }}
                                onLoad={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  setNaturalSize({
                                    width: img.naturalWidth,
                                    height: img.naturalHeight,
                                  });
                                  console.log(
                                    "[EditImage] Zoom mode output image loaded:",
                                    {
                                      src: outputs[selectedFeature],
                                      selectedFeature,
                                      dimensions: {
                                        width: img.naturalWidth,
                                        height: img.naturalHeight,
                                      },
                                    },
                                  );
                                }}
                                onError={(e) => {
                                  console.error(
                                    "[EditImage] Zoom mode output image failed to load:",
                                    {
                                      src: outputs[selectedFeature],
                                      selectedFeature,
                                      error: e,
                                    },
                                  );
                                }}
                                onClick={handleImageClick}
                              />
                            )}

                            {/* Zoom Controls */}
                            <div className="absolute md:bottom-3 bottom-1 md:right-3 right-1 z-30 2xl:bottom-4 2xl:right-4">
                              <div className="flex items-center gap-1 2xl:gap-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl md:p-1 p-0.5">
                                <button
                                  onClick={() => {
                                    const newScale = Math.max(0.1, scale - 0.1);
                                    setScale(newScale);
                                    setOffset(clampOffset(offset, newScale));
                                  }}
                                  disabled={scale <= 0.1}
                                  className="md:w-5 md:h-5 w-4 h-4 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed 2xl:w-6 2xl:h-6"
                                >
                                  −
                                </button>
                                <span className="text-white/80 text-xs px-1.5 2xl:text-sm 2xl:px-2">
                                  {Math.round(scale * 100)}%
                                </span>
                                <button
                                  onClick={() => {
                                    const newScale = Math.min(6, scale + 0.1);
                                    setScale(newScale);
                                    setOffset(clampOffset(offset, newScale));
                                  }}
                                  disabled={scale >= 6}
                                  className="md:w-5 md:h-5 w-4 h-4 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed 2xl:w-6 2xl:h-6"
                                >
                                  +
                                </button>
                                <button
                                  onClick={resetZoom}
                                  className="md:w-5 md:h-5 w-4 h-4 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center 2xl:w-6 2xl:h-6"
                                >
                                  ⌂
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular image viewer with zoom controls
                      <div
                        ref={imageContainerRef}
                        className={`w-full h-full relative cursor-move select-none min-h-[24rem] md:min-h-[28rem] lg:min-h-[28rem]`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                        style={{ outline: "none" }}
                      >
                        {isSvgUrl(outputs[selectedFeature]) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            ref={imageRef as any}
                            src={normalizeEditImageUrl(
                              outputs[selectedFeature] as string,
                            )}
                            alt="Output"
                            className="absolute inset-0 w-full h-full object-contain object-center"
                            style={{
                              transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                              transformOrigin: "center center",
                              objectPosition: "center center",
                            }}
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              setNaturalSize({
                                width: img.naturalWidth || img.width || 1024,
                                height:
                                  img.naturalHeight || img.height || 1024,
                              });
                              console.log(
                                "[EditImage] No-input mode output image loaded:",
                                {
                                  src: outputs[selectedFeature],
                                  selectedFeature,
                                  dimensions: {
                                    width: img.naturalWidth,
                                    height: img.naturalHeight,
                                  },
                                },
                              );
                            }}
                            onError={(e) => {
                              console.error(
                                "[EditImage] No-input mode output image failed to load:",
                                {
                                  src: outputs[selectedFeature],
                                  selectedFeature,
                                  error: e,
                                },
                              );
                            }}
                            onClick={handleImageClick}
                          />
                        ) : (
                          <Image
                            ref={imageRef}
                            src={normalizeEditImageUrl(
                              outputs[selectedFeature] as string,
                            )}
                            alt="Output"
                            fill
                            unoptimized
                            className="object-contain object-center"
                            style={{
                              transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                              transformOrigin: "center center",
                              objectPosition: "center center",
                            }}
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              setNaturalSize({
                                width: img.naturalWidth,
                                height: img.naturalHeight,
                              });
                              console.log(
                                "[EditImage] No-input mode output image loaded:",
                                {
                                  src: outputs[selectedFeature],
                                  selectedFeature,
                                  dimensions: {
                                    width: img.naturalWidth,
                                    height: img.naturalHeight,
                                  },
                                },
                              );
                            }}
                            onError={(e) => {
                              console.error(
                                "[EditImage] No-input mode output image failed to load:",
                                {
                                  src: outputs[selectedFeature],
                                  selectedFeature,
                                  error: e,
                                },
                              );
                            }}
                            onClick={handleImageClick}
                          />
                        )}

                        {/* Zoom Controls */}
                        <div className="absolute md:bottom-3 bottom-1 md:right-3 right-1 z-30 2xl:bottom-4 2xl:right-4">
                          <div className="flex items-center gap-1 2xl:gap-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl md:p-1 p-0.5">
                            <button
                              onClick={() => {
                                const newScale = Math.max(0.1, scale - 0.1);
                                setScale(newScale);
                                setOffset(clampOffset(offset, newScale));
                              }}
                              disabled={scale <= 0.1}
                              className="md:w-5 md:h-5 w-4 h-4 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed 2xl:w-6 2xl:h-6"
                            >
                              −
                            </button>
                            <span className="text-white/80 text-xs px-1.5 2xl:text-sm 2xl:px-2">
                              {Math.round(scale * 100)}%
                            </span>
                            <button
                              onClick={() => {
                                const newScale = Math.min(6, scale + 0.1);
                                setScale(newScale);
                                setOffset(clampOffset(offset, newScale));
                              }}
                              disabled={scale >= 6}
                              className="md:w-5 md:h-5 w-4 h-4 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed 2xl:w-6 2xl:h-6"
                            >
                              +
                            </button>
                            <button
                              onClick={resetZoom}
                              className="md:w-5 md:h-5 w-4 h-4 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center 2xl:w-6 2xl:h-6"
                            >
                              ⌂
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center min-h-[18rem] md:min-h-[28rem] lg:min-h-[28rem]">
                    {inputs[selectedFeature] ? (
                      <div className="absolute inset-0">
                        {selectedFeature === "resize" ||
                        selectedFeature === "fill" ||
                        selectedFeature === "style-combination" ? (
                          selectedFeature === "resize" ? (
                            <div className="absolute inset-0 z-10">
                              <EditImageExpandFrame
                                sourceImageUrl={inputs.resize}
                                localExpandedImageUrl={null}
                                expandedImageUrl={null}
                                aspectPreset={resizeAspectRatio || "custom"}
                                aspectPresets={aspectPresets}
                                customWidth={Number(resizeCanvasW) || 1024}
                                customHeight={Number(resizeCanvasH) || 1024}
                                onFrameInfoChange={(info) => {
                                  if (info) {
                                    if (
                                      info.canvasSize[0] !==
                                      Number(resizeCanvasW)
                                    )
                                      setResizeCanvasW(info.canvasSize[0]);
                                    if (
                                      info.canvasSize[1] !==
                                      Number(resizeCanvasH)
                                    )
                                      setResizeCanvasH(info.canvasSize[1]);
                                    setResizeOrigX(
                                      info.originalImageLocation[0],
                                    );
                                    setResizeOrigY(
                                      info.originalImageLocation[1],
                                    );
                                  }
                                }}
                                onImageSizeChange={(size) => {
                                  if (size) {
                                    setResizeOrigW(size.width);
                                    setResizeOrigH(size.height);
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="absolute inset-0 z-10">
                              <EditImageEraseFrame
                                sourceImageUrl={
                                  (inputs[
                                    selectedFeature === "fill"
                                      ? "fill"
                                      : "style-combination"
                                  ] as string) || null
                                }
                                brushSize={eraseBrushSize}
                                isDrawing={eraseIsDrawing}
                                setIsDrawing={setEraseIsDrawing}
                                onMaskChange={setEraseMaskData}
                                isAdjustingBrush={isAdjustingBrush}
                                maskResetNonce={eraseFrameMaskResetNonce}
                              />
                            </div>
                          )
                        ) : (
                          <>
                            {isInlineImageUrl(inputs[selectedFeature]) ||
                            isSvgUrl(inputs[selectedFeature]) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={normalizeEditImageUrl(
                                  inputs[selectedFeature] as string,
                                )}
                                alt="Input"
                                className="absolute inset-0 w-full h-full object-contain object-center"
                                onLoad={(e) => {
                                  if (selectedFeature === "expand") {
                                    const img = e.target as HTMLImageElement;
                                    setExpandOriginalSize({
                                      width: img.naturalWidth,
                                      height: img.naturalHeight,
                                    });
                                    setInputNaturalSize({
                                      width: img.naturalWidth,
                                      height: img.naturalHeight,
                                    });
                                    setTimeout(() => {
                                      drawExpandCanvas();
                                    }, 100);
                                  } else {
                                    const img = e.target as HTMLImageElement;
                                    setInputNaturalSize({
                                      width: img.naturalWidth,
                                      height: img.naturalHeight,
                                    });
                                  }
                                }}
                              />
                            ) : (
                              <Image
                                src={normalizeEditImageUrl(
                                  inputs[selectedFeature] as string,
                                )}
                                alt="Input"
                                fill
                                unoptimized
                                className="object-contain object-center"
                                onLoad={(e) => {
                                  if (selectedFeature === "expand") {
                                    const img = e.target as HTMLImageElement;
                                    setExpandOriginalSize({
                                      width: img.naturalWidth,
                                      height: img.naturalHeight,
                                    });
                                    setInputNaturalSize({
                                      width: img.naturalWidth,
                                      height: img.naturalHeight,
                                    });
                                    // Trigger canvas redraw after a short delay to ensure container is ready
                                    setTimeout(() => {
                                      drawExpandCanvas();
                                    }, 100);
                                  } else {
                                    const img = e.target as HTMLImageElement;
                                    setInputNaturalSize({
                                      width: img.naturalWidth,
                                      height: img.naturalHeight,
                                    });
                                  }
                                }}
                              />
                            )}
                            {selectedFeature === "expand" &&
                              expandOriginalSize.width > 0 && (
                                <div
                                  ref={expandContainerRef}
                                  className="absolute inset-0 z-10"
                                >
                                  <canvas
                                    ref={expandCanvasRef}
                                    className="absolute inset-0 w-full h-full"
                                    style={{
                                      pointerEvents: "auto",
                                      userSelect: "none",
                                      cursor:
                                        (expandResizing || expandHoverEdge) ===
                                          "left" ||
                                        (expandResizing || expandHoverEdge) ===
                                          "right"
                                          ? "ew-resize"
                                          : (expandResizing ||
                                                expandHoverEdge) === "top" ||
                                              (expandResizing ||
                                                expandHoverEdge) === "bottom"
                                              ? "ns-resize"
                                              : (expandResizing ||
                                                expandHoverEdge) === "move"
                                                ? "move"
                                                : "default",
                                      }}
                                      onMouseDown={handleExpandMouseDown}
                                      onMouseMove={handleExpandMouseMove}
                                      onMouseUp={handleExpandMouseUp}
                                      onMouseLeave={handleExpandMouseUp}
                                    />
                                  </div>
                                )}
                              {/* Erase Frame handled above */}
                              {(selectedFeature === "reimagine" ||
                                (selectedFeature === "remove-bg" &&
                                  String(model).startsWith("bria/eraser"))) && (
                                  <div
                                    ref={fillContainerRef}
                                    className="absolute inset-0 z-10"
                                  >
                                    {/* Reimagine: Selection Mode Toggle */}
                                    {/* Reimagine: Selection Mode Toggle - Floating Dock (Rectangle Only) */}
                                    {selectedFeature === "reimagine" &&
                                      !reimagineSelectionConfirmed && (
                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-black/60 backdrop-blur-xl rounded-full p-1.5 border border-white/10 shadow-2xl transition-all hover:bg-black/70">
                                          <button
                                            onClick={() => {
                                              setReimagineSelectionMode(
                                                "rectangle",
                                              );
                                              setReimagineLiveBounds(null);
                                              setReimagineSelectionBounds(null);
                                              setHasMask(false);
                                              setRectangleStart(null);
                                              setRectangleCurrent(null);
                                              const ctx =
                                                fillCanvasRef.current?.getContext(
                                                  "2d",
                                                );
                                              if (ctx && fillContainerRef.current) {
                                                const rect =
                                                  fillContainerRef.current.getBoundingClientRect();
                                                ctx.clearRect(
                                                  0,
                                                  0,
                                                  rect.width,
                                                  rect.height,
                                                );
                                              }
                                            }}
                                            className={`p-2.5 rounded-full transition-all duration-200 group relative bg-white text-black shadow-lg`}
                                            title="Selection Tool"
                                          >
                                            <svg
                                              width="20"
                                              height="20"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            >
                                              <rect
                                                x="3"
                                                y="3"
                                                width="18"
                                                height="18"
                                                rx="2"
                                                ry="2"
                                              ></rect>
                                            </svg>
                                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                              Selection Tool
                                            </span>
                                          </button>
                                        </div>
                                      )}

                                    <canvas
                                      ref={fillCanvasRef}
                                      className="absolute inset-0 w-full h-full touch-none"
                                      style={{
                                        pointerEvents:
                                          selectedFeature === "reimagine" &&
                                            reimagineSelectionConfirmed
                                            ? "none"
                                            : "auto",
                                        userSelect: "none",
                                        backgroundColor: "transparent",
                                        mixBlendMode: "normal",
                                        cursor:
                                          selectedFeature === "reimagine" &&
                                            reimagineSelectionMode === "rectangle"
                                            ? isDrawingRectangle
                                              ? "crosshair"
                                              : reimagineLiveBounds ||
                                                reimagineSelectionBounds
                                                ? "move"
                                                : "crosshair"
                                            : "crosshair",
                                      }}
                                      onMouseDown={(e) => {
                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionConfirmed
                                        )
                                          return;
                                        e.preventDefault();
                                        const p = pointFromMouseEvent(e);

                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionMode === "rectangle"
                                        ) {
                                          // Check if clicking inside existing selection
                                          const bounds =
                                            reimagineLiveBounds ||
                                            reimagineSelectionBounds;
                                          if (
                                            bounds &&
                                            p.x >= bounds.x &&
                                            p.x <= bounds.x + bounds.width &&
                                            p.y >= bounds.y &&
                                            p.y <= bounds.y + bounds.height
                                          ) {
                                            // Start dragging
                                            setIsDraggingSelection(true);
                                            setDragStart({
                                              x: p.x - bounds.x,
                                              y: p.y - bounds.y,
                                            });
                                          } else {
                                            // Start drawing new rectangle
                                            setIsDrawingRectangle(true);
                                            setRectangleStart(p);
                                            setRectangleCurrent(p);
                                            setReimagineLiveBounds(null);
                                            setReimagineSelectionBounds(null);
                                            setHasMask(false);
                                            // Clear canvas
                                            const ctx =
                                              fillCanvasRef.current?.getContext(
                                                "2d",
                                              );
                                            if (ctx && fillContainerRef.current) {
                                              const rect =
                                                fillContainerRef.current.getBoundingClientRect();
                                              ctx.clearRect(
                                                0,
                                                0,
                                                rect.width,
                                                rect.height,
                                              );
                                            }
                                          }
                                        } else {
                                          // Brush mode or other features
                                          beginMaskStroke(p.x, p.y);
                                        }
                                      }}
                                      onMouseMove={(e) => {
                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionConfirmed
                                        )
                                          return;
                                        e.preventDefault();
                                        const p = pointFromMouseEvent(e);

                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionMode === "rectangle"
                                        ) {
                                          if (
                                            isDraggingSelection &&
                                            dragStart &&
                                            (reimagineLiveBounds ||
                                              reimagineSelectionBounds)
                                          ) {
                                            // Dragging existing selection
                                            const bounds =
                                              reimagineLiveBounds ||
                                              reimagineSelectionBounds;
                                            if (bounds) {
                                              const containerWidth =
                                                fillContainerRef.current?.getBoundingClientRect()
                                                  .width || 0;
                                              const containerHeight =
                                                fillContainerRef.current?.getBoundingClientRect()
                                                  .height || 0;
                                              const newX = Math.max(
                                                0,
                                                Math.min(
                                                  p.x - dragStart.x,
                                                  containerWidth - bounds.width,
                                                ),
                                              );
                                              const newY = Math.max(
                                                0,
                                                Math.min(
                                                  p.y - dragStart.y,
                                                  containerHeight - bounds.height,
                                                ),
                                              );
                                              setReimagineLiveBounds({
                                                x: newX,
                                                y: newY,
                                                width: bounds.width,
                                                height: bounds.height,
                                              });
                                              // Update canvas mask - Do NOT draw white fill
                                              const ctx =
                                                fillCanvasRef.current?.getContext(
                                                  "2d",
                                                );
                                              if (ctx) {
                                                ctx.clearRect(
                                                  0,
                                                  0,
                                                  containerWidth,
                                                  containerHeight,
                                                );
                                              }
                                            }
                                          } else if (
                                            isDrawingRectangle &&
                                            rectangleStart
                                          ) {
                                            // Drawing new rectangle
                                            setRectangleCurrent(p);
                                            const bounds = {
                                              x: Math.min(rectangleStart.x, p.x),
                                              y: Math.min(rectangleStart.y, p.y),
                                              width: Math.abs(
                                                p.x - rectangleStart.x,
                                              ),
                                              height: Math.abs(
                                                p.y - rectangleStart.y,
                                              ),
                                            };
                                            setReimagineLiveBounds(bounds);
                                          }
                                        } else {
                                          // Brush mode
                                          continueMaskStroke(p.x, p.y);
                                        }
                                      }}
                                      onMouseUp={(e) => {
                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionConfirmed
                                        )
                                          return;
                                        e.preventDefault();

                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionMode === "rectangle"
                                        ) {
                                          if (isDraggingSelection) {
                                            setIsDraggingSelection(false);
                                            setDragStart(null);
                                            // Finalize dragged position
                                            if (reimagineLiveBounds) {
                                              setReimagineSelectionBounds(
                                                reimagineLiveBounds,
                                              );
                                            }
                                          } else if (
                                            isDrawingRectangle &&
                                            rectangleStart &&
                                            rectangleCurrent
                                          ) {
                                            setIsDrawingRectangle(false);
                                            // Finalize rectangle
                                            let bounds = {
                                              x: Math.min(
                                                rectangleStart.x,
                                                rectangleCurrent.x,
                                              ),
                                              y: Math.min(
                                                rectangleStart.y,
                                                rectangleCurrent.y,
                                              ),
                                              width: Math.abs(
                                                rectangleCurrent.x -
                                                rectangleStart.x,
                                              ),
                                              height: Math.abs(
                                                rectangleCurrent.y -
                                                rectangleStart.y,
                                              ),
                                            };

                                            // Check for Tap (very small movement) -> Create 1024x1024 selection
                                            const dist = Math.sqrt(
                                              Math.pow(
                                                rectangleCurrent.x -
                                                rectangleStart.x,
                                                2,
                                              ) +
                                              Math.pow(
                                                rectangleCurrent.y -
                                                rectangleStart.y,
                                                2,
                                              ),
                                            );
                                            if (dist < 10) {
                                              // It's a tap! Create 1024x1024 selection centered on tap
                                              const container =
                                                fillContainerRef.current;
                                              const canvas = fillCanvasRef.current;
                                              if (
                                                container &&
                                                canvas &&
                                                inputNaturalSize.width > 0
                                              ) {
                                                const rect =
                                                  container.getBoundingClientRect();

                                                // Calculate actual rendered image dimensions (object-contain)
                                                const imgAspect =
                                                  inputNaturalSize.width /
                                                  inputNaturalSize.height;
                                                const containerAspect =
                                                  rect.width / rect.height;

                                                let renderWidth, renderHeight; // offsetX, offsetY not needed for scale, but needed for bounds clamping if we were strict

                                                if (containerAspect > imgAspect) {
                                                  // Container is wider than image - image is height-constrained
                                                  renderHeight = rect.height;
                                                  renderWidth =
                                                    rect.height * imgAspect;
                                                } else {
                                                  // Container is taller than image - image is width-constrained
                                                  renderWidth = rect.width;
                                                  renderHeight =
                                                    rect.width / imgAspect;
                                                }

                                                // Uniform scale factor
                                                const scale =
                                                  renderWidth /
                                                  inputNaturalSize.width;

                                                // Target size in canvas pixels (representing 1024x1024 on image)
                                                const targetSize = 1024 * scale;

                                                // Center on tap location (rectangleStart)
                                                let newX =
                                                  rectangleStart.x - targetSize / 2;
                                                let newY =
                                                  rectangleStart.y - targetSize / 2;

                                                // Clamp to canvas bounds (allowing it to go into letterboxed area is fine,
                                                // but ideally we clamp to the image area? For now clamp to canvas/container)
                                                newX = Math.max(
                                                  0,
                                                  Math.min(
                                                    newX,
                                                    rect.width - targetSize,
                                                  ),
                                                );
                                                newY = Math.max(
                                                  0,
                                                  Math.min(
                                                    newY,
                                                    rect.height - targetSize,
                                                  ),
                                                );

                                                bounds = {
                                                  x: newX,
                                                  y: newY,
                                                  width: targetSize,
                                                  height: targetSize,
                                                };
                                              }
                                            }

                                            if (
                                              bounds.width > 10 &&
                                              bounds.height > 10
                                            ) {
                                              setReimagineLiveBounds(bounds);
                                              setReimagineSelectionBounds(bounds);
                                              // Do NOT draw white fill on canvas
                                              const ctx =
                                                fillCanvasRef.current?.getContext(
                                                  "2d",
                                                );
                                              if (ctx) {
                                                ctx.clearRect(
                                                  0,
                                                  0,
                                                  ctx.canvas.width,
                                                  ctx.canvas.height,
                                                );
                                                setHasMask(true);
                                              }
                                            }
                                            setRectangleStart(null);
                                            setRectangleCurrent(null);
                                          }
                                        } else {
                                          // Brush mode
                                          endMaskStroke();
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionConfirmed
                                        )
                                          return;
                                        e.preventDefault();

                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionMode === "rectangle"
                                        ) {
                                          if (isDraggingSelection) {
                                            setIsDraggingSelection(false);
                                            setDragStart(null);
                                            if (reimagineLiveBounds) {
                                              setReimagineSelectionBounds(
                                                reimagineLiveBounds,
                                              );
                                            }
                                          }
                                          if (isDrawingRectangle) {
                                            setIsDrawingRectangle(false);
                                            setRectangleStart(null);
                                            setRectangleCurrent(null);
                                          }
                                        } else {
                                          endMaskStroke();
                                        }
                                      }}
                                      onTouchStart={(e) => {
                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionConfirmed
                                        )
                                          return;
                                        // e.preventDefault(); // Removed to fix passive event listener error; touch-action: none handles this
                                        const p = pointFromTouchEvent(e);
                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionMode === "rectangle"
                                        ) {
                                          const bounds =
                                            reimagineLiveBounds ||
                                            reimagineSelectionBounds;
                                          if (
                                            bounds &&
                                            p.x >= bounds.x &&
                                            p.x <= bounds.x + bounds.width &&
                                            p.y >= bounds.y &&
                                            p.y <= bounds.y + bounds.height
                                          ) {
                                            setIsDraggingSelection(true);
                                            setDragStart({
                                              x: p.x - bounds.x,
                                              y: p.y - bounds.y,
                                            });
                                          } else {
                                            setIsDrawingRectangle(true);
                                            setRectangleStart(p);
                                            setRectangleCurrent(p);
                                          }
                                        } else {
                                          beginMaskStroke(p.x, p.y);
                                        }
                                      }}
                                      onTouchMove={(e) => {
                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionConfirmed
                                        )
                                          return;
                                        // e.preventDefault(); // Removed to fix passive event listener error
                                        const p = pointFromTouchEvent(e);
                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionMode === "rectangle"
                                        ) {
                                          if (
                                            isDraggingSelection &&
                                            dragStart &&
                                            (reimagineLiveBounds ||
                                              reimagineSelectionBounds)
                                          ) {
                                            const bounds =
                                              reimagineLiveBounds ||
                                              reimagineSelectionBounds;
                                            const containerWidth =
                                              fillContainerRef.current?.getBoundingClientRect()
                                                .width || 0;
                                            const containerHeight =
                                              fillContainerRef.current?.getBoundingClientRect()
                                                .height || 0;
                                            if (bounds) {
                                              const newX = Math.max(
                                                0,
                                                Math.min(
                                                  p.x - dragStart.x,
                                                  containerWidth - bounds.width,
                                                ),
                                              );
                                              const newY = Math.max(
                                                0,
                                                Math.min(
                                                  p.y - dragStart.y,
                                                  containerHeight - bounds.height,
                                                ),
                                              );
                                              setReimagineLiveBounds({
                                                x: newX,
                                                y: newY,
                                                width: bounds.width,
                                                height: bounds.height,
                                              });
                                              // Do NOT draw white fill on canvas
                                              const ctx =
                                                fillCanvasRef.current?.getContext(
                                                  "2d",
                                                );
                                              if (ctx) {
                                                ctx.clearRect(
                                                  0,
                                                  0,
                                                  containerWidth,
                                                  containerHeight,
                                                );
                                              }
                                            }
                                          } else if (
                                            isDrawingRectangle &&
                                            rectangleStart
                                          ) {
                                            setRectangleCurrent(p);
                                            const bounds = {
                                              x: Math.min(rectangleStart.x, p.x),
                                              y: Math.min(rectangleStart.y, p.y),
                                              width: Math.abs(
                                                p.x - rectangleStart.x,
                                              ),
                                              height: Math.abs(
                                                p.y - rectangleStart.y,
                                              ),
                                            };
                                            setReimagineLiveBounds(bounds);
                                          }
                                        } else {
                                          continueMaskStroke(p.x, p.y);
                                        }
                                      }}
                                      onTouchEnd={(e) => {
                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionConfirmed
                                        )
                                          return;
                                        // e.preventDefault(); // Removed to fix passive event listener error

                                        if (
                                          selectedFeature === "reimagine" &&
                                          reimagineSelectionMode === "rectangle"
                                        ) {
                                          if (isDraggingSelection) {
                                            setIsDraggingSelection(false);
                                            setDragStart(null);
                                            if (reimagineLiveBounds)
                                              setReimagineSelectionBounds(
                                                reimagineLiveBounds,
                                              );
                                          } else if (
                                            isDrawingRectangle &&
                                            rectangleStart &&
                                            rectangleCurrent
                                          ) {
                                            setIsDrawingRectangle(false);
                                            // Finalize rectangle
                                            let bounds = {
                                              x: Math.min(
                                                rectangleStart.x,
                                                rectangleCurrent.x,
                                              ),
                                              y: Math.min(
                                                rectangleStart.y,
                                                rectangleCurrent.y,
                                              ),
                                              width: Math.abs(
                                                rectangleCurrent.x -
                                                rectangleStart.x,
                                              ),
                                              height: Math.abs(
                                                rectangleCurrent.y -
                                                rectangleStart.y,
                                              ),
                                            };

                                            // Check for Tap (very small movement) -> Create 1024x1024 selection
                                            const dist = Math.sqrt(
                                              Math.pow(
                                                rectangleCurrent.x -
                                                rectangleStart.x,
                                                2,
                                              ) +
                                              Math.pow(
                                                rectangleCurrent.y -
                                                rectangleStart.y,
                                                2,
                                              ),
                                            );
                                            if (dist < 10) {
                                              // It's a tap! Create 1024x1024 selection centered on tap
                                              const container =
                                                fillContainerRef.current;
                                              const canvas = fillCanvasRef.current;
                                              if (
                                                container &&
                                                canvas &&
                                                inputNaturalSize.width > 0
                                              ) {
                                                const rect =
                                                  container.getBoundingClientRect();

                                                // Calculate actual rendered image dimensions (object-contain)
                                                const imgAspect =
                                                  inputNaturalSize.width /
                                                  inputNaturalSize.height;
                                                const containerAspect =
                                                  rect.width / rect.height;

                                                let renderWidth, renderHeight;

                                                if (containerAspect > imgAspect) {
                                                  // Container is wider than image - image is height-constrained
                                                  renderHeight = rect.height;
                                                  renderWidth =
                                                    rect.height * imgAspect;
                                                } else {
                                                  // Container is taller than image - image is width-constrained
                                                  renderWidth = rect.width;
                                                  renderHeight =
                                                    rect.width / imgAspect;
                                                }

                                                // Uniform scale factor
                                                const scale =
                                                  renderWidth /
                                                  inputNaturalSize.width;

                                                // Target size in canvas pixels (representing 1024x1024 on image)
                                                const targetSize = 1024 * scale;

                                                // Center on tap location (rectangleStart)
                                                let newX =
                                                  rectangleStart.x - targetSize / 2;
                                                let newY =
                                                  rectangleStart.y - targetSize / 2;

                                                // Clamp to canvas bounds
                                                newX = Math.max(
                                                  0,
                                                  Math.min(
                                                    newX,
                                                    rect.width - targetSize,
                                                  ),
                                                );
                                                newY = Math.max(
                                                  0,
                                                  Math.min(
                                                    newY,
                                                    rect.height - targetSize,
                                                  ),
                                                );

                                                bounds = {
                                                  x: newX,
                                                  y: newY,
                                                  width: targetSize,
                                                  height: targetSize,
                                                };
                                              }
                                            }

                                            if (
                                              bounds.width > 10 &&
                                              bounds.height > 10
                                            ) {
                                              setReimagineLiveBounds(bounds);
                                              setReimagineSelectionBounds(bounds);
                                              const ctx =
                                                fillCanvasRef.current?.getContext(
                                                  "2d",
                                                );
                                              if (ctx) {
                                                ctx.clearRect(
                                                  0,
                                                  0,
                                                  ctx.canvas.width,
                                                  ctx.canvas.height,
                                                );
                                                setHasMask(true);
                                              }
                                            }
                                            setRectangleStart(null);
                                            setRectangleCurrent(null);
                                          }
                                        } else {
                                          endMaskStroke();
                                        }
                                      }}
                                    />

                                    {/* Reimagine: Visual Selection Feedback */}
                                    {selectedFeature === "reimagine" &&
                                      (reimagineLiveBounds ||
                                        reimagineSelectionBounds) && (
                                        <>
                                          {/* Dark overlay on non-selected areas - Removed gradient, using box-shadow on selection box instead for linearity */}

                                          {/* Selection Bounding Box Border */}
                                          {(reimagineLiveBounds ||
                                            reimagineSelectionBounds) && (
                                              <div
                                                className="absolute pointer-events-none z-16 border border-white/50 rounded-xl transition-all duration-200"
                                                style={{
                                                  left: `${(reimagineLiveBounds || reimagineSelectionBounds)?.x || 0}px`,
                                                  top: `${(reimagineLiveBounds || reimagineSelectionBounds)?.y || 0}px`,
                                                  width: `${(reimagineLiveBounds || reimagineSelectionBounds)?.width || 0}px`,
                                                  height: `${(reimagineLiveBounds || reimagineSelectionBounds)?.height || 0}px`,
                                                  boxShadow:
                                                    "0 0 0 9999px rgba(0, 0, 0, 0.6)", // Darken outside
                                                }}
                                              >
                                                {/* Minimalist Corner Handles */}
                                                <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                                                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                                                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white rounded-full shadow-sm" />

                                                {/* Animated border effect - Linear Shadow (Clean Border) */}
                                                <div className="absolute inset-0 border border-white/80 rounded-xl shadow-none" />
                                              </div>
                                            )}
                                        </>
                                      )}

                                    {/* Reimagine: Confirm Selection Button - Removed in favor of direct prompt interaction */}
                                    {selectedFeature === "reimagine" &&
                                      hasMask &&
                                      !reimagineSelectionConfirmed && (
                                        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                          <button
                                            onClick={() => {
                                              setReimagineSelectionConfirmed(true);
                                            }}
                                            className="px-6 py-2.5 bg-white text-black hover:bg-gray-100 rounded-full shadow-xl font-medium transition-all transform hover:scale-105 flex items-center gap-2"
                                          >
                                            <span>Continue</span>
                                            <svg
                                              width="16"
                                              height="16"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            >
                                              <path d="M5 12h14"></path>
                                              <path d="m12 5 7 7-7 7"></path>
                                            </svg>
                                          </button>
                                        </div>
                                      )}

                                    {/* Reimagine: Floating Prompt Input - Clean Glassmorphism */}
                                    {/* {selectedFeature === 'reimagine' && reimagineSelectionConfirmed && reimagineSelectionBounds && (
                            <div
                              className="absolute z-20 w-full max-w-2xl left-1/2 -translate-x-1/2"
                              style={{
                                top: `${Math.min(reimagineSelectionBounds.y + reimagineSelectionBounds.height + 20, (fillContainerRef.current?.getBoundingClientRect().height || 800) - 100)}px`,
                              }}
                            >
                              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                <div className="pl-3 text-purple-400">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={processing.reimagine ? "animate-spin" : ""}>
                                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
                                  </svg>
                                </div>

                                Model Selector - Compact
                                <select
                                  value={reimagineModel}
                                  onChange={(e) => setReimagineModel(e.target.value as 'auto' | 'nano-banana' | 'seedream-4k')}
                                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/80 outline-none cursor-pointer transition-colors"
                                  title="AI Model"
                                >
                                  <option value="auto" className="bg-gray-900">🚀 Auto (Recommended)</option>
                                  <option value="nano-banana" className="bg-gray-900">⚡ Nano (Fast, ≤1024px)</option>
                                  <option value="seedream-4k" className="bg-gray-900">✨ Seedream 4K (Quality)</option>
                                </select>

                                <input
                                  type="text"
                                  value={reimaginePrompt}
                                  onChange={(e) => setReimaginePrompt(e.target.value)}
                                  placeholder="Describe the change..."
                                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 h-10 text-sm font-medium"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && reimaginePrompt.trim() && !processing.reimagine) {
                                      handleRun();
                                    }
                                  }}
                                />
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setReimagineSelectionConfirmed(false);
                                      setReimaginePrompt('');
                                      setReimagineSelectionBounds(null);
                                      const ctx = fillCanvasRef.current?.getContext('2d');
                                      if (ctx && fillContainerRef.current) {
                                        const rect = fillContainerRef.current.getBoundingClientRect();
                                        ctx.clearRect(0, 0, rect.width, rect.height);
                                        setHasMask(false);
                                      }
                                    }}
                                    className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                                    title="Cancel"
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M18 6 6 18"></path>
                                      <path d="m6 6 12 12"></path>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={handleRun}
                                    disabled={!reimaginePrompt.trim() || processing.reimagine}
                                    className="p-2 bg-white text-black rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Generate"
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 12h14"></path>
                                      <path d="m12 5 7 7-7 7"></path>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )} */}
                                  </div>
                                )}
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center md:justify-start xl:justify-center w-full md:min-h-[24rem] lg:min-h-[28rem] xl:min-h-[32rem] px-0 py-0 md:p-4 md:px-8 md:pt-2 lg:pt-1 xl:pt-6">
                          <div
                            className="relative w-full md:max-w-xl md:aspect-[3/2] md:min-h-[14rem] lg:min-h-[17rem] xl:min-h-0 flex flex-col items-center justify-center rounded-[16px] md:rounded-[32px] px-4 py-6 hover:bg-white/[0.03] transition-all cursor-pointer group"
                            onClick={handleOpenUploadModal}
                          >
                            <svg
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 h-full w-full"
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                            >
                              <rect
                                x="1"
                                y="1"
                                width="98"
                                height="98"
                                rx="6"
                                ry="6"
                                fill="none"
                                stroke="rgba(255,255,255,0.16)"
                                strokeWidth="0.2"
                                strokeDasharray="1 1"
                              />
                            </svg>
                            <div className="w-12 h-12 mb-4 flex items-center justify-center bg-[#1A1C24] rounded-2xl border border-white/[0.12] group-hover:scale-110 transition-transform duration-300">
                              <svg
                                className="w-6 h-6 text-white/70"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                strokeLinecap="round"
                              >
                                <path d="M12 6v12" />
                                <path d="M6 12h12" />
                              </svg>
                            </div>

                            <h3 className="text-[1.55rem] leading-[1.02] md:text-2xl font-semibold text-white mb-2 text-center">
                              Drop your image here
                            </h3>
                            <p className="text-[15px] md:text-base text-white/45 mb-5 text-center">
                              or{" "}
                              <span className="text-[#5B83FF] font-medium">
                                click to browse
                              </span>{" "}
                              from your computer
                            </p>

                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {["PNG", "JPG", "up to 50MB"].map((label) => (
                              <span
                                key={label}
                                className="px-3 py-1.5 text-[10px] font-semibold text-white/40 bg-[#171925] rounded-[10px] border border-white/8 tracking-[0.16em] uppercase"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Live Chat thumbnails moved to the right-side preview area (avoid duplicate thumbnails inside output container) */}
                {/* Fill mask overlay moved to input area */}
                {processing[selectedFeature] && (
                  <div className="absolute inset-0 z-40 flex items-center justify-center bg-transparent backdrop-blur-sm">
                    <img
                      src="https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"
                      alt="Generating..."
                      className="w-32 h-32 md:w-48 md:h-48 opacity-90"
                    />
                  </div>
                )}
              </div>

                {/* Live Chat: Thumbnail column (desktop right-side, mobile below output) */}
                {selectedFeature === "live-chat" && liveHistory.length > 0 && (
                  <div className="px-0 md:px-0 md:pr-4 md:mt-0 w-full md:w-auto h-[58vh] md:h-[72vh] min-h-0 flex flex-col gap-2">
                    {/* <div className="hidden md:block">
                    <h3 className="text-white/50 text-[10px] uppercase tracking-wider font-semibold mb-1 ml-1">
                      Secondary Preview
                    </h3>
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden aspect-square flex items-center justify-center mb-2">
                      {outputs["live-chat"] ? (
                        <img
                          src={normalizeEditImageUrl(outputs["live-chat"])}
                          alt="Current Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-white/20 text-xs">
                          No output yet
                        </div>
                      )}
                    </div>
                  </div> */}

                    <div className="flex flex-col flex-1 min-h-0">
                      <h3 className="hidden md:block text-white/50 text-[10px] uppercase tracking-wider font-semibold mb-1 ml-1">
                        Preview
                      </h3>
                      <div className="bg-[#0E0E12] backdrop-blur-xl border border-white/10 rounded-2xl md:p-2 p-1 flex-1 min-h-0 very-thin-scrollbar overflow-y-auto overflow-x-hidden overscroll-y-contain">
                        <div className="flex flex-col items-start md:gap-3 gap-1 pr-1 min-w-0">
                          {/* Generated images (latest first) */}
                          {(liveHistory || [])
                            .filter((item) => item.url !== outputs["live-chat"])
                            .slice()
                            .reverse()
                            .map((item, revIdx) => {
                              // revIdx 0 is latest; compute original index
                              const origIdx = liveHistory.length - 1 - revIdx;
                              const isActive =
                                outputs["live-chat"] === item.url &&
                                activeLiveIndex === origIdx;
                              const isHovered = hoveredThumbnailIdx === origIdx;
                              const showMenu = showThumbnailMenuIdx === origIdx;

                              return (
                                <button
                                  key={`gen-${origIdx}-${item.url}`}
                                  onClick={() => {
                                    setActiveLiveIndex(origIdx);
                                    setOutputs((prev) => ({
                                      ...prev,
                                      ["live-chat"]: item.url,
                                    }));
                                    setInputs((prev) => ({
                                      ...prev,
                                      ["live-chat"]: item.url,
                                    }));
                                    setCurrentHistoryId(item.id || null);
                                  }}
                                  className={`bg-white/5 rounded-xl border md:p-2 md:w-36 md:h-36 w-20 h-20 overflow-hidden transition-all ${isActive ? "border-white/50" : "border-white/20 hover:border-white/40"}`}
                                  title={`Generation ${origIdx + 1}`}
                                >
                                  <img
                                    src={normalizeEditImageUrl(item.url)}
                                    alt={`Gen ${origIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              );
                            })}

                          {/* Input image thumbnail shown below generated images if present and not duplicate */}
                          {liveOriginalInput &&
                            (() => {
                              const inputUrl = liveOriginalInput as string;
                              const alreadyShown =
                                liveHistory.length > 0 &&
                                liveHistory[liveHistory.length - 1]?.url ===
                                inputUrl;
                              if (alreadyShown) return null;
                              const isActiveInput =
                                outputs["live-chat"] === inputUrl &&
                                activeLiveIndex === -1;
                              return (
                                <button
                                  key={`input-thumb`}
                                  onClick={() => {
                                    setActiveLiveIndex(-1);
                                    setOutputs((prev) => ({
                                      ...prev,
                                      ["live-chat"]: inputUrl,
                                    }));
                                    setInputs((prev) => ({
                                      ...prev,
                                      ["live-chat"]: inputUrl,
                                    }));
                                  }}
                                  className={`bg-white/3 rounded-xl border md:p-2 md:w-36 md:h-36 w-20 h-20 overflow-hidden ${isActiveInput ? "border-white/5" : "border-white/10 hover:border-white/30"}`}
                                  title={`Input image`}
                                >
                                  <img
                                    src={normalizeEditImageUrl(inputUrl)}
                                    alt={`Input`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              );
                            })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          }
          statusBar={null}
        />
        <style jsx global>{`
        @media (max-width: 767px) {
          .edit-image-mobile-params {
            background: #141418;
          }

          .edit-image-mobile-params .edit-dropdown > button,
          .edit-image-mobile-params input[type="text"],
          .edit-image-mobile-params input[type="number"],
          .edit-image-mobile-params textarea,
          .edit-image-mobile-params select {
            min-height: 42px;
            border-color: #2a2a34 !important;
            background: #1c1c22 !important;
            border-radius: 10px !important;
            color: #e8e8f0 !important;
            font-size: 13px !important;
          }

          .edit-image-mobile-params .edit-dropdown > button:hover,
          .edit-image-mobile-params input[type="text"]:hover,
          .edit-image-mobile-params input[type="number"]:hover,
          .edit-image-mobile-params textarea:hover,
          .edit-image-mobile-params select:hover {
            background: #1f1f27 !important;
          }

          .edit-image-mobile-params .edit-dropdown > div {
            border: 1px solid #2a2a34 !important;
            background: #111217 !important;
            border-radius: 12px !important;
          }

          .edit-image-mobile-params .dropdown-scrollbar::-webkit-scrollbar,
          .edit-image-mobile-params .thin-scrollbar::-webkit-scrollbar {
            width: 4px;
          }

          .edit-image-mobile-params .dropdown-scrollbar::-webkit-scrollbar-thumb,
          .edit-image-mobile-params .thin-scrollbar::-webkit-scrollbar-thumb {
            background: #2a2a34;
            border-radius: 999px;
          }
        }
      `}</style>
      </div>
    </div>
  );
}
