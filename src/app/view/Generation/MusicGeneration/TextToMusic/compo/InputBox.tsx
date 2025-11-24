'use client';

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addHistoryEntry, updateHistoryEntry } from '@/store/slices/historySlice';
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
  } = useGenerationCredits('music', 'music-1.5', {
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
      status: 'generating'
    });

    // Create loading history entry for Redux (with temporary ID)
    const tempId = Date.now().toString();
    const loadingEntry = {
      id: tempId,
      prompt: normalizedText,
      model: payload.model,
      lyrics: normalizedText,
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
      console.log('🎵 Calling music API with payload via thunk:', { ...payload, isPublic });
      const requestPayload = { ...payload, isPublic, prompt: payload.prompt || normalizedText };
      const result = isTtsModel
        ? await dispatch(falElevenTts(requestPayload)).unwrap()
        : await dispatch(minimaxMusic(requestPayload)).unwrap();
      console.log('🎵 Music generation thunk result:', result);

      if (!result || result.status !== 'completed') {
        throw new Error(result?.error || 'Generation failed');
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

      // Update the history entry with the audio URL from backend
      // Store in both audios and images fields for compatibility
      const updateData = {
        status: 'completed' as const,
        audios: finalAudios,
        images: finalAudios.map(a => ({ ...a, type: 'audio' })),
        lyrics: payload.lyrics || payload.text || payload.prompt
      };

      console.log('🎵 Final audio data for history:', updateData);
      console.log('🎵 Audio URL:', audioUrl);
      console.log('🎵 History ID being updated:', firebaseHistoryId || tempId);
      console.log('🎵 Backend result:', result);

      // Update Redux entry with completion data
      console.log('🎵 Updating Redux history entry with ID:', firebaseHistoryId || tempId);
      dispatch(updateHistoryEntry({
        id: firebaseHistoryId || tempId,
        updates: updateData
      }));
      console.log('🎵 Redux history entry updated with audios:', updateData.audios.length, 'items');

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

      // Refresh history after a short delay to ensure backend has updated
      setTimeout(() => {
        console.log('🔄 Refreshing music history...');
        refreshMusicHistoryImmediate();
      }, 500);

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
          <div className="w-full -mt-10 pt-4 ">
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
              audioUrl={selectedAudio.audio.url || selectedAudio.audio.firebaseUrl || selectedAudio.audio.originalUrl}
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

export default MusicGenerationInputBox;
