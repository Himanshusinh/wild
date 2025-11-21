'use client';

import React, { useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useBottomScrollPagination } from '@/hooks/useBottomScrollPagination';
import { loadMoreHistory } from '@/store/slices/historySlice';
import { Music4 } from 'lucide-react';
import WildMindLogoGenerating from '@/app/components/WildMindLogoGenerating';

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
            <AudioTileGenerating />
          </DateRow>
        )}

        {historyEntries.length > 0 && (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <DateRow key={date} dateKey={date}>
                {date === todayKey && localPreview && <AudioTileGenerating />}
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
                  return media.map((audio: any, i: number) => (
                    <div
                      key={`${entry.id}-${audio.id || i}`}
                      onClick={() => onAudioSelect?.({ entry, audio })}
                      className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                    >
                      <StaticAudioTile status={entry.status} />
                    </div>
                  ));
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

const StaticAudioTile: React.FC<{ status: string }> = ({ status }) => (
  status === 'generating' ? (
    <div className="w-full h-full flex items-center justify-center bg-black/90">
      <div className="flex flex-col items-center gap-2">
        <WildMindLogoGenerating running size="md" speedMs={1600} className="mx-auto" />
        <div className="text-xs text-white/60 text-center">Composing...</div>
      </div>
    </div>
  ) : status === 'failed' ? (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
      <div className="flex flex-col items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <div className="text-xs text-red-400">Failed</div>
      </div>
    </div>
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center relative">
      <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
        <Music4 className="w-8 h-8 text-white/80" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
    </div>
  )
);

const AudioTileGenerating = () => (
  <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 flex-shrink-0">
    <StaticAudioTile status="generating" />
    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Audio</div>
  </div>
);

export default DialogueHistory;
