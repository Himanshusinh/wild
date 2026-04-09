import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface UseFileHandlerProps {
  setUploadedImages: (update: (prev: string[]) => string[]) => void;
  setUploadedVideo: (video: string) => void;
  setLocalVideoFilesByUrl?: (update: (prev: Record<string, File>) => Record<string, File>) => void;
}

export const useFileHandler = ({ setUploadedImages, setUploadedVideo, setLocalVideoFilesByUrl }: UseFileHandlerProps) => {
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
        newUrls.push(dataUrl);
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
        setUploadedVideo(url);
        
        // Track the File object so it can be uploaded to Zata later
        if (setLocalVideoFilesByUrl) {
          setLocalVideoFilesByUrl(prev => ({ ...prev, [url]: file }));
        }
        
        toast.success('Video added');
      }
    }
  }, [setUploadedImages, setUploadedVideo, setLocalVideoFilesByUrl]);

  return { processFiles };
};
