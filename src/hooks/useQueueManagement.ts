/**
 * Unified Queue Management Hook
 * Handles automatic cleanup of completed/failed generations with proper timing
 * - Success: Show success message for 5 seconds, then remove
 * - Failed: Show error/warning message, then remove after display
 * Works for all generation types: image, video, music
 * Works for all providers: FAL, Replicate, Runway, BFL, MiniMax
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
   * Default: true
   */
  showSuccessToast?: boolean;
  
  /**
   * Whether to show error toast notifications (errors are already shown by error handlers)
   * Default: false (errors are handled by specific error handlers)
   */
  showErrorToast?: boolean;
}

const DEFAULT_OPTIONS: Required<QueueManagementOptions> = {
  successDisplayDuration: 5000,
  errorDisplayDuration: 3000,
  showSuccessToast: true,
  showErrorToast: false,
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
          
          // Show success toast if enabled
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
            
            toast.success(successMessage, { duration: 4000 });
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
          
          // Error toast is already shown by specific error handlers (handleFalError, handleReplicateError, etc.)
          // So we don't show it again here unless explicitly enabled
          if (opts.showErrorToast && gen.error) {
            toast.error(gen.error, { duration: opts.errorDisplayDuration });
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
    });

    // Cleanup: clear timeouts for generations that are no longer in the list
    timeoutRefs.current.forEach((timeout, id) => {
      if (!activeGenerations.find(g => g.id === id)) {
        clearTimeout(timeout);
        timeoutRefs.current.delete(id);
        // Clean up processed refs for removed generations
        processedRef.current.delete(`${id}-completed`);
        processedRef.current.delete(`${id}-failed`);
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
