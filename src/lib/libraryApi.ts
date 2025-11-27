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
    nextCursor?: string | number;
    hasMore: boolean;
  };
}

export interface UploadItem {
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
  originalUrl?: string;
}

export interface UploadResponse {
  responseStatus: 'success' | 'error';
  message?: string;
  data?: {
    items: UploadItem[];
    nextCursor?: string | number;
    hasMore?: boolean;
  };
}

export interface SaveUploadResponse {
  responseStatus: 'success' | 'error';
  message?: string;
  data?: {
    url: string;
    storagePath?: string;
    historyId?: string;
  };
}

/**
 * Fetch library items (generated media) from backend
 */
export async function fetchLibrary(params: {
  limit?: number;
  cursor?: string;
  nextCursor?: string | number;
  mode?: 'image' | 'video' | 'music' | 'branding' | 'all';
}): Promise<LibraryResponse> {
  try {
    const api = getApiClient();
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.cursor) queryParams.set('cursor', params.cursor);
    if (params.nextCursor !== undefined) queryParams.set('nextCursor', String(params.nextCursor));
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
  nextCursor?: string | number;
  mode?: 'image' | 'video' | 'music' | 'branding' | 'all';
}): Promise<LibraryResponse> {
  try {
    const api = getApiClient();
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.cursor) queryParams.set('cursor', params.cursor);
    if (params.nextCursor !== undefined) queryParams.set('nextCursor', String(params.nextCursor));
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

/**
 * Helper function to fetch library with pagination support
 * Returns items, nextCursor, and hasMore flag
 */
export async function getLibraryPage(
  limit: number = 50,
  nextCursor?: string | number,
  mode?: 'image' | 'video' | 'music' | 'branding' | 'all'
): Promise<{
  items: LibraryItem[];
  nextCursor?: string | number;
  hasMore: boolean;
}> {
  const result = await fetchLibrary({ limit, nextCursor, mode });
  return {
    items: result.data?.items || [],
    nextCursor: result.data?.nextCursor,
    hasMore: result.data?.hasMore || false,
  };
}

/**
 * Helper function to fetch uploads with pagination support
 * Returns items, nextCursor, and hasMore flag
 */
export async function getUploadsPage(
  limit: number = 50,
  nextCursor?: string | number,
  mode?: 'image' | 'video' | 'music' | 'branding' | 'all'
): Promise<{
  items: UploadItem[];
  nextCursor?: string | number;
  hasMore: boolean;
}> {
  const result = await fetchUploads({ limit, nextCursor, mode });
  return {
    items: (result.data?.items || []) as UploadItem[],
    nextCursor: result.data?.nextCursor,
    hasMore: result.data?.hasMore || false,
  };
}

/**
 * Save uploaded media to the backend
 * This allows uploaded files to appear in "My Uploads" in the library
 */
export async function saveUpload(params: {
  url: string;
  type: 'image' | 'video';
  projectId?: string;
}): Promise<SaveUploadResponse> {
  try {
    const api = getApiClient();
    const response = await api.post('/api/canvas/media-library/upload', {
      url: params.url,
      type: params.type,
      projectId: params.projectId,
    });
    return response.data;
  } catch (error: any) {
    console.error('[libraryApi] Error saving upload:', error);
    return {
      responseStatus: 'error',
      message: error?.response?.data?.message || error?.message || 'Failed to save upload',
    };
  }
}
