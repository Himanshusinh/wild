import axiosInstance from './axiosInstance';

/**
 * Library API response types
 */
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
}

export interface LibraryResponse {
  responseStatus: 'success' | 'error';
  message?: string;
  data?: {
    items: LibraryItem[];
    nextCursor?: string | number;
    hasMore?: boolean;
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

/**
 * Fetch user's library (generated images/videos)
 * @param limit - Number of items to return (default: 50, max: 100)
 * @param cursor - Legacy cursor for pagination
 * @param nextCursor - Timestamp-based cursor for pagination
 * @param mode - Filter by mode: 'image', 'video', 'music', 'branding', or 'all' (default: 'all')
 */
export async function fetchLibrary(
  limit: number = 50,
  cursor?: string,
  nextCursor?: string | number,
  mode?: 'image' | 'video' | 'music' | 'branding' | 'all'
): Promise<LibraryResponse> {
  try {
    const params: any = {
      limit: Math.max(1, Math.min(limit, 100)),
    };

    if (cursor) {
      params.cursor = cursor;
    }

    if (nextCursor) {
      params.nextCursor = nextCursor;
    }

    if (mode && mode !== 'all') {
      params.mode = mode;
    }

    const response = await axiosInstance.get('/api/library', { params });

    return {
      responseStatus: 'success',
      message: 'Library retrieved',
      data: response.data?.data || {
        items: [],
        nextCursor: undefined,
        hasMore: false,
      },
    };
  } catch (error: any) {
    console.error('[libraryApi] Error fetching library:', error);
    return {
      responseStatus: 'error',
      message: error?.response?.data?.message || error?.message || 'Failed to fetch library',
      data: {
        items: [],
        nextCursor: undefined,
        hasMore: false,
      },
    };
  }
}

export interface SaveUploadResult {
  responseStatus: 'success' | 'error';
  message: string;
  data?: {
    id: string;
    url: string;
    storagePath?: string;
    historyId?: string;
    type: 'image' | 'video';
  };
}

/**
 * Save an uploaded media item (image/video) as a reusable upload.
 * This is called when the user uploads from their device and clicks "Add".
 */
export async function saveUpload(params: {
  url: string;
  type: 'image' | 'video';
}): Promise<SaveUploadResult> {
  try {
    const response = await axiosInstance.post('/api/uploads/save', {
      url: params.url,
      type: params.type,
    });
    return response.data;
  } catch (error: any) {
    return {
      responseStatus: 'error',
      message: error?.response?.data?.message || error?.message || 'Failed to save upload',
    };
  }
}

/**
 * Fetch user's uploads (inputImages and inputVideos from generation history)
 * @param limit - Number of items to return (default: 50, max: 100)
 * @param cursor - Legacy cursor for pagination
 * @param nextCursor - Timestamp-based cursor for pagination
 * @param mode - Filter by mode: 'image', 'video', 'music', 'branding', or 'all' (default: 'all')
 */
export async function fetchUploads(
  limit: number = 50,
  cursor?: string,
  nextCursor?: string | number,
  mode?: 'image' | 'video' | 'music' | 'branding' | 'all'
): Promise<UploadResponse> {
  try {
    const params: any = {
      limit: Math.max(1, Math.min(limit, 100)),
    };

    if (cursor) {
      params.cursor = cursor;
    }

    if (nextCursor) {
      params.nextCursor = nextCursor;
    }

    if (mode && mode !== 'all') {
      params.mode = mode;
    }

    const response = await axiosInstance.get('/api/uploads', { params });

    const data = response.data?.data || {
      items: [],
      nextCursor: undefined,
      hasMore: false,
    };

    console.log('[libraryApi] fetchUploads response:', {
      status: response.status,
      hasData: !!response.data?.data,
      itemsCount: data.items?.length || 0,
      hasMore: data.hasMore,
      nextCursor: data.nextCursor ? 'present' : 'null',
      mode,
      sampleItem: data.items?.[0]
    });

    return {
      responseStatus: 'success',
      message: 'Uploads retrieved',
      data,
    };
  } catch (error: any) {
    console.error('[libraryApi] Error fetching uploads:', error);
    return {
      responseStatus: 'error',
      message: error?.response?.data?.message || error?.message || 'Failed to fetch uploads',
      data: {
        items: [],
        nextCursor: undefined,
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
  const result = await fetchLibrary(limit, undefined, nextCursor, mode);
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
  const result = await fetchUploads(limit, undefined, nextCursor, mode);
  return {
    items: result.data?.items || [],
    nextCursor: result.data?.nextCursor,
    hasMore: result.data?.hasMore || false,
  };
}

