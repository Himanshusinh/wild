import { getApiClient } from "@/lib/axiosInstance";

/**
 * Clean up proxy path for Zata storage
 */
export const toProxyPath = (urlOrPath: string | undefined) => {
  if (!urlOrPath) return '';
  const ZATA_PREFIX = process.env.NEXT_PUBLIC_ZATA_PREFIX || '';
  // If ZATA_PREFIX is empty, startsWith('') is true for all strings (including blob:)
  // which would incorrectly proxy local/object URLs.
  if (ZATA_PREFIX && urlOrPath.startsWith(ZATA_PREFIX)) return urlOrPath.substring(ZATA_PREFIX.length);
  // Allow direct storagePath-like values (users/...)
  if (/^users\//.test(urlOrPath)) return urlOrPath;
  // For external URLs (fal.media, etc.), do not proxy
  return '';
};

/**
 * Convert storage path to frontend proxy URL
 */
export const toFrontendProxyMediaUrl = (urlOrPath: string | undefined) => {
  const path = toProxyPath(urlOrPath);
  return path ? `/api/proxy/media/${encodeURIComponent(path)}` : '';
};

/**
 * Normalize generation type string
 */
export const normalizeGenerationType = (generationType: string | undefined): string => {
  if (!generationType) return '';
  // Convert both underscore and hyphen to a standard format for comparison
  return generationType.replace(/[_-]/g, '-').toLowerCase();
};

/**
 * Check if the entry is a video generation type
 */
export const isVideoType = (entry: any): boolean => {
  const normalizedType = normalizeGenerationType(entry?.generationType);
  return normalizedType === 'text-to-video' ||
    normalizedType === 'image-to-video' ||
    normalizedType === 'video-to-video';
};

/**
 * Check if a URL points to a video file
 */
export const isVideoUrl = (url: string | undefined): boolean => {
  return !!url && (url.startsWith('data:video') || /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url));
};

/**
 * Convert frameAspectRatio (16:9) to Runway ratio format (1280:720)
 */
export const convertFrameSizeToRunwayRatio = (frameSize: string): string => {
  const ratioMap: { [key: string]: string } = {
    "16:9": "1280:720",
    "9:16": "720:1280",
    "4:3": "1104:832",
    "3:4": "832:1104",
    "1:1": "960:960",
    "21:9": "1584:672",
    "16:10": "1280:768", // gen3a_turbo specific
    "10:16": "768:1280", // gen3a_turbo specific
  };

  return ratioMap[frameSize] || "1280:720"; // Default to 16:9 if no match
};

/**
 * Convert frameAspectRatio to MiniMax resolution string
 */
export const convertFrameSizeToMiniMaxResolution = (frameSize: string): string => {
  const resolutionMap: { [key: string]: string } = {
    "16:9": "1080P",
    "9:16": "1080P",
    "4:3": "1080P",
    "3:4": "1080P",
    "1:1": "1080P",
    "21:9": "1080P",
  };

  return resolutionMap[frameSize] || "1080P";
};

/**
 * Poll for MiniMax video completion
 */
export const waitForMiniMaxVideoCompletion = async (taskId: string, opts?: { historyId?: string }) => {
  if (!taskId || taskId.trim() === '') {
    throw new Error('Invalid taskId provided to waitForMiniMaxVideoCompletion');
  }

  console.log('⏳ Starting MiniMax video completion polling for task:', taskId);

  const maxAttempts = 60; // 5 minutes with 5-second intervals
  let attempts = 0;

  const api = getApiClient();
  while (attempts < maxAttempts) {
    try {
      console.log(`🔄 MiniMax polling attempt ${attempts + 1}/${maxAttempts}`);
      const { data: statusEnvelope } = await api.get('/api/minimax/video/status', { params: { task_id: taskId } });
      console.log('📊 MiniMax status check result:', statusEnvelope);

      const statusData = statusEnvelope?.data || statusEnvelope;
      const status = statusData?.result?.status || statusData?.status;
      const fileId = statusData?.result?.file_id || statusData?.file_id;

      if (status === 'Success' && fileId) {
        console.log('✅ MiniMax video completed, retrieving file...');

        try {
          // Get the actual download URL (pass history_id if we have it later at callsite)
          const { data: fileEnvelope } = await api.get('/api/minimax/video/file', { params: { file_id: fileId, ...(opts?.historyId ? { history_id: opts.historyId } : {}) } });
          console.log('📁 MiniMax file result:', fileEnvelope);

          const fileData = fileEnvelope?.data || fileEnvelope;
          if (fileData?.file && (fileData.file.download_url || fileData.file.backup_download_url)) {
            return {
              status: 'Success',
              download_url: fileData.file.download_url || fileData.file.backup_download_url,
              videos: fileData.videos
            };
          }
          if (Array.isArray(fileData?.videos) && fileData.videos[0]?.url) {
            return { status: 'Success', download_url: fileData.videos[0].url, videos: fileData.videos };
          }
          throw new Error('No download URL found in file response');
        } catch (fileError) {
          console.warn('⚠️ File retrieval failed, but video generation was successful. Video should be available in database.');
          // Return success status even if file retrieval fails - the video is already in the database
          return {
            status: 'Success',
            download_url: null,
            videos: null,
            note: 'Video generated successfully and stored in database'
          };
        }
      } else if (status === 'Fail') {
        console.error('❌ MiniMax video generation failed:', statusData);
        return { status: 'Fail', error: statusData?.base_resp?.status_msg || 'Generation failed' };
      } else if (status === 'Queueing' || status === 'Preparing' || status === 'Processing' || status === 'Running') {
        console.log(`⏳ MiniMax still processing: ${status}`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;
      } else if (status) {
        console.log(`⏳ MiniMax status: ${status}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } else {
        console.warn('⚠️ Empty MiniMax status response, retrying...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    } catch (error) {
      console.error('❌ MiniMax status check error:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
  }

  console.error('⏰ MiniMax video completion timeout after', maxAttempts, 'attempts');
  throw new Error('MiniMax video generation timeout');
};

// Helper to clean prompt text
export const getCleanPrompt = (text: string): string => {
  try { return (text || '').replace(/\[\s*Style:\s*[^\]]+\]/i, '').trim(); } catch { return text; }
};

// Helper to copy prompt to clipboard
export const copyPrompt = async (e: React.MouseEvent, text: string) => {
  try {
    e.stopPropagation();
    e.preventDefault();
    await navigator.clipboard.writeText(text);
    (await import('react-hot-toast')).default.success('Prompt copied');
  } catch {
    try {
      (await import('react-hot-toast')).default.error('Failed to copy');
    } catch { }
  }
};
