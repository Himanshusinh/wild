import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addGenerationToQueue, restoreQueueOnLoad } from '@/services/generationQueue';
import { useEffect } from 'react';

/**
 * Hook for managing generation queue
 */
export function useGenerationQueue() {
  const dispatch = useAppDispatch();
  const queueItems = useAppSelector((state) => state.queue.items);
  const isProcessing = useAppSelector((state) => state.queue.isProcessing);

  // Restore queue on mount
  useEffect(() => {
    restoreQueueOnLoad();
  }, []);

  /**
   * Add a generation to the queue
   * Backend automatically calculates credit cost
   */
  const addToQueue = useCallback(async (
    generationType: string,
    provider: string,
    payload: any,
    metadata?: Record<string, any>
  ): Promise<string> => {
    return await addGenerationToQueue(generationType, provider, payload, metadata);
  }, []);

  /**
   * Get queue statistics
   */
  const getQueueStats = useCallback(() => {
    const queued = queueItems.filter(item => item.status === 'queued').length;
    const processing = queueItems.filter(item => item.status === 'processing').length;
    const completed = queueItems.filter(item => item.status === 'completed').length;
    const failed = queueItems.filter(item => item.status === 'failed').length;

    return {
      total: queueItems.length,
      queued,
      processing,
      completed,
      failed,
      isProcessing,
    };
  }, [queueItems, isProcessing]);

  return {
    addToQueue,
    getQueueStats,
    queueItems,
    isProcessing,
  };
}

