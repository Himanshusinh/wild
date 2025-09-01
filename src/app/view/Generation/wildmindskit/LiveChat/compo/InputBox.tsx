"use client";

import React, { useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setPrompt, setUploadedImages, setSelectedModel, generateImages, setLastGeneratedImages } from "@/store/slices/generationSlice";
import { addNotification } from "@/store/slices/uiSlice";
import { addHistoryEntry, updateHistoryEntry } from "@/store/slices/historySlice";
import { HistoryEntry } from "@/types/history";
import Image from "next/image";
import LiveChatModelsDropdown from "./LiveChatModelsDropdown";
import { useEffect } from 'react';

const LiveChatInputBox: React.FC = () => {
  const dispatch = useAppDispatch();
  const prompt = useAppSelector((state: any) => state.generation?.prompt || "");
  const uploadedImages = useAppSelector((state: any) => state.generation?.uploadedImages || []);
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || "flux-dev");
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const style = useAppSelector((state: any) => state.generation?.style || 'realistic');
  const inputEl = useRef<HTMLTextAreaElement>(null);
  const historyEntries = useAppSelector((s:any)=> (s.history?.entries || []).filter((e:any)=> e.generationType === 'live-chat'));

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

  // Force allowed models for Live Chat (flux-kontext-pro or flux-kontext-max)
  useEffect(() => {
    const allowed = ["flux-kontext-pro", "flux-kontext-max"];
    if (!allowed.includes(selectedModel)) {
      dispatch(setSelectedModel("flux-kontext-pro"));
    }
  }, [dispatch]);

  // Lock scroll when popup is open
  useEffect(() => {
    if (previewUrl) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [previewUrl]);

  return (
    <>
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
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-500 text-xl font-extrabold drop-shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = uploadedImages.filter((_: string, idx: number) => idx !== i);
                        dispatch(setUploadedImages(next));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <label className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer">
              <Image src="/icons/fileuploadwhite.svg" alt="Attach" width={18} height={18} className="opacity-90" />
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
                  const next = [...uploadedImages, ...urls].slice(0, 4);
                  dispatch(setUploadedImages(next));
                  if (uploadedImages.length === 0 && next.length > 0) {
                    dispatch(setSelectedModel("flux-kontext-pro"));
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
                  // Create a loading history entry for immediate UI feedback
                  const sessionId = `session-${Date.now()}`;
                  const loadingEntry: HistoryEntry = {
                    id: `loading-${Date.now()}`,
                    prompt,
                    model: selectedModel,
                    generationType: 'live-chat',
                    images: [{ id: 'loading-0', url: '', originalUrl: '' }],
                    timestamp: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    imageCount: 1,
                    status: 'generating',
                    frameSize,
                    style,
                    sessionId,
                  };
                  dispatch(addHistoryEntry(loadingEntry));

                  const result = await dispatch(
                    generateImages({
                      prompt,
                      model: selectedModel,
                      imageCount: 1,
                      frameSize,
                      style,
                      generationType: 'live-chat',
                      uploadedImages,
                    })
                  ).unwrap();

                  if (result?.images?.length) {
                    const latest = result.images[0];
                    dispatch(setLastGeneratedImages(result.images));
                    dispatch(setUploadedImages([latest.url]));
                    dispatch(setPrompt(''));
                    setPreviewUrl(latest.url);
                    // Update the loading entry to completed
                    dispatch(updateHistoryEntry({
                      id: loadingEntry.id,
                      updates: {
                        id: result.historyId || loadingEntry.id,
                        status: 'completed',
                        images: result.images,
                        imageCount: result.images.length,
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        sessionId,
                      }
                    }));
                    dispatch(addNotification({ type: 'success', message: 'Image generated. Continuing Live Chat with latest image.' }));
                  }
                } catch (e) {
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
    {/* Generated image popup */}
    {previewUrl && (
      <div
        className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6"
        onClick={() => setPreviewUrl(null)}
      >
        <div
          className="relative bg-black/90 ring-1 ring-white/20 rounded-2xl overflow-hidden max-w-3xl w-full max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button
              onClick={async () => {
                try {
                  const a = document.createElement('a');
                  a.href = previewUrl;
                  a.download = 'generated-image.jpg';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                } catch {}
              }}
              className="px-3 py-1.5 text-xs rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            >
              Download
            </button>
            <button
              onClick={() => setPreviewUrl(null)}
              className="px-3 py-1.5 text-xs rounded-full bg-white text-black hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
          <div className="relative w-full h-[70vh]">
            <Image src={previewUrl} alt="Generated" fill className="object-contain" />
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default LiveChatInputBox;


