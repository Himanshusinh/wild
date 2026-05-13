'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, 
  MessageSquare, Volume2, VolumeX, X, Download, Copy, Check, Music4 
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { downloadFileWithNaming } from '@/utils/downloadUtils';

interface Props {
  selectedAudio: {
    entry: any;
    audio: any;
  };
  onClose: () => void;
}

export default function GlobalBottomAudioPlayer({ selectedAudio, onClose }: Props) {
  const user = useAppSelector((state: any) => state.auth?.user);
  const audioUrl = selectedAudio?.audio?.url || selectedAudio?.audio?.firebaseUrl || selectedAudio?.audio?.originalUrl;
  const prompt = selectedAudio?.entry?.lyrics || selectedAudio?.entry?.prompt || selectedAudio?.audio?.fileName || 'Untitled Track';
  const model = selectedAudio?.entry?.model || 'ElevenLabs';
  const generationType = selectedAudio?.entry?.generationType || 'audio';

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showPromptInfo, setShowPromptInfo] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Set title
  const rawTitle = selectedAudio?.audio?.fileName || (prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt);
  const trackTitle = rawTitle.replace(/\.[^/.]+$/, '');
  const subtitle = `${model} · ${generationType}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    // Auto play on load
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (!audioUrl) return;
    try {
      const username = user?.username || user?.displayName || null;
      await downloadFileWithNaming(audioUrl, username, 'audio');
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {}
  };

  // Helper function to get color theme based on entry
  const seed = selectedAudio?.entry?.id || 0;
  const hash = String(seed).split('').reduce((acc: number, char: string) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const themes = [
    'from-indigo-600 to-blue-500',
    'from-purple-600 to-indigo-500',
    'from-blue-600 to-cyan-500',
    'from-violet-600 to-purple-500',
    'from-cyan-600 to-blue-500',
  ];
  const colorTheme = themes[Math.abs(hash) % themes.length];

  if (!selectedAudio) return null;

  const content = (
    <div className="fixed lg:absolute bottom-0 left-0 right-0 h-24 bg-[#121216] border-t lg:border-t-0 lg:border border-white/10 z-[100] flex items-center justify-between px-6 backdrop-blur-2xl shadow-2xl select-none animate-slide-up lg:rounded-t-2xl">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Left section: Cover & Title */}
      <div className="flex items-center gap-4 w-1/4 min-w-0">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorTheme} flex items-center justify-center flex-shrink-0 relative overflow-hidden ring-1 ring-white/10`}>
          <Music4 size={20} className="text-white/80" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-white text-sm font-bold truncate tracking-wide">{trackTitle}</h4>
          <p className="text-white/40 text-xs truncate mt-0.5 capitalize">{subtitle}</p>
        </div>
      </div>

      {/* Center section: Playback Controls & Progress */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-2xl px-4">
        <div className="flex items-center gap-6 mb-1.5">
          <button className="text-white/30 hover:text-white/60 transition-colors cursor-pointer">
            <Shuffle size={16} />
          </button>
          <button 
            onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }}
            className="text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <SkipBack size={20} />
          </button>
          
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white hover:scale-105 flex items-center justify-center transition-all cursor-pointer shadow-md group"
          >
            {isPlaying ? (
              <Pause size={18} className="text-black fill-black" />
            ) : (
              <Play size={18} className="text-black fill-black ml-0.5" />
            )}
          </button>

          <button className="text-white/50 hover:text-white transition-colors cursor-pointer">
            <SkipForward size={20} />
          </button>
          <button className="text-white/30 hover:text-white/60 transition-colors cursor-pointer">
            <Repeat size={16} />
          </button>
        </div>

        {/* Slider */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-[11px] font-mono text-white/40 min-w-[32px] text-right">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative flex items-center h-4 group">
            <input
              type="range"
              min="0"
              max={duration || 1}
              step="0.01"
              value={currentTime}
              onChange={handleSeek}
              className="w-full absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-[#2F6BFF] rounded-full relative"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] font-mono text-white/40 min-w-[32px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right section: Icons & Actions */}
      <div className="flex items-center justify-end gap-4 w-1/4">
        <button 
          onClick={() => setShowPromptInfo(!showPromptInfo)}
          className={`p-2 rounded-lg transition-colors relative ${showPromptInfo ? 'text-[#2F6BFF] bg-[#2F6BFF]/10' : 'text-white/40 hover:text-white'}`}
          title="Prompt / Lyrics Info"
        >
          <MessageSquare size={18} />
        </button>

        <button onClick={handleDownload} className="p-2 text-white/40 hover:text-white transition-colors" title="Download Audio">
          <Download size={18} />
        </button>

        <button onClick={toggleMute} className="p-2 text-white/40 hover:text-white transition-colors">
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/5" title="Close Player">
          <X size={20} />
        </button>
      </div>

      {/* Prompt/Lyrics Overlay Popup anchored above the button */}
      {showPromptInfo && (
        <div className="absolute right-6 bottom-28 w-80 bg-[#16161C] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-3xl z-50 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Generation Info</span>
            <button onClick={copyPrompt} className="text-white/40 hover:text-white p-1">
              {copiedPrompt ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto pr-1 text-xs text-white/80 leading-relaxed font-satoshi whitespace-pre-wrap select-text">
            {prompt}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );

  const container = typeof document !== 'undefined' ? document.getElementById('music-player-container') : null;
  return container ? createPortal(content, container) : content;
}
