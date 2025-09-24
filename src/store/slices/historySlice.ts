import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HistoryEntry, HistoryFilters } from '@/types/history';
import axiosInstance from '@/lib/axiosInstance';
import { PaginationParams, PaginationResult } from '@/lib/paginationUtils';

interface HistoryState {
  entries: HistoryEntry[];
  loading: boolean;
  error: string | null;
  filters: HistoryFilters;
  hasMore: boolean;
  lastLoadedCount: number;
}

const initialState: HistoryState = {
  entries: [],
  loading: false,
  error: null,
  filters: {},
  hasMore: true,
  lastLoadedCount: 0,
};

// Async thunk for loading history
export const loadHistory = createAsyncThunk(
  'history/loadHistory',
  async (
    { filters, paginationParams }: { filters?: HistoryFilters; paginationParams?: PaginationParams } = {},
    { rejectWithValue }
  ) => {
    try {
      const client = axiosInstance;
      const params: any = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.generationType) params.generationType = filters.generationType;
      if (paginationParams?.limit) params.limit = paginationParams.limit;
      if ((paginationParams as any)?.cursor?.id) params.cursor = (paginationParams as any).cursor.id;
      const res = await client.get('/api/generations', { params });
      const result = res.data?.data || { items: [], nextCursor: undefined };
      
      // Handle both old array format and new pagination format
      const items = result.items || [];
      const nextCursor = result.nextCursor;
      return { entries: items, hasMore: Boolean(nextCursor), nextCursor };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load history');
    }
  }
);

// Async thunk for loading more history (pagination)
export const loadMoreHistory = createAsyncThunk(
  'history/loadMoreHistory',
  async (
    { filters, paginationParams }: { filters?: HistoryFilters; paginationParams?: PaginationParams } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { history: HistoryState };
      const currentEntries = state.history.entries;
      
      // Debug removed to reduce noise
      
      // Get the last entry's timestamp and ID to use as cursor for next page
      let cursor: { timestamp: string; id: string } | undefined;
      if (currentEntries.length > 0) {
        const lastEntry = currentEntries[currentEntries.length - 1];
        cursor = { 
          timestamp: lastEntry.timestamp, 
          id: lastEntry.id 
        };
        // Debug removed to reduce noise
      }
      
      // Create pagination params with cursor
      const nextPageParams = {
        limit: paginationParams?.limit || 10,
        cursor: cursor
      };
      
      // Debug removed to reduce noise
      
      const client = axiosInstance;
      const params: any = { limit: nextPageParams.limit };
      if (filters?.status) params.status = filters.status;
      if (filters?.generationType) params.generationType = filters.generationType;
      if (nextPageParams.cursor?.id) params.cursor = nextPageParams.cursor.id;
      const res = await client.get('/api/generations', { params });
      const result = res.data?.data || { items: [], nextCursor: undefined };
      
      // Handle both old array format and new pagination format
      const items = result.items || [];
      const nextCursor = result.nextCursor;
      return { entries: items, hasMore: Boolean(nextCursor), nextCursor };
    } catch (error) {
      // Keep error for visibility
      console.error('❌ Load more history failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load more history');
    }
  }
);

