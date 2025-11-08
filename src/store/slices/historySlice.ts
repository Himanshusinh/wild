import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HistoryEntry, HistoryFilters } from '@/types/history';
import axiosInstance from '@/lib/axiosInstance';
import { PaginationParams, PaginationResult } from '@/lib/paginationUtils';

// Map UI generation types to backend-expected values
const mapGenerationTypeForBackend = (type?: string): string | undefined => {
  if (!type) return type;
  const normalized = type.toLowerCase();
  switch (normalized) {
    // Backend stores 'logo' (not 'logo-generation')
    case 'logo-generation':
      return 'logo';
    // Branding kit: backend expects these values exactly as-is
    case 'sticker-generation':
    case 'product-generation':
    case 'mockup-generation':
    case 'ad-generation':
    case 'text-to-image':
    case 'text-to-character':
      return normalized;
    // Video variants mapping kept only if backend expects snake-case for those endpoints (not used by branding kit pages)
    case 'image-to-video':
      return 'image-to-video';
    case 'video-to-video':
      return 'video-to-video';
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
    { filters, paginationParams, requestOrigin, expectedType, debugTag }: { filters?: HistoryFilters; paginationParams?: PaginationParams; requestOrigin?: 'central' | 'page' | 'character-modal'; expectedType?: string; debugTag?: string } = {},
    { rejectWithValue, getState, signal }
  ) => {
    try {
      // Early bailout to avoid stale requests if navigation changed after condition check
      const state: any = getState();
      const normalize = (t?: string) => (t ? String(t).replace(/[_-]/g, '-').toLowerCase() : '');
      const uiType: string = (state && state.ui && state.ui.currentGenerationType) || 'text-to-image';
      const currentType = normalize(uiType === 'image-to-image' ? 'text-to-image' : uiType);
      const expected = normalize(expectedType);
      // Allow logo/logo-generation synonym
      // Allow character-modal requests to bypass UI type check
      const isCharacterModal = requestOrigin === 'character-modal';
      const expectedMatches = !expected || expected === currentType || (expected === 'logo' && currentType === 'logo-generation') || (expected === 'logo-generation' && currentType === 'logo') || isCharacterModal;
      if (!expectedMatches) {
        try { console.log('[historySlice] loadHistory.abort-before-request: expectedType changed', { expected, currentType, debugTag }); } catch {}
        return rejectWithValue('__CONDITION_ABORT__');
      }
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
      const res = await client.get('/api/generations', { params, signal });
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
    } catch (error: any) {
      if (error === '__CONDITION_ABORT__' || (typeof error?.message === 'string' && error.message === '__CONDITION_ABORT__')) {
        return rejectWithValue('__CONDITION_ABORT__');
      }
      // If axios was aborted via signal, treat as silent
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
        try { console.log('[historySlice] loadHistory.aborted', { debugTag }); } catch {}
        return rejectWithValue('__CONDITION_ABORT__');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load history');
    }
  },
  {
    condition: (args = {} as any, { getState }) => {
      try {
        const state: any = getState();
        const uiType: string = (state && state.ui && state.ui.currentGenerationType) || 'text-to-image';
        const normalize = (t?: string) => (t ? String(t).replace(/[_-]/g, '-').toLowerCase() : '');
        const isVideoType = (t: string) => ['text-to-video','image-to-video','video-to-video','video','video-generation'].includes(normalize(t));
        const currentType = normalize(uiType === 'image-to-image' ? 'text-to-image' : uiType);
        const expected = normalize((args as any)?.expectedType);
        const origin = (args as any)?.requestOrigin;
        const debugTag = (args as any)?.debugTag;
        const fType = normalize((args as any)?.filters?.generationType);
        const fMode = (args as any)?.filters?.mode;

        // Global guard: if caller provided an expectedType and it no longer matches current UI type, skip for any origin
        // Exception: character-modal requests can bypass this check
        const isCharacterModal = origin === 'character-modal';
        if (expected && expected !== currentType && !(expected === 'logo' && currentType === 'logo-generation') && !(expected === 'logo-generation' && currentType === 'logo') && !isCharacterModal) {
          try { console.log('[historySlice] loadHistory.condition SKIP: expectedType changed (any-origin)', { origin, expected, currentType, debugTag }); } catch {}
          return false;
        }
        // Only gatekeep central-origin requests; page-origin always allowed
        if (origin === 'central') {
          // If filter is a specific generationType, ensure it matches current UI type
          if (fType) {
            if (fType !== currentType && !(fType === 'logo' && currentType === 'logo-generation') && !(fType === 'logo-generation' && currentType === 'logo')) {
              console.log('[historySlice] loadHistory.condition SKIP central: type mismatch', { fType, currentType, debugTag });
              return false;
            }
          }
          // If filter is a video mode, ensure UI is on a video type
          if (fMode === 'video' && !isVideoType(currentType)) {
            console.log('[historySlice] loadHistory.condition SKIP central: not on video type', { currentType, debugTag });
            return false;
          }
        }
        console.log('[historySlice] loadHistory.condition OK', { origin, currentType, fType, fMode, expected, debugTag });
        return true;
      } catch {
        return true;
      }
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
        const typeMatches = (entryType?: string, filterType?: string): boolean => {
          if (!filterType) return true;
          if (entryType === filterType) return true;
          const e = normalizeGenerationType(entryType);
          const f = normalizeGenerationType(filterType);
          if (e === f) return true;
          // Synonyms old/new naming
          if ((f === 'logo' && e === 'logo-generation') || (f === 'logo-generation' && e === 'logo')) return true;
          if ((f === 'sticker-generation' && e === 'sticker') || (f === 'sticker' && e === 'sticker-generation')) return true;
          if ((f === 'product-generation' && e === 'product') || (f === 'product' && e === 'product-generation')) return true;
          return false;
        };
        const matchesFilters = (entry: any): boolean => {
          // Generation type filter
          if (filters?.generationType && !typeMatches(entry.generationType, filters.generationType)) {
            return false;
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
      const synonymSet = new Set<string>([normalizedPayload]);
      // Expand synonyms so that 'logo' clears 'logo-generation' too, etc.
      if (normalizedPayload === 'logo') synonymSet.add('logo-generation');
      if (normalizedPayload === 'logo-generation') synonymSet.add('logo');
      if (normalizedPayload === 'sticker') synonymSet.add('sticker-generation');
      if (normalizedPayload === 'sticker-generation') synonymSet.add('sticker');
      if (normalizedPayload === 'product') synonymSet.add('product-generation');
      if (normalizedPayload === 'product-generation') synonymSet.add('product');
      if (normalizedPayload === 'video' || normalizedPayload === 'video-generation') {
        synonymSet.add('text-to-video');
        synonymSet.add('image-to-video');
        synonymSet.add('video-to-video');
      }
      state.entries = state.entries.filter(entry => {
        const normalizedEntryType = normalizeGenerationType(entry.generationType);
        return !synonymSet.has(normalizedEntryType);
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
          console.log('[historySlice] loadHistory.pending', { currentFilters: state.filters, pendingArg, debugTag: pendingArg?.debugTag });
        } catch {}
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.inFlight = false;
        state.currentRequestKey = null;
        
        // Always sync slice filters with the filters used for this load
        const usedFilters = (action.meta && action.meta.arg && action.meta.arg.filters) || {};
        state.filters = usedFilters;

        // Apply a safe, synonym-aware filter when a generationType is requested
        state.entries = action.payload.entries;
        const usedType = (usedFilters as any)?.generationType as string | undefined;
        if (usedType) {
          const normalize = (t?: string): string => (t ? String(t).replace(/[_-]/g, '-').toLowerCase() : '');
          const matchesType = (entryType?: string): boolean => {
            const e = normalize(entryType);
            const f = normalize(usedType);
            if (e === f) return true;
            // logo synonyms
            if ((f === 'logo' && e === 'logo-generation') || (f === 'logo-generation' && e === 'logo')) return true;
            // sticker synonyms
            if ((f === 'sticker-generation' && e === 'sticker') || (f === 'sticker' && e === 'sticker-generation')) return true;
            if ((f === 'sticker-generation' && e === 'sticker-generation') || (f === 'sticker' && e === 'sticker')) return true;
            // product synonyms
            if ((f === 'product-generation' && e === 'product') || (f === 'product' && e === 'product-generation')) return true;
            if ((f === 'product-generation' && e === 'product-generation') || (f === 'product' && e === 'product')) return true;
            // text-to-character exact match
            if (f === 'text-to-character' && e === 'text-to-character') return true;
            return false;
          };
          state.entries = state.entries.filter((it: any) => matchesType(it?.generationType));
        }
        
        state.hasMore = action.payload.hasMore;
        state.lastLoadedCount = action.payload.entries.length;
        state.error = null;
        try {
          const debugTag = (action as any)?.meta?.arg?.debugTag;
          console.log('[historySlice] loadHistory.fulfilled', {
            usedFilters,
            received: action.payload.entries.length,
            hasMore: state.hasMore,
            debugTag
          });
        } catch {}
      })
      .addCase(loadHistory.rejected, (state, action) => {
        state.loading = false;
        state.inFlight = false;
        state.currentRequestKey = null;
        if (action.payload === '__CONDITION_ABORT__') {
          // Silent abort due to navigation/type change; do not set error
          try {
            const debugTag = (action as any)?.meta?.arg?.debugTag;
            console.log('[historySlice] loadHistory.rejected (silent abort)', { debugTag });
          } catch {}
          return;
        }
        state.error = action.payload as string;
        try {
          const debugTag = (action as any)?.meta?.arg?.debugTag;
          console.warn('[historySlice] loadHistory.rejected', { error: state.error, debugTag });
        } catch {}
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
        let newEntries = action.payload.entries.filter((newEntry: HistoryEntry) => 
          !state.entries.some((existingEntry: HistoryEntry) => existingEntry.id === newEntry.id)
        );

        // Enforce requested generationType for pagination as well
        const usedType = ((action.meta as any)?.arg?.filters?.generationType || state.filters?.generationType) as string | undefined;
        if (usedType) {
          const normalize = (t?: string): string => (t ? String(t).replace(/[_-]/g, '-').toLowerCase() : '');
          const matchesType = (entryType?: string): boolean => {
            const e = normalize(entryType);
            const f = normalize(usedType);
            if (e === f) return true;
            if ((f === 'logo' && e === 'logo-generation') || (f === 'logo-generation' && e === 'logo')) return true;
            if ((f === 'sticker-generation' && e === 'sticker') || (f === 'sticker' && e === 'sticker-generation')) return true;
            if ((f === 'product-generation' && e === 'product') || (f === 'product' && e === 'product-generation')) return true;
            return false;
          };
          newEntries = newEntries.filter((it: any) => matchesType(it?.generationType));
        }
        
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
