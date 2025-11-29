import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Custom hook to persist generation state in localStorage per generation type
 * This ensures state is preserved when navigating between generation pages
 */
export function usePersistedGenerationState<T>(
  key: string,
  defaultValue: T,
  generationType?: string
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const pathname = usePathname();
  
  // Determine generation type from pathname if not provided
  const type = generationType || pathname?.split('/').pop() || 'text-to-image';
  const storageKey = `generation-state-${type}-${key}`;

  // Initialize state from localStorage or default
  const [state, setStateInternal] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = window.localStorage.getItem(storageKey);
      if (item) {
        return JSON.parse(item);
      }
    } catch (error) {
      console.warn(`Failed to load persisted state for ${storageKey}:`, error);
    }
    return defaultValue;
  });

  // Wrapper to handle both direct values and functional updates
  const setState: React.Dispatch<React.SetStateAction<T>> = (value: T | ((prev: T) => T)) => {
    setStateInternal((prev) => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      // Save to localStorage immediately
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(newValue));
        } catch (error) {
          console.warn(`Failed to persist state for ${storageKey}:`, error);
        }
      }
      return newValue;
    });
  };

  // Also save to localStorage whenever state changes (backup)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to persist state for ${storageKey}:`, error);
    }
  }, [state, storageKey]);

  return [state, setState];
}

/**
 * Hook to persist multiple state values at once
 */
export function usePersistedGenerationStates<T extends Record<string, any>>(
  defaultStates: T,
  generationType?: string
): [T, (updates: Partial<T>) => void] {
  const pathname = usePathname();
  const type = generationType || pathname?.split('/').pop() || 'text-to-image';
  const storageKey = `generation-states-${type}`;

  // Initialize from localStorage or defaults
  const [states, setStates] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultStates;
    
    try {
      const item = window.localStorage.getItem(storageKey);
      if (item) {
        const saved = JSON.parse(item);
        // Merge saved with defaults to handle new fields
        return { ...defaultStates, ...saved };
      }
    } catch (error) {
      console.warn(`Failed to load persisted states for ${storageKey}:`, error);
    }
    return defaultStates;
  });

  // Save to localStorage whenever states change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(states));
    } catch (error) {
      console.warn(`Failed to persist states for ${storageKey}:`, error);
    }
  }, [states, storageKey]);

  // Update function that merges partial updates
  const updateStates = (updates: Partial<T>) => {
    setStates(prev => ({ ...prev, ...updates }));
  };

  return [states, updateStates];
}

