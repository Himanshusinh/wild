/**
 * Generation Wrapper - Provides unified interface for generation with optional queue support
 * This allows existing code to continue working while adding queue functionality
 */

import { AppDispatch, store } from '@/store';
import { addGenerationToQueue } from './generationQueue';
import { 
  falGenerate, 
  minimaxGenerate, 
  minimaxMusic,
  falElevenTts,
  runwayGenerate,
  bflGenerate,
} from '@/store/slices/generationsApi';

// Feature flag: Enable queue system (can be controlled via env or user settings)
// Default: ENABLED by default
const QUEUE_ENABLED = process.env.NEXT_PUBLIC_QUEUE_ENABLED !== 'false'; // Default: enabled

// Check if queue is enabled (reads from Redux state)
const isQueueEnabled = (): boolean => {
  if (typeof window === 'undefined') return QUEUE_ENABLED;
  
  // Read from Redux store
  const state = store.getState();
  return state.ui.isQueueEnabled;
};

// Note: Credit cost calculation is now handled by the backend
// This ensures accuracy and consistency with existing pricing logic

export interface GenerationOptions {
  useQueue?: boolean; // Override queue setting for this specific call
  onQueued?: (queueId: string) => void; // Callback when added to queue
  onStarted?: () => void; // Callback when generation starts
}

/**
 * Generate using FAL
 */
export async function generateWithFal(
  dispatch: AppDispatch,
  payload: any,
  options: GenerationOptions = {}
): Promise<any> {
  const shouldUseQueue = options.useQueue !== undefined ? options.useQueue : isQueueEnabled();
  const generationType = payload.generationType || 'text-to-image';
  
  if (shouldUseQueue) {
    try {
      // Backend will calculate cost automatically
      const queueId = await addGenerationToQueue(
        generationType,
        'fal',
        payload,
        {
          model: payload.model,
          prompt: payload.prompt || payload.userPrompt,
          imageCount: payload.num_images || payload.n || 1,
        }
      );
      
      if (options.onQueued) {
        options.onQueued(queueId);
      }
      
      // Return a promise that resolves when queue processes the item
      // The queue service will handle the actual generation
      return {
        queueId,
        status: 'queued',
        message: 'Generation added to queue',
      };
    } catch (error: any) {
      // If queue fails, fall back to direct generation
      console.warn('[GenerationWrapper] Queue failed, falling back to direct generation:', error);
      return await dispatch(falGenerate(payload)).unwrap();
    }
  }
  
  // Direct generation (existing behavior)
  if (options.onStarted) {
    options.onStarted();
  }
  return await dispatch(falGenerate(payload)).unwrap();
}

/**
 * Generate using MiniMax
 */
export async function generateWithMiniMax(
  dispatch: AppDispatch,
  payload: any,
  options: GenerationOptions = {}
): Promise<any> {
  const shouldUseQueue = options.useQueue !== undefined ? options.useQueue : isQueueEnabled();
  const generationType = payload.generationType || 'text-to-image';
  
  if (shouldUseQueue) {
    try {
      // Backend will calculate cost automatically
      const queueId = await addGenerationToQueue(
        generationType,
        'minimax',
        payload,
        {
          model: payload.model,
          prompt: payload.prompt || payload.userPrompt,
          imageCount: payload.num_images || payload.n || 1,
        }
      );
      
      if (options.onQueued) {
        options.onQueued(queueId);
      }
      
      return {
        queueId,
        status: 'queued',
        message: 'Generation added to queue',
      };
    } catch (error: any) {
      console.warn('[GenerationWrapper] Queue failed, falling back to direct generation:', error);
      return await dispatch(minimaxGenerate(payload)).unwrap();
    }
  }
  
  if (options.onStarted) {
    options.onStarted();
  }
  return await dispatch(minimaxGenerate(payload)).unwrap();
}

/**
 * Generate music using MiniMax
 */
