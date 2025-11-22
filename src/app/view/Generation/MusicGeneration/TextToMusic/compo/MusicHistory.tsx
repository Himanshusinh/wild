'use client';

import React, { useRef } from "react";
import { useAppSelector } from '@/store/hooks';
import { useBottomScrollPagination } from '@/hooks/useBottomScrollPagination';
import { loadMoreHistory } from '@/store/slices/historySlice';
import { useAppDispatch } from '@/store/hooks';
import { Music4 } from 'lucide-react';
import WildMindLogoGenerating from '@/app/components/WildMindLogoGenerating';
import CustomAudioPlayer from './CustomAudioPlayer';

interface MusicHistoryProps {
  generationType?: string;
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
  const historyEntries = useAppSelector((state: any) => {
    const allEntries = state.history.entries || [];
    
    // Debug: Log all entries when filtering for text-to-speech
    if (generationType === 'text-to-speech' || allowedTypes.includes('text-to-speech')) {
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
      
      // For text-to-speech, show entries with generationType match OR model match
      const isTextToSpeechFilter = generationType === 'text-to-speech' || 
                                   allowedTypes.includes('text-to-speech') ||
                                   allowedTypes.includes('text_to_speech') ||
                                   allowedTypes.includes('tts');
      
      if (isTextToSpeechFilter) {
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
      
      // For other types, use the allowedTypes check
      if (allowedTypes.includes(entry.generationType)) return true;
      
      return false;
    });
    
    // Log filtered results for debugging
    if (generationType === 'text-to-speech' || allowedTypes.includes('text-to-speech')) {
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
        const isTts = generationType === 'text-to-speech' || allowedTypes.includes('text-to-speech') || allowedTypes.includes('text_to_speech') || allowedTypes.includes('tts');
        const genFilter: any = isTts
          ? { generationType: ['text-to-speech', 'text_to_speech', 'tts'] }
          : { generationType };
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
                      
                      return (
                      <div
                        key={`${entry.id}-${audio.id || audioIndex}`}
                        onClick={() => onAudioSelect?.({ entry, audio })}
                        className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                      >
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
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
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
                          <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center relative">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <Music4 className="w-8 h-8 text-white/80" />
                            </div>
                            
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
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
const MusicTileFromPreview = ({ preview }: { preview: any }) => (
  <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 flex-shrink-0">
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
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
        <div className="flex flex-col items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <div className="text-xs text-red-400">Failed</div>
        </div>
      </div>
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center relative">
        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
          <Music4 className="w-8 h-8 text-white/80" />
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-1">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
    )}
    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Audio</div>
  </div>
);

export default MusicHistory;



