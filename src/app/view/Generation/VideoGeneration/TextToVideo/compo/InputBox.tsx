"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { HistoryEntry } from "@/types/history";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { shallowEqual } from "react-redux";
import { addHistoryEntry, loadMoreHistory, loadHistory, updateHistoryEntry } from "@/store/slices/historySlice";
import { addNotification } from "@/store/slices/uiSlice";
import { saveHistoryEntry, updateHistoryEntry as updateFirebaseHistory } from "@/lib/historyService";
import { waitForRunwayVideoCompletion } from "@/lib/runwayVideoService";
import { buildImageToVideoBody, buildVideoToVideoBody } from "@/lib/videoGenerationBuilders";
import { VideoGenerationState, GenMode } from "@/types/videoGeneration";
import { FilePlay, FileSliders, Crop, Clock, TvMinimalPlay } from 'lucide-react';
import { MINIMAX_MODELS, MiniMaxModelType } from "@/lib/minimaxTypes";

// Import the video-specific components
import VideoModelsDropdown from "./VideoModelsDropdown";
import VideoFrameSizeDropdown from "./VideoFrameSizeDropdown";
import VideoDurationDropdown from "./VideoDurationDropdown";
import VideoPreviewModal from "./VideoPreviewModal";


const InputBox = () => {
  const dispatch = useAppDispatch();
  const [preview, setPreview] = useState<{
    entry: HistoryEntry;
    video: any;
  } | null>(null);
  const inputEl = useRef<HTMLTextAreaElement>(null);

  // Video generation state
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gen4_turbo");
  const [frameSize, setFrameSize] = useState("16:9");
  const [duration, setDuration] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<string>("");
  const [references, setReferences] = useState<string[]>([]);
  const [generationMode, setGenerationMode] = useState<"text_to_video" | "image_to_video" | "video_to_video">("text_to_video");
  const [error, setError] = useState("");

  // MiniMax specific state
  const [selectedResolution, setSelectedResolution] = useState("1080P");
  const [selectedMiniMaxDuration, setSelectedMiniMaxDuration] = useState(6);
  const [resolutionDropdownOpen, setResolutionDropdownOpen] = useState(false);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);

  // Auto-select model based on generation mode
  useEffect(() => {
    if (generationMode === "text_to_video") {
      setSelectedModel("MiniMax-Hailuo-02"); // Default to MiniMax-Hailuo-02 for text→video
    } else if (generationMode === "image_to_video") {
      setSelectedModel("I2V-01-Director"); // Default to I2V-01-Director for image→video
    } else {
      setSelectedModel("gen4_aleph"); // Runway model for video→video
    }
  }, [generationMode]);

  // Auto-set fixed settings for models that don't support customization
  useEffect(() => {
    if (selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
      setSelectedResolution("720P");
      setSelectedMiniMaxDuration(6);
      // These models have fixed settings: 6s duration, 720P resolution
    }
  }, [selectedModel]);

  // Reset controls when switching between MiniMax and Runway models
  useEffect(() => {
    if (selectedModel.includes("MiniMax")) {
      // Reset Runway-specific controls when switching to MiniMax
      // Note: MiniMax models don't support custom aspect ratios - they use fixed resolutions
      setFrameSize("16:9"); // Default aspect ratio (not used for MiniMax)
      setDuration(5); // Default duration (not used for MiniMax)
      
      // Set appropriate MiniMax defaults based on model
      if (selectedModel === "MiniMax-Hailuo-02") {
        setSelectedResolution("1080P");
        setSelectedMiniMaxDuration(6);
      } else {
        // T2V-01, I2V-01, S2V-01 have fixed settings
        setSelectedResolution("720P");
        setSelectedMiniMaxDuration(6);
      }
    } else {
      // Reset MiniMax-specific controls when switching to Runway
      setSelectedResolution("1080P"); // Default resolution
      setSelectedMiniMaxDuration(6); // Default duration
    }
  }, [selectedModel]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
      
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setResolutionDropdownOpen(false);
        setDurationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle model change with validation
  const handleModelChange = (newModel: string) => {
    // Validate that the selected model is compatible with the current generation mode
    if (generationMode === "text_to_video") {
      // Text→Video: MiniMax-Hailuo-02, T2V-01-Director
      if (newModel === "MiniMax-Hailuo-02" || newModel === "T2V-01-Director") {
        setSelectedModel(newModel);
        // Reset aspect ratio for MiniMax models (they don't support custom aspect ratios)
        if (newModel.includes("MiniMax")) {
          setFrameSize("16:9"); // Default, but won't be used for MiniMax
        }
        // Set appropriate settings based on model
        if (newModel === "T2V-01-Director") {
          setSelectedResolution("720P");
          setSelectedMiniMaxDuration(6);
        }
      }
    } else if (generationMode === "image_to_video") {
      // Image→Video: gen4_turbo, gen3a_turbo, MiniMax-Hailuo-02, I2V-01-Director, S2V-01
      if (newModel === "gen4_turbo" || newModel === "gen3a_turbo" || newModel === "MiniMax-Hailuo-02" || newModel === "I2V-01-Director" || newModel === "S2V-01") {
        setSelectedModel(newModel);
        // Reset aspect ratio for MiniMax models (they don't support custom aspect ratios)
        if (newModel.includes("MiniMax")) {
          setFrameSize("16:9"); // Default, but won't be used for MiniMax
        }
        // Set appropriate settings based on model
        if (newModel === "I2V-01-Director" || newModel === "S2V-01") {
          setSelectedResolution("720P");
          setSelectedMiniMaxDuration(6);
        }
      }
    } else if (generationMode === "video_to_video") {
      // Video→Video: Only Runway models support this
      if (newModel === "gen4_aleph") {
        setSelectedModel(newModel);
      }
    }
  };

  const loading = useAppSelector((state: any) => state.history?.loading || false);
  const hasMore = useAppSelector((state: any) => state.history?.hasMore || false);
  const [page, setPage] = useState(1);

  // Get history entries for video generation
  const historyEntries = useAppSelector((state: any) => {
    const allEntries = state.history?.entries || [];
    // Filter for text-to-video only - same as global history
    const filteredEntries = allEntries.filter((entry: any) => entry.generationType === "text-to-video");
    console.log('🎥 Video Generation - All entries:', allEntries.length);
    console.log('🎥 Video Generation - Filtered entries:', filteredEntries.length);
    console.log('🎥 Video Generation - Current page:', page);
    console.log('🎥 Video Generation - Has more:', hasMore);
    return filteredEntries;
  }, shallowEqual);

  // Helper function to get clean prompt without style
  const getCleanPrompt = (promptText: string): string => {
    return promptText.replace(/\[\s*Style:\s*[^\]]+\]/i, "").trim();
  };

  // Helper function to convert frameSize to Runway ratio format
  const convertFrameSizeToRunwayRatio = (frameSize: string): string => {
    const ratioMap: { [key: string]: string } = {
      "16:9": "1280:720",
      "9:16": "720:1280",
      "4:3": "1104:832",
      "3:4": "832:1104",
      "1:1": "960:960",
      "21:9": "1584:672",
      "16:10": "1280:768", // gen3a_turbo specific
      "10:16": "768:1280", // gen3a_turbo specific
    };

    return ratioMap[frameSize] || "1280:720"; // Default to 16:9 if no match
  };

  // Helper function to convert frameSize to MiniMax resolution
  const convertFrameSizeToMiniMaxResolution = (frameSize: string): string => {
    const resolutionMap: { [key: string]: string } = {
      "16:9": "1080P",
      "9:16": "1080P",
      "4:3": "1080P",
      "3:4": "1080P",
      "1:1": "1080P",
      "21:9": "1080P",
    };

    return resolutionMap[frameSize] || "1080P";
  };

  // Helper function to wait for MiniMax video completion (same pattern as Runway)
  const waitForMiniMaxVideoCompletion = async (taskId: string) => {
    console.log('⏳ Starting MiniMax video completion polling for task:', taskId);
    
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`🔄 MiniMax polling attempt ${attempts + 1}/${maxAttempts}`);
        
        const response = await fetch(`/api/minimax/video/status?task_id=${taskId}`);
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }
        
        const statusResult = await response.json();
        console.log('📊 MiniMax status check result:', statusResult);
        
        if (statusResult.status === 'Success' && statusResult.file_id) {
          console.log('✅ MiniMax video completed, retrieving file...');
          
          // Get the actual download URL
          const fileResponse = await fetch(`/api/minimax/video/file?file_id=${statusResult.file_id}`);
          if (!fileResponse.ok) {
            throw new Error(`File retrieval failed: ${fileResponse.status}`);
          }
          
          const fileResult = await fileResponse.json();
          console.log('📁 MiniMax file result:', fileResult);
          
          if (fileResult.file && (fileResult.file.download_url || fileResult.file.backup_download_url)) {
            return {
              status: 'Success',
              download_url: fileResult.file.download_url || fileResult.file.backup_download_url
            };
          } else {
            throw new Error('No download URL found in file response');
          }
        } else if (statusResult.status === 'Fail') {
          console.error('❌ MiniMax video generation failed:', statusResult);
          return { status: 'Fail', error: statusResult.base_resp?.status_msg || 'Generation failed' };
        } else if (statusResult.status === 'Queueing' || statusResult.status === 'Preparing' || statusResult.status === 'Processing') {
          console.log(`⏳ MiniMax still processing: ${statusResult.status}`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          attempts++;
        } else if (statusResult.status) {
          console.log(`⏳ MiniMax status: ${statusResult.status}`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
        } else {
          console.warn('⚠️ Empty MiniMax status response, retrying...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
        }
      } catch (error) {
        console.error('❌ MiniMax status check error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }
    
    console.error('⏰ MiniMax video completion timeout after', maxAttempts, 'attempts');
    throw new Error('MiniMax video generation timeout');
  };

  // Auto-adjust textarea height
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 96)}px`;
  };

  // PageRouter already loads initial history, so we just set up pagination state
  useEffect(() => {
    console.log('🎥 Video Generation - Component mounted, setting up pagination state');
    setPage(1);
    console.log('🎥 Video Generation - Pagination state initialized');
  }, []);

  // Handle scroll to load more history
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        if (hasMore && !loading) {
          console.log('🎥 Video Generation - Scroll threshold reached, loading more...');
          const nextPage = page + 1;
          setPage(nextPage);
          console.log('🎥 Video Generation - Loading page:', nextPage);
          dispatch(loadMoreHistory({ 
            filters: { generationType: 'text-to-video' }, 
            paginationParams: { limit: 10 } 
          }));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, page, dispatch]);

  // Handle references upload
  const handleReferencesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newReferences: string[] = [];
    const maxReferences = 4;

    Array.from(files).forEach((file) => {
      if (newReferences.length >= maxReferences) return;
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            setReferences(prev => {
              const updated = [...prev, result];
              if (updated.length > maxReferences) {
                return updated.slice(0, maxReferences);
              }
              return updated;
            });
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input 
    event.target.value = '';
  };

  // Remove reference
  const removeReference = (index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            setUploadedImages(prev => [...prev, result]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    event.target.value = '';
  };

  // Handle video upload
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0];
    if (file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setUploadedVideo(result);
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    event.target.value = '';
  };

  // Handle video generation
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError("");

    // Declare firebaseHistoryId at function level for error handling
    let firebaseHistoryId: string | undefined;

    try {
      let requestBody;
      let generationType: string;
      let apiEndpoint: string;

      if (generationMode === "text_to_video") {
        // Text to video generation (MiniMax only)
        if (selectedModel.includes("MiniMax")) {
          // Validate MiniMax text-to-video requirements
          if (selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P" && uploadedImages.length === 0) {
            setError("MiniMax-Hailuo-02 requires a first frame image for 512P resolution");
            return;
          }
          
          requestBody = {
            model: selectedModel,
            prompt: prompt,
            duration: selectedMiniMaxDuration,
            resolution: selectedResolution,
            // Note: MiniMax models don't support custom aspect ratios - they use fixed resolutions
            ...(selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P" && { first_frame_image: uploadedImages[0] })
          };
          generationType = "text-to-video";
          apiEndpoint = '/api/minimax/video';
        } else {
          // Runway text to video
          requestBody = buildImageToVideoBody({
            model: selectedModel as "gen4_turbo" | "gen3a_turbo",
            ratio: convertFrameSizeToRunwayRatio(frameSize) as any,
            promptText: prompt,
            duration: duration as 5 | 10,
            promptImage: [] // Empty array for text-to-video
          });
          apiEndpoint = '/api/runway/video';
        }
        generationType = "text-to-video";
      } else if (generationMode === "image_to_video") {
        if (uploadedImages.length === 0) {
          setError("Please upload at least one image");
          return;
        }
        
        if (selectedModel.includes("MiniMax")) {
          // MiniMax image to video - validate specific requirements
          if (selectedModel === "I2V-01-Director" && uploadedImages.length === 0) {
            setError("I2V-01-Director requires a first frame image");
            return;
          }
          
          if (selectedModel === "S2V-01" && references.length === 0) {
            setError("S2V-01 requires a subject reference image (character image)");
            return;
          }
          
          if (selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P" && uploadedImages.length === 0) {
            setError("MiniMax-Hailuo-02 requires a first frame image for 512P resolution");
            return;
          }
          
          requestBody = {
            model: selectedModel,
            prompt: prompt,
            duration: selectedMiniMaxDuration,
            resolution: selectedResolution,
            // Note: MiniMax models don't support custom aspect ratios - they use fixed resolutions
            ...(selectedModel === "I2V-01-Director" && { first_frame_image: uploadedImages[0] }),
            ...(selectedModel === "S2V-01" && { subject_reference: [{ type: "character", image: references }] }),
            ...(selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P" && { first_frame_image: uploadedImages[0] })
          };
          generationType = "image_to_video";
          apiEndpoint = '/api/minimax/video';
        } else {
          // Runway image to video
          requestBody = buildImageToVideoBody({
            model: selectedModel as "gen4_turbo" | "gen3a_turbo",
            ratio: convertFrameSizeToRunwayRatio(frameSize) as any,
            promptText: prompt,
            duration: duration as 5 | 10,
            promptImage: uploadedImages[0]
          });
          apiEndpoint = '/api/runway/video';
        }
        generationType = "image_to_video";
      } else {
        // Video to video generation
        if (!uploadedVideo) {
          setError("Please upload a video");
          return;
        }
        
        if (selectedModel.includes("MiniMax")) {
          // MiniMax doesn't support video to video
          setError("MiniMax models don't support video to video generation");
          return;
        } else {
          // Runway video to video
          requestBody = buildVideoToVideoBody({
            model: "gen4_aleph",
            ratio: convertFrameSizeToRunwayRatio(frameSize) as any,
            promptText: prompt,
            videoUri: uploadedVideo,
            references: references.length > 0 ? references.map(ref => ({
              type: "image",
              uri: ref
            })) : undefined,
          });
          apiEndpoint = '/api/runway/video';
        }
        generationType = "video_to_video";
      }

      // Create loading history entry for Redux (with temporary ID)
      const tempId = Date.now().toString();
      const loadingEntry: Omit<HistoryEntry, 'id'> = {
        prompt,
        model: selectedModel,
        frameSize,
        images: [],
        status: "generating",
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 1,
        generationType: generationType as any
      };

      // Add to Redux with temporary ID
      dispatch(addHistoryEntry({
        ...loadingEntry,
        id: tempId
      }));

      try {
        // Save to Firebase first (without ID field)
        firebaseHistoryId = await saveHistoryEntry(loadingEntry);

        console.log('✅ Firebase history entry created with ID:', firebaseHistoryId);
        console.log('🔗 Firebase document path: generationHistory/' + firebaseHistoryId);

        // Update Redux entry with Firebase ID (replace tempId with firebaseHistoryId)
        dispatch(updateHistoryEntry({
          id: tempId,
          updates: { id: firebaseHistoryId }
        }));

        // Don't modify the loadingEntry object - use firebaseHistoryId directly
        console.log('Using Firebase ID for all operations:', firebaseHistoryId);

      } catch (firebaseError) {
        console.error('❌ Firebase save failed:', firebaseError);
        dispatch(
          addNotification({
            type: "error",
            message: "Failed to save generation to history",
          })
        );
        // Continue with generation even if Firebase save fails
      }

      // Make API call
      console.log('🚀 Making API call to:', apiEndpoint);
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('❌ API response not ok:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📥 API response:', result);

      if (result.error) {
        console.error('❌ API returned error:', result.error);
        throw new Error(result.error);
      }

      let videoUrl: string;

      if (selectedModel.includes("MiniMax")) {
        // MiniMax flow - same as Runway with polling
        console.log('🎬 MiniMax video generation started, task ID:', result.taskId);
        
        // Poll for completion like Runway
        const videoResult = await waitForMiniMaxVideoCompletion(result.taskId);
        
        if (videoResult.status === 'Success' && videoResult.download_url) {
          videoUrl = videoResult.download_url;
          console.log('✅ MiniMax video completed, URL:', videoUrl);
        } else if (videoResult.status === 'Fail') {
          console.error('❌ MiniMax video generation failed:', videoResult);
          throw new Error('MiniMax video generation failed');
        } else {
          console.error('❌ Unexpected MiniMax status:', videoResult);
          throw new Error('Unexpected MiniMax video generation status');
        }
      } else {
        // Runway video completion
        console.log('🎬 Runway video generation started, task ID:', result.taskId);
        const videoResult = await waitForRunwayVideoCompletion(result.taskId);

        if (videoResult.status === 'SUCCEEDED' && videoResult.output && videoResult.output.length > 0) {
          videoUrl = videoResult.output[0];
          console.log('✅ Runway video completed, URL:', videoUrl);
        } else if (videoResult.status === 'FAILED') {
          console.error('❌ Runway video generation failed:', videoResult);
          throw new Error('Video generation failed');
        } else {
          console.error('❌ Unexpected Runway status:', videoResult);
          throw new Error('Unexpected video generation status');
        }
      }

      // Update the history entry with the new video and Firebase URL
      const updateData = {
        status: 'completed' as const,
        images: [{
          id: Date.now().toString(),
          url: videoUrl,
          firebaseUrl: videoUrl,
          originalUrl: videoUrl
        }]
      };

      // Update Redux entry with completion data
      dispatch(updateHistoryEntry({
        id: firebaseHistoryId || tempId,
        updates: updateData
      }));

      // Update Firebase
      if (firebaseHistoryId) {
        try {
          await updateFirebaseHistory(firebaseHistoryId, updateData);
          console.log('✅ Firebase history updated successfully');
        } catch (firebaseError) {
          console.error('❌ Firebase update failed:', firebaseError);
        }
      }

      dispatch(
        addNotification({
          type: "success",
          message: "Video generated successfully!",
        })
      );

      // Clear form
      setPrompt("");
      setUploadedImages([]);
      setUploadedVideo("");
      setReferences([]);

    } catch (error) {
      console.error('❌ Video generation failed:', error);
      setError(error instanceof Error ? error.message : 'Video generation failed');

      // Update history entry with failed status
      if (firebaseHistoryId) {
        try {
          await updateFirebaseHistory(firebaseHistoryId, {
            status: 'failed'
          });
        } catch (firebaseError) {
          console.error('❌ Failed to update Firebase with failed status:', firebaseError);
        }
      }

      dispatch(
        addNotification({
          type: "error",
          message: error instanceof Error ? error.message : 'Video generation failed',
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* History Section */}
      {historyEntries.length > 0 && (
        <div className="fixed inset-0 pt-[62px] pl-[68px] pr-6 pb-6 overflow-y-auto z-30">
          <div className="p-6">
            {/* History Header - Fixed during scroll */}
            <div className="sticky top-0 z-10 mb-6 bg-black/80 backdrop-blur-sm py-4 -mx-6 px-6 border-b border-white/10">
              <h2 className="text-white text-xl font-semibold">History</h2>
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
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1 2-2h2" />
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
                          {entry.images.length} video
                          {entry.images.length !== 1 ? "s" : ""}
                        </span>
                        {entry.frameSize && !entry.model.includes("MiniMax") && (
                          <span className="text-green-400">Aspect: {entry.frameSize}</span>
                        )}
                        {entry.model.includes("MiniMax") && (
                          <span className="text-blue-400">Fixed Resolution</span>
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

                  {/* Videos Grid - Same Size as Text-to-Image History */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 ml-9">
                    {entry.images.map((video: any) => (
                      <div
                        key={video.id}
                        onClick={() => setPreview({ entry, video })}
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
                          // Completed video thumbnail
                          <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center relative">
                            <video 
                              src={video.url} 
                              className="w-full h-full object-cover"
                              muted
                              onLoadedData={(e) => {
                                // Create thumbnail from video
                                const video = e.target as HTMLVideoElement;
                                const canvas = document.createElement('canvas');
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(video, 0, 0);
                                  // You could use this canvas as thumbnail if needed
                                }
                              }}
                            />
                            {/* Video play icon overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                            {/* Video duration or other info */}
                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                              <span className="text-xs text-white">Video</span>
                            </div>
                          </div>
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

      {/* Main Input Box */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[840px] z-[60]">
        <div className={`rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl transition-all duration-300 ${
          selectedModel.includes("MiniMax") ? 'max-w-[1100px]' : 'max-w-[900px]'
        }`}>
          {/* Top row: prompt + actions */}
          <div className="flex items-center gap-3 p-3">
            <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
              <textarea
                ref={inputEl}
                placeholder="Type your video prompt... (MiniMax models support camera movements: [Pan left], [Zoom in], etc.)"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
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
              <div className="flex items-center gap-2 h-[40px]">
                {/* Camera Movement Presets for MiniMax */}
                {selectedModel.includes("MiniMax") && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-white/60 mr-2">Camera:</span>
                    {["Tilt up", "Pan right", "Zoom in", "Push in", "Pan left", "Zoom out", "Tilt down"].map((movement) => (
                      <button
                        key={movement}
                        onClick={() => setPrompt(prev => prev + ` [${movement}]`)}
                        className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md text-white/70 hover:text-white transition-colors"
                        title={`Add ${movement} camera movement`}
                      >
                        {movement}
                      </button>
                    ))}
                  </div>
                )}

                 {/* References Upload (for video-to-video and S2V-01 character reference) */}
              {(generationMode === "video_to_video" || (generationMode === "image_to_video" && selectedModel === "S2V-01")) && (
                <div className="relative">
                  <label 
                    className={`p-2 rounded-xl transition-all duration-200 cursor-pointer group relative ${
                      (generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                      (generationMode === "video_to_video" && references.length >= 4)
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                    title={generationMode === "image_to_video" && selectedModel === "S2V-01" 
                      ? `Character Reference (${references.length}/1)` 
                      : `References (${references.length}/4)`
                    }
                  >
                    <FileSliders
                      size={22}
                      className={`transition-all duration-200 ${
                        (generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                        (generationMode === "video_to_video" && references.length >= 4)
                          ? 'text-gray-400' 
                          : 'text-green-400 hover:text-green-300 hover:scale-110'
                      }`}
                    />
                    
                    {/* References Count Badge */}
                    {references.length > 0 && (
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                        (generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                        (generationMode === "video_to_video" && references.length >= 4)
                          ? 'bg-red-500' : 'bg-green-500'
                      }`}>
                        <span className="text-xs text-white font-bold">{references.length}</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple={generationMode === "video_to_video"}
                      className="hidden"
                      onChange={handleReferencesUpload}
                      disabled={(generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                               (generationMode === "video_to_video" && references.length >= 4)}
                    />
                  </label>
                  
                  {/* References Preview Popup */}
                  {references.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 min-w-[200px]">
                      <div className="text-xs text-white/60 mb-2">
                        {generationMode === "image_to_video" && selectedModel === "S2V-01" 
                          ? `Character Reference (${references.length}/1)` 
                          : `References (${references.length}/4)`
                        }
                      </div>
                      <div className="space-y-2">
                        {references.map((ref, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10">
                              <img 
                                src={ref} 
                                alt={`Reference ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs text-white/80 flex-1">Reference {index + 1}</span>
                            <button
                              onClick={() => removeReference(index)}
                              className="w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Image Upload (only for image-to-video, disabled for S2V-01) */}
              {generationMode === "image_to_video" && selectedModel !== "S2V-01" && (
                <div className="relative">
                  <label 
                    className="p-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                    title="Upload Image"
                  >
                    <Image
                      src="/icons/imagegenerationwhite.svg"
                      alt="Upload Image"
                      width={22}
                      height={22}
                      className="text-white transition-all duration-200 hover:text-blue-300 hover:scale-110"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  
                  {/* Model Requirements Helper */}
                  {selectedModel.includes("MiniMax") && (
                    <div className="absolute bottom-full left-0 mb-2 p-3 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 min-w-[250px]">
                      <div className="text-xs text-white/80 mb-2 font-medium">Model Requirements:</div>
                      {selectedModel === "I2V-01-Director" && (
                        <div className="text-xs text-white/60">• Requires first frame image</div>
                      )}
                      {selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P" && (
                        <div className="text-xs text-white/60">• Requires first frame image for 512P resolution</div>
                      )}
                      {(selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") && (
                        <div className="text-xs text-white/60">• Fixed 6s duration, 720P resolution</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Conditional Image Upload for Text-to-Video (MiniMax-Hailuo-02 512P) */}
              {generationMode === "text_to_video" && selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P" && (
                <div className="relative">
                  <label 
                    className="p-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                    title="Upload First Frame Image (Required for 512P)"
                  >
                    <Image
                      src="/icons/imagegenerationwhite.svg"
                      alt="Upload First Frame Image"
                      width={22}
                      height={22}
                      className="text-white transition-all duration-200 hover:text-blue-300 hover:scale-110"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  
                  {/* Helper Text */}
                  <div className="absolute bottom-full left-0 mb-2 p-3 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 min-w-[250px]">
                    <div className="text-xs text-white/80 mb-2 font-medium">512P Resolution Requirement:</div>
                    <div className="text-xs text-white/60">• MiniMax-Hailuo-02 requires a first frame image for 512P resolution</div>
                  </div>
                </div>
              )}

              



              {/* Video Upload (only for video-to-video) */}
              {generationMode === "video_to_video" && (
                <div className="relative">
                  <label 
                    className="p-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                    title="Upload Video"
                  >
                    <FilePlay
                      size={22}
                      className="text-white transition-all duration-200 hover:text-purple-300 hover:scale-110"
                    />
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                  </label>
                </div>
              )}

              </div>

             
            </div>

            <div className="flex flex-col items-end gap-2">
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || 
                  (generationMode === "image_to_video" && uploadedImages.length === 0) ||
                  (generationMode === "video_to_video" && !uploadedVideo) ||
                  // Model-specific validations
                  (selectedModel === "I2V-01-Director" && uploadedImages.length === 0) ||
                  (selectedModel === "S2V-01" && references.length === 0) ||
                  (selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P" && uploadedImages.length === 0)
                }
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
              >
                {isGenerating ? "Generating..." : "Generate Video"}
              </button>
            </div>
          </div>

          {/* Uploaded Content Display */}
          <div className="px-3 pb-3">
            {/* Uploaded Images */}
            {uploadedImages.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-white/60 mb-2">Uploaded Images ({uploadedImages.length})</div>
                <div className="flex gap-2">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <div 
                        className="w-16 h-16 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer"
                        onClick={() => {
                          const previewEntry: HistoryEntry = {
                            id: `preview-${index}`,
                            prompt: "Uploaded Image",
                            model: "preview",
                            frameSize: "1:1",
                            images: [{ id: `img-${index}`, url: image, originalUrl: image, firebaseUrl: image }],
                            status: "completed",
                            timestamp: new Date().toISOString(),
                            createdAt: new Date().toISOString(),
                            imageCount: 1,
                            generationType: "text-to-video" as const,
                            style: undefined
                          };
                          setPreview({ entry: previewEntry, video: image });
                        }}
                      >
                        <img 
                          src={image} 
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        aria-label="Remove image"
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        onClick={() => {
                          setUploadedImages(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uploaded Video */}
            {uploadedVideo && (
              <div className="mb-3">
                <div className="text-xs text-white/60 mb-2">Uploaded Video</div>
                <div className="relative group">
                  <div 
                    className="w-32 h-20 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer"
                    onClick={() => {
                      const previewEntry: HistoryEntry = {
                        id: "preview-video",
                        prompt: "Uploaded Video",
                        model: "preview",
                        frameSize: "16:9",
                        images: [{ id: "video-1", url: uploadedVideo, originalUrl: uploadedVideo, firebaseUrl: uploadedVideo }],
                        status: "completed",
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        imageCount: 1,
                        generationType: "text-to-video" as const,
                        style: undefined
                      };
                      setPreview({ entry: previewEntry, video: uploadedVideo });
                    }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-blue-400"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <button
                      aria-label="Remove video"
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-500 text-xl font-extrabold drop-shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedVideo("");
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom row: pill options */}
          <div className="flex justify-between items-center gap-2 px-3 pb-3">
            <div className="flex flex-col gap-2">
              {/* Mode and Model Info */}
              {/* <div className="flex items-center gap-3 text-xs text-white/60">
                <span className="px-2 py-1 bg-white/10 rounded-md">
                  {generationMode === "image_to_video" ? "Image → Video" : "Video → Video"}
                </span>
                <span className="px-2 py-1 bg-white/10 rounded-md">
                  Model: {selectedModel === "gen4_turbo" ? "Gen-4 Turbo" : 
                          selectedModel === "gen3a_turbo" ? "Gen-3a Turbo" : 
                          selectedModel === "gen4_aleph" ? "Gen-4 Aleph" : selectedModel}
                </span>
              </div> */}
              


              {/* Dropdowns */}
              <div className="flex items-center gap-2">
                <VideoModelsDropdown 
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  generationMode={generationMode}
                />

                {/* Dynamic Controls Based on Model Capabilities */}
                {(() => {
                  // Fixed Models: T2V-01, I2V-01, S2V-01 - No dropdowns, fixed 720P, 6s
                  if (selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
                    return (
                      <>
                        {/* Fixed Resolution Display */}
                        <div className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                          <TvMinimalPlay className="w-4 h-4 mr-1" />
                          720P (Fixed)
                        </div>
                        {/* Fixed Duration Display */}
                        <div className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                          <Clock className="w-4 h-4 mr-1" />
                          6s (Fixed)
                        </div>
                      </>
                    );
                  }
                  
                  // Runway Models: Full customization
                  if (!selectedModel.includes("MiniMax")) {
                    return (
                      <>
                        {/* Aspect Ratio - Always shown for Runway models */}
                        <VideoFrameSizeDropdown 
                          selectedFrameSize={frameSize}
                          onFrameSizeChange={setFrameSize}
                          selectedModel={selectedModel}
                        />
                        {/* Duration - For image→video and text→video modes */}
                        {(generationMode === "image_to_video" || generationMode === "text_to_video") && (
                          <VideoDurationDropdown 
                            selectedDuration={duration}
                            onDurationChange={setDuration}
                          />
                        )}
                      </>
                    );
                  }
                  
                  // MiniMax-Hailuo-02: Configurable resolution and duration
                  if (selectedModel === "MiniMax-Hailuo-02") {
                    return (
                      <>
                        {/* MiniMax-Hailuo-02: Configurable resolution and duration */}
                        {selectedModel === "MiniMax-Hailuo-02" && (
                          <>
                            {/* Resolution Control */}
                            <div className="relative dropdown-container">
                              <button
                                onClick={() => setResolutionDropdownOpen(!resolutionDropdownOpen)}
                                className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
                                  selectedResolution !== '1080P' 
                                    ? 'bg-white text-black' 
                                    : 'bg-transparent text-white/90 hover:bg-white/5'
                                }`}
                              >
                                <TvMinimalPlay className="w-4 h-4 mr-1" />
                                {selectedResolution}
                              </button>
                              {resolutionDropdownOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-32 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                                  <button
                                    onClick={() => {
                                      setSelectedResolution("512P");
                                      setResolutionDropdownOpen(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left transition text-[13px] ${
                                      selectedResolution === "512P" ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                    }`}
                                  >
                                    512P
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedResolution("768P");
                                      setResolutionDropdownOpen(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left transition text-[13px] ${
                                      selectedResolution === "768P" ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                    }`}
                                  >
                                    768P
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedResolution("1080P");
                                      setResolutionDropdownOpen(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left transition text-[13px] ${
                                      selectedResolution === "1080P" ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                    }`}
                                  >
                                    1080P
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Duration Control */}
                            <div className="relative dropdown-container">
                              <button
                                onClick={() => setDurationDropdownOpen(!durationDropdownOpen)}
                                className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
                                  selectedMiniMaxDuration !== 6 
                                    ? 'bg-white text-black' 
                                    : 'bg-transparent text-white/90 hover:bg-white/5'
                                }`}
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                {selectedMiniMaxDuration}s
                              </button>
                              {durationDropdownOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-32 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                                  <button
                                    onClick={() => {
                                      setSelectedMiniMaxDuration(6);
                                      setDurationDropdownOpen(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left transition text-[13px] ${
                                      selectedMiniMaxDuration === 6 ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                    }`}
                                  >
                                    6s
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedMiniMaxDuration(10);
                                      setDurationDropdownOpen(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left transition text-[13px] ${
                                      selectedMiniMaxDuration === 10 ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                    }`}
                                  >
                                    10s
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}


                      </>
                    );
                  }
                  
                  return null;
                })()}


              </div>


            </div>

            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setGenerationMode("text_to_video")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  generationMode === "text_to_video"
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Text→Video
              </button>
              <button
                onClick={() => setGenerationMode("image_to_video")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  generationMode === "image_to_video"
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Image→Video
              </button>
              <button
                onClick={() => setGenerationMode("video_to_video")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  generationMode === "video_to_video"
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Video→Video
              </button>
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <VideoPreviewModal
          preview={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
};

export default InputBox;
