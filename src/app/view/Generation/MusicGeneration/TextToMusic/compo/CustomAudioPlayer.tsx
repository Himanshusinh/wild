'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music4, Copy, Check, Download, Info, X, Volume2, VolumeX, Repeat, Shuffle, SkipBack, SkipForward, FileText } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { getModelDisplayName } from '@/utils/modelDisplayNames';

interface CustomAudioPlayerProps {
  audioUrl: string;
  prompt: string;
  model: string;
  lyrics?: string;
  autoPlay?: boolean;
  generationType?: string;
  onClose?: () => void;
}

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({
  audioUrl,
  prompt,
  model,
  lyrics,
  autoPlay = false,
  generationType,
  onClose
}) => {
  const user = useAppSelector((state: any) => state.auth?.user);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && audioRef.current && audioUrl) {
      const playAudio = async () => {
        try {
          setTimeout(async () => {
            if (audioRef.current) {
              await audioRef.current.play();
              setIsPlaying(true);
            }
          }, 150);
        } catch (error) {
          console.log('Auto-play failed:', error);
        }
      };
      playAudio();
    }
  }, [autoPlay, audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async (text: string, type: 'prompt' | 'lyrics') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'prompt') {
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
      } else {
        setCopiedLyrics(true);
        setTimeout(() => setCopiedLyrics(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getExtensionFromMime = (mime: string): string | null => {
    const map: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/aac': 'aac',
      'audio/mp4': 'm4a',
      'audio/flac': 'flac',
      'audio/L16': 'pcm',
      'audio/pcm': 'pcm',
      'audio/raw': 'pcm',
    };
    return map[mime] || null;
  };

  const getExtensionFromUrl = (url: string): string | null => {
    try {
      if (!url) return null;
      if (url.startsWith('data:')) {
        const m = url.match(/^data:([^;]+);/);
        if (m && m[1]) return getExtensionFromMime(m[1]);
        return null;
      }
      const clean = url.split('?')[0].split('#')[0];
      const last = (clean.split('/').pop() || '').toLowerCase();
      const idx = last.lastIndexOf('.');
      if (idx > 0 && idx < last.length - 1) {
        const ext = last.substring(idx + 1);
        const allowed = new Set(['mp3','wav','m4a','ogg','aac','flac','pcm']);
        if (allowed.has(ext)) return ext;
      }
      return null;
    } catch {
      return null;
    }
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

  const fileTypeLabel = (getExtensionFromUrl(audioUrl) || 'mp3').toUpperCase();
  const displayTitle = prompt || lyrics || 'Generated Track';
  const displaySubtitle = `${getModelDisplayName(model)} • ${fileTypeLabel}`;

  const normalizeGenType = (t?: string) =>
    t ? String(t).replace(/[_-]/g, '-').toLowerCase() : '';

  const normType = normalizeGenType(generationType);
  const isMusicType =
    normType === 'text-to-music' ||
    normType === 'music' ||
    normType === 'music-generation';

  const shouldShowLyrics = !!lyrics && lyrics.trim().length > 0 && isMusicType;

  return (
    <>
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Pop-up Details/Lyrics overlay sliding up when toggled */}
      {infoOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100%-2rem)] sm:w-[420px] max-h-[70vh] bg-[#181820]/95 backdrop-blur-3xl ring-1 ring-white/10 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[110] flex flex-col gap-4 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 font-satoshi">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2F6BFF]" />
              <h4 className="text-white text-sm font-bold tracking-wide">Track Information</h4>
            </div>
            <button
              onClick={() => setInfoOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt block */}
          {prompt && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Prompt</span>
                <button
                  onClick={() => copyToClipboard(prompt, 'prompt')}
                  className="flex items-center gap-1 text-[10px] text-white/60 hover:text-white transition-colors"
                >
                  {copiedPrompt ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedPrompt ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="bg-black/30 rounded-xl p-3 text-white/90 text-xs leading-relaxed max-h-32 overflow-y-auto select-text ring-1 ring-white/5">
                {prompt}
              </div>
            </div>
          )}

          {/* Lyrics block */}
          {shouldShowLyrics && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Lyrics</span>
                <button
                  onClick={() => copyToClipboard(lyrics!, 'lyrics')}
                  className="flex items-center gap-1 text-[10px] text-white/60 hover:text-white transition-colors"
                >
                  {copiedLyrics ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedLyrics ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="bg-black/30 rounded-xl p-3 text-white/80 text-xs leading-relaxed max-h-52 overflow-y-auto select-text ring-1 ring-white/5 whitespace-pre-wrap font-mono">
                {lyrics}
              </div>
            </div>
          )}
        </div>
      )}

      {/* State-of-the-art Fixed Bottom Music Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] h-20 bg-[#121216] border-t border-white/10 px-4 sm:px-6 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl font-satoshi animate-in slide-in-from-bottom duration-300">
        
        {/* Left Section: Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-[200px] sm:max-w-xs md:max-w-sm">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-500/20 via-blue-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10 flex-shrink-0 relative overflow-hidden group">
            <div className={`absolute inset-0 bg-[#2F6BFF]/10 transition-opacity ${isPlaying ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
            <Music4 className={`w-5 h-5 text-white/70 relative z-10 transition-transform duration-500 ${isPlaying ? 'scale-110' : 'scale-100'}`} />
          </div>
          <div className="flex flex-col min-w-0 cursor-pointer group" onClick={() => setInfoOpen(!infoOpen)} title="Click to view details">
            <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#2F6BFF] transition-colors">
              {displayTitle}
            </div>
            <div className="text-[10px] text-white/40 truncate flex items-center gap-1.5 mt-0.5 font-medium">
              <span>{displaySubtitle}</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Playback Controls & Progress Bar */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-xl px-2 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <button className="text-white/30 hover:text-white/60 transition-colors hidden sm:block cursor-not-allowed">
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }} className="text-white/60 hover:text-white transition-colors active:scale-95">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white text-black hover:scale-105 active:scale-95 flex items-center justify-center transition-all shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current stroke-[3]" />
              ) : (
                <Play className="w-4 h-4 fill-current stroke-[3] ml-0.5" />
              )}
            </button>
            <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = duration; }} className="text-white/60 hover:text-white transition-colors active:scale-95">
              <SkipForward className="w-4 h-4" />
            </button>
            <button className="text-white/30 hover:text-white/60 transition-colors hidden sm:block cursor-not-allowed">
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress Slider */}
          <div className="w-full flex items-center gap-2.5 mt-1 sm:mt-1.5">
            <span className="text-[10px] text-white/40 font-mono w-8 text-right select-none">{formatTime(currentTime)}</span>
            <div className="flex-1 relative flex items-center group/slider">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-white/10 group-hover/slider:h-1.5 rounded-full appearance-none cursor-pointer transition-all duration-150 absolute inset-0 z-10 bottom-slider"
                style={{
                  background: `linear-gradient(to right, #2F6BFF ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (duration || 1)) * 100}%)`
                }}
              />
            </div>
            <span className="text-[10px] text-white/40 font-mono w-8 text-left select-none">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Section: Utilities & Dismiss */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 justify-end flex-1 max-w-[200px]">
          <button
            onClick={() => setInfoOpen(!infoOpen)}
            className={`p-2 rounded-full transition-colors relative ${infoOpen ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            title="Track Info & Lyrics"
          >
            <Info className="w-4 h-4" />
            {shouldShowLyrics && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#2F6BFF] rounded-full" />
            )}
          </button>
          
          <button
            onClick={toggleMute}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors hidden sm:flex"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            title="Download track"
          >
            <Download className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="ml-1 p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all border border-white/5"
              title="Close player"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        .bottom-slider::-webkit-slider-thumb {
          appearance: none;
          height: 10px;
          width: 10px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(47,107,255,0.8);
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
        }
        
        .bottom-slider:hover::-webkit-slider-thumb {
          opacity: 1;
          transform: scale(1.2);
        }

        .bottom-slider::-moz-range-thumb {
          height: 10px;
          width: 10px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(47,107,255,0.8);
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
        }

        .bottom-slider:hover::-moz-range-thumb {
          opacity: 1;
          transform: scale(1.2);
        }
      `}</style>
    </>
  );
};

export default CustomAudioPlayer;
