"use client";

import React, { useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setPrompt, setUploadedImages, setSelectedModel, setLastGeneratedImages, generateLiveChatImage } from "@/store/slices/generationSlice";
import { addNotification } from "@/store/slices/uiSlice";
import { addAndSaveHistoryEntry } from "@/store/slices/historySlice";
import { HistoryEntry, GeneratedImage, LiveChatMessage } from "@/types/history";
import { saveLiveChatSession } from '@/lib/historyService';
import { ensureSessionReady } from '@/lib/axiosInstance';
import Image from "next/image";
import { Trash2 } from 'lucide-react';
import LiveChatModelsDropdown from "./LiveChatModelsDropdown";
import WildMindLogoGenerating from "@/app/components/WildMindLogoGenerating";
import { useEffect } from 'react';
// Live chat persistence will be handled by backend history endpoints

const LiveChatInputBox: React.FC = () => {
  const dispatch = useAppDispatch();
  const prompt = useAppSelector((state: any) => state.generation?.prompt || "");
  const uploadedImages = useAppSelector((state: any) => state.generation?.uploadedImages || []);
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || "flux-dev");
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const style = useAppSelector((state: any) => state.generation?.style || 'none');
  const inputEl = useRef<HTMLTextAreaElement>(null);
  const historyEntries = useAppSelector((s:any)=> (s.history?.entries || []).filter((e:any)=> e.generationType === 'live-chat'));

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null);
  const [overlayOpen, setOverlayOpen] = React.useState<boolean>(false);
  const [sessionImages, setSessionImages] = React.useState<GeneratedImage[]>([]);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const stripRef = React.useRef<HTMLDivElement>(null);
  const [liveChatDocId, setLiveChatDocId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<LiveChatMessage[]>([]);
  
  // State for current generation preview
  const [currentGeneration, setCurrentGeneration] = React.useState<{
    prompt: string;
    status: 'generating' | 'completed' | 'failed';
    images: GeneratedImage[];
  } | null>(null);

  // Note: We prefer using direct URLs for reference images to keep requests small and fast

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

  // Force allowed models for Live Chat (include Nano Banana)
  useEffect(() => {
    const allowed = ["flux-kontext-pro", "flux-kontext-max", "gemini-25-flash-image"];
    if (!allowed.includes(selectedModel)) {
      dispatch(setSelectedModel("flux-kontext-pro"));
    }
  }, [dispatch]);

  // Lock scroll when overlay is open
  useEffect(() => {
    if (overlayOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [overlayOpen]);

  // Auto-scroll the strip to the left when new images arrive (newest first)
  useEffect(() => {
    if (stripRef.current) {
      stripRef.current.scrollLeft = 0;
    }
  }, [sessionImages.length]);

  // Clear current generation after completion with delay
  useEffect(() => {
    if (currentGeneration?.status === 'completed') {
      const timer = setTimeout(() => {
        setCurrentGeneration(null);
      }, 2000); // Clear after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [currentGeneration?.status]);

  return (
    <>
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[840px] z-70">
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
              style={{ minHeight: '24px', maxHeight: '96px', lineHeight: '1.2' }}
            />

            {/* Previews just to the left of upload */}
            {uploadedImages.length > 0 && (
              <div className="flex items-center gap-1.5 pr-1">
                {uploadedImages.map((u: string, i: number) => (
                  <div key={i} className="relative w-12 h-12 rounded-md overflow-hidden ring-1 ring-white/20 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt={`ref-${i}`} className="w-full h-full object-cover transition-opacity group-hover:opacity-30" />
                    <button
                      aria-label="Remove reference"
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 drop-shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = uploadedImages.filter((_: string, idx: number) => idx !== i);
                        dispatch(setUploadedImages(next));
                        if (next.length === 0) {
                          setCurrentSessionId(null);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <label className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer">
              <Image src="/icons/fileupload.svg" alt="Attach" width={18} height={18} className="opacity-90" />
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
                  // Start a NEW session on any fresh upload selection
                  const next = urls.slice(0, 4);
                  dispatch(setUploadedImages(next));
                  if (next.length > 0) {
                    dispatch(setSelectedModel("flux-kontext-pro"));
                    setCurrentSessionId(`session-${Date.now()}`);
                  }
                  if (inputEl) inputEl.value = "";
                }}
              />
            </label>
          </div>

          {/* Generate button - stub for now */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={async () => {
                if (uploadedImages.length === 0) {
                  dispatch(addNotification({ type: 'error', message: 'Please upload at least one image for Live Chat.' }));
                  return;
                }
                try {
                  // Ensure session is ready before making API calls
                  const sessionReady = await ensureSessionReady();
                  if (!sessionReady) {
                    dispatch(addNotification({ type: 'error', message: 'Please wait for authentication to complete and try again.' }));
                    return;
                  }

                  // Ensure session and open process overlay
                  const sessionId = currentSessionId ?? `session-${Date.now()}`;
                  if (!currentSessionId) setCurrentSessionId(sessionId);
                  if (!overlayOpen) setOverlayOpen(true);
                  setIsProcessing(true);
                  
                  // Set current generation state for preview
                  setCurrentGeneration({
                    prompt: prompt,
                    status: 'generating',
                    images: []
                  });
                  
                  // As soon as processing starts, make sure the viewport shows the first tile (spinner)
                  setTimeout(() => {
                    if (stripRef.current) stripRef.current.scrollLeft = 0;
                  }, 0);

                  console.log('[LiveChat] generate click', {
                    selectedModel,
                    sessionId,
                    frameSize,
                    uploadedImagesCount: uploadedImages.length,
                  });
                  const result = await dispatch(
                    generateLiveChatImage({
                      prompt,
                      model: selectedModel,
                      frameSize,
                      uploadedImages,
                    })
                  ).unwrap();
                  console.log('[LiveChat] generation result', {
                    from: 'live-chat',
                    requestId: (result as any)?.requestId || (result as any)?.historyId,
                    imagesCount: (result as any)?.images?.length,
                    firstUrl: (result as any)?.images?.[0]?.url,
                  });

                  if (result?.images?.length) {
                    const latest = result.images[0];
                    dispatch(setLastGeneratedImages(result.images));
                    // Use the resulting image URL as the next reference
                    dispatch(setUploadedImages([latest.url]));
                    // Queue behavior: newest images first
                    setSessionImages((prev) => [...result.images, ...prev]);
                    // Record this prompt -> images as one live chat message in overlay state
                    const msg: LiveChatMessage = { prompt, images: result.images, timestamp: new Date().toISOString() };
                    setMessages(prev => [msg, ...prev]);
                    
                    // Save each generation to history immediately with the same sessionId
                    const now = new Date().toISOString();
                    const historyEntry: HistoryEntry = {
                      id: `livechat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      prompt: prompt,
                      model: selectedModel,
                      generationType: 'live-chat',
                      images: result.images,
                      timestamp: now,
                      createdAt: now,
                      imageCount: result.images.length,
                      status: 'completed',
                      frameSize,
                      style,
                      sessionId: sessionId, // Use the same sessionId for all generations in this session
                    };
                    dispatch(addAndSaveHistoryEntry(historyEntry));
                    
                    // Update current generation state to completed
                    setCurrentGeneration({
                      prompt: prompt,
                      status: 'completed',
                      images: result.images
                    });
                    
                    setIsProcessing(false);
                    dispatch(addNotification({ type: 'success', message: 'Image generated. Continuing Live Chat with latest image.' }));
                  }
                  // Ensure overlay stays open and strip scrolls to the end after state update
                  setTimeout(() => {
                    if (stripRef.current) stripRef.current.scrollLeft = 0;
                  }, 0);
                } catch (e) {
                  // Update current generation state to failed
                  setCurrentGeneration({
                    prompt: prompt,
                    status: 'failed',
                    images: []
                  });
                  
                  setIsProcessing(false);
                  dispatch(addNotification({ type: 'error', message: e instanceof Error ? e.message : 'Generation failed' }));
                }
              }}
              disabled={!prompt.trim()}
              className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Bottom row: only model selector for Live Chat */}
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          <LiveChatModelsDropdown />
        </div>
      </div>
    </div>
    {/* Live chat process overlay (keeps input visible above) */}
    {overlayOpen && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl">
        <div className="absolute inset-0 flex items-start justify-center p-6 pt-16 pb-[140px]">
          <div className="relative bg-transparent max-w-[95vw] w-full px-2 py-2">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white/80 text-sm flex items-center gap-2">
                <span>Live Chat session</span>
                {isProcessing && (
                  <span className="inline-flex items-center gap-2 text-white/70">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                    {/* <span className="text-xs">Generating…</span> */}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (sessionImages.length === 0) { setOverlayOpen(false); return; }
                    const now = new Date().toISOString();
                    const entry: HistoryEntry = {
                      id: `livechat-${Date.now()}`,
                      prompt: prompt,
                      model: selectedModel,
                      generationType: 'live-chat',
                      images: sessionImages,
                      timestamp: now,
                      createdAt: now,
                      imageCount: sessionImages.length,
                      status: 'completed',
                      frameSize,
                      style,
                      sessionId: currentSessionId || `session-${Date.now()}`,
                    };
                    dispatch(addAndSaveHistoryEntry(entry));
                    // Persist a consolidated Live Chat session document
                    (async () => {
                      try {
                        const sessionId = currentSessionId || `session-${Date.now()}`;
                        const payload = {
                          sessionId,
                          model: selectedModel,
                          frameSize,
                          style,
                          startedAt: messages[messages.length - 1]?.timestamp || now,
                          completedAt: now,
                          status: 'completed' as const,
                          messages: [...messages].reverse(), // oldest -> newest
                          totalImages: sessionImages.length,
                        };
                        // Always create a consolidated session document per Done
                        const id = await saveLiveChatSession(payload);
                        setLiveChatDocId(id);
                      } catch (e) {
                        console.error('Failed to persist live chat session:', e);
                      }
                    })();
                    setOverlayOpen(false);
                    setSessionImages([]);
                    setMessages([]);
                  }}
                  className="px-3 py-1.5 text-xs rounded-full bg-white text-black hover:bg-gray-200 transition"
                >
                  Done
                </button>
              </div>
            </div>
             <div ref={stripRef} className="w-full overflow-x-auto custom-scrollbar">
               <div className="flex flex-row items-center gap-3 pb-2 justify-start">
                {/* Current generation preview */}
                {currentGeneration && (
                  <div className="relative w-[60vw] h-[60vw] md:w-[40vh] md:h-[40vh] lg:w-[40vh] lg:h-[40vh] rounded-xl overflow-hidden bg-black/30 flex-shrink-0">
                    {currentGeneration.status === 'generating' ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="flex flex-col items-center gap-2 p-4">
                          <WildMindLogoGenerating 
                            running={true}
                            size="md"
                            speedMs={1600}
                            className="mx-auto"
                          />
                          <div className="text-xs text-white/60 text-center">Generating...</div>
                          {/* <div className="text-xs text-white/40 text-center max-w-full truncate px-2">
                            "{currentGeneration.prompt}"
                          </div> */}
                        </div>
                      </div>
                    ) : currentGeneration.status === 'failed' ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                        <div className="flex flex-col items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          <div className="text-xs text-red-400">Failed</div>
                        </div>
                      </div>
                    ) : currentGeneration.images.length > 0 ? (
                      <div className="relative w-full h-full group">
                        <Image 
                          src={currentGeneration.images[0].url} 
                          alt="Generated image" 
                          fill 
                          className="object-cover transition-opacity duration-300" 
                          sizes="40vh"
                          onLoad={() => {
                            // Smooth fade-in effect
                            const img = document.querySelector(`[alt="Generated image"]`) as HTMLElement;
                            if (img) {
                              img.style.opacity = '1';
                            }
                          }}
                          style={{ opacity: 0 }}
                        />
                        {/* Shimmer loading effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 animate-pulse" />
                      </div>
                    ) : null}
                  </div>
                )}
                
                {/* Session images */}
                {sessionImages.map((img, idx) => (
                  <div key={`${img.id || 'img'}-${idx}-${img.url}`} className="relative w-[60vw] h-[60vw] md:w-[40vh] md:h-[40vh] lg:w-[40vh] lg:h-[40vh] rounded-xl overflow-hidden bg-black/70 flex-shrink-0">
                    <Image src={img.url} alt="generated" fill className="object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default LiveChatInputBox;


