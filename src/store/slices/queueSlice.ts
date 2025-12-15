import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Generate unique ID
const generateId = (): string => {
  if (typeof window !== 'undefined' && typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `queue_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// Queue Item Status
export type QueueItemStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Queue Item Interface
export interface QueueItem {
  id: string;                    // Unique queue item ID
  queuePosition: number;          // Position in queue
  status: QueueItemStatus;
  generationType: string;         // 'text-to-image', 'text-to-video', etc.
  provider: string;               // 'fal', 'minimax', 'replicate', etc.
  payload: any;                   // Original generation payload
  historyId?: string;             // Backend history ID (when created)
  creditsCost: number;            // Credits to be deducted
  creditsDeducted: boolean;        // Whether credits were deducted
  createdAt: number;              // Timestamp when queued
  startedAt?: number;             // Timestamp when processing started
  completedAt?: number;            // Timestamp when completed
  error?: string;                  // Error message if failed
  result?: any;                    // Generation result
  metadata?: {
    model?: string;
    prompt?: string;
    imageCount?: number;
    [key: string]: any;
  };
}

// Queue State Interface
interface QueueState {
  items: QueueItem[];
  isProcessing: boolean;
  currentItemId: string | null;
  isPaused: boolean;
  lastProcessedAt: number | null;
}

// Initial State
const initialState: QueueState = {
  items: [],
  isProcessing: false,
  currentItemId: null,
  isPaused: false,
  lastProcessedAt: null,
};

// Load queue from localStorage
const loadQueueFromStorage = (): QueueItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('generation_queue');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only keep active items (queued/processing) - don't store completed/failed items
      // This keeps the queue clean and prevents it from becoming a history storage
      return parsed.filter((item: QueueItem) => 
        item.status === 'queued' || item.status === 'processing'
      );
    }
  } catch (error) {
    console.error('[Queue] Failed to load from localStorage:', error);
  }
  return [];
};

// Save queue to localStorage
const saveQueueToStorage = (items: QueueItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('generation_queue', JSON.stringify(items));
  } catch (error) {
    console.error('[Queue] Failed to save to localStorage:', error);
  }
};

// Initialize with stored queue
const storedItems = loadQueueFromStorage();
const initialItems = storedItems.length > 0 ? storedItems : [];

// Queue Slice
const queueSlice = createSlice({
  name: 'queue',
  initialState: {
    ...initialState,
    items: initialItems,
  },
  reducers: {
    // Add item to queue
    addToQueue: (state, action: PayloadAction<Omit<QueueItem, 'id' | 'queuePosition' | 'createdAt' | 'status' | 'creditsDeducted'>>) => {
      const newItem: QueueItem = {
        ...action.payload,
        id: generateId(),
        queuePosition: state.items.length + 1,
        status: 'queued',
        createdAt: Date.now(),
        creditsDeducted: false,
      };
      state.items.push(newItem);
      saveQueueToStorage(state.items);
    },

    // Update item status
    updateItemStatus: (state, action: PayloadAction<{ id: string; status: QueueItemStatus; error?: string; result?: any; historyId?: string }>) => {
      const { id, status, error, result, historyId } = action.payload;
      const item = state.items.find(i => i.id === id);
      if (item) {
        item.status = status;
        if (error) item.error = error;
        if (result) item.result = result;
        if (historyId) item.historyId = historyId;
        if (status === 'processing' && !item.startedAt) {
          item.startedAt = Date.now();
        }
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          item.completedAt = Date.now();
        }
        saveQueueToStorage(state.items);
      }
    },

    // Remove item from queue
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      // Recalculate positions
      state.items.forEach((item, index) => {
        item.queuePosition = index + 1;
      });
      saveQueueToStorage(state.items);
    },

    // Cancel item
    cancelItem: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.id === action.payload);
      if (item && (item.status === 'queued' || item.status === 'processing')) {
        item.status = 'cancelled';
        item.completedAt = Date.now();
        saveQueueToStorage(state.items);
      }
    },

    // Set processing state
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
      if (!action.payload) {
        state.currentItemId = null;
        state.lastProcessedAt = Date.now();
      }
    },

    // Set current processing item
    setCurrentItem: (state, action: PayloadAction<string | null>) => {
      state.currentItemId = action.payload;
    },

    // Pause/resume queue
    setPaused: (state, action: PayloadAction<boolean>) => {
      state.isPaused = action.payload;
    },

    // Clear completed items
    clearCompleted: (state) => {
      state.items = state.items.filter(item => item.status !== 'completed');
      // Recalculate positions
      state.items.forEach((item, index) => {
        item.queuePosition = index + 1;
      });
      saveQueueToStorage(state.items);
    },

    // Update item with result
    updateItemResult: (state, action: PayloadAction<{ id: string; result: any; historyId?: string }>) => {
      const { id, result, historyId } = action.payload;
      const item = state.items.find(i => i.id === id);
      if (item) {
        item.result = result;
        if (historyId) item.historyId = historyId;
        saveQueueToStorage(state.items);
      }
    },

    // Mark credits as deducted
    markCreditsDeducted: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.id === action.payload);
      if (item) {
        item.creditsDeducted = true;
        saveQueueToStorage(state.items);
      }
    },

    // Restore queue from storage
    restoreQueue: (state) => {
      const stored = loadQueueFromStorage();
      state.items = stored;
      // Recalculate positions
      state.items.forEach((item, index) => {
        item.queuePosition = index + 1;
      });
    },
  },
});

export const {
  addToQueue,
  updateItemStatus,
  removeFromQueue,
  cancelItem,
  setProcessing,
  setCurrentItem,
  setPaused,
  clearCompleted,
  updateItemResult,
  markCreditsDeducted,
  restoreQueue,
} = queueSlice.actions;

export default queueSlice.reducer;

