'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppDispatch } from '@/store/hooks';
import { addHistoryEntry, updateHistoryEntry, removeHistoryEntry } from '@/store/slices/historySlice';
import MusicHistory from './MusicHistory';
import VoiceCloningHistory from './VoiceCloningHistory';
import CustomAudioPlayer from './CustomAudioPlayer';
import GlobalBottomAudioPlayer from './GlobalBottomAudioPlayer';
import { useHistoryLoader } from '@/hooks/useHistoryLoader';
import { Trash2, Music4 } from 'lucide-react';
import toast from 'react-hot-toast';

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

const VOICE_CLONING_GENERATION_TYPES = ['voicecloning', 'voice-cloning'];

const AudioCloningInputBox = ({ showHistoryOnly = false, selectedModel }: { showHistoryOnly?: boolean; selectedModel?: string }) => {
  const dispatch = useAppDispatch();
  // const showHistoryOnly = props?.showHistoryOnly || false;
  const { refreshImmediate: refreshMusicHistoryImmediate } = useHistoryLoader({
    generationType: 'voicecloning',
    generationTypes: VOICE_CLONING_GENERATION_TYPES
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

  const getDisplayAudioName = (name?: string) => {
    if (!name) return '';
    const base = name.split('/').pop() || name;
    return base.replace(/\.[^/.]+$/, '');
  };

  // Delete handler for user input audio files
  const handleDeleteAudioFile = async (e: React.MouseEvent, file: any) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (!window.confirm('Delete this audio file permanently? This cannot be undone.')) return;

      // Delete from backend
      const { getApiClient } = await import('@/lib/axiosInstance');
      const api = getApiClient();
      await api.delete(`/api/fal/audio-files/${file.id || file.fileName}`);

      // Remove from local state
      setUserAudioFiles((prev) => prev.filter((f: any) =>
        (f.id && f.id !== file.id) ||
        (f.fileName && f.fileName !== file.fileName) ||
        (f.storagePath && f.storagePath !== file.storagePath)
      ));

      // If the deleted file is currently selected, clear selection
      if (selectedAudio && (
        selectedAudio.audio.fileName === file.fileName ||
        selectedAudio.audio.url === file.url
      )) {
        setSelectedAudio(null);
      }

      // Trigger voice library update event
      window.dispatchEvent(new CustomEvent('wm-audio-library-updated'));

      toast.success('Audio file deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete audio file');
    }
  };

  // Fetch user audio files on mount
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
    // Always fetch on mount so history-only view shows user input audios
    fetchUserAudioFiles();
  }, [fetchUserAudioFiles]);

  // Listen for app-wide audio library updates and refetch
  useEffect(() => {
    const handler = () => fetchUserAudioFiles();
    window.addEventListener('wm-audio-library-updated', handler);
    return () => window.removeEventListener('wm-audio-library-updated', handler);
  }, [fetchUserAudioFiles]);

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

    // Always store and display the name without extension (backend upload uses this as fileName)
    const baseName = audioFileName.trim().replace(/\.(wav|mp3)$/gi, '');
    const fullFileName = baseName; // no extension in stored name

    // Check for duplicate name (frontend validation) using extension-less name
    if (userAudioFiles.some(file => getDisplayAudioName(file.fileName)?.toLowerCase() === fullFileName.toLowerCase())) {
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
        fileName: fullFileName, // extension-less name
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
        <VoiceCloningHistory
          onAudioSelect={setSelectedAudio}
          selectedAudio={selectedAudio}
          localPreview={localMusicPreview}
          userAudioFiles={userAudioFiles}
          onDeleteUserFile={handleDeleteAudioFile}
        />

        {/* State-of-the-art Audio Player Bottom Bar */}
        {selectedAudio && (
          <GlobalBottomAudioPlayer 
            selectedAudio={selectedAudio} 
            onClose={() => setSelectedAudio(null)} 
          />
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

      <div className="w-full max-w-full space-y-4 rounded-[12px] bg-[#0E0E12] shadow-2xl px-6 py-6" style={{ overflow: 'visible', position: 'relative', boxSizing: 'border-box', overflowWrap: 'break-word' }}>
        <div className="space-y-4">
          <div>
            <label className="block text-white/30 text-[10px] font-satoshi font-bold uppercase tracking-widest mb-1.5 ml-1">
              Audio Name <span className="text-red-400/50">*</span>
            </label>
            <input
              value={audioFileName}
              onChange={(e) => setAudioFileName(e.target.value)}
              placeholder="Enter audio file name..."
              className="w-full bg-[#16161C] border border-white/10 rounded-[10px] outline-none text-[#F0EFF8] placeholder-[#3E3D52] px-4 py-2.5 text-[13px] font-satoshi transition-all focus:border-[#2F6BFF]/40"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-white/30 text-[10px] font-satoshi font-bold uppercase tracking-widest mb-1.5 ml-1">
              Upload Audio File <span className="text-red-400/50">*</span>
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-[10px] bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-[12px] font-medium cursor-pointer transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Choose Audio File
              </label>
              {selectedFile && (
                <div className="text-[11px] text-[#2F6BFF] font-medium ml-1 mt-1 font-satoshi italic">Selected: {selectedFile.name}</div>
              )}
              <p className="text-[10px] text-white/30 font-satoshi uppercase tracking-widest mt-1 ml-1">Supports WAV/MP3 files up to 15MB</p>
            </div>
          </div>

          <button
            onClick={handleCloneAudio}
            disabled={isCloning || !audioFileName.trim()}
            className={`w-full py-2 mt-2 rounded-[12px] text-[13px] font-satoshi font-black tracking-wide transition-all active:scale-[0.98] shadow-lg ${isCloning || !audioFileName.trim()
              ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
              : 'bg-[#2F6BFF] text-white hover:opacity-90 shadow-[0_6px_20px_rgba(47,107,255,0.3)]'
              }`}
          >
            {isCloning ? 'Cloning...' : 'CLONE AUDIO'}
          </button>
        </div>
      </div>
    </>
  );
};

// Sub-component for individual input audio row
const InputAudioRow = ({ file, index = 0, onSelect, onDelete, isPlaying = false }: any) => {
  const displayName = file.fileName ? (file.fileName.split('/').pop()?.replace(/\.[^/.]+$/, '') || file.fileName) : 'Voice Sample';
  
  // Helper function to get color theme based on file
  const seed = file?.id || file?.fileName || index || 0;
  const hash = String(seed).split('').reduce((acc: number, char: string) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const themes = [
    'from-indigo-600 to-blue-500',
    'from-purple-600 to-indigo-500',
    'from-blue-600 to-cyan-500',
    'from-violet-600 to-purple-500',
    'from-cyan-600 to-blue-500',
    'from-blue-500 to-indigo-600',
    'from-indigo-500 to-purple-600',
    'from-sky-500 to-indigo-500',
    'from-teal-500 to-blue-500',
    'from-emerald-500 to-teal-500',
  ];
  const colorTheme = themes[Math.abs(hash) % themes.length];

  return (
    <div 
      onClick={() => onSelect?.()}
      className={`group bg-[#16161C]/40 hover:bg-[#16161C] border ${isPlaying ? 'border-[#2F6BFF]/40 bg-[#2F6BFF]/5' : 'border-white/[0.04] hover:border-white/10'} rounded-[14px] p-3 flex items-center gap-5 transition-all duration-300 cursor-pointer relative overflow-hidden`}
    >
      {/* Thumbnail */}
      <div className={`w-14 h-14 rounded-[10px] bg-gradient-to-br ${colorTheme} flex items-center justify-center flex-shrink-0 relative overflow-hidden ring-1 ring-white/10`}>
        <div className="absolute inset-0 bg-white/10 opacity-30 group-hover:opacity-50 transition-opacity" />
        <div className="w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center ring-1 ring-white/30">
          <Music4 size={14} className="text-white drop-shadow-md" />
        </div>
      </div>

      {/* Info & Waveform */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-[13px] font-bold text-white/90 truncate">{displayName}</h4>
          {isPlaying ? (
            <span className="text-[9px] font-bold text-[#2F6BFF] uppercase bg-[#2F6BFF]/10 px-1.5 py-0.5 rounded border border-[#2F6BFF]/20 animate-pulse">Now playing</span>
          ) : (
            <span className="text-[10px] font-mono text-white/40">Sample</span>
          )}
        </div>
        
        {/* Simple Waveform Placeholder */}
        <div className="flex items-center gap-[1.5px] h-3 mb-2">
          <style>
            {`
              @keyframes soundWave {
                0%, 100% { transform: scaleY(1); }
                50% { transform: scaleY(2.2); }
              }
              .wave-bar {
                animation: none;
              }
              .group:hover .wave-bar, .is-active-wave .wave-bar {
                animation: soundWave var(--dur) ease-in-out infinite var(--del);
              }
            `}
          </style>
          {[...Array(32)].map((_, i) => {
            const baseHeight = 30 + Math.abs(Math.sin(i * 0.5) * 40);
            return (
              <div 
                key={i} 
                className={`wave-bar w-[1.5px] rounded-full transition-all duration-500 ${isPlaying ? 'bg-[#2F6BFF] is-active-wave' : 'bg-white/20'}`} 
                style={{ 
                  height: `${baseHeight}%`,
                  '--del': `${i * 0.03}s`,
                  '--dur': `${0.6 + Math.random() * 0.4}s`,
                  transformOrigin: 'bottom'
                } as any} 
              />
            );
          })}
        </div>

        <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold truncate">
          Uploaded Audio · Voice Sample
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pl-4 pr-1">
        <button 
          onClick={(e) => onDelete?.(e, file)}
          className="p-2 text-white/40 hover:text-red-500 transition-colors bg-white/5 hover:bg-red-500/10 rounded-lg border border-white/5 hover:border-red-500/20"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default AudioCloningInputBox;

