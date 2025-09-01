
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
      {/* Live Chat history preview grid (top of page, lighter than global history) */}
      <div className="fixed inset-0 pt-[62px] pl-[68px] pr-6 pb-40 overflow-y-auto z-30 pointer-events-none">
        <div className="p-6">
          <LiveChatGrid />
        </div>
      </div>
    </div>
  );
};

const LiveChatGrid: React.FC = () => {
  const entries = useAppSelector((s:any)=> (s.history?.entries || []).filter((e:any)=> e.generationType === 'live-chat'));
  // Group by sessionId; fallback to id if missing
  const groups = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const e of entries) {
      const key = e.sessionId || e.id;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return Object.values(map);
  }, [entries]);
  if (!entries || entries.length === 0) return null;
  return (
    <div className="space-y-6">
      {groups.map((group:any[], idx:number)=> (
        <div key={idx} className="space-y-3">
          {/* Horizontal row per upload session */}
          <div className="flex flex-row flex-nowrap items-start gap-3 overflow-x-auto pb-2">
            {group.map((entry:any) => (
              <>
                {entry.images.map((img:any)=> (
                  <div key={img.id} className="relative w-40 h-40 rounded-lg overflow-hidden bg-black/40 ring-1 ring-white/10 flex-shrink-0">
                    {entry.status === 'generating' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <Image src={img.url} alt={entry.prompt} fill className="object-cover" />
                    )}
                  </div>
                ))}
              </>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default LiveChatPage;