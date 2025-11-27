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
    const apiParams: any = {
      limit: params.limit || 50,
      sortBy: 'createdAt',
    };
    
    if (params.cursor) apiParams.cursor = params.cursor;
    if (params.nextCursor) apiParams.nextCursor = params.nextCursor;
    
    // Map mode to generationType
    if (params.mode === 'image') {
      apiParams.generationType = 'text-to-image';
    } else if (params.mode === 'video') {
      apiParams.generationType = 'text-to-video';
    } else if (params.mode === 'music') {
      apiParams.generationType = 'text-to-music';
    }
    // 'all' or undefined means no generationType filter

    const response = await api.get('/api/generations', { params: apiParams });
    const result = response.data?.data || { items: [], nextCursor: undefined, hasMore: false };
    
    // Transform the response to match LibraryItem format
    const items: LibraryItem[] = (result.items || []).map((item: any) => {
      const firstImage = item.images?.[0];
      return {
        id: item.id,
        historyId: item.id,
        url: firstImage?.url || firstImage?.originalUrl || firstImage?.firebaseUrl || '',
        originalUrl: firstImage?.originalUrl || firstImage?.url || '',
        type: params.mode === 'video' ? 'video' : 'image',
        thumbnail: firstImage?.thumbnailUrl || firstImage?.avifUrl || firstImage?.webpUrl,
        prompt: item.prompt,
        model: item.model,
        createdAt: item.createdAt || item.timestamp,
        storagePath: firstImage?.storagePath,
        mediaId: firstImage?.id,
        aspectRatio: item.aspectRatio,
        aestheticScore: item.aestheticScore,
      };
    });

    return {
      responseStatus: 'success',
      message: 'Success',
      data: {
        items,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore || false,
      },
    };
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
    const apiParams: any = {
      limit: params.limit || 50,
      sortBy: 'createdAt',
      isPublic: false, // User uploads are typically private
    };
    
    if (params.cursor) apiParams.cursor = params.cursor;
    if (params.nextCursor) apiParams.nextCursor = params.nextCursor;
    
    // Map mode to generationType
    if (params.mode === 'image') {
      apiParams.generationType = 'text-to-image';
    } else if (params.mode === 'video') {
      apiParams.generationType = 'text-to-video';
    } else if (params.mode === 'music') {
      apiParams.generationType = 'text-to-music';
    }

    const response = await api.get('/api/generations', { params: apiParams });
    const result = response.data?.data || { items: [], nextCursor: undefined, hasMore: false };
    
    // Transform the response to match LibraryItem format
    const items: LibraryItem[] = (result.items || []).map((item: any) => {
      const firstImage = item.images?.[0];
      return {
        id: item.id,
        historyId: item.id,
        url: firstImage?.url || firstImage?.originalUrl || firstImage?.firebaseUrl || '',
        originalUrl: firstImage?.originalUrl || firstImage?.url || '',
        type: params.mode === 'video' ? 'video' : 'image',
        thumbnail: firstImage?.thumbnailUrl || firstImage?.avifUrl || firstImage?.webpUrl,
        prompt: item.prompt,
        model: item.model,
        createdAt: item.createdAt || item.timestamp,
        storagePath: firstImage?.storagePath,
        mediaId: firstImage?.id,
        aspectRatio: item.aspectRatio,
        aestheticScore: item.aestheticScore,
      };
    });

    return {
      responseStatus: 'success',
      message: 'Success',
      data: {
        items,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore || false,
      },
    };
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

