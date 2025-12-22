'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music4, Copy, Check, Download } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { downloadFileWithNaming, getFileType, getExtensionFromUrl } from '@/utils/downloadUtils';
import { getModelDisplayName } from '@/utils/modelDisplayNames';

interface CustomAudioPlayerProps {
  audioUrl: string;
  prompt: string;
  model: string;
  lyrics?: string;
  autoPlay?: boolean;
  generationType?: string;
}

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ audioUrl, prompt, model, lyrics, autoPlay = false, generationType }) => {
  const user = useAppSelector((state: any) => state.auth?.user);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [lyricsExpanded, setLyricsExpanded] = useState(false);

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

  // Lock background scroll when an inline fullscreen-like overlay is used (optional consumers can wrap in modal)
  // If desired in this inline player, no-op. Keeping function for parity with other previews when used in modal wrappers.

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && audioRef.current) {
      const playAudio = async () => {
        try {
          // Small delay to ensure audio element is ready
          setTimeout(async () => {
            if (audioRef.current) {
              await audioRef.current.play();
              setIsPlaying(true);
            }
          }, 100);
        } catch (error) {
          console.log('Auto-play failed:', error);
          // Auto-play might fail due to browser policies, that's okay
        }
      };
      playAudio();
    }
  }, [autoPlay, audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl || audioUrl.trim() === '') return;
    
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

  const formatTime = (time: number) => {
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

  // Helpers to infer extension from URL or data URI
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
    if (!audioUrl || audioUrl.trim() === '') {
      console.error('No audio URL available for download');
      return;
    }
    
    try {
      // Get username from user state or fallback to 'user'
      const username = user?.username || user?.displayName || null;
      await downloadFileWithNaming(audioUrl, username, 'audio');
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const fileTypeLabel = (getExtensionFromUrl(audioUrl) || 'mp3').toUpperCase();

  const normalizeGenType = (t?: string) =>
    t ? String(t).replace(/[_-]/g, '-').toLowerCase() : '';

  // Show lyrics ONLY for music tracks.
  // Support legacy aliases like "music" / "music-generation" / "text_to_music".
  const normType = normalizeGenType(generationType);
  const isMusicType =
    normType === 'text-to-music' ||
    normType === 'music' ||
    normType === 'music-generation';

  const shouldShowLyrics =
    !!lyrics &&
    lyrics.trim().length > 0 &&
    isMusicType;

  return (
    <div className="w-full">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* New Layout: Prompt + Lyrics + Music Box */}
      <div className="space-y-4">
        {/* Prompt block with label and copy */}
        <div className="flex items-start gap-2">
          <div className="text-xs uppercase tracking-wide text-white/50 mt-2">Prompt</div>
          <div className="flex-1 bg-white/5 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white/90 text-sm leading-relaxed">
            {prompt}
          </div>
          <button
            onClick={() => copyToClipboard(prompt, 'prompt')}
            className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white mt-2"
            title="Copy prompt"
          >
            {copiedPrompt ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Download button under copy icon */}
        <div className="flex justify-end items-center gap-2 -mt-2">
          {/* File type label (left of download) */}
          <span className="px-2 py-0.5 rounded bg-white/10 ring-1 ring-white/15 text-white/70 text-[10px] tracking-wide">
            {fileTypeLabel}
          </span>
          <button
            onClick={handleDownload}
            className="mt-1 inline-flex items-center p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/80 ring-1 ring-white/15"
            title="Download audio"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Lyrics block with label, copy, and collapse – only for text-to-music */}
        {shouldShowLyrics && (
          <div className="flex items-start gap-2">
            <div className="text-xs uppercase tracking-wide text-white/50 mt-2">Lyrics</div>
            <div className="flex-1 w-40">
              <div
                className="bg-white/5 ring-1 w-full ring-white/10 rounded-lg px-3 py-2 text-white/80 text-sm leading-relaxed cursor-pointer hover:bg-white/10"
                onClick={() => setLyricsExpanded(!lyricsExpanded)}
                title={lyricsExpanded ? 'Click to collapse' : 'Click to expand'}
              >
                {!lyricsExpanded ? (
                  <div className="whitespace-nowrap overflow-x-auto scrollbar-hide">
                    {lyrics.length > 80 ? `${lyrics.substring(0, 80)}...` : lyrics}
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto scrollbar-hide">
                    <pre className="whitespace-pre-wrap font-mono text-[12px] text-white/80">{lyrics}</pre>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(lyrics, 'lyrics')}
              className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white mt-2"
              title="Copy lyrics"
            >
              {copiedLyrics ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
        
        {/* Music Box: Image + Play Button + Track Progress */}
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 ring-1 ring-white/20 w-full">
          <div className="flex items-center gap-4">
            {/* Music Image */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center ring-1 ring-white/20 flex-shrink-0">
              <Music4 className="w-10 h-10 text-white/60" />
            </div>
            
            {/* Play Button + Track Progress */}
            <div className="flex-1 space-y-3">
              {/* Play Button */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 bg-[#2F6BFF] hover:bg-[#2a5fe3] rounded-full flex items-center justify-center transition-colors shadow-[0_2px_8px_rgba(47,107,255,.45)]"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>
              
              {/* Track Progress Bar */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #2F6BFF ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`
                  }}
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #2F6BFF;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #2F6BFF;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CustomAudioPlayer;
