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
  showSuccessToast: true,
  showErrorToast: true, // Changed to true to show mini errors
};

export function useQueueManagement(options: QueueManagementOptions = {}) {
  const dispatch = useAppDispatch();
  const activeGenerations = useAppSelector(state => state.generation.activeGenerations);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const processedRef = useRef<Set<string>>(new Set());
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

      // Handle completed generations
      if (status === 'completed') {
        // Check if we've already processed this completion
        const processedKey = `${genId}-completed`;
        if (!processedRef.current.has(processedKey)) {
          processedRef.current.add(processedKey);
          
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
          console.log('[queue] Removing completed generation:', genId);
          dispatch(removeActiveGeneration(genId));
          timeoutRefs.current.delete(genId);
          processedRef.current.delete(processedKey);
        }, opts.successDisplayDuration);
        
        timeoutRefs.current.set(genId, timeout);
      } 
      // Handle failed generations
      else if (status === 'failed') {
        // Check if we've already processed this failure
        const processedKey = `${genId}-failed`;
        if (!processedRef.current.has(processedKey)) {
          processedRef.current.add(processedKey);
          
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
          console.log('[queue] Removing failed generation:', genId);
          dispatch(removeActiveGeneration(genId));
          timeoutRefs.current.delete(genId);
          processedRef.current.delete(processedKey);
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
          console.log('[queue] Removing cancelled generation:', genId);
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
