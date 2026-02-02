/**
 * Generation Hydration Hook
 * Restores active generations from localStorage on app initialization
 */

'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { hydrateGenerations, clearOldGenerations } from '@/store/slices/generationSlice';
import { loadGenerations, cleanupCompletedGenerations } from '@/lib/generationPersistence';

// Import axios to make checking requests
import { getApiClient } from '@/lib/axiosInstance';

export function useGenerationHydration() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const hydrate = async () => {
      // Cleanup any completed/failed items from storage first
      cleanupCompletedGenerations();

      // Load persisted generations from localStorage
      const persistedGenerations = loadGenerations();

      if (persistedGenerations.length > 0) {
        console.log('[useGenerationHydration] Restoring', persistedGenerations.length, 'generations');
        const api = getApiClient();

        // Process generations in parallel to check status
        const updatedGenerations = await Promise.all(persistedGenerations.map(async (gen) => {
          // Only check pending/generating items
          if (gen.status === 'pending' || gen.status === 'generating') {
            try {
              // If we have a historyId, check the actual status on the backend
              if (gen.historyId) {
                try {
                  const res = await api.get(`/api/generations/${gen.historyId}`);
                  const entry = res.data?.data?.item || res.data?.item || res.data?.data || res.data;

                  if (entry) {
                    // Check status map
                    const status = String(entry.status || '').toLowerCase();
                    if (status === 'completed' || status === 'succeeded' || status === 'success') {
                      console.log(`[useGenerationHydration] Reconciled ${gen.id} -> completed`);
                      return {
                        ...gen,
                        status: 'completed' as const,
                        // Try to recover media if available
                        images: entry.images || gen.images,
                        videos: entry.videos || gen.videos,
                        updatedAt: Date.now()
                      };
                    } else if (status === 'failed' || status === 'error') {
                      console.log(`[useGenerationHydration] Reconciled ${gen.id} -> failed`);
                      return {
                        ...gen,
                        status: 'failed' as const,
                        error: entry.error || 'Generation failed on backend',
                        updatedAt: Date.now()
                      };
                    }
                  }
                } catch (apiError) {
                  console.warn(`[useGenerationHydration] Failed to check history status for ${gen.id}`, apiError);
                }
              }

              // If still pending after check (or no historyId), mark as interrupted checks
              // We currently don't have a way to resume polling for interrupted generations
              return {
                ...gen,
                status: 'failed' as const,
                error: 'Interrupted by page reload'
              };
            } catch (e) {
              return {
                ...gen,
                status: 'failed' as const,
                error: 'Interrupted by page reload'
              };
            }
          }
          return gen;
        }));

        // Hydrate Redux state with updated status
        dispatch(hydrateGenerations(updatedGenerations as any));

        // Clean up old generations (completed > 1 hour ago)
        dispatch(clearOldGenerations());
      }
    };

    hydrate();
  }, [dispatch]);
}
