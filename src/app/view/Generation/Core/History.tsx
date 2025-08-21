'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
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
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    // Load history when component mounts
    if (showAllHistory) {
      dispatch(loadHistory({ filters: {} }));
    } else {
      dispatch(loadHistory({ filters: { generationType: currentGenerationType } }));
    }
  }, [dispatch, currentGenerationType, showAllHistory]);

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
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* History Entries */}
      <div className="space-y-8">
        {historyEntries.length === 0 ? (
          <div className="text-center text-white/60 py-12">
            <p>No generation history yet.</p>
            <p className="text-sm mt-2">
              {showAllHistory 
                ? 'Your generated content will appear here.' 
                : `Your ${getGenerationTypeLabel(currentGenerationType).toLowerCase()} generations will appear here.`
              }
            </p>
          </div>
        ) : (
          historyEntries.map((entry: HistoryEntry) => (
            <div key={entry.id} className="space-y-4">
              {/* Prompt and Metadata */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white/90 text-sm leading-relaxed">{entry.prompt}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                    <span>{formatDate(entry.timestamp)}</span>
                    <span>{entry.model}</span>
                    {showAllHistory && (
                      <span className="text-blue-400">{getGenerationTypeLabel(entry.generationType)}</span>
                    )}
                    <span>{entry.images.length} image{entry.images.length !== 1 ? 's' : ''}</span>
                    {entry.status === 'generating' && (
                      <span className="text-yellow-400">Generating...</span>
                    )}
                    {entry.status === 'failed' && (
                      <span className="text-red-400">Failed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Images Grid - Smaller Size */}
              {entry.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 ml-9">
                  {entry.images.map((image: any, index: number) => (
                    <div
                      key={image.id || index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                    >
                      <Image
                        src={image.url}
                        alt={`Generated image ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, 16vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {entry.status === 'failed' && entry.error && (
                <div className="ml-9 text-red-400 text-sm bg-red-400/10 rounded-lg p-3">
                  {entry.error}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;