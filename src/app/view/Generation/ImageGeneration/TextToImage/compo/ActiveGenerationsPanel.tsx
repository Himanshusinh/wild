/**
 * Active Generations Panel Component
 * Displays parallel generations (images, videos, audio) with progress indicators
 * Works across all generation types: text-to-image, text-to-video, text-to-music, etc.
 * 
 * Responsive Design:
 * - Mobile: Shows compact count badge
 * - Tablet/Desktop: Shows full panel with minimize toggle
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { removeActiveGeneration } from '@/store/slices/generationSlice';
import { useQueueManagement } from '@/hooks/useQueueManagement';
import { X, Loader2, CheckCircle, XCircle, Image as ImageIcon, Video, Music, ChevronDown, ChevronUp } from 'lucide-react';
import type { ActiveGeneration } from '@/lib/generationPersistence';

export default function ActiveGenerationsPanel() {
  const dispatch = useAppDispatch();
  const activeGenerations = useAppSelector(state => state.generation.activeGenerations);
  const [isMinimized, setIsMinimized] = useState(false);

  // Use unified queue management hook
  useQueueManagement({
    successDisplayDuration: 5000,
    errorDisplayDuration: 3000,
    showSuccessToast: true,
    showErrorToast: false,
  });

  // Calculate counts and state BEFORE early return
  const runningCount = activeGenerations.filter(g => g.status === 'pending' || g.status === 'generating').length;
  const completedCount = activeGenerations.filter(g => g.status === 'completed').length;
  const failedCount = activeGenerations.filter(g => g.status === 'failed').length;
  const allCompleted = runningCount === 0 && activeGenerations.length > 0;

  const handleClearDone = useCallback(() => {
    activeGenerations.forEach(g => {
      if (g.status === 'completed' || g.status === 'failed') {
        dispatch(removeActiveGeneration(g.id));
      }
    });
  }, [activeGenerations, dispatch]);

  // Auto-hide mobile badge after 3 seconds when all completed
  useEffect(() => {
    if (allCompleted) {
      const timer = setTimeout(() => {
        handleClearDone();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allCompleted, handleClearDone]);

  // Don't render if no active generations (AFTER all hooks)
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
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getGenerationTypeIcon = (gen: ActiveGeneration) => {
    const genType = gen.params?.generationType || '';
    if (genType.includes('video')) {
      return <Video className="w-3.5 h-3.5" />;
    } else if (genType.includes('music') || genType.includes('speech') || genType.includes('audio')) {
      return <Music className="w-3.5 h-3.5" />;
    }
    return <ImageIcon className="w-3.5 h-3.5" />;
  };

  const getStatusText = (gen: ActiveGeneration) => {
    switch (gen.status) {
      case 'pending':
        return 'Queued';
      case 'generating':
        return gen.progress ? `${Math.round(gen.progress * 100)}%` : 'Generating';
      case 'completed':
        return 'Done';
      case 'failed':
        return 'Failed';
    }
  };


  // Determine mobile badge state
  const getMobileBadgeContent = () => {
    if (allCompleted) {
      // All generations completed successfully
      if (failedCount === 0) {
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-400" />,
          text: 'Done',
          bgColor: 'bg-green-500/20',
          ringColor: 'ring-green-500/30'
        };
      } else {
        // Some failed
        return {
          icon: <XCircle className="w-4 h-4 text-red-400" />,
          text: `${failedCount} failed`,
          bgColor: 'bg-red-500/20',
          ringColor: 'ring-red-500/30'
        };
      }
    } else {
      // Still generating
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin text-blue-400" />,
        text: `${runningCount}/${activeGenerations.length}`,
        bgColor: 'bg-black/40',
        ringColor: 'ring-white/10'
      };
    }
  };

  const mobileBadge = getMobileBadgeContent();

  return (
    <>
      {/* Mobile: Compact Badge with Status */}
      <div className="md:hidden fixed top-20 right-4 z-50">
        <div className={`${mobileBadge.bgColor} backdrop-blur-xl rounded-full px-4 py-2 ring-1 ${mobileBadge.ringColor} shadow-lg transition-all duration-300`}>
          <div className="flex items-center gap-2">
            {mobileBadge.icon}
            <span className="text-white font-semibold text-sm">
              {mobileBadge.text}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet: Full Panel with Minimize */}
      <div className="hidden md:block fixed top-20 right-4 z-50 w-80">
        <div className="bg-black/40 backdrop-blur-xl rounded-lg ring-1 ring-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white">
                  Queue
                </h3>
                <span className="text-xs text-white/60">
                  {runningCount}/{activeGenerations.length} active
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeGenerations.some(g => g.status === 'completed' || g.status === 'failed') && (
                  <button
                    onClick={handleClearDone}
                    className="text-xs text-white/60 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  aria-label={isMinimized ? "Expand queue" : "Minimize queue"}
                >
                  {isMinimized ? (
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-white/60" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Generation Cards (Collapsible) */}
          {!isMinimized && (
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/10">
              {activeGenerations.map((gen) => (
                <div key={gen.id} className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(gen.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Model & Status */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
                          {gen.model}
                        </span>
                        <span className={`text-xs font-medium ${
                          gen.status === 'completed' ? 'text-green-400' :
                          gen.status === 'failed' ? 'text-red-400' :
                          'text-blue-400'
                        }`}>
                          {getStatusText(gen)}
                        </span>
                      </div>

                      {/* Prompt Preview */}
                      <p className="text-sm text-white/90 line-clamp-2 mb-2">
                        {gen.prompt}
                      </p>

                      {/* Progress Bar */}
                      {gen.status === 'generating' && typeof gen.progress === 'number' && (
                        <div className="w-full bg-white/10 rounded-full h-1 mb-2">
                          <div
                            className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${Math.round(gen.progress * 100)}%` }}
                          />
                        </div>
                      )}

                      {/* Media Info */}
                      <div className="flex items-center gap-3 text-xs text-white/50">
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
                        <p className="text-xs text-red-400 mt-2 line-clamp-2">
                          {gen.error}
                        </p>
                      )}
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={() => handleDismiss(gen.id)}
                      className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                      aria-label="Remove from queue"
                    >
                      <X className="w-4 h-4 text-white/40 hover:text-white/80" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
