import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HistoryEntry, HistoryFilters } from '@/types/history';
import { getHistoryEntries, getRecentHistory } from '@/lib/historyService';

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
    { filters, limit = 20 }: { filters?: HistoryFilters; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const entries = filters ? await getHistoryEntries(filters, limit) : await getRecentHistory();
      return { entries, hasMore: entries.length === limit };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load history');
    }
  }
);

// Async thunk for loading more history (pagination)
export const loadMoreHistory = createAsyncThunk(
  'history/loadMoreHistory',
  async (
    { filters, limit = 20 }: { filters?: HistoryFilters; limit?: number } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { history: HistoryState };
      const currentCount = state.history.entries.length;
      
      const entries = filters 
        ? await getHistoryEntries(filters, currentCount + limit)
        : await getHistoryEntries(undefined, currentCount + limit);
      
      // Return only new entries
      const newEntries = entries.slice(currentCount);
      return { entries: newEntries, hasMore: entries.length === currentCount + limit };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load more history');
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
    clearHistoryByType: (state, action: PayloadAction<string>) => {
      // Clear only entries for a specific generation type
      state.entries = state.entries.filter(entry => entry.generationType !== action.payload);
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
      .addCase(loadHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.loading = false;
        
        console.log('=== HISTORY LOADING DEBUG ===');
        console.log('Action payload entries count:', action.payload.entries.length);
        console.log('Current filters:', state.filters);
        console.log('Payload entries types:', action.payload.entries.map((e: any) => e.generationType));
        
        // If we're loading with filters, replace entries to show only filtered results
        if (state.filters && Object.keys(state.filters).length > 0) {
          console.log('Loading with filters - replacing entries');
          // Replace entries with filtered results to ensure proper separation by generation type
          state.entries = action.payload.entries;
          
          // Additional safety: double-check that all entries match the current filters
          if (state.filters.generationType) {
            const beforeCount = state.entries.length;
            state.entries = state.entries.filter(entry => entry.generationType === state.filters.generationType);
            const afterCount = state.entries.length;
            console.log(`Filtered by generationType ${state.filters.generationType}: ${beforeCount} -> ${afterCount}`);
          }
          if (state.filters.model) {
            const beforeCount = state.entries.length;
            state.entries = state.entries.filter(entry => entry.model === state.filters.model);
            const afterCount = state.entries.length;
            console.log(`Filtered by model ${state.filters.model}: ${beforeCount} -> ${afterCount}`);
          }
          if (state.filters.status) {
            const beforeCount = state.entries.length;
            state.entries = state.entries.filter(entry => entry.status === state.filters.status);
            const afterCount = state.entries.length;
            console.log(`Filtered by status ${state.filters.status}: ${beforeCount} -> ${afterCount}`);
          }
          
          console.log('Final filtered entries count:', state.entries.length);
          console.log('Final entries types:', state.entries.map((e: any) => e.generationType));
        } else {
          console.log('Loading without filters - replacing all entries');
          // If no filters, replace the entire array (for initial load or clear filters)
          state.entries = action.payload.entries;
        }
        
        state.hasMore = action.payload.hasMore;
        state.lastLoadedCount = action.payload.entries.length;
        state.error = null;
      })
      .addCase(loadHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Load more history
      .addCase(loadMoreHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadMoreHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.entries.push(...action.payload.entries);
        state.hasMore = action.payload.hasMore;
        state.lastLoadedCount = action.payload.entries.length;
      })
      .addCase(loadMoreHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
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

export default historySlice.reducer;
