"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addHistoryEntry, loadHistory, loadMoreHistory } from '@/store/slices/historySlice';
import { saveHistoryEntry, updateHistoryEntry } from '@/lib/historyService';
import { uploadGeneratedImages } from '@/lib/imageUpload';
import AdImagePreview from './AdImagePreview';

const AdGenerationInputBox: React.FC = () => {
  const dispatch = useAppDispatch();
  const [prompt, setPrompt] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);
  const [duration, setDuration] = useState<'8s'>('8s');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);
  const [previewEntry, setPreviewEntry] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
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
    if (!productImage || !prompt.trim()) {
      console.error('Please upload a product image and enter a prompt');
      return;
    }

    setIsGeneratingLocal(true);
    let firebaseHistoryId: string | undefined;

    try {
      // Create loading entry
      const loadingEntry = {
        id: `ad-gen-${Date.now()}`,
        prompt: prompt.trim(),
        model: 'fal-veo3',
        generationType: 'ad-generation' as const,
        images: [],
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 1,
        status: 'generating' as const,
        frameSize: resolution,
        style: `Duration: ${duration}, Audio: ${generateAudio ? 'Yes' : 'No'}`,
      };

      dispatch(addHistoryEntry(loadingEntry));

      // Save to Firebase
      firebaseHistoryId = await saveHistoryEntry(loadingEntry);

      // Call analyze-image API first
      const formData = new FormData();
      formData.append('image', productImage);

      const analyzeResponse = await fetch('/api/ad-gen/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze image');
      }

      const analyzeData = await analyzeResponse.json();

      // Call generate-prompts API
      const promptsResponse = await fetch('/api/ad-gen/generate-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: analyzeData.image_url,
          prompt: prompt.trim(),
        }),
      });

      if (!promptsResponse.ok) {
        throw new Error('Failed to generate prompts');
      }

      const promptsData = await promptsResponse.json();

      // For now, we'll simulate the video generation
      // Later this will call the actual FAL API
      const generatedVideo = {
        id: `ad-video-${Date.now()}`,
        url: 'https://example.com/generated-video.mp4', // Placeholder
        originalUrl: 'https://example.com/generated-video.mp4',
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
      };

      dispatch(addHistoryEntry(completedEntry));
      await updateHistoryEntry(firebaseHistoryId, completedEntry);

      console.log('Ad generated successfully!');
      setPrompt('');
      setProductImage(null);

    } catch (error: any) {
      console.error('Error generating ad:', error);
      
      // Update history entry to failed
      if (firebaseHistoryId) {
        await updateHistoryEntry(firebaseHistoryId, { status: 'failed', error: error.message });
      }
    } finally {
      setIsGeneratingLocal(false);
    }
  };

  const canGenerate = productImage && prompt.trim() && !isGeneratingLocal;

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

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = Math.min(element.scrollHeight, 96) + 'px';
  };

  useEffect(() => {
    // Measure prompt overflow
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
  }, [adGenerationHistory]);

  const loadMoreHistoryHandler = () => {
    if (!loading && hasMore) {
      dispatch(loadMoreHistory({ filters: { generationType: 'ad-generation' } }));
    }
  };

  return (
    <>
      {/* History Section */}
      {adGenerationHistory.length > 0 && (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20 pb-32">
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
                placeholder="Describe how the image should be animated..."
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
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
              >
                {isGeneratingLocal ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>

          {/* Bottom row: pill options */}
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
            {/* Duration Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => toggleDropdown('duration')}
                className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {duration}
              </button>
              {activeDropdown === 'duration' && (
                <div className="absolute bottom-full left-0 mb-2 w-32 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                  <button
                    onClick={() => {
                      setDuration('8s');
                      setActiveDropdown(null);
                    }}
                    className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                      duration === '8s' ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <span>8 seconds</span>
                    {duration === '8s' && <div className="w-2 h-2 bg-black rounded-full"></div>}
                  </button>
                </div>
              )}
            </div>

            {/* Audio Toggle */}
            <div className="relative dropdown-container">
              <button
                onClick={() => toggleDropdown('audio')}
                className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                Audio: {generateAudio ? 'Yes' : 'No'}
              </button>
              {activeDropdown === 'audio' && (
                <div className="absolute bottom-full left-0 mb-2 w-40 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                  <button
                    onClick={() => {
                      setGenerateAudio(true);
                      setActiveDropdown(null);
                    }}
                    className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                      generateAudio ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <span>Yes (33% more credits)</span>
                    {generateAudio && <div className="w-2 h-2 bg-black rounded-full"></div>}
                  </button>
                  <button
                    onClick={() => {
                      setGenerateAudio(false);
                      setActiveDropdown(null);
                    }}
                    className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                      !generateAudio ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <span>No (33% less credits)</span>
                    {!generateAudio && <div className="w-2 h-2 bg-black rounded-full"></div>}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a2 2 0 012-2h2a2 2 0 012 2v4m2 0V4a2 2 0 012-2h2a2 2 0 012 2v4m-6 0h12m-6 0v12m0 0v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4m0 0h12" />
                </svg>
                {resolution}
              </button>
              {activeDropdown === 'resolution' && (
                <div className="absolute bottom-full left-0 mb-2 w-24 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                  <button
                    onClick={() => {
                      setResolution('720p');
                      setActiveDropdown(null);
                    }}
                    className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                      resolution === '720p' ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <span>720p</span>
                    {resolution === '720p' && <div className="w-2 h-2 bg-black rounded-full"></div>}
                  </button>
                  <button
                    onClick={() => {
                      setResolution('1080p');
                      setActiveDropdown(null);
                    }}
                    className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                      resolution === '1080p' ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <span>1080p</span>
                    {resolution === '1080p' && <div className="w-2 h-2 bg-black rounded-full"></div>}
                  </button>
                </div>
              )}
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
    </>
  );
};

export default AdGenerationInputBox;
