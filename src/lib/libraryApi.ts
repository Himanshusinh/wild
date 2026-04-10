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

const isLocalMediaSource = (value: string): boolean =>
  /^data:/i.test(value) || value.startsWith('blob:');

const inferUploadFileExtension = (
  mimeType: string | undefined,
  fallbackType: 'image' | 'video',
): string => {
  const mime = String(mimeType || '').toLowerCase();
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('quicktime')) return 'mov';
  return fallbackType === 'video' ? 'mp4' : 'png';
};

async function loadImageElementFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image for upload'));
    };
    img.src = objectUrl;
  });
}

async function compressImageFileForUpload(
  file: File,
  maxBytes: number = 900 * 1024, // stay below common 1MB nginx limits with headroom
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= maxBytes) return file;

  try {
    const img = await loadImageElementFromFile(file);
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const mime = 'image/jpeg';
    const extension = 'jpg';
    let quality = 0.86;
    let blob: Blob | null = null;

    for (let i = 0; i < 8; i += 1) {
      blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
      if (!blob) break;
      if (blob.size <= maxBytes || quality <= 0.42) break;
      quality -= 0.08;
    }

    if (!blob) return file;

    const compressed = new File([blob], `upload-${Date.now()}.${extension}`, {
      type: mime,
    });

    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  }
}

async function uploadLocalMediaFile(params: {
  file: File;
  type: 'image' | 'video';
  projectId?: string;
}): Promise<SaveUploadResponse> {
  try {
    const uploadFile =
      params.type === 'image'
        ? await compressImageFileForUpload(params.file)
        : params.file;

    const form = new FormData();
    form.append(
      'file',
      uploadFile,
      uploadFile.name ||
        `upload.${inferUploadFileExtension(uploadFile.type, params.type)}`,
    );
    form.append('type', params.type);
    if (params.projectId) {
      form.append('projectId', params.projectId);
    }

    // Use same-origin Next.js proxy route for uploads so production edge/network
    // handling stays consistent and doesn't depend on browser->backend multipart quirks.
    const response = await fetch('/api/canvas/media-library/upload-file', {
      method: 'POST',
      body: form,
      credentials: 'include',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {
        responseStatus: 'error',
        message: text || 'Invalid upload response',
      };
    }

    if (!response.ok) {
      return {
        responseStatus: 'error',
        message: data?.message || `Upload failed (${response.status})`,
      };
    }

    return data as SaveUploadResponse;
  } catch (error: any) {
    console.error('[libraryApi] Error uploading local media file:', error);
    return {
      responseStatus: 'error',
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Failed to upload local media file',
    };
  }
}

async function uploadLocalMediaSource(params: {
  url: string;
  type: 'image' | 'video';
  projectId?: string;
}): Promise<SaveUploadResponse> {
  try {
    let file: File;
    const normalizedUrl = String(params.url || '').trim();
    if (!normalizedUrl) {
      throw new Error('Missing local media source');
    }

    if (normalizedUrl.startsWith('data:')) {
      const commaIdx = normalizedUrl.indexOf(',');
      if (commaIdx <= 0) {
        throw new Error('Invalid data URL');
      }
      const meta = normalizedUrl.slice(0, commaIdx);
      const base64 = normalizedUrl.slice(commaIdx + 1);
      const mimeMatch = meta.match(/^data:([^;]+);base64$/i);
      const mimeType = mimeMatch?.[1] || (params.type === 'video' ? 'video/mp4' : 'image/png');
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const ext = inferUploadFileExtension(blob.type, params.type);
      file = new File([blob], `upload-${Date.now()}.${ext}`, { type: blob.type || mimeType });
    } else {
      const response = await fetch(normalizedUrl);
      if (!response.ok) {
        throw new Error(`Failed to read local media (${response.status})`);
      }
      const blob = await response.blob();
      const ext = inferUploadFileExtension(blob.type, params.type);
      file = new File([blob], `upload-${Date.now()}.${ext}`, {
        type: blob.type || (params.type === 'video' ? 'video/mp4' : 'image/png'),
      });
    }

    return uploadLocalMediaFile({
      file,
      type: params.type,
      projectId: params.projectId,
    });
  } catch (error: any) {
    console.error('[libraryApi] Error converting local media source:', error);
    return {
      responseStatus: 'error',
      message: error?.message || 'Failed to prepare local media for upload',
    };
  }
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
    // Some backends expect `cursor`, others expect `nextCursor`.
    // Send both when we have a value to maximize compatibility.
    if (params.cursor !== undefined && params.cursor !== null) {
      queryParams.set('cursor', String(params.cursor));
      queryParams.set('nextCursor', String(params.cursor));
    }
    if (params.nextCursor !== undefined && params.nextCursor !== null) {
      queryParams.set('nextCursor', String(params.nextCursor));
      queryParams.set('cursor', String(params.nextCursor));
    }
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
  const items = (result.data?.items || []) as UploadItem[];
  // Support both `nextCursor` and `cursor` response fields
  const next = (result as any)?.data?.nextCursor ?? (result as any)?.data?.cursor;
  // Derive hasMore from explicit flag or the presence of a cursor
  const hasMore = Boolean((result as any)?.data?.hasMore ?? next);
  return {
    items,
    nextCursor: next,
    hasMore,
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
    if (isLocalMediaSource(params.url)) {
      return uploadLocalMediaSource(params);
    }

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
