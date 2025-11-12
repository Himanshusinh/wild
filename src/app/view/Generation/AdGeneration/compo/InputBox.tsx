"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadMoreHistory } from '@/store/slices/historySlice';
import useHistoryLoader from '@/hooks/useHistoryLoader';
import { uploadGeneratedImages } from '@/lib/imageUpload';
import { BackendPromptV1 } from '@/types/backendPrompt';
import AdImagePreview from './AdImagePreview';
import AdvancedManualForm from './AdvancedManualForm';
import { bflGenerate, runwayVideo } from '@/store/slices/generationsApi';
import { waitForRunwayVideoCompletion } from '@/lib/runwayVideoService';
import WildMindLogoGenerating from '@/app/components/WildMindLogoGenerating';
// setFilters/clearHistory no longer needed with unified loader
import { useIntersectionObserverForRef } from '@/hooks/useInfiniteGenerations';

const AdGenerationInputBox: React.FC = () => {
  const dispatch = useAppDispatch();
  const [prompt, setPrompt] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);
  const [script, setScript] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [engine, setEngine] = useState<'veo3_fast' | 'veo3'>('veo3_fast');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [generateAudio, setGenerateAudio] = useState<boolean>(true);
  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);
  const [previewEntry, setPreviewEntry] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const inputEl = useRef<HTMLTextAreaElement>(null);

  const history = useAppSelector((state) => state.history.entries);
  const hasMore = useAppSelector((state) => state.history.hasMore);
  const loading = useAppSelector((state) => state.history.loading);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasUserScrolledRef = useRef(false); // gating until user scrolls
  const loadLockRef = useRef(false);

  // Filter history for ad generation (read-only)
  const adGenerationHistory = history.filter(entry => entry.generationType === 'ad-generation');

  // Group entries by date
  const groupedByDate = adGenerationHistory.reduce((groups: { [key: string]: any[] }, entry: any) => {
    const date = new Date(entry.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  useEffect(() => {
    // Mark user scroll to prevent auto-triggering IO before user interacts
    const onScroll = () => { hasUserScrolledRef.current = true; };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onScroll, { passive: true });
    window.addEventListener('touchmove', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll as any);
      window.removeEventListener('wheel', onScroll as any);
      window.removeEventListener('touchmove', onScroll as any);
    };
  }, []);

  // Unified initial load for ad-generation
  const { refresh: refreshHistoryDebounced } = useHistoryLoader({ generationType: 'ad-generation', initialLimit: 10 });

  // Standardized infinite scroll using shared hook
  useIntersectionObserverForRef(
    sentinelRef,
    async () => {
      try {
        await (dispatch as any)(loadMoreHistory({ filters: { generationType: 'ad-generation' }, paginationParams: { limit: 10 } })).unwrap();
      } catch (e: any) {
        // Only log a compact INF_SCROLL-tagged error; hook already logs lifecycle
        console.log('[INF_SCROLL] ad loadMore error', e?.message || e);
      }
    },
    hasMore,
    loading,
    {
      root: null,
      rootMargin: '0px 0px 400px 0px',
      threshold: 0.1,
      requireUserScrollRef: hasUserScrolledRef,
    }
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProductImage(file);
    }
  };

  const handleGenerate = async () => {
    if (!productImage || !script.trim()) {
      console.error('Please upload a product image and enter a script');
      return;
    }

    console.group('UGC Auto Flow');
    console.time('UGC Auto Flow Total');
    console.log('[INIT] Engine:', engine, '| Resolution:', resolution, '| Duration: 8s | Generate Audio:', generateAudio);

    setIsGeneratingLocal(true);

    try {
      // Convert image to base64 data URI (only for prompt scaffolding/playback checks)
      const imageToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      console.time('[STEP 0] Convert image to base64');
      const imageDataUri = await imageToBase64(productImage);
      console.timeEnd('[STEP 0] Convert image to base64');
      console.log('[IMAGE] Data URI length:', imageDataUri.length);

      // Step 1: Analyze the image (placeholder -> bfl text generation)
      console.log('[STEP 1] Analyzing product image...');
      console.time('[STEP 1] analyze-image');
      {
        const { getIsPublic } = await import('@/lib/publicFlag');
        const isPublic = await getIsPublic();
        await dispatch(bflGenerate({ prompt: `Analyze product image for ad generation.`, model: 'flux-kontext-pro', n: 1, frameSize: '1:1', isPublic })).unwrap();
      }
      console.timeEnd('[STEP 1] analyze-image');

      // Step 2: Generate prompts (placeholder -> bfl text generation)
      console.log('[STEP 2] Generating prompts...');
      console.time('[STEP 2] generate-prompts');
      {
        const { getIsPublic } = await import('@/lib/publicFlag');
        const isPublic = await getIsPublic();
        await dispatch(bflGenerate({ prompt: `Create ad prompts for: ${script.trim()}. Requests: ${specialRequests}`, model: 'flux-kontext-pro', n: 1, frameSize: '1:1', isPublic })).unwrap();
      }
      console.timeEnd('[STEP 2] generate-prompts');

      // Step 3: Submit video generation via Runway thunk
      console.log('[STEP 3] Submitting to video generation (Runway)...');
      console.time('[STEP 3] runway/video');
      const { getIsPublic } = await import('@/lib/publicFlag');
      const isPublic = await getIsPublic();
      const submitJson = await dispatch(runwayVideo({
        mode: 'text_to_video',
        textToVideo: { promptText: script.trim(), ratio: '1280:720' },
        isPublic
      })).unwrap();
      console.timeEnd('[STEP 3] runway/video');
      const taskId: string | undefined = submitJson?.taskId;
      if (!taskId) {
        throw new Error('Missing taskId from submission');
      }
      console.log('[STEP 3] Submitted. taskId=', taskId);

      // Poll status until completion
      console.time('[STEP 3a] Poll status');
      const finalStatus = await waitForRunwayVideoCompletion(taskId);
      console.timeEnd('[STEP 3a] Poll status');

      const videoUrl = finalStatus?.output?.[0];
      if (!videoUrl) {
        throw new Error('No video URL in result');
      }

      // Create the generated video object (for UI playback or upload, not history)
      const generatedVideo = {
        id: `ad-video-${Date.now()}`,
        url: videoUrl,
        originalUrl: videoUrl,
      };

      // Optional: verify download
      console.time('[STEP 3c] Download video');
      try {
        const fileResp = await fetch(generatedVideo.url);
        if (!fileResp.ok) {
          throw new Error(`HTTP ${fileResp.status}: ${fileResp.statusText}`);
        }
        const blob = await fileResp.blob();
        console.log('[STEP 3c] Downloaded video blob:', { size: blob.size, type: blob.type });
        if (blob.size < 1000) throw new Error('Video file too small, likely corrupted');
      } catch (e) {
        console.error('[STEP 3c] Video download failed:', e);
        throw new Error(`Video download verification failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
      console.timeEnd('[STEP 3c] Download video');

      // Upload to Firebase only for a stable playback URL if needed (does not write history)
      await uploadGeneratedImages([generatedVideo]);

      // Refresh history from backend (read-only)
  refreshHistoryDebounced();

      console.log('[DONE] UGC ad generated successfully (Runway).');
      console.timeEnd('UGC Auto Flow Total');
      console.groupEnd();
      setScript('');
      setProductImage(null);

    } catch (error: any) {
      console.error('Error generating ad:', error);
      console.groupEnd();
      // No client history writes on failure; rely on backend records
    } finally {
      setIsGeneratingLocal(false);
    }
  };

  // Handle manual mode submission (no client history writes)
  const handleManualSubmit = async (backendPrompt: BackendPromptV1) => {
    if (!productImage) {
      console.error('Please upload a product image first');
      return;
    }

    setIsGeneratingLocal(true);

    try {
      const { getIsPublic } = await import('@/lib/publicFlag');
      const isPublic = await getIsPublic();
      const submit = await dispatch(runwayVideo({
        mode: 'text_to_video',
        textToVideo: { promptText: backendPrompt.script?.hook || 'Ad video', ratio: '1280:720' },
        isPublic
      })).unwrap();
      const taskId: string | undefined = submit?.taskId;
      if (!taskId) throw new Error('Missing taskId for manual mode');

      const finalStatus = await waitForRunwayVideoCompletion(taskId);
      const videoUrl = finalStatus?.output?.[0];
      if (!videoUrl) throw new Error('No video URL returned');

      const generatedVideo = { id: `ad-video-${Date.now()}`, url: videoUrl, originalUrl: videoUrl };
      await uploadGeneratedImages([generatedVideo]);

      // Refresh history from backend after completion
  refreshHistoryDebounced();

      console.log('Manual mode video generated successfully!');
      setShowManualForm(false);

    } catch (error: any) {
      console.error('Error in manual mode:', error);
      // No client history writes on failure
    } finally {
      setIsGeneratingLocal(false);
    }
  };

  const canGenerate = productImage && script.trim() && !isGeneratingLocal;

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = Math.min(element.scrollHeight, 96) + 'px';
  };

  // Removed local loadMoreHistoryHandler in favor of standardized hook logic.

  return (
    <>
      {/* History Section - Fixed overlay like video generation */}
      {adGenerationHistory.length > 0 && (
        <div className="fixed inset-0 pt-[62px] pl-[68px] pr-6 pb-6 overflow-y-auto z-30">
          <div className="p-6">
            {/* History Header - Fixed during scroll */}
            <div className="sticky top-0 z-10 mb-6 bg-black/80 backdrop-blur-sm py-4 -mx-6 px-6 border-b border-white/10">
              <h2 className="text-white text-xl font-semibold">Ad Generation History</h2>
            </div>

            {/* Main Loader */}
            {loading && adGenerationHistory.length === 0 && (
              <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center gap-4">
                  <WildMindLogoGenerating 
                    running={true}
                    size="lg"
                    speedMs={1600}
                    className="mx-auto"
                  />
                  <div className="text-white text-lg text-center">Loading your ad generation history...</div>
                </div>
              </div>
            )}

            {/* History Entries - Grouped by Date */}
            <div className="space-y-8">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-4">
                  {/* Date Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-white/60"
                      >
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-white/70">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </h3>
                  </div>

                  {/* All Ad Videos for this Date - Horizontal Layout */}
                  <div className="flex flex-wrap gap-3 ml-9">
                    {groupedByDate[date].map((entry: any) => 
                      (entry.images || []).map((video: any) => (
                        <div
                          key={`${entry.id}-${video.id}`}
                          data-ad-video-id={`${entry.id}-${video.id}`}
                          onClick={() => {
                            setPreviewEntry(entry);
                            setShowPreview(true);
                          }}
                          className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                        >
                          {entry.status === "generating" ? (
                            // Loading frame
                            <div className="w-full h-full flex items-center justify-center bg-black/90">
                              <div className="flex flex-col items-center gap-2">
                                <WildMindLogoGenerating 
                                  running={entry.status === 'generating'}
                                  size="md"
                                  speedMs={1600}
                                  className="mx-auto"
                                />
                                <div className="text-xs text-white/60 text-center">
                                  Generating...
                                </div>
                              </div>
                            </div>
                          ) : entry.status === "failed" ? (
                            // Error frame
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                              <div className="flex flex-col items-center gap-2">
                                <svg
                                  width="20"
                                  height="20"
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
                            // Completed ad video - Show actual video preview with shimmer loading
                            <div className="relative w-full h-full">
                              <video
                                src={video.url}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                muted
                                preload="metadata"
                                onLoadedData={() => {
                                  // Remove shimmer when video loads
                                  setTimeout(() => {
                                    const shimmer = document.querySelector(`[data-ad-video-id="${entry.id}-${video.id}"] .shimmer`) as HTMLElement;
                                    if (shimmer) {
                                      shimmer.style.opacity = '0';
                                    }
                                  }, 100);
                                }}
                              />
                              {/* Shimmer loading effect */}
                              <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                              
                              {/* Play button overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                              
                              {/* Ad video label */}
                              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                                <span className="text-xs text-white">Ad</span>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}

              {/* Loader for scroll loading */}
              {hasMore && loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <WildMindLogoGenerating 
                      running={loading}
                      size="md"
                      speedMs={1600}
                      className="mx-auto"
                    />
                    <div className="text-sm text-white/60">Loading more generations...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Input Box */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[840px] z-[60]">
        <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          {/* Top row: prompt + actions */}
          <div className="flex items-center gap-3 p-3">
            <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
                             <textarea
                 ref={inputEl}
                 placeholder="Enter your UGC script (themes, benefits, story, CTA)..."
                 value={script}
                 onChange={(e) => {
                   const incoming = e.target.value;
                   const limited = incoming.split('\n').slice(0, 3).join('\n');
                   setScript(limited);
                   adjustTextareaHeight(e.target);
                 }}
                 className={`flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-relaxed resize-none overflow-y-auto transition-all duration-200 ${
                   script ? 'text-white' : 'text-white/70'
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
              
              {/* Product Image Upload */}
              <label className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="opacity-90 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

                         <div className="flex flex-col items-end gap-2">
               <div className="flex items-center gap-2">
                                   <button
                    onClick={() => setShowManualForm(true)}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-full text-[13px] font-medium transition border border-white/20"
                  >
                    Advanced Manual
                  </button>
                 <button
                   onClick={handleGenerate}
                   disabled={!canGenerate}
                   className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
                 >
                   {isGeneratingLocal ? "Generating..." : "Generate"}
                 </button>
               </div>
             </div>
          </div>

                     {/* Bottom row: pill options */}
           <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
             {/* Model Dropdown */}
             <div className="relative dropdown-container">
               <button
                 onClick={() => setEngine(engine === 'veo3_fast' ? 'veo3' : 'veo3_fast')}
                 className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
               >
                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
                 {engine === 'veo3_fast' ? 'Veo3 Fast' : 'Veo3'}
               </button>
             </div>

             {/* Resolution Dropdown */}
             <div className="relative dropdown-container">
               <button
                 onClick={() => setResolution(resolution === '720p' ? '1080p' : '720p')}
                 className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
               >
                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a2 2 0 012-2h2a2 2 0 012 2v4m2 0V4a2 2 0 012-2h2a2 2 0 012 2v4m-6 0h12m-6 0v12" />
                 </svg>
                 {resolution}
               </button>
             </div>

             {/* Audio Dropdown */}
             <div className="relative dropdown-container">
               <button
                 onClick={() => setGenerateAudio(!generateAudio)}
                 className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
               >
                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                 </svg>
                 {generateAudio ? 'Audio: On' : 'Audio: Off'}
               </button>
             </div>

             {/* Duration Display (Fixed at 8s for FAL AI Veo3) */}
             <div className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-black flex items-center gap-1">
               <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               8 seconds
             </div>

             {/* Special Requests Input */}
             <div className="relative">
               <input
                 type="text"
                 placeholder="Special requests (tone, setting)..."
                 value={specialRequests}
                 onChange={(e) => setSpecialRequests(e.target.value)}
                 className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/50 focus:ring-white/30 transition"
               />
             </div>

             {/* Product Image Display */}
             {productImage && (
               <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                 <img
                   src={URL.createObjectURL(productImage)}
                   alt="Product"
                   className="w-6 h-6 object-cover rounded"
                 />
                 <span className="text-xs text-white/80">{productImage.name}</span>
                 <button
                   onClick={() => setProductImage(null)}
                   className="text-white/60 hover:text-white/80 text-xs"
                 >
                   ×
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>

             {/* Preview Modal */}
       {showPreview && previewEntry && (
         <AdImagePreview
           entry={previewEntry}
           onClose={() => {
             setShowPreview(false);
             setPreviewEntry(null);
           }}
         />
       )}

       {/* Advanced Manual Form Modal */}
       {showManualForm && (
         <AdvancedManualForm
           onSubmit={handleManualSubmit}
           onCancel={() => setShowManualForm(false)}
           productImage={productImage}
           isGenerating={isGeneratingLocal}
         />
       )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} style={{ height: 1 }} />
     </>
   );
 };

export default AdGenerationInputBox;
