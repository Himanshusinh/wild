'use client';

import React, { useRef } from "react";
import { useAppSelector } from '@/store/hooks';
import { useBottomScrollPagination } from '@/hooks/useBottomScrollPagination';
import { loadMoreHistory } from '@/store/slices/historySlice';
import { useAppDispatch } from '@/store/hooks';
import { Music4 } from 'lucide-react';
import WildMindLogoGenerating from '@/app/components/WildMindLogoGenerating';

// Helper function to get color theme based on entry
const getColorTheme = (entry: any, index: number = 0): string => {
  // Use a combination of entry ID, model, and index to get consistent colors
  const seed = entry?.id || entry?.model || index || 0;
  const hash = String(seed).split('').reduce((acc: number, char: string) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const themes = [
    'from-sky-400 via-blue-500/95 to-indigo-500',
    'from-cyan-400 via-sky-500 to-blue-600',
    'from-blue-400 via-indigo-500 to-purple-500',
    'from-indigo-500 via-violet-500 to-fuchsia-500',
    'from-blue-500 via-purple-500 to-sky-400',
    'from-indigo-600 via-blue-500 to-cyan-500',
    'from-purple-600 via-indigo-500 to-blue-500',
    'from-blue-400 via-cyan-400 to-teal-400',
    'from-sky-500 via-indigo-500 to-purple-600',
    'from-cyan-500 via-blue-600 to-indigo-700',
  ];
  
  return themes[Math.abs(hash) % themes.length];
};
import CustomAudioPlayer from './CustomAudioPlayer';

const normalizeType = (type?: string) =>
  type ? String(type).replace(/[_-]/g, '-').toLowerCase() : '';

interface MusicHistoryProps {
  generationType?: string | string[];
  allowedTypes?: string[];
  onAudioSelect?: (data: { entry: any; audio: any }) => void;
  selectedAudio?: { entry: any; audio: any } | null;
  localPreview?: any;
}

const MusicHistory: React.FC<MusicHistoryProps> = ({
  generationType = 'text-to-music',
  allowedTypes = ['text-to-music', 'text_to_music', 'text-to-audio', 'text_to_audio', 'text-to-speech', 'text_to_speech', 'audio-generation'],
  onAudioSelect,
  selectedAudio,
  localPreview
}) => {
  const dispatch = useAppDispatch();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = React.useState(1);

  // Get history entries filtered by type
  const normalizedAllowedTypes = allowedTypes.map(normalizeType);
  const generationTypeList = Array.isArray(generationType) ? generationType : [generationType];
  const truthyGenerationTypes = generationTypeList.filter((type): type is string => Boolean(type));
  const normalizedGenerationTypes = truthyGenerationTypes.map(normalizeType);
  const historyEntries = useAppSelector((state: any) => {
    const allEntries = state.history.entries || [];
    
    // Debug: Log all entries when filtering for text-to-speech
    const isTtsFilter = normalizedGenerationTypes.some(t => t === 'text-to-speech' || t === 'tts') ||
      normalizedAllowedTypes.some(t => t === 'text-to-speech' || t === 'tts');

    if (isTtsFilter) {
      console.log('[MusicHistory] All entries before filtering:', {
        total: allEntries.length,
        entries: allEntries.map((e: any) => ({
          id: e.id,
          model: e.model,
          generationType: e.generationType,
          hasAudios: !!e.audios?.length,
          hasImages: !!e.images?.length,
          hasAudio: !!e.audio
        }))
      });
    }
    
    const filtered = allEntries.filter((entry: any) => {
      if (!entry) return false;
      
      if (isTtsFilter) {
        // Normalize generationType for comparison
        const genType = String(entry.generationType || '').toLowerCase().replace(/[_-]/g, '-');
        const isTextToSpeechType = genType === 'text-to-speech' || genType === 'tts';
        
        // Normalize model name for comparison
        const model = String(entry.model || '').toLowerCase().trim();
        const backendModel = String(entry.backendModel || entry.apiModel || entry.providerModel || '').toLowerCase().trim();
        
        // Check if this is a Chatterbox or Maya entry - CRITICAL: Always include these entries in TTS view
        const hasChatterboxModel = model.includes('chatterbox') || backendModel.includes('chatterbox');
        const hasMayaModel = model.includes('maya') || backendModel.includes('maya');
        
        // PRIORITY 1: If it's a Chatterbox or Maya model, ALWAYS include it in text-to-speech view
        // This ensures these entries show up regardless of their generationType
        if (hasChatterboxModel) {
          console.log('[MusicHistory] ✅ Including Chatterbox entry (always shown in TTS view):', {
            id: entry.id,
            model: entry.model,
            generationType: entry.generationType,
            hasAudios: !!entry.audios?.length,
            hasImages: !!entry.images?.length,
            hasAudio: !!entry.audio
          });
          return true;
        }
        if (hasMayaModel) {
          console.log('[MusicHistory] ✅ Including Maya entry (always shown in TTS view):', {
            id: entry.id,
            model: entry.model,
            generationType: entry.generationType,
            hasAudios: !!entry.audios?.length,
            hasImages: !!entry.images?.length,
            hasAudio: !!entry.audio
          });
          return true;
        }
        
        // PRIORITY 2: If generationType is text-to-speech, include it (for ElevenLabs and other TTS models)
        if (isTextToSpeechType) {
          console.log('[MusicHistory] ✅ Including entry by generationType:', {
            id: entry.id,
            model: entry.model,
            generationType: entry.generationType
          });
          return true;
        }
        
        // PRIORITY 3: Check if entry has audio data AND TTS-related model name
        // This catches entries that might have correct model but wrong/missing generationType
        const hasAudioData = entry.audios?.length > 0 || entry.images?.length > 0 || !!entry.audio;
        if (hasAudioData && (model.includes('eleven') || model.includes('tts') || model.includes('elevenlabs') || model.includes('maya'))) {
          console.log('[MusicHistory] ✅ Including TTS entry by audio data + model match:', {
            id: entry.id,
            model: entry.model,
            generationType: entry.generationType,
            hasAudios: !!entry.audios?.length,
            hasImages: !!entry.images?.length,
            hasAudio: !!entry.audio
          });
          return true;
        }
        
        // PRIORITY 4: Check model name (frontend model names)
        if (model === 'elevenlabs-tts' || 
            model === 'chatterbox-multilingual' ||
            model === 'chatterbox' ||
            model === 'elevenlabs' ||
            model === 'maya-tts' ||
            model === 'maya') {
          console.log('[MusicHistory] ✅ Including entry by exact model match:', entry.id);
          return true;
        }
        
        // PRIORITY 5: Check backend endpoint names
        if (model === 'fal-ai/chatterbox/text-to-speech/multilingual' ||
            model === 'fal-ai/elevenlabs/tts/eleven-v3' ||
            model === 'fal-ai/maya' ||
            model.includes('fal-ai/chatterbox') ||
            model.includes('fal-ai/elevenlabs') ||
            model.includes('fal-ai/maya')) {
          console.log('[MusicHistory] ✅ Including entry by backend endpoint match:', entry.id);
          return true;
        }
        
        // PRIORITY 6: Check for partial matches in model (most permissive)
        if (model.includes('eleven') || 
            model.includes('tts') ||
            model.includes('elevenlabs') ||
            model.includes('multilingual') ||
            model.includes('maya') ||
            model.includes('text-to-speech') ||
            model.includes('text_to_speech') ||
            model.includes('text-to-voice')) {
          console.log('[MusicHistory] ✅ Including entry by partial model match:', entry.id);
          return true;
        }
        
        // PRIORITY 7: Check backend model fields
        if (backendModel && (
            backendModel.includes('chatterbox') ||
            backendModel.includes('maya') ||
            backendModel.includes('eleven') || 
            backendModel.includes('tts') ||
            backendModel.includes('multilingual') ||
            backendModel.includes('text-to-speech') ||
            backendModel.includes('text-to-voice'))) {
          console.log('[MusicHistory] ✅ Including entry by backend model field:', entry.id);
          return true;
        }
        
        // Entry doesn't match any TTS criteria
        console.log('[MusicHistory] ❌ Excluding entry - no TTS match:', {
          id: entry.id,
          model: entry.model,
          generationType: entry.generationType,
          backendModel
        });
        return false;
      }
      
      if (normalizedAllowedTypes.length > 0) {
        const entryType = normalizeType(entry.generationType);
        if (normalizedAllowedTypes.includes(entryType)) {
          return true;
        }
        return false;
      }
      
      return true;
    });
    
    // Log filtered results for debugging
    if (isTtsFilter) {
      console.log('[MusicHistory] Filtered entries result:', {
        totalBefore: allEntries.length,
        totalAfter: filtered.length,
        entries: filtered.map((e: any) => ({
          id: e.id,
          model: e.model,
          generationType: e.generationType,
          hasAudios: !!e.audios?.length,
          hasImages: !!e.images?.length,
          hasAudio: !!e.audio,
          audiosCount: e.audios?.length || 0,
          imagesCount: e.images?.length || 0
        }))
      });
    }
    
    return filtered;
  });

  const storeHasMore = useAppSelector((s: any) => s.history?.hasMore || false);
  const storeLoading = useAppSelector((s: any) => s.history?.loading || false);

  // Group entries by date
  const groupedByDate = historyEntries.reduce((groups: { [key: string]: any[] }, entry: any) => {
    const date = new Date(entry.timestamp || entry.createdAt || entry.updatedAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const todayKey = new Date().toDateString();

  // Pagination
  useBottomScrollPagination({
    containerRef: undefined,
    hasMore: storeHasMore,
    loading: storeLoading,
    requireUserScroll: true,
    bottomOffset: 800,
    throttleMs: 200,
    loadMore: async () => {
      const nextPage = page + 1;
      setPage(nextPage);
      try {
        const isTts = normalizedGenerationTypes.some(t => t === 'text-to-speech' || t === 'tts') ||
          normalizedAllowedTypes.some(t => t === 'text-to-speech' || t === 'tts');
        const generationTypeFilter = generationTypeList.filter((type): type is string => Boolean(type));
        const genFilter: any = isTts
          ? { generationType: ['text-to-speech', 'text_to_speech', 'tts'] }
          : generationTypeFilter.length > 1
            ? { generationType: generationTypeFilter }
            : { generationType: generationTypeFilter[0] || generationType };
        await (dispatch as any)(loadMoreHistory({
          filters: genFilter,
          paginationParams: { limit: 10 }
        } as any)).unwrap();
      } catch {/* swallow */}
    }
  });

  return (
    <div className="no-scrollbar scrollbar-hide">
      <div className="pl-0 pr-6 pb-32">
        {/* Main Loader */}
        {storeLoading && historyEntries.length === 0 && (
          <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center gap-4">
              <WildMindLogoGenerating 
                running={true}
                size="lg"
                speedMs={1600}
                className="mx-auto"
              />
              <div className="text-white text-lg text-center">Loading your generation history...</div>
            </div>
          </div>
        )}

        {/* No History State */}
        {!storeLoading && historyEntries.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                <Music4 className="w-8 h-8 text-white/60" />
              </div>
              <div className="text-white text-lg">No generations yet</div>
              <div className="text-white/60 text-sm max-w-md">
                Create your first piece of AI-generated audio using the interface below
              </div>
            </div>
          </div>
        )}

        {/* If no row for today yet, render one with preview */}
        {localPreview && !groupedByDate[todayKey] && (
          <div className="space-y-4">
            {/* Date Header */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-white/60"
                >
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
              <h3 className="text-sm font-medium text-white/70">
                {new Date(todayKey).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h3>
            </div>

            {/* All Music Tracks for this Date - Horizontal Layout */}
            <div className="flex flex-wrap gap-3 ml-9">
              <MusicTileFromPreview preview={localPreview} />
            </div>
          </div>
        )}

        {/* History Entries - Grouped by Date */}
        {historyEntries.length > 0 && (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-white/60"
                    >
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-white/70">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h3>
                </div>

                {/* All Music Tracks for this Date - Horizontal Layout */}
                <div className="flex flex-wrap gap-3 ml-9">
                  {/* Prepend local preview to today's row */}
                  {date === todayKey && localPreview && <MusicTileFromPreview preview={localPreview} />}
                  {groupedByDate[date].map((entry: any) => {
                    // Extract media items - prioritize audios, then images, then single audio object
                    // This matches the logic from History.tsx
                    const mediaItems = [
                      ...((entry.audios || []) as any[]),
                      ...((entry.images || []) as any[]),
                      ...(entry.audio ? [entry.audio] : [])
                    ].filter(Boolean); // Remove any null/undefined items
                    
                    // If no media items found, skip this entry
                    if (mediaItems.length === 0) {
                      console.warn('[MusicHistory] Entry has no media items:', {
                        id: entry.id,
                        model: entry.model,
                        hasAudios: !!entry.audios?.length,
                        hasImages: !!entry.images?.length,
                        hasAudio: !!entry.audio
                      });
                      return null;
                    }
                    
                    return mediaItems.map((audio: any, audioIndex: number) => {
                      // Get audio URL from various possible fields (matching History.tsx pattern)
                      const audioUrl = audio.url || audio.firebaseUrl || audio.originalUrl;
                      const colorTheme = getColorTheme(entry, audioIndex);
                      
                      return (
                      <div
                        key={`${entry.id}-${audio.id || audioIndex}`}
                        onClick={() => onAudioSelect?.({ entry, audio })}
                        className={`relative w-48 h-48 rounded-2xl overflow-hidden bg-gradient-to-br ${colorTheme} ring-1 ring-white/10 hover:ring-white/30 transition-all duration-500 cursor-pointer group flex-shrink-0 shadow-[0_30px_45px_-25px_rgba(15,23,42,0.95)] hover:-translate-y-1 hover:scale-[1.02]`}
                      >
                        <div className="absolute inset-0 opacity-70 group-hover:opacity-90 transition-opacity duration-500">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_60%)]" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(0,0,0,0.25),_transparent_65%)]" />
                        </div>
                        {entry.status === "generating" ? (
                          <div className="w-full h-full flex items-center justify-center bg-black/90">
                            <div className="flex flex-col items-center gap-2">
                              <WildMindLogoGenerating 
                                running={entry.status === 'generating'}
                                size="md"
                                speedMs={1600}
                                className="mx-auto"
                              />
                              <div className="text-xs text-white/60 text-center">
                                Composing...
                              </div>
                            </div>
                          </div>
                        ) : entry.status === "failed" ? (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/30 to-red-800/30 ring-1 ring-red-500/20">
                            <div className="flex flex-col items-center gap-2">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="text-red-400"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                              <div className="text-xs text-red-400">Failed</div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                            <div className="absolute inset-x-6 inset-y-6 rounded-[28px] border border-white/30 shadow-inner shadow-black/40" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.35)_0%,_rgba(255,255,255,0)_55%)]" />
                            <div className="relative z-10 w-20 h-20 bg-white/30 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-[0_15px_35px_-15px_rgba(15,23,42,0.95)] ring-1 ring-white/60">
                              <div className="absolute inset-2 rounded-full bg-white/40 blur-xl opacity-70" />
                              <Music4 className="w-10 h-10 text-white drop-shadow-md relative z-10" />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
                          </div>
                        )}
                      </div>
                      );
                    }).filter(Boolean); // Filter out null entries
                  })}
                </div>
              </div>
            ))}

            {/* Scroll Loading Indicator */}
            {storeHasMore && storeLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <WildMindLogoGenerating 
                    running={storeLoading}
                    size="md"
                    speedMs={1600}
                    className="mx-auto"
                  />
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

// Helper component for music preview tile
const MusicTileFromPreview = ({ preview }: { preview: any }) => {
  const colorTheme = getColorTheme(preview, 0);
  
  return (
    <div className={`relative w-48 h-48 rounded-2xl overflow-hidden bg-gradient-to-br ${colorTheme} ring-1 ring-white/10 hover:ring-white/30 flex-shrink-0 shadow-[0_30px_45px_-25px_rgba(15,23,42,0.95)] transition-all duration-500 cursor-pointer group hover:-translate-y-1 hover:scale-[1.02]`}>
      <div className="absolute inset-0 opacity-70 group-hover:opacity-90 transition-opacity duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(0,0,0,0.25),_transparent_65%)]" />
      </div>
      {preview.status === 'generating' ? (
        <div className="w-full h-full flex items-center justify-center bg-black/90">
          <div className="flex flex-col items-center gap-2">
            <WildMindLogoGenerating 
              running={preview.status === 'generating'}
              size="md"
              speedMs={1600}
              className="mx-auto"
            />
            <div className="text-xs text-white/60 text-center">Composing...</div>
          </div>
        </div>
      ) : preview.status === 'failed' ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/30 to-red-800/30 ring-1 ring-red-500/20">
          <div className="flex flex-col items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <div className="text-xs text-red-400">Failed</div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
          <div className="absolute inset-x-6 inset-y-6 rounded-[28px] border border-white/30 shadow-inner shadow-black/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.35)_0%,_rgba(255,255,255,0)_55%)]" />
          <div className="relative z-10 w-20 h-20 bg-white/30 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-[0_15px_35px_-15px_rgba(15,23,42,0.95)] ring-1 ring-white/60">
            <div className="absolute inset-2 rounded-full bg-white/40 blur-xl opacity-70" />
            <Music4 className="w-10 h-10 text-white drop-shadow-md relative z-10" />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-md ring-1 ring-white/10">Audio</div>
    </div>
  );
};

export default MusicHistory;



