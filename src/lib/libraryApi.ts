import { getApiClient } from './axiosInstance';

export interface LibraryItem {
  id: string;
  historyId: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  prompt?: string;
  model?: string;
  createdAt?: string;
  storagePath?: string;
  mediaId?: string;
  aspectRatio?: string;
  aestheticScore?: number;
  originalUrl?: string;
}

export interface LibraryResponse {
  responseStatus: 'success' | 'error';
  message: string;
  data: {
    items: LibraryItem[];
    nextCursor?: string;
    hasMore: boolean;
  };
}

/**
 * Fetch library items (generated media) from backend
 */
export async function fetchLibrary(params: {
  limit?: number;
  cursor?: string;
  nextCursor?: string;
  mode?: 'image' | 'video' | 'music' | 'branding' | 'all';
}): Promise<LibraryResponse> {
  try {
    const api = getApiClient();
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.cursor) queryParams.set('cursor', params.cursor);
    if (params.nextCursor) queryParams.set('nextCursor', params.nextCursor);
    if (params.mode) queryParams.set('mode', params.mode);

    const response = await api.get(`/api/library?${queryParams.toString()}`);
    return response.data;
  } catch (error: any) {
    return {
      responseStatus: 'error',
      message: error?.response?.data?.message || error?.message || 'Failed to fetch library',
      data: {
        items: [],
        hasMore: false,
      },
    };
  }
}

/**
 * Fetch upload items (user uploaded media) from backend
 */
export async function fetchUploads(params: {
  limit?: number;
  cursor?: string;
  nextCursor?: string;
  mode?: 'image' | 'video' | 'music' | 'branding' | 'all';
}): Promise<LibraryResponse> {
  try {
    const api = getApiClient();
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.cursor) queryParams.set('cursor', params.cursor);
    if (params.nextCursor) queryParams.set('nextCursor', params.nextCursor);
    if (params.mode) queryParams.set('mode', params.mode);

    const response = await api.get(`/api/uploads?${queryParams.toString()}`);
    return response.data;
  } catch (error: any) {
    return {
      responseStatus: 'error',
      message: error?.response?.data?.message || error?.message || 'Failed to fetch uploads',
      data: {
        items: [],
        hasMore: false,
      },
    };
  }
}

