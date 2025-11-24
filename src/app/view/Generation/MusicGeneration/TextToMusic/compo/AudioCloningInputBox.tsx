'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppDispatch } from '@/store/hooks';
import { addHistoryEntry, updateHistoryEntry } from '@/store/slices/historySlice';
import MusicHistory from './MusicHistory';
import CustomAudioPlayer from './CustomAudioPlayer';
import { useHistoryLoader } from '@/hooks/useHistoryLoader';

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['wav', 'mp3'];
const ALLOWED_TYPES = [
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg3',
  'audio/x-mpeg-3'
];

const AudioCloningInputBox = (props?: { showHistoryOnly?: boolean }) => {
  const dispatch = useAppDispatch();
  const showHistoryOnly = props?.showHistoryOnly || false;
  const { refreshImmediate: refreshMusicHistoryImmediate } = useHistoryLoader({ 
    generationType: 'voicecloning', 
    generationTypes: ['voicecloning', 'voice-cloning'] 
  });
  const [audioFileName, setAudioFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [isCloning, setIsCloning] = useState(false);
  const [localMusicPreview, setLocalMusicPreview] = useState<any>(null);
  const [userAudioFiles, setUserAudioFiles] = useState<Array<{ fileName: string }>>([]);
  const [selectedAudio, setSelectedAudio] = useState<{ entry: any; audio: any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchUserAudioFiles = useCallback(async () => {
    try {
      const { getApiClient } = await import('@/lib/axiosInstance');
      const api = getApiClient();
      const response = await api.get('/api/fal/audio-files');
      if (response.data?.data?.audioFiles) {
        setUserAudioFiles(response.data.data.audioFiles);
      }
    } catch (error) {
      console.error('Failed to fetch user audio files:', error);
    }
  }, []);

  useEffect(() => {
    if (showHistoryOnly) return;
    fetchUserAudioFiles();
  }, [fetchUserAudioFiles, showHistoryOnly]);

  useEffect(() => {
    if (!localMusicPreview) return;
    if (localMusicPreview.status === 'completed' || localMusicPreview.status === 'failed') {
      const timeout = setTimeout(() => setLocalMusicPreview(null), 1500);
      return () => clearTimeout(timeout);
    }
  }, [localMusicPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(`.${ext}`))) {
      setErrorMessage('Please upload a WAV or MP3 file.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Audio file too large. Maximum size is 15MB.');
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
  };

  const handleCloneAudio = async () => {
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    if (!audioFileName.trim()) {
      setErrorMessage('Please enter a name for the audio file.');
      return;
    }
    if (!selectedFile) {
      setErrorMessage('Please choose an audio file to upload.');
      return;
    }

    const fileExtension = selectedFile.name.match(/\.([^.]+)$/)?.[1]?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      setErrorMessage('File must have .wav or .mp3 extension.');
      return;
    }

    let baseName = audioFileName.trim().replace(/\.(wav|mp3)$/i, '');
    const fullFileName = `${baseName}.${fileExtension}`;
    
    // Check for duplicate name (frontend validation)
    if (userAudioFiles.some(file => file.fileName?.toLowerCase() === fullFileName.toLowerCase())) {
      setErrorMessage(`"${fullFileName}" already exists. Please choose a different name.`);
      return;
    }

    setIsCloning(true);

    const reader = new FileReader();
    const dataUri = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(selectedFile);
    });

    const previewId = `voice-clone-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const previewEntry = {
      id: previewId,
      prompt: `Voice clone: ${baseName}`,
      model: 'chatterbox-multilingual',
      generationType: 'voicecloning' as const,
      lyrics: '',
      status: 'generating' as const,
      audios: [],
      images: [],
      timestamp,
      createdAt: timestamp,
      imageCount: 1,
    };
    dispatch(addHistoryEntry(previewEntry));
    setLocalMusicPreview(previewEntry);
    
    // Refresh history immediately to show the generating entry
    refreshMusicHistoryImmediate();

    try {
      const { getApiClient } = await import('@/lib/axiosInstance');
      const api = getApiClient();
      const uploadResponse = await api.post('/api/fal/upload-voice', {
        audioData: dataUri,
        fileName: fullFileName,
      });

      const uploadedUrl = uploadResponse.data?.data?.url;
      if (!uploadedUrl) throw new Error('Upload failed. No URL returned.');

      const completedEntry = {
        status: 'completed' as const,
        audios: [{
          id: `${previewId}-audio`,
          url: uploadedUrl,
          firebaseUrl: uploadedUrl,
          originalUrl: uploadedUrl,
          fileName: fullFileName,
        }],
        voice_file_name: fullFileName,
      };

      dispatch(updateHistoryEntry({ id: previewId, updates: completedEntry }));
      setLocalMusicPreview({ ...previewEntry, ...completedEntry });
      
      // Refresh history immediately to show the completed entry
      refreshMusicHistoryImmediate();

      // Refresh user audio files list and trigger voice library update
      await fetchUserAudioFiles();
      window.dispatchEvent(new CustomEvent('wm-audio-library-updated'));
      
      setAudioFileName('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccessMessage('Audio cloned successfully.');
    } catch (error: any) {
      console.error('Failed to clone audio:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to upload audio.';
      setErrorMessage(message);
      dispatch(updateHistoryEntry({ id: previewId, updates: { status: 'failed' } }));
      setLocalMusicPreview((prev: any) => prev ? { ...prev, status: 'failed' } : prev);
      refreshMusicHistoryImmediate();
    } finally {
      setIsCloning(false);
    }
  };

  if (showHistoryOnly) {
    return (
      <>
        <MusicHistory
          generationType={['voicecloning', 'voice-cloning']}
          allowedTypes={['voicecloning', 'voice-cloning']}
          onAudioSelect={setSelectedAudio}
          selectedAudio={selectedAudio}
          localPreview={localMusicPreview}
        />

        {selectedAudio && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full ring-1 ring-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Cloned Audio</h3>
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
  }

  return (
    <>
      {errorMessage && (
        <div className="mb-4 z-[60]">
          <div className="rounded-2xl bg-red-500/15 ring-1 ring-red-500/30 p-3">
            <div className="text-red-300 text-sm">{errorMessage}</div>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 z-[60]">
          <div className="rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30 p-3">
            <div className="text-emerald-300 text-sm">{successMessage}</div>
          </div>
        </div>
      )}

      <div className="w-full -mt-6 bg-white/5 backdrop-blur-xl  rounded-2xl ">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-1">
              Audio Name <span className="text-red-400">*</span>
            </label>
            <input
              value={audioFileName}
              onChange={(e) => setAudioFileName(e.target.value)}
              placeholder="Enter audio file name..."
              className="w-full bg-black/40 ring-1 ring-white/10 focus:ring-white/30 outline-none text-white placeholder-white/50 px-3 py-2 rounded-lg text-sm"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-1">
              Upload Audio File <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept=".wav,.mp3,audio/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                id="voice-clone-file-input"
              />
              <label
                htmlFor="voice-clone-file-input"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium cursor-pointer transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Choose Audio File
              </label>
              {selectedFile && (
                <div className="text-xs text-white/70 truncate">{selectedFile.name}</div>
              )}
              <p className="text-xs text-white/50">Supports WAV/MP3 files up to 15MB.</p>
            </div>
          </div>

          <button
            onClick={handleCloneAudio}
            disabled={isCloning || !audioFileName.trim() || !selectedFile}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
              isCloning || !audioFileName.trim() || !selectedFile
                ? 'bg-white/20 text-white/60 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            {isCloning ? 'Cloning...' : 'Clone Audio'}
          </button>
        </div>
      </div>
    </>
  );
};

export default AudioCloningInputBox;

