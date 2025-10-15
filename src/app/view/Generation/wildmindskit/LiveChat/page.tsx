
'use client';

import React, { useEffect } from 'react';
import MainLayout from '@/app/view/Generation/Core/MainLayout';
import LiveChatInputBox from './compo/InputBox';
// import { useAppSelector } from '@/store/hooks';
import Image from 'next/image';
import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentView, setCurrentGenerationType } from '@/store/slices/uiSlice';
import { ViewType, GenerationType } from '@/types/generation';
import { loadHistory } from '@/store/slices/historySlice';

const LiveChatPage = () => {
  const dispatch = useAppDispatch();
  const currentView = useAppSelector((state: any) => state?.ui?.currentView || 'generation');
  const currentGenerationType = useAppSelector((state: any) => state?.ui?.currentGenerationType || 'text-to-image');

  const onViewChange = (view: ViewType) => {
    dispatch(setCurrentView(view));
    if (view === 'landing') {
      localStorage.removeItem('wild-mind-visited');
    } else {
      localStorage.setItem('wild-mind-visited', 'true');
    }
  };

  const onGenerationTypeChange = (type: GenerationType) => {
    dispatch(setCurrentGenerationType(type));
    dispatch(setCurrentView('generation'));
  };

  // Ensure generation type is set to live-chat on mount
  useEffect(() => {
    dispatch(setCurrentView('generation'));
    dispatch(setCurrentGenerationType('live-chat'));
    // Load persisted live-chat sessions into Redux history on mount
    dispatch(loadHistory({ filters: { generationType: 'live-chat' }, paginationParams: { limit: 20 } }));
  }, [dispatch]);

  return (
    <div className="relative">
      <MainLayout
        onViewChange={onViewChange}
        onGenerationTypeChange={onGenerationTypeChange}
        currentView={currentView}
        currentGenerationType={currentGenerationType}
      />
      {/* Override input for live chat */}
      <LiveChatInputBox />
      {/* Live Chat history (interactive, scrollable) */}
      <div className="fixed inset-0 pt-[62px] pl-[68px] pr-6 pb-40 overflow-y-auto z-30 pointer-events-auto">
        <div className="p-6">
          <LiveChatGrid />
        </div>
      </div>
    </div>
  );
};

const LiveChatGrid: React.FC = () => {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const entries = useAppSelector((s:any)=> (s.history?.entries || []).filter((e:any)=> e.generationType === 'live-chat'));
  // Group by sessionId; fallback to id if missing, preserve insertion order
  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const e of entries) {
      const key = e.sessionId || e.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    // Sort entries within each group by timestamp ascending so evolution is left→right
    return Array.from(map.entries()).map(([key, arr]) => ({
      key,
      entries: [...arr].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }));
  }, [entries]);
  if (!entries || entries.length === 0) return null;
  return (
    <div className="space-y-10">
      {groups.map((group:{ key: string; entries: any[] })=> {
        if (!group.entries || group.entries.length === 0) return null;
        // Aggregate all images for this session (map by sessionId)
        // Preserve chronological order left -> right
        const sortedEntries = [...group.entries].sort((a:any,b:any)=> new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const aggregated = sortedEntries.flatMap((entry:any) => (entry.images || []).map((img:any) => ({
          ...img,
          _entryStatus: entry.status,
          _entryPrompt: entry.prompt,
          _entryTimestamp: entry.timestamp,
        })));
        // Deduplicate by id or url to avoid duplicates from consolidated entries
        const seen = new Set<string>();
        const images = aggregated.filter((img:any)=>{
          const key = img.id || img.url;
          if (!key) return true;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const headerEntry = sortedEntries[0];
        return (
          <div key={group.key} className="space-y-4">
            {/* Header with prompt and meta */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
              <div className="flex flex-col">
                <div className="flex flex-row-reverse items-center gap-2">
                  <p className="text-white/90 text-sm leading-relaxed flex-1 max-w-[500px] break-words">{headerEntry.prompt}</p>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                  <span>{new Date(headerEntry.timestamp).toLocaleDateString()}</span>
                  {headerEntry.model && <span>{headerEntry.model}</span>}
                  {Array.isArray(headerEntry.images) && <span>{headerEntry.images.length} image{headerEntry.images.length !== 1 ? 's' : ''}</span>}
                  {headerEntry.style && <span className="text-blue-400">Style: {headerEntry.style}</span>}
                  {headerEntry.status === 'generating' && (
                    <span className="text-yellow-400 flex items-center gap-1"><div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>Generating...</span>
                  )}
                  {headerEntry.status === 'failed' && <span className="text-red-400">Failed</span>}
                </div>
              </div>
            </div>

            {/* Horizontal image row styled like image generation */}
            <div className="ml-9">
              <div className="flex flex-row items-center gap-4 overflow-x-auto pb-1 snap-x">
                {images.map((img:any) => (
                  <div
                    key={img.id}
                    onClick={() => setPreviewUrl(img.url)}
                    className="relative aspect-square w-40 md:w-20 lg:w-20 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 flex-shrink-0 cursor-pointer snap-start"
                  >
                    {img._entryStatus === 'generating' ? (
                      <div className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <Image src={img.url} alt={img._entryPrompt || 'generated'} fill className="object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      {/* Image preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setPreviewUrl(null)}>
          <div className="relative bg-black/90 ring-1 ring-white/20 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[85vh]" onClick={(e)=> e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)} className="absolute top-3 right-3 px-3 py-1.5 text-xs rounded-full bg-white text-black hover:bg-gray-200 transition z-10">Close</button>
            <div className="relative w-full h-[75vh]">
              <Image src={previewUrl} alt="Preview" fill className="object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveChatPage;