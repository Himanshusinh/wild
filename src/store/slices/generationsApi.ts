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
    },
    { rejectWithValue }
  ) => {
    try {
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
      const res = await api.get('/api/generations', { params });
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
      const api = getApiClient();
      const res = await api.post('/api/fal/generate', payload);
      return res.data?.data || res.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'FAL generate failed');
    }
  }
);


