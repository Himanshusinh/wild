import { store } from '@/store';
import {
  addToQueue,
  updateItemStatus,
  removeFromQueue,
  cancelItem,
  setProcessing,
  setCurrentItem,
  QueueItem,
  QueueItemStatus,
} from '@/store/slices/queueSlice';
import { getApiClient } from '@/lib/axiosInstance';
import { 
  falGenerate, 
  minimaxGenerate, 
  minimaxMusic,
  falElevenTts,
  runwayGenerate,
  bflGenerate,
  replicateGenerate,
} from '@/store/slices/generationsApi';
import { AppDispatch } from '@/store';
import { toast } from 'react-hot-toast';

// Queue processor state
let isProcessing = false;
let processingTimeout: NodeJS.Timeout | null = null;

/**
 * Add generation to queue
 * Backend will automatically calculate credit cost using existing pricing functions
 */
export const addGenerationToQueue = async (
  generationType: string,
  provider: string,
  payload: any,
  metadata?: Record<string, any>
): Promise<string> => {
  try {
    // Validate payload before sending
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload: payload is required and must be an object');
    }
    
    // Log payload for seedream to debug
    if (provider === 'replicate' && payload.model?.includes('seedream')) {
      console.log('[Queue] Adding Seedream to queue - Payload:', {
        model: payload.model,
        size: payload.size,
        aspect_ratio: payload.aspect_ratio,
        max_images: payload.max_images,
        prompt: payload.prompt || payload.userPrompt,
        hasImageInput: !!payload.image_input,
        imageInputCount: payload.image_input?.length || 0,
        payloadKeys: Object.keys(payload),
      });
    }
    
    // First add to backend queue (backend calculates cost and deducts credits)
    const api = getApiClient();
    const response = await api.post('/api/queue/add', {
      generationType,
      provider,
      payload,
      metadata: {
        model: payload.model,
        prompt: payload.prompt || payload.userPrompt || '',
        imageCount: payload.num_images || payload.n || 1,
        ...metadata,
      },
    });

    if (response.data?.responseStatus !== 'success') {
      throw new Error(response.data?.message || 'Failed to add to queue');
    }

    const { queueId, queuePosition } = response.data.data;

    // Get the calculated cost from backend response
    const calculatedCost = response.data?.data?.creditsCost || 0;

    // Deep clone payload to ensure it's not modified
    const payloadClone = JSON.parse(JSON.stringify(payload));

    // Add to frontend queue with backend queueId
    const dispatch = store.dispatch;
    const queueItem = {
      id: queueId, // Use backend queueId
      generationType,
      provider,
      payload: payloadClone, // Use cloned payload to prevent mutations
      creditsCost: calculatedCost,
      creditsDeducted: true, // Backend already deducted
      metadata: {
        model: payload.model,
        prompt: payload.prompt || payload.userPrompt || '',
        imageCount: payload.num_images || payload.n || 1,
        ...metadata,
      },
    };

    // Validate queue item before dispatching
    if (!queueItem.payload || Object.keys(queueItem.payload).length === 0) {
      console.error('[Queue] Queue item has empty payload:', queueItem);
      throw new Error('Failed to create queue item: payload is empty');
    }

    dispatch(addToQueue(queueItem));
    
    // Start processing if not already processing
    if (!isProcessing) {
      processQueue();
    }

    return queueId;
  } catch (error: any) {
    console.error('[Queue] Failed to add to queue:', error);
    throw error;
  }
};

/**
 * Process the next item in queue
 */
