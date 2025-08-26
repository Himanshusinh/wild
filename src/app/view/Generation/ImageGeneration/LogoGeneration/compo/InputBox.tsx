'use client';

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { HistoryEntry } from '@/types/history';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  setPrompt, 
  generateImages
} from '@/store/slices/generationSlice';
import { 
  toggleDropdown, 
  addNotification 
} from '@/store/slices/uiSlice';
import { 
  addHistoryEntry, 
  updateHistoryEntry,
  loadHistory,
  loadMoreHistory
} from '@/store/slices/historySlice';

// Import the logo-specific components
import ModelsDropdown from './ModelsDropdown';
import LogoCountDropdown from './LogoCountDropdown';
import LogoImagePreview from './LogoImagePreview';

const InputBox = () => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const prompt = useAppSelector((state: any) => state.generation?.prompt || '');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'local-logo-model');
  const imageCount = useAppSelector((state: any) => state.generation?.imageCount || 1);
  const isGenerating = useAppSelector((state: any) => state.generation?.isGenerating || false);
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const historyLoading = useAppSelector((state: any) => state.history?.loading || false);
  const hasMoreHistory = useAppSelector((state: any) => state.history?.hasMore ?? true);
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');

  // Local state for preview modal
  const [previewEntry, setPreviewEntry] = useState<HistoryEntry | null>(null);

  // Prompt expand/collapse tracking
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<string>>(new Set());
  const [overflowPromptIds, setOverflowPromptIds] = useState<Set<string>>(new Set());
  const promptRefs = useRef<Record<string, HTMLParagraphElement | null>>({});

  const getUserPrompt = (rawPrompt: string | undefined) => {
    if (!rawPrompt) return '';
    return rawPrompt.replace(/^Logo:\s*/i, '').trim();
  };

  const toggleExpand = (id: string) => {
    setExpandedPromptIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Create a loading entry immediately to show loading frames
    const loadingEntry: HistoryEntry = {
      id: `loading-${Date.now()}`,
      prompt: `Logo: ${prompt}`,
      model: selectedModel,
      generationType: 'logo-generation',
      images: Array.from({ length: imageCount }, (_, index) => ({
        id: `loading-${index}`,
        url: '',
        originalUrl: ''
      })),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: imageCount,
      status: 'generating'
    };

    // Add loading entry to show frames immediately
    dispatch(addHistoryEntry(loadingEntry));

    try {
      let result;

      // Check if using local model or Flux models
      if (selectedModel === 'flux-krea') {
        // Use local logo generation API
        const response = await fetch('/api/local/logo-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            model: selectedModel,
            imageCount: imageCount,
            generationType: 'logo-generation'
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Generation failed');
        }
      } else {
        // Use existing Flux API for Kontext models
        const backendPrompt = `Create a professional logo for: ${prompt}. The logo should be clean, modern, and suitable for business use.`;
        
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: backendPrompt,
            model: selectedModel,
            n: imageCount,
            frameSize: '1:1', // Logo generation typically uses square aspect ratio
            style: 'logo',
            generationType: 'logo-generation'
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        result = await response.json();

        if (!result.images) {
          throw new Error('No images received from Flux API');
        }
      }

      // Create the completed entry
      const completedEntry: HistoryEntry = {
        id: result.historyId || Date.now().toString(),
        prompt: `Logo: ${prompt}`,
        model: selectedModel,
        generationType: 'logo-generation',
        images: result.images,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: imageCount,
        status: 'completed'
      };

      // Update the loading entry with completed data
      dispatch(updateHistoryEntry({
        id: loadingEntry.id,
        updates: completedEntry
      }));

      // Clear the prompt
      dispatch(setPrompt(''));

      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: `Successfully generated ${imageCount} logo${imageCount > 1 ? 's' : ''}!`
      }));

    } catch (error: any) {
      console.error('Logo generation failed:', error);
      
      // Update the loading entry to show error
      dispatch(updateHistoryEntry({
        id: loadingEntry.id,
        updates: {
          status: 'failed',
          error: error.message || 'Generation failed'
        }
      }));

      // Show error notification
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Logo generation failed'
      }));
    }
  };

  // Handle image preview
  const handleImageClick = (entry: HistoryEntry) => {
    setPreviewEntry(entry);
  };

  // Close preview modal
  const closePreview = () => {
    setPreviewEntry(null);
  };

  // Filter logo generation history entries
  // Initial history load is triggered centrally by PageRouter

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800) {
        if (hasMoreHistory && !historyLoading) {
          dispatch(loadMoreHistory({ filters: { generationType: 'logo-generation' }, paginationParams: { limit: 10 } }));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dispatch, hasMoreHistory, historyLoading]);

  const logoHistoryEntries = historyEntries
    .filter((entry: HistoryEntry) => entry.generationType === 'logo-generation')
    .sort((a: HistoryEntry, b: HistoryEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Measure overflow after render to decide when to show See more
  useEffect(() => {
    const next = new Set<string>();
    for (const id in promptRefs.current) {
      const el = promptRefs.current[id];
      if (!el) continue;
      if (el.scrollWidth > el.clientWidth) next.add(id);
    }
    const isSame = next.size === overflowPromptIds.size && Array.from(next).every(id => overflowPromptIds.has(id));
    if (!isSame) {
      setOverflowPromptIds(next);
    }
  }, [logoHistoryEntries, expandedPromptIds]);

  return (
    <div className="min-h-screen p-6">
      {/* Input Section */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[780px] z-[60]">
        <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          <div className="flex items-center gap-3 p-3">
            <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
              <input
                type="text"
                placeholder="Type your logo prompt..."
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
                {isGenerating ? 'Generating...' : 'Generate Logo'}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
            <ModelsDropdown />
            <LogoCountDropdown />
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="max-w-7xl mx-auto pt-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Logo Generation History</h2>
          <p className="text-white/60">Your generated logos will appear here</p>
        </div>

        {logoHistoryEntries.length === 0 && historyLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
              <div className="text-white text-lg">Loading your logo generations...</div>
            </div>
          </div>
        ) : logoHistoryEntries.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Image
                src="/icons/imagegenerationwhite.svg"
                alt="Logo Generation"
                width={48}
                height={48}
                className="opacity-50"
              />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No logos generated yet</h3>
            <p className="text-white/60">Start by typing a prompt above to generate your first logo</p>
          </div>
        ) : (
          <div className="space-y-8">
            {logoHistoryEntries.map((entry: HistoryEntry) => (
              <div key={entry.id} className="space-y-4">
                {/* Prompt Text */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    {(() => {
                      const userPrompt = getUserPrompt(entry.prompt);
                      const isExpanded = expandedPromptIds.has(entry.id);
                      const showTruncate = !isExpanded;
                      const shouldShowToggle = overflowPromptIds.has(entry.id) || userPrompt.includes('\n');
                      return (
                        <div className="flex items-start gap-2">
                          <p
                            className={`${showTruncate ? 'whitespace-nowrap overflow-hidden text-ellipsis' : 'whitespace-normal'} text-white/90 text-sm leading-relaxed max-w-[600px]`}
                            ref={(el) => { promptRefs.current[entry.id] = el; }}
                          >
                            {userPrompt}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                            {userPrompt.length > 0 && (
                              <button
                                onClick={() => { navigator.clipboard.writeText(userPrompt); }}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white/80"
                                title="Copy prompt"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                </svg>
                              </button>
                            )}
                            {shouldShowToggle && (
                              <button
                                onClick={() => toggleExpand(entry.id)}
                                className="px-2 py-1 text-xs rounded-md bg-white/5 hover:bg-white/10 text-white/70"
                              >
                                {isExpanded ? 'Show less' : 'See more'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                      <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                      <span>{entry.model}</span>
                      <span>{entry.images.length} image{entry.images.length !== 1 ? 's' : ''}</span>
                      {entry.status === 'generating' && (
                        <span className="text-yellow-400 flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          Generating...
                        </span>
                      )}
                      {entry.status === 'failed' && (
                        <span className="text-red-400">Failed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 ml-9">
                  {entry.images.map((image, imageIndex) => (
                    <div key={image.id} className="aspect-square relative group">
                      {entry.status === 'generating' ? (
                        <div className="w-full h-full bg-white/5 rounded-lg flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                        </div>
                      ) : image.url ? (
                        <Image
                          src={image.url}
                          alt={`Generated logo ${imageIndex + 1}`}
                          fill
                          className="object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                          onClick={() => handleImageClick(entry)}
                        />
                      ) : (
                        <div className="w-full h-full bg-red-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-red-400 text-xs">Failed</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {hasMoreHistory && historyLoading && logoHistoryEntries.length > 0 && (
          <div className="flex items-center justify-center py-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
              <div className="text-sm text-white/60">Loading more logos...</div>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewEntry && (
        <LogoImagePreview
          isOpen={true}
          onClose={closePreview}
          entry={previewEntry}
        />
      )}
    </div>
  );
};

export default InputBox;
