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
      const musicResult = await validateMusicCredits(payload.model, 10);
      const reservation = await reserveCreditsForGeneration(
        musicResult.requiredCredits,
        'music-generation',
        {
          model: payload.model,
          generationType: 'sfx',
          duration: payload.duration_seconds || 5,
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
    
    setLocalMusicPreview({
      id: `sfx-loading-${Date.now()}`,
      prompt: sfxText,
      model: modelName,
      generationType: 'sfx',
      images: [{ id: 'sfx-loading', url: '', originalUrl: '' }],
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: 1,
      status: 'generating'
    });

    try {
      const result: any = await dispatch(falElevenTts(payload)).unwrap();
      
      const audioObj = result.audio || result.audios?.[0] || result.images?.[0];
      const audioUrl = audioObj?.url || audioObj?.firebaseUrl || audioObj?.originalUrl;

      if (!audioUrl) {
        throw new Error('No audio URL returned from generation');
      }

      setResultUrl(audioUrl);
      confirmGenerationSuccess(transactionId);

      // Update local preview
      setLocalMusicPreview((prev: any) => prev ? {
        ...prev,
        status: 'completed',
        audio: audioObj,
        audios: result.audios || [audioObj],
        images: result.images || [audioObj]
      } : null);

      // Update history entry if historyId exists
      if (result.historyId) {
        // Preserve frontend model name in 'model' field, store backend endpoint in 'backendModel'
        const updateData: any = {
          status: 'completed',
          audio: audioObj,
          audios: result.audios || [audioObj],
          images: result.images || [audioObj],
          model: modelName, // Use frontend model name (elevenlabs-sfx)
          backendModel: result.model, // Store backend endpoint name separately (fal-ai/elevenlabs/sound-effects/v2)
          generationType: 'sfx'
        };

        console.log('[SFXInputBox] Updating history entry:', {
          historyId: result.historyId,
          model: modelName,
          backendModel: result.model,
          generationType: 'sfx',
          hasAudios: !!updateData.audios?.length,
          hasImages: !!updateData.images?.length,
          hasAudio: !!updateData.audio
        });

        dispatch(updateHistoryEntry({ id: result.historyId, updates: updateData }));
        
        try {
          await updateFirebaseHistory(result.historyId, updateData);
        } catch (firebaseErr) {
          console.error('[SFXInputBox] Failed to update Firebase history:', firebaseErr);
        }
      }

      // Refresh history
      refreshMusicHistoryImmediate();
    } catch (error: any) {
      console.error('[SFXInputBox] Generation failed:', error);
      setErrorMessage(error?.message || 'SFX generation failed');
      confirmGenerationFailure(transactionId);
      setLocalMusicPreview((prev: any) => prev ? { ...prev, status: 'failed' } : null);
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
          <div className="w-full -mt-10 pt-4">
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
              autoPlay={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SFXInputBox;