export const processQueue = async () => {
  if (isProcessing) return;
  
  const state = store.getState();
  const { items, isPaused } = state.queue;
  const isQueueEnabled = state.ui.isQueueEnabled;
  
  if (!isQueueEnabled) {
    // Queue is disabled, don't process
    return;
  }
  
  if (isPaused) return;
  
  // Find next queued item
  const nextItem = items.find(item => item.status === 'queued');
  
  if (!nextItem) {
    isProcessing = false;
    store.dispatch(setProcessing(false));
    store.dispatch(setCurrentItem(null));
    return;
  }

  isProcessing = true;
  store.dispatch(setProcessing(true));
  store.dispatch(setCurrentItem(nextItem.id));
  store.dispatch(updateItemStatus({ id: nextItem.id, status: 'processing' }));

  try {
    // Deduct credits if not already deducted
    if (!nextItem.creditsDeducted) {
      await deductCreditsForQueueItem(nextItem);
    }

    // Process the generation based on provider
    const result = await processGenerationItem(nextItem);
    
    // Extract image count for notification
    const imageCount = result?.images?.length || result?.imageCount || nextItem.metadata?.imageCount || 1;
    const prompt = nextItem.metadata?.prompt || nextItem.generationType;
    
    // Update with result
    store.dispatch(updateItemStatus({ 
      id: nextItem.id, 
      status: 'completed',
      result: result,
      historyId: result?.historyId,
    }));

    // Show success notification with image preview
    toast.success(
      `✅ Generation complete! ${imageCount} image${imageCount > 1 ? 's' : ''} generated`,
      {
        duration: 3000,
        icon: '🎨',
      }
    );

    // Refresh the single generation in history to ensure it appears in the main page
    if (result?.historyId) {
      try {
        // Import refreshSingleGeneration dynamically to avoid circular dependencies
        const { default: refreshSingleGeneration } = await import('@/app/view/Generation/ImageGeneration/TextToImage/compo/InputBox');
        // Actually, we can't import it directly. Instead, dispatch an event or use a global callback
        // For now, the sync effect in InputBox will handle it
        console.log('[Queue] Generation completed with historyId:', result.historyId);
      } catch (error) {
        console.error('[Queue] Failed to refresh generation:', error);
      }
    }

    // Auto-remove completed items after a longer delay (30 seconds) to keep queue clean
    // This gives enough time for:
    // 1. Images to render in the main page
    // 2. History to sync
    // 3. Smooth transition from queue entry to history entry
    setTimeout(() => {
      const state = store.getState();
      const completedItem = state.queue.items.find(item => item.id === nextItem.id);
      if (completedItem && completedItem.status === 'completed') {
        store.dispatch(removeFromQueue(nextItem.id));
        console.log('[Queue] Auto-removed completed item:', nextItem.id);
      }
    }, 30000); // Remove after 30 seconds (gives time for proper sync)

    // Process next item after a short delay
    setTimeout(() => {
      isProcessing = false;
      store.dispatch(setProcessing(false));
      store.dispatch(setCurrentItem(null));
      processQueue();
    }, 1000);

  } catch (error: any) {
    console.error('[Queue] Generation failed:', error);
    
    // Extract error message from various error structures
    let errorMessage = 'Generation failed';
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error?.errorDetails?.responseData?.message) {
      errorMessage = error.errorDetails.responseData.message;
    } else if (error?.errorDetails?.responseData?.error) {
      errorMessage = error.errorDetails.responseData.error;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Mark as failed
    store.dispatch(updateItemStatus({ 
      id: nextItem.id, 
      status: 'failed',
      error: errorMessage,
    }));

    // Auto-remove failed items after a short delay to keep queue clean
    setTimeout(() => {
      const state = store.getState();
      const failedItem = state.queue.items.find(item => item.id === nextItem.id);
      if (failedItem && failedItem.status === 'failed') {
        store.dispatch(removeFromQueue(nextItem.id));
        console.log('[Queue] Auto-removed failed item:', nextItem.id);
      }
    }, 10000); // Remove after 10 seconds

    // Backend will automatically refund credits on failure
    // Call backend to mark as failed (which triggers refund)
    try {
      const api = getApiClient();
      await api.post('/api/queue/refund-credits', {
        queueId: nextItem.id,
        creditsCost: nextItem.creditsCost,
      });
    } catch (refundError: any) {
      console.error('[Queue] Failed to notify backend of failure:', refundError);
      // Continue - backend will handle refund
    }

    // Process next item after a short delay
    setTimeout(() => {
      isProcessing = false;
      store.dispatch(setProcessing(false));
      store.dispatch(setCurrentItem(null));
      processQueue();
    }, 1000);
  }
};

/**
 * Process a single generation item
 */
