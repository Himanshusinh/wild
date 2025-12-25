'use client';

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { store } from '@/store';
import { addHistoryEntry, updateHistoryEntry, removeHistoryEntry } from '@/store/slices/historySlice';
import { addActiveGeneration, updateActiveGeneration, removeActiveGeneration } from '@/store/slices/generationSlice';
import { minimaxMusic, falElevenTts } from '@/store/slices/generationsApi';
import { useGenerationCredits } from '@/hooks/useCredits';
import { useCredits } from '@/hooks/useCredits';
import { getModelCreditInfo } from '@/utils/modelCredits';
import ActiveGenerationsPanel from '@/app/view/Generation/ImageGeneration/TextToImage/compo/ActiveGenerationsPanel';
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
import axiosInstance from "@/lib/axiosInstance";

const MusicGenerationInputBox = (props?: { showHistoryOnly?: boolean }) => {
  const dispatch = useAppDispatch();
  // Self-manage history loads for music to avoid central duplicate requests
  const { refreshImmediate: refreshMusicHistoryImmediate } = useHistoryLoader({ generationType: 'text-to-music' });
  
  // Redux selector for parallel generation support
  const activeGenerations = useAppSelector(state => state.generation.activeGenerations);
  // Only count running generations towards the limit (limit is 4)
  // This allows completed/failed items to be auto-replaced by new ones
  const runningGenerationsCount = activeGenerations.filter(g => g.status === 'pending' || g.status === 'generating').length;
  
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

  const {
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction,
    refreshCredits,
  } = useCredits();

  // Function to fetch and add/update a single generation instead of reloading all
  const refreshSingleGeneration = async (historyId: string) => {
    try {
      const res = await axiosInstance.get(`/api/generations/${historyId}`);
      const item = res.data?.data?.item;
      
      if (!item) {
        console.warn('[refreshSingleGeneration] Music generation not found, falling back to full refresh');
        refreshMusicHistoryImmediate();
        return;
      }

      // Normalize the item to match HistoryEntry format
      const normalizedEntry = {
        ...item,
        id: item.id || historyId,
        timestamp: item.createdAt || item.updatedAt || item.timestamp || new Date().toISOString(),
        createdAt: item.createdAt || item.updatedAt || new Date().toISOString(),
      };

      // Check if entry already exists in Redux
      const currentState = store.getState();
      const currentEntries = currentState.history?.entries || [];
      const existing = currentEntries.find((e: any) => 
        String(e?.id || '') === String(historyId) ||
        String(e?.id || '') === String(normalizedEntry.id)
      );

      if (existing) {
        // Update existing entry
        console.log('[refreshSingleGeneration] Updating existing music generation:', existing.id);
        dispatch(updateHistoryEntry({
          id: existing.id,
          updates: {
            status: normalizedEntry.status,
            audios: normalizedEntry.audios,
            images: normalizedEntry.images,
            timestamp: normalizedEntry.timestamp,
          }
        }));
      } else {
        // Add new entry
        console.log('[refreshSingleGeneration] Adding new music generation:', normalizedEntry.id);
        dispatch(addHistoryEntry(normalizedEntry));
      }

      // Correlate with active generation by prompt+timestamp
      try {
        const ne = normalizedEntry as any;
        const nePrompt = String(ne?.prompt || '').trim().toLowerCase();
        const neTime = ne?.createdAt ? Date.parse(ne.createdAt) : Date.now();
        const MAX_TIME_DIFF = 120000; // 2 minutes

        activeGenerations.forEach((g: any) => {
          try {
            const gPrompt = String(g?.prompt || '').trim().toLowerCase();
            const gTime = typeof g?.createdAt === 'number' ? g.createdAt : Date.parse(String(g?.createdAt || '')) || Date.now();
            const timeDiff = Math.abs(neTime - gTime);
            
            if (gPrompt && nePrompt && gPrompt === nePrompt && timeDiff < MAX_TIME_DIFF) {
              console.log('[refreshSingleGeneration] Correlating active music generation:', { genId: g.id, historyId: normalizedEntry.id });
              dispatch(updateActiveGeneration({
                id: g.id,
                updates: { historyId: normalizedEntry.id }
              }));
            }
          } catch (e) {
            // Continue with next generation
          }
        });
      } catch (e) {
        console.error('[refreshSingleGeneration] Failed to correlate with active generations:', e);
      }

    } catch (error) {
      console.error('[refreshSingleGeneration] Failed to fetch music generation, falling back to full refresh:', error);
      refreshMusicHistoryImmediate();
    }
  };


  const handleGenerate = async (payload: any) => {
    const isTtsModel = typeof payload?.model === 'string' && payload.model.toLowerCase().includes('eleven');
    const primaryText = (isTtsModel ? payload?.text : payload?.lyrics) || payload?.prompt || '';
    if (!primaryText.trim()) {
      setErrorMessage(isTtsModel ? 'Please provide text' : 'Please provide lyrics');
      return;
    }

    // Check parallel generation limit (only counting running ones)
    if (runningGenerationsCount >= 4) {
      toast.error('Queue full (4/4 active). Please wait for a generation to complete.');
      return;
    }

    const normalizedText = primaryText.trim();

    // Create tracking ID for queue
    const generationId = `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    // Add to active generations queue immediately
    console.log('[queue] Adding new music generation to queue:', { generationId, model: payload?.model, prompt: normalizedText.slice(0, 50) });
    dispatch(addActiveGeneration({
      id: generationId,
      prompt: normalizedText,
      model: payload?.model || 'minimax-music-2',
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      params: {
        generationType: isTtsModel ? 'text-to-speech' : 'text-to-music',
        lyrics: normalizedText,
        fileName: payload?.fileName,
      }
    }));
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

    // Validate and reserve credits before generation (plus optimistic UI debit)
    let optimisticDebit = 0;
    const musicCredits = (() => {
      const info = getModelCreditInfo(payload?.model || 'minimax-music-2');
      return info?.credits || 0;
    })();

    let transactionId: string;
    try {
      if (musicCredits > 0) {
        try {
          deductCreditsOptimisticForGeneration(musicCredits);
          optimisticDebit = musicCredits;
        } catch { /* ignore optimistic errors */ }
      }

      const creditResult = await validateAndReserveCredits();
      transactionId = creditResult.transactionId;
      console.log('✅ Credits reserved for music generation:', creditResult);
    } catch (creditError: any) {
      if (optimisticDebit > 0) {
        try { rollbackOptimisticDeduction(optimisticDebit); } catch { }
      }
      console.error('❌ Credit validation failed:', creditError);
      setErrorMessage(creditError.message || 'Insufficient credits for generation');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(undefined);
    setResultUrl(undefined);

    // Update queue status to generating
    if (generationId) {
      dispatch(updateActiveGeneration({
        id: generationId,
        updates: { status: 'generating' }
      }));
    }

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

      // Update queue with completed audio
      if (generationId) {
        console.log('[queue] Music generation completed, updating active generation:', { generationId, historyId: historyIdToUpdate, audioCount: finalAudios.length });
        dispatch(updateActiveGeneration({
          id: generationId,
          updates: {
            status: 'completed',
            audios: finalAudios,
            historyId: historyIdToUpdate || undefined
          }
        }));
      }

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
      try { await refreshCredits(); } catch { }
      try { await refreshCredits(); } catch { }

      // Refresh the completed generation using efficient single-entry fetch
      const resultHistoryId = backendHistoryId || tempId;
      if (resultHistoryId) {
        console.log('🔄 Refreshing single music generation:', resultHistoryId);
        await refreshSingleGeneration(resultHistoryId);
      } else {
        console.warn('⚠️ No history ID available, falling back to full refresh');
        await refreshMusicHistoryImmediate();
      }

      console.log('✅ Music generation completed successfully');

    } catch (error: any) {
      console.error('❌ Music generation failed:', error);
      
      // Update queue with failed status
      if (generationId) {
        dispatch(updateActiveGeneration({
          id: generationId,
          updates: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Music generation failed'
          }
        }));
      }
      
      if (optimisticDebit > 0) {
        try { rollbackOptimisticDeduction(optimisticDebit); } catch { }
      }
      
      const historyIdToUpdate = backendHistoryId || tempId;
      
      // Link active generation with backend ID before refresh
      if (generationId && historyIdToUpdate) {
        dispatch(updateActiveGeneration({
          id: generationId,
          updates: { historyId: historyIdToUpdate }
        }));
      }
      
      // For MiniMax Music 2, backend creates the entry, so use refreshSingleGeneration
      // For others, update the frontend-created entry then refresh it
      if (backendHistoryId) {
        // Backend will handle the failed status, remove temp entry
        if (tempId) {
          dispatch(removeHistoryEntry(tempId));
        }
        // Refresh the single failed entry
        await refreshSingleGeneration(backendHistoryId);
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
        
        // Refresh the single failed entry
        await refreshSingleGeneration(tempId);
      } else {
        // No ID available, fallback to full refresh
        await refreshMusicHistoryImmediate();
      }

      // Update local preview to failed
      setLocalMusicPreview((prev: any) => prev ? ({
        ...prev,
        status: 'failed'
      }) : prev);

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
      {/* Active Generations Queue Panel */}
      <ActiveGenerationsPanel />
      
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
          <div className="w-full -mt-6 bg-[#1f1f23]  rounded-2xl">
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