export async function generateMusicWithMiniMax(
  dispatch: AppDispatch,
  payload: any,
  options: GenerationOptions = {}
): Promise<any> {
  const shouldUseQueue = options.useQueue !== undefined ? options.useQueue : isQueueEnabled();
  
  if (shouldUseQueue) {
    try {
      // Backend will calculate cost automatically
      const queueId = await addGenerationToQueue(
        'text-to-music',
        'minimax',
        payload,
        {
          model: payload.model,
          prompt: payload.prompt || payload.lyrics || payload.lyrics_prompt,
        }
      );
      
      if (options.onQueued) {
        options.onQueued(queueId);
      }
      
      return {
        queueId,
        status: 'queued',
        message: 'Generation added to queue',
      };
    } catch (error: any) {
      console.warn('[GenerationWrapper] Queue failed, falling back to direct generation:', error);
      return await dispatch(minimaxMusic(payload)).unwrap();
    }
  }
  
  if (options.onStarted) {
    options.onStarted();
  }
  return await dispatch(minimaxMusic(payload)).unwrap();
}

/**
 * Generate TTS using FAL ElevenLabs
 */
export async function generateTTSWithFal(
  dispatch: AppDispatch,
  payload: any,
  options: GenerationOptions = {}
): Promise<any> {
  const shouldUseQueue = options.useQueue !== undefined ? options.useQueue : isQueueEnabled();
  
  if (shouldUseQueue) {
    try {
      // Backend will calculate cost automatically
      const queueId = await addGenerationToQueue(
        'text-to-speech',
        'fal',
        payload,
        {
          model: payload.model,
          prompt: payload.prompt || payload.text,
        }
      );
      
      if (options.onQueued) {
        options.onQueued(queueId);
      }
      
      return {
        queueId,
        status: 'queued',
        message: 'Generation added to queue',
      };
    } catch (error: any) {
      console.warn('[GenerationWrapper] Queue failed, falling back to direct generation:', error);
      return await dispatch(falElevenTts(payload)).unwrap();
    }
  }
  
  if (options.onStarted) {
    options.onStarted();
  }
  return await dispatch(falElevenTts(payload)).unwrap();
}

/**
 * Generate using Runway
 */
export async function generateWithRunway(
  dispatch: AppDispatch,
  payload: any,
  options: GenerationOptions = {}
): Promise<any> {
  const shouldUseQueue = options.useQueue !== undefined ? options.useQueue : isQueueEnabled();
  const generationType = payload.generationType || 'text-to-video';
  
  if (shouldUseQueue) {
    try {
      // Backend will calculate cost automatically
      const queueId = await addGenerationToQueue(
        generationType,
        'runway',
        payload,
        {
          model: payload.model,
          prompt: payload.promptText || payload.prompt,
        }
      );
      
      if (options.onQueued) {
        options.onQueued(queueId);
      }
      
      return {
        queueId,
        status: 'queued',
        message: 'Generation added to queue',
      };
    } catch (error: any) {
      console.warn('[GenerationWrapper] Queue failed, falling back to direct generation:', error);
      return await dispatch(runwayGenerate(payload)).unwrap();
    }
  }
  
  if (options.onStarted) {
    options.onStarted();
  }
  return await dispatch(runwayGenerate(payload)).unwrap();
}

/**
 * Generate using BFL
 */
export async function generateWithBFL(
  dispatch: AppDispatch,
  payload: any,
  options: GenerationOptions = {}
): Promise<any> {
  const shouldUseQueue = options.useQueue !== undefined ? options.useQueue : isQueueEnabled();
  const generationType = payload.generationType || 'text-to-image';
  
  if (shouldUseQueue) {
    try {
      // Backend will calculate cost automatically
      const queueId = await addGenerationToQueue(
        generationType,
        'bfl',
        payload,
        {
          model: payload.model,
          prompt: payload.prompt,
          imageCount: payload.n || 1,
        }
      );
      
      if (options.onQueued) {
        options.onQueued(queueId);
      }
      
      return {
        queueId,
        status: 'queued',
        message: 'Generation added to queue',
      };
    } catch (error: any) {
      console.warn('[GenerationWrapper] Queue failed, falling back to direct generation:', error);
      return await dispatch(bflGenerate(payload)).unwrap();
    }
  }
  
  if (options.onStarted) {
    options.onStarted();
  }
  return await dispatch(bflGenerate(payload)).unwrap();
}

/**
 * Toggle queue enabled state
 */
export function setQueueEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('queue_enabled', enabled.toString());
  }
}

/**
 * Get queue enabled state
 */
export function getQueueEnabled(): boolean {
  return isQueueEnabled();
}

