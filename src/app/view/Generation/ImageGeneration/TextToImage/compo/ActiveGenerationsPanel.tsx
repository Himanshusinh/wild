/**
 * Active Generations Panel Component
 * Displays parallel generations (images, videos, audio) with progress indicators
 * Works across all generation types: text-to-image, text-to-video, text-to-music, etc.
 */

'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { removeActiveGeneration } from '@/store/slices/generationSlice';
import { useQueueManagement } from '@/hooks/useQueueManagement';
import { X, Loader2, CheckCircle, XCircle, Image as ImageIcon, Video, Music } from 'lucide-react';
import type { ActiveGeneration } from '@/lib/generationPersistence';

export default function ActiveGenerationsPanel() {
  const dispatch = useAppDispatch();
  const activeGenerations = useAppSelector(state => state.generation.activeGenerations);

  // Use unified queue management hook
  // - Success: Show success message for 5 seconds, then remove
  // - Failed: Show error message for 3 seconds, then remove
  useQueueManagement({
    successDisplayDuration: 5000,
    errorDisplayDuration: 3000,
    showSuccessToast: true,
    showErrorToast: false, // Errors are already shown by specific error handlers
  });

  // Don't render if no active generations
  if (activeGenerations.length === 0) {
    return null;
  }

  const handleDismiss = (id: string) => {
    dispatch(removeActiveGeneration(id));
  };

  const getStatusIcon = (status: ActiveGeneration['status']) => {
    switch (status) {
      case 'pending':
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getGenerationTypeIcon = (gen: ActiveGeneration) => {
    const genType = gen.params?.generationType || '';
    if (genType.includes('video')) {
      return <Video className="w-3 h-3" />;
    } else if (genType.includes('music') || genType.includes('speech') || genType.includes('audio')) {
      return <Music className="w-3 h-3" />;
    }
    return <ImageIcon className="w-3 h-3" />;
  };

  const getStatusText = (gen: ActiveGeneration) => {
    switch (gen.status) {
      case 'pending':
        return 'Queued...';
      case 'generating':
        return gen.progress ? `${Math.round(gen.progress * 100)}%` : 'Generating...';
      case 'completed':
        const genType = gen.params?.generationType || '';
        if (genType.includes('video')) {
          return `${gen.videos?.length || 0} video${gen.videos?.length !== 1 ? 's' : ''}`;
        } else if (genType.includes('music') || genType.includes('speech') || genType.includes('audio')) {
          return `${gen.audios?.length || 0} audio${gen.audios?.length !== 1 ? 's' : ''}`;
        }
        return `${gen.images?.length || 0} image${gen.images?.length !== 1 ? 's' : ''}`;
      case 'failed':
        return gen.error || 'Failed';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 w-80 max-h-[70vh] overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Generating ({activeGenerations.length}/4)
            </h3>
            {activeGenerations.some(g => g.status === 'completed' || g.status === 'failed') && (
              <button
                onClick={() => {
                  activeGenerations.forEach(g => {
                    if (g.status === 'completed' || g.status === 'failed') {
                      dispatch(removeActiveGeneration(g.id));
                    }
                  });
                }}
                className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Clear Done
              </button>
            )}
          </div>
        </div>

        {/* Generation Cards */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {activeGenerations.map((gen) => (
            <div key={gen.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(gen.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Model & Status */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      {gen.model}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getStatusText(gen)}
                    </span>
                  </div>

                  {/* Prompt Preview */}
                  <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
                    {gen.prompt}
                  </p>

                  {/* Progress Bar (for generating status) */}
                  {gen.status === 'generating' && typeof gen.progress === 'number' && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.round(gen.progress * 100)}%` }}
                      />
                    </div>
                  )}

                  {/* Media Count & Parameters */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      {getGenerationTypeIcon(gen)}
                      {gen.params.imageCount || gen.videos?.length || gen.audios?.length || 1}
                    </span>
                    {gen.params.frameSize && (
                      <span>{gen.params.frameSize}</span>
                    )}
                    {gen.params.aspectRatio && (
                      <span>{gen.params.aspectRatio}</span>
                    )}
                    {gen.params.duration && (
                      <span>{gen.params.duration}s</span>
                    )}
                  </div>

                  {/* Error Message */}
                  {gen.status === 'failed' && gen.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      {gen.error}
                    </p>
                  )}
                </div>

                {/* Dismiss Button (always visible to allow clearing stuck items) */}
                <button
                  onClick={() => handleDismiss(gen.id)}
                  className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Dismiss"
                  title="Remove from queue"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
