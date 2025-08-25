import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HistoryEntry, HistoryFilters } from '@/types/history';
import { getHistoryEntries, getRecentHistory } from '@/lib/historyService';
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
      const result = filters ? await getHistoryEntries(filters, paginationParams) : await getRecentHistory();
      
      // Handle both old array format and new pagination format
      if (Array.isArray(result)) {
        return { entries: result, hasMore: result.length === (paginationParams?.limit || 20) };
      } else {
        return { entries: result.data, hasMore: result.hasMore, nextCursor: result.nextCursor };
      }
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
      
      console.log('🔄 LOAD MORE HISTORY DEBUG 🔄');
      console.log('Current entries count:', currentEntries.length);
      console.log('Filters:', filters);
      console.log('Pagination params:', paginationParams);
      
      // Get the last entry's timestamp and ID to use as cursor for next page
      let cursor: { timestamp: string; id: string } | undefined;
      if (currentEntries.length > 0) {
        const lastEntry = currentEntries[currentEntries.length - 1];
        cursor = { 
          timestamp: lastEntry.timestamp, 
          id: lastEntry.id 
        };
        console.log('📌 Using cursor from last entry:', cursor);
      }
      
      // Create pagination params with cursor
      const nextPageParams = {
        limit: paginationParams?.limit || 10,
        cursor: cursor
      };
      
      console.log('📤 Requesting next page with params:', nextPageParams);
      
      const result = filters 
        ? await getHistoryEntries(filters, nextPageParams)
        : await getHistoryEntries(undefined, nextPageParams);
      
      // Handle both old array format and new pagination format
      if (Array.isArray(result)) {
        console.log('⚠️ Received array format, slicing...');
        const newEntries = result.slice(currentEntries.length);
        return { entries: newEntries, hasMore: result.length === currentEntries.length + (paginationParams?.limit || 20) };
      } else {
        console.log('✅ Received pagination format');
        console.log('  - New entries:', result.data.length);
        console.log('  - Has more:', result.hasMore);
        console.log('  - Next cursor:', result.nextCursor);
        return { entries: result.data, hasMore: result.hasMore, nextCursor: result.nextCursor };
      }
    } catch (error) {
      console.error('❌ Load more history failed:', error);
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
        
        // Debug logs removed for cleaner console
        
        // If we're loading with filters, replace entries to show only filtered results
        if (state.filters && Object.keys(state.filters).length > 0) {
          // Loading with filters - replacing entries
          // Replace entries with filtered results to ensure proper separation by generation type
          state.entries = action.payload.entries;
          
          // Additional safety: double-check that all entries match the current filters
          if (state.filters.generationType) {
            const normalize = (t?: string) => (t ? t.replace(/_/g, '-').replace(/\s+/g, '') : '');
            const wanted = normalize(state.filters.generationType as string);
            state.entries = state.entries.filter(entry => normalize(entry.generationType) === wanted);
          }
          if (state.filters.model) {
            state.entries = state.entries.filter(entry => entry.model === state.filters.model);
          }
          if (state.filters.status) {
            state.entries = state.entries.filter(entry => entry.status === state.filters.status);
          }
          
          // Final filtered entries count and types logged above
        } else {
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
         
         // Filter out duplicate entries before adding
         const newEntries = action.payload.entries.filter(newEntry => 
           !state.entries.some(existingEntry => existingEntry.id === newEntry.id)
         );
         
         state.entries.push(...newEntries);
         state.hasMore = action.payload.hasMore;
         state.lastLoadedCount = newEntries.length;
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
