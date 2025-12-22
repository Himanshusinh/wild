'use client';

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addHistoryEntry, updateHistoryEntry, removeHistoryEntry } from '@/store/slices/historySlice';
import { falElevenTts } from '@/store/slices/generationsApi';
import { useCredits } from '@/hooks/useCredits';
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
const updateFirebaseHistory = async (_id: string, _updates: any) => {};
import TTSHistory from './TTSHistory';
import CustomAudioPlayer from './CustomAudioPlayer';
import { useHistoryLoader } from '@/hooks/useHistoryLoader';
import MusicInputBox from './MusicInputBox';

interface TextToSpeechInputBoxProps {
  showHistoryOnly?: boolean;
}

const TextToSpeechInputBox: React.FC<TextToSpeechInputBoxProps> = (props = {}) => {
  const dispatch = useAppDispatch();
  // Include 'text-to-music' for backward compatibility with earlier mis-labeled TTS generations
  // But use only text-to-speech for new generations to avoid mixing with music entries
  const { refreshImmediate: refreshMusicHistoryImmediate } = useHistoryLoader({ generationType: 'text-to-speech', generationTypes: ['text-to-speech', 'text_to_speech', 'tts'] });
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
    const primaryText = payload?.text || payload?.prompt || '';
    if (!primaryText.trim()) {
      setErrorMessage('Please provide text');
      return;
    }
    const normalizedText = primaryText.trim();
    payload.text = normalizedText;
    payload.prompt = payload.prompt || normalizedText;
    payload.lyrics = normalizedText;
    payload.generationType = 'text-to-speech';
    // Keep the model from payload (could be elevenlabs-tts, chatterbox-multilingual, or maya-tts)
    if (!payload.model) {
      payload.model = 'elevenlabs-tts';
    }

    const hasSession = document.cookie.includes('app_session');
    const hasToken = localStorage.getItem('authToken') || localStorage.getItem('user');
    
    if (!hasSession && !hasToken) {
      setErrorMessage('Please sign in to generate speech');
      window.location.href = '/view/signup?next=/text-to-music';
      return;
    }

    clearCreditsError();

    let transactionId: string;
    try {
      // Use the model from payload for credit validation (supports elevenlabs-tts, chatterbox-multilingual, and maya-tts)
      // For Maya TTS, pass text length for per-second pricing calculation (6 credits per second)
      const isMayaTts = payload.model === 'maya-tts';
      const musicResult = await validateMusicCredits(
        payload.model, 
        isMayaTts ? undefined : 10, // Don't pass duration for Maya TTS
        undefined, // No inputs for TTS
        isMayaTts ? normalizedText : undefined // Pass text for Maya TTS per-second pricing
      );
      const reservation = await reserveCreditsForGeneration(
        musicResult.requiredCredits,
        'music-generation',
        {
          model: payload.model,
          generationType: 'text-to-speech',
          duration: isMayaTts ? Math.max(1, Math.ceil(normalizedText.length / 15)) : 10, // Estimated duration for Maya TTS (15 chars/sec)
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

    const modelName = payload.model || 'elevenlabs-tts';
    
    const fileName = payload.fileName || '';
    
    setLocalMusicPreview({
      id: `tts-loading-${Date.now()}`,
      prompt: normalizedText,
      model: modelName,
      generationType: 'text-to-speech',
      images: [{ id: 'tts-loading', url: '', originalUrl: '' }],
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: 1,
      status: 'generating',
      fileName: fileName
    });

    const tempId = Date.now().toString();
    const loadingEntry = {
      id: tempId,
      prompt: normalizedText,
      model: modelName, // Keep frontend model name (chatterbox-multilingual or elevenlabs-tts)
      lyrics: normalizedText,
      generationType: 'text-to-speech' as 'text-to-speech',
      images: [{ id: 'loading', url: '', originalUrl: '', type: 'audio' }], // Placeholder for generating state - ensures tile renders
      audios: [], // Will store audio data when completed
      status: "generating" as 'generating',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: 1,
      fileName: fileName
    };
    
    console.log('[TextToSpeech] Creating loading entry:', {
      id: tempId,
      model: modelName,
      generationType: 'text-to-speech',
      prompt: normalizedText.substring(0, 50) + '...'
    });

    // Add to Redux immediately to show loading animation
    dispatch(addHistoryEntry(loadingEntry));
    
    setLocalMusicPreview(loadingEntry);

    try {
      const { getIsPublic } = await import('@/lib/publicFlag');
      const isPublic = await getIsPublic();
      const requestPayload = { 
        ...payload, 
        isPublic, 
        prompt: payload.prompt || normalizedText,
        generationType: 'text-to-speech' // Ensure generationType is explicitly set
      };
      
      const result: any = await dispatch(falElevenTts(requestPayload)).unwrap();

      console.log('[TextToSpeech] API Response received:', {
        status: result?.status,
        hasAudio: !!result?.audio,
        hasAudios: Array.isArray(result?.audios) && result?.audios.length > 0,
        model: result?.model,
        historyId: result?.historyId
      });

      // Check if result indicates an error
      if (!result || (result.responseStatus === 'error' || result.status === 'error' || result.status === 'failed')) {
        // Immediately stop generation
        setIsGenerating(false);
        setLocalMusicPreview((prev: any) => prev ? ({
          ...prev,
          status: 'failed'
        }) : prev);
        
        const errorMessage = result?.message || result?.error || 'Generation failed';
        
        // Update history entry
        dispatch(updateHistoryEntry({
          id: tempId,
          updates: {
            status: 'failed',
            error: errorMessage
          }
        }));
        
        // Update local preview to failed state
        setLocalMusicPreview((prev: any) => prev ? { 
          ...prev, 
          status: 'failed',
          error: errorMessage
        } : null);
        
        // Refund credits
        if (transactionId) {
          try {
            await confirmGenerationFailure(transactionId);
          } catch (creditError) {
            console.error('❌ Credit refund failed:', creditError);
          }
        }
        
        setErrorMessage(errorMessage);
        try { 
          const toast = (await import('react-hot-toast')).default; 
          toast.error(errorMessage); 
        } catch {}
        
        // Refresh credits
        try {
          const { requestCreditsRefresh } = await import('@/lib/creditsBus');
          requestCreditsRefresh();
        } catch {}
        
        return; // Exit early
      }

      if (result.status !== 'completed') {
        throw new Error(result?.error || 'Generation failed');
      }

      let audioItem: any;
      let audiosArray: any[] = [];
      
      if (Array.isArray(result.audios) && result.audios.length > 0) {
        audiosArray = result.audios;
        audioItem = result.audios[0];
        console.log('[TextToSpeech] Using audios array from response:', audiosArray.length);
      } else if (result.audio) {
        audiosArray = [result.audio];
        audioItem = result.audio;
        console.log('[TextToSpeech] Using audio object from response');
      }

      if (!audioItem) {
        console.error('[TextToSpeech] ❌ No audio data in response:', result);
        throw new Error('No audio data received from generator');
      }

      const audioUrl = audioItem.url || audioItem.firebaseUrl || audioItem.originalUrl;
      if (!audioUrl) {
        console.error('[TextToSpeech] ❌ No audio URL in audioItem:', audioItem);
        throw new Error('No audio URL received from generator');
      }

      console.log('[TextToSpeech] Audio URL extracted:', audioUrl);

      const finalAudios = audiosArray.length > 0 ? audiosArray : [{
        id: audioItem.id || 'tts-1',
        url: audioUrl,
        firebaseUrl: audioUrl,
        originalUrl: audioItem.originalUrl || audioUrl,
        storagePath: audioItem.storagePath || ''
      }];

      // Create images array in the format expected by MusicHistory component
      // Each image entry should have: id, url, originalUrl, and optionally type
      const imagesArray = finalAudios.map((a, index) => ({
        id: a.id || `img-${Date.now()}-${index}`,
        url: a.url || a.firebaseUrl || a.originalUrl,
        originalUrl: a.originalUrl || a.url || a.firebaseUrl,
        firebaseUrl: a.firebaseUrl || a.url,
        storagePath: a.storagePath || '',
        type: 'audio'
      }));

      setResultUrl(audioUrl);
      confirmGenerationSuccess(transactionId);
      setIsGenerating(false); // Stop generating immediately after success

      const firebaseHistoryId = result.historyId || tempId;
      const finalModelName = result.model || modelName;
      const finalAudiosFromResult = result.audios || finalAudios;
      const imagesArrayFromResult = result.images || imagesArray;

      // Update Redux entry first (update both tempId and historyId if different)
      const updateData: any = {
        status: 'completed',
        audio: audioItem,
        audios: finalAudiosFromResult.length > 0 ? finalAudiosFromResult : finalAudios,
        images: imagesArrayFromResult.length > 0 ? imagesArrayFromResult : imagesArray,
        model: modelName, // Use frontend model name
        backendModel: result.model, // Store backend endpoint name separately
        generationType: 'text-to-speech',
        fileName: fileName,
        prompt: normalizedText,
        lyrics: payload.lyrics || payload.text || payload.prompt,
      };

      // Update the loading entry in Redux
      // Always update the tempId entry first with completed status
      dispatch(updateHistoryEntry({ id: tempId, updates: updateData }));
      
      // If we have a real historyId that's different from tempId, we need to handle the ID change
      // The updateHistoryEntry doesn't change the entry's ID, so we need to remove the old one and add the new one
      // This prevents duplicates
      if (result.historyId && result.historyId !== tempId) {
        // Remove the tempId entry and add a new one with the real historyId
        dispatch(removeHistoryEntry(tempId));
        dispatch(addHistoryEntry({ ...updateData, id: result.historyId }));
        
        try {
          await updateFirebaseHistory(result.historyId, updateData);
        } catch (firebaseErr) {
          console.error('[TextToSpeech] Failed to update Firebase history:', firebaseErr);
        }
      }

      // Clear local preview immediately since Redux entry is now updated
      // This prevents showing duplicate entries
      setLocalMusicPreview(null);

      // Refresh history with merge mode to preserve local state
      setTimeout(() => {
        refreshMusicHistoryImmediate(50, false); // false = merge mode
      }, 1000);

      try { const toast = (await import('react-hot-toast')).default; toast.success('Speech generated successfully!'); } catch {}

    } catch (error: any) {
      console.error('[TextToSpeech] Generation failed:', error);
      setIsGenerating(false); // Stop generating immediately
      setErrorMessage(error?.message || error?.response?.data?.message || 'Speech generation failed');
      confirmGenerationFailure(transactionId);
      
      // Update Redux entry to failed status
      dispatch(updateHistoryEntry({ 
        id: tempId, 
        updates: { 
          status: 'failed',
          error: error?.message || error?.response?.data?.message || 'Speech generation failed'
        } 
      }));
      
      // Update local preview to failed status
      setLocalMusicPreview((prev: any) => prev ? { 
        ...prev, 
        status: 'failed',
        error: error?.message || error?.response?.data?.message || 'Speech generation failed'
      } : null);
      
      // Request credit refresh to update UI
      try {
        const { requestCreditsRefresh } = await import('@/lib/creditsBus');
        requestCreditsRefresh();
      } catch (e) {
        console.error('[TextToSpeech] Failed to refresh credits:', e);
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
        <TTSHistory
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

          {/* TTS Input Box */}
          <div className="w-full -mt-6 bg-[#1f1f23]  rounded-2xl">
            <MusicInputBox
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              resultUrl={resultUrl}
              errorMessage={errorMessage}
              defaultModel="elevenlabs-tts"
              isTtsMode={true}
            />
          </div>
        </>
      )}

      {/* Audio Player Modal - Rendered for both history and input views */}
      {selectedAudio && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
          <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full ring-1 ring-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Speech</h3>
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

export default TextToSpeechInputBox;
