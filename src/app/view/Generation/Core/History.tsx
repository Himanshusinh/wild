'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import ImagePreviewModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/ImagePreviewModal';
import { HistoryEntry } from '@/types/history';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadHistory, setFilters } from '@/store/slices/historySlice';
import { setCurrentView } from '@/store/slices/uiSlice';

const History = () => {
  const dispatch = useAppDispatch();
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const loading = useAppSelector((state: any) => state.history?.loading || false);
  const error = useAppSelector((state: any) => state.history?.error);
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');
  const currentGenerationType = useAppSelector((state: any) => state.ui?.currentGenerationType || 'text-to-image');
  const [showAllHistory, setShowAllHistory] = useState(true);
  const [preview, setPreview] = useState<{ entry: HistoryEntry; image: any } | null>(null);

  console.log('=== HISTORY COMPONENT RENDER ===');
  console.log('Initial historyEntries:', historyEntries);
  console.log('Initial currentGenerationType:', currentGenerationType);
  console.log('Initial showAllHistory:', showAllHistory);

  // Load all history on mount to ensure we have data
  useEffect(() => {
    console.log('=== HISTORY COMPONENT MOUNT ===');
    console.log('Loading all history on mount...');
    dispatch(loadHistory({ filters: {}, limit: 50 }));
  }, [dispatch]); // Only run on mount

  useEffect(() => {
    console.log('=== HISTORY COMPONENT useEffect ===');
    console.log('showAllHistory:', showAllHistory);
    console.log('currentGenerationType:', currentGenerationType);
    console.log('historyEntries.length:', historyEntries.length);
    console.log('historyEntries types:', historyEntries.map((entry: HistoryEntry) => ({ id: entry.id, type: entry.generationType, model: entry.model })));
    
    // Only load history if it's not already loaded or if we're switching between views
    // This prevents conflicts with PageRouter which also loads history
    if (showAllHistory) {
      // For "Show All" - only load if we don't have any entries or if we have filtered entries
      const hasEntries = historyEntries.length > 0;
      const hasFilteredEntries = historyEntries.some((entry: HistoryEntry) => entry.generationType === currentGenerationType);
      
      console.log('Show All mode - hasEntries:', hasEntries, 'hasFilteredEntries:', hasFilteredEntries);
      
      if (!hasEntries || hasFilteredEntries) {
        console.log('Loading all history entries...');
        dispatch(loadHistory({ filters: {}, limit: 50 }));
      } else {
        console.log('Using existing all history entries:', historyEntries.length);
      }
    } else {
      // For "Show Current Type" - only load if we don't have entries for this type
      const hasCurrentTypeEntries = historyEntries.some((entry: HistoryEntry) => entry.generationType === currentGenerationType);
      
      console.log('Show Current Type mode - hasCurrentTypeEntries:', hasCurrentTypeEntries);
      
      if (!hasCurrentTypeEntries) {
        console.log('Loading filtered history for:', currentGenerationType);
        dispatch(loadHistory({ filters: { generationType: currentGenerationType }, limit: 30 }));
      } else {
        console.log('Using existing filtered history entries for:', currentGenerationType);
      }
    }
  }, [dispatch, currentGenerationType, showAllHistory, historyEntries.length]);

  const handleBackToGeneration = () => {
    dispatch(setCurrentView('generation'));
  };

  const toggleHistoryView = () => {
    setShowAllHistory(!showAllHistory);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getGenerationTypeLabel = (type: string) => {
    switch (type) {
      case 'text-to-image': return 'Text to Image';
      case 'logo-generation': return 'Logo Generation';
      case 'sticker-generation': return 'Sticker Generation';
      case 'text-to-video': return 'Text to Video';
      case 'text-to-music': return 'Text to Music';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToGeneration}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {showAllHistory ? 'All Generation History' : `${getGenerationTypeLabel(currentGenerationType)} History`}
            </h1>
            <p className="text-sm opacity-70">
              {showAllHistory ? 'All your generated content' : `Your ${getGenerationTypeLabel(currentGenerationType).toLowerCase()} generations`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-70">{historyEntries.length} generations</span>
          </div>
          <button 
            onClick={toggleHistoryView}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            {showAllHistory ? 'Show Current Type' : 'Show All'}
          </button>
        </div>
      </div>

      {/* History Entries */}
      <div className="space-y-8">
        {historyEntries.map((entry: HistoryEntry) => (
          <div key={entry.id} className="space-y-4">
            {/* Prompt Text in Left Corner */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex flex-row-reverse items-center gap-2">
                  <p className="text-white/90 text-sm leading-relaxed flex-1 max-w-[500px] break-words">
                    {entry.prompt.replace(/\[\s*Style:\s*[^\]]+\]/i, '').trim()}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(entry.prompt.replace(/\[\s*Style:\s*[^\]]+\]/i, '').trim());
                      // Add toast here if available
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white/80 flex-shrink-0 mt-0.5"
                    title="Copy prompt"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                  <span>{formatDate(new Date(entry.timestamp))}</span>
                  <span>{entry.model}</span>
                  <span>{entry.images.length} image{entry.images.length !== 1 ? 's' : ''}</span>
                  {entry.style && (
                    <span className="text-blue-400">Style: {entry.style}</span>
                  )}
                  {entry.status === 'generating' && (
                    <span className="text-yellow-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      Generating...
                    </span>
                  )}
                  {entry.status === 'failed' && (
                    <span className="text-red-400">Failed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Images Grid - Same Size as Text-to-Image History */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 ml-9">
              {entry.images.map((image: any) => (
                <div key={image.id} onClick={() => setPreview({ entry, image })} className="relative aspect-square rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group">
                  {entry.status === 'generating' ? (
                    // Loading frame
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                        <div className="text-xs text-white/60">Generating...</div>
                      </div>
                    </div>
                  ) : entry.status === 'failed' ? (
                    // Error frame
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                      <div className="flex flex-col items-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <div className="text-xs text-red-400">Failed</div>
                      </div>
                    </div>
                  ) : (
                    // Completed image
                    <Image
                      src={image.url}
                      alt={entry.prompt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, 16vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ImagePreviewModal preview={preview} onClose={() => setPreview(null)} />
    </div>
  );
};

export default History;