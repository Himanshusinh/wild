'use client';

import React, { useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useBottomScrollPagination } from '@/hooks/useBottomScrollPagination';
import { loadMoreHistory, loadHistory, setFilters, removeHistoryEntry } from '@/store/slices/historySlice';
import type { HistoryFilters } from '@/types/history';
import { Music4, Trash2, Download, Share2, Zap, ListFilter } from 'lucide-react';
import WildMindLogoGenerating from '@/app/components/WildMindLogoGenerating';
import axiosInstance from '@/lib/axiosInstance';
import toast from 'react-hot-toast';

// Helper function to get color theme based on entry
const getColorTheme = (entry: any, index: number = 0): string => {
  const seed = entry?.id || entry?.model || index || 0;
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
  
  return themes[Math.abs(hash) % themes.length];
};

interface Props {
  onAudioSelect?: (data: { entry: any; audio: any }) => void;
  selectedAudio?: { entry: any; audio: any } | null;
  localPreview?: any;
}

const normalize = (v: any) => String(v || '').toLowerCase().replace(/[_-]/g, '-');

const SFXHistory: React.FC<Props> = ({ onAudioSelect, selectedAudio, localPreview }) => {
  const dispatch = useAppDispatch();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('All');

  // Delete handler - same logic as ImagePreviewModal
  const handleDeleteAudio = async (e: React.MouseEvent, entry: any) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (!window.confirm('Delete this generation permanently? This cannot be undone.')) return;
      await axiosInstance.delete(`/api/generations/${entry.id}`);
      try { dispatch(removeHistoryEntry(entry.id)); } catch {}
      if (typeof document !== 'undefined') {
        document.title = 'WildMind';
      }
      toast.success('Audio deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete generation');
    }
  };

  const historyEntries = useAppSelector((state: any) => {
    const all = state.history.entries || [];
    return all.filter((entry: any) => {
      if (!entry) return false;
      const genType = normalize(entry.generationType);
      const model = normalize(entry.model);
      const backendModel = normalize(entry.backendModel || entry.apiModel || entry.providerModel);
      if (['sfx', 'sound-effect', 'sound_effect', 'sound-effects', 'sound_effects'].includes(genType)) return true;
      if (
        model.includes('elevenlabs-sfx') ||
        backendModel.includes('sound-effects')
      ) return true;
      return false;
    });
  });

  const hasMore = useAppSelector((s: any) => s.history?.hasMore || false);
  const loading = useAppSelector((s: any) => s.history?.loading || false);

  React.useEffect(() => {
    const fetchSFXHistory = async () => {
      try {
        const genFilter: HistoryFilters = {
          generationType: ['sfx', 'sound-effect', 'sound_effect', 'sound-effects', 'sound_effects'] as unknown as HistoryFilters['generationType'],
        };
        setPage(1);
        (dispatch as any)(setFilters(genFilter));
        await (dispatch as any)(loadHistory({
          filters: genFilter,
          backendFilters: genFilter,
          paginationParams: { limit: 50 },
          requestOrigin: 'page',
          expectedType: 'sfx',
          debugTag: `sfx-history:init:${Date.now()}`,
        })).unwrap();
      } catch (err) {
        console.error('[SFXHistory] Failed to load history:', err);
      }
    };
    fetchSFXHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useBottomScrollPagination({
    containerRef: undefined,
    hasMore,
    loading,
    requireUserScroll: true,
    bottomOffset: 800,
    throttleMs: 200,
    loadMore: async () => {
      const next = page + 1; setPage(next);
      const genFilter: HistoryFilters = {
        generationType: ['sfx', 'sound-effect', 'sound_effect', 'sound-effects', 'sound_effects'] as unknown as HistoryFilters['generationType'],
      };
      await (dispatch as any)(loadMoreHistory({
        filters: genFilter,
        backendFilters: genFilter,
        paginationParams: { limit: 10 }
      } as any)).unwrap().catch(() => {});
    }
  });

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).toUpperCase().replace(/,/g, ' ·');

  // Check if there's a matching entry in Redux for the local preview
  const hasMatchingReduxEntry = localPreview && historyEntries.some((entry: any) => {
    const idMatches = entry.id === localPreview.id;
    const promptMatches = entry.prompt === localPreview.prompt && entry.model === localPreview.model;
    const timeMatches = Math.abs(new Date(entry.createdAt || entry.timestamp).getTime() - new Date(localPreview.createdAt || localPreview.timestamp).getTime()) < 5000;
    return idMatches || (promptMatches && timeMatches && entry.generationType === localPreview.generationType);
  });

  // Decide whether to display localPreview
  const shouldShowLocalPreview = localPreview && (localPreview.status === 'generating' || !hasMatchingReduxEntry);

  // Filter out Redux entries that are fully covered by localPreview if localPreview is being shown to avoid duplicates
  const displayEntries = historyEntries.filter((entry: any) => {
    if (shouldShowLocalPreview) {
      const idMatches = entry.id === localPreview.id;
      const promptMatches = entry.prompt === localPreview.prompt && entry.model === localPreview.model;
      const timeMatches = Math.abs(new Date(entry.createdAt || entry.timestamp).getTime() - new Date(localPreview.createdAt || localPreview.timestamp).getTime()) < 5000;
      const typeMatches = entry.generationType === localPreview.generationType;
      if (idMatches || (promptMatches && timeMatches && typeMatches)) {
        return false;
      }
    }
    if (entry.status === 'generating') {
      const hasCompleted = historyEntries.some((other: any) => other.id === entry.id && other.status === 'completed');
      if (hasCompleted) return false;
    }
    return true;
  });

  return (
    <div className="no-scrollbar scrollbar-hide">
      <div className="pl-0 pr-6 pb-32">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-20 bg-[#0E0E12] pt-2 pb-4 mb-4 border-b border-white/[0.05]">
          <div className="flex flex-col gap-6 mt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[28px] text-white font-satoshi font-black tracking-tight">Your studio</h2>
              <div className="flex items-center gap-4 text-[10px] font-mono font-bold tracking-widest text-white/30 uppercase">
                <span>{currentDate}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <span className="bg-white/5 px-2 py-0.5 rounded-[4px] border border-white/5">{displayEntries.length + (shouldShowLocalPreview ? 1 : 0)} tracks</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {['All', 'Today', 'Favourites', 'Downloaded'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 border ${
                      activeFilter === filter 
                        ? "bg-white/10 text-white border-white/20" 
                        : "text-white/30 border-transparent hover:text-white/60"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-2 text-[11px] font-bold text-white/50 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <ListFilter size={14} />
                Newest
              </button>
            </div>
          </div>
        </div>

        {/* Main Loader */}
        {loading && historyEntries.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <WildMindLogoGenerating running={true} size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!loading && historyEntries.length === 0 && !shouldShowLocalPreview && (
          <div className="flex flex-col items-center gap-4 py-20 text-center opacity-40">
            <Music4 size={48} />
            <p className="text-lg font-serif">No tracks in your studio yet</p>
          </div>
        )}

        {/* Studio List */}
        <div className="space-y-3">
          {shouldShowLocalPreview && <MusicRow entry={localPreview} onSelect={onAudioSelect} isLocalPreview />}
          {displayEntries.map((entry: any, index: number) => (
            <MusicRow 
              key={entry.id} 
              entry={entry} 
              index={index} 
              onSelect={onAudioSelect} 
              onDelete={handleDeleteAudio} 
              isPlaying={selectedAudio?.entry?.id === entry.id}
            />
          ))}
        </div>

        {/* Upgrade Banner */}
        <div className="mt-8 p-5 bg-gradient-to-r from-[#16161C] to-[#0E0E12] rounded-[16px] border border-[#2F6BFF]/20 flex items-center justify-between group cursor-pointer hover:border-[#2F6BFF]/40 transition-all">
          <div className="flex items-center gap-5">
            <div className="w-11 h-11 bg-[#2F6BFF]/10 rounded-full flex items-center justify-center text-[#2F6BFF] ring-1 ring-[#2F6BFF]/30">
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <h4 className="text-[14px] font-satoshi font-black text-white/90">Upgrade to Studio Pro</h4>
              <p className="text-[11px] font-satoshi font-medium text-white/30 uppercase tracking-widest mt-0.5">Unlimited generations · 5-min tracks · WAV export · priority queue</p>
            </div>
          </div>
          <button className="bg-[#2F6BFF]/10 hover:bg-[#2F6BFF]/20 text-[#2F6BFF] text-[11px] font-bold px-4 py-2 rounded-[8px] transition-all flex items-center gap-2 border border-[#2F6BFF]/30">
            Upgrade
            <Zap size={12} fill="currentColor" />
          </button>
        </div>

        {/* Scroll Loading */}
        {hasMore && loading && (
          <div className="py-8 flex justify-center">
            <WildMindLogoGenerating running={true} size="md" />
          </div>
        )}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </div>
  );
};

// Sub-component for individual track row
const MusicRow = ({ entry, index = 0, onSelect, onDelete, isLocalPreview = false, isPlaying = false }: any) => {
  const colorTheme = getColorTheme(entry, index);
  const mediaItems = [
    ...((entry.audios || []) as any[]),
    ...(entry.audio ? [entry.audio] : []),
    ...((entry.images || []) as any[])
  ].filter(Boolean);

  const audio = mediaItems[0] || (entry.status === 'generating' || entry.status === 'failed' 
    ? { id: entry.id || 'placeholder', url: '', originalUrl: '', type: 'audio' } 
    : null);

  const [actualDuration, setActualDuration] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!audio) return;
    const raw = audio.duration || entry?.duration || entry?.audio?.duration;
    if (typeof raw === 'string' && raw.includes(':')) {
      setActualDuration(raw);
      return;
    }
    if (typeof raw === 'number' && raw > 0) {
      const mins = Math.floor(raw / 60);
      const secs = Math.floor(raw % 60);
      setActualDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
      return;
    }

    const url = audio.url || audio.firebaseUrl || audio.originalUrl;
    if (url && entry?.status === 'completed') {
      const aud = new Audio(url);
      const onMeta = () => {
        if (aud.duration && aud.duration !== Infinity) {
          const mins = Math.floor(aud.duration / 60);
          const secs = Math.floor(aud.duration % 60);
          setActualDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
      };
      aud.addEventListener('loadedmetadata', onMeta);
      aud.preload = 'metadata';
      aud.load();
      return () => aud.removeEventListener('loadedmetadata', onMeta);
    }
  }, [audio, entry]);

  if (!audio) return null;

  const isGenerating = entry.status === 'generating';
  const isFailed = entry.status === 'failed';
  const trackName = entry.fileName || (entry.prompt ? (entry.prompt.length > 30 ? entry.prompt.substring(0, 30) + '...' : entry.prompt) : 'Untitled Track');
  const modelName = entry.model || 'ElevenLabs';
  const genTypeString = entry.generationType || 'SFX';
  const metadata = `${modelName.toUpperCase()} · ${genTypeString.toUpperCase()}`;

  return (
    <div 
      onClick={() => !isGenerating && !isFailed && onSelect?.({ entry, audio })}
      className={`group bg-[#16161C]/40 hover:bg-[#16161C] border ${isPlaying ? 'border-[#2F6BFF]/40 bg-[#2F6BFF]/5' : 'border-white/[0.04] hover:border-white/10'} rounded-[14px] p-3 flex items-center gap-5 transition-all duration-300 cursor-pointer relative overflow-hidden`}
    >
      {/* Thumbnail */}
      <div className={`w-14 h-14 rounded-[10px] bg-gradient-to-br ${colorTheme} flex items-center justify-center flex-shrink-0 relative overflow-hidden ring-1 ring-white/10`}>
        <div className="absolute inset-0 bg-white/10 opacity-30 group-hover:opacity-50 transition-opacity" />
        <div className="w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center ring-1 ring-white/30">
          <Music4 size={14} className="text-white drop-shadow-md" />
        </div>
        {isGenerating && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <WildMindLogoGenerating running={true} size="sm" />
          </div>
        )}
      </div>

      {/* Info & Waveform */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-[13px] font-bold text-white/90 truncate">{trackName}</h4>
          {isPlaying ? (
            <span className="text-[9px] font-bold text-[#2F6BFF] uppercase bg-[#2F6BFF]/10 px-1.5 py-0.5 rounded border border-[#2F6BFF]/20 animate-pulse">Now playing</span>
          ) : (
            entry.status === 'completed' && <span className="text-[10px] font-mono text-white/40">{actualDuration || '--:--'}</span>
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
                className={`wave-bar w-[1.5px] rounded-full transition-all duration-500 ${(isPlaying || isGenerating) ? 'bg-[#2F6BFF] is-active-wave' : 'bg-white/20'}`} 
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
          {metadata}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pl-4 pr-1">
        {entry.status === 'completed' ? (
          <>
             <button className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/5">
                <Download size={14} />
             </button>
             <button className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/5">
                <Share2 size={14} />
             </button>
          </>
        ) : isGenerating ? (
          <span className="text-[10px] font-bold text-[#2F6BFF] uppercase tracking-widest px-2 py-1 bg-[#2F6BFF]/10 rounded-md border border-[#2F6BFF]/20 animate-pulse">Composing</span>
        ) : isFailed ? (
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-2 py-1 bg-red-500/10 rounded-md border border-red-500/20">Failed</span>
        ) : null}
        
        {!isLocalPreview && (
          <button 
            onClick={(e) => onDelete?.(e, entry)}
            className="p-2 text-white/40 hover:text-red-500 transition-colors bg-white/5 hover:bg-red-500/10 rounded-lg border border-white/5 hover:border-red-500/20"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SFXHistory;
