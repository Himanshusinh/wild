/**
 * Unified Queue Management Hook
 * Handles automatic cleanup of completed/failed/cancelled generations with proper timing
 * - Success: Show success message for 5 seconds, then remove
 * - Failed: Show mini error message, then remove after display
 * - Cancelled: Show cancellation message, then remove
 * Works for all generation types: image, video, music
 * Works for all providers: FAL, Replicate, Runway, BFL, MiniMax
 * 
 * CRITICAL: This is the ONLY place that shows success toasts to avoid duplicates.
 * All other toast.success calls for generation completion should be removed.
 */

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeActiveGeneration, updateActiveGeneration } from '@/store/slices/generationSlice';
import type { ActiveGeneration } from '@/lib/generationPersistence';
import toast from 'react-hot-toast';
import { getAdaptiveTimeoutMs, recordGenerationDuration } from '@/lib/generationStats';
import { qlog, qerr } from '@/lib/queueDebug';

interface QueueManagementOptions {
  /**
   * Delay in milliseconds before removing completed generations
   * Default: 5000 (5 seconds)
   */
  successDisplayDuration?: number;
  
  /**
   * Delay in milliseconds before removing failed generations
   * Default: 3000 (3 seconds) - enough time to read error message
   */
  errorDisplayDuration?: number;
  
  /**
   * Maximum duration (ms) a generation is allowed to stay in pending/generating before being marked failed
   * Default: 15 minutes (900000 ms)
   */
  maxGenerationDurationMs?: number;

  /**
   * Whether to show success toast notifications
   * Default: true (this is the ONLY place success toasts should appear)
   */
  showSuccessToast?: boolean;
  
  /**
   * Whether to show error toast notifications
   * Default: true (show mini error messages for failed generations)
   */
  showErrorToast?: boolean;
}

const DEFAULT_OPTIONS: Required<QueueManagementOptions> = {
  successDisplayDuration: 5000,
  errorDisplayDuration: 3000,
  maxGenerationDurationMs: 15 * 60 * 1000, // 15 minutes default
  showSuccessToast: true,
  showErrorToast: true, // Changed to true to show mini errors
};

