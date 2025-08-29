"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addHistoryEntry, loadHistory, loadMoreHistory, updateHistoryEntry as updateHistoryEntryAction } from '@/store/slices/historySlice';
import { saveHistoryEntry, updateHistoryEntry } from '@/lib/historyService';
import { uploadGeneratedImages } from '@/lib/imageUpload';
import { BackendPromptV1 } from '@/types/backendPrompt';
import AdImagePreview from './AdImagePreview';
import AdvancedManualForm from './AdvancedManualForm';

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
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<string>>(new Set());
  const [overflowPromptIds, setOverflowPromptIds] = useState<Set<string>>(new Set());
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const promptRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const inputEl = useRef<HTMLTextAreaElement>(null);

  const history = useAppSelector((state) => state.history.entries);
  const hasMore = useAppSelector((state) => state.history.hasMore);
  const loading = useAppSelector((state) => state.history.loading);

  // Filter history for ad generation
  const adGenerationHistory = history.filter(entry => entry.generationType === 'ad-generation');

  useEffect(() => {
    // Load initial history for ad generation
    dispatch(loadHistory({ filters: { generationType: 'ad-generation' } }));
  }, [dispatch]);

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
    let firebaseHistoryId: string | undefined;

    try {
      // Create loading entry with a unique ID
      const entryId = `ad-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const loadingEntry = {
        id: entryId,
        prompt: script.trim(),
        model: 'fal-veo3',
        generationType: 'ad-generation' as const,
        images: [],
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 1,
        status: 'generating' as const,
        frameSize: '16:9',
        style: `${engine === 'veo3_fast' ? 'Veo3 Fast' : 'Veo3'} Image-to-Video`,
      };

      // Add to Redux first
      dispatch(addHistoryEntry(loadingEntry));

      // Save to Firebase and get the Firebase ID
      firebaseHistoryId = await saveHistoryEntry(loadingEntry);
      console.log('[HISTORY] Created Firebase entry with ID:', firebaseHistoryId);

      // Update Redux entry with Firebase ID
      dispatch(updateHistoryEntryAction({ 
        id: entryId, 
        updates: { id: firebaseHistoryId } 
      }));

      // Convert image to base64 data URI
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

      // Step 1: Analyze the image
      console.log('[STEP 1] Analyzing product image...');
      console.time('[STEP 1] /api/ad-gen/analyze-image');
      const analyzeResponse = await fetch('/api/ad-gen/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: imageDataUri }),
      });
      console.timeEnd('[STEP 1] /api/ad-gen/analyze-image');

      if (!analyzeResponse.ok) {
        const errorText = await analyzeResponse.text();
        console.error('[STEP 1] analyze-image failed:', analyzeResponse.status, errorText);
        throw new Error('Failed to analyze image');
      }

      const imageAnalysis = await analyzeResponse.json();
      console.log('[STEP 1] analyze-image result:', imageAnalysis);

      // Step 2: Generate prompts
      console.log('[STEP 2] Generating prompts...');
      const promptsBody = {
        imageAnalysis: imageAnalysis.analysis,
        script: script.trim(),
        specialRequests,
      };
      console.log('[STEP 2] Request body:', promptsBody);
      console.time('[STEP 2] /api/ad-gen/generate-prompts');
      const promptsResponse = await fetch('/api/ad-gen/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptsBody),
      });
      console.timeEnd('[STEP 2] /api/ad-gen/generate-prompts');

      if (!promptsResponse.ok) {
        const errorText = await promptsResponse.text();
        console.error('[STEP 2] generate-prompts failed:', promptsResponse.status, errorText);
        throw new Error('Failed to generate prompts');
      }

      const promptsData = await promptsResponse.json();
      console.log('[STEP 2] prompts result:', promptsData);

      // Preview the final FAL i2v payload (what we would send to Veo3)
      const falI2vPreview = {
        engine,
        payload: {
          prompt: promptsData?.prompts?.video_prompt || script.trim(),
          image_url: imageDataUri,
          duration: '8s',
          generate_audio: generateAudio,
          resolution: resolution
        }
      };
      console.log('[STEP 2] FAL i2v payload preview:', {
        engine: falI2vPreview.engine,
        payload: {
          ...falI2vPreview.payload,
          image_url: `data-uri(${imageDataUri.length} chars)`
        }
      });

      // Step 3: Submit to queue (AUTO MODE)
      console.log('[STEP 3] Submitting to FAL queue (Auto Mode)...');
      const backendPrompt: BackendPromptV1 = {
        mode: 'auto',
        media: { image_url: imageDataUri },
        delivery: {
          engine: engine,
          resolution: resolution,
          duration: '8s',
          generate_audio: generateAudio,
        },
        script: {
          hook: script.trim(),
          body: specialRequests,
          cta: `Check out this amazing product!`
        }
      } as BackendPromptV1;
      console.log('[STEP 3] Request body (/api/ad-gen/generate-video/submit):', {
        ...backendPrompt,
        media: { image_url: `data-uri(${imageDataUri.length} chars)` }
      });
      console.time('[STEP 3] /api/ad-gen/generate-video/submit');
      const submitRes = await fetch('/api/ad-gen/generate-video/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPrompt),
      });
      console.timeEnd('[STEP 3] /api/ad-gen/generate-video/submit');
      if (!submitRes.ok) {
        const errorData = await submitRes.json().catch(() => ({}));
        console.error('[STEP 3] submit failed:', submitRes.status, errorData);
        throw new Error(errorData.error || 'Failed to submit to FAL queue');
      }
      const submitJson = await submitRes.json();
      const requestId: string | undefined = submitJson.requestId;
      if (!requestId) {
        throw new Error('Missing requestId from submit');
      }
      console.log('[STEP 3] Submitted. requestId=', requestId);

      // Step 3a: Poll status
      console.time('[STEP 3a] Poll status');
      let isDone = false;
      let pollAttempts = 0;
      const maxAttempts = 120; // ~4 minutes at 2s interval
      while (!isDone && pollAttempts < maxAttempts) {
        // small delay
        await new Promise(r => setTimeout(r, 2000));
        pollAttempts++;
        try {
          const statusRes = await fetch(`/api/ad-gen/generate-video/status?requestId=${encodeURIComponent(requestId)}&engine=${encodeURIComponent(engine)}`);
          if (!statusRes.ok) {
            const t = await statusRes.text();
            console.warn('[STEP 3a] status non-OK:', statusRes.status, t);
            continue;
          }
          const statusJson = await statusRes.json();
          const currentStatus = statusJson?.status || statusJson?.data?.status;
          const logCount = Array.isArray(statusJson?.logs) ? statusJson.logs.length : (Array.isArray(statusJson?.data?.logs) ? statusJson.data.logs.length : 0);
          console.log('[STEP 3a] queue status:', currentStatus, '| logs:', logCount);
          if (currentStatus === 'COMPLETED' || currentStatus === 'FINISHED' || currentStatus === 'SUCCEEDED' || currentStatus === 'READY') {
            isDone = true;
            break;
          }
          if (currentStatus === 'FAILED' || currentStatus === 'ERROR') {
            throw new Error(`FAL queue status ${currentStatus}`);
          }
        } catch (e) {
          console.warn('[STEP 3a] status check failed:', e);
        }
      }
      console.timeEnd('[STEP 3a] Poll status');
      if (!isDone) {
        throw new Error('FAL job did not complete in time');
      }

      // Step 3b: Fetch result
      console.time('[STEP 3b] /api/ad-gen/generate-video/result');
      const resultRes = await fetch(`/api/ad-gen/generate-video/result?requestId=${encodeURIComponent(requestId)}&engine=${encodeURIComponent(engine)}`);
      console.timeEnd('[STEP 3b] /api/ad-gen/generate-video/result');
      if (!resultRes.ok) {
        const t = await resultRes.text();
        console.error('[STEP 3b] result failed:', resultRes.status, t);
        throw new Error('Failed to fetch FAL result');
      }
      const resultJson = await resultRes.json();
      console.log('[STEP 3b] result json:', resultJson);
      const videoUrl = resultJson?.data?.video?.url || resultJson?.video?.url;
      if (!videoUrl) {
        throw new Error('No video URL in FAL result');
      }

      // Create the generated video object
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
        
        // Validate blob size (should be reasonable for a video)
        if (blob.size < 1000) {
          throw new Error('Video file too small, likely corrupted');
        }
      } catch (e) {
        console.error('[STEP 3c] Video download failed:', e);
        throw new Error(`Video download verification failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
      console.timeEnd('[STEP 3c] Download video');

      // Upload to Firebase
      console.time('[STEP 4] Upload to Firebase');
      const uploadedImages = await uploadGeneratedImages([generatedVideo]);
      console.timeEnd('[STEP 4] Upload to Firebase');

      // Update history entry with completion data
      const completedEntry = {
        ...loadingEntry,
        id: firebaseHistoryId,
        images: uploadedImages,
        status: 'completed' as const,
        timestamp: new Date().toISOString(),
        analysis: imageAnalysis.analysis,
        prompts: promptsData.prompts,
        falRequest: {
          model: 'fal-veo3',
          type: 'image-to-video',
          parameters: promptsData.prompts?.parameters,
        },
        mode: 'auto' as const
      };

      // Update Redux state immediately to show completion
      dispatch(updateHistoryEntryAction({ 
        id: firebaseHistoryId, 
        updates: { 
          status: 'completed', 
          images: uploadedImages, 
          prompts: promptsData.prompts, 
          analysis: imageAnalysis.analysis 
        } 
      }));

      // Update Firebase
      await updateHistoryEntry(firebaseHistoryId, completedEntry);

      console.log('[DONE] UGC ad generated successfully (Auto Mode, queue).');
      console.timeEnd('UGC Auto Flow Total');
      console.groupEnd();
      setScript('');
      setProductImage(null);

    } catch (error: any) {
      console.error('Error generating ad:', error);
      console.groupEnd();
      
      // Update history entry to failed
      if (firebaseHistoryId) {
        try {
          await updateHistoryEntry(firebaseHistoryId, { 
            status: 'failed', 
            error: error.message || 'Unknown error occurred' 
          });
          
          // Also update Redux state
          dispatch(updateHistoryEntryAction({ 
            id: firebaseHistoryId, 
            updates: { 
              status: 'failed', 
              error: error.message || 'Unknown error occurred' 
            } 
          }));
        } catch (updateError) {
          console.error('Failed to update history entry to failed:', updateError);
        }
      }
    } finally {
      setIsGeneratingLocal(false);
    }
  };

  // Handle manual mode submission
  const handleManualSubmit = async (backendPrompt: BackendPromptV1) => {
    if (!productImage) {
      console.error('Please upload a product image first');
      return;
    }

    setIsGeneratingLocal(true);
    let firebaseHistoryId: string | undefined;

    try {
      // Create loading entry with unique ID
      const entryId = `ad-gen-manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const loadingEntry = {
        id: entryId,
        prompt: backendPrompt.script?.hook || backendPrompt.beats?.[0]?.dialogue || 'Manual generation',
        model: 'fal-veo3',
        generationType: 'ad-generation' as const,
        images: [],
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 1,
        status: 'generating' as const,
        frameSize: '16:9',
        style: `Manual Mode - ${backendPrompt.delivery.engine}`,
      };

      // Add to Redux first
      dispatch(addHistoryEntry(loadingEntry));
      
      // Save to Firebase
      firebaseHistoryId = await saveHistoryEntry(loadingEntry);
      console.log('[HISTORY] Created manual Firebase entry with ID:', firebaseHistoryId);

      // Update Redux entry with Firebase ID
      dispatch(updateHistoryEntryAction({ 
        id: entryId, 
        updates: { id: firebaseHistoryId } 
      }));

      // Call manual video API
      console.log('Manual Mode: Calling FAL AI API...');
      const falResponse = await fetch('/api/ad-gen/manual-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPrompt),
      });

      if (!falResponse.ok) {
        const errorData = await falResponse.json();
        throw new Error(errorData.error || 'Failed to generate video with FAL AI');
      }

      const falResult = await falResponse.json();
      
      if (!falResult.video?.url) {
        throw new Error('No video URL received from FAL AI');
      }

      // Create the generated video object
      const generatedVideo = {
        id: `ad-video-${Date.now()}`,
        url: falResult.video.url,
        originalUrl: falResult.video.url,
      };

      // Upload to Firebase
      const uploadedImages = await uploadGeneratedImages([generatedVideo]);

      // Update history entry
      const completedEntry = {
        ...loadingEntry,
        id: firebaseHistoryId,
        images: uploadedImages,
        status: 'completed' as const,
        timestamp: new Date().toISOString(),
        backendPrompt: backendPrompt,
        compiledPrompt: falResult.compiled_prompt,
        falRequest: {
          model: backendPrompt.delivery.engine,
          type: 'manual',
          parameters: backendPrompt.delivery,
        },
        mode: 'manual' as const
      };

      // Update Redux state immediately to show completion
      dispatch(updateHistoryEntryAction({ 
        id: firebaseHistoryId, 
        updates: { 
          status: 'completed', 
          images: uploadedImages,
          backendPrompt: backendPrompt,
          compiledPrompt: falResult.compiled_prompt,
          falRequest: {
            model: backendPrompt.delivery.engine,
            type: 'manual',
            parameters: backendPrompt.delivery,
          },
          mode: 'manual' as const
        } 
      }));

      // Update Firebase
      await updateHistoryEntry(firebaseHistoryId, completedEntry);

      console.log('Manual mode video generated successfully!');
      setShowManualForm(false);

    } catch (error: any) {
      console.error('Error in manual mode:', error);
      
      if (firebaseHistoryId) {
        try {
          await updateHistoryEntry(firebaseHistoryId, { 
            status: 'failed', 
            error: error.message || 'Unknown error occurred' 
          });
          
          // Also update Redux state
          dispatch(updateHistoryEntryAction({ 
            id: firebaseHistoryId, 
            updates: { 
              status: 'failed', 
              error: error.message || 'Unknown error occurred' 
            } 
          }));
        } catch (updateError) {
          console.error('Failed to update manual history entry to failed:', updateError);
        }
      }
    } finally {
      setIsGeneratingLocal(false);
    }
  };

  const canGenerate = productImage && script.trim() && !isGeneratingLocal;

  const getUserPrompt = (entry: any) => {
    return entry.prompt || 'No prompt available';
  };

  const handlePromptToggle = (entryId: string) => {
    setExpandedPromptIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = Math.min(element.scrollHeight, 96) + 'px';
  };

  useEffect(() => {
    // Measure prompt overflow after a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const newOverflowPromptIds = new Set<string>();
      
      adGenerationHistory.forEach(entry => {
        const promptElement = promptRefs.current[entry.id];
        if (promptElement) {
          const isOverflowing = promptElement.scrollWidth > promptElement.clientWidth;
          if (isOverflowing) {
            newOverflowPromptIds.add(entry.id);
          }
        }
      });

      setOverflowPromptIds(newOverflowPromptIds);
    }, 100);

    return () => clearTimeout(timer);
  }, [adGenerationHistory.length]); // Only depend on length, not the entire array

  const loadMoreHistoryHandler = () => {
    if (!loading && hasMore) {
      dispatch(loadMoreHistory({ filters: { generationType: 'ad-generation' } }));
    }
  };

  return (
    <>
      {/* History Section */}
      {adGenerationHistory.length > 0 && (
        <div className="min-h-screen bg-transparent pt-20 pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">Video Ad Generation</h1>
              <p className="text-xl text-white/60">Transform your product images into engaging video ads</p>
            </div>

            <div className="space-y-6">
              {adGenerationHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    {/* Left side: Prompt and metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs text-white/60 bg-white/10 px-3 py-1.5 rounded-full">
                          {entry.model}
                        </span>
                        <span className="text-xs text-white/60 bg-white/10 px-3 py-1.5 rounded-full">
                          {entry.style}
                        </span>
                        <span className="text-xs text-white/60 bg-white/10 px-3 py-1.5 rounded-full">
                          {entry.images.length} video{entry.images.length !== 1 ? 's' : ''}
                        </span>
                        {entry.status === 'generating' && (
                          <span className="text-yellow-400 flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            Generating...
                          </span>
                        )}
                        {entry.status === 'failed' && (
                          <span className="text-red-400 text-xs">Failed</span>
                        )}
                      </div>
                      
                      <div
                        ref={(el) => {
                          promptRefs.current[entry.id] = el;
                        }}
                        className="text-white text-sm mb-3 overflow-hidden"
                      >
                        {getUserPrompt(entry)}
                      </div>

                      {overflowPromptIds.has(entry.id) && (
                        <button
                          onClick={() => handlePromptToggle(entry.id)}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                        >
                          {expandedPromptIds.has(entry.id) ? 'See less' : 'See more'}
                        </button>
                      )}

                      <div className="text-xs text-white/40 mt-3">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>

                    {/* Right side: Actions */}
                    <div className="flex items-center gap-2">
                      {entry.status === 'generating' && (
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      )}
                      
                      {entry.status === 'completed' && entry.images.length > 0 && (
                        <button
                          onClick={() => {
                            setPreviewEntry(entry);
                            setShowPreview(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          View Ad
                        </button>
                      )}

                      {entry.status === 'failed' && (
                        <span className="text-red-400 text-sm bg-red-400/10 px-3 py-1.5 rounded-lg">Failed</span>
                      )}
                    </div>
                  </div>

                  {/* Video Grid */}
                  {entry.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 mt-4">
                      {entry.images.map((image: any) => (
                        <div
                          key={image.id}
                          onClick={() => {
                            setPreviewEntry(entry);
                            setShowPreview(true);
                          }}
                          className="relative aspect-video rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group"
                        >
                          {entry.status === 'generating' ? (
                            // Loading frame
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                                <div className="text-xs text-white/60">Generating...</div>
                              </div>
                            </div>
                          ) : entry.status === 'failed' ? (
                            // Error frame
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                              <div className="flex flex-col items-center gap-2">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                <div className="text-xs text-red-400">Failed</div>
                              </div>
                            </div>
                          ) : (
                            // Completed video
                            <video
                              src={image.url}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              muted
                            />
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
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
                 onClick={() => toggleDropdown('engine')}
                 className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
               >
                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
                 {engine === 'veo3_fast' ? 'Veo3 Fast' : 'Veo3'}
               </button>
               {activeDropdown === 'engine' && (
                 <div className="absolute bottom-full left-0 mb-2 w-40 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                   <button
                     onClick={() => {
                       setEngine('veo3_fast');
                       setActiveDropdown(null);
                     }}
                     className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${engine === 'veo3_fast' ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                   >
                     <span>Veo3 Fast</span>
                     {engine === 'veo3_fast' && <div className="w-2 h-2 bg-black rounded-full"></div>}
                   </button>
                   <button
                     onClick={() => {
                       setEngine('veo3');
                       setActiveDropdown(null);
                     }}
                     className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${engine === 'veo3' ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                   >
                     <span>Veo3</span>
                     {engine === 'veo3' && <div className="w-2 h-2 bg-black rounded-full"></div>}
                   </button>
                 </div>
               )}
             </div>

             {/* Resolution Dropdown */}
             <div className="relative dropdown-container">
               <button
                 onClick={() => toggleDropdown('resolution')}
                 className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
               >
                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a2 2 0 012-2h2a2 2 0 012 2v4m2 0V4a2 2 0 012-2h2a2 2 0 012 2v4m-6 0h12m-6 0v12" />
                 </svg>
                 {resolution}
               </button>
               {activeDropdown === 'resolution' && (
                 <div className="absolute bottom-full left-0 mb-2 w-36 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                   {(['720p','1080p'] as const).map((res) => (
                     <button
                       key={res}
                       onClick={() => {
                         setResolution(res);
                         setActiveDropdown(null);
                       }}
                       className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${resolution === res ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                     >
                       <span>{res}</span>
                       {resolution === res && <div className="w-2 h-2 bg-black rounded-full"></div>}
                     </button>
                   ))}
                 </div>
               )}
             </div>

             {/* Audio Dropdown */}
             <div className="relative dropdown-container">
               <button
                 onClick={() => toggleDropdown('audio')}
                 className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
               >
                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                 </svg>
                 {generateAudio ? 'Audio: On' : 'Audio: Off'}
               </button>
               {activeDropdown === 'audio' && (
                 <div className="absolute bottom-full left-0 mb-2 w-36 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                   {[true, false].map((val) => (
                     <button
                       key={String(val)}
                       onClick={() => {
                         setGenerateAudio(val);
                         setActiveDropdown(null);
                       }}
                       className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${(generateAudio === val) ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                     >
                       <span>{val ? 'Audio: On' : 'Audio: Off'}</span>
                       {(generateAudio === val) && <div className="w-2 h-2 bg-black rounded-full"></div>}
                     </button>
                   ))}
                 </div>
               )}
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
     </>
   );
 };

export default AdGenerationInputBox;
