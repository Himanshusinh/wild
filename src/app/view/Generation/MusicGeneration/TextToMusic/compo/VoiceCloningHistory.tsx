'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  const seed = entry?.id || entry?.model || entry?.fileName || index || 0;
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
  userAudioFiles?: any[];
  onDeleteUserFile?: (e: React.MouseEvent, file: any) => void;
}

const normalize = (v: any) => String(v || '').toLowerCase().replace(/[_-]/g, '-');

const VoiceCloningHistory: React.FC<Props> = ({ 
  onAudioSelect, 
  selectedAudio, 
  localPreview, 
  userAudioFiles = [], 
  onDeleteUserFile 
}) => {
  const dispatch = useAppDispatch();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('All');

  // Delete handler for generated history entries
  const handleDeleteGeneratedAudio = async (e: React.MouseEvent, entry: any) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (!window.confirm('Delete this generation permanently? This cannot be undone.')) return;
      await axiosInstance.delete(`/api/generations/${entry.id}`);
      try { dispatch(removeHistoryEntry(entry.id)); } catch {}
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
      if (['voicecloning', 'voice-cloning'].includes(genType)) return true;
      if (model.includes('voicecloning') || model.includes('voice-cloning')) return true;
      return false;
    });
  });

  const hasMore = useAppSelector((s: any) => s.history?.hasMore || false);
  const loading = useAppSelector((s: any) => s.history?.loading || false);

  useEffect(() => {
    const fetchCloningHistory = async () => {
      try {
        const genFilter: HistoryFilters = {
          generationType: ['voicecloning', 'voice-cloning'] as unknown as HistoryFilters['generationType'],
        };
        setPage(1);
        (dispatch as any)(setFilters(genFilter));
        await (dispatch as any)(loadHistory({
          filters: genFilter,
          backendFilters: genFilter,
          paginationParams: { limit: 50 },
          requestOrigin: 'page',
          expectedType: 'voicecloning',
          debugTag: `voicecloning-history:init:${Date.now()}`,
        })).unwrap();
      } catch (err) {
        console.error('[VoiceCloningHistory] Failed to load history:', err);
      }
    };
    fetchCloningHistory();
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
        generationType: ['voicecloning', 'voice-cloning'] as unknown as HistoryFilters['generationType'],
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

  // Decide whether to display localPreview
  const hasMatchingReduxEntry = localPreview && historyEntries.some((entry: any) => entry.id === localPreview.id);
  const shouldShowLocalPreview = localPreview && (localPreview.status === 'generating' || !hasMatchingReduxEntry);

  const displayEntries = historyEntries.filter((entry: any) => {
    if (shouldShowLocalPreview && entry.id === localPreview.id) return false;
    if (entry.status === 'generating') {
      const hasCompleted = historyEntries.some((other: any) => other.id === entry.id && other.status === 'completed');
      if (hasCompleted) return false;
    }
    return true;
  });

  const getDisplayAudioName = (name?: string) => {
    if (!name) return '';
    const base = name.split('/').pop() || name;
    return base.replace(/\.[^/.]+$/, '');
  };

  const totalTracksCount = (userAudioFiles?.length || 0) + displayEntries.length + (shouldShowLocalPreview ? 1 : 0);

  return (
    <div className="no-scrollbar scrollbar-hide">
      <div className="pl-0 pr-6 pb-32">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-20 bg-[#0E0E12]  pb-4 mb-4 border-b border-white/[0.05]">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[28px] text-white font-satoshi font-black tracking-tight">Your studio</h2>
              <div className="flex items-center gap-4 text-[10px] font-mono font-bold tracking-widest text-white/30 uppercase">
                <span>{currentDate}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <span className="bg-white/5 px-2 py-0.5 rounded-[4px] border border-white/5">{totalTracksCount} tracks</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {['All', 'Samples', 'Clones'].map(filter => (
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

        {/* Empty State */}
        {!loading && totalTracksCount === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center opacity-40">
            <Music4 size={48} />
            <p className="text-lg font-serif">No voice samples or clones in your studio yet</p>
          </div>
        )}

        {/* Studio List */}
        <div className="space-y-3">
          {/* 1. Local preview if generating */}
          {shouldShowLocalPreview && <MusicRow entry={localPreview} onSelect={onAudioSelect} isLocalPreview />}

          {/* 2. Uploaded Input Audio Files */}
          {(activeFilter === 'All' || activeFilter === 'Samples') && userAudioFiles.map((file: any, index: number) => {
            const displayName = getDisplayAudioName(file.fileName);
            const isSelected = selectedAudio?.audio?.url === file.url || selectedAudio?.audio?.fileName === displayName;
            return (
              <InputAudioRow 
                key={file.id || file.storagePath || file.url || `input-${index}`}
                file={file}
                index={index}
                onSelect={() => onAudioSelect?.({ 
                  entry: { model: 'voicecloning', prompt: displayName, generationType: 'voicecloning' }, 
                  audio: { url: file.url, originalUrl: file.url, firebaseUrl: file.url, fileName: displayName } 
                })}
                onDelete={onDeleteUserFile}
                isPlaying={isSelected}
              />
            );
          })}

          {/* 3. Generated/Cloned Audio Entries */}
          {(activeFilter === 'All' || activeFilter === 'Clones') && displayEntries.map((entry: any, index: number) => (
            <MusicRow 
              key={entry.id} 
              entry={entry} 
              index={index + (userAudioFiles?.length || 0)} 
              onSelect={onAudioSelect} 
              onDelete={handleDeleteGeneratedAudio} 
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
              <p className="text-[11px] font-satoshi font-medium text-white/30 uppercase tracking-widest mt-0.5">Unlimited voice clones · priority processing · pristine exports</p>
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
            {/* Loader removed as requested */}
          </div>
        )}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </div>
  );
};

// Sub-component for uploaded input audio row
const InputAudioRow = ({ file, index = 0, onSelect, onDelete, isPlaying = false }: any) => {
  const displayName = file.fileName ? (file.fileName.split('/').pop()?.replace(/\.[^/.]+$/, '') || file.fileName) : 'Voice Sample';
  const colorTheme = getColorTheme(file, index);

  const [actualDuration, setActualDuration] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) return;
    const raw = file.duration;
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

    const url = file.url || file.firebaseUrl || file.originalUrl;
    if (url) {
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
  }, [file]);

  return (
    <div 
      onClick={() => onSelect?.()}
      className={`group bg-[#16161C]/40 hover:bg-[#16161C] border ${isPlaying ? 'border-[#2F6BFF]/40 bg-[#2F6BFF]/5' : 'border-white/[0.04] hover:border-white/10'} rounded-[14px] p-3 flex items-center gap-5 transition-all duration-300 cursor-pointer relative overflow-hidden`}
    >
      <div className={`w-14 h-14 rounded-[10px] bg-gradient-to-br ${colorTheme} flex items-center justify-center flex-shrink-0 relative overflow-hidden ring-1 ring-white/10`}>
        <div className="absolute inset-0 bg-white/10 opacity-30 group-hover:opacity-50 transition-opacity" />
        <div className="w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center ring-1 ring-white/30">
          <Music4 size={14} className="text-white drop-shadow-md" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-[13px] font-bold text-white/90 truncate">{displayName}</h4>
          {isPlaying ? (
            <span className="text-[9px] font-bold text-[#2F6BFF] uppercase bg-[#2F6BFF]/10 px-1.5 py-0.5 rounded border border-[#2F6BFF]/20 animate-pulse">Now playing</span>
          ) : (
            <span className="text-[10px] font-mono text-white/40">{actualDuration || 'Sample'}</span>
          )}
        </div>
        
        <div className="flex items-center gap-[1.5px] h-3 mb-2">
          <style>
            {`
              @keyframes soundWave {
                0%, 100% { transform: scaleY(1); }
                50% { transform: scaleY(2.2); }
              }
              .wave-bar { animation: none; }
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
          UPLOADED AUDIO · VOICE SAMPLE
        </div>
      </div>

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

// Sub-component for generated track row
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
  const trackName = entry.fileName || (entry.prompt ? (entry.prompt.length > 30 ? entry.prompt.substring(0, 30) + '...' : entry.prompt) : 'Cloned Voice');
  const modelName = entry.model || 'Voice Cloning';
  const metadata = `${modelName.toUpperCase()} · CLONED TRACK`;

  return (
    <div 
      onClick={() => !isGenerating && !isFailed && onSelect?.({ entry, audio })}
      className={`group bg-[#16161C]/40 hover:bg-[#16161C] border ${isPlaying ? 'border-[#2F6BFF]/40 bg-[#2F6BFF]/5' : 'border-white/[0.04] hover:border-white/10'} rounded-[14px] p-3 flex items-center gap-5 transition-all duration-300 cursor-pointer relative overflow-hidden`}
    >
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

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-[13px] font-bold text-white/90 truncate">{trackName}</h4>
          {isPlaying ? (
            <span className="text-[9px] font-bold text-[#2F6BFF] uppercase bg-[#2F6BFF]/10 px-1.5 py-0.5 rounded border border-[#2F6BFF]/20 animate-pulse">Now playing</span>
          ) : (
            entry.status === 'completed' && <span className="text-[10px] font-mono text-white/40">{actualDuration || 'Clone'}</span>
          )}
        </div>
        
        <div className="flex items-center gap-[1.5px] h-3 mb-2">
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
          <span className="text-[10px] font-bold text-[#2F6BFF] uppercase tracking-widest px-2 py-1 bg-[#2F6BFF]/10 rounded-md border border-[#2F6BFF]/20 animate-pulse">Cloning</span>
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

export default VoiceCloningHistory;
