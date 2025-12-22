
'use client';

import React, { useEffect, Suspense } from 'react';
import MainLayout from '@/app/view/Generation/Core/MainLayout';
import LiveChatInputBox from './compo/InputBox';
// import { useAppSelector } from '@/store/hooks';
import Image from 'next/image';
import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentView, setCurrentGenerationType } from '@/store/slices/uiSlice';
import { ViewType, GenerationType } from '@/types/generation';
import { loadHistory } from '@/store/slices/historySlice';
import { useSearchParams } from 'next/navigation';
import { setUploadedImages } from '@/store/slices/generationSlice';
import { ensureSessionReady } from '@/lib/axiosInstance';

const LiveChatPage = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
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

  // Handle image parameter from URL
  useEffect(() => {
    const loadImageFromParams = async () => {
      const imageUrl = searchParams.get('image');
      const storagePath = searchParams.get('sp');
      if (imageUrl || storagePath) {
        // Ensure session is ready before loading image
        const sessionReady = await ensureSessionReady();
        if (!sessionReady) {
          console.warn('Session not ready, skipping image load');
          return;
        }

        // Decode the URL-encoded image parameter
        let decodedImageUrl = decodeURIComponent(imageUrl || '');
        console.log('Loading image from URL parameter:', { imageUrl: decodedImageUrl, storagePath });
        
        // Use storagePath if available (like other features), otherwise use imageUrl
        if (storagePath) {
          const proxied = `/api/proxy/resource/${encodeURIComponent(storagePath)}`;
          dispatch(setUploadedImages([proxied]));
        } else if (decodedImageUrl) {
          // Convert relative URL to absolute URL for FAL service compatibility
          const absoluteUrl = decodedImageUrl.startsWith('/api/proxy/resource/') 
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${decodedImageUrl}`
            : decodedImageUrl;
          dispatch(setUploadedImages([absoluteUrl]));
        }
      }
    };

    loadImageFromParams();
  }, [searchParams, dispatch]);

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
  // Group by sessionId; fallback to date-based grouping for better session grouping
  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const e of entries) {
      // Use sessionId if available, otherwise group by date to create session-like groups
      let key = e.sessionId;
      
      // If no sessionId, group by date (all entries from same day)
      if (!key) {
        const entryDate = new Date(e.timestamp);
        const dateStr = entryDate.toDateString();
        key = `session-${dateStr}`;
      }
      
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    
    // Sort entries within each group by timestamp ascending so evolution is left→right
    const result = Array.from(map.entries()).map(([key, arr]) => ({
      key,
      entries: [...arr].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }));
    
    console.log('Live Chat groups:', result);
    console.log('Raw entries:', entries);
    return result;
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
          <div key={group.key} className="space-y-4 z-70">
            {/* Header with prompt and meta */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
              <div className="flex flex-col">
                <div className="flex flex-row-reverse items-center gap-2">
                  <p className="text-white/90 text-sm leading-relaxed flex-1 max-w-[500px] break-words">
                    Live Chat Session
                    {images.length > 1 && (
                      <span className="ml-2 text-sm text-white/80">({images.length} images)</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/80">
                  <span>{new Date(headerEntry.timestamp).toLocaleDateString()}</span>
                  {headerEntry.model && <span>{headerEntry.model}</span>}
                  {/* <span className="text-blue-400">Session: {images.length} image{images.length !== 1 ? 's' : ''}</span> */}
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
              <div className="flex flex-row items-center gap-4 overflow-x-auto pb-1 snap-x custom-scrollbar">
                {images.map((img:any, index: number) => (
                  <div
                    key={img.id || img.url || index}
                    onClick={() => setPreviewUrl(img.url)}
                    className="relative aspect-square w-40 md:w-60 lg:w-60 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 flex-shrink-0 cursor-pointer snap-start group"
                  >
                    {img._entryStatus === 'generating' ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        <Image 
                          src={img.url} 
                          alt={img._entryPrompt || 'generated'} 
                          fill 
                          className="object-cover transition-transform duration-200 group-hover:scale-105" 
                        />
                        {/* Image number indicator */}
                        <div className="absolute top-2 left-2 bg-white/20 text-white/80 backdrop-blur-3xl z-10 shadow-lg text-xs px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          {index + 1}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {/* Session summary */}
                {/* <div className="flex-shrink-0 text-white/60 text-sm flex items-center gap-2">
                  <span className="text-xs">Session: {images.length} image{images.length !== 1 ? 's' : ''}</span>
                </div> */}
              </div>
            </div>
          </div>
        );
      })}
      {/* Image preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setPreviewUrl(null)}>
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

export default function Page() {
  return (
    <Suspense fallback={<div className="text-white/70 p-6">Loading…</div>}>
      <LiveChatPage />
    </Suspense>
  );
}