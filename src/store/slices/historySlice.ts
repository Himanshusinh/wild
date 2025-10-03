import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HistoryEntry, HistoryFilters } from '@/types/history';
import axiosInstance from '@/lib/axiosInstance';
import { PaginationParams, PaginationResult } from '@/lib/paginationUtils';

// Map UI generation types to backend-expected values
const mapGenerationTypeForBackend = (type?: string): string | undefined => {
  if (!type) return type;
  const normalized = type.toLowerCase();
  switch (normalized) {
    case 'logo-generation':
      return 'logo';
    case 'image-to-video':
      return 'image_to_video';
    case 'video-to-video':
      return 'video_to_video';
    default:
      return type;
  }
};

// Map frontend model values to backend SKU identifiers for filtering/history
const mapModelSkuForBackend = (frontendValue?: string): string | undefined => {
  if (!frontendValue) return frontendValue;
  switch (frontendValue) {
    // Runway
    case 'gen4_turbo':
      return 'runway_gen4_turbo';
    case 'gen3a_turbo':
      return 'runway_gen3a_turbo';
    case 'gen4_aleph':
      return 'runway_gen4_aleph';
    // MiniMax
    case 'MiniMax-Hailuo-02':
      return 'minimax_hailuo_02';
    case 'I2V-01-Director':
      return 'minimax_i2v_01_director';
    case 'S2V-01':
      return 'minimax_s2v_01';
    // Default: lowercase and replace non-alphanumerics with underscores
    default:
      return String(frontendValue).toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }
};

interface HistoryState {
  entries: HistoryEntry[];
  loading: boolean;
  error: string | null;
  filters: HistoryFilters;
  hasMore: boolean;
  lastLoadedCount: number;
  inFlight: boolean;
  currentRequestKey: string | null;
}

