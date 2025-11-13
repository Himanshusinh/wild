'use client';

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addHistoryEntry, updateHistoryEntry, loadMoreHistory } from '@/store/slices/historySlice';
import { addNotification } from '@/store/slices/uiSlice';
import { uploadGeneratedAudio } from '@/lib/audioUpload';
import { minimaxMusic } from '@/store/slices/generationsApi';
import { requestCreditsRefresh } from '@/lib/creditsBus';
import { useGenerationCredits } from '@/hooks/useCredits';
// historyService removed; backend persists history
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
const updateFirebaseHistory = async (_id: string, _updates: any) => {};
import MusicInputBox from './MusicInputBox';
import { useIntersectionObserverForRef } from '@/hooks/useInfiniteGenerations';
import { Music4 } from 'lucide-react';
import CustomAudioPlayer from './CustomAudioPlayer';
import WildMindLogoGenerating from '@/app/components/WildMindLogoGenerating';
import { useHistoryLoader } from '@/hooks/useHistoryLoader';

const InputBox = () => {
  const dispatch = useAppDispatch();
  // Self-manage history loads for music to avoid central duplicate requests
  const { refreshImmediate: refreshMusicHistoryImmediate } = useHistoryLoader({ generationType: 'text-to-music' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  // Use global history pagination/loading state
  const storeHasMore = useAppSelector((s: any) => s.history?.hasMore || false);
  const storeLoading = useAppSelector((s: any) => s.history?.loading || false);
  const [page, setPage] = useState(1);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = React.useRef(false);
  const hasUserScrolledRef = React.useRef(false);
  const didAutoFillRef = React.useRef(false);
  const [selectedAudio, setSelectedAudio] = useState<{
    entry: any;
    audio: any;
  } | null>(null);

  // Local preview state for immediate UI feedback
  const [localMusicPreview, setLocalMusicPreview] = useState<any>(null);
  const todayKey = new Date().toDateString();

  // Auto-fill viewport so the page mirrors image/video history behavior
  const autoFillViewport = async () => {
    try {
      if (didAutoFillRef.current) return;
      let attempts = 0;
      while (
        attempts < 3 &&
        (document.documentElement.scrollHeight - window.innerHeight) < 200 &&
        (storeHasMore && !storeLoading)
      ) {
        await (dispatch as any)(loadMoreHistory({
          filters: { generationType: 'text-to-music' },
          paginationParams: { limit: 10 }
        } as any)).unwrap();
        attempts += 1;
      }
      didAutoFillRef.current = true;
    } catch {}
  };

  // Auto-clear local preview after completion/failure
  useEffect(() => {
    if (!localMusicPreview) return;
    if (localMusicPreview.status === 'completed' || localMusicPreview.status === 'failed') {
      const t = setTimeout(() => setLocalMusicPreview(null), 1500);
      return () => clearTimeout(t);
    }
  }, [localMusicPreview]);

  // Get user ID from Redux state (adjust based on your auth setup)
  const userId = useAppSelector((state: any) => state.auth?.user?.uid || 'anonymous');

  // Credits management
  const {
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    creditBalance,
    clearCreditsError,
  } = useGenerationCredits('music', 'music-1.5', {
    duration: 90, // Default duration for music
  });

  // Get history entries for music generation
  const historyEntries = useAppSelector((state: any) => {
    const allEntries = state.history.entries || [];
    return allEntries.filter((entry: any) => 
      entry.generationType === 'text-to-music' || 
      entry.generationType === 'text_to_music'
    );
  });

  // Group entries by date
  const groupedByDate = historyEntries.reduce((groups: { [key: string]: any[] }, entry: any) => {
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

  // Initial history is loaded centrally by PageRouter; after it finishes, auto-fill if content is short
  useEffect(() => {
    // Trigger viewport top-up once when initial data arrives
    autoFillViewport();
  }, [historyEntries.length, storeHasMore, storeLoading]);

  // Remove unused local loader; rely on Redux loadMoreHistory

  // Mark user scroll
  useEffect(() => {
    const onScroll = () => { hasUserScrolledRef.current = true; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll as any);
  }, []);

  // Standardized intersection observer for music history
  useIntersectionObserverForRef(
    sentinelRef,
    async () => {
      const nextPage = page + 1;
      setPage(nextPage);
      try {
        await (dispatch as any)(loadMoreHistory({
          filters: { generationType: 'text-to-music' },
          paginationParams: { limit: 10 }
        } as any)).unwrap();
      } catch (e: any) {
        if (!(e?.message?.includes && e?.message?.includes('no more pages'))) {
          console.error('[Music] IO loadMore error', e);
        }
      }
    },
    storeHasMore,
    storeLoading,
    { root: null, threshold: 0.1, requireUserScrollRef: hasUserScrolledRef }
  );

  const handleGenerate = async (payload: any) => {
    if (!payload.lyrics.trim()) {
      setErrorMessage('Please provide lyrics');
      return;
    }

    // Check authentication before allowing generation
    const hasSession = document.cookie.includes('app_session');
    const hasToken = localStorage.getItem('authToken') || localStorage.getItem('user');
    
    if (!hasSession && !hasToken) {
      setErrorMessage('Please sign in to generate music');
      // Redirect to signup page
      window.location.href = '/view/signup?next=/text-to-music';
      return;
    }

    // Clear any previous credit errors
    clearCreditsError();

    // Validate and reserve credits before generation
    let transactionId: string;
    try {
      const creditResult = await validateAndReserveCredits();
      transactionId = creditResult.transactionId;
      console.log('✅ Credits reserved for music generation:', creditResult);
    } catch (creditError: any) {
      console.error('❌ Credit validation failed:', creditError);
      setErrorMessage(creditError.message || 'Insufficient credits for generation');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(undefined);
    setResultUrl(undefined);

    // Create local preview immediately for UI feedback
    setLocalMusicPreview({
      id: `music-loading-${Date.now()}`,
      prompt: payload.prompt,
      model: payload.model,
      generationType: 'text-to-music',
      images: [{ id: 'music-loading', url: '', originalUrl: '' }],
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: 1,
      status: 'generating'
    });

    // Create loading history entry for Redux (with temporary ID)
    const tempId = Date.now().toString();
    const loadingEntry = {
      id: tempId,
      prompt: payload.prompt, // This will be the formatted prompt from style/instruments
      model: payload.model,
      lyrics: payload.lyrics,
      generationType: 'text-to-music' as const,
      images: [], // Will store audio data in this field
      status: "generating" as const,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: 1 // For music, this represents audio count
    };

    // Add to Redux with temporary ID
    dispatch(addHistoryEntry(loadingEntry));

    let firebaseHistoryId: string | null = null;

    try {
      // Save to Firebase first (without ID field)
      try {
        const { id, ...loadingEntryWithoutId } = loadingEntry;
        firebaseHistoryId = await saveHistoryEntry(loadingEntryWithoutId);
        console.log('✅ Firebase history entry created with ID:', firebaseHistoryId);
        console.log('🔗 Firebase document path: generationHistory/' + firebaseHistoryId);

        // Update Redux entry with Firebase ID (replace tempId with firebaseHistoryId)
        dispatch(updateHistoryEntry({
          id: tempId,
          updates: { id: firebaseHistoryId }
        }));

        // Don't modify the loadingEntry object - use firebaseHistoryId directly
        console.log('Using Firebase ID for all operations:', firebaseHistoryId);
      } catch (firebaseError) {
        console.error('❌ Firebase save failed:', firebaseError);
        try { const toast = (await import('react-hot-toast')).default; toast.error('Failed to save generation to history'); } catch {}
        // Continue with generation even if Firebase save fails
      }

      // Add isPublic from backend policy
      const { getIsPublic } = await import('@/lib/publicFlag');
      const isPublic = await getIsPublic();
      console.log('🎵 Calling MiniMax music API with payload via thunk:', { ...payload, isPublic });
      const result = await dispatch(minimaxMusic({ ...payload, isPublic })).unwrap();
      console.log('🎵 MiniMax music thunk result:', result);

      // Backend returns: { historyId, audios: [audioItem], status: 'completed', debitedCredits }
      if (!result || result.status !== 'completed') {
        throw new Error(result?.error || 'Music generation failed');
      }

      const audios = result.audios || [];
      if (audios.length === 0) {
        throw new Error('No audio data received from MiniMax');
      }

      const audioItem = audios[0]; // Get the first audio item
      const audioUrl = audioItem.url || audioItem.firebaseUrl;

      if (!audioUrl) {
        throw new Error('No audio URL received from MiniMax');
      }

      // Update the history entry with the audio URL from backend
      // Store in both audios and images fields for compatibility
      const updateData = {
        status: 'completed' as const,
        audios: [{
          id: audioItem.id || 'music-1',
          url: audioUrl,
          firebaseUrl: audioUrl,
          originalUrl: audioItem.originalUrl || audioUrl,
          storagePath: audioItem.storagePath
        }],
        images: [{
          id: audioItem.id || 'music-1',
          url: audioUrl,
          firebaseUrl: audioUrl,
          originalUrl: audioItem.originalUrl || audioUrl,
          storagePath: audioItem.storagePath,
          type: 'audio' // Mark this as audio type
        }],
        lyrics: payload.lyrics
      };

      console.log('🎵 Final audio data for history:', updateData);
      console.log('🎵 Audio URL:', audioUrl);
      console.log('🎵 History ID being updated:', firebaseHistoryId || tempId);

      // Update Redux entry with completion data
      console.log('🎵 Updating Redux history entry with ID:', firebaseHistoryId || tempId);
      dispatch(updateHistoryEntry({
        id: firebaseHistoryId || tempId,
        updates: updateData
      }));
      console.log('🎵 Redux history entry updated');

      // Update Firebase
      if (firebaseHistoryId) {
        try {
          await updateFirebaseHistory(firebaseHistoryId, updateData);
          console.log('✅ Firebase history updated successfully');
        } catch (firebaseError) {
          console.error('❌ Firebase update failed:', firebaseError);
        }
      }

      // Set result URL for audio player
      setResultUrl(audioUrl);

      // Update local preview to completed
      setLocalMusicPreview((prev: any) => prev ? ({
        ...prev,
        status: 'completed',
        images: [{ id: 'music-completed', url: audioUrl, originalUrl: audioUrl }]
      }) : prev);

      // Show success notification
      try { const toast = (await import('react-hot-toast')).default; toast.success('Music generated successfully!'); } catch {}

      // Handle credit success
      if (transactionId) {
        await handleGenerationSuccess(transactionId);
      }

      // Refresh history immediately to show the new music
      refreshMusicHistoryImmediate();

      console.log('✅ Music generation completed successfully');

    } catch (error: any) {
      console.error('❌ Music generation failed:', error);
      
      // Update history entry with failed status
      if (firebaseHistoryId) {
        try {
          await updateFirebaseHistory(firebaseHistoryId, {
            status: 'failed',
            error: error.message
          });
        } catch (firebaseError) {
          console.error('❌ Firebase error update failed:', firebaseError);
        }
      }

      // Update local preview to failed
      setLocalMusicPreview((prev: any) => prev ? ({
        ...prev,
        status: 'failed'
      }) : prev);

      // Update Redux entry with failed status
      dispatch(updateHistoryEntry({
        id: firebaseHistoryId || tempId,
        updates: {
          status: 'failed',
          error: error.message
        }
      }));

      setErrorMessage(error.message || 'Music generation failed');
      try { const toast = (await import('react-hot-toast')).default; toast.error('Music generation failed'); } catch {}
      
      // Handle credit failure
      if (transactionId) {
        await handleGenerationFailure(transactionId);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* History Section - Fixed overlay like image/video generation */}
      <div className=" inset-0  pl-[0] pr-6 pb-6 overflow-y-auto no-scrollbar z-0 scrollbar-hide">
          <div className="py-6 pl-4 "> 
          {/* History Header - Fixed during scroll */}
          <div className="fixed top-0 left-0 right-0 z-30 py-5 ml-18 mr-1  backdrop-blur-lg shadow-xl pl-6 ">
            <h2 className="text-xl font-semibold text-white pl-0 ">Music Generation </h2>
          </div>
          {/* Spacer to keep content below fixed header */}
          <div className="h-0"></div>

          {/* Main Loader */}
          {storeLoading && historyEntries.length === 0 && (
              <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center gap-4">
                  <WildMindLogoGenerating 
                    running={true}
                    size="lg"
                    speedMs={1600}
                    className="mx-auto"
                  />
                  <div className="text-white text-lg text-center">Loading your generation history...</div>
                </div>
              </div>
            )}

          {/* No History State */}
          {!storeLoading && historyEntries.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                  <Music4 className="w-8 h-8 text-white/60" />
                </div>
                <div className="text-white text-lg">No music generations yet</div>
                <div className="text-white/60 text-sm max-w-md">
                  Create your first piece of AI-generated music using the interface below
                </div>
              </div>
            </div>
          )}

          {/* If no row for today yet, render one with preview */}
          {localMusicPreview && !groupedByDate[todayKey] && (
            <div className="space-y-4">
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
                  {new Date(todayKey).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </h3>
              </div>

              {/* All Music Tracks for this Date - Horizontal Layout */}
              <div className="flex flex-wrap gap-3 ml-9">
                <MusicTileFromPreview preview={localMusicPreview} />
              </div>
            </div>
          )}

          {/* History Entries - Grouped by Date */}
          {historyEntries.length > 0 && (
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

                  {/* All Music Tracks for this Date - Horizontal Layout */}
                  <div className="flex flex-wrap gap-3 ml-9">
                    {/* Prepend local preview to today's row to push items right */}
                    {date === todayKey && localMusicPreview && <MusicTileFromPreview preview={localMusicPreview} />}
                    {groupedByDate[date].map((entry: any) => 
                      (entry.audios || entry.images || []).map((audio: any) => (
                        <div
                          key={`${entry.id}-${audio.id}`}
                          onClick={() => setSelectedAudio({ entry, audio })}
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
                                  Composing...
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
                            // Completed music track
                            <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center relative">
                              {/* Song Logo/Icon */}
                              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <Music4 className="w-8 h-8 text-white/80" />
                              </div>
                              
                              {/* Play button overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                              
                          {/* Music track label */}
                          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                            {/* <span className="text-xs text-white">Audio</span> */}
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

              {/* Scroll Loading Indicator - Same as image/video generation */}
              {storeHasMore && storeLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <WildMindLogoGenerating 
                      running={storeLoading}
                      size="md"
                      speedMs={1600}
                      className="mx-auto"
                    />
                    <div className="text-sm text-white/60">Loading more generations...</div>
                  </div>
                </div>
              )}
              <div ref={sentinelRef} style={{ height: 1 }} />
            </div>
          )}
        </div>
      </div>

      {/* Error Message Display */}
      {errorMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[840px] z-[60]">
          <div className="rounded-2xl bg-red-500/15 ring-1 ring-red-500/30 p-3">
            <div className="text-red-300 text-sm">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Music Input Box - Fixed position with proper z-index */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[840px] z-[60]">
        <MusicInputBox
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          resultUrl={resultUrl}
          errorMessage={errorMessage}
        />
      </div>

      {/* Audio Player Modal */}
      {selectedAudio && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
          <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full ring-1 ring-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Music Track</h3>
              <button
                onClick={() => setSelectedAudio(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <CustomAudioPlayer 
              audioUrl={selectedAudio.audio.url || selectedAudio.audio.firebaseUrl}
              prompt={selectedAudio.entry.lyrics || selectedAudio.entry.prompt}
              model={selectedAudio.entry.model}
              lyrics={selectedAudio.entry.lyrics}
              autoPlay={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default InputBox;

// Helper component for music preview tile
const MusicTileFromPreview = ({ preview }: { preview: any }) => (
  <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 flex-shrink-0">
    {preview.status === 'generating' ? (
      <div className="w-full h-full flex items-center justify-center bg-black/90">
        <div className="flex flex-col items-center gap-2">
          <WildMindLogoGenerating 
            running={preview.status === 'generating'}
            size="md"
            speedMs={1600}
            className="mx-auto"
          />
          <div className="text-xs text-white/60 text-center">Composing...</div>
        </div>
      </div>
    ) : preview.status === 'failed' ? (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
        <div className="flex flex-col items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <div className="text-xs text-red-400">Failed</div>
        </div>
      </div>
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center relative">
        {/* Song Logo/Icon */}
        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
          <Music4 className="w-8 h-8 text-white/80" />
        </div>
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-1">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
    )}
    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Music</div>
  </div>
);
