// @ts-nocheck
import { getSignInUrl } from "@/routes/routes";
import type { HistoryEntry } from "@/types/history";
import {
  setPrompt,
  generateImages,
  generateMiniMaxImages,
  setUploadedImages,
  setSelectedCharacter,
  addSelectedCharacter,
  removeSelectedCharacter,
  clearSelectedCharacters,
  setSelectedModel,
  addActiveGeneration,
  updateActiveGeneration,
  removeActiveGeneration,
  setImageCount,
  setFrameSize,
  setStyle,
  setOutputFormat,
  setNanoBananaResolution,
  setNanoBananaGoogleSearch,
  setNanoBananaImageSearch,
  setNanoBananaThinkingLevel,
  setNanoBananaLimitGenerations,
} from "@/store/slices/generationSlice";
import { downloadFileWithNaming } from "@/utils/downloadUtils";
import {
  runwayGenerate,
  runwayStatus,
  bflGenerate,
  falGenerate,
  replicateGenerate,
} from "@/store/slices/generationsApi";
import { addNotification } from "@/store/slices/uiSlice";
import {
  removeHistoryEntry,
  addHistoryEntry,
  updateHistoryEntry,
} from "@/store/slices/historySlice";
import axiosInstance, { getApiClient } from "@/lib/axiosInstance";
import {
  incrementFreeTurboUsedOptimistic,
  decrementFreeTurboUsedOptimistic,
} from "@/store/slices/creditsSlice";
import {
  saveAutoResumeIntent,
  getAutoResumeIntent,
  clearAutoResumeIntent,
} from "@/lib/autoResume";
import { qlog, qwarn, qerr } from "@/lib/queueDebug";
import toast from "react-hot-toast";
import { enhancePromptAPI } from "@/lib/api/geminiApi";
import { waitForRunwayCompletion } from "@/lib/runwayService";
import { uploadGeneratedImage } from "@/lib/imageUpload";
import { extractFalErrorDetails, showFalErrorToast } from "@/lib/falToast";
import {
  extractReplicateErrorDetails,
  showReplicateErrorToast,
} from "@/lib/replicateToast";
import { getIsPublic } from "@/lib/publicFlag";
import {
  getImageGenerationCreditCost,
  formatCredits,
} from "@/utils/creditValidation";
import { saveUpload } from "@/lib/libraryApi";
import { toResourceProxy, toZataPath, toDirectUrl } from "@/lib/thumb";
import { updateFirebaseHistory, saveHistoryEntry } from "../historyApi";
import {
  getInputImageLimitForModel,
  normalizeIncomingImageModel,
} from "../modelImageLimits";
import { INDIAN_STYLE_LOOKUP, getIndianBasePrompt } from "../indianStylePrompts";
import { CUSTOM_STYLE_FROM_IMAGE_ID } from "@/constants/customStyleFromImage";
import {
  convertFrameSizeToRunwayRatio,
  coerceRunwayRatio,
  mapRunwayStatus,
} from "../runwayFrameUtils";
import {
  convertFrameSizeToZTurboDimensions,
  convertFrameSizeToFluxProDimensions,
} from "../frameDimensionUtils";
import { extractQueueFailureMessage } from "./generationQueue";


export type InputBoxGenerationRuntime = Record<string, any>;

