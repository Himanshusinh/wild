'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { setQueueEnabled } from '@/store/slices/uiSlice';
import { useAppDispatch } from '@/store/hooks';
import toast from 'react-hot-toast';
import QueueItem from './QueueItem';

/**
 * Minimal Queue Toggle Button with Expandable Panel
 * Shows queue status and detailed list when expanded
 */
export default function QueueToggle() {
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isEnabled = useAppSelector((state) => state.ui.isQueueEnabled);
  const queueItems = useAppSelector((state) => state.queue.items);
  const isProcessing = useAppSelector((state) => state.queue.isProcessing);
  const currentItemId = useAppSelector((state) => state.queue.currentItemId);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Calculate derived values (after hooks, before early return)
  const queuedItems = queueItems.filter(item => item.status === 'queued');
  const processingItems = queueItems.filter(item => item.status === 'processing');
  const queuedCount = queuedItems.length;
  const processingCount = processingItems.length;
  const activeItemsCount = queuedCount + processingCount;

  // Fix hydration: only render after mount and sync localStorage with Redux
  useEffect(() => {
    setMounted(true);
    // Read initial state from localStorage and sync with Redux
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('queue_enabled');
      if (stored !== null) {
        const enabled = stored === 'true';
        dispatch(setQueueEnabled(enabled));
      } else {
        // If not set, default to true and save it
        dispatch(setQueueEnabled(true));
        localStorage.setItem('queue_enabled', 'true');
      }
    }
  }, [dispatch]);

  // Close panel when clicking outside
  useEffect(() => {
    if (!mounted) return; // Early return inside effect is fine
    
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded, mounted]);

  // Auto-expand when processing starts
  useEffect(() => {
    if (!mounted) return; // Early return inside effect is fine
    
    if (isProcessing && processingCount > 0) {
      setIsExpanded(true);
    }
  }, [isProcessing, processingCount, mounted]);

  // Don't render on server to avoid hydration mismatch
  // This early return is AFTER all hooks, which is correct
  if (!mounted) {
    return null;
  }

  // Disable toggle when processing (user can't disable queue while items are processing)
  const canToggle = !isProcessing && processingCount === 0;

  const handleToggleEnabled = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canToggle) {
      toast.error('Cannot toggle queue while generations are processing');
      return;
    }
    const newState = !isEnabled;
    dispatch(setQueueEnabled(newState));
    if (typeof window !== 'undefined') {
      localStorage.setItem('queue_enabled', String(newState));
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Get current processing item info
  const currentProcessingItem = processingItems[0];
  const currentProcessingPrompt = currentProcessingItem?.metadata?.prompt 
    ? (currentProcessingItem.metadata.prompt.length > 40 
        ? currentProcessingItem.metadata.prompt.substring(0, 37) + '...' 
        : currentProcessingItem.metadata.prompt)
    : 'Generation';

  // Build tooltip text
  const tooltipText = isProcessing && currentProcessingItem
    ? `Processing: ${currentProcessingPrompt} (${queuedCount} queued)`
    : processingCount > 0
    ? `Processing ${processingCount} generation(s)${queuedCount > 0 ? `, ${queuedCount} queued` : ''}`
    : queuedCount > 0
    ? `${queuedCount} generation(s) in queue`
    : isEnabled 
    ? 'Queue Enabled - Click to view' 
    : 'Queue Disabled - Click to enable';

  return (
    <div ref={panelRef} className="fixed top-4 right-4 z-50">
      {/* Main Toggle Button */}
      <button
        onClick={handleToggleExpand}
        className={`
          flex items-center justify-center gap-2
          px-3 py-2
          rounded-xl
          backdrop-blur-xl
          border transition-all duration-300
          shadow-lg
          group overflow-hidden
          ${activeItemsCount > 0 ? 'hover:shadow-xl hover:scale-105' : ''}
          ${isEnabled 
            ? 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 border-blue-500/30' + (activeItemsCount > 0 ? ' hover:from-blue-500 hover:to-purple-500' : '') 
            : 'bg-white/5 border-white/10' + (activeItemsCount > 0 ? ' hover:bg-white/10' : '')
          }
        `}
        aria-label={tooltipText}
        title={tooltipText}
      >
      {/* Animated background gradient when enabled */}
      {isEnabled && (
        <>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30 blur-xl animate-pulse" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </>
      )}
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      {/* Icon */}
      <div className="relative z-10">
        <svg 
          className={`w-4 h-4 transition-all duration-300 ${isEnabled ? 'text-white group-hover:rotate-180' : 'text-white/40'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
      </div>

      {/* Status indicator */}
      <div className="relative z-10 flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full transition-all ${isEnabled ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-white/30'}`} />
        <span className={`text-xs font-medium transition-colors ${isEnabled ? 'text-white' : 'text-white/50'}`}>
          {isEnabled ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* Queue status badge - shows queued vs processing */}
      {activeItemsCount > 0 && (
        <div className="relative z-10 flex items-center gap-1.5">
          {/* Queued count */}
          {queuedCount > 0 && (
            <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm">
              <span className="text-xs font-bold text-white drop-shadow-sm">
                {queuedCount > 9 ? '9+' : queuedCount}
              </span>
            </div>
          )}
          {/* Processing indicator */}
          {processingCount > 0 && (
            <div className="relative flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500/30 border border-blue-400/50 backdrop-blur-sm">
              <span className="text-xs font-bold text-white drop-shadow-sm">
                {processingCount > 9 ? '9+' : processingCount}
              </span>
              <div className="absolute inset-0 rounded-full border border-blue-400/50 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-pulse" />
            </div>
          )}
        </div>
      )}

      {/* Pulse ring when processing */}
      {isProcessing && isEnabled && (
        <div className="absolute inset-0 rounded-xl border-2 border-blue-400/50 animate-ping" style={{ animationDuration: '1.5s' }} />
      )}
    </button>

    {/* Expandable Queue Panel */}
    {isExpanded && activeItemsCount > 0 && (
      <div className="absolute top-full right-0 mt-2 w-[380px] max-h-[600px] overflow-hidden rounded-xl bg-[#0B0B0B]/95 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Generation Queue</h3>
              <p className="text-white/60 text-xs">
                {processingCount > 0 ? `Processing ${processingCount}` : ''}
                {processingCount > 0 && queuedCount > 0 ? ' • ' : ''}
                {queuedCount > 0 ? `${queuedCount} queued` : ''}
                {activeItemsCount === 0 ? 'Empty' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/70"
            aria-label="Close queue"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[500px]">
          {/* Processing Item - Show first with loading */}
          {processingItems.map((item) => (
            <QueueItem
              key={item.id}
              item={item}
              isProcessing={item.id === currentItemId}
            />
          ))}

          {/* Queued Items */}
          {queuedItems.map((item) => (
            <QueueItem
              key={item.id}
              item={item}
              isProcessing={false}
            />
          ))}

          {/* Completed Items (recently completed, show images) */}
          {queueItems
            .filter(item => item.status === 'completed' && item.completedAt && item.result)
            .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
            .slice(0, 3)
            .map((item) => (
              <QueueItem
                key={item.id}
                item={item}
                isProcessing={false}
              />
            ))}

          {/* Empty State */}
          {activeItemsCount === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-white/60 text-sm">Queue is empty</p>
              <p className="text-white/40 text-xs mt-1">Your generations will appear here</p>
            </div>
          )}
        </div>

        {/* Footer with Enable/Disable Toggle */}
        <div className="border-t border-white/10 p-3 bg-gradient-to-r from-blue-600/5 to-purple-600/5">
          <button
            onClick={handleToggleEnabled}
            disabled={!canToggle}
            className={`
              w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all
              ${isEnabled 
                ? 'bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'
              }
              ${!canToggle ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className="text-sm text-white/80">Queue {isEnabled ? 'Enabled' : 'Disabled'}</span>
            <div className={`w-10 h-5 rounded-full transition-colors ${isEnabled ? 'bg-blue-500' : 'bg-white/20'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${isEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>
      </div>
    )}
    </div>
  );
}

