'use client';

import React, { useEffect } from "react";
import Image from "next/image";
import { saveHistoryEntry, uploadFromUrlToStorage } from '@/lib/historyService';
import { HistoryEntry } from '@/types/history';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setPrompt } from '@/store/slices/generationSlice';
import { 
  toggleDropdown, 
  addNotification 
} from '@/store/slices/uiSlice';
import {
  addHistoryEntry,
  updateHistoryEntry,
  loadHistory
} from '@/store/slices/historySlice';

// Import the video-specific components
import ModelsDropdown from './ModelsDropdown';
import DurationDropdown from './DurationDropdown';
import ResolutionDropdown from './ResolutionDropdown';
import FpsDropdown from './FpsDropdown';

const InputBox = () => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const prompt = useAppSelector((state: any) => state.generation?.prompt || '');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'MiniMax-Hailuo-02');
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1080p');
  const durationSetting = useAppSelector((state: any) => state.generation?.style || '6s');
  const isGenerating = useAppSelector((state: any) => state.generation?.isGenerating || false);
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');
  const [isVideoGenerating, setIsVideoGenerating] = React.useState(false);

  // Load history from Firebase when component mounts
  useEffect(() => {
    dispatch(loadHistory({}));
  }, [dispatch]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsVideoGenerating(true);

    try {
      // 1) Create MiniMax task via our API
      const createRes = await fetch('/api/video-generation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt,
          // map dropdown selections
          duration: durationSetting === '10s' ? 10 : 6,
          resolution: (() => {
            const map: Record<string, string> = {
              '1080p': '1080P',
              '768p': '768P',
              '512p': '512P',
              '720p': '720P',
            };
            return map[String(frameSize).toLowerCase()] || '1080P';
          })(),
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create video task');

      const taskId: string = createData.task_id;

      // 2) Poll status until finished or failed
      let fileId: string | undefined;
      // Poll every 5s, max ~10 minutes (120 cycles)
      for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch(`/api/video-generation/status?task_id=${encodeURIComponent(taskId)}`);
        const statusData = await statusRes.json();
        if (!statusRes.ok) throw new Error(statusData.error || 'Failed to query status');
        if (statusData.status === 'Success' && statusData.file_id) {
          fileId = statusData.file_id;
          break;
        }
        if (statusData.status === 'Fail') {
          throw new Error('Video generation failed');
        }
      }

      if (!fileId) {
        throw new Error('Timed out waiting for video generation');
      }

      // 3) Retrieve download URL
      const retrieveRes = await fetch(`/api/video-generation/retrieve?file_id=${encodeURIComponent(fileId)}`);
      const retrieveData = await retrieveRes.json();
      if (!retrieveRes.ok) throw new Error(retrieveData.error || 'Failed to retrieve file');
      const downloadUrl: string | undefined = retrieveData?.file?.download_url;
      if (!downloadUrl) throw new Error('Download URL missing');

      // 4) Upload video to Firebase Storage for persistence
      const storagePath = `videos/${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`;
      const firebaseUrl = await uploadFromUrlToStorage(downloadUrl, storagePath);

      // 5) Insert completed entry into history on success
      const completedEntry: HistoryEntry = {
        id: Date.now().toString(),
        prompt: `Video: ${prompt}`,
        model: selectedModel,
        images: [],
        videoUrl: firebaseUrl,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 0,
        status: 'completed',
      };
      dispatch(addHistoryEntry(completedEntry));
      // Persist in Firestore
      try { await saveHistoryEntry(completedEntry); } catch { /* non-blocking */ }

      // Clear the prompt
      dispatch(setPrompt(''));

      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: 'Successfully generated video!'
      }));

    } catch (error: any) {
      console.error('Video generation failed:', error);
      
      // Do not add failed entries to history to match requested behavior

      // Show error notification
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Video generation failed. Please try again.'
      }));
    } finally {
      setIsVideoGenerating(false);
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
      {/* Loading indicator during video generation */}
      {isVideoGenerating && (
        <div className="fixed inset-0 pt-[62px] pl-[68px] pr-6 pb-6 overflow-y-auto z-30">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Generating Video...</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white/90 text-sm leading-relaxed">{prompt}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                    <span>{new Date().toLocaleDateString()}</span>
                    <span>{selectedModel}</span>
                    <span className="text-yellow-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      Generating video... This may take several minutes
                    </span>
                  </div>
                </div>
              </div>
              <div className="ml-9">
                <div className="w-full max-w-xl h-64 bg-white/5 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/70 text-sm">Processing your video request...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

                  {/* Video result or images grid */}
                  {entry.videoUrl ? (
                    <div className="ml-9">
                      <video controls className="w-full max-w-xl rounded-lg bg-black">
                        <source src={entry.videoUrl} />
                      </video>
                    </div>
                  ) : (
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
                  )}
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
              placeholder="Describe your video idea..."
              value={prompt}
              onChange={(e) => dispatch(setPrompt(e.target.value))}
              className={`flex-1 bg-transparent outline-none text-[15px] leading-none text-theme-primary ${
                theme === 'dark' ? 'placeholder:text-white/50' : 'placeholder:text-black/50'
              }`}
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
              disabled={isGenerating || !prompt.trim() || isVideoGenerating}
              className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
            >
              {isVideoGenerating ? 'Generating...' : 'Generate Video'}
            </button>
          </div>
        </div>

        {/* Bottom row: video-specific options */}
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          <ModelsDropdown />
          <DurationDropdown />
          <ResolutionDropdown />
          <FpsDropdown />
        </div>
      </div>
      </div>
    </>
  );
};

export default InputBox;
