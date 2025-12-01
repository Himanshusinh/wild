'use client';

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { store } from '@/store';
import { addHistoryEntry, updateHistoryEntry, removeHistoryEntry } from '@/store/slices/historySlice';
import { minimaxMusic, falElevenTts } from '@/store/slices/generationsApi';
import { useGenerationCredits } from '@/hooks/useCredits';
// historyService removed; backend persists history
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
const updateFirebaseHistory = async (_id: string, _updates: any) => {};
import MusicInputBox from './MusicInputBox';
import { toast } from 'react-hot-toast';
import { useBottomScrollPagination } from '@/hooks/useBottomScrollPagination';
import { Music4 } from 'lucide-react';
import CustomAudioPlayer from './CustomAudioPlayer';
import { useHistoryLoader } from '@/hooks/useHistoryLoader';
import MusicHistory from "./MusicHistory";

const MusicGenerationInputBox = (props?: { showHistoryOnly?: boolean }) => {
  const dispatch = useAppDispatch();
  // Self-manage history loads for music to avoid central duplicate requests
  const { refreshImmediate: refreshMusicHistoryImmediate } = useHistoryLoader({ generationType: 'text-to-music' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Local preview state for immediate UI feedback
  const [localMusicPreview, setLocalMusicPreview] = useState<any>(null);

  // Auto-clear local preview after completion/failure
  useEffect(() => {
    if (!localMusicPreview) return;
    if (localMusicPreview.status === 'completed' || localMusicPreview.status === 'failed') {
      const t = setTimeout(() => setLocalMusicPreview(null), 1500);
      return () => clearTimeout(t);
    }
  }, [localMusicPreview]);

  // Credits management
  const {
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    clearCreditsError,
  } = useGenerationCredits('music', 'minimax-music-2', {
    duration: 90, // Default duration for music
  });

  const handleGenerate = async (payload: any) => {
    const isTtsModel = typeof payload?.model === 'string' && payload.model.toLowerCase().includes('eleven');
    const primaryText = (isTtsModel ? payload?.text : payload?.lyrics) || payload?.prompt || '';
    if (!primaryText.trim()) {
      setErrorMessage(isTtsModel ? 'Please provide text' : 'Please provide lyrics');
      return;
    }
    const normalizedText = primaryText.trim();
    if (isTtsModel) {
      payload.text = normalizedText;
      payload.prompt = payload.prompt || normalizedText;
      payload.lyrics = normalizedText;
      payload.generationType = payload.generationType || 'text-to-music';
    } else {
      payload.lyrics = normalizedText;
      payload.prompt = payload.prompt || normalizedText;
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

      // Get file name from payload or use default
      const fileName = payload.fileName || '';
      
      // Create local preview immediately for UI feedback
      setLocalMusicPreview({
        id: `music-loading-${Date.now()}`,
        prompt: normalizedText,
        model: payload.model,
        generationType: 'text-to-music',
        images: [{ id: 'music-loading', url: '', originalUrl: '' }],
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 1,
        status: 'generating',
        fileName: fileName
      });

    // For MiniMax Music 2, the backend creates the history entry, so we'll use that historyId
    // For other models, we create a loading entry first
    const isMiniMaxMusic2 = payload.model === 'minimax-music-2';
    let tempId: string | null = null;
    let backendHistoryId: string | null = null;

      if (!isMiniMaxMusic2) {
      // Create loading history entry for Redux (with temporary ID) - only for non-MiniMax Music 2
      tempId = Date.now().toString();
      const fileName = payload.fileName || '';
      const loadingEntry = {
        id: tempId,
        prompt: normalizedText,
        model: payload.model,
        lyrics: normalizedText,
        generationType: 'text-to-music' as const,
        images: [{ id: 'loading', url: '', originalUrl: '', type: 'audio' }], // Placeholder for generating state - ensures tile renders
        audios: [], // Will store audio data when completed
        status: "generating" as const,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 1, // For music, this represents audio count
        fileName: fileName
      };
      
      // Force immediate refresh to show loading animation
      console.log('🎵 Adding loading entry to Redux:', loadingEntry);

      // Add to Redux with temporary ID
      dispatch(addHistoryEntry(loadingEntry));
      
      // Force immediate UI update to show loading animation
      // Use requestAnimationFrame to ensure the entry is visible
      requestAnimationFrame(() => {
        // Entry is already in Redux, just ensure UI updates
      });

      // Save to Firebase first (without ID field)
      try {
        const { id, ...loadingEntryWithoutId } = loadingEntry;
        const firebaseHistoryId = await saveHistoryEntry(loadingEntryWithoutId);
        console.log('✅ Firebase history entry created with ID:', firebaseHistoryId);

        // Update Redux entry with Firebase ID (replace tempId with firebaseHistoryId)
        dispatch(updateHistoryEntry({
          id: tempId,
          updates: { id: firebaseHistoryId }
        }));
        tempId = firebaseHistoryId;
      } catch (firebaseError) {
        console.error('❌ Firebase save failed:', firebaseError);
        try { const toast = (await import('react-hot-toast')).default; toast.error('Failed to save generation to history'); } catch {}
      }
    } else {
      // For MiniMax Music 2, create a temporary loading entry that will be replaced by backend entry
      // DO NOT refresh here - it will load backend entries and cause duplicates
      tempId = `loading-${Date.now()}`;
      const fileName = payload.fileName || '';
      const loadingEntry = {
        id: tempId,
        prompt: normalizedText,
        model: payload.model,
        lyrics: payload.lyrics_prompt || payload.lyrics || normalizedText,
        generationType: 'text-to-music' as const,
        images: [{ id: 'loading', url: '', originalUrl: '', type: 'audio' }],
        audios: [],
        status: "generating" as const,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 1,
        fileName: fileName
      };
      
      console.log('🎵 Adding loading entry for MiniMax Music 2:', loadingEntry);
      dispatch(addHistoryEntry(loadingEntry));
      // Force UI update without refreshing from backend
      requestAnimationFrame(() => {
        // Just trigger a re-render, don't fetch from backend
      });
    }

    try {
      // Add isPublic from backend policy
      const { getIsPublic } = await import('@/lib/publicFlag');
      const isPublic = await getIsPublic();
      console.log('🎵 Calling music API with payload via thunk:', { ...payload, isPublic });
      const requestPayload = { ...payload, isPublic, prompt: payload.prompt || normalizedText };
      
      // Use MiniMax API for MiniMax Music 2, otherwise use existing endpoints
      let result: any;
      if (requestPayload.model === 'minimax-music-2') {
        // Transform payload for MiniMax API: lyrics_prompt -> lyrics
        const minimaxPayload = {
          ...requestPayload,
          model: 'music-2.0',
          lyrics: requestPayload.lyrics_prompt || requestPayload.lyrics || normalizedText,
          lyrics_prompt: undefined, // Remove lyrics_prompt, use lyrics instead
        };
        result = await dispatch(minimaxMusic(minimaxPayload)).unwrap();
        console.log('🎵 Music generation thunk result:', result);
        if (!result || result.status !== 'completed') {
          throw new Error(result?.error || 'Generation failed');
        }
        // Use backend's historyId for MiniMax Music 2
        backendHistoryId = result.historyId;
        if (backendHistoryId && tempId) {
          // Remove the temporary loading entry
          dispatch(removeHistoryEntry(tempId));
          tempId = null;
        }
      } else {
        result = isTtsModel
          ? await dispatch(falElevenTts(requestPayload)).unwrap()
          : await dispatch(minimaxMusic(requestPayload)).unwrap();
        console.log('🎵 Music generation thunk result:', result);

        if (!result || result.status !== 'completed') {
          throw new Error(result?.error || 'Generation failed');
        }
      }

      // Extract audio data - prefer audios array from backend, fallback to audio object
      let audioItem: any;
      let audiosArray: any[] = [];
      
      if (isTtsModel) {
        if (Array.isArray(result.audios) && result.audios.length > 0) {
          audiosArray = result.audios;
          audioItem = result.audios[0];
        } else if (result.audio) {
          audiosArray = [result.audio];
          audioItem = result.audio;
        }
      } else {
        audiosArray = Array.isArray(result.audios) ? result.audios : [];
        audioItem = audiosArray[0];
      }

      if (!audioItem) {
        console.error('❌ No audio data in response:', result);
        throw new Error('No audio data received from generator');
      }

      const audioUrl = audioItem.url || audioItem.firebaseUrl || audioItem.originalUrl;
      if (!audioUrl) {
        console.error('❌ No audio URL in audioItem:', audioItem);
        throw new Error('No audio URL received from generator');
      }

      // Use audios array from backend if available, otherwise create from audioItem
      const finalAudios = audiosArray.length > 0 ? audiosArray : [{
        id: audioItem.id || 'music-1',
        url: audioUrl,
        firebaseUrl: audioUrl,
        originalUrl: audioItem.originalUrl || audioUrl,
        storagePath: audioItem.storagePath || ''
      }];

      // Use backend's historyId if available, otherwise use frontend-created one
      const historyIdToUpdate = backendHistoryId || tempId;
      
      // Update the history entry with the audio URL from backend
      // Store in both audios and images fields for compatibility
      const fileName = payload.fileName || '';
      const updateData = {
        status: 'completed' as const,
        audios: finalAudios,
        images: finalAudios.map(a => ({ ...a, type: 'audio' })),
        lyrics: payload.lyrics_prompt || payload.lyrics || payload.text || payload.prompt,
        fileName: fileName
      };

      console.log('🎵 Final audio data for history:', updateData);
      console.log('🎵 Audio URL:', audioUrl);
      console.log('🎵 History ID being updated:', historyIdToUpdate);
      console.log('🎵 Backend result:', result);

      if (backendHistoryId) {
        // Backend already created the entry, so remove temp entry and add the completed entry
        if (tempId) {
          console.log('🗑️ Removing temp loading entry:', tempId);
          dispatch(removeHistoryEntry(tempId));
        }
        // Get fresh history entries to check for duplicates
        const currentState = store.getState();
        const currentEntries = currentState.history?.entries || [];
        // Check if backend entry already exists in Redux (shouldn't happen, but check anyway)
        const existingEntry = currentEntries.find((e: any) => e.id === backendHistoryId);
        if (!existingEntry) {
          // Add the completed entry from backend to Redux immediately
          const completedEntry = {
            id: backendHistoryId,
            prompt: normalizedText,
            model: payload.model,
            generationType: 'text-to-music' as const,
            ...updateData, // updateData already contains lyrics and fileName
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            imageCount: 1
          };
          console.log('✅ Adding backend entry to Redux:', backendHistoryId, completedEntry);
          dispatch(addHistoryEntry(completedEntry));
        } else {
          // Update existing entry with completed data (shouldn't happen, but handle it)
          console.log('⚠️ Backend entry already exists, updating:', backendHistoryId);
          dispatch(updateHistoryEntry({
            id: backendHistoryId,
            updates: updateData
          }));
        }
      } else if (tempId) {
        // Update Redux entry with completion data (for non-MiniMax Music 2)
        console.log('🎵 Updating Redux history entry with ID:', tempId);
        dispatch(updateHistoryEntry({
          id: tempId,
          updates: updateData
        }));
        console.log('🎵 Redux history entry updated with audios:', updateData.audios.length, 'items');

        // Update Firebase
        try {
          await updateFirebaseHistory(tempId, updateData);
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

      // Refresh history after a short delay to ensure backend has updated
      // For MiniMax Music 2, we already added the entry, so skip refresh to avoid duplicates
      // For others, refresh to sync with backend
      if (!backendHistoryId) {
        setTimeout(() => {
          console.log('🔄 Refreshing music history...');
          refreshMusicHistoryImmediate();
        }, 500);
      } else {
        console.log('✅ Skipping refresh for MiniMax Music 2 (entry already added)');
      }

      console.log('✅ Music generation completed successfully');

    } catch (error: any) {
      console.error('❌ Music generation failed:', error);
      
      const historyIdToUpdate = backendHistoryId || tempId;
      
      // For MiniMax Music 2, backend creates the entry, so we update it via refresh
      // For others, update the frontend-created entry
      if (backendHistoryId) {
        // Backend will handle the failed status, remove temp entry and refresh to show backend entry
        if (tempId) {
          dispatch(removeHistoryEntry(tempId));
        }
        // Refresh to load the backend's failed entry
        setTimeout(() => {
          refreshMusicHistoryImmediate();
        }, 100);
      } else if (tempId) {
        // Update Firebase for non-MiniMax Music 2
        try {
          await updateFirebaseHistory(tempId, {
            status: 'failed',
            error: error.message
          });
        } catch (firebaseError) {
          console.error('❌ Firebase error update failed:', firebaseError);
        }

        // Update Redux entry with failed status - but keep it visible
        // Ensure images array exists so the tile still renders
        dispatch(updateHistoryEntry({
          id: tempId,
          updates: {
            status: 'failed',
            error: error.message,
            // Keep images array so the tile still renders - use the same structure as loading
            images: [{ id: 'failed', url: '', originalUrl: '', type: 'audio', error: error.message }] as any,
            // Also ensure audios array exists
            audios: []
          }
        }));
      }

      // Update local preview to failed
      setLocalMusicPreview((prev: any) => prev ? ({
        ...prev,
        status: 'failed'
      }) : prev);
      
      // Force refresh to show failed state
      setTimeout(() => {
        refreshMusicHistoryImmediate();
      }, 100);

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

  const [selectedAudio, setSelectedAudio] = useState<{
    entry: any;
    audio: any;
  } | null>(null);

  const showHistoryOnly = props?.showHistoryOnly || false;

  return (
    <>
      {showHistoryOnly ? (
        <MusicHistory
          generationType="text-to-music"
          allowedTypes={['text-to-music', 'text_to_music']}
          onAudioSelect={setSelectedAudio}
          selectedAudio={selectedAudio}
          localPreview={localMusicPreview}
        />
      ) : (
        <>
          {/* Error Message Display */}
          {errorMessage && (
            <div className="mb-4 z-[60]">
              <div className="rounded-2xl bg-red-500/15 ring-1 ring-red-500/30 p-3">
                <div className="text-red-300 text-sm">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Music Input Box */}
          <div className="w-full -mt-6 bg-white/5 backdrop-blur-3xl  rounded-2xl">
            <MusicInputBox
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              resultUrl={resultUrl}
              errorMessage={errorMessage}
            />
          </div>
        </>
      )}

      {/* Audio Player Modal - Rendered for both history and input views */}
      {selectedAudio && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
          <div className="bg-white/5 backdrop-blur-3xl rounded-2xl p-6 max-w-4xl w-full ring-1 ring-white/20">
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
              audioUrl={selectedAudio.audio.url || selectedAudio.audio.firebaseUrl || selectedAudio.audio.originalUrl}
              prompt={selectedAudio.entry.prompt}
              model={selectedAudio.entry.model}
              lyrics={selectedAudio.entry.lyrics}
              generationType={selectedAudio.entry.generationType || 'text-to-music'}
              autoPlay={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MusicGenerationInputBox;
