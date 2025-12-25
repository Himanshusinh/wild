/**
 * Generation Hydration Hook
 * Restores active generations from localStorage on app initialization
 */

'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { hydrateGenerations, clearOldGenerations } from '@/store/slices/generationSlice';
import { loadGenerations, cleanupCompletedGenerations } from '@/lib/generationPersistence';

export function useGenerationHydration() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Cleanup any completed/failed items from storage first
    cleanupCompletedGenerations();
    
    // Load persisted generations from localStorage
    const persistedGenerations = loadGenerations();

    if (persistedGenerations.length > 0) {
      console.log('[useGenerationHydration] Restoring', persistedGenerations.length, 'generations');
      
      // Check for interrupted generations (pending/generating) and mark them as failed
      // since page reload kills the client-side process
      const updatedGenerations = persistedGenerations.map(gen => {
        if (gen.status === 'pending' || gen.status === 'generating') {
          return {
            ...gen,
            status: 'failed' as const,
            error: 'Interrupted by page reload'
          };
        }
        return gen;
      });

      // Hydrate Redux state with updated status
      dispatch(hydrateGenerations(updatedGenerations));

      // Clean up old generations (completed > 1 hour ago)
      dispatch(clearOldGenerations());
    }
  }, [dispatch]);
}