// Async thunk for adding and persisting history entry
const addAndSaveHistoryEntry = createAsyncThunk(
  'history/addAndSaveHistoryEntry',
  async (entry: Omit<HistoryEntry, 'id'>, { rejectWithValue }) => {
    try {
      console.log('[historySlice] addAndSaveHistoryEntry', { generationType: entry.generationType, imageCount: entry.imageCount });
      // Start a generation history record in backend for consistency
      const res = await axiosInstance.post('/api/generations', entry as any);
      const id = res.data?.data?.historyId || res.data?.data?.item?.id || Date.now().toString();
      const savedEntry: HistoryEntry = { ...entry, id };
      console.log('[historySlice] addAndSaveHistoryEntry success', { id, generationType: entry.generationType });
      return savedEntry;
    } catch (error) {
      console.error('[historySlice] addAndSaveHistoryEntry failed', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save history entry');
    }
  }
);

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addHistoryEntry: (state, action: PayloadAction<HistoryEntry>) => {
      // Add new entry at the beginning
      state.entries.unshift(action.payload);
    },
    updateHistoryEntry: (state, action: PayloadAction<{ id: string; updates: Partial<HistoryEntry> }>) => {
      const { id, updates } = action.payload;
      const index = state.entries.findIndex(entry => entry.id === id);
      if (index !== -1) {
        state.entries[index] = { ...state.entries[index], ...updates };
      }
    },
    removeHistoryEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(entry => entry.id !== action.payload);
    },
    setFilters: (state, action: PayloadAction<HistoryFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearHistory: (state) => {
      state.entries = [];
      state.hasMore = true;
      state.lastLoadedCount = 0;
    },
    clearHistoryByType: (state, action) => {
      // Clear only entries for a specific generation type
      // Normalize both the action payload and entry generationType for comparison
      const normalizeGenerationType = (type: string | undefined): string => {
        if (!type || typeof type !== 'string') return '';
        return type.replace(/[_-]/g, '-').toLowerCase();
      };
      
      const normalizedPayload = normalizeGenerationType(action.payload);
      state.entries = state.entries.filter(entry => {
        const normalizedEntryType = normalizeGenerationType(entry.generationType);
        return normalizedEntryType !== normalizedPayload;
      });
      
      // Reset pagination if we cleared all entries
      if (state.entries.length === 0) {
        state.hasMore = true;
        state.lastLoadedCount = 0;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load history
      .addCase(loadHistory.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        try {
          const pendingArg = (action as any)?.meta?.arg;
          console.log('[historySlice] loadHistory.pending', { currentFilters: state.filters, pendingArg });
        } catch {}
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.loading = false;
        
        // Always sync slice filters with the filters used for this load
        const usedFilters = (action.meta && action.meta.arg && action.meta.arg.filters) || {};
        state.filters = usedFilters;

        // If filters were provided for this load, enforce them on the results for safety
        state.entries = action.payload.entries;
        if (usedFilters && Object.keys(usedFilters).length > 0) {
          if (usedFilters.generationType) {
            // Normalize both the filter and entry generationType for comparison
            const normalizeGenerationType = (type: string | undefined): string => {
              if (!type || typeof type !== 'string') return '';
              return type.replace(/[_-]/g, '-').toLowerCase();
            };
            const normalizedFilter = normalizeGenerationType(usedFilters.generationType);
            state.entries = state.entries.filter(entry => {
              const normalizedEntryType = normalizeGenerationType(entry.generationType);
              return normalizedEntryType === normalizedFilter;
            });
          }
          if (usedFilters.model) {
            state.entries = state.entries.filter(entry => entry.model === usedFilters.model);
          }
          if (usedFilters.status) {
            state.entries = state.entries.filter(entry => entry.status === usedFilters.status);
          }
        }
        
        state.hasMore = action.payload.hasMore;
        state.lastLoadedCount = action.payload.entries.length;
        state.error = null;
        try {
          console.log('[historySlice] loadHistory.fulfilled', {
            usedFilters,
            received: action.payload.entries.length,
            hasMore: state.hasMore
          });
        } catch {}
      })
      .addCase(loadHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        try { console.warn('[historySlice] loadHistory.rejected', { error: state.error }); } catch {}
      })
      // Load more history
      .addCase(loadMoreHistory.pending, (state, action) => {
        state.loading = true;
        try { console.log('[historySlice] loadMoreHistory.pending', { currentCount: state.entries.length, currentFilters: state.filters }); } catch {}
      })
      .addCase(loadMoreHistory.fulfilled, (state, action) => {
        state.loading = false;
        
        // Filter out duplicate entries before adding
        const newEntries = action.payload.entries.filter(newEntry => 
          !state.entries.some(existingEntry => existingEntry.id === newEntry.id)
        );
        
        state.entries.push(...newEntries);
        state.hasMore = action.payload.hasMore;
        state.lastLoadedCount = newEntries.length;
        try {
          console.log('[historySlice] loadMoreHistory.fulfilled', {
            added: newEntries.length,
            total: state.entries.length,
            hasMore: state.hasMore
          });
        } catch {}
      })
      .addCase(loadMoreHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        try { console.warn('[historySlice] loadMoreHistory.rejected', { error: state.error }); } catch {}
      })
      // Add and save history entry
      .addCase(addAndSaveHistoryEntry.pending, (state) => {
        // Optional: could show loading state for saving
      })
      .addCase(addAndSaveHistoryEntry.fulfilled, (state, action) => {
        // Add the saved entry with Firebase ID to the beginning
        state.entries.unshift(action.payload);
        try {
          console.log('[historySlice] addAndSaveHistoryEntry.fulfilled', {
            id: action.payload.id,
            generationType: action.payload.generationType,
            totalEntries: state.entries.length
          });
        } catch {}
      })
      .addCase(addAndSaveHistoryEntry.rejected, (state, action) => {
        state.error = action.payload as string;
        try { console.warn('[historySlice] addAndSaveHistoryEntry.rejected', { error: state.error }); } catch {}
      });
  },
});

export const {
  addHistoryEntry,
  updateHistoryEntry,
  removeHistoryEntry,
  setFilters,
  clearFilters,
  clearHistory,
  clearHistoryByType,
  clearError,
} = historySlice.actions;

// Export the async thunk
export { addAndSaveHistoryEntry };



export default historySlice.reducer;