const initialState: HistoryState = {
  entries: [],
  loading: false,
  error: null,
  filters: {},
  hasMore: true,
  lastLoadedCount: 0,
  inFlight: false,
  currentRequestKey: null,
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
      if (filters?.generationType) params.generationType = mapGenerationTypeForBackend(filters.generationType);
      if ((filters as any)?.mode && typeof (filters as any).mode === 'string') (params as any).mode = (filters as any).mode;
      if (filters?.model) params.model = mapModelSkuForBackend(filters.model);
      if (paginationParams?.limit) params.limit = paginationParams.limit;
      if ((paginationParams as any)?.cursor?.id) params.cursor = (paginationParams as any).cursor.id;
      // Sorting support
      (params as any).sortBy = 'createdAt';
      if ((filters as any)?.sortOrder) (params as any).sortOrder = (filters as any).sortOrder;
      // Serialize date range if present (ISO strings)
      if ((filters as any)?.dateRange && (filters as any).dateRange.start && (filters as any).dateRange.end) {
        const dr = (filters as any).dateRange as any;
        (params as any).dateStart = typeof dr.start === 'string' ? dr.start : new Date(dr.start).toISOString();
        (params as any).dateEnd = typeof dr.end === 'string' ? dr.end : new Date(dr.end).toISOString();
      }
      const res = await client.get('/api/generations', { params });
      const result = res.data?.data || { items: [], nextCursor: undefined };

      // Normalize dates so UI always has a valid timestamp (ISO)
      // Filter out failed generations
      const items = (result.items || [])
        .filter((it: any) => it?.status !== 'failed') // Filter out failed generations
        .map((it: any) => {
          const created = it?.createdAt || it?.updatedAt || it?.timestamp;
          const iso = typeof created === 'string' ? created : (created && created.toString ? created.toString() : undefined);
          const timestamp = iso || new Date().toISOString();
          return {
            ...it,
            timestamp,
            createdAt: it?.createdAt || timestamp,
          };
        });
      const nextCursor = result.nextCursor;
      return { entries: items, hasMore: Boolean(nextCursor), nextCursor };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load history');
    }
  },
  {
    condition: (
      { filters, paginationParams }: { filters?: HistoryFilters; paginationParams?: PaginationParams } = {},
      { getState }
    ) => {
      const state = getState() as { history: HistoryState };
      const { loading, inFlight, currentRequestKey } = state.history;
      const key = JSON.stringify({ type: 'load', filters: filters || {}, limit: paginationParams?.limit || 10, cursor: (paginationParams as any)?.cursor?.id });
      if (loading || inFlight) {
        try { console.log('[historySlice] loadHistory.condition SKIP: already loading', { currentRequestKey }); } catch {}
        return false;
      }
      if (currentRequestKey === key) {
        try { console.log('[historySlice] loadHistory.condition SKIP: duplicate key', { key }); } catch {}
        return false;
      }
      try { console.log('[historySlice] loadHistory.condition OK', { key }); } catch {}
      return true;
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
        const normalizeGenerationType = (type?: string): string => {
          if (!type || typeof type !== 'string') return '';
          return type.replace(/[_-]/g, '-').toLowerCase();
        };
        const matchesFilters = (entry: any): boolean => {
          // Generation type filter
          if (filters?.generationType) {
            const e = normalizeGenerationType(entry.generationType);
            const f = normalizeGenerationType(filters.generationType);
            if (e !== f && !(f === 'logo' && e === 'logo-generation') && !(f === 'logo-generation' && e === 'logo')) {
              return false;
            }
          }
          // Mode filter (video groups t2v/i2v/v2v)
          if ((filters as any)?.mode === 'video') {
            const e = normalizeGenerationType(entry.generationType);
            const isVideo = e === 'text-to-video' || e === 'image-to-video' || e === 'video-to-video' || e === 'video_generation' || e === 'video';
            if (!isVideo) return false;
          }
          // Model filter (if provided)
          if (filters?.model && entry.model !== filters.model) return false;
          // Status filter (if provided)
          if (filters?.status && entry.status !== filters.status) return false;
          return true;
        };

        const filteredEntries = currentEntries.filter(matchesFilters);
        if (filteredEntries.length > 0) {
          const lastEntry = filteredEntries[filteredEntries.length - 1];
          cursor = { timestamp: lastEntry.timestamp, id: lastEntry.id };
        }
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
      if (filters?.generationType) params.generationType = mapGenerationTypeForBackend(filters.generationType);
      if ((filters as any)?.mode && typeof (filters as any).mode === 'string') (params as any).mode = (filters as any).mode;
      if (filters?.model) params.model = mapModelSkuForBackend(filters.model);
      if (nextPageParams.cursor?.id) params.cursor = nextPageParams.cursor.id;
      // Sorting support
      (params as any).sortBy = 'createdAt';
      if ((filters as any)?.sortOrder) (params as any).sortOrder = (filters as any).sortOrder;
      if ((filters as any)?.dateRange && (filters as any).dateRange.start && (filters as any).dateRange.end) {
        const dr = (filters as any).dateRange as any;
        (params as any).dateStart = typeof dr.start === 'string' ? dr.start : new Date(dr.start).toISOString();
        (params as any).dateEnd = typeof dr.end === 'string' ? dr.end : new Date(dr.end).toISOString();
      }
      const res = await client.get('/api/generations', { params });
      const result = res.data?.data || { items: [], nextCursor: undefined };

      // Normalize dates so UI always has a valid timestamp (ISO)
      // Filter out failed generations
      const items = (result.items || [])
        .filter((it: any) => it?.status !== 'failed') // Filter out failed generations
        .map((it: any) => {
          const created = it?.createdAt || it?.updatedAt || it?.timestamp;
          const iso = typeof created === 'string' ? created : (created && created.toString ? created.toString() : undefined);
          const timestamp = iso || new Date().toISOString();
          return {
            ...it,
            timestamp,
            createdAt: it?.createdAt || timestamp,
          };
        });
      const nextCursor = result.nextCursor;
      return { entries: items, hasMore: Boolean(nextCursor), nextCursor };
    } catch (error) {
      // Keep error for visibility
      console.error('❌ Load more history failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load more history');
    }
  },
  {
    condition: (
      _args: { filters?: HistoryFilters; paginationParams?: PaginationParams } = {},
      { getState }
    ) => {
      const state = getState() as { history: HistoryState };
      const { loading, inFlight, hasMore } = state.history;
      if (loading || inFlight) {
        try { console.log('[historySlice] loadMoreHistory.condition SKIP: already loading'); } catch {}
        return false;
      }
      if (!hasMore) {
        try { console.log('[historySlice] loadMoreHistory.condition SKIP: no more pages'); } catch {}
        return false;
      }
      try { console.log('[historySlice] loadMoreHistory.condition OK'); } catch {}
      return true;
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
        state.inFlight = true;
        try {
          const pendingArg = (action as any)?.meta?.arg;
          state.currentRequestKey = JSON.stringify({ type: 'load', filters: pendingArg?.filters || {}, limit: pendingArg?.paginationParams?.limit || 10, cursor: pendingArg?.paginationParams?.cursor?.id });
        } catch { state.currentRequestKey = 'unknown'; }
        state.error = null;
        try {
          const pendingArg = (action as any)?.meta?.arg;
          console.log('[historySlice] loadHistory.pending', { currentFilters: state.filters, pendingArg });
        } catch {}
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.inFlight = false;
        state.currentRequestKey = null;
        
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
            const matchesType = (entryType: string | undefined, filterType: string): boolean => {
              const e = normalizeGenerationType(entryType);
              const f = normalizeGenerationType(filterType);
              if (e === f) return true;
              // Handle synonyms between old/new naming
              if ((f === 'logo' && e === 'logo-generation') || (f === 'logo-generation' && e === 'logo')) return true;
              return false;
            };
            const filterBefore = state.entries.length;
            state.entries = state.entries.filter(entry => matchesType(entry.generationType as any, usedFilters.generationType as any));
            try { console.log('[historySlice] filter by type', { requested: usedFilters.generationType, before: filterBefore, after: state.entries.length }); } catch {}
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
        state.inFlight = false;
        state.currentRequestKey = null;
        state.error = action.payload as string;
        try { console.warn('[historySlice] loadHistory.rejected', { error: state.error }); } catch {}
      })
      // Load more history
      .addCase(loadMoreHistory.pending, (state, action) => {
        state.loading = true;
        state.inFlight = true;
        try {
          const pendingArg = (action as any)?.meta?.arg;
          state.currentRequestKey = JSON.stringify({ type: 'loadMore', filters: pendingArg?.filters || {}, limit: pendingArg?.paginationParams?.limit || 10 });
        } catch { state.currentRequestKey = 'unknown'; }
        try { console.log('[historySlice] loadMoreHistory.pending', { currentCount: state.entries.length, currentFilters: state.filters }); } catch {}
      })
      .addCase(loadMoreHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.inFlight = false;
        state.currentRequestKey = null;
        
        // Filter out duplicate entries before adding
        const newEntries = action.payload.entries.filter((newEntry: HistoryEntry) => 
          !state.entries.some((existingEntry: HistoryEntry) => existingEntry.id === newEntry.id)
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
        state.inFlight = false;
        state.currentRequestKey = null;
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