const processGenerationItem = async (item: QueueItem): Promise<any> => {
  const dispatch = store.dispatch as AppDispatch;
  const { provider, payload, generationType } = item;

  // Validate payload exists
  if (!payload || typeof payload !== 'object') {
    console.error('[Queue] Invalid payload:', { 
      id: item.id, 
      provider, 
      generationType,
      payload,
      payloadType: typeof payload,
    });
    throw new Error('Invalid payload: payload is missing or not an object');
  }

  // Validate and log payload structure
  const payloadKeys = payload ? Object.keys(payload) : [];
  const payloadSize = payload ? JSON.stringify(payload).length : 0;
  
  console.log('[Queue] Processing generation:', { 
    id: item.id, 
    provider, 
    generationType,
    model: payload?.model,
    payloadKeys,
    payloadSize,
    payloadExists: !!payload,
    payloadType: typeof payload,
    itemKeys: Object.keys(item),
  });
  
  // If payload is missing or empty, try to restore from backend
  if (!payload || payloadKeys.length === 0) {
    console.warn('[Queue] Payload is missing or empty, attempting to restore from backend...', {
      queueId: item.id,
      provider,
      generationType,
    });
    
    // Try to fetch from backend
    try {
      const api = getApiClient();
      const response = await api.get(`/api/queue/status/${item.id}`);
      const backendItem = response.data?.data?.item;
      
      if (backendItem?.payload) {
        console.log('[Queue] Restored payload from backend:', {
          queueId: item.id,
          payloadKeys: Object.keys(backendItem.payload),
        });
        // Update the item with restored payload
        item.payload = backendItem.payload;
        // Update Redux state
        store.dispatch(updateItemStatus({
          id: item.id,
          status: item.status,
        }));
      } else {
        throw new Error('Payload not found in backend either');
      }
    } catch (restoreError: any) {
      console.error('[Queue] Failed to restore payload from backend:', restoreError);
      throw new Error(`Invalid payload: payload is missing or empty for queue item ${item.id}. Cannot process generation.`);
    }
  }

  // Log full payload for replicate (seedream) to debug validation issues
  if (provider === 'replicate' && payload?.model?.includes('seedream')) {
    console.log('[Queue] Seedream payload:', JSON.stringify(payload, null, 2));
    console.log('[Queue] Seedream payload keys:', Object.keys(payload));
    console.log('[Queue] Seedream payload values:', {
      model: payload.model,
      size: payload.size,
      aspect_ratio: payload.aspect_ratio,
      max_images: payload.max_images,
      prompt: payload.prompt || payload.userPrompt,
      hasImageInput: !!payload.image_input,
      imageInputCount: payload.image_input?.length || 0,
    });
  }

  let result: any;

  try {
    switch (provider) {
      case 'fal':
        if (generationType === 'text-to-music' || generationType === 'text-to-speech' || generationType === 'tts') {
          if (payload.model?.includes('elevenlabs') || payload.model?.includes('tts')) {
            result = await dispatch(falElevenTts(payload)).unwrap();
          } else {
            result = await dispatch(minimaxMusic(payload)).unwrap();
          }
        } else {
          result = await dispatch(falGenerate(payload)).unwrap();
        }
        break;

      case 'minimax':
        if (generationType === 'text-to-music') {
          result = await dispatch(minimaxMusic(payload)).unwrap();
        } else {
          result = await dispatch(minimaxGenerate(payload)).unwrap();
        }
        break;

      case 'runway':
        result = await dispatch(runwayGenerate(payload)).unwrap();
        break;

      case 'bfl':
        result = await dispatch(bflGenerate(payload)).unwrap();
        break;

      case 'replicate':
        result = await dispatch(replicateGenerate(payload)).unwrap();
        break;

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error: any) {
    // Redux Toolkit's rejectWithValue returns the value directly (often a string)
    // unwrap() throws that value, so error might be a string, not an Error object
    const errorDetails: any = {
      provider,
      model: payload.model,
      generationType,
    };

    // Log the raw error to understand its structure
    console.log('[Queue] Raw error:', error);
    console.log('[Queue] Error type:', typeof error);
    console.log('[Queue] Error constructor:', error?.constructor?.name);
    
    // Extract error message - handle both string errors and Error objects
    // Redux Toolkit rejectWithValue can return strings or objects
    let errorMessage = 'Generation failed';
    if (typeof error === 'string') {
      errorMessage = error;
      errorDetails.errorString = error;
    } else if (error?.message) {
      errorMessage = error.message;
      errorDetails.errorMessage = error.message;
      // Check for nested details (from updated rejectWithValue)
      if (error.details) {
        errorDetails.validationDetails = error.details;
      }
      if (error.responseData) {
        errorDetails.responseData = error.responseData;
      }
      if (error.status) {
        errorDetails.status = error.status;
      }
    } else if (error?.error) {
      errorMessage = typeof error.error === 'string' ? error.error : error.error?.message || 'Generation failed';
      errorDetails.nestedError = error.error;
    } else if (error?.payload) {
      errorMessage = typeof error.payload === 'string' ? error.payload : error.payload?.message || 'Generation failed';
      errorDetails.payloadError = error.payload;
    } else if (error?.response) {
      errorDetails.responseStatus = error.response.status;
      errorDetails.responseData = error.response.data;
      errorMessage = error.response.data?.message || error.response.data?.error || error.message || 'Generation failed';
    } else if (error) {
      // Try to stringify the error to see what it contains
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = String(error);
      }
    }

    // For replicate/seedream, log the full payload for debugging
    if (provider === 'replicate' && payload?.model?.includes('seedream')) {
      try {
        errorDetails.seedreamPayload = {
          model: payload?.model,
          size: payload?.size,
          aspect_ratio: payload?.aspect_ratio,
          max_images: payload?.max_images,
          sequential_image_generation: payload?.sequential_image_generation,
          width: payload?.width,
          height: payload?.height,
          prompt: payload?.prompt || payload?.userPrompt,
          hasImageInput: !!payload?.image_input,
          imageInputCount: payload?.image_input?.length || 0,
          fullPayload: payload ? JSON.parse(JSON.stringify(payload)) : null, // Deep clone for logging
          payloadKeys: payload ? Object.keys(payload) : [],
          payloadStringified: payload ? JSON.stringify(payload, null, 2) : 'null or undefined',
        };
        console.error('[Queue] Seedream validation error - Full payload:', errorDetails.seedreamPayload);
      } catch (payloadError) {
        console.error('[Queue] Failed to log seedream payload:', payloadError);
        errorDetails.seedreamPayload = {
          error: 'Failed to serialize payload',
          payloadError: String(payloadError),
          payloadType: typeof payload,
          payloadExists: !!payload,
        };
      }
    }

    errorDetails.finalErrorMessage = errorMessage;
    console.error('[Queue] Generation error details:', errorDetails);
    
    // Re-throw with the extracted error message
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).originalError = error;
    (enhancedError as any).errorDetails = errorDetails;
    throw enhancedError;
  }

  return result;
};

