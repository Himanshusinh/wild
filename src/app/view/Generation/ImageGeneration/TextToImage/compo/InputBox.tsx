"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { HistoryEntry } from "@/types/history";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { shallowEqual } from "react-redux";
import {
  setPrompt,
  generateImages,
  generateRunwayImages,
  generateMiniMaxImages,
  setUploadedImages,
  setSelectedModel,
} from "@/store/slices/generationSlice";
import { toggleDropdown, addNotification } from "@/store/slices/uiSlice";
import {
  addHistoryEntry,
  updateHistoryEntry,
  loadMoreHistory,
  loadHistory,
} from "@/store/slices/historySlice";
import { saveHistoryEntry, updateHistoryEntry as updateFirebaseHistory } from '@/lib/historyService';

// Import the new components
import ModelsDropdown from "./ModelsDropdown";
import ImageCountDropdown from "./ImageCountDropdown";
import FrameSizeDropdown from "./FrameSizeDropdown";
import StyleSelector from "./StyleSelector";
import ImagePreviewModal from "./ImagePreviewModal";
import { waitForRunwayCompletion } from "@/lib/runwayService";
import { uploadGeneratedImage } from "@/lib/imageUpload";
import { Button } from "@/components/ui/Button";

const InputBox = () => {
  const dispatch = useAppDispatch();
  const [preview, setPreview] = useState<{
    entry: HistoryEntry;
    image: any;
  } | null>(null);
  const inputEl = useRef<HTMLTextAreaElement>(null);

  // Helper function to get clean prompt without style
  const getCleanPrompt = (promptText: string): string => {
    return promptText.replace(/\[\s*Style:\s*[^\]]+\]/i, "").trim();
  };

  // Helper function to convert frameSize to Runway ratio format
  const convertFrameSizeToRunwayRatio = (frameSize: string): string => {
    const ratioMap: { [key: string]: string } = {
      "1:1": "1024:1024",
      "16:9": "1920:1080",
      "9:16": "1080:1920",
      "4:3": "1360:768",
      "3:4": "768:1360",
      "3:2": "1440:1080",
      "2:3": "1080:1440",
      "21:9": "1808:768",
      "9:21": "768:1808",
      "16:10": "1680:720",
      "10:16": "720:1680",
    };

    return ratioMap[frameSize] || "1024:1024"; // Default to square if no match
  };

  // Helper function to convert frameSize to flux-pro-1.1 dimensions
  const convertFrameSizeToFluxProDimensions = (frameSize: string): { width: number; height: number } => {
    const dimensionMap: { [key: string]: { width: number; height: number } } = {
      "1:1": { width: 1024, height: 1024 },
      "16:9": { width: 1024, height: 576 }, // 1024 * (9/16) = 576
      "9:16": { width: 576, height: 1024 }, // 1024 * (16/9) = 576
      "4:3": { width: 1024, height: 768 }, // 1024 * (3/4) = 768
      "3:4": { width: 768, height: 1024 }, // 1024 * (4/3) = 768
      "3:2": { width: 1024, height: 672 }, // 1024 * (2/3) = 682, rounded to 672 (multiple of 32)
      "2:3": { width: 672, height: 1008 }, // 672 * (3/2) = 1008
      "21:9": { width: 1024, height: 438 }, // 1024 * (9/21) = 438, rounded to 448 (multiple of 32)
      "9:21": { width: 448, height: 1024 }, // 448 * (21/9) = 1024
      "16:10": { width: 1024, height: 640 }, // 1024 * (10/16) = 640
      "10:16": { width: 640, height: 1024 }, // 640 * (16/10) = 1024
    };

    // Ensure dimensions are within API limits and multiples of 32
    const dimensions = dimensionMap[frameSize] || { width: 1024, height: 1024 };
    
    // Clamp to API limits: 256 <= x <= 1440, must be multiple of 32
    const clampToLimits = (value: number): number => {
      const clamped = Math.max(256, Math.min(1440, Math.round(value / 32) * 32));
      console.log(`Dimension ${value} clamped to ${clamped} (multiple of 32, within 256-1440 range)`);
      return clamped;
    };

    const result = {
      width: clampToLimits(dimensions.width),
      height: clampToLimits(dimensions.height)
    };

    console.log(`Frame size ${frameSize} converted to dimensions:`, result);
    console.log(`API compliance check: width=${result.width} (${result.width % 32 === 0 ? '✓ multiple of 32' : '✗ not multiple of 32'}), height=${result.height} (${result.height % 32 === 0 ? '✓ multiple of 32' : '✗ not multiple of 32'})`);
    console.log(`Range check: width=${result.width} (${result.width >= 256 && result.width <= 1440 ? '✓ in range 256-1440' : '✗ out of range'}), height=${result.height} (${result.height >= 256 && result.height <= 1440 ? '✓ in range 256-1440' : '✗ out of range'})`);
    return result;
  };
  const downloadImage = async (url: string) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "generated-image.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      // Fallback to direct download
      const a = document.createElement("a");
      a.href = url;
      a.download = "generated-image.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Redux state
  const prompt = useAppSelector((state: any) => state.generation?.prompt || "");
  const selectedModel = useAppSelector(
    (state: any) => state.generation?.selectedModel || "flux-dev"
  );
  const imageCount = useAppSelector(
    (state: any) => state.generation?.imageCount || 1
  );
  const frameSize = useAppSelector(
    (state: any) => state.generation?.frameSize || "1:1"
  );
  const style = useAppSelector(
    (state: any) => state.generation?.style || "realistic"
  );
  const isGenerating = useAppSelector(
    (state: any) => state.generation?.isGenerating || false
  );
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector(
    (state: any) => state.ui?.activeDropdown
  );
  const loading = useAppSelector((state: any) => state.history?.loading || false);
  const hasMore = useAppSelector((state: any) => state.history?.hasMore || false);
  const [page, setPage] = useState(1);

  // Memoize the filtered entries to prevent unnecessary rerenders
  const historyEntries = useAppSelector(
    (state: any) => {
      const allEntries = state.history?.entries || [];
      // Filter for text-to-image only - same as global history
      const filteredEntries = allEntries.filter((entry: any) => entry.generationType === 'text-to-image');
      console.log('🖼️ Image Generation - All entries:', allEntries.length);
      console.log('🖼️ Image Generation - Filtered entries:', filteredEntries.length);
      console.log('🖼️ Image Generation - Current page:', page);
      console.log('🖼️ Image Generation - Has more:', hasMore);
      return filteredEntries;
    },
    // Use shallowEqual to prevent unnecessary rerenders
    shallowEqual
  );
  const theme = useAppSelector((state: any) => state.ui?.theme || "dark");
  const uploadedImages = useAppSelector(
    (state: any) => state.generation?.uploadedImages || []
  );

  // Function to clear input after successful generation
  const clearInputs = () => {
    dispatch(setPrompt(""));
    setUploadedImages([]);
    // Reset file input
    if (inputEl.current) {
      inputEl.current.value = "";
    }
  };

  // Function to auto-adjust textarea height
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

  // Auto-adjust height when prompt changes
  useEffect(() => {
    if (inputEl.current) {
      adjustTextareaHeight(inputEl.current);
    }
  }, [prompt]);

 

  // Handle scroll to load more history
  useEffect(() => {
    const handleScroll = () => {
      // Check if we're near the bottom of the history container
      const historyContainer = document.querySelector('.overflow-y-auto');
      if (historyContainer) {
        const scrollTop = historyContainer.scrollTop;
        const scrollHeight = historyContainer.scrollHeight;
        const clientHeight = historyContainer.clientHeight;
        const threshold = scrollHeight - clientHeight - 100;
        
        console.log('🖼️ Image Generation - Scroll Debug:', {
          scrollTop,
          scrollHeight,
          clientHeight,
          threshold,
          hasMore,
          loading,
          page
        });
        
        if (scrollTop >= threshold) {
          if (hasMore && !loading) {
            console.log('🖼️ Image Generation - Scroll threshold reached, loading more...');
            const nextPage = page + 1;
            setPage(nextPage);
            console.log('🖼️ Image Generation - Loading page:', nextPage);
            dispatch(loadMoreHistory({ 
              filters: { generationType: 'text-to-image' }, 
              paginationParams: { limit: 10 } 
            }));
          } else {
            console.log('🖼️ Image Generation - Scroll threshold reached but:', {
              hasMore,
              loading,
              reason: !hasMore ? 'No more entries' : 'Currently loading'
            });
          }
        }
      }
    };

    console.log('🖼️ Image Generation - Scroll event listener added');
    // Listen for scroll on the history container specifically
    const historyContainer = document.querySelector('.overflow-y-auto');
    if (historyContainer) {
      historyContainer.addEventListener('scroll', handleScroll);
      return () => {
        console.log('🖼️ Image Generation - Scroll event listener removed');
        historyContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [hasMore, loading, page, dispatch]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Create a loading entry immediately to show loading frames
    const loadingEntry: HistoryEntry = {
      id: `loading-${Date.now()}`,
      prompt: prompt,
      model: selectedModel,
      generationType: "text-to-image",
      images: Array.from({ length: imageCount }, (_, index) => ({
        id: `loading-${index}`,
        url: "",
        originalUrl: "",
      })),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: imageCount,
      status: "generating",
      frameSize,
      style,
    };

    // Add loading entry to show frames immediately
    dispatch(addHistoryEntry(loadingEntry));

    // Declare firebaseHistoryId at function level for error handling
    let firebaseHistoryId: string | undefined;

    try {
      // Check if it's a Runway model
      const isRunwayModel = selectedModel.startsWith("gen4_image");
      // Check if it's a MiniMax model
      const isMiniMaxModel = selectedModel === "minimax-image-01";

      if (isRunwayModel) {
        console.log('🚀 ENTERING RUNWAY GENERATION SECTION');
        console.log('=== STARTING RUNWAY GENERATION ===');
        console.log('Selected model:', selectedModel);
        console.log('Image count:', imageCount);
        console.log('Frame size:', frameSize);
        console.log('Style:', style);
        console.log('Uploaded images count:', uploadedImages.length);
        
        // 🔥 FIREBASE SAVE FLOW FOR RUNWAY MODELS:
        // 1. Create initial Firebase entry with 'generating' status
        // 2. Update Firebase with progress as images complete
        // 3. Update Firebase with final 'completed' or 'failed' status
        // 4. All updates include images, metadata, and status
        // 5. Error handling updates both Redux and Firebase
        // 6. Firebase ID is used consistently throughout the process
        
        try {
          firebaseHistoryId = await saveHistoryEntry({
            prompt: prompt,
            model: selectedModel,
            generationType: "text-to-image",
            images: [],
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            imageCount: imageCount,
            status: 'generating',
            frameSize,
            style
          });
          console.log('✅ Firebase history entry created with ID:', firebaseHistoryId);
          console.log('🔗 Firebase document path: generationHistory/' + firebaseHistoryId);
          
          // Update the local entry with the Firebase ID
          dispatch(updateHistoryEntry({
            id: loadingEntry.id,
            updates: { id: firebaseHistoryId }
          }));
          
          // Don't modify the loadingEntry object - use firebaseHistoryId directly
          console.log('Using Firebase ID for all operations:', firebaseHistoryId);
        } catch (firebaseError) {
          console.error('❌ Failed to save to Firebase:', firebaseError);
          console.error('Firebase error details:', {
            message: firebaseError instanceof Error ? firebaseError.message : 'Unknown error',
            stack: firebaseError instanceof Error ? firebaseError.stack : 'No stack trace'
          });
          dispatch(
            addNotification({
              type: "error",
              message: "Failed to save generation to history",
            })
          );
          return;
        }
        
        // Validate gen4_image_turbo requires at least one reference image
        console.log('🔍 ABOUT TO START VALIDATION');
        console.log('=== VALIDATING RUNWAY REQUIREMENTS ===');
        console.log('Selected model:', selectedModel);
        console.log('Uploaded images count:', uploadedImages.length);
        console.log('Uploaded images:', uploadedImages);
        console.log('Is gen4_image_turbo:', selectedModel === "gen4_image_turbo");
        console.log('Has uploaded images:', uploadedImages.length > 0);
        console.log('Validation condition:', selectedModel === "gen4_image_turbo" && uploadedImages.length === 0);
        
        if (
          selectedModel === "gen4_image_turbo" &&
          uploadedImages.length === 0
        ) {
          console.log('❌ VALIDATION FAILED: gen4_image_turbo requires reference image');
          console.log('Stopping generation process...');
          
          // Update Firebase entry to failed status
          try {
            await updateFirebaseHistory(firebaseHistoryId!, {
              status: "failed",
              error: "gen4_image_turbo requires at least one reference image"
            });
            console.log('✅ Firebase entry updated to failed status');
          } catch (firebaseError) {
            console.error('❌ Failed to update Firebase entry:', firebaseError);
          }
          
          // Remove the loading entry since validation failed
          dispatch(
            updateHistoryEntry({
              id: firebaseHistoryId!,
              updates: {
                status: "failed",
                error: "gen4_image_turbo requires at least one reference image"
              },
            })
          );
          
          dispatch(
            addNotification({
              type: "error",
              message: "gen4_image_turbo requires at least one reference image",
            })
          );
          return;
        }
        
        console.log('✅ VALIDATION PASSED: Proceeding with Runway generation');
        console.log('🎯 VALIDATION COMPLETED - MOVING TO NEXT STEP');
        
        // Additional safety check
        if (selectedModel === "gen4_image_turbo" && uploadedImages.length === 0) {
          console.error('🚨 SAFETY CHECK FAILED: This should not happen!');
          throw new Error('Validation bypassed unexpectedly');
        }

        // Convert frameSize to Runway ratio format
        const ratio = convertFrameSizeToRunwayRatio(frameSize);
        console.log('Converted frame size to Runway ratio:', ratio);

        // For Runway, support multiple images by creating parallel tasks
        const totalToGenerate = Math.min(imageCount, 4);
        let currentImages = [...loadingEntry.images];
        let completedCount = 0;
        let anyFailures = false;

        console.log('Total images to generate:', totalToGenerate);
        console.log('Initial currentImages array:', currentImages);

        // Update initial progress
        dispatch(
          updateHistoryEntry({
            id: firebaseHistoryId!,
            updates: {
              generationProgress: {
                current: 0,
                total: totalToGenerate * 100,
                status: `Starting Runway generation for ${totalToGenerate} image(s)...`,
              },
            },
          })
        );

        // Create all generation tasks in parallel
        const generationPromises = Array.from({ length: totalToGenerate }, async (_, index) => {
          try {
            console.log(`Starting Runway generation for image ${index + 1}/${totalToGenerate}`);
            
            // Make direct API call to avoid creating multiple history entries
            console.log(`=== MAKING RUNWAY API CALL FOR IMAGE ${index + 1} ===`);
            console.log('API payload:', {
              promptText: `${prompt} [Style: ${style}]`,
              model: selectedModel,
              ratio,
              generationType: "text-to-image",
              uploadedImagesCount: uploadedImages.length,
              style,
              existingHistoryId: firebaseHistoryId
            });
            
            const runwayResponse = await fetch('/api/runway', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                promptText: `${prompt} [Style: ${style}]`,
                model: selectedModel,
                ratio,
                generationType: "text-to-image",
                uploadedImages,
                style,
                existingHistoryId: firebaseHistoryId // Pass existing history ID
              }),
            });

            console.log(`Runway API response status: ${runwayResponse.status}`);
            console.log(`Runway API response headers:`, Object.fromEntries(runwayResponse.headers.entries()));

            if (!runwayResponse.ok) {
              const errorData = await runwayResponse.json();
              console.error(`Runway API error for image ${index + 1}:`, errorData);
              throw new Error(errorData.error || 'Runway API request failed');
            }

            const result = await runwayResponse.json();
            console.log(`Runway API call completed for image ${index + 1}, taskId:`, result.taskId);

            // Poll for completion
            const finalStatus = await waitForRunwayCompletion(
              result.taskId,
              (progress, status) => {
                console.log(`Runway progress for image ${index + 1}:`, progress, status);
                // Update progress for this specific image
                const currentProgress = Math.round(progress * 100);
                const totalProgress = completedCount * 100 + currentProgress;
                
                dispatch(
                  updateHistoryEntry({
                    id: firebaseHistoryId!,
                    updates: {
                      generationProgress: {
                        current: totalProgress,
                        total: totalToGenerate * 100,
                        status: `Runway ${index + 1}/${totalToGenerate}: ${status}`,
                      },
                    },
                  })
                );
                
                // Note: Firebase progress updates will happen after image completion
                // to avoid async issues in the progress callback
              }
            );

            console.log(`Runway completion for image ${index + 1}:`, finalStatus);

            // Process the completed image
            const imageUrl = finalStatus.output && finalStatus.output.length > 0 ? finalStatus.output[0] : '';
            if (imageUrl) {
              console.log(`Image ${index + 1} completed with URL:`, imageUrl);
              
              // Create a new array copy instead of modifying the existing one
              const newImages = [...currentImages];
              newImages[index] = {
                id: `${result.taskId}-${index}`,
                url: imageUrl,
                originalUrl: imageUrl
              };
              
              // Update the reference to use the new array
              currentImages = newImages;
              completedCount++;
              
              console.log(`Updated currentImages array:`, currentImages);
              console.log(`Completed count:`, completedCount);
              
              // Upload the image to Firebase Storage
              console.log(`Uploading image ${index + 1} to Firebase Storage...`);
              try {
                const uploadedImage = await uploadGeneratedImage(newImages[index]);
                console.log(`Image ${index + 1} uploaded to Firebase:`, uploadedImage);
                
                // Update the image with Firebase URL
                newImages[index] = uploadedImage;
                currentImages = newImages;
                
                // Update the history entry with the new image and Firebase URL
                dispatch(
                  updateHistoryEntry({
                    id: firebaseHistoryId!,
                    updates: {
                      images: currentImages,
                      frameSize: ratio,
                      generationProgress: {
                        current: completedCount * 100,
                        total: totalToGenerate * 100,
                        status: `Completed ${completedCount}/${totalToGenerate} images`,
                      },
                    },
                  })
                );
                
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
                } catch (firebaseError) {
                  console.error(`❌ Failed to update Firebase with image ${index + 1}:`, firebaseError);
                }
              } catch (uploadError) {
                console.error(`Failed to upload image ${index + 1} to Firebase:`, uploadError);
                // Continue with the original URL if upload fails
                dispatch(
                  updateHistoryEntry({
                    id: firebaseHistoryId!,
                    updates: {
                      images: currentImages,
                      frameSize: ratio,
                      generationProgress: {
                        current: completedCount * 100,
                        total: totalToGenerate * 100,
                        status: `Completed ${completedCount}/${totalToGenerate} images (Firebase upload failed)`,
                      },
                    },
                  })
                );
              }
            } else {
              console.error(`No image URL returned for image ${index + 1}`);
            }

            return { success: true, index, imageUrl };
          } catch (error) {
            console.error(`Runway generation failed for image ${index + 1}:`, error);
            anyFailures = true;
            
            dispatch(
              addNotification({
                type: "error",
                message: `Failed to generate image ${index + 1} with Runway: ${error instanceof Error ? error.message : 'Unknown error'}`,
              })
            );
            
            return { success: false, index, error };
          }
        });

        // Wait for all generations to complete
        console.log('Waiting for all Runway generations to complete...');
        const results = await Promise.allSettled(generationPromises);
        console.log('All Runway generations completed. Results:', results);
        
        // Count successful generations
        const successfulResults = results.filter(
          (result) => result.status === 'fulfilled' && result.value.success
        );
        console.log('Successful generations:', successfulResults.length);
        console.log('Failed generations:', results.length - successfulResults.length);
        
        // Finalize entry
        console.log('Finalizing history entry...');
        console.log('Final currentImages:', currentImages);
        console.log('Successful generations:', successfulResults.length);
        
        dispatch(
          updateHistoryEntry({
            id: firebaseHistoryId!,
            updates: {
              status: successfulResults.length > 0 ? "completed" : "failed",
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
            },
          })
        );
        
        // 🔥 CRITICAL FIX: Update Firebase with final status
        console.log('💾 UPDATING FIREBASE WITH FINAL STATUS...');
        console.log('Final data to update:', {
          status: successfulResults.length > 0 ? "completed" : "failed",
          imageCount: successfulResults.length,
          frameSize: ratio,
          style,
          firebaseHistoryId
        });
        
        // 🔍 DEBUG: Check if firebaseHistoryId is valid
        if (!firebaseHistoryId) {
          console.error('❌ CRITICAL ERROR: firebaseHistoryId is undefined!');
          console.error('This means the Firebase save failed at the beginning');
          return;
        }
        
        console.log('🔍 DEBUG: firebaseHistoryId is valid:', firebaseHistoryId);
        console.log('🔍 DEBUG: successfulResults.length:', successfulResults.length);
        console.log('🔍 DEBUG: totalToGenerate:', totalToGenerate);
        
        const finalStatus = successfulResults.length > 0 ? "completed" : "failed" as "completed" | "failed";
        console.log('🔍 DEBUG: Final status to set:', finalStatus);
        
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
        
        console.log('🔍 DEBUG: Update data being sent to Firebase:', updateData);
        
        try {
          console.log('🔍 DEBUG: About to call updateFirebaseHistory...');
          console.log('🔍 DEBUG: Function parameters:', { firebaseHistoryId, updateData });
          
          await updateFirebaseHistory(firebaseHistoryId, updateData);
          
          console.log('✅ Firebase updated with final status:', finalStatus);
          console.log('🔗 Firebase document updated: generationHistory/' + firebaseHistoryId);
          
          // 🔍 DEBUG: Verify the update worked by checking Firebase again
          console.log('🔍 DEBUG: Firebase update completed successfully');
          
          // 🔍 DEBUG: Add a small delay to ensure Firebase has processed the update
          console.log('🔍 DEBUG: Waiting 1 second for Firebase to process update...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('🔍 DEBUG: Delay completed, Firebase update should be persisted');
          
        } catch (firebaseError) {
          console.error('❌ Failed to update Firebase with final status:', firebaseError);
          console.error('Firebase update error details:', {
            message: firebaseError instanceof Error ? firebaseError.message : 'Unknown error',
            stack: firebaseError instanceof Error ? firebaseError.stack : 'No stack trace'
          });
          
          // 🔍 DEBUG: Try to understand what went wrong
          console.error('🔍 DEBUG: firebaseHistoryId that failed:', firebaseHistoryId);
          console.error('🔍 DEBUG: Update data that failed:', updateData);
        }

        if (successfulResults.length > 0) {
          console.log('Runway generation completed successfully!');
          dispatch(
            addNotification({
              type: "success",
              message: `Runway generation completed! Generated ${successfulResults.length}/${totalToGenerate} image(s) successfully`,
            })
          );
          clearInputs(); // Clear inputs after successful generation
        } else {
          console.log('All Runway generations failed');
        }
        
        console.log('=== RUNWAY GENERATION COMPLETED ===');
      } else if (isMiniMaxModel) {
        // Use MiniMax generation
        const result = await dispatch(
          generateMiniMaxImages({
            prompt: `${prompt} [Style: ${style}]`,
            model: selectedModel,
            aspect_ratio: frameSize,
            imageCount,
            generationType: "text-to-image",
            uploadedImages,
            style
          })
        ).unwrap();

        // MiniMax now returns images directly with Firebase URLs
        // Update the loading entry with completed data
        dispatch(
          updateHistoryEntry({
            id: loadingEntry.id,
            updates: {
              status: 'completed',
              images: result.images,
              imageCount: result.images.length,
              frameSize: result.aspect_ratio || frameSize,
              style,
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString()
            },
          })
        );

        // Show success notification
        dispatch(
          addNotification({
            type: "success",
            message: `MiniMax generation completed! Generated ${result.images.length} image(s)`,
          })
        );
        clearInputs(); // Clear inputs after successful generation
      } else {
        // Use regular BFL generation OR local models
        const localModels = [
          // Previously integrated local models
          'flux-schnell',
          'stable-medium',
          'stable-large',
          'stable-turbo',
          'stable-xl',
          // Newly added local models
          'flux-krea',
          'playground',
        ];
        const isLocalImageModel = localModels.includes(selectedModel);

        if (isLocalImageModel) {
          // Create Firebase history entry for local models (generating)
          try {
            firebaseHistoryId = await saveHistoryEntry({
              prompt: prompt,
              model: selectedModel,
              generationType: 'text-to-image',
              images: [],
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount,
              status: 'generating',
              frameSize,
              style,
            });
            // Point the temporary loading entry to the Firebase document id
            dispatch(updateHistoryEntry({ id: loadingEntry.id, updates: { id: firebaseHistoryId } }));
          } catch (e) {
            console.error('Failed to create Firebase history for local model:', e);
          }

          // Call local image generation proxy (server uploads to Firebase)
          const response = await fetch('/api/local/local-image-generation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `${prompt} [Style: ${style}]`,
              model: selectedModel,
              n: imageCount,
              aspect_ratio: frameSize,
              historyId: firebaseHistoryId,
              style,
            }),
          });

          if (!response.ok) {
            throw new Error(`Local image API failed: ${response.status}`);
          }

          const result = await response.json();

          // Create the completed entry
          const completedEntry: HistoryEntry = {
            id: firebaseHistoryId || loadingEntry.id,
            prompt: prompt,
            model: selectedModel,
            generationType: 'text-to-image',
            images: result.images,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            imageCount: result.images.length,
            status: 'completed',
            frameSize,
            style,
          };

          // Update the loading entry with completed data
          dispatch(
            updateHistoryEntry({
              id: firebaseHistoryId || loadingEntry.id,
              updates: completedEntry,
            })
          );

          // Server already finalized Firebase when historyId is provided

          // Show success notification
          dispatch(
            addNotification({
              type: 'success',
              message: `Generated ${result.images.length} image${
                result.images.length > 1 ? 's' : ''
              } successfully!`,
            })
          );
          clearInputs();
        } else {
          // Use regular BFL generation
          // Check if this is a flux-pro model that needs width/height conversion
          // Note: flux-pro, flux-pro-1.1, and flux-pro-1.1-ultra use width/height
          // flux-dev uses frameSize conversion (handled in API route)
          const isFluxProModel = selectedModel === "flux-pro-1.1" || selectedModel === "flux-pro-1.1-ultra" || selectedModel === "flux-pro";
          
          let generationPayload: any = {
            prompt: `${prompt} [Style: ${style}]`,
            model: selectedModel,
            imageCount,
            frameSize,
            style,
            generationType: "text-to-image",
            uploadedImages,
          };

          // For flux-pro-1.1 models, convert frameSize to width/height dimensions
          if (isFluxProModel) {
            const dimensions = convertFrameSizeToFluxProDimensions(frameSize);
            generationPayload.width = dimensions.width;
            generationPayload.height = dimensions.height;
            // Remove frameSize as it's not needed for these models
            delete generationPayload.frameSize;
            console.log(`Flux Pro model detected: ${selectedModel}, using dimensions:`, dimensions);
            console.log(`Original frameSize: ${frameSize}, converted to: ${dimensions.width}x${dimensions.height}`);
            console.log(`Model type: ${selectedModel} - using width/height parameters for BFL API`);
          }

          const result = await dispatch(
            generateImages(generationPayload)
          ).unwrap();

        // Create the completed entry
        const completedEntry: HistoryEntry = {
          id: result.historyId || Date.now().toString(),
          prompt: prompt,
          model: selectedModel,
            generationType: "text-to-image",
          images: result.images,
            timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          imageCount: result.images.length,
            status: "completed",
            frameSize: isFluxProModel ? `${generationPayload.width}x${generationPayload.height}` : frameSize,
            style,
        };

                  // Update the loading entry with completed data
          dispatch(
            updateHistoryEntry({
          id: loadingEntry.id,
              updates: {
                ...completedEntry,
                frameSize: isFluxProModel ? `${generationPayload.width}x${generationPayload.height}` : frameSize,
              },
            })
          );

        // Show success notification
          dispatch(
            addNotification({
              type: "success",
              message: `Generated ${result.images.length} image${
                result.images.length > 1 ? "s" : ""
              } successfully!`,
            })
          );
          clearInputs(); // Clear inputs after successful generation
        }
      }
    } catch (error) {
      console.error("Error generating images:", error);

      // Update loading entry to failed status
      // Use firebaseHistoryId if available, otherwise fall back to loadingEntry.id
      const entryIdToUpdate = firebaseHistoryId || loadingEntry.id;
      
      dispatch(
        updateHistoryEntry({
          id: entryIdToUpdate,
        updates: {
            status: "failed",
            error:
              error instanceof Error
                ? error.message
                : "Failed to generate images",
          },
        })
      );

      // If we have a Firebase ID, also update it there
      if (firebaseHistoryId) {
        try {
          await updateFirebaseHistory(firebaseHistoryId, {
            status: "failed",
            error: error instanceof Error ? error.message : "Failed to generate images",
          });
          console.log('✅ Firebase entry updated to failed status due to error');
        } catch (firebaseError) {
          console.error('❌ Failed to update Firebase entry to failed status:', firebaseError);
        }
      }

      // Show error notification
      dispatch(
        addNotification({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate images",
        })
      );
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeDropdown &&
        !(event.target as HTMLElement).closest(".dropdown-container")
      ) {
        dispatch(toggleDropdown(""));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown, dispatch]);

  return (
    <>
      {historyEntries.length > 0 && (
        <div className="fixed inset-0 pt-[62px] pl-[68px] pr-6 pb-6 overflow-y-auto z-30">
          <div className="p-6">
            {/* History Header - Fixed during scroll */}
            <div className="sticky top-0 z-10 mb-6 bg-black/80 backdrop-blur-sm py-4 -mx-6 px-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">History</h2>
            </div>

            {/* Main Loader */}
            {loading && historyEntries.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                  <div className="text-white text-lg">Loading your generation history...</div>
                </div>
              </div>
            )}

            {/* History Entries */}
            <div className="space-y-8">
              {historyEntries.map((entry: HistoryEntry) => (
                <div key={entry.id} className="space-y-4">
                  {/* Prompt Text in Left Corner */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-white/60"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex flex-row-reverse items-center gap-2">
                        <p className="text-white/90 text-sm leading-relaxed flex-1 max-w-[500px] break-words">
                          {getCleanPrompt(entry.prompt)}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              getCleanPrompt(entry.prompt)
                            );
                            dispatch(
                              addNotification({
                                type: "success",
                                message: "Prompt copied to clipboard!",
                              })
                            );
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white/80 flex-shrink-0 mt-0.5"
                          title="Copy prompt"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect
                              x="8"
                              y="2"
                              width="8"
                              height="4"
                              rx="1"
                              ry="1"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                        <span>
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </span>
                        <span>{entry.model}</span>
                        <span>
                          {entry.images.length} image
                          {entry.images.length !== 1 ? "s" : ""}
                        </span>
                        {entry.style && (
                          <span className="text-blue-400">
                            Style: {entry.style}
                          </span>
                        )}
                        {entry.status === "generating" && (
                          <span className="text-yellow-400 flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            Generating...
                          </span>
                        )}
                        {entry.status === "failed" && (
                          <span className="text-red-400">Failed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Images Grid - Smaller Size */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 ml-9">
                    {entry.images.map((image: any) => (
                      <div
                        key={image.id}
                        onClick={() => setPreview({ entry, image })}
                        className="relative aspect-square rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group"
                      >
                        {entry.status === "generating" ? (
                          // Loading frame
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                              <div className="text-xs text-white/60">
                                Generating...
                              </div>
                            </div>
                          </div>
                        ) : entry.status === "failed" ? (
                          // Error frame
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                            <div className="flex flex-col items-center gap-2">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="text-red-400"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                              <div className="text-xs text-red-400">Failed</div>
                            </div>
                          </div>
                        ) : (
                          // Completed image
                          <Image
                            src={image.url}
                            alt={entry.prompt}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, 16vw"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Loader for scroll loading */}
              {hasMore && loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                    <div className="text-sm text-white/60">Loading more generations...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[840px] z-[60]">
        <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          {/* Top row: prompt + actions */}
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
            <textarea
              ref={inputEl}
              placeholder="Type your prompt..."
              value={prompt}
              onChange={(e) => {
                dispatch(setPrompt(e.target.value));
                adjustTextareaHeight(e.target);
              }}
              className={`flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-relaxed resize-none overflow-y-auto transition-all duration-200 ${
                prompt ? 'text-white' : 'text-white/70'
              }`}
              rows={1}
              style={{ 
                minHeight: '24px', 
                maxHeight: '96px',
                lineHeight: '1.2',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
              }}
            />
              {/* Previews just to the left of upload */}
              {uploadedImages.length > 0 && (
                <div className="flex items-center gap-1.5 pr-1">
                  {uploadedImages.map((u: string, i: number) => (
                    <div
                      key={i}
                      className="relative w-12 h-12 rounded-md overflow-hidden ring-1 ring-white/20 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u}
                        alt={`ref-${i}`}
                        className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
            />
            <button
                        aria-label="Remove reference"
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-500 text-xl font-extrabold drop-shadow"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = uploadedImages.filter(
                            (_: string, idx: number) => idx !== i
                          );
                          dispatch(setUploadedImages(next));
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer">
              <Image
                src="/icons/fileuploadwhite.svg"
                alt="Attach"
                width={18}
                height={18}
                className="opacity-90"
              />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const inputEl = e.currentTarget as HTMLInputElement;
                    const files = Array.from(inputEl.files || []).slice(0, 4);
                    const urls: string[] = [];
                    for (const file of files) {
                      const reader = new FileReader();
                      const asDataUrl: string = await new Promise((res) => {
                        reader.onload = () => res(reader.result as string);
                        reader.readAsDataURL(file);
                      });
                      urls.push(asDataUrl);
                    }
                    // append to existing stack (max 4)
                    const next = [...uploadedImages, ...urls].slice(0, 4);
                    dispatch(setUploadedImages(next));
                    
                    // Only auto-switch models if this is the first upload AND we're not using an image-to-image model
                    if (uploadedImages.length === 0 && next.length > 0) {
                      // Check if current model is an image-to-image model
                      const isImageToImageModel = selectedModel === "gen4_image_turbo" || selectedModel === "gen4_image";
                      
                      if (!isImageToImageModel) {
                        // Only auto-switch for text-to-image models
                        console.log('Auto-switching model for text-to-image generation');
                        if (next.length > 1) {
                          dispatch(setSelectedModel("flux-kontext-pro"));
                        } else {
                          // Single image - could use MiniMax or Kontext Pro
                          dispatch(setSelectedModel("flux-kontext-pro"));
                        }
                      } else {
                        console.log('Keeping current image-to-image model:', selectedModel);
                      }
                    }
                    // clear input so the same file can be reselected
                    if (inputEl) inputEl.value = "";
                  }}
                />
              </label>
          </div>

          {/* Small + button (between attach and Generate in the mock) */}
         
          <div className="flex flex-col items-end gap-2">
              {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
            >
                {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Bottom row: pill options */}
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          {/* Selection Summary */}
          {/* <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 px-3 py-1.5 rounded-lg transition-all duration-300">
            <span>Selected:</span>
            <span className="text-white/80 font-medium flex flex-wrap gap-1">
              {selectedModel !== 'flux-dev' && (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded mr-2 animate-pulse">
                  {selectedModel.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              )}
              {imageCount !== 1 && (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded mr-2 animate-pulse">
                  {imageCount} Image{imageCount > 1 ? 's' : ''}
                </span>
              )}
              {frameSize !== '1:1' && (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded mr-2 animate-pulse">
                  {frameSize}
                </span>
              )}
              {style !== 'realistic' && (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded animate-pulse">
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </span>
              )}
              {(selectedModel === 'flux-dev' && imageCount === 1 && frameSize === '1:1' && style === 'realistic') && (
                <span className="text-white/40">Default settings</span>
              )}
            </span>
          </div> */}
          
          <ModelsDropdown />
          <ImageCountDropdown />
          <FrameSizeDropdown />
          <StyleSelector />
            {/* moved previews near upload above */}
            <div className="absolute right-2 bottom-32 ml-auto flex items-center gap-2">
              

              <Button
                aria-label="Upscale"
                title="Upscale"
                borderRadius="1.5rem"
                containerClassName="h-10 w-auto"
                
                className="bg-black  text-white px-4 py-2"
              >
                <div className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-[#2F6BFF]"
                  >
                    <path d="M7 17l-4 4" />
                    <path d="M3 17h4v4" />
                    <path d="M17 7l4-4" />
                    <path d="M21 7h-4V3" />
                  </svg>
                  <span className="text-sm text-white">Upscale</span>
                </div>
              </Button>
              <Button
                aria-label="Remove background"
                title="Remove background"
                borderRadius="1.5rem"
                containerClassName="h-10 w-auto"
               
                
                className="bg-black text-white px-4 py-2"
              >
                <div className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-[#F97316]"
                  >
                    <path d="M19 14l-7-7-8 8 4 4h8l3-3z" />
                    <path d="M5 13l6 6" />
                  </svg>
                  <span className="text-sm text-white">Remove background</span>
                </div>
              </Button>
            </div>
        </div>
      </div>
      </div>
      <ImagePreviewModal preview={preview} onClose={() => setPreview(null)} />
    </>
  );
};

export default InputBox;
