'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { HistoryEntry } from '@/types/history';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadHistory } from '@/store/slices/historySlice';

interface HistoryProps {
  onBack?: () => void;
}

const History = ({ onBack }: HistoryProps) => {
  const dispatch = useAppDispatch();
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const loading = useAppSelector((state: any) => state.history?.loading || false);
  const error = useAppSelector((state: any) => state.history?.error);

  useEffect(() => {
    // Load history when component mounts
    dispatch(loadHistory({}));
  }, [dispatch]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {onBack && (
            <button
              onClick={onBack}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
          )}
          <h1 className="text-2xl font-semibold">History</h1>
        </div>
      </div>

      {/* History Entries */}
      <div className="space-y-8">
        {historyEntries.length === 0 ? (
          <div className="text-center text-white/60 py-12">
            <p>No generation history yet.</p>
            <p className="text-sm mt-2">Your generated images will appear here.</p>
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