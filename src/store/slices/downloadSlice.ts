import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  fileType: 'image' | 'video' | 'audio';
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
  startedAt: number;
  completedAt?: number;
}

interface DownloadState {
  downloads: DownloadItem[];
  activeDownloads: number; // Count of active downloads
}

const initialState: DownloadState = {
  downloads: [],
  activeDownloads: 0,
};

const downloadSlice = createSlice({
  name: 'download',
  initialState,
  reducers: {
    addDownload: (state, action: PayloadAction<Omit<DownloadItem, 'status' | 'progress' | 'startedAt'>>) => {
      const download: DownloadItem = {
        ...action.payload,
        status: 'pending',
        progress: 0,
        startedAt: Date.now(),
      };
      state.downloads.unshift(download); // Add to beginning
      state.activeDownloads = state.downloads.filter(d => d.status === 'downloading' || d.status === 'pending').length;
    },
    updateDownloadProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      const download = state.downloads.find(d => d.id === action.payload.id);
      if (download) {
        download.progress = Math.min(100, Math.max(0, action.payload.progress));
        if (download.status === 'pending') {
          download.status = 'downloading';
        }
      }
      state.activeDownloads = state.downloads.filter(d => d.status === 'downloading' || d.status === 'pending').length;
    },
    completeDownload: (state, action: PayloadAction<string>) => {
      const download = state.downloads.find(d => d.id === action.payload);
      if (download) {
        download.status = 'completed';
        download.progress = 100;
        download.completedAt = Date.now();
      }
      state.activeDownloads = state.downloads.filter(d => d.status === 'downloading' || d.status === 'pending').length;
      
      // Auto-remove completed downloads after 3 seconds
      setTimeout(() => {
        // This will be handled by the component
      }, 3000);
    },
    failDownload: (state, action: PayloadAction<{ id: string; error: string }>) => {
      const download = state.downloads.find(d => d.id === action.payload.id);
      if (download) {
        download.status = 'failed';
        download.error = action.payload.error;
      }
      state.activeDownloads = state.downloads.filter(d => d.status === 'downloading' || d.status === 'pending').length;
    },
    removeDownload: (state, action: PayloadAction<string>) => {
      state.downloads = state.downloads.filter(d => d.id !== action.payload);
      state.activeDownloads = state.downloads.filter(d => d.status === 'downloading' || d.status === 'pending').length;
    },
    clearCompletedDownloads: (state) => {
      state.downloads = state.downloads.filter(d => d.status !== 'completed');
      state.activeDownloads = state.downloads.filter(d => d.status === 'downloading' || d.status === 'pending').length;
    },
  },
});

export const {
  addDownload,
  updateDownloadProgress,
  completeDownload,
  failDownload,
  removeDownload,
  clearCompletedDownloads,
} = downloadSlice.actions;

export default downloadSlice.reducer;
