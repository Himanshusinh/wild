'use client';

import React, { useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useBottomScrollPagination } from '@/hooks/useBottomScrollPagination';
import { loadMoreHistory, removeHistoryEntry } from '@/store/slices/historySlice';
import { Music4, Trash2 } from 'lucide-react';
import WildMindLogoGenerating from '@/app/components/WildMindLogoGenerating';
import axiosInstance from '@/lib/axiosInstance';
import toast from 'react-hot-toast';

// Helper function to get color theme based on entry
const getColorTheme = (entry: any, index: number = 0): string => {
  // Use a combination of entry ID, model, and index to get consistent colors
  const seed = entry?.id || entry?.model || index || 0;
  const hash = String(seed).split('').reduce((acc: number, char: string) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const themes = [
    'from-sky-500/60 via-blue-600/60 to-indigo-600/60',
    'from-cyan-500/60 via-sky-600/60 to-blue-700/60',
    'from-blue-500/60 via-indigo-600/60 to-purple-600/60',
    'from-indigo-600/60 via-violet-600/60 to-fuchsia-600/60',
    'from-blue-600/60 via-purple-600/60 to-sky-500/60',
    'from-indigo-700/60 via-blue-600/60 to-cyan-600/60',
    'from-purple-700/60 via-indigo-600/60 to-blue-600/60',
    'from-blue-500/60 via-cyan-500/60 to-teal-500/60',
    'from-sky-600/60 via-indigo-600/60 to-purple-700/60',
    'from-cyan-600/60 via-blue-700/60 to-indigo-800/60',
  ];
  
  return themes[Math.abs(hash) % themes.length];
};

interface Props {
  onAudioSelect?: (data: { entry: any; audio: any }) => void;
  selectedAudio?: { entry: any; audio: any } | null;
  localPreview?: any;
}

const normalize = (v: any) => String(v || '').toLowerCase().replace(/[_-]/g, '-');

const DialogueHistory: React.FC<Props> = ({ onAudioSelect, selectedAudio, localPreview }) => {
  const dispatch = useAppDispatch();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = React.useState(1);

  // Delete handler - same logic as ImagePreviewModal
  const handleDeleteAudio = async (e: React.MouseEvent, entry: any) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (!window.confirm('Delete this generation permanently? This cannot be undone.')) return;
      await axiosInstance.delete(`/api/generations/${entry.id}`);
      try { dispatch(removeHistoryEntry(entry.id)); } catch {}
      // Clear/reset document title when audio is deleted
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
      // Primary check by generationType
      if (['text-to-dialogue', 'dialogue'].includes(genType)) return true;
      // Secondary check by model/endpoint
      if (
        model.includes('elevenlabs-dialogue') ||
        backendModel.includes('text-to-dialogue')
      ) return true;
      return false;
    });
  });

  const hasMore = useAppSelector((s: any) => s.history?.hasMore || false);
  const loading = useAppSelector((s: any) => s.history?.loading || false);

  const grouped = historyEntries.reduce((groups: any, e: any) => {
    const key = new Date(e.timestamp || e.createdAt || e.updatedAt).toDateString();
    (groups[key] ||= []).push(e);
    return groups;
  }, {} as Record<string, any[]>);
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const todayKey = new Date().toDateString();

  useBottomScrollPagination({
    containerRef: undefined,
    hasMore,
    loading,
    requireUserScroll: true,
    bottomOffset: 800,
    throttleMs: 200,
    loadMore: async () => {
      const next = page + 1; setPage(next);
      await (dispatch as any)(loadMoreHistory({
        filters: { generationType: ['text-to-dialogue', 'text_to_dialogue', 'dialogue'] },
        paginationParams: { limit: 10 }
      } as any)).unwrap().catch(() => {});
    }
  });

  return (
    <div className="no-scrollbar scrollbar-hide">
      <div className="pl-0 pr-6 pb-32">
        {loading && historyEntries.length === 0 && (
          <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center gap-4">
              <WildMindLogoGenerating running={true} size="lg" speedMs={1600} className="mx-auto" />
              <div className="text-white text-lg text-center">Loading your generation history...</div>
            </div>
          </div>
        )}

        {!loading && historyEntries.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                <Music4 className="w-8 h-8 text-white/60" />
              </div>
              <div className="text-white text-lg">No generations yet</div>
              <div className="text-white/60 text-sm max-w-md">Create your first piece of AI-generated audio using the interface below</div>
            </div>
          </div>
        )}

        {localPreview && !grouped[todayKey] && (
          <DateRow dateKey={todayKey}>
            <AudioTileGenerating preview={localPreview} />
          </DateRow>
        )}

        {historyEntries.length > 0 && (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <DateRow key={date} dateKey={date}>
                {date === todayKey && localPreview && <AudioTileGenerating preview={localPreview} />}
                {grouped[date].flatMap((entry: any) => {
                  const rawSources = [ ...(entry.audios||[]), ...(entry.images||[]), ...(entry.audio?[entry.audio]:[]) ].filter(Boolean);
                  const dedupMap = new Map<string, any>();
                  rawSources.forEach((a: any) => {
                    const url = a?.url || a?.firebaseUrl || a?.originalUrl;
                    if (!url) return;
                    if (!dedupMap.has(url)) dedupMap.set(url, a);
                  });
                  const media = Array.from(dedupMap.values());
                  if (media.length === 0) return [];
                  return media.map((audio: any, i: number) => {
                    const colorTheme = getColorTheme(entry, i);
                    return (
                      <div
                        key={`${entry.id}-${audio.id || i}`}
                        onClick={() => onAudioSelect?.({ entry, audio })}
                        className={`relative w-48 h-48 rounded-2xl overflow-hidden bg-gradient-to-br ${colorTheme} ring-1 ring-white/10 hover:ring-white/30 transition-all duration-500 cursor-pointer group flex-shrink-0 shadow-[0_30px_45px_-25px_rgba(15,23,42,0.95)] hover:-translate-y-1 hover:scale-[1.02] opacity-60`}
                      >
                        <div className="absolute inset-0 opacity-70 group-hover:opacity-90 transition-opacity duration-500">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_60%)]" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(0,0,0,0.25),_transparent_65%)]" />
                        </div>
                        <StaticAudioTile status={entry.status} entry={entry} index={i} />
                        {/* Delete button on hover */}
                        {entry.status !== 'generating' && entry.status !== 'failed' && (
                          <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button
                              aria-label="Delete audio"
                              className="pointer-events-auto p-1.5 rounded-lg bg-red-500/60 hover:bg-red-500/90 text-white backdrop-blur-3xl"
                              onClick={(e) => handleDeleteAudio(e, entry)}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  });
                })}
              </DateRow>
            ))}
            {hasMore && loading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <WildMindLogoGenerating running={loading} size="md" speedMs={1600} className="mx-auto" />
                  <div className="text-sm text-white/60">Loading more generations...</div>
                </div>
              </div>
            )}
            <div ref={sentinelRef} style={{ height: 1 }} />
          </div>
        )}
      </div>
    </div>
  );
};

