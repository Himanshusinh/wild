'use client';

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addHistoryEntry, updateHistoryEntry, loadHistory, clearFilters, loadMoreHistory } from '@/store/slices/historySlice';
import { addNotification } from '@/store/slices/uiSlice';
import { uploadGeneratedAudio } from '@/lib/audioUpload';
import { saveHistoryEntry, updateHistoryEntry as updateFirebaseHistory } from '@/lib/historyService';
import MusicInputBox from './MusicInputBox';
import { Music4 } from 'lucide-react';
import CustomAudioPlayer from './CustomAudioPlayer';

const InputBox = () => {
  const dispatch = useAppDispatch();
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Get user ID from Redux state (adjust based on your auth setup)
  const userId = useAppSelector((state: any) => state.auth?.user?.uid || 'anonymous');

  // Get history entries for music generation
  const historyEntries = useAppSelector((state: any) => {
    const allEntries = state.history.entries || [];
    return allEntries.filter((entry: any) => 
      entry.generationType === 'text-to-music' || 
      entry.generationType === 'text_to_music'
    );
  });

  // Load history on mount
  useEffect(() => {
    dispatch(clearFilters());
    dispatch(loadHistory({ filters: {}, paginationParams: { limit: 10 } }));
  }, [dispatch]);

  // Load more history function
  const loadMoreHistory = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const result = await dispatch(loadHistory({ 
        filters: {}, 
        paginationParams: { 
          limit: 10,
          cursor: historyEntries.length > 0 ? {
            timestamp: historyEntries[historyEntries.length - 1].timestamp,
            id: historyEntries[historyEntries.length - 1].id
          } : undefined
        } 
      })).unwrap();
      
      if (result.entries.length < 10) {
        setHasMore(false);
      }
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load more history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle scroll to load more history - Same as video generation
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        if (hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          // Load more without forcing a single generationType; rely on store filters
          // Note: loadMoreHistory is handled by the existing loadHistory action
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, page, dispatch]);

  const handleGenerate = async (payload: any) => {
    if (!payload.lyrics.trim()) {
      setErrorMessage('Please provide lyrics');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(undefined);
    setResultUrl(undefined);

    // Create loading history entry for Redux (with temporary ID)
    const tempId = Date.now().toString();
    const loadingEntry = {
      id: tempId,
      prompt: payload.prompt, // This will be the formatted prompt from style/instruments
      lyrics: payload.lyrics, // Store lyrics in the entry
      model: payload.model,
      generationType: 'text-to-music' as const,
      images: [],
      status: "generating" as const,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: 1
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
        dispatch(
          addNotification({
            type: "error",
            message: "Failed to save generation to history",
          })
        );
        // Continue with generation even if Firebase save fails
      }

      console.log('🎵 Calling MiniMax music API with payload:', payload);

      const response = await fetch('/api/minimax/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🎵 MiniMax API response:', result);

      if (result.base_resp?.status_code !== 0) {
        throw new Error(result.base_resp?.status_msg || 'MiniMax API error');
      }

      if (!result.data?.audio) {
        throw new Error('No audio data received from MiniMax');
      }

      // Upload audio to Firebase
      const audioId = result.trace_id || Date.now().toString();
      const audioData = await uploadGeneratedAudio(
        result.data.audio,
        audioId,
        payload.output_format || 'hex'
      );

      // Update the history entry with the Firebase audio URL
      const updateData = {
        status: 'completed' as const,
        images: [{
          id: audioId,
          url: audioData.firebaseUrl, // Firebase URL
          firebaseUrl: audioData.firebaseUrl,
          originalUrl: audioData.originalUrl // Original external URL
        }]
      };

      console.log('🎵 Final audio data for history:', updateData);
      console.log('🎵 Firebase URL:', audioData.firebaseUrl);
      console.log('🎵 Original URL:', audioData.originalUrl);
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
      setResultUrl(audioData.firebaseUrl);

      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: 'Music generated successfully!'
      }));

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

      // Update Redux entry with failed status
      dispatch(updateHistoryEntry({
        id: firebaseHistoryId || tempId,
        updates: {
          status: 'failed',
          error: error.message
        }
      }));

      setErrorMessage(error.message || 'Music generation failed');
      dispatch(
        addNotification({
          type: "error",
          message: "Music generation failed",
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* History Section - Fixed overlay like image/video generation */}
      <div className="fixed inset-0 pt-[62px] pl-[68px] pr-6 pb-6 overflow-y-auto z-30">
        <div className="p-6">
          {/* History Header - Fixed during scroll */}
          <div className="sticky top-0 z-10 mb-6 bg-black/80 backdrop-blur-sm py-4 -mx-6 px-6 border-b border-white/10">
            <h2 className="text-white text-xl font-semibold">Music Generation History</h2>
          </div>

          {/* Main Loader */}
          {loading && historyEntries.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                <div className="text-white text-lg">Loading your music generation history...</div>
              </div>
            </div>
          )}

          {/* No History State */}
          {!loading && historyEntries.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <Music4 className="w-8 h-8 text-white/60" />
                </div>
                <div className="text-white text-lg">No music generations yet</div>
                <div className="text-white/60 text-sm max-w-md">
                  Create your first piece of AI-generated music using the interface below
                </div>
              </div>
            </div>
          )}

          {/* History Entries */}
          {historyEntries.length > 0 && (
            <div className="space-y-8">
              {historyEntries.map((entry: any) => (
                <div key={entry.id} className="space-y-4">
                  {/* Entry Header - Same style as image/video generation */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Music4 className="w-3 h-3 text-white/60" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex flex-row-reverse items-start gap-2">
                        <div className="flex-1">
                          {/* Title and lyrics now shown only in CustomAudioPlayer */}
                        </div>
                        {/* Removed copy button - now in CustomAudioPlayer */}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                        <span>
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </span>
                        <span>{entry.model}</span>
                        <span>1 audio track</span>
                        {entry.status === "generating" && (
                          <span className="text-yellow-400 flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            Generating...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Audio Grid - Same grid style as image/video generation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-9">
                    {entry.images.map((audio: any) => (
                      <div key={audio.id} className="bg-black/40 backdrop-blur-xl rounded-lg p-4 ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200">
                        {entry.status === 'generating' ? (
                          // Loading state - Same as image/video generation
                          <div className="w-full h-24 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                              <div className="text-xs text-white/60">Generating...</div>
                            </div>
                          </div>
                        ) : entry.status === 'failed' ? (
                          // Error state - Same as image/video generation
                          <div className="w-full h-24 flex items-center justify-center bg-red-500/20 rounded-lg">
                            <div className="flex flex-col items-center gap-2">
                              <div className="text-red-400 text-sm">Failed</div>
                              {entry.error && (
                                <div className="text-red-300 text-xs text-center max-w-[200px]">
                                  {entry.error}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Completed audio - Custom player matching UI style
                          <div className="space-y-3">
                            <CustomAudioPlayer 
                              audioUrl={audio.firebaseUrl || audio.url}
                              prompt={entry.prompt}
                              model={entry.model}
                              lyrics={entry.lyrics}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Scroll Loading Indicator - Same as image/video generation */}
              {hasMore && loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                    <div className="text-sm text-white/60">Loading more generations...</div>
                  </div>
                </div>
              )}
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
    </>
  );
};

export default InputBox;
