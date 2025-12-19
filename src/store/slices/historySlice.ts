const MODE_FILTER_MAP: Record<string, Set<string>> = {
  image: new Set([
    'text-to-image',
    'image-to-image',
    'image-upscale',
    'image-edit',
    'image-to-svg',
    'image-vectorize',
    'vectorize',
    'image-generation',
    'image',
  ]),
  video: new Set([
    'text-to-video',
    'image-to-video',
    'video-to-video',
    'video-generation',
    'video-edit',
    'video',
  ]),
  music: new Set([
    'text-to-music',
    'text-to-speech',
    'tts',
    'text-to-dialogue',
    'dialogue',
    'sound-effects',
    'sfx',
    'text-to-audio',
    'audio-generation',
    'music',
    'audio',
  ]),
  branding: new Set([
    'logo',
    'logo-generation',
    'sticker-generation',
    'product-generation',
    'ad-generation',
    'mockup-generation',
    'branding-kit',
    'branding',
  ]),
};
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HistoryEntry, HistoryFilters } from '@/types/history';
import axiosInstance from '@/lib/axiosInstance';
import { PaginationParams, PaginationResult } from '@/lib/paginationUtils';

// Map UI generation types to backend-expected values
const mapGenerationTypeForBackend = (type?: string | string[]): string | string[] | undefined => {
  if (!type) return type;
  // Handle array of types
  if (Array.isArray(type)) {
    return type.map(t => mapGenerationTypeForBackend(t) as string).filter(Boolean);
  }
  const normalized = type.toLowerCase();
  // Synonym mapping for operations (try canonical underscore forms first)
  const opSynonyms: Record<string,string> = {
    'image-upscale': 'image_upscale',
    'image_upscale': 'image_upscale',
    'upscale': 'image_upscale',
    'image-edit': 'image_edit',
    'image_edit': 'image_edit',
    'edit-image': 'image_edit',
    'edit_image': 'image_edit',
    'image-to-svg': 'image_to_svg',
    'image_to_svg': 'image_to_svg',
    'vectorize': 'image_to_svg',
    'image-vectorize': 'image_to_svg'
  };
  if (opSynonyms[normalized]) return opSynonyms[normalized];
  switch (normalized) {
    case 'logo-generation':
      return 'logo';
    case 'sticker-generation':
    case 'product-generation':
    case 'mockup-generation':
    case 'ad-generation':
    case 'text-to-image':
    case 'text-to-character':
      return normalized;
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
  nextCursor: string | number | null;
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
  nextCursor: null,
};

// Async thunk for loading history
export const loadHistory = createAsyncThunk(
  'history/loadHistory',
  async (
    { filters, backendFilters, paginationParams, requestOrigin, expectedType, debugTag, forceRefresh, skipBackendGenerationFilter }: { filters?: HistoryFilters; backendFilters?: HistoryFilters; paginationParams?: PaginationParams; requestOrigin?: 'central' | 'page' | 'character-modal'; expectedType?: string; debugTag?: string; forceRefresh?: boolean; skipBackendGenerationFilter?: boolean } = {},
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
        return rejectWithValue('__CONDITION_ABORT__');
      }
      const client = axiosInstance;
      const filtersForBackend = backendFilters || filters;
      const params: any = {};
      if (filtersForBackend?.status) params.status = filtersForBackend.status;
      // Always send canonical generationType to backend unless instructed otherwise
      // while still performing client-side legacy inclusions for mis-labeled audio entries.
      const canonicalAudioType = (incoming: string | string[] | undefined): string | string[] | undefined => {
        if (!incoming) return incoming;
        const arr = Array.isArray(incoming) ? incoming : [incoming];
        const norm = (v: string) => v.replace(/[_-]/g,'-').toLowerCase();
        // Backend now accepts audio generationType values, so we can send them directly
        // But still normalize them to canonical forms
        const normalized = arr.map(t => {
          const n = norm(t);
          // Map common variations to canonical forms
          if (n === 'tts' || n === 'text_to_speech') return 'text-to-speech';
          if (n === 'sound_effect' || n === 'sound-effects' || n === 'sound_effects') return 'sfx';
          if (n === 'dialogue' || n === 'text_to_dialogue') return 'text-to-dialogue';
          if (n === 'voice-cloning') return 'voicecloning';
          return t;
        });
        return normalized.length === 1 ? normalized[0] : normalized;
      };
      if (filtersForBackend?.generationType) {
        // If backendFilters is explicitly provided, send generationType directly to backend
        // Backend validation now accepts audio types, so we can send them
        if (backendFilters && !skipBackendGenerationFilter) {
          // Normalize audio types to canonical forms before sending
          const normalized = canonicalAudioType(filtersForBackend.generationType as any);
          params.generationType = normalized;
        } else {
        const mapped = canonicalAudioType(filtersForBackend.generationType as any);
        if (mapped && !skipBackendGenerationFilter) params.generationType = mapped;
        }
      }
      if ((filtersForBackend as any)?.mode && typeof (filtersForBackend as any).mode === 'string') (params as any).mode = (filtersForBackend as any).mode;
      if (filtersForBackend?.model) params.model = mapModelSkuForBackend(filtersForBackend.model);
      // Add search parameter if present
      if ((filtersForBackend as any)?.search && typeof (filtersForBackend as any).search === 'string' && (filtersForBackend as any).search.trim()) {
        params.search = (filtersForBackend as any).search.trim();
      }
      if (paginationParams?.limit) params.limit = paginationParams.limit;
      if ((paginationParams as any)?.cursor?.id) params.cursor = (paginationParams as any).cursor.id;
  // Use optimized backend pagination defaults (createdAt DESC) by omitting sortBy/sortOrder
      // Serialize date range if present (ISO strings)
      if ((filtersForBackend as any)?.dateRange && (filtersForBackend as any).dateRange.start && (filtersForBackend as any).dateRange.end) {
        const dr = (filtersForBackend as any).dateRange as any;
        (params as any).dateStart = typeof dr.start === 'string' ? dr.start : new Date(dr.start).toISOString();
        (params as any).dateEnd = typeof dr.end === 'string' ? dr.end : new Date(dr.end).toISOString();
      }
  // Always request createdAt sorting explicitly
  params.sortBy = 'createdAt';
  // Always honor caller-provided sortOrder so backend returns matching order (asc/desc)
  if ((filtersForBackend as any)?.sortOrder === 'asc' || (filtersForBackend as any)?.sortOrder === 'desc') {
    params.sortOrder = (filtersForBackend as any).sortOrder;
  }
  
  console.log('[HistorySlice] ========== loadHistory API CALL ==========');
  console.log('[HistorySlice] Request params:', {
    filters,
    paginationParams,
    requestOrigin,
    expectedType,
    debugTag,
    finalParams: params,
  });
  console.log('[HistorySlice] Making API call to /api/generations...');
  
  const res = await client.get('/api/generations', { params, signal });
  
  console.log('[HistorySlice] API response received:', {
    status: res.status,
    hasData: !!res.data,
    hasDataData: !!res.data?.data,
    itemsCount: res.data?.data?.items?.length || 0,
    hasMore: res.data?.data?.hasMore,
    nextCursor: res.data?.data?.nextCursor ? 'yes' : 'no',
  });
  
  let result = res.data?.data || { items: [], nextCursor: undefined };
  
  console.log('[HistorySlice] Processed result:', {
    itemsCount: Array.isArray(result.items) ? result.items.length : 0,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor ? 'yes' : 'no',
  });

      // Fallback: if filtered request returned zero items and we used a generationType filter,
      // avoid sending invalid synonyms. Only try removing the generationType filter once to broaden.
      if (Array.isArray(result.items) && result.items.length === 0 && params.generationType) {
        const removed = String(params.generationType);
        try {
          const broadParams = { ...params } as any;
          delete broadParams.generationType;
          broadParams.sortBy = 'createdAt';
          const broadRes = await client.get('/api/generations', { params: broadParams, signal });
          const broadData = broadRes.data?.data || { items: [], nextCursor: undefined };
          if (Array.isArray(broadData.items) && broadData.items.length > 0) {
            result = broadData;
          }
        } catch {
          // ignore
        }
      }

      // Normalize dates so UI always has a valid timestamp (ISO)
      const items = (result.items || [])
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
      
      // Backend returns hasMore (preferred). If absent, infer using RAW item count before filtering failures.
      const requestedLimit = (paginationParams && paginationParams.limit) || 10;
      const rawItemCount = Array.isArray(result.items) ? result.items.length : 0;
      let hasMore: boolean;
      if (result.hasMore !== undefined) {
        hasMore = Boolean(result.hasMore);
      } else {
        // Legacy inference: if raw items met or exceeded limit AND nextCursor exists => more pages.
        hasMore = rawItemCount >= requestedLimit && Boolean(result.nextCursor);
      }
      const nextCursor = result.nextCursor;

      return { entries: items, hasMore, nextCursor };
    } catch (error: any) {
      if (error === '__CONDITION_ABORT__' || (typeof error?.message === 'string' && error.message === '__CONDITION_ABORT__')) {
        return rejectWithValue('__CONDITION_ABORT__');
      }
      // If axios was aborted via signal, treat as silent
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
        return rejectWithValue('__CONDITION_ABORT__');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load history');
    }
  },
  {
    condition: (args = {} as any, { getState }) => {
      try {
        // If forceRefresh is true, always allow the API call (bypass all checks)
        if ((args as any)?.forceRefresh === true) {
          console.log('[HistorySlice] forceRefresh=true - bypassing condition check, allowing API call');
          return true;
        }
        
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
          return false;
        }
        // Only gatekeep central-origin requests; page-origin always allowed
        if (origin === 'central') {
          // If filter is a specific generationType, ensure it matches current UI type
          if (fType) {
            if (fType !== currentType && !(fType === 'logo' && currentType === 'logo-generation') && !(fType === 'logo-generation' && currentType === 'logo')) {
              return false;
            }
          }
          // If filter is a video mode, ensure UI is on a video type
          if (fMode === 'video' && !isVideoType(currentType)) {
            return false;
          }
        }
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
    { filters, backendFilters, paginationParams }: { filters?: HistoryFilters; backendFilters?: HistoryFilters; paginationParams?: PaginationParams } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      console.log('[HistorySlice] ========== loadMoreHistory CALLED ==========');
      console.log('[HistorySlice] Request params:', {
        filters,
        paginationParams,
      });
      
      const state = getState() as { history: HistoryState };
      const currentEntries = state.history.entries;
      
      console.log('[HistorySlice] Current state before loadMore:', {
        currentEntriesCount: currentEntries.length,
        hasMore: state.history.hasMore,
        loading: state.history.loading,
      });
      
      // Debug removed to reduce noise
      
  // Stored cursor from previous API response (can be timestamp or legacy doc id)
  const storedNextCursor = state.history.nextCursor;
  let cursor: { timestamp: string; id: string } | undefined;
  
  // Always compute a legacy cursor from the last entry so we can paginate reliably.
  // Timestamp-based cursors can skip ranges depending on backend semantics; doc-id cursors are stable.
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
          if (filters?.generationType) {
            const filterType = filters.generationType;
            if (Array.isArray(filterType)) {
              // If it's an array, check if any type matches
              if (!filterType.some(ft => typeMatches(entry.generationType, ft))) {
                return false;
              }
            } else {
              // If it's a string, use existing logic
              if (!typeMatches(entry.generationType, filterType)) {
                return false;
              }
            }
          }
          const modeFilter = (filters as any)?.mode ? String((filters as any).mode).toLowerCase() : null;
          if (modeFilter) {
            const e = normalizeGenerationType(entry.generationType);
            const allowedTypes = MODE_FILTER_MAP[modeFilter];
            if (allowedTypes && !allowedTypes.has(e)) {
              return false;
            }
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
      
      // Normalize audio types to canonical forms
      const canonicalAudioType = (incoming: string | string[] | undefined): string | string[] | undefined => {
        if (!incoming) return incoming;
        const arr = Array.isArray(incoming) ? incoming : [incoming];
        const norm = (v: string) => v.replace(/[_-]/g,'-').toLowerCase();
        // Map common variations to canonical forms
        const normalized = arr.map(t => {
          const n = norm(t);
          if (n === 'tts' || n === 'text_to_speech') return 'text-to-speech';
          if (n === 'sound_effect' || n === 'sound-effects' || n === 'sound_effects') return 'sfx';
          if (n === 'dialogue' || n === 'text_to_dialogue') return 'text-to-dialogue';
          if (n === 'voice-cloning') return 'voicecloning';
          return t;
        });
        return normalized.length === 1 ? normalized[0] : normalized;
      };
      
      const filtersForBackend = backendFilters || filters;
      
      // Only include generationType if explicitly provided in backendFilters
      // When no search, don't send generationType array - rely on mode: 'image' only
      if (filtersForBackend?.generationType && backendFilters) {
        // Backend validation now accepts audio types, so normalize and send them
        const normalized = canonicalAudioType(filtersForBackend.generationType as any);
        // Only set if it's actually an array or string (not undefined)
        if (normalized) {
          params.generationType = normalized;
      }
      }
      // Don't set generationType if not in backendFilters - let mode handle it
      if ((filtersForBackend as any)?.mode && typeof (filtersForBackend as any).mode === 'string') (params as any).mode = (filtersForBackend as any).mode;
      if (filtersForBackend?.model) params.model = mapModelSkuForBackend(filtersForBackend.model);
      // Add search parameter if present (check both filtersForBackend and filters)
      const searchQuery = (filtersForBackend as any)?.search || (filters as any)?.search;
      if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      // Always honor caller-provided sortOrder so backend returns matching order (asc/desc)
      if ((filtersForBackend as any)?.sortOrder === 'asc' || (filtersForBackend as any)?.sortOrder === 'desc') {
        params.sortOrder = (filtersForBackend as any).sortOrder;
      } else if ((filters as any)?.sortOrder === 'asc' || (filters as any)?.sortOrder === 'desc') {
        params.sortOrder = (filters as any).sortOrder;
      }

      const wantsDateFilter = Boolean((filtersForBackend as any)?.dateRange && (filtersForBackend as any).dateRange.start && (filtersForBackend as any).dateRange.end);

      // Always paginate with LEGACY cursor (document ID) for stability.
      // This avoids missing-day gaps caused by timestamp cursor semantics.
      // Prefer stored cursor if it's a non-numeric string (document ID); otherwise use computed last-entry id.
      if (storedNextCursor && typeof storedNextCursor === 'string' && !/^\d+$/.test(storedNextCursor)) {
        (params as any).cursor = String(storedNextCursor);
      } else if (nextPageParams.cursor?.id) {
        (params as any).cursor = String(nextPageParams.cursor.id);
      }

      // Serialize date range if present (ISO strings)
      if (wantsDateFilter) {
        const dr = (filtersForBackend as any).dateRange as any;
        (params as any).dateStart = typeof dr.start === 'string' ? dr.start : new Date(dr.start).toISOString();
        (params as any).dateEnd = typeof dr.end === 'string' ? dr.end : new Date(dr.end).toISOString();
      }
  // Always set sortBy (use value from backendFilters if provided, otherwise default to createdAt)
  if ((filtersForBackend as any)?.sortBy) {
    params.sortBy = (filtersForBackend as any).sortBy;
  } else if (!params.sortBy) {
  params.sortBy = 'createdAt';
  }
  // Don't set default sortOrder - only include it if explicitly provided (when searching)
  
  console.log('[HistorySlice] Making loadMoreHistory API call with params:', params);
  
  const res = await client.get('/api/generations', { params });
  
  console.log('[HistorySlice] loadMoreHistory API response:', {
    status: res.status,
    hasData: !!res.data,
    hasDataData: !!res.data?.data,
    itemsCount: res.data?.data?.items?.length || 0,
    hasMore: res.data?.data?.hasMore,
    nextCursor: res.data?.data?.nextCursor ? 'yes' : 'no',
  });
  
  const result = res.data?.data || { items: [], nextCursor: undefined };
  
  console.log('[HistorySlice] Processed loadMoreHistory result:', {
    itemsCount: Array.isArray(result.items) ? result.items.length : 0,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor ? 'yes' : 'no',
  });

      // Normalize dates so UI always has a valid timestamp (ISO)
      const items = (result.items || [])
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
      
      // Backend returns hasMore (preferred). If absent, infer using RAW item count before filtering failures.
      const requestedLimit = (paginationParams && paginationParams.limit) || 10;
      const rawItemCount = Array.isArray(result.items) ? result.items.length : 0;
      let hasMore: boolean;
      if (result.hasMore !== undefined) {
        hasMore = Boolean(result.hasMore);
      } else {
        hasMore = rawItemCount >= requestedLimit && Boolean(result.nextCursor);
      }
      const nextCursor = result.nextCursor;

      try {
        console.log('[INF_SCROLL] thunk:loadMoreHistory:result', {
          itemCount: items.length,
          requestedLimit,
          hasMore,
          nextCursor: nextCursor ? (typeof nextCursor === 'number' ? `${nextCursor} (ts)` : `${nextCursor} (legacy)`) : null
        })
      } catch {}

      return { entries: items, hasMore, nextCursor };
    } catch (error) {
      // Keep error for visibility
      try { console.error('[INF_SCROLL] thunk:loadMoreHistory:error', error); } catch {}
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load more history');
    }
  },
  {
    condition: (
      _args: { filters?: HistoryFilters; backendFilters?: HistoryFilters; paginationParams?: PaginationParams } = {},
      { getState }
    ) => {
      const state = getState() as { history: HistoryState };
      const { loading, inFlight, hasMore } = state.history;
      if (loading || inFlight) {
        return false;
      }
      // NOTE: do not gate loadMore by the stored `hasMore` flag alone.
      // The stored `hasMore` value can become stale or conservative (we prefer letting the server
      // decide). Allowing the thunk to run when callers request more makes pagination resilient
      // to inconsistent backend semantics (e.g., always-returned nextCursor). The thunk itself
      // (and the in-thunk pre-flight guard) prevents duplicate concurrent requests.
      return true;
    }
  }
);

