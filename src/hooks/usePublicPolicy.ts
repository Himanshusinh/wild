import { useState, useEffect } from 'react';
import { getApiClient } from '@/lib/axiosInstance';

interface PublicPolicy {
  canToggle: boolean;
  isRestricted: boolean;
  message: string;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and cache public generation policy
 * Returns whether user can toggle public/private settings
 * 
 * Restricted plans (FREE, PLAN_A, PLAN_B): Cannot toggle (always public)
 * Unrestricted plans (PLAN_C, PLAN_D): Can toggle
 */
export function usePublicPolicy(): PublicPolicy {
  const [policy, setPolicy] = useState<PublicPolicy>({
    canToggle: false,
    isRestricted: true,
    message: '',
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchPolicy() {
      try {
        const api = getApiClient();
        const response = await api.get('/api/auth/can-toggle-public');
        
        if (!mounted) return;

        const data = response?.data?.data || response?.data;
        
        setPolicy({
          canToggle: Boolean(data?.canToggle),
          isRestricted: Boolean(data?.isRestricted),
          message: data?.message || '',
          loading: false,
          error: null,
        });
      } catch (err: any) {
        if (!mounted) return;
        
        console.error('[usePublicPolicy] Error fetching policy:', err);
        
        // Default to restricted on error (safe fallback)
        setPolicy({
          canToggle: false,
          isRestricted: true,
          message: 'Unable to verify your plan status',
          loading: false,
          error: err?.message || 'Failed to fetch policy',
        });
      }
    }

    fetchPolicy();

    return () => {
      mounted = false;
    };
  }, []);

  return policy;
}

/**
 * Get public policy from user data (cached from /me endpoint)
 * This is a synchronous alternative that reads from the /me response
 */
export function getPublicPolicyFromUser(user: any): {
  canToggle: boolean;
  isRestricted: boolean;
  message: string;
} {
  const canToggle = Boolean(user?.canTogglePublicGenerations);
  const isRestricted = Boolean(user?.forcePublicGenerations);

  return {
    canToggle,
    isRestricted,
    message: canToggle
      ? 'You can choose public or private generations'
      : 'Your plan requires all generations to be public. Upgrade to Plan C or D for private generations.',
  };
}
