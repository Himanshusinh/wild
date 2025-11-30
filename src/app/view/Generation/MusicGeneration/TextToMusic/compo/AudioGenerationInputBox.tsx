'use client';

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addHistoryEntry, updateHistoryEntry } from '@/store/slices/historySlice';
import MusicHistory from './MusicHistory';
import CustomAudioPlayer from './CustomAudioPlayer';
import MusicInputBox from './MusicInputBox';

const AudioGenerationInputBox = () => {
  const dispatch = useAppDispatch();
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

  const handleGenerate = async (payload: any) => {
    setErrorMessage('Audio generation coming soon!');
  };

  const [selectedAudio, setSelectedAudio] = useState<{
    entry: any;
    audio: any;
  } | null>(null);

  return (
    <>
      {/* History Section - Scrollable below tabs */}
      <div className="mb-6">
        <MusicHistory
          generationType="audio-generation"
          allowedTypes={['audio-generation', 'text-to-audio']}
          onAudioSelect={setSelectedAudio}
          selectedAudio={selectedAudio}
          localPreview={localMusicPreview}
        />
      </div>

      {/* Error Message Display */}
      {errorMessage && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-[840px] z-[60]">
          <div className="rounded-2xl bg-red-500/15 ring-1 ring-red-500/30 p-3">
            <div className="text-red-300 text-sm">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Audio Generation Input Box - Fixed at bottom */}
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
              <h3 className="text-white text-lg font-semibold">Audio</h3>
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

export default AudioGenerationInputBox;

