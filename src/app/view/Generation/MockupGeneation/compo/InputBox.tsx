'use client';

import React, { useEffect, useRef, useState } from "react";
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setPrompt } from '@/store/slices/generationSlice';
import { toggleDropdown, addNotification } from '@/store/slices/uiSlice';
import { addHistoryEntry, updateHistoryEntry, loadMoreHistory, loadHistory } from '@/store/slices/historySlice';
import { HistoryEntry } from '@/types/history';
// historyService removed; backend persists history
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
const updateFirebaseHistory = async (_id: string, _updates: any) => {};
import MockupImagePreview from '@/app/view/Generation/MockupGeneation/compo/MockupImagePreview';

const InputBox = () => {
  const dispatch = useAppDispatch();

  // Local UI state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [businessName, setBusinessName] = useState<string>('');
  const [businessTagline, setBusinessTagline] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewEntry, setPreviewEntry] = useState<HistoryEntry | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, status: '' });

  // Global state
  const prompt = useAppSelector((state: any) => state.generation?.prompt || '');
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const historyLoading = useAppSelector((state: any) => state.history?.loading || false);
  const hasMoreHistory = useAppSelector((state: any) => state.history?.hasMore ?? true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const hasUserScrolledRef = useRef(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as HTMLElement).closest('.dropdown-container')) {
        dispatch(toggleDropdown(''));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown, dispatch]);

  // Mark user scroll to avoid auto-triggering IO on mount
  useEffect(() => {
    const onScroll = () => { hasUserScrolledRef.current = true; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll as any);
  }, []);

  // IntersectionObserver-based pagination
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      if (!hasUserScrolledRef.current) return;
      
      // CRITICAL: Check hasMore FIRST
      if (!hasMoreHistory) {
        console.log('[Mockup] IO: skip loadMore - NO MORE ITEMS', { hasMoreHistory });
        return;
      }
      
      if (historyLoading || loadingMoreRef.current) {
        console.log('[Mockup] IO: skip loadMore - already loading', { historyLoading, busy: loadingMoreRef.current });
        return;
      }
      
      loadingMoreRef.current = true;
      console.log('[Mockup] IO: loadMore start', { hasMoreHistory });
      
      try {
        await (dispatch as any)(loadMoreHistory({ filters: { generationType: 'mockup-generation' }, paginationParams: { limit: 10 } })).unwrap();
        console.log('[Mockup] IO: loadMore success');
      } catch (e: any) {
        if (e?.message?.includes('no more pages')) {
          console.log('[Mockup] IO: loadMore skipped - no more pages');
        } else {
          console.error('[Mockup] IO: loadMore error', e);
        }
      } finally {
        loadingMoreRef.current = false;
      }
    }, { root: null, threshold: 0.1 });
    
    observer.observe(el);
    console.log('[Mockup] IO: observer attached', { hasMoreHistory });
    
    return () => {
      observer.disconnect();
      console.log('[Mockup] IO: observer disconnected');
    };
  }, [hasMoreHistory, historyLoading, dispatch]);

  const mockupHistoryEntries = historyEntries
    .filter((e: HistoryEntry) => e.generationType === 'mockup-generation')
    .sort((a: HistoryEntry, b: HistoryEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Group entries by date
  const groupedByDate = mockupHistoryEntries.reduce((groups: { [key: string]: HistoryEntry[] }, entry: HistoryEntry) => {
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

  console.log('🔍 Mockup history debug:');
  console.log('🔍 All history entries:', historyEntries.length);
  console.log('🔍 Mockup entries:', mockupHistoryEntries.length);
  console.log(
    '🔍 Current mockup entries:',
    mockupHistoryEntries.map((e: HistoryEntry) => ({
      id: e.id,
      status: e.status,
      imageCount: e.imageCount,
    }))
  );

  const canGenerate = !!logoFile && !isGenerating;

  const handleGenerate = async () => {
    if (!logoFile) return;
    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: 0, status: 'Starting generation...' });

    const tempId = `loading-${Date.now()}`;
    const loadingEntry: HistoryEntry = {
      id: tempId,
      prompt: `Mockup: ${businessName}${businessTagline ? ` — ${businessTagline}` : ''}`,
      model: 'flux-kontext-dev',
      generationType: 'mockup-generation',
      images: [],
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: 0,
      status: 'generating'
    };
    dispatch(addHistoryEntry(loadingEntry));
    
    // Save to Firebase and get the real Firebase ID
    let firebaseHistoryId: string;
    try {
      const { id, ...loadingEntryWithoutId } = loadingEntry;
      firebaseHistoryId = await saveHistoryEntry(loadingEntryWithoutId);
      console.log('🔥 Firebase history entry created with ID:', firebaseHistoryId);
    } catch (error) {
      console.error('❌ Failed to save to Firebase:', error);
      dispatch(addNotification({ type: 'error', message: 'Failed to save to history' }));
      setIsGenerating(false);
      return;
    }

    try {
      const form = new FormData();
      form.append('logo_file', logoFile, logoFile.name || 'logo.png');
      form.append('business_name', businessName || '');
      form.append('business_tagline', businessTagline || '');

      console.log('🚀 Starting mockup generation with SSE...');
      
      // Use fetch with streaming response
      const response = await fetch('/api/local/mockup-generation', { 
        method: 'POST', 
        body: form 
      });
      
      if (!response.ok) {
        throw new Error(`Local mockup API failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedImages: any[] = [];
      let totalCount = 0;
      const TARGET_COUNT = 5; // Hardcoded target count
      let stopStreaming = false;

      console.log('📡 Starting SSE stream processing...');

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('📡 SSE stream reading completed on client');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('📦 Client received chunk:', chunk.length, 'bytes');
        
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        console.log('📝 Client processing lines:', lines.length, 'lines, buffer remaining:', buffer.length);

        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            console.log('⚠️ Client skipping non-data line:', line);
            continue;
          }
          
          try {
            const data = JSON.parse(line.slice(6));
            console.log('📡 Client SSE data received:', data);

            if (data.type === 'progress') {
              // Upload this image to Firebase immediately, then render the Firebase URL
              const newId = `mockup-${Date.now()}-${receivedImages.length}`;
              const toUpload = [{
                id: newId,
                url: data.imageUrl,
                originalUrl: data.imageUrl,
                firebaseUrl: data.imageUrl,
              }];

              try {
                const uploadResponse = await fetch('/api/upload-mockup-images', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ images: toUpload }),
                });
                if (!uploadResponse.ok) {
                  throw new Error(`Single image upload failed: ${uploadResponse.status}`);
                }
                const uploadResult = await uploadResponse.json();
                const uploadedImage = uploadResult.images?.[0] || toUpload[0];

                receivedImages.push(uploadedImage);
                totalCount = TARGET_COUNT;

                console.log(`🖼️ Progress: ${receivedImages.length}/${totalCount} images uploaded to Firebase`);
                console.log('🖼️ Uploaded image:', uploadedImage);

                // Update progress state for UI
                setGenerationProgress({
                  current: receivedImages.length,
                  total: TARGET_COUNT,
                  status: `Generated ${data.item}`
                });

                // Update Redux state for immediate UI update
                dispatch(updateHistoryEntry({ 
                  id: tempId, 
                  updates: { 
                    images: [...receivedImages],
                    imageCount: receivedImages.length,
                    status: 'generating'
                  } 
                }));

                // Update Firebase history entry (metadata) with Firebase URLs
                try {
                  await updateFirebaseHistory(firebaseHistoryId, {
                    images: [...receivedImages],
                    imageCount: receivedImages.length,
                    status: 'generating'
                  });
                  console.log('🔥 Firebase history updated with new images');
                } catch (error) {
                  console.error('❌ Failed to update Firebase history:', error);
                }
              } catch (e) {
                console.error('❌ Incremental Firebase upload failed:', e);
              }
              
              console.log('🔄 Redux update dispatched for entry:', tempId);
              console.log('🖼️ Current received images count:', receivedImages.length);
              console.log('🖼️ Current history entries count:', mockupHistoryEntries.length);
              
              // If we have reached the target count, mark as completed immediately
              if (receivedImages.length >= TARGET_COUNT) {
                try {
                  // Update Redux
                  dispatch(updateHistoryEntry({
                    id: tempId,
                    updates: {
                      images: [...receivedImages],
                      imageCount: receivedImages.length,
                      status: 'completed'
                    }
                  }));
                  // Update Firebase
                  await updateFirebaseHistory(firebaseHistoryId, {
                    images: [...receivedImages],
                    imageCount: receivedImages.length,
                    status: 'completed',
                    style: 'mockup'
                  });
                  setGenerationProgress({
                    current: TARGET_COUNT,
                    total: TARGET_COUNT,
                    status: 'Generation completed!'
                  });
                  stopStreaming = true;
                } catch (finalizeErr) {
                  console.error('❌ Failed to finalize after reaching target count:', finalizeErr);
                }
              }

              // Debug: Check if images are accessible
              if (receivedImages.length > 0) {
                console.log('🧪 Debug: First image object:', receivedImages[0]);
                console.log('🧪 Debug: First image URL:', receivedImages[0].url);
                
                // Test if the image URL is accessible
                fetch(receivedImages[0].url, { method: 'HEAD' })
                  .then(response => {
                    console.log('✅ Image URL accessible:', receivedImages[0].url, 'Status:', response.status);
                  })
                  .catch(error => {
                    console.error('❌ Image URL not accessible:', receivedImages[0].url, 'Error:', error);
                  });
              }
              
            } else if (data.type === 'complete') {
              console.log(`✅ Generation completed! Total images: ${data.count}`);
              
              // Update progress to show completion
              setGenerationProgress({
                current: data.count,
                total: TARGET_COUNT,
                status: 'Generation completed! Uploading to Firebase...'
              });
              
              // Finalize: images are already uploaded incrementally; skip re-upload
              const uploadResult = { images: receivedImages };
              console.log('🔥 Firebase images already uploaded incrementally');
              
              // Update progress to show Firebase completion
              setGenerationProgress({
                current: uploadResult.images?.length || receivedImages.length,
                total: uploadResult.images?.length || receivedImages.length,
                status: 'Firebase upload completed!'
              });
              
              // Update final history entry
              const completed: HistoryEntry = {
                id: tempId,
                prompt: `Mockup: ${businessName}${businessTagline ? ` — ${businessTagline}` : ''}`,
                model: 'flux-krea',
                generationType: 'mockup-generation',
                images: uploadResult.images || receivedImages,
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: uploadResult.images?.length || receivedImages.length,
                status: 'completed',
                style: 'mockup'
              };

              dispatch(updateHistoryEntry({ id: tempId, updates: completed }));
              
              // Update final Firebase history entry
              try {
                await updateFirebaseHistory(firebaseHistoryId, {
                  images: uploadResult.images || receivedImages,
                  imageCount: uploadResult.images?.length || receivedImages.length,
                  status: 'completed',
                  style: 'mockup'
                });
                console.log('🔥 Firebase history updated with completed status');
              } catch (error) {
                console.error('❌ Failed to update Firebase history:', error);
              }
              
              setLogoFile(null);
              setBusinessName('');
              setBusinessTagline('');
              dispatch(addNotification({ type: 'success', message: `Generated ${completed.imageCount} mockup items` }));
              break;
              
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Generation failed');
            }
          } catch (e) {
            console.error('❌ Error parsing SSE data:', e, 'Line:', line);
          }
        }

        if (stopStreaming) {
          try { await reader.cancel(); } catch {}
          break;
        }
      }

    } catch (e: any) {
      console.error('❌ Mockup generation failed:', e);
      dispatch(updateHistoryEntry({ id: tempId, updates: { status: 'failed', error: e?.message || 'Generation failed' } }));
      
      // Update Firebase history with failed status
      try {
        await updateFirebaseHistory(firebaseHistoryId, { 
          status: 'failed', 
          error: e?.message || 'Generation failed' 
        });
        console.log('🔥 Firebase history updated with failed status');
      } catch (error) {
        console.error('❌ Failed to update Firebase history with error:', error);
      }
      
      dispatch(addNotification({ type: 'error', message: e?.message || 'Mockup generation failed' }));
    } finally {
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0, status: '' });
    }
  };

  const openPreview = (entry: HistoryEntry) => {
    setPreviewEntry(entry);
    setIsPreviewOpen(true);
  };
  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewEntry(null);
  };

  return (
    <div className="min-h-screen p-6">
      {/* Progress Indicator */}
      {isGenerating && generationProgress.total > 0 && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[900px] z-[70]">
          <div className="rounded-2xl bg-black/20 backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl p-4">
            <div className="flex items-center justify-between text-white mb-3">
              <div className="text-sm font-medium">Generating Mockups...</div>
              <div className="text-sm opacity-80">{generationProgress.current}/{generationProgress.total}</div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-white/60 text-center">{generationProgress.status}</div>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[900px] z-[60]">
        <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          <div className="flex items-center gap-3 p-3">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 items-center bg-transparent rounded-xl px-4 py-2.5">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Check file size (2MB limit)
                    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
                    if (file.size > maxSize) {
                      dispatch(addNotification({
                        type: "error",
                        message: "Image too large. Maximum size is 2MB per image.",
                      }));
                      // Clear the input
                      e.target.value = "";
                      return;
                    }
                    setLogoFile(file);
                  } else {
                    setLogoFile(null);
                  }
                }}
                className="text-white text-sm"
              />
              <input
                type="text"
                placeholder="Business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-none border-b border-white/10 py-1"
              />
              <input
                type="text"
                placeholder="Tagline (optional)"
                value={businessTagline}
                onChange={(e) => setBusinessTagline(e.target.value)}
                className="bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-none border-b border-white/10 py-1"
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate Mockups'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="max-w-7xl mx-auto pt-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Mockup Generation History</h2>
          <p className="text-white/60">Your generated mockup items will appear here</p>
        </div>

        {mockupHistoryEntries.length === 0 && historyLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
              <div className="text-white text-lg">Loading your mockups...</div>
            </div>
          </div>
        ) : mockupHistoryEntries.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Image src="/icons/brandingkitwhite.svg" alt="Mockups" width={48} height={48} className="opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No mockups generated yet</h3>
            <p className="text-white/60">Upload a logo and enter business details to generate mockups</p>
          </div>
        ) : (
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

                {/* All Mockup Images for this Date - Horizontal Layout */}
                <div className="flex flex-wrap gap-3 ml-9">
                  {groupedByDate[date].map((entry: HistoryEntry) => 
                    entry.images.map((img: any, idx: number) => (
                      <div
                        key={`${entry.id}-${img.id}`}
                        data-image-id={`${entry.id}-${img.id}`}
                        onClick={() => openPreview(entry)}
                        className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                      >
                        {entry.status === 'generating' ? (
                          // Loading frame
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                              <div className="text-xs text-white/60">
                                Generating...
                              </div>
                            </div>
                          </div>
                        ) : entry.status === 'failed' ? (
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
                        ) : img.url ? (
                          // Completed mockup with shimmer loading
                          <div className="relative w-full h-full">
                            <Image
                              src={img.url}
                              alt={`Mockup ${idx + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              sizes="192px"
                              onError={(e) => {
                                console.error('❌ Image failed to load:', img.url, e);
                              }}
                              onLoad={() => {
                                console.log('✅ Image loaded successfully:', img.url);
                                // Remove shimmer when image loads
                                setTimeout(() => {
                                  const shimmer = document.querySelector(`[data-image-id="${entry.id}-${img.id}"] .shimmer`) as HTMLElement;
                                  if (shimmer) {
                                    shimmer.style.opacity = '0';
                                  }
                                }, 100);
                              }}
                            />
                            {/* Shimmer loading effect */}
                            <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                          </div>
                        ) : (
                          // No image available
                          <div className="w-full h-full bg-gradient-to-br from-gray-800/20 to-gray-900/20 flex items-center justify-center">
                            <div className="text-xs text-white/60">No image</div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
            {hasMoreHistory && historyLoading && mockupHistoryEntries.length > 0 && (
              <div className="flex items-center justify-center py-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                  <div className="text-sm text-white/60">Loading more mockups...</div>
                </div>
              </div>
            )}
            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} style={{ height: 1 }} />
          </div>
        )}
      </div>

      {previewEntry && (
        <MockupImagePreview isOpen={isPreviewOpen} onClose={closePreview} entry={previewEntry} />
      )}
    </div>
  );
};

export default InputBox;


