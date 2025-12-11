'use client';

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addHistoryEntry, updateHistoryEntry } from '@/store/slices/historySlice';
import { falElevenTts } from '@/store/slices/generationsApi';
import { useCredits } from '@/hooks/useCredits';
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
const updateFirebaseHistory = async (_id: string, _updates: any) => {};
import SFXHistory from './SFXHistory';
import CustomAudioPlayer from './CustomAudioPlayer';
import { useHistoryLoader } from '@/hooks/useHistoryLoader';
import MusicInputBox from './MusicInputBox';

const SFXInputBox = (props?: { showHistoryOnly?: boolean }) => {
  const dispatch = useAppDispatch();
  // Include 'text-to-music' for legacy SFX generations created under Music tab
  const { refreshImmediate: refreshMusicHistoryImmediate } = useHistoryLoader({ generationType: 'sfx', generationTypes: ['sfx', 'sound-effect', 'sound_effect', 'sound-effects', 'sound_effects', 'text-to-music'] });
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [localMusicPreview, setLocalMusicPreview] = useState<any>(null);

  useEffect(() => {
    if (!localMusicPreview) return;
    if (localMusicPreview.status === 'completed' || localMusicPreview.status === 'failed') {
      const t = setTimeout(() => setLocalMusicPreview(null), 1500);
      return () => clearTimeout(t);
    }
  }, [localMusicPreview]);

  const {
    validateMusicCredits,
    reserveCreditsForGeneration,
    confirmGenerationSuccess,
    confirmGenerationFailure,
    clearCreditsError,
  } = useCredits();

  const handleGenerate = async (payload: any) => {
    // Validate SFX inputs
    if (!payload.text || payload.text.trim().length === 0) {
      setErrorMessage('Please enter a description for the sound effect');
      return;
    }

    // Set generation type
    payload.generationType = 'sfx';
    payload.model = payload.model || 'elevenlabs-sfx';

    const hasSession = document.cookie.includes('app_session');
    const hasToken = localStorage.getItem('authToken') || localStorage.getItem('user');
    
    if (!hasSession && !hasToken) {
      setErrorMessage('Please sign in to generate sound effects');
      window.location.href = '/view/signup?next=/text-to-music';
      return;
    }

    clearCreditsError();

    let transactionId: string;
    try {
      // Pass duration_seconds for per-second pricing (6 credits per second)
      const sfxDuration = payload.duration_seconds || 5.0;
      const musicResult = await validateMusicCredits(payload.model, sfxDuration);
      const reservation = await reserveCreditsForGeneration(
        musicResult.requiredCredits,
        'music-generation',
        {
          model: payload.model,
          generationType: 'sfx',
          duration: sfxDuration,
        }
      );
      transactionId = reservation.transaction.id;
    } catch (creditError: any) {
      setErrorMessage(creditError.message || 'Insufficient credits for generation');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(undefined);
    setResultUrl(undefined);

    const modelName = payload.model || 'elevenlabs-sfx';
    const sfxText = payload.text.trim();
    const fileName = payload.fileName || '';
    
    const tempId = `sfx-loading-${Date.now()}`;
    const loadingEntry = {
      id: tempId,
      prompt: sfxText,
      model: modelName,
      generationType: 'sfx' as 'sfx',
      images: [{ id: 'loading', url: '', originalUrl: '', type: 'audio' }], // Placeholder for generating state
      audios: [],
      status: 'generating' as 'generating',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: 1,
      fileName: fileName
    };
    
    // Add to Redux immediately to show loading animation
    dispatch(addHistoryEntry(loadingEntry));
    
    setLocalMusicPreview(loadingEntry);

    try {
      const result: any = await dispatch(falElevenTts(payload)).unwrap();
      
      const audioObj = result.audio || result.audios?.[0] || result.images?.[0];
      const audioUrl = audioObj?.url || audioObj?.firebaseUrl || audioObj?.originalUrl;

      if (!audioUrl) {
        throw new Error('No audio URL returned from generation');
      }

      setResultUrl(audioUrl);
      confirmGenerationSuccess(transactionId);
      setIsGenerating(false); // Stop generating immediately after success

      const firebaseHistoryId = result.historyId || tempId;
      const finalModelName = result.model || modelName;
      const finalAudios = result.audios || [audioObj];
      const imagesArray = result.images || [audioObj];

      // Update Redux entry first (update both tempId and historyId if different)
      const updateData: any = {
        status: 'completed',
        audio: audioObj,
        audios: finalAudios,
        images: imagesArray,
        model: modelName, // Use frontend model name (elevenlabs-sfx)
        backendModel: result.model, // Store backend endpoint name separately
        generationType: 'sfx',
        fileName: fileName
      };

      // Update the loading entry in Redux (use tempId first, then historyId if different)
      dispatch(updateHistoryEntry({ id: tempId, updates: updateData }));
      
      // If we have a real historyId that's different from tempId, also update that entry
      if (result.historyId && result.historyId !== tempId) {
        dispatch(updateHistoryEntry({ id: result.historyId, updates: updateData }));
        try {
          await updateFirebaseHistory(result.historyId, updateData);
        } catch (firebaseErr) {
          console.error('[SFXInputBox] Failed to update Firebase history:', firebaseErr);
        }
      }

      // Update local preview to completed state
      setLocalMusicPreview((prev: any) => prev ? {
        ...prev,
        id: firebaseHistoryId,
        status: 'completed',
        audio: audioObj,
        audios: finalAudios,
        images: imagesArray,
        model: finalModelName,
        fileName: fileName
      } : null);

      // Clear local preview after a short delay to let Redux entry take over
      setTimeout(() => {
        setLocalMusicPreview(null);
      }, 500);

      // Refresh history with merge mode to preserve local state
      setTimeout(() => {
        refreshMusicHistoryImmediate(50, false); // false = merge mode
      }, 1000);
    } catch (error: any) {
      console.error('[SFXInputBox] Generation failed:', error);
      setIsGenerating(false); // Stop generating immediately
      setErrorMessage(error?.message || error?.response?.data?.message || 'SFX generation failed');
      confirmGenerationFailure(transactionId);
      
      // Update Redux entry to failed status
      dispatch(updateHistoryEntry({ 
        id: tempId, 
        updates: { 
          status: 'failed',
          error: error?.message || error?.response?.data?.message || 'SFX generation failed'
        } 
      }));
      
      // Update local preview to failed status
      setLocalMusicPreview((prev: any) => prev ? { 
        ...prev, 
        status: 'failed',
        error: error?.message || error?.response?.data?.message || 'SFX generation failed'
      } : null);
      
      // Request credit refresh to update UI
      try {
        const { requestCreditsRefresh } = await import('@/lib/creditsBus');
        requestCreditsRefresh();
      } catch (e) {
        console.error('[SFXInputBox] Failed to refresh credits:', e);
      }
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
        <SFXHistory
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

          {/* SFX Input Box */}
          <div className="w-full -mt-6 bg-[#1f1f23]  rounded-2xl">
            <MusicInputBox
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              resultUrl={resultUrl}
              errorMessage={errorMessage}
              defaultModel="elevenlabs-sfx"
              isSFXMode={true}
            />
          </div>
        </>
      )}

      {/* Audio Player Modal - Rendered for both history and input views */}
      {selectedAudio && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
          <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full ring-1 ring-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Sound Effect</h3>
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
              generationType={selectedAudio.entry.generationType}
              autoPlay={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SFXInputBox;

