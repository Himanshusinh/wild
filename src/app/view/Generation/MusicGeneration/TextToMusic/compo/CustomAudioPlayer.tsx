'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music4, Copy, Check } from 'lucide-react';

interface CustomAudioPlayerProps {
  audioUrl: string;
  prompt: string;
  model: string;
  lyrics?: string;
  autoPlay?: boolean;
}

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ audioUrl, prompt, model, lyrics, autoPlay = false }) => {
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

  const promptToShow = (lyrics && lyrics.trim().length > 0) ? lyrics : prompt;

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
            {promptToShow}
          </div>
          <button
            onClick={() => copyToClipboard(promptToShow, 'prompt')}
            className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white mt-2"
            title="Copy prompt"
          >
            {copiedPrompt ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Lyrics block with label, copy, and collapse */}
        {lyrics && (
          <div className="flex items-start gap-2">
            <div className="text-xs uppercase tracking-wide text-white/50 mt-2">Lyrics</div>
            <div className="flex-1">
              <div
                className="bg-white/5 ring-1 ring-white/10 rounded-lg px-3 py-2 text-white/80 text-sm leading-relaxed cursor-pointer hover:bg-white/10"
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
