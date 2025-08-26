import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HistoryEntry, HistoryFilters } from '@/types/history';

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

// Async thunk for loading history (now just returns existing entries from state)
export const loadHistory = createAsyncThunk(
  'history/loadHistory',
  async (
    { filters, limit = 20 }: { filters?: HistoryFilters; limit?: number } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { history: HistoryState };
      let entries = state.history.entries;
      
      // Apply filters if provided
      if (filters) {
        entries = entries.filter(entry => {
          if (filters.model && entry.model !== filters.model) return false;
          if (filters.generationType && entry.generationType !== filters.generationType) return false;
          if (filters.status && entry.status !== filters.status) return false;
          if (filters.dateRange) {
            const entryDate = new Date(entry.timestamp);
            if (entryDate < filters.dateRange.start || entryDate > filters.dateRange.end) return false;
          }
          return true;
        });
      }
      
      // Apply limit
      const limitedEntries = entries.slice(0, limit);
      return { entries: limitedEntries, hasMore: entries.length > limit };
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
      let entries = state.history.entries;
      
      // Apply filters if provided
      if (filters) {
        entries = entries.filter(entry => {
          if (filters.model && entry.model !== filters.model) return false;
          if (filters.generationType && entry.generationType !== filters.generationType) return false;
          if (filters.status && entry.status !== filters.status) return false;
          if (filters.dateRange) {
            const entryDate = new Date(entry.timestamp);
            if (entryDate < filters.dateRange.start || entryDate > filters.dateRange.end) return false;
          }
          return true;
        });
      }
      
      const currentCount = state.history.lastLoadedCount;
      const newEntries = entries.slice(currentCount, currentCount + limit);
      return { entries: newEntries, hasMore: entries.length > currentCount + limit };
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
        state.entries = action.payload.entries;
        state.hasMore = action.payload.hasMore;
        state.lastLoadedCount = action.payload.entries.length;
      })
      .addCase(loadHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Load more history
      .addCase(loadMoreHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMoreHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.entries.push(...action.payload.entries);
        state.hasMore = action.payload.hasMore;
        state.lastLoadedCount += action.payload.entries.length;
      })
      .addCase(loadMoreHistory.rejected, (state) => {
        state.loading = false;
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
  clearError,
} = historySlice.actions;

export default historySlice.reducer;
