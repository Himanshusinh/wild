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
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  error?: string;
  // Support all media types
  images?: GeneratedImage[];
  videos?: GeneratedVideo[];
  audios?: GeneratedAudio[];
  historyId?: string;
  startedAt?: number;
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
    model?: string;
    provider?: string;
    requestId?: string;
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
 * CRITICAL: Only loads pending/generating generations to avoid quota issues
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

    // CRITICAL: Persist only active items: pending or generating. Completed/failed are not stored.
    const cleaned = generations.filter(gen => gen.status === 'pending' || gen.status === 'generating');

    // If we cleaned any, save back (this ensures old completed/failed/cancelled items are removed)
    if (cleaned.length !== generations.length) {
      console.log(`[generationPersistence] Cleaned ${generations.length - cleaned.length} completed/failed/cancelled items from storage`);
      saveGenerations(cleaned);
    }

    return cleaned;
  } catch (error) {
    console.error('[generationPersistence] Error loading generations:', error);
    // Clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore errors when clearing
    }
    return [];
  }
}

// OPTIMIZED: Batch localStorage writes to avoid blocking main thread
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingGenerations: ActiveGeneration[] | null = null;

/**
 * Save all generations to localStorage
 * OPTIMIZED: Batched writes to reduce blocking operations
 * CRITICAL: Only persists pending/generating generations to avoid quota issues
 */
export function saveGenerations(generations: ActiveGeneration[]): void {
  if (!isLocalStorageAvailable()) {
    console.warn('[generationPersistence] localStorage not available');
    return;
  }

  // CRITICAL: Filter out completed/failed/cancelled BEFORE batching to reduce data size
  const activeOnly = generations.filter(g => g.status === 'pending' || g.status === 'generating');
  
  // If no active generations, clear storage and return early
  if (activeOnly.length === 0) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore errors when clearing
    }
    return;
  }

  // OPTIMIZED: Batch writes - store pending and schedule async write
  pendingGenerations = activeOnly.slice(0, MAX_CONCURRENT_GENERATIONS);
  
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
      // Double-check: only save pending/generating (should already be filtered, but be safe)
      const toSave = generationsToSave.filter(g => g.status === 'pending' || g.status === 'generating');

      if (toSave.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        // Additional safety: limit data size by removing large media arrays before saving
        // We only need to persist the generation metadata, not the full media
        const lightweight = toSave.map(g => ({
          id: g.id,
          prompt: g.prompt,
          model: g.model,
          status: g.status,
          progress: g.progress,
          error: g.error,
          historyId: g.historyId,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
          params: g.params,
          // Don't persist media arrays - they're too large and not needed for persistence
          // Media will be loaded from history when needed
        }));
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
      }
    } catch (error) {
      console.error('[generationPersistence] Error saving generations:', error);
      
      // Handle quota exceeded - try to save even less data
      if (error instanceof Error && error.name === 'QuotaExceededError' && generationsToSave) {
        try {
          // Save only the absolute minimum: id, status, and essential params
          const minimal = generationsToSave.map(g => ({
            id: g.id,
            prompt: g.prompt?.substring(0, 100) || '', // Truncate long prompts
            model: g.model,
            status: g.status,
            createdAt: g.createdAt,
            updatedAt: g.updatedAt,
            params: {
              generationType: g.params?.generationType,
              imageCount: g.params?.imageCount,
            }
          }));
          
          if (minimal.length === 0) {
            localStorage.removeItem(STORAGE_KEY);
          } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
            console.log('[generationPersistence] Saved minimal data after quota error');
          }
        } catch (retryError) {
          console.error('[generationPersistence] Failed to save even after cleanup:', retryError);
          // Last resort: clear storage completely
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {
            // Ignore final cleanup errors
          }
        }
      }
    }
  }, 100); // Batch writes within 100ms window
}

/**
 * Add a new generation
 * Only persists if status is 'pending' or 'generating'
 */
export function addGeneration(generation: ActiveGeneration): void {
  // Only persist pending or generating generations
  if (generation.status !== 'pending' && generation.status !== 'generating') {
    console.log('[generationPersistence] Skipping persistence for non-active generation:', generation.id, generation.status);
    return;
  }

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
 * If status becomes 'completed' or 'failed', remove from persistence instead of updating
 */
export function updateGeneration(
  id: string,
  updates: Partial<ActiveGeneration>
): void {
  // If status is being updated to completed, failed, or cancelled, remove from persistence
  if (updates.status === 'completed' || updates.status === 'failed' || updates.status === 'cancelled') {
    console.log('[generationPersistence] Removing completed/failed/cancelled generation from persistence:', id, updates.status);
    removeGeneration(id);
    return;
  }

  const current = loadGenerations();
  const index = current.findIndex(g => g.id === id);

  if (index === -1) {
    // Generation not in persistence - this is fine if it was never persisted or was already removed
    // Only log if we're trying to update a non-completed/failed/cancelled status
    const updateStatus = updates.status as ActiveGeneration['status'] | undefined;
    if (updateStatus && updateStatus !== 'completed' && updateStatus !== 'failed' && updateStatus !== 'cancelled') {
      console.log('[generationPersistence] Generation not found in persistence (may have been removed):', id);
    }
    return;
  }

  // Check if the updated status would make it non-persistable
  const newStatus = updates.status || current[index].status;
  if (newStatus === 'completed' || newStatus === 'failed' || newStatus === 'cancelled') {
    console.log('[generationPersistence] Removing generation from persistence due to status change:', id, newStatus);
    removeGeneration(id);
    return;
  }

  // Update the generation (only if it remains in pending/generating state)
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
 * Cleanup function to remove any completed/failed items from storage
 * Call this on app startup to ensure storage is clean
 */
export function cleanupCompletedGenerations(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    const generations: ActiveGeneration[] = JSON.parse(stored);
    if (!Array.isArray(generations)) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    // Filter out completed/failed/cancelled
    const activeOnly = generations.filter((gen: ActiveGeneration) => gen.status === 'pending' || gen.status === 'generating');
    
    if (activeOnly.length !== generations.length) {
      console.log(`[generationPersistence] Cleanup: Removed ${generations.length - activeOnly.length} completed/failed/cancelled items`);
      if (activeOnly.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        // Save lightweight version without media
        const lightweight = activeOnly.map(g => ({
          id: g.id,
          prompt: g.prompt,
          model: g.model,
          status: g.status,
          progress: g.progress,
          error: g.error,
          historyId: g.historyId,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
          params: g.params,
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
      }
    }
  } catch (error) {
    console.error('[generationPersistence] Error during cleanup:', error);
    // Clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore errors
    }
  }
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
