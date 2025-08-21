"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { HistoryEntry } from "@/types/history";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { addHistoryEntry } from "@/store/slices/historySlice";
import { addNotification } from "@/store/slices/uiSlice";
import { saveHistoryEntry, updateHistoryEntry as updateFirebaseHistory } from "@/lib/historyService";
import { waitForRunwayVideoCompletion } from "@/lib/runwayVideoService";
import { buildImageToVideoBody, buildVideoToVideoBody } from "@/lib/videoGenerationBuilders";
import { VideoGenerationState, GenMode } from "@/types/videoGeneration";

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
  const [generationMode, setGenerationMode] = useState<"image_to_video" | "video_to_video">("image_to_video");
  const [error, setError] = useState("");

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
    };

    return ratioMap[frameSize] || "1280:720"; // Default to 16:9 if no match
  };

  // Auto-adjust textarea height
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 96)}px`;
  };

  // Handle video generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (generationMode === "image_to_video" && uploadedImages.length === 0) {
      setError("Please upload an image for image-to-video generation");
      return;
    }

    if (generationMode === "video_to_video" && !uploadedVideo) {
      setError("Please upload a video for video-to-video generation");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      // Create initial history entry
      const historyData = {
        prompt: prompt,
        model: selectedModel,
        frameSize: frameSize,
        style: "video",
        generationType: "text-to-video" as const,
        imageCount: 1,
        status: "generating" as const,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        images: [],
        generationProgress: { current: 0, total: 100, status: "Starting video generation..." }
      };

      let firebaseHistoryId: string | undefined;
      try {
        firebaseHistoryId = await saveHistoryEntry(historyData);
        console.log('✅ Firebase history entry created with ID:', firebaseHistoryId);
      } catch (firebaseError) {
        console.error('❌ Failed to save to Firebase:', firebaseError);
        dispatch(
          addNotification({
            type: "error",
            message: "Failed to save generation to history",
          })
        );
        return;
      }

      // Convert frameSize to Runway ratio format
      const ratio = convertFrameSizeToRunwayRatio(frameSize);
      console.log('Converted frame size to Runway ratio:', ratio);

      // Call video generation API
      const response = await fetch('/api/runway/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: generationMode,
          imageToVideo: generationMode === "image_to_video" ? {
            model: selectedModel,
            ratio: ratio,
            promptText: prompt,
            duration: duration,
            promptImage: uploadedImages[0] || "",
            contentModeration: { publicFigureThreshold: "auto" }
          } : undefined,
          videoToVideo: generationMode === "video_to_video" ? {
            model: "gen4_aleph",
            ratio: ratio,
            promptText: prompt,
            videoUri: uploadedVideo,
            contentModeration: { publicFigureThreshold: "auto" }
          } : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Video generation failed');
      }

      const result = await response.json();
      
      // Wait for completion
      const finalStatus = await waitForRunwayVideoCompletion(
        result.taskId,
        (progress, status) => {
          console.log('Video generation progress:', progress, status);
          // Update progress in Firebase
          if (firebaseHistoryId) {
            updateFirebaseHistory(firebaseHistoryId, { generationProgress: progress });
          }
        }
      );

      // Update history with final status
      if (firebaseHistoryId && finalStatus.output) {
        await updateFirebaseHistory(firebaseHistoryId, {
          status: 'completed',
          images: finalStatus.output.map((url: string, index: number) => ({
            id: `${result.taskId}-${index}`,
            url: url,
            originalUrl: url,
            firebaseUrl: url
          })),
          generationProgress: { current: 100, total: 100, status: 'Completed' }
        });
      }

      // Add to local history
      dispatch(
        addHistoryEntry({
          id: firebaseHistoryId || Date.now().toString(),
          prompt: prompt,
          model: selectedModel,
          frameSize: frameSize,
          style: "video",
          generationType: "text-to-video" as const,
          imageCount: 1,
          status: "completed" as const,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          images: finalStatus.output?.map((url: string, index: number) => ({
            id: `${result.taskId}-${index}`,
            url: url,
            originalUrl: url,
            firebaseUrl: url
          })) || [],
          generationProgress: { current: 100, total: 100, status: 'Completed' }
        })
      );

      dispatch(
        addNotification({
          type: "success",
          message: "Video generated successfully!",
        })
      );

      // Clear inputs
      setPrompt("");
      setUploadedImages([]);
      setUploadedVideo("");

    } catch (error: any) {
      console.error('Video generation error:', error);
      setError(error.message || 'Video generation failed');
      
      dispatch(
        addNotification({
          type: "error",
          message: error.message || "Video generation failed",
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Get history entries for video generation
  const historyEntries = useAppSelector((state: any) => 
    state.history?.entries?.filter((entry: any) => entry.generationType === "text-to-video") || []
  );

  return (
    <>
      {/* History Section */}
      {historyEntries.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Videos</h2>
          </div>
          <div className="space-y-4">
            {historyEntries.map((entry: HistoryEntry) => (
              <div
                key={entry.id}
                className="bg-white/5 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-white font-medium line-clamp-2">
                        {getCleanPrompt(entry.prompt)}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getCleanPrompt(entry.prompt));
                          dispatch(
                            addNotification({
                              type: "success",
                              message: "Prompt copied to clipboard",
                            })
                          );
                        }}
                        className="p-1 rounded hover:bg-white/10 transition"
                        title="Copy prompt"
                      >
                        <svg
                          width="16"
                          height="16"
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
                        {entry.images.length} video
                        {entry.images.length !== 1 ? "s" : ""}
                      </span>
                      {entry.frameSize && (
                        <span className="text-blue-400">
                          {entry.frameSize}
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

                  {/* Videos Grid - Smaller Size */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 ml-9">
                    {entry.images.map((video: any) => (
                      <div
                        key={video.id}
                        onClick={() => setPreview({ entry, video })}
                        className="relative aspect-video rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group"
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
                          // Completed video
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="text-blue-400"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                              <div className="text-xs text-blue-400">Video</div>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Box */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[840px] z-[60]">
        <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          {/* Top row: prompt + actions */}
          <div className="flex items-center gap-3 p-3">
            <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
              <textarea
                ref={inputEl}
                placeholder="Type your video prompt..."
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
              
              {/* Mode Toggle */}
              <div className="flex bg-white/10 rounded-lg p-1">
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

              {/* File Upload */}
              {generationMode === "image_to_video" ? (
                // Image upload for image-to-video
                <label className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer">
                  <Image
                    src="/icons/fileuploadwhite.svg"
                    alt="Attach Image"
                    width={18}
                    height={18}
                    className="opacity-90"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const inputEl = e.currentTarget as HTMLInputElement;
                      const files = Array.from(inputEl.files || []).slice(0, 1);
                      const urls: string[] = [];
                      for (const file of files) {
                        const reader = new FileReader();
                        const asDataUrl: string = await new Promise((res) => {
                          reader.onload = () => res(reader.result as string);
                          reader.readAsDataURL(file);
                        });
                        urls.push(asDataUrl);
                      }
                      setUploadedImages(urls);
                      if (inputEl) inputEl.value = "";
                    }}
                  />
                </label>
              ) : (
                // Video upload for video-to-video
                <label className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="opacity-90"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const inputEl = e.currentTarget as HTMLInputElement;
                      const files = Array.from(inputEl.files || []).slice(0, 1);
                      if (files.length > 0) {
                        const file = files[0];
                        const reader = new FileReader();
                        const asDataUrl: string = await new Promise((res) => {
                          reader.onload = () => res(reader.result as string);
                          reader.readAsDataURL(file);
                        });
                        setUploadedVideo(asDataUrl);
                      }
                      if (inputEl) inputEl.value = "";
                    }}
                  />
                </label>
              )}

              {/* Previews */}
              {generationMode === "image_to_video" && uploadedImages.length > 0 && (
                <div className="flex items-center gap-1.5 pr-1">
                  {uploadedImages.map((u: string, i: number) => (
                    <div
                      key={i}
                      className="relative w-12 h-12 rounded-md overflow-hidden ring-1 ring-white/20 group"
                    >
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
                          setUploadedImages([]);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {generationMode === "video_to_video" && uploadedVideo && (
                <div className="flex items-center gap-1.5 pr-1">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden ring-1 ring-white/20 group">
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
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || 
                  (generationMode === "image_to_video" && uploadedImages.length === 0) ||
                  (generationMode === "video_to_video" && !uploadedVideo)
                }
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
              >
                {isGenerating ? "Generating..." : "Generate Video"}
              </button>
            </div>
          </div>

          {/* Bottom row: pill options */}
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
            <VideoModelsDropdown 
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              generationMode={generationMode}
            />
            <VideoFrameSizeDropdown 
              selectedFrameSize={frameSize}
              onFrameSizeChange={setFrameSize}
              selectedModel={selectedModel}
            />
            {generationMode === "image_to_video" && (
              <VideoDurationDropdown 
                selectedDuration={duration}
                onDurationChange={setDuration}
              />
            )}
          </div>
        </div>
      </div>
      {preview && (
        <VideoPreviewModal
          isOpen={true}
          onClose={() => setPreview(null)}
          videoUrl={preview.video.url}
          prompt={preview.entry.prompt}
          model={preview.entry.model}
          frameSize={preview.entry.frameSize || ""}
          style={preview.entry.style}
          generatedTime={preview.entry.timestamp}
        />
      )}
    </>
  );
};

export default InputBox;
