'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import QueueItem from './QueueItem';
import QueueBadge from './QueueBadge';
import { clearCompletedItems, pauseQueue, resumeQueue } from '@/services/generationQueue';
import { getQueueEnabled, setQueueEnabled } from '@/services/generationWrapper';

export default function QueuePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [queueEnabled, setQueueEnabledState] = useState(getQueueEnabled());
  const queueItems = useAppSelector((state) => state.queue.items);
  const isProcessing = useAppSelector((state) => state.queue.isProcessing);
  const isPaused = useAppSelector((state) => state.queue.isPaused);
  const currentItemId = useAppSelector((state) => state.queue.currentItemId);
  
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync queue enabled state
  useEffect(() => {
    setQueueEnabledState(getQueueEnabled());
  }, []);

  // Filter items to show
  const activeItems = queueItems.filter(item => 
    item.status === 'queued' || item.status === 'processing'
  );
  const completedItems = queueItems.filter(item => item.status === 'completed');
  const failedItems = queueItems.filter(item => item.status === 'failed');
  
  const totalItems = activeItems.length + completedItems.length + failedItems.length;
  const hasItems = totalItems > 0;

  // Auto-open when new item is added
  useEffect(() => {
    if (activeItems.length > 0 && !isOpen) {
      setIsOpen(true);
    }
  }, [activeItems.length, isOpen]);

  // Close click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Don't close if clicking on the badge button
        const target = event.target as HTMLElement;
        if (!target.closest('[data-queue-badge]')) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleClearCompleted = () => {
    clearCompletedItems();
  };

  const handleTogglePause = () => {
    if (isPaused) {
      resumeQueue();
    } else {
      pauseQueue();
    }
  };

  // Only show queue panel if queue is enabled OR if there are items (to allow viewing/managing existing queue)
  if (!queueEnabled && !hasItems && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Queue Badge Button */}
      <button
        data-queue-badge
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed top-4 right-4 z-[60]
          flex items-center justify-center
          w-12 h-12
          rounded-full
          bg-gradient-to-br from-blue-600/90 to-purple-600/90
          backdrop-blur-xl
          border border-white/20
          shadow-2xl
          transition-all duration-300
          hover:scale-110 hover:shadow-blue-500/50
          ${isOpen ? 'scale-95 opacity-50' : 'scale-100'}
          group
        `}
        aria-label="Generation Queue"
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl animate-pulse" />
        
        {/* Icon */}
        <div className="relative z-10">
          {hasItems ? (
            <QueueBadge />
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </div>

        {/* Pulse ring */}
        {isProcessing && (
          <div className="absolute inset-0 rounded-full border-2 border-blue-400/50 animate-ping" />
        )}
      </button>

      {/* Queue Panel */}
      <div
        ref={panelRef}
        className={`
          fixed top-4 right-4 z-[60]
          w-[calc(100vw-2rem)] max-w-[420px]
          max-h-[calc(100vh-8rem)]
          bg-[#0B0B0B]/95
          backdrop-blur-2xl
          border border-white/10
          rounded-2xl
          shadow-2xl
          flex flex-col
          transition-all duration-300 ease-out
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-[-10px] pointer-events-none'}
          ${isMinimized ? 'h-auto' : ''}
        `}
      >
        {/* Animated background effects */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {/* Gradient orbs */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(96, 165, 250, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 165, 250, 0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-2 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm md:text-base">
                Generation Queue
              </h3>
              <p className="text-white/60 text-xs">
                {activeItems.length} active • {totalItems} total
                {!queueEnabled && (
                  <span className="ml-2 text-yellow-400/70 text-[10px]">(Queue Disabled)</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Queue Enable/Disable Toggle */}
            <button
              onClick={() => {
                const newState = !queueEnabled;
                setQueueEnabled(newState);
                setQueueEnabledState(newState);
                if (!newState && isProcessing) {
                  pauseQueue();
                }
              }}
              className={`p-1.5 rounded-lg border transition-all ${
                queueEnabled
                  ? 'bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              title={queueEnabled ? 'Disable Queue' : 'Enable Queue'}
            >
              <svg 
                className={`w-4 h-4 transition-colors ${
                  queueEnabled ? 'text-blue-400' : 'text-white/40'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Pause/Resume button */}
            {activeItems.length > 0 && queueEnabled && (
              <button
                onClick={handleTogglePause}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? (
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
            )}

            {/* Minimize button */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>

            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              title="Close"
            >
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {/* Active items */}
            {activeItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Active ({activeItems.length})
                </h4>
                {activeItems.map((item) => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    isProcessing={item.id === currentItemId}
                  />
                ))}
              </div>
            )}

            {/* Failed items */}
            {failedItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-red-400/60 uppercase tracking-wider mb-2">
                  Failed ({failedItems.length})
                </h4>
                {failedItems.map((item) => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    isProcessing={false}
                  />
                ))}
              </div>
            )}

            {/* Completed items (collapsible) */}
            {completedItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-green-400/60 uppercase tracking-wider">
                    Completed ({completedItems.length})
                  </h4>
                  <button
                    onClick={handleClearCompleted}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {completedItems.slice(0, 3).map((item) => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    isProcessing={false}
                  />
                ))}
                {completedItems.length > 3 && (
                  <p className="text-xs text-white/40 text-center py-2">
                    +{completedItems.length - 3} more completed
                  </p>
                )}
              </div>
            )}

            {/* Empty state */}
            {totalItems === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="text-white/60 text-sm">Queue is empty</p>
                <p className="text-white/40 text-xs mt-1">Your generations will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Footer with stats */}
        {!isMinimized && activeItems.length > 0 && (
          <div className="relative z-10 border-t border-white/10 p-3 bg-gradient-to-r from-blue-600/5 to-purple-600/5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-blue-400 animate-pulse' : 'bg-white/30'}`} />
                  <span className="text-white/60">
                    {isProcessing ? 'Processing...' : isPaused ? 'Paused' : 'Idle'}
                  </span>
                </div>
              </div>
              <div className="text-white/40">
                {activeItems.length} in queue
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
}

