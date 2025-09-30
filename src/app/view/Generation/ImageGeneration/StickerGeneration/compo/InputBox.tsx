'use client';

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { HistoryEntry } from '@/types/history';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  bflGenerate,
  falGenerate
} from '@/store/slices/generationsApi';
import { setPrompt } from '@/store/slices/generationSlice';
import { 
  toggleDropdown, 
  addNotification 
} from '@/store/slices/uiSlice';
import { useGenerationCredits } from '@/hooks/useCredits';
import { 
  loadHistory,
  loadMoreHistory
} from '@/store/slices/historySlice';

// Import the sticker-specific components
import ModelsDropdown from './ModelsDropdown';
import StickerCountDropdown from './StickerCountDropdown';
import StickerImagePreview from './StickerImagePreview';

const InputBox = () => {
  const dispatch = useAppDispatch();
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Redux state
  const prompt = useAppSelector((state: any) => state.generation?.prompt || '');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-kontext-pro');
  const imageCount = useAppSelector((state: any) => state.generation?.imageCount || 1);
  const isGenerating = useAppSelector((state: any) => state.generation?.isGenerating || false);
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const historyLoading = useAppSelector((state: any) => state.history?.loading || false);
  const hasMoreHistory = useAppSelector((state: any) => state.history?.hasMore ?? true);
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');

  // Credits management
  const {
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    creditBalance,
    clearCreditsError,
  } = useGenerationCredits('image', selectedModel, {
    frameSize: '1:1', // Sticker generation typically uses square aspect ratio
    count: imageCount,
  });



  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Clear any previous credit errors
    clearCreditsError();

    // Validate and reserve credits before generation
    let transactionId: string;
    try {
      const creditResult = await validateAndReserveCredits();
      transactionId = creditResult.transactionId;
      console.log('✅ Credits reserved for sticker generation:', creditResult);
    } catch (creditError: any) {
      console.error('❌ Credit validation failed:', creditError);
      dispatch(addNotification({
        type: 'error',
        message: creditError.message || 'Insufficient credits for generation'
      }));
      return;
    }

    try {
      let result;
      
      // Build the same backend prompt regardless of model
      const backendPrompt = `Create a fun and engaging sticker design of: ${prompt}. The sticker should be vibrant, eye-catching, and suitable for social media, messaging apps, or decorative use.`;

      if (selectedModel === 'gemini-25-flash-image') {
        // Route to FAL (Google Nano Banana)
        result = await dispatch(falGenerate({
          prompt: backendPrompt,
          model: selectedModel,
          n: imageCount,
          uploadedImages: [],
          output_format: 'jpeg',
          generationType: 'sticker-generation',
        })).unwrap();
      } else {
        // Default to BFL
        result = await dispatch(bflGenerate({
          prompt: backendPrompt,
          model: selectedModel,
          n: imageCount,
          frameSize: '1:1', // Sticker generation typically uses square aspect ratio
          style: 'sticker',
          generationType: 'sticker-generation'
        })).unwrap();
      }

      if (!result.images) {
        throw new Error('No images received from Flux API');
      }

      // Clear the prompt
      dispatch(setPrompt(''));

      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: `Successfully generated ${imageCount} sticker${imageCount > 1 ? 's' : ''}!`
      }));

      // Handle credit success
      if (transactionId) {
        await handleGenerationSuccess(transactionId);
      }

    } catch (error: any) {
      console.error('Sticker generation failed:', error);
      
      // Show error notification
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to generate stickers'
      }));

      // Handle credit failure
      if (transactionId) {
        await handleGenerationFailure(transactionId);
      }
    }
  };

  // Handle image preview
  const handleImageClick = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
    setIsPreviewOpen(true);
  };

  // Close preview modal
  const closePreview = () => {
    setIsPreviewOpen(false);
    setSelectedEntry(null);
  };

  // Load sticker generation history entries
  useEffect(() => {
    // Load text-to-image history since backend stores stickers with this generationType
    dispatch(loadHistory({ 
      filters: { 
        generationType: 'text-to-image'
      }, 
      paginationParams: { limit: 50 } 
    }));
  }, [dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800) {
        if (hasMoreHistory && !historyLoading) {
          dispatch(loadMoreHistory({ filters: { generationType: 'text-to-image' }, paginationParams: { limit: 10 } }));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dispatch, hasMoreHistory, historyLoading]);

  // Filter sticker generation history entries
  const stickerHistoryEntries = historyEntries
    .filter((entry: HistoryEntry) => {
      // If it has explicit sticker-generation type, include it
      if (entry.generationType === 'sticker-generation') {
        return true;
      }
      
      // If it has explicit sticker style, include it
      if (entry.style === 'sticker') {
        return true;
      }
      
      // For text-to-image entries, check if they're clearly stickers
      if (entry.generationType === 'text-to-image') {
        // Include if it has sticker-related keywords
        const hasStickerKeywords = entry.prompt?.toLowerCase().includes('sticker') ||
                                  entry.prompt?.toLowerCase().includes('sticker design');
        
        // Exclude if it has conflicting styles (product or logo)
        const hasConflictingStyle = entry.style === 'product' || entry.style === 'logo';
        
        // Exclude if it has product-related keywords (even without style)
        const hasProductKeywords = entry.prompt?.toLowerCase().includes('product') ||
                                  entry.prompt?.toLowerCase().includes('studio product');
        
        return hasStickerKeywords && !hasConflictingStyle && !hasProductKeywords;
      }
      
      return false;
    })
    .sort((a: HistoryEntry, b: HistoryEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Group entries by date
  const groupedByDate = stickerHistoryEntries.reduce((groups: { [key: string]: HistoryEntry[] }, entry: HistoryEntry) => {
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


  return (
    <div className="min-h-screen p-6">
      {/* Input Section */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[780px] z-[60]">
        <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          <div className="flex items-center gap-3 p-3">
            <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
              <input
                type="text"
                placeholder="Type your sticker prompt..."
                value={prompt}
                onChange={(e) => dispatch(setPrompt(e.target.value))}
                className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-none"
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate Sticker'}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
            <ModelsDropdown />
            <StickerCountDropdown />
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="max-w-7xl mx-auto pt-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Sticker Generation History</h2>
          <p className="text-white/60">Your generated stickers will appear here</p>
        </div>

        {stickerHistoryEntries.length === 0 && historyLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
              <div className="text-white text-lg">Loading your sticker generations...</div>
            </div>
          </div>
        ) : stickerHistoryEntries.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Image
                src="/icons/imagegenerationwhite.svg"
                alt="Sticker Generation"
                width={48}
                height={48}
                className="opacity-50"
              />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No stickers generated yet</h3>
            <p className="text-white/60">Start by typing a prompt above to generate your first sticker</p>
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

                {/* All Sticker Images for this Date - Horizontal Layout */}
                <div className="flex flex-wrap gap-3 ml-9">
                  {groupedByDate[date].map((entry: HistoryEntry) => 
                    entry.images.map((image, imageIndex) => (
                      <div
                        key={`${entry.id}-${image.id}`}
                        data-image-id={`${entry.id}-${image.id}`}
                        onClick={() => handleImageClick(entry)}
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
                        ) : image.url ? (
                          // Completed sticker with shimmer loading
                          <div className="relative w-full h-full">
                            <Image
                              src={image.url}
                              alt={`Generated sticker ${imageIndex + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              sizes="192px"
                              onLoad={() => {
                                // Remove shimmer when image loads
                                setTimeout(() => {
                                  const shimmer = document.querySelector(`[data-image-id="${entry.id}-${image.id}"] .shimmer`) as HTMLElement;
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
          </div>
        )}
        {hasMoreHistory && historyLoading && stickerHistoryEntries.length > 0 && (
          <div className="flex items-center justify-center py-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
              <div className="text-sm text-white/60">Loading more stickers...</div>
            </div>
          </div>
        )}
      </div>

      {/* Sticker Image Preview Modal */}
      {selectedEntry && (
        <StickerImagePreview
          isOpen={isPreviewOpen}
          onClose={closePreview}
          entry={selectedEntry}
        />
      )}
    </div>
  );
};

export default InputBox;
