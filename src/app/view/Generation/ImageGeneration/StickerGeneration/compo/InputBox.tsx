'use client';

import React, { useEffect } from "react";
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
  updateHistoryEntry 
} from '@/store/slices/historySlice';

// Import the sticker-specific components
import ModelsDropdown from './ModelsDropdown';
import StickerCountDropdown from './StickerCountDropdown';

const InputBox = () => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const prompt = useAppSelector((state: any) => state.generation?.prompt || '');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-kontext-pro');
  const imageCount = useAppSelector((state: any) => state.generation?.imageCount || 1);
  const isGenerating = useAppSelector((state: any) => state.generation?.isGenerating || false);
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Create a loading entry immediately to show loading frames
    const loadingEntry: HistoryEntry = {
      id: `loading-${Date.now()}`,
      prompt: `Sticker: ${prompt}`,
      model: selectedModel,
      images: Array.from({ length: imageCount }, (_, index) => ({
        id: `loading-${index}`,
        url: '',
        originalUrl: ''
      })),
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      imageCount: imageCount,
      status: 'generating'
    };

    // Add loading entry to show frames immediately
    dispatch(addHistoryEntry(loadingEntry));

    try {
      // Use Redux async thunk for generation
      const result = await dispatch(generateImages({ 
        prompt: `Create a fun sticker design of: ${prompt}`, 
        model: selectedModel, 
        imageCount
      })).unwrap();

      // Create the completed entry
      const completedEntry: HistoryEntry = {
        id: result.historyId || Date.now().toString(),
        prompt: `Sticker: ${prompt}`,
        model: selectedModel,
        images: result.images,
        timestamp: new Date(),
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
        message: `Successfully generated ${imageCount} sticker${imageCount > 1 ? 's' : ''}!`
      }));

    } catch (error: any) {
      console.error('Sticker generation failed:', error);
      
      // Update the loading entry to show error
      dispatch(updateHistoryEntry({
        id: loadingEntry.id,
        updates: { status: 'failed' }
      }));

      // Show error notification
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Sticker generation failed. Please try again.'
      }));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as HTMLElement).closest('.dropdown-container')) {
        dispatch(toggleDropdown(''));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown, dispatch]);

  return (
    <>
      {historyEntries.length > 0 && (
        <div className="fixed inset-0 pt-[62px] pl-[68px] pr-6 pb-6 overflow-y-auto z-30">
          <div className="p-6">
            {/* History Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">History</h2>
            </div>

            {/* History Entries */}
            <div className="space-y-8">
              {historyEntries.map((entry: HistoryEntry) => (
                <div key={entry.id} className="space-y-4">
                  {/* Prompt Text */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-white/90 text-sm leading-relaxed">{entry.prompt}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                        <span>{entry.timestamp.toLocaleDateString()}</span>
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
                            alt={`Generated image ${imageIndex + 1}`}
                            fill
                            className="object-cover rounded-lg"
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
          </div>
        </div>
      )}
      
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[680px] z-[60]">
        <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          {/* Top row: prompt + actions */}
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
            <input
              type="text"
              placeholder="Describe your sticker idea..."
              value={prompt}
              onChange={(e) => dispatch(setPrompt(e.target.value))}
              className="flex-1 bg-transparent text-theme-primary outline-none text-[15px] leading-none"
              style={{
                color: theme === 'dark' ? '#ffffff' : '#000000',
                '::placeholder': {
                  color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                }
              }}
            />
            <button
              aria-label="Attach"
              className="p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <Image
                src="/icons/fileuploadwhite.svg"
                alt="Attach"
                width={18}
                height={18}
                className="opacity-90"
                style={{ filter: theme === 'light' ? 'invert(1)' : 'none' }}
              />
            </button>
          </div>

          <div className="flex flex-col items-end gap-2">
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
            >
              {isGenerating ? 'Generating...' : 'Generate Sticker'}
            </button>
          </div>
        </div>

        {/* Bottom row: sticker-specific options */}
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          <ModelsDropdown />
          <StickerCountDropdown />
        </div>
      </div>
      </div>
    </>
  );
};

export default InputBox;