export function useQueueManagement(options: QueueManagementOptions = {}) {
  const dispatch = useAppDispatch();
  const activeGenerations = useAppSelector(state => state.generation.activeGenerations);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const processedRef = useRef<Set<string>>(new Set());
  const lastUpdatedRef = useRef<Map<string, number>>(new Map());
  const noProgressRef = useRef<Map<string, number>>(new Map());
  const opts = { ...DEFAULT_OPTIONS, ...options };

  useEffect(() => {
    activeGenerations.forEach((gen: ActiveGeneration) => {
      const genId = gen.id;
      const status = gen.status;
      
        // Clear any existing timeout for this generation
      const existingTimeout = timeoutRefs.current.get(genId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        timeoutRefs.current.delete(genId);
      }

      // Watchdog: adaptive detection for stuck generations
      // Strategy:
      // 1) Track per-model historical durations (localStorage) and compute an adaptive timeout (90th percentile * 1.5 + buffer)
      // 2) Track "no-progress" counters by observing `updatedAt` and mark stuck after several consecutive cycles with no change
      // 3) Use adaptive timeout as a fallback guard
      if ((status === 'pending' || status === 'generating') && gen.startedAt) {
        try {
          const startedAtMs = typeof gen.startedAt === 'number' ? gen.startedAt : Date.parse(String(gen.startedAt)) || 0;
          const updatedAtMs = gen.updatedAt ? (typeof gen.updatedAt === 'number' ? gen.updatedAt : Date.parse(String(gen.updatedAt)) || 0) : startedAtMs;
          const ageMs = Date.now() - startedAtMs;

          // Track last observed updatedAt to detect no-progress
          const prevUpdated = lastUpdatedRef.current.get(genId) || 0;
          if (prevUpdated === updatedAtMs) {
            const cur = (noProgressRef.current.get(genId) || 0) + 1;
            noProgressRef.current.set(genId, cur);
          } else {
            noProgressRef.current.set(genId, 0);
            lastUpdatedRef.current.set(genId, updatedAtMs);
          }

          const noProgressCount = noProgressRef.current.get(genId) || 0;

          // Determine model key and adaptive timeout
          const modelKey = gen.params?.model || gen.params?.provider || gen.params?.generationType || 'unknown';
          const adaptiveTimeout = getAdaptiveTimeoutMs(modelKey);

          // Heuristics
          const NO_PROGRESS_THRESHOLD = 6; // number of cycles with no progress before marking stuck
          const NO_PROGRESS_MIN_AGE_MS = 60 * 1000; // require at least 60s elapsed before honoring no-progress

          const shouldMarkStuck = (noProgressCount >= NO_PROGRESS_THRESHOLD && ageMs > NO_PROGRESS_MIN_AGE_MS) || ageMs > adaptiveTimeout;

          if (shouldMarkStuck) {
            qlog('Marking generation stuck', { genId, modelKey, ageMs, adaptiveTimeout, noProgressCount });

            const stuckKey = `${genId}-stuck`;
            if (!processedRef.current.has(stuckKey)) {
              processedRef.current.add(stuckKey);

              const humanMsg = ageMs > adaptiveTimeout
                ? `Generation exceeded expected duration for this model (${Math.round(adaptiveTimeout / 1000)}s). It has been running for ${Math.round(ageMs / 1000)}s.`
                : `No progress observed for a while (${noProgressCount} checks). It has been running for ${Math.round(ageMs / 1000)}s.`;

              const errMsg = `${humanMsg} Please check the generation history or try again.`;

              // Mark as failed and attach error message
              dispatch(updateActiveGeneration({ id: genId, updates: { status: 'failed', error: errMsg } }));

              // Show an error toast (deduped by id)
              if (opts.showErrorToast) {
                toast.error(errMsg, { duration: opts.errorDisplayDuration, id: `stuck-${genId}` });
              }

              // Schedule removal (same behavior as failed generations)
              const timeout = setTimeout(() => {
                dispatch(removeActiveGeneration(genId));
                timeoutRefs.current.delete(genId);
                processedRef.current.delete(stuckKey);
                lastUpdatedRef.current.delete(genId);
                noProgressRef.current.delete(genId);
              }, opts.errorDisplayDuration);

              timeoutRefs.current.set(genId, timeout);
            }

            // Skip further processing for this generation this cycle
            return;
          }
        } catch (e) {
          qerr('Failed to evaluate stuck generation watchdog (adaptive):', e);
        }
      }

      // Handle completed generations
      if (status === 'completed') {
        // Check if we've already processed this completion
        const processedKey = `${genId}-completed`;
        if (!processedRef.current.has(processedKey)) {
          processedRef.current.add(processedKey);

          // Record duration for adaptive stats
          try {
            if (gen.startedAt) {
              const startedAtMs = typeof gen.startedAt === 'number' ? gen.startedAt : Date.parse(String(gen.startedAt)) || 0;
              const dur = Date.now() - startedAtMs;
              const modelKey = gen.params?.model || gen.params?.provider || gen.params?.generationType || 'unknown';
              recordGenerationDuration(modelKey, dur);
            }
          } catch (e) {
            qerr('record duration failed', e);
          }
          
          // Show success toast if enabled (THIS IS THE ONLY PLACE FOR SUCCESS TOASTS)
          if (opts.showSuccessToast) {
            const genType = gen.params?.generationType || '';
            let successMessage = 'Generation completed successfully!';
            
            if (genType.includes('video')) {
              const count = gen.videos?.length || 0;
              successMessage = `Generated ${count} video${count !== 1 ? 's' : ''} successfully!`;
            } else if (genType.includes('music') || genType.includes('speech') || genType.includes('audio')) {
              const count = gen.audios?.length || 0;
              successMessage = `Generated ${count} audio${count !== 1 ? 's' : ''} successfully!`;
            } else {
              const count = gen.images?.length || 0;
              successMessage = `Generated ${count} image${count !== 1 ? 's' : ''} successfully!`;
            }
            
            // Use unique ID to prevent duplicate toasts
            toast.success(successMessage, { 
              duration: 4000,
              id: `success-${genId}`,
            });
          }
        }

        // Schedule removal after success display duration
        const timeout = setTimeout(() => {
          qlog('Removing completed generation', { genId });
          dispatch(removeActiveGeneration(genId));
          timeoutRefs.current.delete(genId);
          processedRef.current.delete(processedKey);
          lastUpdatedRef.current.delete(genId);
          noProgressRef.current.delete(genId);
        }, opts.successDisplayDuration);
        
        timeoutRefs.current.set(genId, timeout);
      }
      // Handle failed generations
      else if (status === 'failed') {
        // Check if we've already processed this failure
        const processedKey = `${genId}-failed`;
        if (!processedRef.current.has(processedKey)) {
          processedRef.current.add(processedKey);

          // Record duration for adaptive stats (failed after running)
          try {
            if (gen.startedAt) {
              const startedAtMs = typeof gen.startedAt === 'number' ? gen.startedAt : Date.parse(String(gen.startedAt)) || 0;
              const dur = Date.now() - startedAtMs;
              const modelKey = gen.params?.model || gen.params?.provider || gen.params?.generationType || 'unknown';
              // Only record if it actually ran for at least 5 seconds to avoid noisy short failures
              if (dur > 5000) recordGenerationDuration(modelKey, dur);
            }
          } catch (e) {
            qerr('record duration on failure failed', e);
          }
          
          // Show mini error message
          if (opts.showErrorToast && gen.error) {
            // Truncate long error messages for display
            const errorMessage = gen.error.length > 100 
              ? gen.error.substring(0, 100) + '...' 
              : gen.error;
            toast.error(errorMessage, { 
              duration: opts.errorDisplayDuration,
              id: `error-${genId}`, // Prevent duplicate toasts
            });
          }
        }

        // Schedule removal after error display duration
        const timeout = setTimeout(() => {
          qlog('Removing failed generation', { genId });
          dispatch(removeActiveGeneration(genId));
          timeoutRefs.current.delete(genId);
          processedRef.current.delete(processedKey);
          lastUpdatedRef.current.delete(genId);
          noProgressRef.current.delete(genId);
        }, opts.errorDisplayDuration);
        
        timeoutRefs.current.set(genId, timeout);
      }
      // Handle cancelled generations
      else if (status === 'cancelled') {
        const processedKey = `${genId}-cancelled`;
        if (!processedRef.current.has(processedKey)) {
          processedRef.current.add(processedKey);
          
          // Show cancellation toast
          toast.error('Generation cancelled', { 
            duration: opts.errorDisplayDuration,
            id: `cancel-${genId}`,
          });
        }

        // Schedule removal after error display duration
        const timeout = setTimeout(() => {
          qlog('Removing cancelled generation', { genId });
          dispatch(removeActiveGeneration(genId));
          timeoutRefs.current.delete(genId);
          processedRef.current.delete(processedKey);
        }, opts.errorDisplayDuration);
        
        timeoutRefs.current.set(genId, timeout);
      }
    });

    // Cleanup: clear timeouts for generations that are no longer in the list
    timeoutRefs.current.forEach((timeout, id) => {
      if (!activeGenerations.find(g => g.id === id)) {
        clearTimeout(timeout);
        timeoutRefs.current.delete(id);
        // Clean up processed refs for removed generations
        processedRef.current.delete(`${id}-completed`);
        processedRef.current.delete(`${id}-failed`);
        processedRef.current.delete(`${id}-cancelled`);
      }
    });

    // Cleanup on unmount
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
      processedRef.current.clear();
    };
  }, [activeGenerations, dispatch, opts.successDisplayDuration, opts.errorDisplayDuration, opts.showSuccessToast, opts.showErrorToast]);
}

/**
 * Helper function to update generation status and trigger queue management
 * This ensures status changes are properly tracked
 */
export function updateGenerationStatus(
  dispatch: ReturnType<typeof useAppDispatch>,
  generationId: string,
  updates: Partial<ActiveGeneration>
) {
  dispatch(updateActiveGeneration({
    id: generationId,
    updates: {
      ...updates,
      updatedAt: Date.now(),
    }
  }));
}