/**
 * Deduct credits for queue item
 * Note: Credits are deducted on backend when adding to queue
 * This is just for frontend sync/verification
 */
const deductCreditsForQueueItem = async (item: QueueItem): Promise<void> => {
  try {
    // Credits are already deducted on backend when item was added to queue
    // Just mark as deducted in frontend
    const { markCreditsDeducted } = await import('@/store/slices/queueSlice');
    store.dispatch(markCreditsDeducted(item.id));
  } catch (error: any) {
    console.error('[Queue] Failed to mark credits deducted:', error);
    // Don't throw - this is just for frontend state
  }
};

/**
 * Refund credits for failed/cancelled queue item
 * Backend handles refund automatically on failure, this is just for frontend sync
 */
const refundCreditsForQueueItem = async (item: QueueItem): Promise<void> => {
  try {
    // Backend automatically refunds on failure/cancellation
    // This function is kept for potential future use or frontend-only scenarios
    const api = getApiClient();
    await api.post('/api/queue/refund-credits', {
      queueId: item.id,
      creditsCost: item.creditsCost,
    });
  } catch (error: any) {
    console.error('[Queue] Failed to refund credits:', error);
    // Don't throw - refund failure shouldn't block queue processing
  }
};

/**
 * Cancel a queue item
 */
export const cancelQueueItem = async (itemId: string): Promise<void> => {
  try {
    const dispatch = store.dispatch;
    const state = store.getState();
    const item = state.queue.items.find(i => i.id === itemId);

    if (!item) return;

    // Call backend to cancel (this refunds credits)
    const api = getApiClient();
    await api.post(`/api/queue/cancel/${itemId}`);

    // Update frontend state
    if (item.status === 'processing') {
      dispatch(cancelItem(itemId));
    } else if (item.status === 'queued') {
      dispatch(cancelItem(itemId));
      dispatch(removeFromQueue(itemId));
    }
  } catch (error: any) {
    console.error('[Queue] Failed to cancel queue item:', error);
    // Still update frontend state even if backend call fails
    const dispatch = store.dispatch;
    dispatch(cancelItem(itemId));
  }
};

/**
 * Pause queue processing
 */
export const pauseQueue = () => {
  const { setPaused } = require('@/store/slices/queueSlice');
  store.dispatch(setPaused(true));
};

/**
 * Resume queue processing
 */
export const resumeQueue = () => {
  const { setPaused } = require('@/store/slices/queueSlice');
  store.dispatch(setPaused(false));
  if (!isProcessing) {
    processQueue();
  }
};

/**
 * Clear completed items
 */
export const clearCompletedItems = () => {
  const { clearCompleted } = require('@/store/slices/queueSlice');
  store.dispatch(clearCompleted());
};

/**
 * Restore queue on app load
 */
export const restoreQueueOnLoad = () => {
  const { restoreQueue } = require('@/store/slices/queueSlice');
  store.dispatch(restoreQueue());
  
  // Start processing if there are queued items
  const state = store.getState();
  const hasQueuedItems = state.queue.items.some(item => item.status === 'queued');
  if (hasQueuedItems && !isProcessing) {
    processQueue();
  }
};

