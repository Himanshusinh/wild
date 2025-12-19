/**
 * Generation Persistence Layer
 * Handles localStorage persistence for active generations (images, videos, audio)
 * Supports up to 4 concurrent generations with automatic cleanup
 */

import { GeneratedImage, GeneratedVideo, GeneratedAudio } from '@/types/history';

// Storage configuration
const STORAGE_KEY = 'wildmind_active_generations';
const MAX_CONCURRENT_GENERATIONS = 4;

export interface ActiveGeneration {
  id: string;
  prompt: string;
  model: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  // Support all media types
  images?: GeneratedImage[];
  videos?: GeneratedVideo[];
  audios?: GeneratedAudio[];
  historyId?: string;
  createdAt: number;
  updatedAt: number;
  params: {
    imageCount?: number; // For images
    frameSize?: string;
    style?: string;
    uploadedImages?: string[];
    width?: number;
    height?: number;
    generationType?: string; // 'text-to-image' | 'text-to-video' | 'text-to-music' | etc.
    isPublic?: boolean;
    // Video-specific params
    aspectRatio?: string;
    duration?: number;
    resolution?: string;
    quality?: string;
    // Audio-specific params
    lyrics?: string;
    fileName?: string;
  };
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load all generations from localStorage
 */
export function loadGenerations(): ActiveGeneration[] {
  if (!isLocalStorageAvailable()) {
    console.warn('[generationPersistence] localStorage not available');
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const generations: ActiveGeneration[] = JSON.parse(stored);
    
    // Validate structure
    if (!Array.isArray(generations)) {
      console.warn('[generationPersistence] Invalid stored data, resetting');
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Persist only active items: pending or generating. Completed/failed are not stored.
    const cleaned = generations.filter(gen => gen.status === 'pending' || gen.status === 'generating');

    // If we cleaned any, save back
    if (cleaned.length !== generations.length) {
      saveGenerations(cleaned);
    }

    return cleaned;
  } catch (error) {
    console.error('[generationPersistence] Error loading generations:', error);
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

// OPTIMIZED: Batch localStorage writes to avoid blocking main thread
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingGenerations: ActiveGeneration[] | null = null;

/**
 * Save all generations to localStorage
 * OPTIMIZED: Batched writes to reduce blocking operations
 */
export function saveGenerations(generations: ActiveGeneration[]): void {
  if (!isLocalStorageAvailable()) {
    console.warn('[generationPersistence] localStorage not available');
    return;
  }

  // OPTIMIZED: Batch writes - store pending and schedule async write
  pendingGenerations = generations;
  
  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Schedule write after a short delay to batch multiple rapid updates
  saveTimeout = setTimeout(() => {
    if (!pendingGenerations) return;
    
    // Store in local variable before clearing to use in error handler
    const generationsToSave = pendingGenerations;
    pendingGenerations = null;
    
    try {
      // Persist only pending or generating items; do not keep completed/failed in storage
      const allowed = generationsToSave.filter(g => g.status === 'pending' || g.status === 'generating');
      const toSave = allowed.slice(0, MAX_CONCURRENT_GENERATIONS);

      if (toSave.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      }
    } catch (error) {
      console.error('[generationPersistence] Error saving generations:', error);
      
      // Handle quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError' && generationsToSave) {
        // Try to free up space by removing completed generations and keeping pending/generating only
        const activeOnly = generationsToSave.filter(
          g => g.status === 'pending' || g.status === 'generating'
        );
        try {
          if (activeOnly.length === 0) {
            localStorage.removeItem(STORAGE_KEY);
          } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(activeOnly.slice(0, MAX_CONCURRENT_GENERATIONS)));
          }
        } catch {
          console.error('[generationPersistence] Failed to save even after cleanup');
        }
      }
    }
  }, 100); // Batch writes within 100ms window
}

/**
 * Add a new generation
 */
export function addGeneration(generation: ActiveGeneration): void {
  const current = loadGenerations();
  
  // Check if already exists
  const exists = current.some(g => g.id === generation.id);
  if (exists) {
    console.warn('[generationPersistence] Generation already exists:', generation.id);
    return;
  }

  // Add to beginning (most recent first)
  const updated = [generation, ...current].slice(0, MAX_CONCURRENT_GENERATIONS);
  saveGenerations(updated);
}

/**
 * Update an existing generation
 */
export function updateGeneration(
  id: string,
  updates: Partial<ActiveGeneration>
): void {
  const current = loadGenerations();
  const index = current.findIndex(g => g.id === id);

  if (index === -1) {
    console.warn('[generationPersistence] Generation not found:', id);
    return;
  }

  // Update the generation
  current[index] = {
    ...current[index],
    ...updates,
    updatedAt: Date.now(),
  };

  saveGenerations(current);
}

/**
 * Remove a generation
 */
export function removeGeneration(id: string): void {
  const current = loadGenerations();
  const filtered = current.filter(g => g.id !== id);
  
  if (filtered.length === current.length) {
    console.warn('[generationPersistence] Generation not found:', id);
    return;
  }

  saveGenerations(filtered);
}

/**
 * Clear old generations (older than threshold)
 */
export function clearOldGenerations(): ActiveGeneration[] {
  const current = loadGenerations();
  const now = Date.now();
  
  const active = current.filter(gen => gen.status === 'pending' || gen.status === 'generating');

  if (active.length !== current.length) {
    saveGenerations(active);
  }

  return active;
}

/**
 * Clear all generations (for testing/reset)
 */
export function clearAllGenerations(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get a single generation by ID
 */
export function getGeneration(id: string): ActiveGeneration | null {
  const current = loadGenerations();
  return current.find(g => g.id === id) || null;
}

/**
 * Get count of active (pending/generating) generations
 */
export function getActiveCount(): number {
  const current = loadGenerations();
  return current.filter(
    g => g.status === 'pending' || g.status === 'generating'
  ).length;
}

/**
 * Check if we can start a new generation
 */
export function canStartNewGeneration(): boolean {
  return getActiveCount() < MAX_CONCURRENT_GENERATIONS;
}
