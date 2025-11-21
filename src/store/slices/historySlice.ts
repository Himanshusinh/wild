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
        return rejectWithValue('__CONDITION_ABORT__');
      }
      const client = axiosInstance;
      const params: any = {};
      if (filters?.status) params.status = filters.status;
      // Always send canonical generationType to backend (prevents unrelated items),
      // while still performing client-side legacy inclusions for mis-labeled audio entries.
      const canonicalAudioType = (incoming: string | string[] | undefined): string | string[] | undefined => {
        if (!incoming) return incoming;
        const arr = Array.isArray(incoming) ? incoming : [incoming];
        const norm = (v: string) => v.replace(/[_-]/g,'-').toLowerCase();
        // Backend does NOT accept these audio feature generationType filters yet; skip sending and filter client-side.
        if (arr.some(t => ['text-to-speech','tts','text_to_speech','sfx','sound-effect','sound_effect','sound-effects','sound_effects','text-to-dialogue','dialogue','text_to_dialogue'].includes(norm(t)))) return undefined;
        return mapGenerationTypeForBackend(incoming as any);
      };
      if (filters?.generationType) {
        const mapped = canonicalAudioType(filters.generationType as any);
        if (mapped) params.generationType = mapped;
      }
      if ((filters as any)?.mode && typeof (filters as any).mode === 'string') (params as any).mode = (filters as any).mode;
      if (filters?.model) params.model = mapModelSkuForBackend(filters.model);
      // Add search parameter if present
      if ((filters as any)?.search && typeof (filters as any).search === 'string' && (filters as any).search.trim()) {
        params.search = (filters as any).search.trim();
      }
      if (paginationParams?.limit) params.limit = paginationParams.limit;
      if ((paginationParams as any)?.cursor?.id) params.cursor = (paginationParams as any).cursor.id;
  // Use optimized backend pagination defaults (createdAt DESC) by omitting sortBy/sortOrder
      // Serialize date range if present (ISO strings)
      if ((filters as any)?.dateRange && (filters as any).dateRange.start && (filters as any).dateRange.end) {
        const dr = (filters as any).dateRange as any;
        (params as any).dateStart = typeof dr.start === 'string' ? dr.start : new Date(dr.start).toISOString();
        (params as any).dateEnd = typeof dr.end === 'string' ? dr.end : new Date(dr.end).toISOString();
      }
  // Always request createdAt sorting explicitly
  params.sortBy = 'createdAt';
  const res = await client.get('/api/generations', { params, signal });
      let result = res.data?.data || { items: [], nextCursor: undefined };

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
    { filters, paginationParams }: { filters?: HistoryFilters; paginationParams?: PaginationParams } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      try { console.log('[INF_SCROLL] thunk:loadMoreHistory:invoke', { filters, limit: paginationParams?.limit }); } catch {}
      const state = getState() as { history: HistoryState };
      const currentEntries = state.history.entries;
      
      // Debug removed to reduce noise
      
  // Get the last entry to compute nextCursor (timestamp-based)
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
      const canonicalAudioType = (incoming: string | string[] | undefined): string | string[] | undefined => {
        if (!incoming) return incoming;
        const arr = Array.isArray(incoming) ? incoming : [incoming];
        const norm = (v: string) => v.replace(/[_-]/g,'-').toLowerCase();
        if (arr.some(t => ['text-to-speech','tts','text_to_speech','sfx','sound-effect','sound_effect','sound-effects','sound_effects','text-to-dialogue','dialogue','text_to_dialogue'].includes(norm(t)))) return undefined;
        return mapGenerationTypeForBackend(incoming as any);
      };
      if (filters?.generationType) {
        const mapped = canonicalAudioType(filters.generationType as any);
        if (mapped) params.generationType = mapped;
      }
      if ((filters as any)?.mode && typeof (filters as any).mode === 'string') (params as any).mode = (filters as any).mode;
      if (filters?.model) params.model = mapModelSkuForBackend(filters.model);
      // Add search parameter if present
      if ((filters as any)?.search && typeof (filters as any).search === 'string' && (filters as any).search.trim()) {
        params.search = (filters as any).search.trim();
      }
      // Prefer optimized pagination: send nextCursor (timestamp millis) instead of legacy document id cursor
      if (nextPageParams.cursor?.timestamp) {
        try {
          const millis = new Date(nextPageParams.cursor.timestamp).getTime();
          if (!Number.isNaN(millis)) (params as any).nextCursor = String(millis);
        } catch {}
      }
      // Do NOT set sortBy/sortOrder so backend uses optimized index (createdAt DESC)
      if ((filters as any)?.dateRange && (filters as any).dateRange.start && (filters as any).dateRange.end) {
        const dr = (filters as any).dateRange as any;
        (params as any).dateStart = typeof dr.start === 'string' ? dr.start : new Date(dr.start).toISOString();
        (params as any).dateEnd = typeof dr.end === 'string' ? dr.end : new Date(dr.end).toISOString();
      }
  try { console.log('[INF_SCROLL] thunk:loadMoreHistory:api', { params }); } catch {}
  // Always request createdAt sorting explicitly
  params.sortBy = 'createdAt';
  const res = await client.get('/api/generations', { params });
  try { console.log('[INF_SCROLL] thunk:loadMoreHistory:api:done', { status: res?.status, count: (res?.data?.data?.items || []).length, nextCursor: res?.data?.data?.nextCursor }); } catch {}
      const result = res.data?.data || { items: [], nextCursor: undefined };

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
      _args: { filters?: HistoryFilters; paginationParams?: PaginationParams } = {},
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
        state.filters = usedFilters;

        // Apply a safe, synonym-aware filter when a generationType is requested
        state.entries = action.payload.entries;
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
          // Trust server hasMore when provided; if entries empty but server reports hasMore
          // keep hasMore true to allow a user-triggered retry (prevents false terminal state).
          if (action.payload.entries.length === 0) {
            state.hasMore = Boolean(action.payload.hasMore);
          } else {
            state.hasMore = Boolean(action.payload.hasMore);
          }
        state.error = null;
        // removed noisy console
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
        state.loading = false;
        state.inFlight = false;
        state.currentRequestKey = null;
        
        // Filter out duplicate entries before adding
        let newEntries = action.payload.entries.filter((newEntry: HistoryEntry) => 
          !state.entries.some((existingEntry: HistoryEntry) => existingEntry.id === newEntry.id)
        );

        // Enforce requested generationType for pagination as well
        const usedTypeAny = ((action.meta as any)?.arg?.filters?.generationType || state.filters?.generationType) as any;
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
        
        // Append only genuinely new entries
        state.entries.push(...newEntries);

        // Respect server-declared hasMore. Do NOT force-stop on zero net-new entries.
        // Zero-new can happen due to de-duplication or server-side filtering while still
        // having additional pages available. We'll trust the backend signal here.
        const serverHasMore = Boolean(action.payload.hasMore);
        state.lastLoadedCount = newEntries.length;
        state.hasMore = serverHasMore;
        // removed noisy console
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
