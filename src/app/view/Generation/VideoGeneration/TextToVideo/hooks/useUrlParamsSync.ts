import { useEffect, useRef } from 'react';
import { ReadonlyURLSearchParams, useRouter } from 'next/navigation';

interface UseUrlParamsSyncProps {
  searchParams: ReadonlyURLSearchParams;
  setPrompt: (value: string) => void;
  setSelectedModel: (value: string) => void;
  setFrameSize: (value: string) => void;
  setDuration: (value: number) => void;
  setSelectedQuality: (value: any) => void;
  setSelectedResolution: (value: any) => void;
  setGenerationMode: (value: "text_to_video" | "image_to_video" | "video_to_video") => void;
  setUploadedImages: (value: string[]) => void;
}

export const useUrlParamsSync = ({
  searchParams,
  setPrompt,
  setSelectedModel,
  setFrameSize,
  setDuration,
  setSelectedQuality,
  setSelectedResolution,
  setGenerationMode,
  setUploadedImages
}: UseUrlParamsSyncProps) => {
  const router = useRouter();
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double processing or processing empty params
    if (processedRef.current || !searchParams || Array.from(searchParams.keys()).length === 0) return;

    console.log('Video generation - syncing URL params');
    let hasUpdates = false;

    const imageUrl = searchParams.get('image');
    const promptParam = searchParams.get('prompt');
    const modelParam = searchParams.get('model');
    const frameParam = searchParams.get('frame') || searchParams.get('aspect') || searchParams.get('aspectRatio');
    const durationParam = searchParams.get('duration');
    const qualityParam = searchParams.get('quality');
    const resolutionParam = searchParams.get('resolution');

    // Apply text params
    if (promptParam) {
      try { setPrompt(decodeURIComponent(promptParam)); } catch { setPrompt(promptParam); }
      hasUpdates = true;
    }
    if (modelParam) {
      try { setSelectedModel(decodeURIComponent(modelParam)); } catch { setSelectedModel(modelParam); }
      hasUpdates = true;
    }
    if (frameParam) {
      try { setFrameSize(decodeURIComponent(frameParam)); } catch { setFrameSize(frameParam); }
      hasUpdates = true;
    }
    if (durationParam) {
      const d = Number(durationParam);
      if (Number.isFinite(d) && d > 0) {
        setDuration(d);
        hasUpdates = true;
      }
    }
    if (qualityParam) {
      try {
        const q = decodeURIComponent(qualityParam).toLowerCase();
        if (q.includes('1080')) setSelectedQuality('1080p');
        else if (q.includes('720')) setSelectedQuality('720p');
        else if (q.includes('480')) setSelectedQuality('480p');
        hasUpdates = true;
      } catch { }
    }
    if (resolutionParam) {
      try {
        const r = decodeURIComponent(resolutionParam).toLowerCase();
        if (r.includes('1080')) setSelectedResolution('1080P');
        else if (r.includes('768')) setSelectedResolution('768P');
        else if (r.includes('720')) setSelectedResolution('720P');
        else if (r.includes('480')) setSelectedResolution('480P');
        hasUpdates = true;
      } catch { }
    }

    // Handle Image Param
    if (imageUrl) {
      let decodedImageUrl = decodeURIComponent(imageUrl);

      // Convert proxy URL to full Zata URL if needed (matching existing logic)
      if (decodedImageUrl.startsWith('/api/proxy/resource/')) {
        const ZATA_PREFIX = (process.env.NEXT_PUBLIC_ZATA_PREFIX as string) || '';
        const path = decodedImageUrl.replace('/api/proxy/resource/', '');
        decodedImageUrl = `${ZATA_PREFIX}${decodeURIComponent(path)}`;
      }

      setUploadedImages([decodedImageUrl]);
      setGenerationMode("image_to_video");
      hasUpdates = true;
    }

    if (hasUpdates) {
      processedRef.current = true;
      // Clean up URL
      router.replace('/generation/video', { scroll: false });
    }
  }, [searchParams, router, setPrompt, setSelectedModel, setFrameSize, setDuration, setSelectedQuality, setSelectedResolution, setGenerationMode, setUploadedImages]);
};
