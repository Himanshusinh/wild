import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiClient } from '@/lib/axiosInstance';

export const bflGenerate = createAsyncThunk(
  'generations/bflGenerate',
  async (
    payload: {
      prompt: string;
      model: string;
      n?: number;
      frameSize?: string;
      style?: string;
      uploadedImages?: string[];
      width?: number;
      height?: number;
      generationType?: string;
      isPublic?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      // Normalize isPublic: if caller didn't supply it, resolve from /me policy like Nano Banana flow
      try {
        if (typeof (payload as any)?.isPublic !== 'boolean') {
          const mod = await import('@/lib/publicFlag');
          (payload as any).isPublic = await mod.getIsPublic();
        }
      } catch {}
      const api = getApiClient();
      const res = await api.post('/api/bfl/generate', payload);
      return res.data?.data || res.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'BFL generate failed');
    }
  }
);

export const runwayGenerate = createAsyncThunk(
  'generations/runwayGenerate',
  async (
    body: any,
    { rejectWithValue }
  ) => {
    try {
      try {
        if (typeof body?.isPublic !== 'boolean') {
          const mod = await import('@/lib/publicFlag');
          body.isPublic = await mod.getIsPublic();
        }
      } catch {}
      const api = getApiClient();
      const res = await api.post('/api/runway/generate', body);
      return res.data?.data || res.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Runway generate failed');
    }
  }
);

export const runwayStatus = createAsyncThunk(
  'generations/runwayStatus',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const api = getApiClient();
      const res = await api.get(`/api/runway/status/${encodeURIComponent(taskId)}`);
      return res.data?.data || res.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Runway status failed');
    }
  }
);

export const runwayVideo = createAsyncThunk(
  'generations/runwayVideo',
  async (body: any, { rejectWithValue }) => {
    try {
      const api = getApiClient();
      const res = await api.post('/api/runway/video', body);
      return res.data?.data || res.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Runway video failed');
    }
  }
);

export const minimaxGenerate = createAsyncThunk(
  'generations/minimaxGenerate',
  async (payload: any, { rejectWithValue }) => {
    try {
      try {
        if (typeof payload?.isPublic !== 'boolean') {
          const mod = await import('@/lib/publicFlag');
          payload.isPublic = await mod.getIsPublic();
        }
      } catch {}
      const api = getApiClient();
      const res = await api.post('/api/minimax/generate', payload);
      return res.data?.data || res.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'MiniMax generate failed');
    }
  }
);

export const minimaxMusic = createAsyncThunk(
  'generations/minimaxMusic',
  async (payload: any, { rejectWithValue }) => {
    try {
      const api = getApiClient();
      const res = await api.post('/api/minimax/music', payload);
      return res.data?.data || res.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'MiniMax music failed');
    }
  }
);

export const listGenerations = createAsyncThunk(
  'generations/list',
  async (params: { limit?: number; cursor?: string; status?: string; generationType?: string } = {}, { rejectWithValue }) => {
    try {
      const api = getApiClient();
      const reqParams = { ...params, sortBy: 'createdAt' } as any;
      const res = await api.get('/api/generations', { params: reqParams });
      return res.data?.data || res.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'List generations failed');
    }
  }
);

export const falGenerate = createAsyncThunk(
  'generations/falGenerate',
  async (payload: any, { rejectWithValue }) => {
    try {
      try {
        if (typeof payload?.isPublic !== 'boolean') {
          const mod = await import('@/lib/publicFlag');
          payload.isPublic = await mod.getIsPublic();
        }
      } catch {}
      const api = getApiClient();
      // FAL generate can take up to 7+ minutes for some models, so use extended timeout
      const res = await api.post('/api/fal/generate', payload, {
        timeout: 600000 // 10 minutes to support long-running generations
      });
      return res.data?.data || res.data;
    } catch (e: any) {
      // Extract structured error information
      const { extractFalErrorDetails } = await import('@/lib/falToast');
      const errorDetails = extractFalErrorDetails(e);
      
      // Return structured error with all details
      const errorPayload: any = {
        message: errorDetails?.message || e?.response?.data?.message || e?.message || 'FAL generate failed',
        type: errorDetails?.type,
        detail: errorDetails?.detail,
        retryable: errorDetails?.retryable,
        status: errorDetails?.status || e?.response?.status,
        url: errorDetails?.detail?.[0]?.url,
        raw: e,
      };
      
      return rejectWithValue(errorPayload);
    }
  }
);

export const falElevenTts = createAsyncThunk(
  'generations/falElevenTts',
  async (payload: any, { rejectWithValue }) => {
    try {
      const api = getApiClient();
      const modelLower = payload?.model?.toLowerCase() || '';
      const hasInputsArray = Array.isArray(payload?.inputs) && payload.inputs.length > 0;
      const generationType = payload?.generationType?.toLowerCase() || '';
      // Route to appropriate endpoint based on model
      let endpoint = '/api/fal/eleven/tts'; // Default to ElevenLabs TTS
      if (modelLower.includes('minimax-music-2') || modelLower.includes('music-2')) {
        endpoint = '/api/minimax/music'; // MiniMax Music 2 endpoint (official API)
      } else if (modelLower.includes('dialogue') || hasInputsArray) {
        endpoint = '/api/fal/eleven/dialogue'; // Use dedicated dialogue endpoint
      } else if (modelLower.includes('sfx') || modelLower.includes('sound-effect') || generationType === 'sfx') {
        endpoint = '/api/fal/eleven/sfx'; // Use dedicated SFX endpoint for per-second pricing
      } else if (modelLower.includes('chatterbox')) {
        endpoint = '/api/fal/chatterbox/multilingual';
      } else if (modelLower.includes('maya')) {
        endpoint = '/api/fal/maya/tts';
      }
      const res = await api.post(endpoint, payload);
      return res.data?.data || res.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'TTS generation failed');
    }
  }
);

export const replicateGenerate = createAsyncThunk(
  'generations/replicateGenerate',
  async (payload: any, { rejectWithValue }) => {
    try {
      try {
        if (typeof payload?.isPublic !== 'boolean') {
          const mod = await import('@/lib/publicFlag');
          payload.isPublic = await mod.getIsPublic();
        }
      } catch {}
      const api = getApiClient();
      const res = await api.post('/api/replicate/generate', payload);
      return res.data?.data || res.data;
    } catch (e: any) {
      // Extract structured error information
      const { extractReplicateErrorDetails } = await import('@/lib/replicateToast');
      const errorDetails = extractReplicateErrorDetails(e);
      
      // Return structured error with all details
      const errorPayload: any = {
        message: errorDetails?.message || e?.response?.data?.detail || e?.response?.data?.message || e?.message || 'Replicate generate failed',
        detail: errorDetails?.detail,
        status: errorDetails?.status || e?.response?.status,
        retryable: errorDetails?.retryable,
        raw: e,
      };
      
      return rejectWithValue(errorPayload);
    }
  }
);


