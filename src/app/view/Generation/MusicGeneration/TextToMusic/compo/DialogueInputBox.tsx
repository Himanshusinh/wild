'use client';

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addHistoryEntry, updateHistoryEntry } from '@/store/slices/historySlice';
import { falElevenTts } from '@/store/slices/generationsApi';
import { useCredits } from '@/hooks/useCredits';
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
const updateFirebaseHistory = async (_id: string, _updates: any) => { };
import DialogueHistory from './DialogueHistory';
import CustomAudioPlayer from './CustomAudioPlayer';
import { useHistoryLoader } from '@/hooks/useHistoryLoader';
import MusicInputBox from './MusicInputBox';

const DIALOGUE_GENERATION_TYPES = ['text-to-dialogue', 'text_to_dialogue', 'dialogue'];

const DialogueInputBox = ({ showHistoryOnly = false, selectedModel }: { showHistoryOnly?: boolean; selectedModel?: string }) => {
  const dispatch = useAppDispatch();
  // Include 'text-to-music' for legacy dialogue generations created under Music tab
  const { refreshImmediate: refreshMusicHistoryImmediate } = useHistoryLoader({ generationType: 'text-to-dialogue', generationTypes: DIALOGUE_GENERATION_TYPES });
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
    // Validate dialogue inputs
    if (!payload.inputs || !Array.isArray(payload.inputs) || payload.inputs.length === 0) {
      setErrorMessage('Please add at least one dialogue input with text');
      return;
    }

    const validInputs = payload.inputs.filter((input: any) => input.text && input.text.trim().length > 0);
    if (validInputs.length === 0) {
      setErrorMessage('Please add at least one dialogue input with text');
      return;
    }

    // Set generation type
    payload.generationType = 'text-to-dialogue';
    payload.model = payload.model || 'elevenlabs-dialogue';

    const hasSession = document.cookie.includes('app_session');
    const hasToken = localStorage.getItem('authToken') || localStorage.getItem('user');

    if (!hasSession && !hasToken) {
      setErrorMessage('Please sign in to generate dialogue');
      window.location.href = '/view/signup?next=/text-to-music';
      return;
    }

    clearCreditsError();

    let transactionId: string;
    try {
      // Pass inputs array for character-based credit calculation (same as TTS)
      const musicResult = await validateMusicCredits(payload.model, 10, validInputs);
      const reservation = await reserveCreditsForGeneration(
        musicResult.requiredCredits,
        'music-generation',
        {
          model: payload.model,
          generationType: 'text-to-dialogue',
          duration: 10,
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

    const modelName = payload.model || 'elevenlabs-dialogue';
    const dialogueText = validInputs.map((input: any) => input.text).join(' | ');
    const fileName = payload.fileName || '';

    const tempId = `dialogue-loading-${Date.now()}`;
    const loadingEntry = {
      id: tempId,
      prompt: dialogueText,
      model: modelName,
      generationType: 'text-to-dialogue' as 'text-to-dialogue',
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
        model: finalModelName,
        backendModel: result.model,
        generationType: 'text-to-dialogue',
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
          console.error('[DialogueInputBox] Failed to update Firebase history:', firebaseErr);
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
      console.error('[DialogueInputBox] Generation failed:', error);
      setErrorMessage(error?.message || 'Dialogue generation failed');
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

  // const showHistoryOnly = props?.showHistoryOnly || false;

  return (
    <>
      {showHistoryOnly ? (
        <DialogueHistory
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

          {/* Dialogue Input Box */}
          <div className="w-full -mt-6 bg-[#1f1f23]  rounded-2xl">
            <MusicInputBox
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              resultUrl={resultUrl}
              errorMessage={errorMessage}
              defaultModel={selectedModel || "elevenlabs-dialogue"}
              isDialogueMode={true}
            />
          </div>
        </>
      )}

      {/* State-of-the-art Audio Player Bottom Bar */}
      {selectedAudio && (
        <CustomAudioPlayer
          audioUrl={typeof selectedAudio.audio === 'string' ? selectedAudio.audio : (selectedAudio.audio?.url || selectedAudio.audio?.firebaseUrl || selectedAudio.audio?.originalUrl || selectedAudio.entry?.audio || '')}
          prompt={selectedAudio.entry.lyrics || selectedAudio.entry.prompt}
          model={selectedAudio.entry.model}
          lyrics={selectedAudio.entry.lyrics}
          generationType={selectedAudio.entry.generationType}
          autoPlay={true}
          onClose={() => setSelectedAudio(null)}
        />
      )}
    </>
  );
};

export default DialogueInputBox;

