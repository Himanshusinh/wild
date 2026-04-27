import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { saveUpload } from '@/lib/libraryApi';

interface UseFileHandlerProps {
  setUploadedImages: (update: (prev: string[]) => string[]) => void;
  setUploadedVideo: (video: string) => void;
  setLocalVideoFilesByUrl?: (update: (prev: Record<string, File>) => Record<string, File>) => void;
  currentUploadedVideo?: string;
  clearTrackedVideoUrl?: (url: string) => void;
}

export const useFileHandler = ({
  setUploadedImages,
  setUploadedVideo,
  setLocalVideoFilesByUrl,
  currentUploadedVideo,
  clearTrackedVideoUrl,
}: UseFileHandlerProps) => {
  const processFiles = useCallback(async (files: File[]) => {
    // 1. Separate images and videos
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const videoFiles = files.filter(f => f.type.startsWith('video/'));

    // 2. Process Images
    if (imageFiles.length > 0) {
      const newUrls: string[] = [];
      for (const file of imageFiles) {
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        try {
          // Persist local images immediately so generation payloads never send huge data URLs.
          const resp = await saveUpload({ url: dataUrl, type: 'image' });
          if (resp.responseStatus === 'success' && resp.data?.url) {
            newUrls.push(resp.data.url);
          } else {
            throw new Error(resp.message || 'Image upload failed');
          }
        } catch (error: any) {
          console.error('[Video][useFileHandler] Failed to persist uploaded image:', error);
          toast.error(`Failed to upload "${file.name}". Please try a smaller image.`);
        }
      }

      if (newUrls.length > 0) {
        setUploadedImages(prev => [...prev, ...newUrls].slice(0, 4));
        toast.success(`Added ${newUrls.length} image(s)`);
      }
    }

    // 3. Process Videos (Take the first valid video)
    if (videoFiles.length > 0) {
      const file = videoFiles[0];
      const maxBytes = 500 * 1024 * 1024; // 500MB limit
      const allowedMimes = new Set([
        'video/mp4', 'video/webm', 'video/ogg',
        'video/quicktime', 'video/mov', 'video/h264'
      ]);

      if (!allowedMimes.has(file.type)) {
        toast.error('Unsupported video type. Use MP4, WebM, MOV, OGG, or H.264');
      } else if (file.size > maxBytes) {
        toast.error('Video too large. Please upload a video ≤ 500MB');
      } else {
        // Use Blob URL instead of Data URL for better performance and memory management
        const url = URL.createObjectURL(file);
        if (currentUploadedVideo && currentUploadedVideo.startsWith('blob:') && currentUploadedVideo !== url) {
          try { URL.revokeObjectURL(currentUploadedVideo); } catch {}
          clearTrackedVideoUrl?.(currentUploadedVideo);
        }
        setUploadedVideo(url);
        
        // Track the File object so it can be uploaded to Zata later
        if (setLocalVideoFilesByUrl) {
          setLocalVideoFilesByUrl(prev => ({ ...prev, [url]: file }));
        }
        
        toast.success('Video added');
      }
    }
  }, [
    setUploadedImages,
    setUploadedVideo,
    setLocalVideoFilesByUrl,
    currentUploadedVideo,
    clearTrackedVideoUrl,
  ]);

  return { processFiles };
};
