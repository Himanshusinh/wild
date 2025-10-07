import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance, { getApiClient } from '@/lib/axiosInstance';

export interface AuthUser {
  uid: string;
  email?: string;
  username?: string;
  photoURL?: string;
  displayName?: string;
  provider?: string;
  credits?: number;
  plan?: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const api = getApiClient();
    const res = await api.get('/api/auth/me');
    const data = res.data?.data || res.data;
    return (data?.user || data) as AuthUser;
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'Failed to load user';
    return rejectWithValue(msg);
  }
});

export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/api/auth/login', { email, password });
      const data = res.data?.data || res.data;
      return (data?.user || data) as AuthUser;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Login failed';
      return rejectWithValue(msg);
    }
  }
);

export const createSessionFromIdToken = createAsyncThunk(
  'auth/createSessionFromIdToken',
  async ({ idToken }: { idToken: string }, { rejectWithValue }) => {
    try {
      const backendBase = (axiosInstance.defaults.baseURL || '').replace(/\/$/, '')
      await axiosInstance.post(`${backendBase}/api/auth/session`, { idToken });
      // After session creation, fetch user
      const res = await axiosInstance.get('/api/auth/me');
      const data = res.data?.data || res.data;
      return (data?.user || data) as AuthUser;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Session creation failed';
      return rejectWithValue(msg);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await axiosInstance.post('/api/auth/logout');
    return true;
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'Logout failed';
    return rejectWithValue(msg);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = action.payload as string;
      })
      .addCase(loginWithEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSessionFromIdToken.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { setUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;