export function bindHandleGenerate(getRuntime: () => InputBoxGenerationRuntime) {
  return async function handleGenerate(
    generationId?: string,
    overridePrompt?: string,
  ): Promise<void> {
    const {
      activeGenerations,
      adjustPromptImageNumbers,
      clearInputs,
      contentEditableRef,
      dispatch,
      ensureProviderReadyImageUrls,
      expectedCredits,
      flux2ProResolution,
      frameSize,
      getCombinedUploadedImages,
      gptImage15OutputFormat,
      gptImage15Quality,
      gptImage2CustomHeight,
      gptImage2CustomWidth,
      handleFalError,
      handleReplicateError,
      hasMeaningfulPromptText,
      imageCount,
      indianStyleVersion,
      isEnhancing,
      isGeneratingLocally,
      isSupportedUploadedImageSource,
      loading,
      localGeneratingEntries,
      lucidContrast,
      lucidMode,
      lucidPromptEnhance,
      lucidStyle,
      nanoBananaGoogleSearch,
      nanoBananaLimitGenerations,
      nanoBananaProResolution,
      nanoBananaResolution,
      nanoBananaThinkingLevel,
      outputFormat,
      phoenixContrast,
      phoenixMode,
      phoenixPromptEnhance,
      phoenixStyle,
      pollForMatchingHistory,
      postGenerationBlockRef,
      preview,
      prompt,
      qwenResolution,
      refreshHistory,
      refreshSingleGeneration,
      removeLocalGeneratingEntry,
      router,
      runwayBaseRespToastShownRef,
      seedream45Resolution,
      seedream5LiteResolution,
      seedreamHeight,
      seedreamSize,
      seedreamWidth,
      selectedCharacters,
      selectedModel,
      style,
      customStyleFromImage,
      toAbsoluteFromProxy,
      updateContentEditable,
      uploadedImages,
      upsertLocalGeneratingEntry,
      userData,
      zTurboOutputFormat,
      validateAndReserveCredits,
      handleGenerationSuccess,
      handleGenerationFailure,
      clearCreditsError,
      refreshCredits,
      credits,
      planCode,
      setIsEnhancing,
      setIsGeneratingLocally,
      setLocalGeneratingEntries,
    } = getRuntime();

    const currentPrompt = overridePrompt || prompt;
    const customStyleDirective =
      style === CUSTOM_STYLE_FROM_IMAGE_ID
        ? String(customStyleFromImage?.directive || "").trim()
        : "";
    const effectivePrompt = currentPrompt.trim() || customStyleDirective;
    const promptTrimmed = effectivePrompt.trim();

    if (!document.hasFocus() && !generationId) {
      console.log(
        "Document not focused, skipping explicit generation click handle. Wait for programmatic trigger.",
      );
      return;
    }

    if (!expectedCredits && !generationId) return;

    if (!userData) {
      router.push(getSignInUrl());
      return;
    }

    if (!promptTrimmed) {
      // Allow generation if using specific models with uploads, otherwise block
      if (
        !(
          uploadedImages.length > 0 &&
          selectedModel === "black-forest-labs/flux-1.1-pro"
        )
      ) {
        return;
      }
    }

    if (promptTrimmed && !hasMeaningfulPromptText(promptTrimmed)) {
      toast.error(
        "Prompt cannot contain only special characters. Please enter words or numbers.",
      );
      if (generationId) {
        dispatch(removeActiveGeneration(generationId));
      }
      return;
    }

    const combinedUploads = getCombinedUploadedImages();
    const hasUnsupportedUpload = combinedUploads.some(
      (url) => !isSupportedUploadedImageSource(url),
    );
    if (hasUnsupportedUpload) {
      toast.error(
        "Unsupported upload detected. Remove it and upload image files only.",
      );
      return;
    }

    // CRITICAL: Set loading state IMMEDIATELY at the start, before any async operations
    // This ensures the loader shows instantly when the button is clicked
    console.log("[DEBUG handleGenerate] START", {
      generationId,
      model: selectedModel,
      prompt: currentPrompt.slice(0, 30),
    });
    setIsGeneratingLocally(true);
    postGenerationBlockRef.current = true;

    // Engage pagination block; prevents scroll-triggered load bursts while generation runs & history updates
    postGenerationBlockRef.current = true;

    const originalPrompt = effectivePrompt;
    let finalPrompt = originalPrompt;

    // If prompt-enhance toggles are enabled for the selected model(s), call the backend enhancer first
    if ((lucidPromptEnhance || phoenixPromptEnhance) && !isEnhancing) {
      try {
        setIsEnhancing(true);
        // Explicitly pass 'image' as media type for image generation
        const res = await enhancePromptAPI(
          originalPrompt,
          "openai/gpt-4o",
          "image",
        );
        if (res && res.ok && res.enhancedPrompt) {
          finalPrompt = res.enhancedPrompt;

          // Update Redux state - this will trigger the useEffect that calls updateContentEditable
          dispatch(setPrompt(finalPrompt));

          // Immediately update the contentEditable element for instant visual feedback
          // This bypasses any Redux state propagation delays
          const el = contentEditableRef.current as HTMLElement | null;
          if (el) {
            // Set text content directly for immediate update
            el.textContent = finalPrompt;

            // Focus and position cursor at end
            el.focus();
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }

          // Let updateContentEditable run after Redux state has updated to properly format
          // with character tags if needed (runs via useEffect watching prompt)
          // Also call it directly after a brief delay to ensure proper formatting
          // updateContentEditable will be triggered by the useEffect watching 'prompt'
          // No need to call it manually here, as it might use a stale closure of 'prompt'
        } else {
          // Non-fatal: show an error but continue with original prompt
          if (res && res.error)
            toast.error(res.error || "Failed to enhance prompt");
        }
      } catch (e: any) {
        console.error("Prompt enhancement failed:", e);
        toast.error(
          e?.message || "Prompt enhancement failed. Using original prompt.",
        );
      } finally {
        setIsEnhancing(false);
      }
    }

    let promptForGeneration = finalPrompt;
    if (INDIAN_STYLE_LOOKUP.has(style)) {
      const selectedParamsSummary = [
        `model=${selectedModel}`,
        `style=${style}`,
        `styleVersion=${indianStyleVersion}`,
        `frameSize=${frameSize || "auto"}`,
        `imageCount=${imageCount}`,
      ].join(", ");
      const indianBasePrompt = await getIndianBasePrompt(
        style,
        indianStyleVersion,
      );
      if (indianBasePrompt) {
        promptForGeneration = [
          indianBasePrompt,
          `User prompt: ${finalPrompt}`,
          `Selected parameters: ${selectedParamsSummary}`,
        ].join("\n\n");
      } else {
        promptForGeneration = [
          `User prompt: ${finalPrompt}`,
          `Selected parameters: ${selectedParamsSummary}`,
        ].join("\n\n");
      }
    }
    finalPrompt = promptForGeneration;

    // Clear any previous credit errors
    clearCreditsError();

    // Validate and reserve credits before generation
    let transactionId: string;
    try {
      console.log(
        "[DEBUG handleGenerate] Validating credits for:",
        selectedModel,
      );
      const creditResult = await validateAndReserveCredits();
      transactionId = creditResult.transactionId;
      console.log(
        "[DEBUG handleGenerate] Credits reserved, transactionId:",
        transactionId,
      );

      // Optimistic update for promotional turbo counter
      const isFreeTurboModel = selectedModel === 'z-image-turbo' || selectedModel === 'new-turbo-model';
      const isFreePlan = (planCode?.toLowerCase() || 'free') === 'free';
      if (isFreeTurboModel && isFreePlan) {
        dispatch(incrementFreeTurboUsedOptimistic(imageCount));
      }
    } catch (creditError: any) {
      toast.error(creditError.message || "Insufficient credits for generation");
      setIsGeneratingLocally(false);
      // Don't wipe other in-flight jobs; only remove this generation's local entry if present
      if (generationId) removeLocalGeneratingEntry(generationId);
      postGenerationBlockRef.current = false;

      // If we have a generation ID, marks it as failed so it doesn't get stuck in the queue
      if (generationId) {
        dispatch(
          updateActiveGeneration({
            id: generationId,
            updates: {
              status: "failed",
              error: creditError.message || "Insufficient credits",
            },
          }),
        );
      }
      return;
    }

    // Create a local history-style loading entry.
    // Prefer the stable per-generation id (gen-...) when provided so UI updates land on the right card.
    const tempEntryId = generationId || `loading-${Date.now()}`;
    const tempEntry: HistoryEntry = {
      id: tempEntryId,
      prompt: finalPrompt,
      model: selectedModel,
      generationType: "text-to-image",
      frameSize: frameSize || undefined,
      aspect_ratio: frameSize || undefined,
      images: Array.from({ length: imageCount }, (_, index) => ({
        id: `loading-${index}`,
        url: "",
        originalUrl: "",
      })),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: imageCount,
      status: "generating",
    } as any;

    console.log("[DEBUG handleGenerate] Creating local entry:", {
      tempEntryId,
      entry: {
        id: tempEntry.id,
        firebaseHistoryId: (tempEntry as any)?.firebaseHistoryId,
        status: tempEntry.status,
        imageCount: tempEntry.imageCount,
        prompt: tempEntry.prompt.substring(0, 50) + "...",
      },
      currentLocalEntriesCount: localGeneratingEntries.length,
    });

    // Set loading entry immediately to show loading GIF
    // Use flushSync to force immediate React render (if available) or use setTimeout
    // Keep multiple concurrent generations visible (cap at 4).
    setLocalGeneratingEntries((prev) => {
      const next = [
        tempEntry,
        ...prev.filter(
          (e: any) =>
            String(e?.id || (e as any)?.firebaseHistoryId) !==
            String(tempEntryId),
        ),
      ];
      return next.slice(0, 4);
    });

    // Force a synchronous render cycle by using requestAnimationFrame
    // This ensures the loading GIF appears immediately before any async operations
    await new Promise((resolve) => {
      // Use double RAF to ensure DOM update
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve(undefined);
        });
      });
    });
    // No local writes to global history; backend tracks persistent history


    let firebaseHistoryId: string | undefined;
    // Read isPublic from backend policy (fallbacks handled internally)
    const isPublic = await getIsPublic();

    try {
      // Check if it's a Runway model
      const isRunwayModel = selectedModel.startsWith("gen4_image");
      // Check if it's a MiniMax model
      const isMiniMaxModel = selectedModel === "minimax-image-01";

      if (isRunwayModel) {
        console.log("🚀 ENTERING RUNWAY GENERATION SECTION");
        console.log("=== STARTING RUNWAY GENERATION ===");
        console.log("Selected model:", selectedModel);
        console.log("Image count:", imageCount);
        console.log("Frame size:", frameSize);
        console.log("Style:", style);
        console.log("Uploaded images count:", uploadedImages.length);

        // Runway provider creates history records in the backend; we capture `historyId` from provider responses
        // (see `runwayGenerate` response and `runwayStatus` payload).

        // Validate gen4_image_turbo requires at least one reference image
        console.log("🔍 ABOUT TO START VALIDATION");
        console.log("=== VALIDATING RUNWAY REQUIREMENTS ===");
        console.log("Selected model:", selectedModel);
        console.log("Uploaded images count:", uploadedImages.length);
        console.log("Uploaded images:", uploadedImages);
        console.log(
          "Is gen4_image_turbo:",
          selectedModel === "gen4_image_turbo",
        );
        console.log("Has uploaded images:", uploadedImages.length > 0);
        console.log(
          "Validation condition:",
          selectedModel === "gen4_image_turbo" && uploadedImages.length === 0,
        );

        if (
          selectedModel === "gen4_image_turbo" &&
          uploadedImages.length === 0
        ) {
          console.log(
            "❌ VALIDATION FAILED: gen4_image_turbo requires reference image",
          );
          console.log("Stopping generation process...");

          // Update Firebase entry to failed status
          try {
            await updateFirebaseHistory(firebaseHistoryId, {
              status: "failed",
              error: "gen4_image_turbo requires at least one reference image",
            });
            console.log("✅ Firebase entry updated to failed status");
          } catch (firebaseError) {
            console.error("❌ Failed to update Firebase entry:", firebaseError);
          }

          // Remove the loading entry since validation failed
          // dispatch(
          //   updateHistoryEntry({
          //     id: firebaseHistoryId!,
          //     updates: {
          //       status: "failed",
          //       error: "gen4_image_turbo requires at least one reference image"
          //     },
          //   })
          // );

          dispatch(
            addNotification({
              type: "error",
              message: "gen4_image_turbo requires at least one reference image",
            }),
          );
          setIsGeneratingLocally(false);
          removeLocalGeneratingEntry(
            [generationId || tempEntryId, firebaseHistoryId].filter(
              Boolean,
            ) as any,
          );
          postGenerationBlockRef.current = false;
          return;
        }

        console.log("✅ VALIDATION PASSED: Proceeding with Runway generation");
        console.log("🎯 VALIDATION COMPLETED - MOVING TO NEXT STEP");

        // Additional safety check
        if (
          selectedModel === "gen4_image_turbo" &&
          uploadedImages.length === 0
        ) {
          console.error("🚨 SAFETY CHECK FAILED: This should not happen!");
          throw new Error("Validation bypassed unexpectedly");
        }

        // Convert frameSize to Runway ratio format
        let ratio = convertFrameSizeToRunwayRatio(frameSize);
        ratio = coerceRunwayRatio(ratio, selectedModel);
        console.log("Converted frame size to Runway ratio:", ratio);

        // For Runway, support multiple images by creating parallel tasks
        const totalToGenerate = Math.min(imageCount, 4);
        let currentImages = [...uploadedImages]; // Start with uploaded images
        let completedCount = 0;
        let anyFailures = false;

        console.log("Total images to generate:", totalToGenerate);
        console.log("Initial currentImages array:", currentImages);

        // Mark the active generation as 'generating' in the shared queue so the UI loader updates immediately
        if (generationId) {
          dispatch(
            updateActiveGeneration({
              id: generationId,
              updates: { status: "generating" },
            }),
          );
        }

        // Update initial progress
        // dispatch(
        //   updateHistoryEntry({
        //     id: firebaseHistoryId!,
        //     updates: {
        //       generationProgress: {
        //         current: 0,
        //         total: totalToGenerate * 100,
        //         status: `Starting Runway generation for ${totalToGenerate} image(s)...`,
        //       },
        //     },
        //   })
        // );

        // Create all generation tasks in parallel
        const generationPromises = Array.from(
          { length: totalToGenerate },
          async (_, index) => {
            try {
              console.log(
                `Starting Runway generation for image ${index + 1}/${totalToGenerate}`,
              );

              // Make direct API call to avoid creating multiple history entries
              console.log(
                `=== MAKING RUNWAY API CALL FOR IMAGE ${index + 1} ===`,
              );
              const promptAdjusted = adjustPromptImageNumbers(
                finalPrompt,
                getCombinedUploadedImages(),
                selectedCharacters,
              );
              const combinedImages = getCombinedUploadedImages();
              console.log("API payload:", {
                promptText: `${promptAdjusted} [Style: ${style}]`,
                model: selectedModel,
                ratio,
                generationType: "text-to-image",
                uploadedImagesCount: combinedImages.length,
                style,
              });
              const result = await dispatch(
                runwayGenerate({
                  promptText: `${promptAdjusted} [Style: ${style}]`,
                  model: selectedModel,
                  ratio,
                  generationType: "text-to-image",
                  uploadedImages: combinedImages,
                  style,
                  styleVersion: indianStyleVersion,
                  isPublic,
                  generationId,
                }),
              ).unwrap();
              console.log(
                `Runway API call completed for image ${index + 1}, taskId:`,
                result.taskId,
              );

              // Capture backend historyId immediately (Runway returns it on task creation)
              if (!firebaseHistoryId && result?.historyId) {
                firebaseHistoryId = result.historyId;
              }

              // Poll via backend status route; stop on completion or terminal error
              let imageUrl: string | undefined;
              let terminalError: string | undefined;
              let baseRespToastShown = false;
              for (let attempts = 0; attempts < 360; attempts++) {
                const status = await dispatch(
                  runwayStatus(result.taskId),
                ).unwrap();
                // Capture backend historyId if frontend one wasn't created
                if (!firebaseHistoryId && status?.historyId) {
                  firebaseHistoryId = status.historyId;
                }
                // If provider returned base_resp codes, handle and stop as needed
                const mapped = mapRunwayStatus(status);
                if (mapped && mapped.shouldStop) {
                  terminalError = mapped.message;
                  if (
                    mapped.toastType === "error" &&
                    !runwayBaseRespToastShownRef.current &&
                    !baseRespToastShown
                  ) {
                    toast.error(mapped.message);
                    runwayBaseRespToastShownRef.current = true;
                    baseRespToastShown = true;
                  }
                  // Stop loader immediately - clear ONLY this generation's local entry on error
                  removeLocalGeneratingEntry(
                    [generationId || tempEntryId, firebaseHistoryId].filter(
                      Boolean,
                    ) as any,
                  );
                  setIsGeneratingLocally(false);
                  // Ensure shared active generation reflects the failure so UI loaders stop
                  if (generationId) {
                    dispatch(
                      updateActiveGeneration({
                        id: generationId,
                        updates: { status: "failed", error: mapped.message },
                      }),
                    );
                  }
                  break;
                }
                // Also stop on explicit failure/cancelled statuses from backend/provider
                const s = String(status?.status || "").toUpperCase();
                if (s === "FAILED" || s === "CANCELLED" || s === "THROTTLED") {
                  terminalError =
                    (status?.failure as string) ||
                    "Runway task did not complete";
                  if (!runwayBaseRespToastShownRef.current)
                    toast.error(terminalError);
                  removeLocalGeneratingEntry(
                    [generationId || tempEntryId, firebaseHistoryId].filter(
                      Boolean,
                    ) as any,
                  );
                  setIsGeneratingLocally(false);
                  // Mirror failure into activeGenerations so the shared UI reflects the error
                  if (generationId) {
                    dispatch(
                      updateActiveGeneration({
                        id: generationId,
                        updates: { status: "failed", error: terminalError },
                      }),
                    );
                  }
                  break;
                }
                // Check for success statuses (completed, SUCCEEDED, succeeded, etc.)
                if (
                  (s === "COMPLETED" || s === "SUCCEEDED" || s === "SUCCEED") &&
                  Array.isArray(status?.images) &&
                  status.images.length > 0
                ) {
                  imageUrl =
                    status.images[0]?.url || status.images[0]?.originalUrl;
                  break;
                }
                await new Promise((res) => setTimeout(res, 1000));
              }
              if (!imageUrl)
                throw new Error(
                  terminalError || "Runway generation did not complete in time",
                );

              // Process the completed image
              if (imageUrl) {
                console.log(`Image ${index + 1} completed with URL:`, imageUrl);

                // Create a new array copy instead of modifying the existing one
                const newImages = [...currentImages];
                newImages[index] = {
                  id: `${result.taskId}-${index}`,
                  url: imageUrl,
                  originalUrl: imageUrl,
                };

                // Update the reference to use the new array
                currentImages = newImages;
                completedCount++;

                console.log(`Updated currentImages array:`, currentImages);
                console.log(`Completed count:`, completedCount);

                // Upload the image to Firebase Storage
                console.log(
                  `Uploading image ${index + 1} to Firebase Storage...`,
                );
                try {
                  const uploadedImage = await uploadGeneratedImage(
                    newImages[index],
                  );
                  console.log(
                    `Image ${index + 1} uploaded to Firebase:`,
                    uploadedImage,
                  );

                  // Update the image with Firebase URL
                  newImages[index] = uploadedImage;
                  currentImages = newImages;

                  // Update the history entry with the new image and Firebase URL
                  // dispatch(
                  //   updateHistoryEntry({
                  //     id: firebaseHistoryId!,
                  //     updates: {
                  //       images: currentImages,
                  //       frameSize: ratio,
                  //       generationProgress: {
                  //         current: completedCount * 100,
                  //         total: totalToGenerate * 100,
                  //         status: `Completed ${completedCount}/${totalToGenerate} images`,
                  //       },
                  //     },
                  //   })
                  // );

                  // 🔥 CRITICAL FIX: Update Firebase with completed image
                  try {
                    await updateFirebaseHistory(firebaseHistoryId!, {
                      images: currentImages,
                      frameSize: ratio,
                      generationProgress: {
                        current: completedCount * 100,
                        total: totalToGenerate * 100,
                        status: `Completed ${completedCount}/${totalToGenerate} images`,
                      },
                    });
                    console.log(`✅ Firebase updated with image ${index + 1}`);
                    // Don't refresh here - wait for final completion
                  } catch (firebaseError) {
                    console.error(
                      `❌ Failed to update Firebase with image ${index + 1}:`,
                      firebaseError,
                    );
                  }
                } catch (uploadError) {
                  console.error(
                    `Failed to upload image ${index + 1} to Firebase:`,
                    uploadError,
                  );
                  // Continue with the original URL if upload fails
                  // dispatch(
                  //   updateHistoryEntry({
                  //     id: firebaseHistoryId!,
                  //     updates: {
                  //       images: currentImages,
                  //       frameSize: ratio,
                  //       generationProgress: {
                  //         current: completedCount * 100,
                  //         total: totalToGenerate * 100,
                  //         status: `Completed ${completedCount}/${totalToGenerate} images (Firebase upload failed)`,
                  //       },
                  //     },
                  //   })
                  // );
                }
              } else {
                console.error(`No image URL returned for image ${index + 1}`);
              }

              return { success: true, index, imageUrl };
            } catch (error) {
              console.error(
                `Runway generation failed for image ${index + 1}:`,
                error,
              );
              anyFailures = true;
              if (!runwayBaseRespToastShownRef.current) {
                toast.error(
                  `Failed to generate image ${index + 1} with Runway: ${error instanceof Error ? error.message : "Unknown error"}`,
                );
              }

              return { success: false, index, error };
            }
          },
        );

        // Wait for all generations to complete
        console.log("Waiting for all Runway generations to complete...");
        const results = await Promise.allSettled(generationPromises);
        console.log("All Runway generations completed. Results:", results);

        // Count successful generations
        const successfulResults = results.filter(
          (result) => result.status === "fulfilled" && result.value.success,
        );
        console.log("Successful generations:", successfulResults.length);
        console.log(
          "Failed generations:",
          results.length - successfulResults.length,
        );

        // Finalize entry
        console.log("Finalizing history entry...");
        console.log("Final currentImages:", currentImages);
        console.log("Successful generations:", successfulResults.length);

        // dispatch(
        //   updateHistoryEntry({
        //     id: firebaseHistoryId!,
        //     updates: {
        //       status: successfulResults.length > 0 ? "completed" : "failed",
        //       timestamp: new Date().toISOString(),
        //       createdAt: new Date().toISOString(),
        //       imageCount: successfulResults.length,
        //       frameSize: ratio,
        //       style,
        //       generationProgress: {
        //         current: successfulResults.length * 100,
        //         total: totalToGenerate * 100,
        //         status: `Completed ${successfulResults.length}/${totalToGenerate} images`,
        //       },
        //     },
        //   })
        // );

        // 🔥 CRITICAL FIX: Update Firebase with final status
        console.log("💾 UPDATING FIREBASE WITH FINAL STATUS...");
        console.log("Final data to update:", {
          status: successfulResults.length > 0 ? "completed" : "failed",
          imageCount: successfulResults.length,
          frameSize: ratio,
          style,
          firebaseHistoryId,
        });

        // `firebaseHistoryId` is optional in the new flow; providers create history records themselves.
        // If it's not available, we still complete the UI flow and rely on a full history refresh.
        if (!firebaseHistoryId) {
          console.warn(
            "[Runway] No historyId captured; skipping PATCH update and relying on history refresh.",
          );
        }

        console.log("🔍 DEBUG: firebaseHistoryId is valid:", firebaseHistoryId);
        console.log(
          "🔍 DEBUG: successfulResults.length:",
          successfulResults.length,
        );
        console.log("🔍 DEBUG: totalToGenerate:", totalToGenerate);

        const finalStatus =
          successfulResults.length > 0
            ? "completed"
            : ("failed" as "completed" | "failed");
        console.log("🔍 DEBUG: Final status to set:", finalStatus);

        const updateData = {
          status: finalStatus,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          imageCount: successfulResults.length,
          frameSize: ratio,
          style,
          generationProgress: {
            current: successfulResults.length * 100,
            total: totalToGenerate * 100,
            status: `Completed ${successfulResults.length}/${totalToGenerate} images`,
          },
        };

        console.log(
          "🔍 DEBUG: Update data being sent to Firebase:",
          updateData,
        );

        try {
          console.log("🔍 DEBUG: About to call updateFirebaseHistory...");
          console.log("🔍 DEBUG: Function parameters:", {
            firebaseHistoryId,
            updateData,
          });

          await updateFirebaseHistory(firebaseHistoryId, updateData);

          console.log("✅ Firebase updated with final status:", finalStatus);
          console.log(
            "🔗 Firebase document updated: generationHistory/" +
              firebaseHistoryId,
          );

          // 🔍 DEBUG: Verify the update worked by checking Firebase again
          console.log("🔍 DEBUG: Firebase update completed successfully");

          // 🔍 DEBUG: Add a small delay to ensure Firebase has processed the update
          console.log(
            "🔍 DEBUG: Waiting 1 second for Firebase to process update...",
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log(
            "🔍 DEBUG: Delay completed, Firebase update should be persisted",
          );
        } catch (firebaseError) {
          console.error(
            "❌ Failed to update Firebase with final status:",
            firebaseError,
          );
          console.error("Firebase update error details:", {
            message:
              firebaseError instanceof Error
                ? firebaseError.message
                : "Unknown error",
            stack:
              firebaseError instanceof Error
                ? firebaseError.stack
                : "No stack trace",
          });

          // 🔍 DEBUG: Try to understand what went wrong
          console.error(
            "🔍 DEBUG: firebaseHistoryId that failed:",
            firebaseHistoryId,
          );
          console.error("🔍 DEBUG: Update data that failed:", updateData);
        }

        if (successfulResults.length > 0) {
          console.log("Runway generation completed successfully!");

          // Update local preview with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: currentImages.filter((img) => img.url),
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: successfulResults.length,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            if (generationId) {
              console.log(
                "[queue] Runway generation completed, updating active generation:",
                {
                  generationId,
                  firebaseHistoryId,
                  imageCount: completedEntry.images?.length,
                },
              );
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: completedEntry.images,
                    historyId: firebaseHistoryId,
                  },
                }),
              );
            }
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Refresh only the single completed generation instead of reloading all
          // Use backend historyId (not client gen-...) because that's what /api/generations/:id expects
          const refreshId = firebaseHistoryId || generationId;
          console.log("[queue] Refreshing generation:", {
            refreshId,
            firebaseHistoryId,
            generationId,
          });
          if (refreshId) {
            await refreshSingleGeneration(refreshId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } else {
          console.log("All Runway generations failed");

          // Update local preview to failed status
          setLocalGeneratingEntries((prev) =>
            prev.map((e) => ({
              ...e,
              status: "failed",
            })),
          );

          if (generationId) {
            dispatch(
              updateActiveGeneration({
                id: generationId,
                updates: {
                  status: "failed",
                  error: "Runway generation failed",
                },
              }),
            );
          }
        }

        console.log("=== RUNWAY GENERATION COMPLETED ===");
      } else if (isMiniMaxModel) {
        // Use MiniMax generation
        const promptAdjusted = adjustPromptImageNumbers(
          finalPrompt,
          getCombinedUploadedImages(),
          selectedCharacters,
        );
        const result = await dispatch(
          generateMiniMaxImages({
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: selectedModel,
            aspect_ratio: frameSize,
            imageCount,
            generationType: "text-to-image",
            uploadedImages,
            style,
            styleVersion: indianStyleVersion,
          }),
        ).unwrap();

        // MiniMax now returns images directly with Firebase URLs
        // Update the loading entry with completed data
        // dispatch(
        //   updateHistoryEntry({
        //     id: loadingEntry.id,
        //     updates: {
        //       status: 'completed',
        //       images: result.images,
        //       imageCount: result.images.length,
        //       frameSize: result.aspect_ratio || frameSize,
        //       style,
        //       timestamp: new Date().toISOString(),
        //       createdAt: new Date().toISOString()
        //     },
        //   })
        // );

        // Update the local loading entry with completed images
        try {
          const resultHistoryId =
            (result as any)?.historyId || firebaseHistoryId || generationId;
          const completedEntry: HistoryEntry = {
            ...tempEntry,
            // Use the backend historyId when available so the local card matches the real entry.
            id: resultHistoryId || tempEntryId,
            // Also store firebaseHistoryId for duplicate-detection helpers
            ...(resultHistoryId ? { firebaseHistoryId: resultHistoryId } : {}),
            images: result.images,
            status: "completed",
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            imageCount: result.images.length,
          } as any;
          upsertLocalGeneratingEntry(completedEntry);

          if (generationId) {
            console.log(
              "[queue] MiniMax generation completed, updating active generation:",
              {
                generationId,
                historyId: (result as any)?.historyId,
                imageCount: completedEntry.images?.length,
              },
            );
            dispatch(
              updateActiveGeneration({
                id: generationId,
                updates: {
                  status: "completed",
                  images: completedEntry.images,
                  historyId: (result as any)?.historyId,
                },
              }),
            );
          }
        } catch {}

        // Toast removed - useQueueManagement handles success toasts
        clearInputs();

        // Refresh only the single completed generation instead of reloading all
        // Use backend historyId (not client gen-...) because that's what /api/generations/:id expects
        const historyIdToRefresh =
          (result as any)?.historyId || firebaseHistoryId || generationId;
        console.log("[queue] Refreshing generation:", {
          historyIdToRefresh,
          resultHistoryId: (result as any)?.historyId,
          generationId,
        });
        if (historyIdToRefresh) {
          await refreshSingleGeneration(historyIdToRefresh);
        } else {
          await refreshHistory();
        }

        // Handle credit success
        if (transactionId) {
          await handleGenerationSuccess(transactionId);
        }
      } else if (selectedModel === "flux-2-pro") {
        // FAL Flux 2 Pro immediate generate flow
        try {
          const promptAdjusted = adjustPromptImageNumbers(
            finalPrompt,
            getCombinedUploadedImages(),
            selectedCharacters,
          );
          const combinedImages = getCombinedUploadedImages().slice(
            0,
            getInputImageLimitForModel(selectedModel),
          );
          const result = await dispatch(
            falGenerate({
              prompt: `${promptAdjusted} [Style: ${style}]`,
              userPrompt: prompt, // Store original user-entered prompt
              model: selectedModel,
              // New schema: num_images + aspect_ratio + resolution
              num_images: imageCount,
              aspect_ratio: frameSize as any,
              resolution: flux2ProResolution, // 1K or 2K
              uploadedImages: combinedImages.map((u: string) =>
                toAbsoluteFromProxy(u),
              ),
              output_format: "jpeg",
              generationType: "text-to-image",
              isPublic,
            }),
          ).unwrap();

          // Handle queued submission fallback (FAL may return requestId + submitted)
          if (
            (!result.images || result.images.length === 0) &&
            (result.status === "submitted" || (result as any)?.requestId)
          ) {
            const reqId = result.requestId || (result as any)?.requestId;
            qlog("FAL queued submission detected", {
              model: result.model,
              reqId,
              generationId,
            });

            try {
              const queuedEntry: HistoryEntry = {
                ...tempEntry,
                id: tempEntryId,
                images: [],
                status: "generating",
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: imageCount,
              } as any;
              const startedAt = Date.now();
              upsertLocalGeneratingEntry(queuedEntry);

              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "generating",
                      startedAt,
                      historyId: (result as any)?.historyId || generationId,
                      params: {
                        ...(activeGenerations.find((g) => g.id === generationId)
                          ?.params || {}),
                        requestId: reqId,
                      },
                    },
                  }),
                );

                // Start polling for server history to attach canonical historyId
                void pollForMatchingHistory({
                  generationId,
                  tempEntryId,
                  model: result.model,
                  prompt: finalPrompt,
                  requestId: reqId,
                  startedAt,
                });
              }
            } catch {}

            // Poll FAL queue for completion
            try {
              const api = getApiClient();
              let finalResult: any;
              let consecutiveErrors = 0;
              const MAX_CONSECUTIVE_ERRORS = 5;

              for (let attempts = 0; attempts < 360; attempts++) {
                try {
                  const statusRes = await api.get("/api/fal/queue/status", {
                    params: { model: result.model, requestId: reqId },
                    timeout: 15000,
                  });
                  const status = statusRes.data?.data || statusRes.data;
                  qlog("FAL poll status (flux-2-pro)", {
                    model: result.model,
                    requestId: reqId,
                    attempt: attempts + 1,
                    status: status?.status,
                    statusObj: status,
                  });
                  consecutiveErrors = 0;
                  const s = String(status?.status || "").toLowerCase();

                  if (
                    s === "completed" ||
                    s === "success" ||
                    s === "succeeded"
                  ) {
                    const resultRes = await api.get("/api/fal/queue/result", {
                      params: { model: result.model, requestId: reqId },
                      timeout: 15000,
                    });
                    finalResult = resultRes.data?.data || resultRes.data;

                    // Mark completed
                    try {
                      const completedEntry: HistoryEntry = {
                        ...tempEntry,
                        id: tempEntryId,
                        images: finalResult.images || [],
                        status: "completed",
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        imageCount: finalResult.images?.length || imageCount,
                      } as any;
                      upsertLocalGeneratingEntry(completedEntry);

                      if (generationId) {
                        dispatch(
                          updateActiveGeneration({
                            id: generationId,
                            updates: {
                              status: "completed",
                              images: finalResult.images || [],
                              historyId:
                                finalResult.historyId ||
                                (result as any)?.historyId,
                            },
                          }),
                        );
                      }
                    } catch {}

                    const resultHistoryId =
                      (finalResult as any)?.historyId ||
                      (result as any)?.historyId ||
                      firebaseHistoryId ||
                      generationId;
                    if (resultHistoryId) {
                      await refreshSingleGeneration(resultHistoryId);
                    } else {
                      await refreshHistory();
                    }

                    if (transactionId) {
                      await handleGenerationSuccess(transactionId);
                    }

                    break;
                  }

                  if (s === "failed" || s === "error") {
                    throw new Error(
                      extractQueueFailureMessage(
                        status,
                        "Flux 2 Pro generation failed (queue)",
                      ),
                    );
                  }
                } catch (statusError: any) {
                  consecutiveErrors++;
                  const errorMsg = extractQueueFailureMessage(
                    statusError,
                    statusError?.message || String(statusError),
                  );
                  const isNetworkError =
                    errorMsg.includes("timeout") ||
                    errorMsg.includes("ECONNREFUSED") ||
                    errorMsg.includes("ENOTFOUND");

                  if (isNetworkError) {
                    qwarn(
                      `Flux 2 Pro - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`,
                      errorMsg,
                    );
                  } else {
                    qerr(`Flux 2 Pro - Error (${attempts + 1}/360)`, errorMsg);
                  }

                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    if (generationId) {
                      dispatch(
                        updateActiveGeneration({
                          id: generationId,
                          updates: {
                            status: "failed",
                            error: `Flux 2 Pro queue polling failed: ${errorMsg}`,
                          },
                        }),
                      );
                    }
                    throw new Error(
                      `Flux 2 Pro: Too many network errors. ${errorMsg}`,
                    );
                  }
                  if (attempts === 359)
                    throw new Error(
                      `Flux 2 Pro: Timeout after 360 attempts. ${errorMsg}`,
                    );
                }
                await new Promise((res) => setTimeout(res, 1000));
              }

              return;
            } catch (queueErr) {
              qerr("Flux 2 Pro queue polling failed", queueErr);
              if (generationId)
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "failed",
                      error: extractQueueFailureMessage(
                        queueErr,
                        "Flux 2 Pro generation failed",
                      ),
                    },
                  }),
                );
              await handleFalError(queueErr, {
                generationId,
                tempEntryId,
                tempEntry,
                transactionId,
                modelName: "Flux 2 Pro",
              });
              return;
            }
          }

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: result.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: result.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            if (generationId) {
              console.log(
                "[queue] Generation completed, updating active generation:",
                {
                  generationId,
                  historyId: (result as any)?.historyId,
                  imageCount: completedEntry.images?.length,
                },
              );
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: completedEntry.images,
                    historyId: (result as any)?.historyId,
                  },
                }),
              );
            }
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId =
            (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log("[queue] Refreshing generation:", {
            resultHistoryId,
            resultHistoryIdFromAPI: (result as any)?.historyId,
            generationId,
          });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleFalError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "Flux 2 Pro",
          });
          return;
        }
      } else if (
        selectedModel === "gemini-25-flash-image" ||
        selectedModel === "google/nano-banana-pro"
      ) {
        // FAL Gemini (Nano Banana) immediate generate flow (align with BFL)
        try {
          const promptAdjusted = adjustPromptImageNumbers(
            finalPrompt,
            getCombinedUploadedImages(),
            selectedCharacters,
          );
          const combinedImages = getCombinedUploadedImages().slice(
            0,
            getInputImageLimitForModel(selectedModel),
          );
          const preparedImages = await ensureProviderReadyImageUrls(
            combinedImages,
            getInputImageLimitForModel(selectedModel),
          );
          const nanoBananaFlashAspect = new Set([
            "1:1",
            "2:3",
            "3:2",
            "3:4",
            "4:3",
            "4:5",
            "5:4",
            "9:16",
            "16:9",
            "21:9",
          ]);
          const nanoBananaProAspect = new Set([
            ...nanoBananaFlashAspect,
            "auto",
          ]);
          const normalizedAspect =
            selectedModel === "google/nano-banana-pro" ||
            selectedModel === "nano-banana-pro"
              ? nanoBananaProAspect.has(frameSize as string)
                ? frameSize
                : "auto"
              : nanoBananaFlashAspect.has(frameSize as string)
                ? frameSize
                : "1:1";
          const falNanoImageOutputFormat =
            outputFormat === "jpg" || outputFormat === "jpeg"
              ? "jpeg"
              : outputFormat === "webp"
                ? "webp"
                : "png";
          const result = await dispatch(
            falGenerate({
              prompt: `${promptAdjusted} [Style: ${style}]`,
              userPrompt: prompt, // Store original user-entered prompt
              model: selectedModel,
              // New schema: num_images + aspect_ratio
              num_images: imageCount,
              aspect_ratio: normalizedAspect as any,
              uploadedImages: preparedImages,
              output_format: falNanoImageOutputFormat,
              ...(selectedModel === "google/nano-banana-pro" ||
              selectedModel === "nano-banana-pro"
                ? { resolution: nanoBananaProResolution }
                : {}),
              generationType: "text-to-image",
              isPublic,
            }),
          ).unwrap();

          // If server returned a queued submission (requestId) instead of images, poll the FAL queue
          if (
            (!result.images || result.images.length === 0) &&
            (result.status === "submitted" || (result as any)?.requestId)
          ) {
            const reqId = result.requestId || (result as any)?.requestId;
            qlog("FAL queued submission detected (Gemini/Nano Banana)", {
              model: result.model,
              reqId,
              generationId,
            });

            try {
              const queuedEntry: HistoryEntry = {
                ...tempEntry,
                id: tempEntryId,
                images: [],
                status: "generating",
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: imageCount,
              } as any;
              const startedAt = Date.now();
              upsertLocalGeneratingEntry(queuedEntry);

              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "generating",
                      startedAt,
                      historyId: (result as any)?.historyId || generationId,
                      params: {
                        ...(activeGenerations.find((g) => g.id === generationId)
                          ?.params || {}),
                        requestId: reqId,
                      },
                    },
                  }),
                );

                void pollForMatchingHistory({
                  generationId,
                  tempEntryId,
                  model: result.model,
                  prompt: finalPrompt,
                  requestId: reqId,
                  startedAt,
                });
              }
            } catch {}

            try {
              const api = getApiClient();
              let finalResult: any;
              let consecutiveErrors = 0;
              const MAX_CONSECUTIVE_ERRORS = 5;

              for (let attempts = 0; attempts < 360; attempts++) {
                try {
                  const statusRes = await api.get("/api/fal/queue/status", {
                    params: { model: result.model, requestId: reqId },
                    timeout: 15000,
                  });
                  const status = statusRes.data?.data || statusRes.data;
                  consecutiveErrors = 0;
                  const s = String(status?.status || "").toLowerCase();

                  if (
                    s === "completed" ||
                    s === "success" ||
                    s === "succeeded"
                  ) {
                    const resultRes = await api.get("/api/fal/queue/result", {
                      params: { model: result.model, requestId: reqId },
                      timeout: 15000,
                    });
                    finalResult = resultRes.data?.data || resultRes.data;

                    // Mark completed
                    try {
                      const completedEntry: HistoryEntry = {
                        ...tempEntry,
                        id: tempEntryId,
                        images: finalResult.images || [],
                        status: "completed",
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        imageCount: finalResult.images?.length || imageCount,
                      } as any;
                      upsertLocalGeneratingEntry(completedEntry);

                      if (generationId) {
                        dispatch(
                          updateActiveGeneration({
                            id: generationId,
                            updates: {
                              status: "completed",
                              images: finalResult.images || [],
                              historyId:
                                finalResult.historyId ||
                                (result as any)?.historyId,
                            },
                          }),
                        );
                      }
                    } catch {}

                    const resultHistoryId =
                      (finalResult as any)?.historyId ||
                      (result as any)?.historyId ||
                      firebaseHistoryId ||
                      generationId;
                    if (resultHistoryId) {
                      await refreshSingleGeneration(resultHistoryId);
                    } else {
                      await refreshHistory();
                    }

                    if (transactionId) {
                      await handleGenerationSuccess(transactionId);
                    }

                    break;
                  }

                  if (s === "failed" || s === "error") {
                    throw new Error(
                      extractQueueFailureMessage(
                        status,
                        "Gemini generation failed (queue)",
                      ),
                    );
                  }
                } catch (statusError: any) {
                  consecutiveErrors++;
                  const errorMsg = extractQueueFailureMessage(
                    statusError,
                    statusError?.message || String(statusError),
                  );
                  const isNetworkError =
                    errorMsg.includes("timeout") ||
                    errorMsg.includes("ECONNREFUSED") ||
                    errorMsg.includes("ENOTFOUND");

                  if (isNetworkError) {
                    console.warn(
                      `[queue] Gemini/Nano Banana - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                      errorMsg,
                    );
                  } else {
                    console.error(
                      `[queue] Gemini/Nano Banana - Error (${attempts + 1}/360):`,
                      errorMsg,
                    );
                  }

                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    if (generationId) {
                      dispatch(
                        updateActiveGeneration({
                          id: generationId,
                          updates: {
                            status: "failed",
                            error: `Gemini queue polling failed: ${errorMsg}`,
                          },
                        }),
                      );
                    }
                    throw new Error(
                      `Gemini: Too many network errors. ${errorMsg}`,
                    );
                  }
                  if (attempts === 359)
                    throw new Error(
                      `Gemini: Timeout after 360 attempts. ${errorMsg}`,
                    );
                }
                await new Promise((res) => setTimeout(res, 1000));
              }

              return;
            } catch (queueErr) {
              console.error("[queue] Gemini queue polling failed:", queueErr);
              if (generationId)
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "failed",
                      error: extractQueueFailureMessage(
                        queueErr,
                        "Gemini generation failed",
                      ),
                    },
                  }),
                );
              await handleFalError(queueErr, {
                generationId,
                tempEntryId,
                tempEntry,
                transactionId,
                modelName: "Google Nano Banana",
              });
              return;
            }
          }

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: result.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: result.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            if (generationId) {
              console.log(
                "[queue] Generation completed, updating active generation:",
                {
                  generationId,
                  historyId: (result as any)?.historyId,
                  imageCount: completedEntry.images?.length,
                },
              );
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: completedEntry.images,
                    historyId: (result as any)?.historyId,
                  },
                }),
              );
            }
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId =
            (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log("[queue] Refreshing generation:", {
            resultHistoryId,
            resultHistoryIdFromAPI: (result as any)?.historyId,
            generationId,
          });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          console.error("FAL generate failed:", error);
          await handleFalError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "Google Nano Banana",
          });
          return;
        }
      } else if (
        selectedModel === "imagen-4-ultra" ||
        selectedModel === "imagen-4" ||
        selectedModel === "imagen-4-fast"
      ) {
        // Imagen 4 models via FAL generate endpoint
        try {
          const promptAdjusted = adjustPromptImageNumbers(
            finalPrompt,
            getCombinedUploadedImages(),
            selectedCharacters,
          );
          const combinedImages = getCombinedUploadedImages().slice(
            0,
            getInputImageLimitForModel(selectedModel),
          );
          const result = await dispatch(
            falGenerate({
              prompt: `${promptAdjusted} [Style: ${style}]`,
              userPrompt: prompt, // Store original user-entered prompt
              model: selectedModel,
              aspect_ratio: frameSize as any,
              num_images: imageCount,
              uploadedImages: combinedImages.map((u: string) =>
                toAbsoluteFromProxy(u),
              ),
              output_format: outputFormat,
              generationType: "text-to-image",
              isPublic,
            }),
          ).unwrap();

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: result.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: result.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            if (generationId) {
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: completedEntry.images,
                    historyId: (result as any)?.historyId,
                  },
                }),
              );
            }
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing (don't wipe other in-flight jobs)
          setTimeout(() => {
            removeLocalGeneratingEntry(generationId || tempEntryId);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId =
            (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log("[queue] Refreshing generation:", {
            resultHistoryId,
            resultHistoryIdFromAPI: (result as any)?.historyId,
            generationId,
          });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleFalError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "Imagen 4",
          });
          return;
        }
      } else if (selectedModel === "seedream-v4") {
        // Replicate Seedream v4 (supports T2I and I2I with multi-image input)
        try {
          // Build Seedream payload per new schema
          const seedreamAllowedAspect = new Set([
            "match_input_image",
            "1:1",
            "4:3",
            "3:4",
            "16:9",
            "9:16",
            "3:2",
            "2:3",
            "21:9",
          ]);
          const promptAdjusted = adjustPromptImageNumbers(
            finalPrompt,
            getCombinedUploadedImages(),
            selectedCharacters,
          );
          const payload: any = {
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: "bytedance/seedream-4",
            size: seedreamSize,
            aspect_ratio: seedreamAllowedAspect.has(frameSize)
              ? frameSize
              : "match_input_image",
            sequential_image_generation: "disabled",
            max_images: Math.min(imageCount, 4),
            isPublic,
          };
          if (seedreamSize === "custom") {
            payload.width = Math.max(
              1024,
              Math.min(4096, Number(seedreamWidth) || 2048),
            );
            payload.height = Math.max(
              1024,
              Math.min(4096, Number(seedreamHeight) || 2048),
            );
          }
          // Filter out SVG files - Seedream doesn't support SVG as input
          if (uploadedImages && uploadedImages.length > 0) {
            const resolvedImages = await ensureProviderReadyImageUrls(
              uploadedImages,
              10,
            );
            const validImages = resolvedImages.filter((url: string) => {
              // Exclude SVG files (vectorized images)
              const lowerUrl = url.toLowerCase();
              return (
                !lowerUrl.includes(".svg") && !lowerUrl.includes("vectorized")
              );
            });
            if (validImages.length > 0) {
              payload.image_input = validImages;
            }
          }
          const result = await dispatch(replicateGenerate(payload)).unwrap();

          // If provider returned a queued submission (requestId) instead of immediate images,
          // fall back to queue polling behavior used by video flows.
          if (
            (!result.images || result.images.length === 0) &&
            (result.status === "submitted" ||
              result.requestId ||
              (result as any)?.requestId)
          ) {
            const reqId = result.requestId || (result as any)?.requestId;
            qlog("Seedream v4 queued submission detected", {
              model: result.model,
              reqId,
              generationId,
            });

            // Keep local card visible as a 'generating' entry
            try {
              const queuedEntry: HistoryEntry = {
                ...tempEntry,
                id: tempEntryId,
                images: [],
                status: "generating",
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: imageCount,
              } as any;
              const startedAt = Date.now();
              upsertLocalGeneratingEntry(queuedEntry);

              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "generating",
                      startedAt,
                      historyId: (result as any)?.historyId || generationId,
                      // store requestId on params for diagnostics
                      params: {
                        ...(activeGenerations.find((g) => g.id === generationId)
                          ?.params || {}),
                        requestId: reqId,
                      },
                    },
                  }),
                );

                // Start history matching poll
                void pollForMatchingHistory({
                  generationId,
                  tempEntryId,
                  model: result.model,
                  prompt: finalPrompt,
                  requestId: reqId,
                  startedAt,
                });
              }
            } catch {}

            // Poll for completion using Replicate queue endpoints
            try {
              const api = getApiClient();
              let finalResult: any;
              let consecutiveErrors = 0;
              const MAX_CONSECUTIVE_ERRORS = 5;

              for (let attempts = 0; attempts < 360; attempts++) {
                // up to 6 minutes
                try {
                  const statusRes = await api.get(
                    "/api/replicate/queue/status",
                    {
                      params: { requestId: reqId },
                      timeout: 15000,
                    },
                  );
                  const status = statusRes.data?.data || statusRes.data;
                  consecutiveErrors = 0;
                  const s = String(status?.status || "").toLowerCase();

                  if (
                    s === "completed" ||
                    s === "success" ||
                    s === "succeeded"
                  ) {
                    const resultRes = await api.get(
                      "/api/replicate/queue/result",
                      {
                        params: { requestId: reqId },
                        timeout: 15000,
                      },
                    );
                    finalResult = resultRes.data?.data || resultRes.data;

                    // Mark completed
                    try {
                      const completedEntry: HistoryEntry = {
                        ...tempEntry,
                        id: tempEntryId,
                        images: finalResult.images || [],
                        status: "completed",
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        imageCount: finalResult.images?.length || imageCount,
                      } as any;
                      upsertLocalGeneratingEntry(completedEntry);

                      if (generationId) {
                        dispatch(
                          updateActiveGeneration({
                            id: generationId,
                            updates: {
                              status: "completed",
                              images: finalResult.images || [],
                              historyId:
                                finalResult.historyId ||
                                (result as any)?.historyId,
                            },
                          }),
                        );
                      }
                    } catch {}

                    // Refresh and handle credits/transaction if present
                    const resultHistoryId =
                      (finalResult as any)?.historyId ||
                      (result as any)?.historyId ||
                      firebaseHistoryId ||
                      generationId;
                    if (resultHistoryId) {
                      await refreshSingleGeneration(resultHistoryId);
                    } else {
                      await refreshHistory();
                    }

                    if (transactionId) {
                      await handleGenerationSuccess(transactionId);
                    }

                    break;
                  }

                  if (s === "failed" || s === "error") {
                    throw new Error(
                      extractQueueFailureMessage(
                        status,
                        "Seedream generation failed (queue)",
                      ),
                    );
                  }
                } catch (statusError: any) {
                  consecutiveErrors++;
                  const errorMsg = extractQueueFailureMessage(
                    statusError,
                    statusError?.message || String(statusError),
                  );
                  const isNetworkError =
                    errorMsg.includes("timeout") ||
                    errorMsg.includes("ECONNREFUSED") ||
                    errorMsg.includes("ENOTFOUND");

                  if (isNetworkError) {
                    console.warn(
                      `[queue] Seedream v4 - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                      errorMsg,
                    );
                  } else {
                    console.error(
                      `[queue] Seedream v4 - Error (${attempts + 1}/360):`,
                      errorMsg,
                    );
                  }

                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    // Mark generation as failed in UI
                    if (generationId) {
                      dispatch(
                        updateActiveGeneration({
                          id: generationId,
                          updates: {
                            status: "failed",
                            error: `Seedream queue polling failed: ${errorMsg}`,
                          },
                        }),
                      );
                    }
                    throw new Error(
                      `Seedream v4: Too many network errors. ${errorMsg}`,
                    );
                  }
                  if (attempts === 359)
                    throw new Error(
                      `Seedream v4: Timeout after 360 attempts. ${errorMsg}`,
                    );
                }
                await new Promise((res) => setTimeout(res, 1000));
              }

              return; // Exit the normal flow since queue result handled
            } catch (queueErr) {
              console.error(
                "[queue] Seedream v4 queue polling failed:",
                queueErr,
              );
              // Mirror failure into activeGenerations so the shared UI reflects the error
              if (generationId)
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "failed",
                      error: extractQueueFailureMessage(
                        queueErr,
                        "Seedream generation failed",
                      ),
                    },
                  }),
                );
              await handleReplicateError(queueErr, {
                generationId,
                tempEntryId,
                tempEntry,
                transactionId,
                modelName: "Seedream v4",
              });
              return;
            }
          }

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: result.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: result.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (result as any)?.historyId;
              console.log(
                "[queue] Seedream v4 generation completed, updating active generation:",
                {
                  generationId,
                  historyId: resultHistoryId,
                  imageCount: result.images?.length,
                },
              );
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: result.images || [],
                    historyId: resultHistoryId,
                  },
                }),
              );
            }
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing
          // Don't reset isGeneratingLocally here - let the useEffect handle it when status changes
          setTimeout(() => {
            removeLocalGeneratingEntry(generationId || tempEntryId);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId =
            (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log("[queue] Refreshing generation:", {
            resultHistoryId,
            resultHistoryIdFromAPI: (result as any)?.historyId,
            generationId,
          });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "Seedream v4",
          });
          return;
        }
      } else if (selectedModel === "seedream-4.5") {
        // FAL Seedream 4.5 (v45) text-to-image - map frame size to proper enum values
        try {
          const promptAdjusted = adjustPromptImageNumbers(
            finalPrompt,
            getCombinedUploadedImages(),
            selectedCharacters,
          );
          const combinedImages = getCombinedUploadedImages().slice(
            0,
            getInputImageLimitForModel(selectedModel),
          );

          // Map frame size to Seedream 4.5 enum values (square_hd, portrait_4_3, landscape_16_9, etc.)
          const frameSizeToEnum: Record<string, string> = {
            "1:1": "square_hd",
            square: "square_hd",
            "4:3": "landscape_4_3",
            "3:4": "portrait_4_3",
            "16:9": "landscape_16_9",
            "9:16": "portrait_16_9",
          };

          // Always use the proper frame size enum based on selected aspect ratio
          const imageSizeEnum = frameSizeToEnum[frameSize] || "square_hd";

          const result = await dispatch(
            falGenerate({
              prompt: `${promptAdjusted} [Style: ${style}]`,
              userPrompt: prompt,
              model: "seedream-4.5",
              generationType: "text-to-image",
              // Pass selected frame size and aspect ratio for backend reference
              frameSize,
              aspect_ratio: frameSize as any,
              // Send proper frame size enum (square_hd, portrait_4_3, landscape_16_9, etc.)
              // Backend will use this directly, respecting the selected frame size
              image_size: imageSizeEnum,
              resolution: seedream45Resolution, // Send resolution for backend reference (2K/4K)
              num_images: imageCount,
              max_images: imageCount,
              enable_safety_checker: true,
              uploadedImages: combinedImages.map((u: string) =>
                toAbsoluteFromProxy(u),
              ),
              isPublic,
            }),
          ).unwrap();

          // Fallback: if backend returned a queued submission instead of images
          if (
            (!result.images || result.images.length === 0) &&
            (result.status === "submitted" || (result as any)?.requestId)
          ) {
            const reqId = result.requestId || (result as any)?.requestId;
            qlog("Seedream 4.5 queued submission detected", {
              model: result.model,
              reqId,
              generationId,
            });

            try {
              const queuedEntry: HistoryEntry = {
                ...tempEntry,
                id: tempEntryId,
                images: [],
                status: "generating",
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: imageCount,
              } as any;
              const startedAt = Date.now();
              upsertLocalGeneratingEntry(queuedEntry);

              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "generating",
                      startedAt,
                      historyId: (result as any)?.historyId || generationId,
                      params: {
                        ...(activeGenerations.find((g) => g.id === generationId)
                          ?.params || {}),
                        requestId: reqId,
                      },
                    },
                  }),
                );

                // Begin matching server history for canonical attach
                void pollForMatchingHistory({
                  generationId,
                  tempEntryId,
                  model: result.model,
                  prompt: finalPrompt,
                  requestId: reqId,
                  startedAt,
                });
              }

              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "generating",
                      historyId: (result as any)?.historyId || generationId,
                      params: {
                        ...(activeGenerations.find((g) => g.id === generationId)
                          ?.params || {}),
                        requestId: reqId,
                      },
                    },
                  }),
                );
              }
            } catch {}

            try {
              const api = getApiClient();
              let finalResult: any;
              let consecutiveErrors = 0;
              const MAX_CONSECUTIVE_ERRORS = 5;

              for (let attempts = 0; attempts < 360; attempts++) {
                try {
                  const statusRes = await api.get("/api/fal/queue/status", {
                    params: { model: "seedream-4.5", requestId: reqId },
                    timeout: 15000,
                  });
                  const status = statusRes.data?.data || statusRes.data;
                  consecutiveErrors = 0;
                  const s = String(status?.status || "").toLowerCase();

                  if (
                    s === "completed" ||
                    s === "success" ||
                    s === "succeeded"
                  ) {
                    const resultRes = await api.get("/api/fal/queue/result", {
                      params: { model: "seedream-4.5", requestId: reqId },
                      timeout: 15000,
                    });
                    finalResult = resultRes.data?.data || resultRes.data;

                    // Mark completed
                    try {
                      const completedEntry: HistoryEntry = {
                        ...tempEntry,
                        id: tempEntryId,
                        images: finalResult.images || [],
                        status: "completed",
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        imageCount: finalResult.images?.length || imageCount,
                      } as any;
                      upsertLocalGeneratingEntry(completedEntry);

                      if (generationId) {
                        dispatch(
                          updateActiveGeneration({
                            id: generationId,
                            updates: {
                              status: "completed",
                              images: finalResult.images || [],
                              historyId:
                                finalResult.historyId ||
                                (result as any)?.historyId,
                            },
                          }),
                        );
                      }
                    } catch {}

                    const resultHistoryId =
                      (finalResult as any)?.historyId ||
                      (result as any)?.historyId ||
                      firebaseHistoryId ||
                      generationId;
                    if (resultHistoryId) {
                      await refreshSingleGeneration(resultHistoryId);
                    } else {
                      await refreshHistory();
                    }

                    if (transactionId) {
                      await handleGenerationSuccess(transactionId);
                    }

                    break;
                  }

                  if (s === "failed" || s === "error") {
                    throw new Error(
                      extractQueueFailureMessage(
                        status,
                        "Seedream 4.5 generation failed (queue)",
                      ),
                    );
                  }
                } catch (statusError: any) {
                  consecutiveErrors++;
                  const errorMsg = extractQueueFailureMessage(
                    statusError,
                    statusError?.message || String(statusError),
                  );
                  const isNetworkError =
                    errorMsg.includes("timeout") ||
                    errorMsg.includes("ECONNREFUSED") ||
                    errorMsg.includes("ENOTFOUND");

                  if (isNetworkError) {
                    console.warn(
                      `[queue] Seedream 4.5 - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                      errorMsg,
                    );
                  } else {
                    console.error(
                      `[queue] Seedream 4.5 - Error (${attempts + 1}/360):`,
                      errorMsg,
                    );
                  }

                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    if (generationId) {
                      dispatch(
                        updateActiveGeneration({
                          id: generationId,
                          updates: {
                            status: "failed",
                            error: `Seedream 4.5 queue polling failed: ${errorMsg}`,
                          },
                        }),
                      );
                    }
                    throw new Error(
                      `Seedream 4.5: Too many network errors. ${errorMsg}`,
                    );
                  }
                  if (attempts === 359)
                    throw new Error(
                      `Seedream 4.5: Timeout after 360 attempts. ${errorMsg}`,
                    );
                }
                await new Promise((res) => setTimeout(res, 1000));
              }

              return;
            } catch (queueErr) {
              console.error(
                "[queue] Seedream 4.5 queue polling failed:",
                queueErr,
              );
              if (generationId)
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "failed",
                      error: extractQueueFailureMessage(
                        queueErr,
                        "Seedream 4.5 generation failed",
                      ),
                    },
                  }),
                );
              await handleReplicateError(queueErr, {
                generationId,
                tempEntryId,
                tempEntry,
                transactionId,
                modelName: "Seedream 4.5",
              });
              return;
            }
          }

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: result.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: result.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (result as any)?.historyId;
              console.log(
                "[queue] Seedream 4.5 generation completed, updating active generation:",
                {
                  generationId,
                  historyId: resultHistoryId,
                  imageCount: result.images?.length,
                },
              );
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: result.images || [],
                    historyId: resultHistoryId,
                  },
                }),
              );
            }
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing
          setTimeout(() => {
            removeLocalGeneratingEntry(generationId || tempEntryId);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId =
            (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log("[queue] Refreshing generation:", {
            resultHistoryId,
            resultHistoryIdFromAPI: (result as any)?.historyId,
            generationId,
          });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "Seedream 4.5",
          });
          return;
        }
      } else if (selectedModel === "ideogram-ai/ideogram-v3") {
        // Ideogram v3 via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for ideogram (validator list)
          const allowedAspect = new Set([
            "1:3",
            "3:1",
            "1:2",
            "2:1",
            "9:16",
            "16:9",
            "10:16",
            "16:10",
            "2:3",
            "3:2",
            "3:4",
            "4:3",
            "4:5",
            "5:4",
            "1:1",
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : "1:1";

          // Ideogram v3 doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from(
            { length: totalToGenerate },
            async (_, index) => {
              // Sensible defaults (can be expanded to UI later)
              const promptAdjusted = adjustPromptImageNumbers(
                finalPrompt,
                getCombinedUploadedImages(),
                selectedCharacters,
              );
              const payload: any = {
                prompt: `${promptAdjusted} [Style: ${style}]`,
                model: "ideogram-ai/ideogram-v3-turbo",
                aspect_ratio: aspect,
                // Provide safe defaults accepted by backend validator/model
                resolution: "None",
                style_type: "Auto",
                magic_prompt_option: "Auto",
              };

              // If user provided a reference image, pass a single image (v3 supports I2I prompt image)
              if (uploadedImages && uploadedImages.length > 0) {
                payload.image = toAbsoluteFromProxy(uploadedImages[0]);
              }

              const result = await dispatch(
                replicateGenerate(payload),
              ).unwrap();
              return result;
            },
          );

          // Wait for all generations to complete
          const results = await Promise.all(generationPromises);

          // Combine all images from all results
          const allImages = results.flatMap((result) => result.images || []);
          const combinedResult = {
            ...results[0], // Use first result as base
            images: allImages,
          };

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: combinedResult.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: combinedResult.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (combinedResult as any)?.historyId;
              console.log(
                "[queue] Generation completed, updating active generation:",
                {
                  generationId,
                  historyId: resultHistoryId,
                  imageCount: combinedResult.images?.length,
                },
              );
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: combinedResult.images || [],
                    historyId: resultHistoryId,
                  },
                }),
              );
            }
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing (don't wipe other in-flight jobs)
          setTimeout(() => {
            removeLocalGeneratingEntry(generationId || tempEntryId);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId =
            (combinedResult as any)?.historyId ||
            firebaseHistoryId ||
            generationId;
          console.log("[queue] Refreshing generation:", {
            resultHistoryId,
            resultHistoryIdFromAPI: (combinedResult as any)?.historyId,
            generationId,
          });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "Ideogram v3",
          });
          return;
        }
      } else if (selectedModel === "recraft-ai/recraft-v4") {
        try {
          const allowedAspect = new Set([
            "1:1",
            "4:3",
            "3:4",
            "3:2",
            "2:3",
            "16:9",
            "9:16",
            "1:2",
            "2:1",
            "14:10",
            "10:14",
            "4:5",
            "5:4",
            "6:10",
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : "1:1";
          const promptAdjusted = adjustPromptImageNumbers(
            finalPrompt,
            getCombinedUploadedImages(),
            selectedCharacters,
          );
          const payload: any = {
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: "recraft-ai/recraft-v4",
            aspect_ratio: aspect,
            num_images: Math.min(Math.max(imageCount, 1), 4),
            isPublic,
          };

          const result = await dispatch(replicateGenerate(payload)).unwrap();

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: result.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: result.images?.length || 1,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            if (generationId) {
              const resultHistoryId = (result as any)?.historyId;
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: result.images || [],
                    historyId: resultHistoryId,
                  },
                }),
              );
            }
          } catch {}

          clearInputs();

          const resultHistoryId =
            (result as any)?.historyId || firebaseHistoryId || generationId;
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "Recraft v4",
          });
          return;
        }
      } else if (selectedModel === "ideogram-ai/ideogram-v3-quality") {
        // Ideogram v3 Quality via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for ideogram (validator list)
          const allowedAspect = new Set([
            "1:3",
            "3:1",
            "1:2",
            "2:1",
            "9:16",
            "16:9",
            "10:16",
            "16:10",
            "2:3",
            "3:2",
            "3:4",
            "4:3",
            "4:5",
            "5:4",
            "1:1",
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : "1:1";

          // Ideogram v3 Quality doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from(
            { length: totalToGenerate },
            async (_, index) => {
              // Sensible defaults (can be expanded to UI later)
              const promptAdjusted = adjustPromptImageNumbers(
                finalPrompt,
                getCombinedUploadedImages(),
                selectedCharacters,
              );
              const payload: any = {
                prompt: `${promptAdjusted} [Style: ${style}]`,
                model: "ideogram-ai/ideogram-v3-quality",
                aspect_ratio: aspect,
                // Provide safe defaults accepted by backend validator/model
                resolution: "None",
                style_type: "Auto",
                magic_prompt_option: "Auto",
              };

              // If user provided a reference image, pass a single image (v3 supports I2I prompt image)
              if (uploadedImages && uploadedImages.length > 0) {
                payload.image = toAbsoluteFromProxy(uploadedImages[0]);
              }

              const result = await dispatch(
                replicateGenerate(payload),
              ).unwrap();
              return result;
            },
          );

          // Wait for all generations to complete
          const results = await Promise.all(generationPromises);

          // Combine all images from all results
          const allImages = results.flatMap((result) => result.images || []);
          const combinedResult = {
            ...results[0], // Use first result as base
            images: allImages,
          };

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: combinedResult.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: combinedResult.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (combinedResult as any)?.historyId;
              console.log(
                "[queue] Generation completed, updating active generation:",
                {
                  generationId,
                  historyId: resultHistoryId,
                  imageCount: combinedResult.images?.length,
                },
              );
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: combinedResult.images || [],
                    historyId: resultHistoryId,
                  },
                }),
              );
            }
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing (don't wipe other in-flight jobs)
          setTimeout(() => {
            removeLocalGeneratingEntry(generationId || tempEntryId);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId =
            (combinedResult as any)?.historyId ||
            firebaseHistoryId ||
            generationId;
          console.log("[queue] Refreshing generation:", {
            resultHistoryId,
            resultHistoryIdFromAPI: (combinedResult as any)?.historyId,
            generationId,
          });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          // Stop generation process immediately on error (don't wipe other in-flight jobs)
          removeLocalGeneratingEntry(generationId || tempEntryId);
          setIsGeneratingLocally(false);
          postGenerationBlockRef.current = false;

          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to generate images with Ideogram v3 Quality",
          );
          return;
        }
      } else if (selectedModel === "leonardoai/lucid-origin") {
        // Lucid Origin via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for Lucid Origin
          const allowedAspect = new Set([
            "1:1",
            "16:9",
            "9:16",
            "3:2",
            "2:3",
            "4:5",
            "5:4",
            "3:4",
            "4:3",
            "2:1",
            "1:2",
            "3:1",
            "1:3",
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : "1:1";

          // Lucid Origin doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from(
            { length: totalToGenerate },
            async (_, index) => {
              const promptAdjusted = adjustPromptImageNumbers(
                finalPrompt,
                getCombinedUploadedImages(),
                selectedCharacters,
              );
              const payload: any = {
                prompt: `${promptAdjusted} [Style: ${style}]`,
                model: "leonardoai/lucid-origin",
                aspect_ratio: aspect,
                // Use Redux state values for Lucid Origin
                style: lucidStyle,
                contrast: lucidContrast,
                generation_mode: lucidMode,
                prompt_enhance: lucidPromptEnhance,
                num_images: 1,
              };

              const result = await dispatch(
                replicateGenerate(payload),
              ).unwrap();
              return result;
            },
          );

          // Wait for all generations to complete
          const results = await Promise.all(generationPromises);

          // Combine all images from all results
          const allImages = results.flatMap((result) => result.images || []);
          const combinedResult = {
            ...results[0], // Use first result as base
            images: allImages,
          };

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: combinedResult.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: combinedResult.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (combinedResult as any)?.historyId;
              console.log(
                "[queue] Generation completed, updating active generation:",
                {
                  generationId,
                  historyId: resultHistoryId,
                  imageCount: combinedResult.images?.length,
                },
              );
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: combinedResult.images || [],
                    historyId: resultHistoryId,
                  },
                }),
              );
            }
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing (don't wipe other in-flight jobs)
          setTimeout(() => {
            removeLocalGeneratingEntry(generationId || tempEntryId);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId =
            (combinedResult as any)?.historyId ||
            firebaseHistoryId ||
            generationId;
          console.log("[queue] Refreshing generation:", {
            resultHistoryId,
            resultHistoryIdFromAPI: (combinedResult as any)?.historyId,
            generationId,
          });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "Lucid Origin",
          });
          return;
        }
      } else if (selectedModel === "leonardoai/phoenix-1.0") {
        // Phoenix 1.0 via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for Phoenix 1.0
          const allowedAspect = new Set([
            "1:1",
            "16:9",
            "9:16",
            "3:2",
            "2:3",
            "4:5",
            "5:4",
            "3:4",
            "4:3",
            "2:1",
            "1:2",
            "3:1",
            "1:3",
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : "1:1";

          // Phoenix 1.0 doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from(
            { length: totalToGenerate },
            async (_, index) => {
              const payload: any = {
                prompt: `${prompt} [Style: ${style}]`,
                model: "leonardoai/phoenix-1.0",
                aspect_ratio: aspect,
                // Use Redux state values for Phoenix 1.0
                style: phoenixStyle,
                contrast: phoenixContrast,
                generation_mode: phoenixMode,
                prompt_enhance: phoenixPromptEnhance,
                num_images: 1,
              };

              const result = await dispatch(
                replicateGenerate(payload),
              ).unwrap();
              return result;
            },
          );

          // Wait for all generations to complete
          const results = await Promise.all(generationPromises);

          // Combine all images from all results
          const allImages = results.flatMap((result) => result.images || []);
          const combinedResult = {
            ...results[0], // Use first result as base
            images: allImages,
          };

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: combinedResult.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: combinedResult.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing
          setTimeout(() => {
            setLocalGeneratingEntries([]);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId =
            (combinedResult as any)?.historyId || firebaseHistoryId;
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          // Stop generation process immediately on error
          setLocalGeneratingEntries([]);
          setIsGeneratingLocally(false);
          postGenerationBlockRef.current = false;

          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "Phoenix 1.0",
          });
          return;
        }
      } else if (selectedModel === "google/nano-banana-pro") {
        // Google Nano Banana Pro via FAL generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for Nano Banana Pro
          const allowedAspect = new Set([
            "match_input_image",
            "1:1",
            "2:3",
            "3:2",
            "3:4",
            "4:3",
            "4:5",
            "5:4",
            "9:16",
            "16:9",
            "21:9",
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : "1:1";

          const promptAdjusted = adjustPromptImageNumbers(
            finalPrompt,
            getCombinedUploadedImages(),
            selectedCharacters,
          );
          const combinedImages = getCombinedUploadedImages();

          const result = await dispatch(
            falGenerate({
              prompt: `${promptAdjusted} [Style: ${style}]`,
              userPrompt: prompt, // Store original user-entered prompt
              model: "google/nano-banana-pro",
              num_images: imageCount,
              aspect_ratio: aspect as any,
              resolution: nanoBananaProResolution,
              uploadedImages: combinedImages.map((u: string) =>
                toAbsoluteFromProxy(u),
              ),
              output_format: outputFormat,
              generationType: "text-to-image",
              isPublic,
            }),
          ).unwrap();

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: result.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: result.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // CRITICAL: Update active generation with backend historyId for queue sync
            if (generationId) {
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: result.images || [],
                    historyId: (result as any)?.historyId || firebaseHistoryId,
                  },
                }),
              );
            }
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing
          setTimeout(() => {
            setLocalGeneratingEntries([]);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId =
            (result as any)?.historyId || firebaseHistoryId;
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleFalError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "Nano Banana Pro",
          });
          return;
        }
      } else if (selectedModel === "google/nano-banana-2") {
        // Google Nano Banana 2 via FAL generate endpoint
        try {
          // FAL nano-banana-2 aspect_ratio enum (auto + ratios; match_input_image → auto)
          const allowedAspect = new Set([
            "auto",
            "21:9",
            "16:9",
            "3:2",
            "4:3",
            "5:4",
            "1:1",
            "4:5",
            "3:4",
            "2:3",
            "9:16",
            "4:1",
            "1:4",
            "8:1",
            "1:8",
          ]);
          let aspect: string = allowedAspect.has(frameSize)
            ? frameSize
            : "auto";
          if (frameSize === "match_input_image") aspect = "auto";

          const promptAdjusted = adjustPromptImageNumbers(
            finalPrompt,
            getCombinedUploadedImages(),
            selectedCharacters,
          );
          const combinedImages = getCombinedUploadedImages();
          const preparedImages = await ensureProviderReadyImageUrls(
            combinedImages,
            getInputImageLimitForModel(selectedModel),
          );

          const result = await dispatch(
            falGenerate({
              prompt: `${promptAdjusted} [Style: ${style}]`,
              userPrompt: prompt,
              model: "google/nano-banana-2",
              num_images: imageCount,
              aspect_ratio: aspect as any,
              resolution: nanoBananaResolution,
              enable_web_search: nanoBananaGoogleSearch,
              thinking_level: nanoBananaThinkingLevel,
              limit_generations: nanoBananaLimitGenerations,
              uploadedImages: preparedImages,
              output_format:
                outputFormat === "jpg" || outputFormat === "jpeg"
                  ? "jpeg"
                  : outputFormat === "webp"
                    ? "webp"
                    : "png",
              generationType:
                preparedImages.length > 0 ? "image-to-image" : "text-to-image",
              isPublic,
              generationId,
            }),
          ).unwrap();

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: result.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: result.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // CRITICAL: Update active generation with backend historyId for queue sync
            if (generationId) {
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: result.images || [],
                    historyId: (result as any)?.historyId || firebaseHistoryId,
                  },
                }),
              );
            }
          } catch {}

          clearInputs();

          // Keep local entries visible for a moment before refreshing
          setTimeout(() => {
            setLocalGeneratingEntries([]);
          }, 1000);

          const resultHistoryId =
            (result as any)?.historyId || firebaseHistoryId;
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleFalError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "Nano Banana 2",
          });
          return;
        }
      } else if (selectedModel === "prunaai/p-image-edit") {
        // P-Image-Edit (Replicate) - requires at least one input image
        const combinedImages = getCombinedUploadedImages().map((u: string) =>
          toAbsoluteFromProxy(u),
        );
        if (combinedImages.length === 0) {
          toast.error(
            "Please upload at least one image for P-Image-Edit (image-to-image)",
          );
          setIsGeneratingLocally(false);
          postGenerationBlockRef.current = false;
          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          return;
        }

        try {
          const promptAdjusted = adjustPromptImageNumbers(
            finalPrompt,
            combinedImages,
            selectedCharacters,
          );
          const allowedAspect = new Set([
            "match_input_image",
            "1:1",
            "16:9",
            "9:16",
            "4:3",
            "3:4",
            "3:2",
            "2:3",
          ]);
          const aspect = allowedAspect.has(frameSize)
            ? frameSize
            : "match_input_image";
          const payload: any = {
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: "prunaai/p-image-edit",
            images: combinedImages,
            aspect_ratio: aspect,
            turbo: true,
            disable_safety_checker: false,
            isPublic,
            num_images: Math.min(Math.max(imageCount, 1), 4),
          };
          const result = await dispatch(replicateGenerate(payload)).unwrap();

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: result.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: result.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (result as any)?.historyId;
              console.log(
                "[queue] P-Image-Edit standalone generation completed, updating active generation:",
                {
                  generationId,
                  historyId: resultHistoryId,
                  imageCount: result.images?.length,
                },
              );
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: result.images || [],
                    historyId: resultHistoryId,
                  },
                }),
              );
            }
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          const resultHistoryId =
            (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log("[queue] Refreshing generation:", {
            resultHistoryId,
            resultHistoryIdFromAPI: (result as any)?.historyId,
            generationId,
          });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error: any) {
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "P-Image-Edit",
          });
          return;
        }
      } else if (selectedModel === "prunaai/p-image") {
        // P-Image combined behavior: T2I when no uploads, I2I via p-image-edit when uploads exist
        const combinedImages = getCombinedUploadedImages().map((u: string) =>
          toAbsoluteFromProxy(u),
        );
        const hasUploads = combinedImages.length > 0;

        if (hasUploads) {
          // Route to p-image-edit with tighter resolution (max 1024, ~1MP)
          try {
            const promptAdjusted = adjustPromptImageNumbers(
              finalPrompt,
              combinedImages,
              selectedCharacters,
            );
            const allowedAspect = new Set([
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3",
            ]);
            const aspect = allowedAspect.has(frameSize) ? frameSize : "1:1";
            const computeEditDims = (ratio: string) => {
              const [wStr, hStr] = ratio.split(":");
              const w = Number(wStr) || 1;
              const h = Number(hStr) || 1;
              const aspectVal = w / h;
              const round16 = (v: number) => Math.round(v / 16) * 16;
              const clamp = (v: number) =>
                Math.max(256, Math.min(1024, round16(v)));
              let width: number;
              let height: number;
              if (aspectVal >= 1) {
                width = 1024;
                height = round16(1024 / aspectVal);
              } else {
                height = 1024;
                width = round16(1024 * aspectVal);
              }
              // ensure ~1MP cap
              while (width * height > 1048576) {
                width = clamp(width - 16);
                height = clamp(Math.round(width / aspectVal));
              }
              return { width: clamp(width), height: clamp(height) };
            };
            const dims = computeEditDims(aspect);

            const payload: any = {
              prompt: `${promptAdjusted} [Style: ${style}]`,
              model: "prunaai/p-image-edit",
              images: combinedImages,
              aspect_ratio: aspect,
              width: dims.width,
              height: dims.height,
              turbo: true,
              disable_safety_checker: false,
              isPublic,
              num_images: Math.min(Math.max(imageCount, 1), 4),
            };

            const result = await dispatch(replicateGenerate(payload)).unwrap();

            try {
              const completedEntry: HistoryEntry = {
                ...tempEntry,
                id: tempEntryId,
                images: result.images || [],
                status: "completed",
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: result.images?.length || imageCount,
              } as any;
              upsertLocalGeneratingEntry(completedEntry);

              // Update active generation with backend historyId for proper sync
              if (generationId) {
                const resultHistoryId = (result as any)?.historyId;
                console.log(
                  "[queue] P-Image-Edit generation completed, updating active generation:",
                  {
                    generationId,
                    historyId: resultHistoryId,
                    imageCount: result.images?.length,
                  },
                );
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      images: result.images || [],
                      historyId: resultHistoryId,
                    },
                  }),
                );
              }
            } catch {}

            // Suppress explicit success toast here — centralized queue manager will show a single success toast
            console.log(
              "[image] Generation completed; success toast suppressed (queue will show a single toast)",
            );
            clearInputs();

            const resultHistoryId =
              (result as any)?.historyId || firebaseHistoryId || generationId;
            console.log("[queue] Refreshing generation:", {
              resultHistoryId,
              resultHistoryIdFromAPI: (result as any)?.historyId,
              generationId,
            });
            if (resultHistoryId) {
              await refreshSingleGeneration(resultHistoryId);
            } else {
              await refreshHistory();
            }

            if (transactionId) {
              await handleGenerationSuccess(transactionId);
            }
          } catch (error: any) {
            setLocalGeneratingEntries([]);
            setIsGeneratingLocally(false);
            postGenerationBlockRef.current = false;

            if (transactionId) {
              await handleGenerationFailure(transactionId);
            }
            const errorMessage =
              error?.response?.data?.message ||
              (error instanceof Error
                ? error.message
                : "Failed to generate images with P-Image");
            toast.error(errorMessage, { duration: 5000 });
            return;
          }
        } else {
          // Standard p-image T2I flow (max edge 1440)
          try {
            const promptAdjusted = adjustPromptImageNumbers(
              finalPrompt,
              combinedImages,
              selectedCharacters,
            );
            const allowedAspect = new Set([
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3",
              "custom",
            ]);
            const aspect = allowedAspect.has(frameSize) ? frameSize : "16:9";
            const computePImageDims = (ratio: string) => {
              const [wStr, hStr] = ratio.split(":");
              const w = Number(wStr) || 1;
              const h = Number(hStr) || 1;
              const aspectVal = w / h;
              const round16 = (v: number) => Math.round(v / 16) * 16;
              const clamp = (v: number) =>
                Math.max(256, Math.min(1440, round16(v)));
              let width: number;
              let height: number;
              if (aspectVal >= 1) {
                width = 1440;
                height = round16(1440 / aspectVal);
              } else {
                height = 1440;
                width = round16(1440 * aspectVal);
              }
              return { width: clamp(width), height: clamp(height) };
            };
            const dims = computePImageDims(
              aspect === "custom" ? "1:1" : frameSize || "16:9",
            );
            const payload: any = {
              prompt: `${promptAdjusted} [Style: ${style}]`,
              model: "prunaai/p-image",
              aspect_ratio: aspect,
              width: Math.min(1440, dims.width),
              height: Math.min(1440, dims.height),
              prompt_upsampling: false,
              disable_safety_checker: false,
              isPublic,
              num_images: Math.min(Math.max(imageCount, 1), 4),
            };
            if (aspect === "custom") {
              payload.width = 1440;
              payload.height = 1440;
            }

            const result = await dispatch(replicateGenerate(payload)).unwrap();

            try {
              const completedEntry: HistoryEntry = {
                ...tempEntry,
                id: tempEntryId,
                images: result.images || [],
                status: "completed",
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: result.images?.length || imageCount,
              } as any;
              upsertLocalGeneratingEntry(completedEntry);

              // Update active generation with backend historyId for proper sync
              if (generationId) {
                const resultHistoryId = (result as any)?.historyId;
                console.log(
                  "[queue] P-Image T2I generation completed, updating active generation:",
                  {
                    generationId,
                    historyId: resultHistoryId,
                    imageCount: result.images?.length,
                  },
                );
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      images: result.images || [],
                      historyId: resultHistoryId,
                    },
                  }),
                );
              }
            } catch {}

            // Suppress explicit success toast here — centralized queue manager will show a single success toast
            console.log(
              "[image] Generation completed; success toast suppressed (queue will show a single toast)",
            );
            clearInputs();

            const resultHistoryId =
              (result as any)?.historyId || firebaseHistoryId || generationId;
            console.log("[queue] Refreshing generation:", {
              resultHistoryId,
              resultHistoryIdFromAPI: (result as any)?.historyId,
              generationId,
            });
            if (resultHistoryId) {
              await refreshSingleGeneration(resultHistoryId);
            } else {
              await refreshHistory();
            }

            if (transactionId) {
              await handleGenerationSuccess(transactionId);
            }
          } catch (error: any) {
            setLocalGeneratingEntries([]);
            setIsGeneratingLocally(false);
            postGenerationBlockRef.current = false;

            if (transactionId) {
              await handleGenerationFailure(transactionId);
            }
            const errorMessage =
              error?.response?.data?.message ||
              (error instanceof Error
                ? error.message
                : "Failed to generate images with P-Image");
            toast.error(errorMessage, { duration: 5000 });
            return;
          }
        }
      } else if (selectedModel === "new-turbo-model") {
        // New Turbo Model via replicate generate endpoint - single request with num_images
        try {
          console.log("[DEBUG handleGenerate] new-turbo-model branch started");
          const promptAdjusted = adjustPromptImageNumbers(
            finalPrompt,
            getCombinedUploadedImages(),
            selectedCharacters,
          );

          // Calculate dimensions based on frame size, keeping under 1MP and divisible by 16
          console.log(
            "[DEBUG handleGenerate] Calculating dimensions for frameSize:",
            frameSize,
          );
          const dimensions = convertFrameSizeToZTurboDimensions(
            frameSize || "1:1",
          );
          console.log("[DEBUG handleGenerate] Dimensions:", dimensions);
          const width = dimensions.width;
          const height = dimensions.height;

          // Send single request with num_images parameter (backend handles multiple calls internally)
          const payload: any = {
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: "new-turbo-model",
            width: width,
            height: height,
            num_inference_steps: 8, // Schema default
            guidance_scale: 0, // Schema default (should be 0 for Turbo models)
            output_format: zTurboOutputFormat, // Use selected output format
            output_quality: 80, // Schema default
            num_images: Math.min(imageCount, 4), // Cap at 4 like other models
          };

          console.log(
            "[DEBUG handleGenerate] Dispatching replicateGenerate with payload:",
            payload,
          );
          const result = await dispatch(replicateGenerate(payload)).unwrap();
          console.log(
            "[DEBUG handleGenerate] replicateGenerate result:",
            result,
          );

          // All images should be in the result.images array from single request
          const allImages = result.images || [];

          // Keep status as 'generating' until images are loaded and visible
          // This ensures the loading animation stays until images are actually displayed
          try {
            const entryWithImages: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: allImages,
              status: "generating", // Keep as 'generating' to show loading animation
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: allImages.length,
            } as any;
            upsertLocalGeneratingEntry(entryWithImages);

            // Wait for images to load before marking as completed
            // This ensures the loading animation stays visible until images are rendered
            if (allImages.length > 0) {
              // Wait a bit for React to render the images
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Wait for all images to actually load in the browser
              const imageLoadPromises = allImages.map((img: any) => {
                return new Promise<void>((resolve: () => void) => {
                  const imageUrl =
                    img?.thumbnailUrl ||
                    img?.avifUrl ||
                    img?.url ||
                    img?.originalUrl;
                  if (!imageUrl) {
                    resolve();
                    return;
                  }

                  const imgElement = document.createElement("img");
                  imgElement.onload = () => resolve();
                  imgElement.onerror = () => resolve(); // Resolve even on error to not block
                  imgElement.src = imageUrl;

                  // Timeout after 5 seconds to prevent infinite waiting
                  setTimeout(() => resolve(), 5000);
                });
              });

              await Promise.all(imageLoadPromises);

              // Additional small delay to ensure images are rendered in DOM
              await new Promise((resolve) => setTimeout(resolve, 300));
            }

            // Now mark as completed after images are loaded
            const completedEntry: HistoryEntry = {
              ...entryWithImages,
              status: "completed",
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (result as any)?.historyId;
              console.log(
                "[queue] New Turbo Model generation completed, updating active generation:",
                {
                  generationId,
                  historyId: resultHistoryId,
                  imageCount: allImages.length,
                },
              );
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: "completed",
                    images: allImages,
                    historyId: resultHistoryId,
                  },
                }),
              );
            }
          } catch {}

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Refresh the history entry that contains all images
          const resultHistoryId = (result as any)?.historyId;
          console.log("[queue] Refreshing generation:", {
            resultHistoryId,
            generationId,
          });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }

          // Reset local generation state on success
          setIsGeneratingLocally(false);
        } catch (error: any) {
          console.error("New Turbo Model generation error:", error);
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: "New Turbo Model",
          });
          return;
        }
      } else {
        // Use regular BFL generation OR local models
        const localModels = [
          // Previously integrated local models
          "flux-schnell",
          "stable-medium",
          "stable-large",
          "stable-turbo",
          "stable-xl",
          // Newly added local models
          "flux-krea",
          "playground",
        ];
        const isLocalImageModel = localModels.includes(selectedModel);

        if (isLocalImageModel) {
          // Create Firebase history entry for local models (generating)
          try {
            firebaseHistoryId = await saveHistoryEntry({
              prompt: prompt,
              model: selectedModel,
              generationType: "text-to-image",
              images: [],
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount,
              status: "generating",
              frameSize,
              style,
            });
            // Point the temporary loading entry to the Firebase document id
            // dispatch(updateHistoryEntry({ id: loadingEntry.id, updates: { id: firebaseHistoryId } }));
          } catch (e) {
            console.error(
              "Failed to create Firebase history for local model:",
              e,
            );
          }

          // Call local image generation proxy (server uploads to Firebase)
          const promptAdjusted = adjustPromptImageNumbers(
            finalPrompt,
            getCombinedUploadedImages(),
            selectedCharacters,
          );
          const combinedImages = getCombinedUploadedImages();
          const result = await dispatch(
            bflGenerate({
              prompt: `${promptAdjusted} [Style: ${style}]`,
              model: selectedModel,
              n: imageCount,
              frameSize,
              style,
              styleVersion: indianStyleVersion,
              isPublic,
              uploadedImages: combinedImages.map((u: string) =>
                toAbsoluteFromProxy(u),
              ),
            } as any),
          ).unwrap();

          // History is persisted by backend; no local completed entry needed
          // Ensure the parallel queue entry transitions to completed (this thunk doesn't touch generationSlice).
          if (generationId) {
            dispatch(
              updateActiveGeneration({
                id: generationId,
                updates: {
                  status: "completed",
                  images: (result as any)?.images || [],
                  historyId: (result as any)?.historyId,
                },
              }),
            );
          }

          // Update the loading entry with completed data
          // dispatch(
          //   updateHistoryEntry({
          //     id: firebaseHistoryId || loadingEntry.id,
          //     updates: completedEntry,
          //   })
          // );

          // Server already finalized Firebase when historyId is provided

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();
          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId =
            (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log("[queue] Refreshing generation:", {
            resultHistoryId,
            resultHistoryIdFromAPI: (result as any)?.historyId,
            generationId,
          });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } else {
          // Use regular BFL generation
          // Check if this is a flux-pro model that needs width/height conversion
          // Note: flux-pro, flux-pro-1.1, and flux-pro-1.1-ultra use width/height
          // flux-dev uses frameSize conversion (handled in API route)
          const isFluxProModel =
            selectedModel === "flux-pro-1.1" ||
            selectedModel === "flux-pro-1.1-ultra" ||
            selectedModel === "flux-pro";

          const promptAdjusted = adjustPromptImageNumbers(
            finalPrompt,
            getCombinedUploadedImages(),
            selectedCharacters,
          );
          const combinedImages = getCombinedUploadedImages();
          let generationPayload: any = {
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: selectedModel,
            imageCount,
            frameSize,
            style,
            styleVersion: indianStyleVersion,
            generationType: "text-to-image",
            uploadedImages: combinedImages,
            generationId,
          };

          // For GPT Image models, add quality and output_format parameters
          if (
            selectedModel === "openai/gpt-image-1.5" ||
            selectedModel === "openai/gpt-image-2"
          ) {
            generationPayload.quality = gptImage15Quality;
            // Map 'jpg' to 'jpeg' for API (GPT Image models use 'jpeg' in schema)
            generationPayload.output_format =
              gptImage15OutputFormat === "jpg"
                ? "jpeg"
                : gptImage15OutputFormat;
          }

          // GPT Image 2 on FAL supports image_size enums in addition to legacy aspect_ratio.
          if (selectedModel === "openai/gpt-image-2") {
            const gptImage2SizeMap: Record<string, string> = {
              auto: "auto",
              default: "default",
              custom: "custom",
              square_hd: "square_hd",
              "1:1": "square",
              "3:4": "portrait_4_3",
              "9:16": "portrait_16_9",
              "4:3": "landscape_4_3",
              "16:9": "landscape_16_9",
            };
            const mappedImageSize = gptImage2SizeMap[frameSize];
            if (mappedImageSize) {
              generationPayload.image_size = mappedImageSize;
            }
            // Keep aspect_ratio for compatibility with existing backend/history logic.
            const legacyAspectRatios = new Set([
              "1:1",
              "3:4",
              "9:16",
              "4:3",
              "16:9",
            ]);
            if (legacyAspectRatios.has(frameSize)) {
              generationPayload.aspect_ratio = frameSize;
            } else if (frameSize === "custom") {
              generationPayload.aspect_ratio = "custom";
              generationPayload.width = Math.max(
                64,
                Math.min(4096, Number(gptImage2CustomWidth) || 1024),
              );
              generationPayload.height = Math.max(
                64,
                Math.min(4096, Number(gptImage2CustomHeight) || 1024),
              );
            }
          }

          // For flux-pro models, convert frameSize to width/height dimensions (but keep frameSize for history)
          if (isFluxProModel) {
            const dimensions = convertFrameSizeToFluxProDimensions(frameSize);
            generationPayload.width = dimensions.width;
            generationPayload.height = dimensions.height;
            console.log(
              `Flux Pro model detected: ${selectedModel}, using dimensions:`,
              dimensions,
            );
            console.log(
              `Original frameSize: ${frameSize}, converted to: ${dimensions.width}x${dimensions.height}`,
            );
            console.log(
              `Model type: ${selectedModel} - using width/height parameters for BFL API`,
            );
          }

          const isQwenImageEdit =
            selectedModel === "qwen-image-edit-2511" ||
            selectedModel === "qwen-image-edit" ||
            selectedModel === "qwen-image-edit-2512";

          // Qwen image-edit specific parameters
          if (isQwenImageEdit) {
            generationPayload.aspect_ratio = frameSize;
            // FileTypeDropdown stores 'jpeg' but Qwen schema uses 'jpg'
            generationPayload.output_format =
              outputFormat === "jpeg" ? "jpg" : outputFormat;
            if (selectedModel === "qwen-image-edit-2512") {
              generationPayload.resolution = qwenResolution; // '1K' or '2K'

              // Explicit width/height mapping for QWEN 2512
              const QWEN_MAP: Record<
                string,
                Record<string, { w: number; h: number }>
              > = {
                "1K": {
                  "1:1": { w: 1024, h: 1024 },
                  "16:9": { w: 1024, h: 576 },
                  "9:16": { w: 576, h: 1024 },
                  "4:3": { w: 1024, h: 768 },
                  "3:4": { w: 768, h: 1024 },
                  "3:2": { w: 1024, h: 683 },
                  "2:3": { w: 683, h: 1024 },
                },
                "2K": {
                  "1:1": { w: 2048, h: 2048 },
                  "16:9": { w: 2048, h: 1152 },
                  "9:16": { w: 1152, h: 2048 },
                  "4:3": { w: 2048, h: 1536 },
                  "3:4": { w: 1536, h: 2048 },
                  "3:2": { w: 2048, h: 1365 },
                  "2:3": { w: 1365, h: 2048 },
                },
              };

              if (QWEN_MAP[qwenResolution]?.[frameSize]) {
                const dims = QWEN_MAP[qwenResolution][frameSize];
                generationPayload.width = dims.w;
                generationPayload.height = dims.h;
                generationPayload.aspect_ratio = "custom";
              }
            }
          }

          if (selectedModel === "seedream-v4") {
            generationPayload.size = seedreamSize;
            generationPayload.aspect_ratio = frameSize;
            if (seedreamSize === "custom") {
              generationPayload.width = seedreamWidth;
              generationPayload.height = seedreamHeight;
            }
          }
          if (selectedModel === "seedream-5-lite") {
            generationPayload.size = seedream5LiteResolution;
            generationPayload.aspect_ratio = frameSize;
          }

          // Both Seedream v4 and v5-lite use image_input for image-to-image
          if (
            selectedModel === "seedream-v4" ||
            selectedModel === "seedream-5-lite"
          ) {
            if (combinedImages && combinedImages.length > 0) {
              const seedreamImageInput = await ensureProviderReadyImageUrls(
                combinedImages,
                14,
              );
              generationPayload.image_input = seedreamImageInput;
            }
          }

          console.log(
            "[DEBUG handleGenerate] Dispatching generateImages with payload:",
            generationPayload,
          );
          const result = await dispatch(
            generateImages(generationPayload),
          ).unwrap();
          console.log("[DEBUG handleGenerate] generateImages SUCCESS:", result);

          // Persist source uploads for Qwen image-edit so the Preview Modal can show the input image(s)
          try {
            const resultHistoryId =
              (result as any)?.historyId || firebaseHistoryId || generationId;
            if (
              isQwenImageEdit &&
              resultHistoryId &&
              Array.isArray(combinedImages) &&
              combinedImages.length > 0
            ) {
              const inputImages = combinedImages.map(
                (u: string, idx: number) => {
                  const p = toZataPath(u);
                  if (p)
                    return {
                      id: `input-${idx + 1}`,
                      storagePath: p,
                      url: toDirectUrl(p),
                    };
                  return { id: `input-${idx + 1}`, url: u };
                },
              );
              await updateFirebaseHistory(resultHistoryId, { inputImages });
            }
          } catch {
            // best-effort only
          }

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: result.images || [],
              status: "completed",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: result.images?.length || imageCount,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);
          } catch {}

          // History is persisted by backend; no local completed entry needed

          // Update the loading entry with completed data
          // dispatch(
          //   updateHistoryEntry({
          //     id: loadingEntry.id,
          //     updates: {
          //       ...completedEntry,
          //       frameSize: isFluxProModel ? `${generationPayload.width}x${generationPayload.height}` : frameSize,
          //     },
          //   })
          // );

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();
          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId =
            (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log("[queue] Refreshing generation:", {
            resultHistoryId,
            resultHistoryIdFromAPI: (result as any)?.historyId,
            generationId,
          });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
          await refreshCredits();
        }

        // Reset local generation state on success
        setIsGeneratingLocally(false);
      }
    } catch (error) {
      console.error("Error generating images:", error);

      // Rollback optimistic turbo counter if it was incremented
      const isFreeTurboModel = selectedModel === 'z-image-turbo' || selectedModel === 'new-turbo-model';
      const isFreePlan = (planCode?.toLowerCase() || 'free') === 'free';
      if (isFreeTurboModel && isFreePlan) {
        dispatch(decrementFreeTurboUsedOptimistic(imageCount));
      }

      // Check if this is a FAL or Replicate error (has structured error details)
      const falErrorDetails = extractFalErrorDetails(error);
      const replicateErrorDetails = extractReplicateErrorDetails(error);
      const isFalError = falErrorDetails !== null;
      const isReplicateError = replicateErrorDetails !== null;

      // Get error message
      const errorMessage =
        falErrorDetails?.message ||
        replicateErrorDetails?.message ||
        (error &&
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : undefined) ||
        (error instanceof Error ? error.message : "Failed to generate images");

      // Clear ONLY this generation's local entry on error (don't wipe other in-flight jobs)
      removeLocalGeneratingEntry(generationId || tempEntryId);
      setIsGeneratingLocally(false);
      postGenerationBlockRef.current = false;

      // If we have a Firebase ID, also update it there
      if (firebaseHistoryId) {
        try {
          await updateFirebaseHistory(firebaseHistoryId, {
            status: "failed",
            error: errorMessage,
          });
          console.log(
            "✅ Firebase entry updated to failed status due to error",
          );
        } catch (firebaseError) {
          console.error(
            "❌ Failed to update Firebase entry to failed status:",
            firebaseError,
          );
        }
      }

      // Handle credit failure
      if (transactionId) {
        await handleGenerationFailure(transactionId);
      }

      // Show error notification (skip if a Runway base_resp toast already shown)
      if (!runwayBaseRespToastShownRef.current) {
        if (isFalError) {
          // Use structured FAL error toast
          await showFalErrorToast(error, errorMessage);
        } else if (isReplicateError) {
          // Use structured Replicate error toast
          await showReplicateErrorToast(error, errorMessage);
        } else {
          // Use simple error toast for other errors
          toast.error(errorMessage);
        }
      }

      // Update active generation status on failure
      if (generationId) {
        dispatch(
          updateActiveGeneration({
            id: generationId,
            updates: {
              status: "failed",
              error: errorMessage,
            },
          }),
        );
      }

      // Reset local generation state immediately on error
      setIsGeneratingLocally(false);
      postGenerationBlockRef.current = false;
    } finally {
      // Release pagination block after short cooldown so compressed refreshes don't trigger immediate loadMore
      // Note: isGeneratingLocally and localGeneratingEntries are reset in catch block, so we don't need to reset here
      setTimeout(() => {
        postGenerationBlockRef.current = false;
      }, 2500);
      // Reset the base_resp toast guard for next run
      runwayBaseRespToastShownRef.current = false;
    }
  };
}