const DateRow: React.FC<{ dateKey: string; children: React.ReactNode }> = ({ dateKey, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
      </div>
      <h3 className="text-sm font-medium text-white/70">{new Date(dateKey).toLocaleDateString('en-US',{weekday:'short',year:'numeric',month:'short',day:'numeric'})}</h3>
    </div>
    <div className="flex flex-wrap gap-3 ml-9">{children}</div>
  </div>
);

const StaticAudioTile: React.FC<{ status: string; entry?: any; index?: number }> = ({ status, entry, index = 0 }) => (
  status === 'generating' ? (
    <div className="w-full h-full flex items-center justify-center bg-black/90">
      <div className="flex flex-col items-center gap-2">
        <WildMindLogoGenerating running size="md" speedMs={1600} className="mx-auto" />
        <div className="text-xs text-white/60 text-center">Composing...</div>
      </div>
    </div>
  ) : status === 'failed' ? (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/30 to-red-800/30 ring-1 ring-red-500/20">
      <div className="flex flex-col items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <div className="text-xs text-red-400">Failed</div>
      </div>
    </div>
  ) : (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.35)_0%,_rgba(255,255,255,0)_55%)]" />
      <div className="relative z-10 w-20 h-20 bg-white/30 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-[0_15px_35px_-15px_rgba(15,23,42,0.95)] ring-1 ring-white/60">
        <div className="absolute inset-2 rounded-full bg-white/40 blur-xl opacity-70" />
        <Music4 className="w-10 h-10 text-white drop-shadow-md relative z-10" />
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
    </div>
  )
);

const AudioTileGenerating = ({ preview }: { preview?: any }) => {
  const colorTheme = preview ? getColorTheme(preview, 0) : 'from-purple-900/30 via-purple-800/20 to-pink-900/30';
  
  return (
    <div className={`relative w-48 h-48 rounded-2xl overflow-hidden bg-gradient-to-br ${colorTheme} ring-1 ring-white/10 hover:ring-white/30 flex-shrink-0 shadow-[0_30px_45px_-25px_rgba(15,23,42,0.95)] transition-all duration-500 cursor-pointer group hover:-translate-y-1 hover:scale-[1.02] opacity-60`}>
      <div className="absolute inset-0 opacity-70 group-hover:opacity-90 transition-opacity duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(0,0,0,0.25),_transparent_65%)]" />
      </div>
      <StaticAudioTile status="generating" entry={preview} />
      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-md ring-1 ring-white/10">Audio</div>
    </div>
  );
};

export default DialogueHistory;