// Async thunk for adding and persisting history entry
const addAndSaveHistoryEntry = createAsyncThunk(
  'history/addAndSaveHistoryEntry',
  async (entry: Omit<HistoryEntry, 'id'>, { rejectWithValue }) => {
    try {
      // Start a generation history record in backend for consistency
      const res = await axiosInstance.post('/api/generations', entry as any);
      const id = res.data?.data?.historyId || res.data?.data?.item?.id || Date.now().toString();
      const savedEntry: HistoryEntry = { ...entry, id };
      return savedEntry;
    } catch (error) {
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
      // Ensure UI fully resets and pagination can start fresh
      state.loading = false;
      state.inFlight = false;
      state.currentRequestKey = null;
      state.error = null;
      state.nextCursor = null; // Clear stored cursor on reset
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
        // removed noisy console
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.inFlight = false;
        state.currentRequestKey = null;
        
        // Always sync slice filters with the filters used for this load
        const usedFilters = (action.meta && action.meta.arg && action.meta.arg.filters) || {};
        const forceRefresh = (action.meta && action.meta.arg && action.meta.arg.forceRefresh) || false;
        const requestedLimit = (action.meta && action.meta.arg && action.meta.arg.paginationParams && action.meta.arg.paginationParams.limit) || 10;
        const payloadEntries = action.payload?.entries || [];
        const serverHasMore = Boolean(action.payload?.hasMore);
        const hasNextCursor = action.payload?.nextCursor !== undefined && action.payload?.nextCursor !== null;
        const syntheticNextCursor = !hasNextCursor && payloadEntries.length > 0
          ? (() => {
              try {
                const last = payloadEntries[payloadEntries.length - 1];
                const ts = Date.parse(String(last?.timestamp || last?.createdAt || ''));
                return Number.isNaN(ts) ? null : String(ts);
              } catch { return null; }
            })()
          : null;
        const optimisticHasMore = serverHasMore || hasNextCursor || Boolean(syntheticNextCursor) || payloadEntries.length >= requestedLimit;
        state.filters = usedFilters;

        console.log('[HistorySlice] ========== loadHistory.fulfilled ==========');
        console.log('[HistorySlice] Payload received:', {
          entriesCount: action.payload?.entries?.length || 0,
          hasMore: action.payload?.hasMore,
          nextCursor: action.payload?.nextCursor ? 'yes' : 'no',
          usedFilters,
          forceRefresh,
          previousEntriesCount: state.entries.length,
        });
        console.log('[HistorySlice] Sample entries (first 3):', action.payload?.entries?.slice(0, 3).map((e: any) => ({
          id: e.id,
          generationType: e.generationType,
          status: e.status,
          imagesCount: Array.isArray(e.images) ? e.images.length : 0,
        })));

        // If forceRefresh, replace entries completely (don't merge with existing)
        // Otherwise, merge entries by ID while PRESERVING backend order (critical for backend-sorted pagination)
        if (forceRefresh) {
          console.log('[HistorySlice] forceRefresh=true - REPLACING all entries with fresh data');
          state.entries = action.payload.entries;
        } else {
          const existingMap = new Map<string, any>(state.entries.map((e: any) => [String(e?.id || ''), e]));
          const backendEntries: any[] = Array.isArray(action.payload.entries) ? action.payload.entries : [];
          const backendIds = new Set<string>(backendEntries.map((e: any) => String(e?.id || '')));
          
          // Build merged list in BACKEND order
          const mergedInOrder = backendEntries.map((backendEntry: any) => {
            const id = String(backendEntry?.id || '');
            const existingEntry = existingMap.get(id);
            if (!existingEntry) return backendEntry;

            // If both exist, prefer the one with more recent timestamp or better status,
            // but keep the backend position to preserve ordering.
              const existingTimestamp = new Date(existingEntry.timestamp || existingEntry.createdAt || 0).getTime();
              const backendTimestamp = new Date(backendEntry.timestamp || backendEntry.createdAt || 0).getTime();
            if (
              existingTimestamp > backendTimestamp ||
                  (existingEntry.status === 'generating' && backendEntry.status !== 'generating') ||
              (Array.isArray(existingEntry.audios) && existingEntry.audios.length > 0 && (!Array.isArray(backendEntry.audios) || backendEntry.audios.length === 0))
            ) {
              return existingEntry;
              }
            return backendEntry;
          });

          // Preserve local-only entries (not returned by backend) by appending (does not disturb backend order)
          const localOnly = state.entries.filter((e: any) => {
            const id = String(e?.id || '');
            return id && !backendIds.has(id);
          });

          state.entries = [...mergedInOrder, ...localOnly];
        }
        const usedTypeAny = (usedFilters as any)?.generationType as any;
        if (usedTypeAny) {
          const normalize = (t?: string): string => (t ? String(t).replace(/[_-]/g, '-').toLowerCase() : '');
          const typeMatches = (eType?: string, fType?: string): boolean => {
            const e = normalize(eType);
            const f = normalize(fType);
            if (!f) return true;
            if (e === f) return true;
            // logo synonyms
            if ((f === 'logo' && e === 'logo-generation') || (f === 'logo-generation' && e === 'logo')) return true;
            // sticker synonyms
            if ((f === 'sticker-generation' && e === 'sticker') || (f === 'sticker' && e === 'sticker-generation')) return true;
            // product synonyms
            if ((f === 'product-generation' && e === 'product') || (f === 'product' && e === 'product-generation')) return true;
            // TTS synonyms
            if ((f === 'text-to-speech' && (e === 'text-to-speech' || e === 'text-to-voice' || e === 'tts' || e === 'text-to-voice')) ||
                (f === 'text_to_speech' && (e === 'text-to-speech' || e === 'text_to_speech' || e === 'tts')) ||
                (f === 'tts' && (e === 'text-to-speech' || e === 'text_to_speech' || e === 'tts'))) return true;
            // text-to-character exact match
            if (f === 'text-to-character' && e === 'text-to-character') return true;
            return false;
          };
          const usedTypesArr = Array.isArray(usedTypeAny) ? usedTypeAny : [usedTypeAny];
          const isTtsRequest = usedTypesArr.map(normalize).some((t: string) => ['text-to-speech','text_to_speech','tts'].includes(t));
          const isSfxRequest = usedTypesArr.map(normalize).some((t: string) => ['sfx','sound-effect','sound_effect','sound-effects','sound_effects'].includes(t));
          const isDialogueRequest = usedTypesArr.map(normalize).some((t: string) => ['text-to-dialogue','dialogue','text_to_dialogue'].includes(t));
          state.entries = state.entries.filter((it: any) => {
            // Standard type match
            if (usedTypesArr.some((f: string) => typeMatches(it?.generationType, f))) return true;
            // Extra inclusions for TTS: include chatterbox/elevenlabs items regardless of generationType
            if (isTtsRequest) {
              const model = normalize(it?.model) || normalize((it as any)?.backendModel) || normalize((it as any)?.apiModel) || '';
              const hasAudioData = (Array.isArray((it as any)?.audios) && (it as any).audios.length > 0) || !!(it as any)?.audio || (Array.isArray((it as any)?.images) && (it as any).images.some((img: any) => img?.type === 'audio'));
              if ((model.includes('chatterbox') || model.includes('eleven') || model.includes('maya') || model.includes('tts')) && hasAudioData) return true;
            }
            // Extra inclusions for SFX: include elevenlabs sound-effects regardless of mislabels
            if (isSfxRequest) {
              const model = normalize(it?.model) || normalize((it as any)?.backendModel) || normalize((it as any)?.apiModel) || '';
              const hasAudioData = (Array.isArray((it as any)?.audios) && (it as any).audios.length > 0) || !!(it as any)?.audio || (Array.isArray((it as any)?.images) && (it as any).images.some((img: any) => img?.type === 'audio'));
              if ((model.includes('sound-effects') || model.includes('sound_effects') || model.includes('sfx')) && hasAudioData) return true;
            }
            // Extra inclusions for Dialogue: include dialogue endpoints regardless of mislabels
            if (isDialogueRequest) {
              const model = normalize(it?.model) || normalize((it as any)?.backendModel) || normalize((it as any)?.apiModel) || '';
              const hasAudioData = (Array.isArray((it as any)?.audios) && (it as any).audios.length > 0) || !!(it as any)?.audio || (Array.isArray((it as any)?.images) && (it as any).images.some((img: any) => img?.type === 'audio'));
              if ((model.includes('dialogue') || model.includes('conversation')) && hasAudioData) return true;
            }
            return false;
          });
        }
        
          state.lastLoadedCount = action.payload.entries.length;
          // Keep pagination optimistic: trust server flag, nextCursor, synthetic cursor, or a full page of items
          state.hasMore = optimisticHasMore;
        // Store nextCursor from backend response or synthesize from last item to enable deeper paging when server omits cursor
        state.nextCursor = action.payload.nextCursor ?? syntheticNextCursor ?? null;
        state.error = null;
        
        console.log('[HistorySlice] State updated after fulfilled (after filtering):', {
          entriesCount: state.entries.length,
          hasMore: state.hasMore,
          lastLoadedCount: state.lastLoadedCount,
          filters: state.filters,
        });
      })
      .addCase(loadHistory.rejected, (state, action) => {
        state.loading = false;
        state.inFlight = false;
        state.currentRequestKey = null;
        if (action.payload === '__CONDITION_ABORT__') {
          // Silent abort due to navigation/type change; do not set error
          return;
        }
        state.error = action.payload as string;
        // removed noisy console
      })
      // Load more history
      .addCase(loadMoreHistory.pending, (state, action) => {
        state.loading = true;
        state.inFlight = true;
        try {
          const pendingArg = (action as any)?.meta?.arg;
          state.currentRequestKey = JSON.stringify({ type: 'loadMore', filters: pendingArg?.filters || {}, limit: pendingArg?.paginationParams?.limit || 10 });
        } catch { state.currentRequestKey = 'unknown'; }
        // removed noisy console
      })
      .addCase(loadMoreHistory.fulfilled, (state, action) => {
        console.log('[HistorySlice] ========== loadMoreHistory.fulfilled ==========');
        console.log('[HistorySlice] Payload received:', {
          entriesCount: action.payload?.entries?.length || 0,
          hasMore: action.payload?.hasMore,
          nextCursor: action.payload?.nextCursor ? 'yes' : 'no',
          currentStateEntriesCount: state.entries.length,
        });
        
        state.loading = false;
        state.inFlight = false;
        state.currentRequestKey = null;
        
        // Filter out duplicate entries before adding
        let newEntries = action.payload.entries.filter((newEntry: HistoryEntry) => 
          !state.entries.some((existingEntry: HistoryEntry) => existingEntry.id === newEntry.id)
        );
        
        console.log('[HistorySlice] After deduplication:', {
          newEntriesCount: newEntries.length,
          duplicatesFiltered: action.payload.entries.length - newEntries.length,
        });

        // When using mode filters (mode: 'image' or mode: 'video'), the backend is the source of truth
        // and already filters correctly. Do NOT apply any frontend filtering in this case.
        // Trust the backend completely and maintain everything it returns.
        const requestFilters = (action.meta as any)?.arg?.filters || {};
        const requestBackendFilters = (action.meta as any)?.arg?.backendFilters || {};
        const requestedLimit = (action.meta as any)?.arg?.paginationParams?.limit || 10;
        const hasModeFilter = !!(requestFilters?.mode || requestBackendFilters?.mode);
        
        // Only apply generationType filtering if we're NOT using mode filters
        // When mode filters are used, accept all items from backend without additional filtering
        if (!hasModeFilter) {
          const usedTypeAny = (requestFilters?.generationType || requestBackendFilters?.generationType || state.filters?.generationType) as any;
          if (usedTypeAny) {
          const normalize = (t?: string): string => (t ? String(t).replace(/[_-]/g, '-').toLowerCase() : '');
          const typeMatches = (eType?: string, fType?: string): boolean => {
            const e = normalize(eType);
            const f = normalize(fType);
            if (!f) return true;
            if (e === f) return true;
            if ((f === 'logo' && e === 'logo-generation') || (f === 'logo-generation' && e === 'logo')) return true;
            if ((f === 'sticker-generation' && e === 'sticker') || (f === 'sticker' && e === 'sticker-generation')) return true;
            if ((f === 'product-generation' && e === 'product') || (f === 'product' && e === 'product-generation')) return true;
            if ((f === 'text-to-speech' && (e === 'text-to-speech' || e === 'text_to_speech' || e === 'tts')) ||
                (f === 'text_to_speech' && (e === 'text-to-speech' || e === 'text_to_speech' || e === 'tts')) ||
                (f === 'tts' && (e === 'text-to-speech' || e === 'text_to_speech' || e === 'tts'))) return true;
            return false;
          };
          const usedTypesArr = Array.isArray(usedTypeAny) ? usedTypeAny : [usedTypeAny];
          const isTtsRequest = usedTypesArr.map(normalize).some((t: string) => ['text-to-speech','text_to_speech','tts'].includes(t));
          const isSfxRequest = usedTypesArr.map(normalize).some((t: string) => ['sfx','sound-effect','sound_effect','sound-effects','sound_effects'].includes(t));
          const isDialogueRequest = usedTypesArr.map(normalize).some((t: string) => ['text-to-dialogue','dialogue','text_to_dialogue'].includes(t));
          newEntries = newEntries.filter((it: any) => {
            if (usedTypesArr.some((f: string) => typeMatches(it?.generationType, f))) return true;
            if (isTtsRequest) {
              const model = normalize(it?.model) || normalize((it as any)?.backendModel) || normalize((it as any)?.apiModel) || '';
              const hasAudioData = (Array.isArray((it as any)?.audios) && (it as any).audios.length > 0) || !!(it as any)?.audio || (Array.isArray((it as any)?.images) && (it as any).images.some((img: any) => img?.type === 'audio'));
              if ((model.includes('chatterbox') || model.includes('eleven') || model.includes('maya') || model.includes('tts')) && hasAudioData) return true;
            }
            if (isSfxRequest) {
              const model = normalize(it?.model) || normalize((it as any)?.backendModel) || normalize((it as any)?.apiModel) || '';
              const hasAudioData = (Array.isArray((it as any)?.audios) && (it as any).audios.length > 0) || !!(it as any)?.audio || (Array.isArray((it as any)?.images) && (it as any).images.some((img: any) => img?.type === 'audio'));
              if ((model.includes('sound-effects') || model.includes('sound_effects') || model.includes('sfx')) && hasAudioData) return true;
            }
            if (isDialogueRequest) {
              const model = normalize(it?.model) || normalize((it as any)?.backendModel) || normalize((it as any)?.apiModel) || '';
              const hasAudioData = (Array.isArray((it as any)?.audios) && (it as any).audios.length > 0) || !!(it as any)?.audio || (Array.isArray((it as any)?.images) && (it as any).images.some((img: any) => img?.type === 'audio'));
              if ((model.includes('dialogue') || model.includes('conversation')) && hasAudioData) return true;
            }
            return false;
          });
          }
        }
        // If hasModeFilter is true, we skip all filtering and accept all items from backend
        
        // Append only genuinely new entries
        state.entries.push(...newEntries);

        // Respect server-declared hasMore but stay optimistic when we have cursors or full pages.
        // Zero-new can happen due to de-duplication while more pages still exist.
        const serverHasMore = Boolean(action.payload.hasMore);
        const hasNextCursor = action.payload.nextCursor !== undefined && action.payload.nextCursor !== null;
        const payloadEntries = action.payload.entries || [];
        const syntheticNextCursor = !hasNextCursor && payloadEntries.length > 0
          ? (() => {
              try {
                const last = payloadEntries[payloadEntries.length - 1];
                const ts = Date.parse(String(last?.timestamp || last?.createdAt || ''));
                return Number.isNaN(ts) ? null : String(ts);
              } catch { return null; }
            })()
          : null;
        const optimisticHasMore = serverHasMore || hasNextCursor || Boolean(syntheticNextCursor) || payloadEntries.length >= requestedLimit;
        state.lastLoadedCount = newEntries.length;
        state.hasMore = optimisticHasMore;
        // Store nextCursor from backend response or synthesize from last item to enable deeper paging when server omits cursor
        state.nextCursor = action.payload.nextCursor ?? syntheticNextCursor ?? null;
        
        console.log('[HistorySlice] State updated after loadMoreHistory.fulfilled:', {
          totalEntriesCount: state.entries.length,
          hasMore: state.hasMore,
          lastLoadedCount: state.lastLoadedCount,
        });
      })
      .addCase(loadMoreHistory.rejected, (state, action) => {
        state.loading = false;
        state.inFlight = false;
        state.currentRequestKey = null;
        // Treat condition-based aborts as silent (do not surface as user-visible errors)
        if (action.payload === '__CONDITION_ABORT__') {
          return;
        }
        state.error = action.payload as string;
        // removed noisy console
      })
      // Add and save history entry
      .addCase(addAndSaveHistoryEntry.pending, (state) => {
        // Optional: could show loading state for saving
      })
      .addCase(addAndSaveHistoryEntry.fulfilled, (state, action) => {
        // Add the saved entry with Firebase ID to the beginning
        state.entries.unshift(action.payload);
        // removed noisy console
      })
      .addCase(addAndSaveHistoryEntry.rejected, (state, action) => {
        state.error = action.payload as string;
        // removed noisy console
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
