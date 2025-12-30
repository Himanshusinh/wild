'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Plus,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Play,
  ImageIcon
} from 'lucide-react';
import UploadModal from '../../Generation/ImageGeneration/TextToImage/compo/UploadModal';
import { getAuthToken } from '@/lib/authHelper';
import { useCredits } from '@/hooks/useCredits';

// --- TYPES ---
interface Workflow {
  id: string;
  title: string;
  category: string;
  description: string;
  model: string;
  thumbnail: string;
  sampleBefore: string;
  sampleAfter: string;
}

// --- MODAL COMPONENT ---
interface SelfieVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowData: Workflow | null;
}

export default function SelfieVideoModal({ isOpen, onClose, workflowData }: SelfieVideoModalProps) {
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hideControlsDuringGenerate, setHideControlsDuringGenerate] = useState(false);
  const [showLogoGifForCreate, setShowLogoGifForCreate] = useState(false);
  const [uploadReplaceIndex, setUploadReplaceIndex] = useState<number | null>(null);

  // State Management: 0: Upload, 1: Images Grid, 2: Videos Grid, 3: Final Video
  const [step, setStep] = useState(0);
  const [frameSize, setFrameSize] = useState<"vertical" | "horizontal">("vertical");
  const [friendPhotos, setFriendPhotos] = useState<string[]>([]);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [customBackground, setCustomBackground] = useState<string>("");
  const [customClothes, setCustomClothes] = useState<string>("");
  const [step2FriendPhoto, setStep2FriendPhoto] = useState<string | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'selfie' | 'friends' | 'step2Friend' | null>(null);

  // Result Data
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedImageBilling, setGeneratedImageBilling] = useState<Array<{ debitedCredits?: number; status?: string }>>([]);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [videoPlayed, setVideoPlayed] = useState<boolean[]>([]);
  const [videoErrors, setVideoErrors] = useState<(string | null)[]>([]);
  const [videosRequested, setVideosRequested] = useState<boolean>(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const remoteVideoUrlsRef = useRef<string[]>([]); // Store original remote URLs for editor export
  const {
    creditBalance,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction,
  } = useCredits();

  const IMAGE_COST = 46;
  const VIDEO_COST = 200;

  // Track optimistic deductions so we can compute deltas and show totals.
  const prevImageCreditsRef = useRef<number>(0);
  const prevVideoCreditsRef = useRef<number>(0);
  const extraCreditsRef = useRef<number>(0); // for regenerations / ad-hoc charges

  const totalReservedCredits = () => prevImageCreditsRef.current + prevVideoCreditsRef.current + extraCreditsRef.current;

  const tryDeduct = (amount: number, trackRef?: React.MutableRefObject<number>) => {
    if (!amount || amount <= 0) return true;
    if (creditBalance < amount) {
      alert(`You need ${amount} credits to perform this action. Your balance is ${creditBalance}.`);
      return false;
    }
    deductCreditsOptimisticForGeneration(amount);
    if (trackRef) trackRef.current += amount;
    else extraCreditsRef.current += amount;
    return true;
  };

  const rollbackDeduction = (amount: number, trackRef?: React.MutableRefObject<number>) => {
    if (!amount || amount <= 0) return;
    rollbackOptimisticDeduction(amount);
    if (trackRef) trackRef.current = Math.max(0, trackRef.current - amount);
    else extraCreditsRef.current = Math.max(0, extraCreditsRef.current - amount);
  };

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(false);
      setStep(0);
      setFriendPhotos([]);
      setSelfiePhoto(null);
      setCustomBackground("");
      setCustomClothes("");
      setStep2FriendPhoto(null);
      setGeneratedImages([]);
      setGeneratedVideos([]);
      setFinalVideoUrl(null);
      setVideoErrors([]);
      setVideoPlayed([]);
      setVideosRequested(false);
      // reset optimistic tracking
      prevImageCreditsRef.current = 0;
      prevVideoCreditsRef.current = 0;
      extraCreditsRef.current = 0;
    }
  }, [isOpen, workflowData]);

  if (!workflowData) return null;

  const isFullScreenStep = step > 0;

  // --- ACTIONS ---

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const pollReplicateVideoResult = async (requestId: string, token: string): Promise<string> => {
    // Poll Replicate status first; when succeeded, finalize via queue/result.
    // Note: /queue/result also performs server-side storage + history finalization.
    const timeoutMs = 8 * 60 * 1000;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const statusRes = await fetch(`/api/replicate/queue/status?requestId=${encodeURIComponent(requestId)}` as any, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!statusRes.ok) {
        const err = await statusRes.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to fetch video status');
      }
      const statusJson = await statusRes.json();
      const status = String(statusJson?.data?.status || '').toLowerCase();

      if (status === 'succeeded') {
        const resultRes = await fetch(`/api/replicate/queue/result?requestId=${encodeURIComponent(requestId)}` as any, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!resultRes.ok) {
          const err = await resultRes.json().catch(() => ({}));
          throw new Error(err?.message || 'Failed to fetch video result');
        }
        const resultJson = await resultRes.json();
        const videoUrl = resultJson?.data?.videos?.[0]?.url;
        if (typeof videoUrl === 'string' && videoUrl.length > 0) return videoUrl;
        throw new Error('Video completed but URL missing');
      }

      if (status === 'failed' || status === 'canceled') {
        const errMsg = statusJson?.data?.error || statusJson?.data?.logs || 'Video generation failed';
        throw new Error(typeof errMsg === 'string' ? errMsg : 'Video generation failed');
      }

      await sleep(5000);
    }
    throw new Error('Video generation timed out');
  };

  const handleMergeImages = async () => {
    if (!selfiePhoto || friendPhotos.length === 0) {
      return;
    }

    const totalRequired = friendPhotos.length * IMAGE_COST;
    const delta = Math.max(0, totalRequired - prevImageCreditsRef.current);
    if (delta > 0 && creditBalance < delta) {
      alert(`You need ${delta} more credits to generate these images. Your balance is ${creditBalance}.`);
      return;
    }

    if (delta > 0) {
      // only deduct the incremental amount (use helper to track)
      if (!tryDeduct(delta, prevImageCreditsRef)) return;
    }
    setIsGenerating(true);
    setHideControlsDuringGenerate(true);
    setGeneratedImages([]);

    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Please log in to generate images');
        setIsGenerating(false);
        // rollback only the delta we reserved in this call
        if (delta > 0) rollbackDeduction(delta, prevImageCreditsRef);
        return;
      }

      // Helper to retry transient network/proxy errors
      const fetchWithRetry = async (input: RequestInfo, init: RequestInit, attempts = 3, baseDelay = 800) => {
        let lastErr: any = null;
        for (let i = 0; i < attempts; i++) {
          try {
            const res = await fetch(input, { ...init, credentials: 'include' });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body?.message || `HTTP ${res.status}`);
            }
            return res;
          } catch (err: any) {
            lastErr = err;
            const isLast = i === attempts - 1;
            if (isLast) break;
            const delayMs = baseDelay * Math.pow(2, i);
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, delayMs));
          }
        }
        throw lastErr;
      };

      const generatePromises = friendPhotos.map(async (friendPhoto, index) => {
        try {
          const endpoint = API_BASE ? `${API_BASE}/api/workflows/selfie-video/generate-image` : '/api/workflows/selfie-video/generate-image';
          // Set model and aspect ratio as per requirements
          const model = 'openai/gpt-image-1.5';
          const aspect_ratio = frameSize === 'vertical' ? '2:3' : '3:2';
          const response = await fetchWithRetry(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              selfieImageUrl: selfiePhoto,
              friendImageUrl: friendPhoto,
              frameSize: frameSize,
              customBackground: customBackground || undefined,
              customClothes: customClothes || undefined,
              model,
              aspect_ratio,
            }),
          }, 3, 800);

          const data = await response.json();
          return {
            success: true,
            imageUrl: data?.data?.imageUrl,
            debitedCredits: Number(data?.data?.debitedcredits ?? data?.data?.debitedCredits ?? 0) || 0,
            status: String(data?.data?.status ?? '') || '',
            index,
          };
        } catch (error: any) {
          console.error(`Error generating image ${index + 1}:`, error);
          return {
            success: false,
            error: error.message || 'Failed to generate image',
            index,
          };
        }
      });

      const results = await Promise.allSettled(generatePromises);

      const generatedUrls: string[] = [];
      const billingInfo: Array<{ debitedCredits?: number; status?: string }> = [];
      let hasErrors = false;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          generatedUrls[index] = result.value.imageUrl;
          const rv: any = result.value;
          const debited = Number(rv.debitedCredits ?? rv.debitedcredits ?? 0) || 0;
          const st = String(rv.status ?? rv.debitStatus ?? rv.debitstatus ?? '') || '';
          billingInfo[index] = { debitedCredits: debited, status: st };
        } else {
          hasErrors = true;
          generatedUrls[index] = '';
          console.error(`Image ${index + 1} failed:`, result.status === 'fulfilled' ? result.value.error : result.reason);
        }
      });

      setGeneratedImages(generatedUrls);
      setGeneratedImageBilling(billingInfo);
      setIsGenerating(false);

      if (!hasErrors && generatedUrls.every(url => url)) {
        // restore controls after successful generation
        setHideControlsDuringGenerate(false);
        setStep(1);
      } else {
        if (delta > 0) rollbackDeduction(delta, prevImageCreditsRef);
        alert('Some images failed to generate. Please try again.');
      }
    } catch (error: any) {
      console.error('Error in handleMergeImages:', error);
      setIsGenerating(false);
      setHideControlsDuringGenerate(false);
      if (delta > 0) rollbackDeduction(delta, prevImageCreditsRef);
      alert('Failed to generate images. Please try again.');
    }
  };

  const regenerateImage = async (index: number) => {
    if (!selfiePhoto || !friendPhotos[index]) {
      return;
    }

    const requiredCredits = IMAGE_COST;
    if (creditBalance < requiredCredits) {
      alert(`You need ${requiredCredits} credits to regenerate this image. Your balance is ${creditBalance}.`);
      return;
    }

    if (!tryDeduct(requiredCredits, extraCreditsRef)) return;
    const previousUrl = generatedImages[index];
    setGeneratedImages((prev) => {
      const next = [...prev];
      next[index] = '';
      return next;
    });

    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Please log in to regenerate images');
        rollbackDeduction(requiredCredits);
        setGeneratedImages((prev) => {
          const next = [...prev];
          next[index] = previousUrl;
          return next;
        });
        return;
      }

      const endpoint = API_BASE ? `${API_BASE}/api/workflows/selfie-video/generate-image` : '/api/workflows/selfie-video/generate-image';
      // Set model and aspect ratio as per requirements
      const model = 'openai/gpt-image-1.5';
      const aspect_ratio = frameSize === 'vertical' ? '2:3' : '3:2';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          selfieImageUrl: selfiePhoto,
          friendImageUrl: friendPhotos[index],
          frameSize: frameSize,
          customBackground: customBackground || undefined,
          customClothes: customClothes || undefined,
          model,
          aspect_ratio,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate image');
      }

      const data = await response.json();
      const newUrl = data?.data?.imageUrl;
      if (!newUrl) throw new Error('Missing imageUrl in response');

      const billing = { debitedCredits: Number(data?.data?.debitedcredits ?? data?.data?.debitedCredits ?? data?.data?.debitedCredits ?? 0) || 0, status: String(data?.data?.status ?? data?.data?.debitStatus ?? data?.data?.debitstatus ?? '') };

      // IMPORTANT: use a fresh array reference so React re-renders
      setGeneratedImages((prev) => {
        const next = [...prev];
        next[index] = newUrl;
        return next;
      });
      setGeneratedImageBilling((prev) => {
        const next = [...prev];
        next[index] = billing;
        return next;
      });
    } catch (error: any) {
      console.error(`Error regenerating image ${index + 1}:`, error);
      alert('Failed to regenerate image. Please try again.');
      rollbackDeduction(requiredCredits);
      setGeneratedImages((prev) => {
        const next = [...prev];
        next[index] = previousUrl;
        return next;
      });
    }
  };

  const handleImagesToVideos = async (sourceImages?: string[]) => {
    const images = (sourceImages || generatedImages).filter((u) => typeof u === 'string' && u.length > 0);
    if (images.length < 2) {
      alert('Please generate at least 2 images first.');
      return;
    }

    const slots = Math.max(0, images.length - 1);

    // Determine which video slots actually need generation (empty or missing)
    const currentVideos = Array.isArray(generatedVideos) ? generatedVideos : [];
    const indicesToGenerate: number[] = [];
    for (let i = 0; i < slots; i++) {
      if (!currentVideos[i] || String(currentVideos[i] || '').length === 0) indicesToGenerate.push(i);
    }

    // If nothing to generate, just navigate to videos step
    if (indicesToGenerate.length === 0) {
      setStep(2);
      return;
    }

    const slotsToGenerate = indicesToGenerate.length;
    const totalRequired = slotsToGenerate * VIDEO_COST;
    const delta = Math.max(0, totalRequired - prevVideoCreditsRef.current);
    if (delta > 0 && creditBalance < delta) {
      alert(`You need ${delta} more credits to generate these videos. Your balance is ${creditBalance}.`);
      return;
    }

    if (delta > 0) {
      if (!tryDeduct(delta, prevVideoCreditsRef)) return;
    }

    setIsGenerating(true);
    // Prepare generatedVideos array: preserve existing urls and set empty for indices we will generate
    setGeneratedVideos((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      // ensure length
      while (next.length < slots) next.push('');
      // ensure empty markers for indices we'll generate
      for (const idx of indicesToGenerate) next[idx] = '';
      return next.slice(0, slots);
    });
    setVideoPlayed((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      while (next.length < slots) next.push(false);
      return next.slice(0, slots);
    });
    setVideoErrors((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      while (next.length < slots) next.push(null);
      return next.slice(0, slots);
    });
    setVideosRequested(true);
    setStep(2);

    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Please log in to generate videos');
        setIsGenerating(false);
        if (delta > 0) rollbackDeduction(delta, prevVideoCreditsRef);
        setVideosRequested(false);
        return;
      }

      const aspectRatio = frameSize === 'vertical' ? '9:16' : '16:9';
      const backgroundClause = customBackground && customBackground.trim().length > 0
        ? ` Set the scene in ${customBackground}.`
        : '';
      const basePrompt = `Create a smooth, realistic video transition from the first frame ({FIRST_FRAME_DESC}) to the last frame ({LAST_FRAME_DESC}). The person who appears in BOTH the first and last frames must remain the same individual and act as the anchor of the transition. Do not morph; instead, show this shared person moving naturally through space—walking or stepping forward toward the second person in the last frame to take a selfie together.

    Drive the transition with continuous physical motion of this shared person (forward movement, slight body shift, natural arm extension). Let the background and scene evolve gradually as they move; no abrupt swaps. The camera may gently orbit up to 180 degrees around the shared person to emphasize motion, but keep the movement smooth and cinematic. Ensure the shared person visibly walks or advances so it feels intentional and natural, never like a morph.${backgroundClause}

    Strictly preserve identity, facial features, skin tone, hairstyle, and proportions of all subjects. Maintain consistent lighting, camera perspective, and environmental continuity. Use smooth camera easing and realistic motion interpolation. Avoid abrupt scene cuts, sudden background swaps, morphing artifacts, ghosting, warping, text, logos, or watermarks.`;

      // 1) Submit jobs only for the indices we marked for generation
      const submitJobs = await Promise.all(
        indicesToGenerate.map(async (i) => {
          const firstFrameUrl = images[i];
          const lastFrameUrl = images[i + 1];
          try {
            const submitRes = await fetch('/api/replicate/seedance-i2v/submit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                model: 'bytedance/seedream-1-lite',
                prompt: basePrompt,
                image: firstFrameUrl,
                last_frame_image: lastFrameUrl,
                aspect_ratio: aspectRatio,
                resolution: '480p',
                duration: 5,
              }),
            });

            if (!submitRes.ok) {
              const err = await submitRes.json().catch(() => ({}));
              const msg = err?.message || `Failed to submit video ${i + 1}`;
              setVideoErrors((prev) => {
                const next = [...prev];
                next[i] = msg;
                return next;
              });
              return { index: i, error: msg };
            }

            const submitJson = await submitRes.json();
            const requestId = submitJson?.data?.requestId || submitJson?.data?.requestID || submitJson?.data?.taskId;
            if (!requestId) {
              const msg = `Missing requestId for video ${i + 1}`;
              setVideoErrors((prev) => {
                const next = [...prev];
                next[i] = msg;
                return next;
              });
              return { index: i, error: msg };
            }

            return { index: i, requestId: String(requestId) };
          } catch (e: any) {
            const msg = e?.message || 'Failed to submit video';
            console.error(`[selfieVideo] submit job ${i + 1} failed`, e);
            setVideoErrors((prev) => {
              const next = [...prev];
              next[i] = msg;
              return next;
            });
            return { index: i, error: msg };
          }
        })
      );

      // 2) Poll all successful submissions concurrently and fill slots as they complete
      const successfulSubmits = submitJobs.filter((s: any) => s && s.requestId) as { index: number; requestId: string }[];
      await Promise.all(
        successfulSubmits.map(async ({ index, requestId }) => {
          try {
            const videoUrl = await pollReplicateVideoResult(requestId, token);
            // Store remote URL for editor export
            if (remoteVideoUrlsRef.current) {
              const newUrls = [...remoteVideoUrlsRef.current];
              newUrls[index] = videoUrl;
              remoteVideoUrlsRef.current = newUrls;
            }

            // Try resolve via proxy to avoid CORS when playing in <video>
            const playable = await resolveVideoForPlayer(videoUrl);
            setGeneratedVideoAtIndex(index, playable);
            setVideoErrors((prev) => {
              const next = [...prev];
              next[index] = null;
              return next;
            });
          } catch (e: any) {
            console.error(`[selfieVideo] Video ${index + 1} failed`, e);
            setVideoErrors((prev) => {
              const next = [...prev];
              next[index] = e?.message || 'Video generation failed';
              return next;
            });
          }
        })
      );

      setIsGenerating(false);
    } catch (err: any) {
      console.error('[selfieVideo] handleImagesToVideos error', err);
      setIsGenerating(false);
      if (delta > 0) rollbackDeduction(delta, prevVideoCreditsRef);
      setVideosRequested(false);
      alert(err?.message || 'Failed to generate videos. Please try again.');
    }
  };

  const handleLoopAndRegenerate = async () => {
    const images = generatedImages.filter((u) => typeof u === 'string' && u.length > 0);
    if (images.length < 2) {
      alert('Please generate at least 2 images first.');
      return;
    }

    // We only want a single video from last -> first (loop), not regenerate all pairwise videos.
    const firstFrameUrl = images[images.length - 1];
    const lastFrameUrl = images[0];

    const requiredCredits = VIDEO_COST;
    const delta = requiredCredits; // single extra video appended
    if (creditBalance < delta) {
      alert(`You need ${delta} credits to generate this video. Your balance is ${creditBalance}.`);
      return;
    }

    // treat this as adding one more reserved video credit
    if (!tryDeduct(delta, prevVideoCreditsRef)) return;
    setIsGenerating(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Please log in to generate videos');
        rollbackDeduction(delta, prevVideoCreditsRef);
        setIsGenerating(false);
        return;
      }

      const aspectRatio = frameSize === 'vertical' ? '9:16' : '16:9';
      const backgroundClause = customBackground && customBackground.trim().length > 0
        ? ` Set the scene in ${customBackground}.`
        : '';
      const basePrompt = `Create a smooth, realistic video transition from the first frame ({FIRST_FRAME_DESC}) to the last frame ({LAST_FRAME_DESC}). The person who appears in BOTH the first and last frames must remain the same individual and act as the anchor of the transition. Do not morph; instead, show this shared person moving naturally through space—walking or stepping forward toward the second person in the last frame to take a selfie together.

    Drive the transition with continuous physical motion of this shared person (forward movement, slight body shift, natural arm extension). Let the background and scene evolve gradually as they move; no abrupt swaps. The camera may gently orbit up to 180 degrees around the shared person to emphasize motion, but keep the movement smooth and cinematic. Ensure the shared person visibly walks or advances so it feels intentional and natural, never like a morph.${backgroundClause}

    Strictly preserve identity, facial features, skin tone, hairstyle, and proportions of all subjects. Maintain consistent lighting, camera perspective, and environmental continuity. Use smooth camera easing and realistic motion interpolation. Avoid abrupt scene cuts, sudden background swaps, morphing artifacts, ghosting, warping, text, logos, or watermarks.`;

      const submitRes = await fetch('/api/replicate/seedance-i2v/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: 'bytedance/seedream-1-lite',
          prompt: basePrompt,
          image: firstFrameUrl,
          last_frame_image: lastFrameUrl,
          aspect_ratio: aspectRatio,
          resolution: '480p',
          duration: 5,
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to submit loop video');
      }

      const submitJson = await submitRes.json();
      const requestId = submitJson?.data?.requestId || submitJson?.data?.requestID || submitJson?.data?.taskId;
      if (!requestId) throw new Error('Missing requestId for loop video');

      // Poll for result and append the completed video to the videos list (stay on Step 2)
      const videoUrl = await pollReplicateVideoResult(String(requestId), token);
      const playable = await resolveVideoForPlayer(videoUrl);
      setGeneratedVideos((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        next.push(playable);
        return next;
      });
      setVideoErrors((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        next.push(null);
        return next;
      });
      setVideoPlayed((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        next.push(false);
        return next;
      });
      setVideosRequested(true);
    } catch (e: any) {
      console.error('[selfieVideo] handleLoopAndRegenerate (single) failed', e);
      rollbackDeduction(delta, prevVideoCreditsRef);
      alert(e?.message || 'Failed to generate loop video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateVideo = async (index: number) => {
    const images = generatedImages;
    const firstFrameUrl = images[index];
    const lastFrameUrl = images[index + 1];
    if (!firstFrameUrl || !lastFrameUrl) {
      alert('Missing frames to regenerate this video. Please make sure all images are generated.');
      return;
    }

    const requiredCredits = VIDEO_COST;
    if (creditBalance < requiredCredits) {
      alert(`You need ${requiredCredits} credits to regenerate this video. Your balance is ${creditBalance}.`);
      return;
    }

    if (!tryDeduct(requiredCredits, extraCreditsRef)) return;
    const previousUrl = generatedVideos[index];

    setVideosRequested(true);
    setVideoPlayed((prev) => {
      const next = [...prev];
      next[index] = false;
      return next;
    });
    setVideoErrors((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setGeneratedVideos((prev) => {
      const next = [...prev];
      next[index] = '';
      return next;
    });

    setIsGenerating(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Please log in to regenerate videos');
        rollbackDeduction(requiredCredits);
        setGeneratedVideos((prev) => {
          const next = [...prev];
          next[index] = previousUrl;
          return next;
        });
        return;
      }

      const aspectRatio = frameSize === 'vertical' ? '9:16' : '16:9';
      const backgroundClause = customBackground && customBackground.trim().length > 0
        ? ` Set the scene in ${customBackground}.`
        : '';
      const basePrompt = `Create a smooth, realistic video transition from the first frame ({FIRST_FRAME_DESC}) to the last frame ({LAST_FRAME_DESC}). The person who appears in BOTH the first and last frames must remain the same individual and act as the anchor of the transition. Do not morph; instead, show this shared person moving naturally through space—walking or stepping forward toward the second person in the last frame to take a selfie together.

    Drive the transition with continuous physical motion of this shared person (forward movement, slight body shift, natural arm extension). Let the background and scene evolve gradually as they move; no abrupt swaps. The camera may gently orbit up to 180 degrees around the shared person to emphasize motion, but keep the movement smooth and cinematic. Ensure the shared person visibly walks or advances so it feels intentional and natural, never like a morph.${backgroundClause}

    Strictly preserve identity, facial features, skin tone, hairstyle, and proportions of all subjects. Maintain consistent lighting, camera perspective, and environmental continuity. Use smooth camera easing and realistic motion interpolation. Avoid abrupt scene cuts, sudden background swaps, morphing artifacts, ghosting, warping, text, logos, or watermarks.`;

      const submitRes = await fetch('/api/replicate/seedance-i2v/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: 'bytedance/seedream-1-lite',
          prompt: basePrompt,
          image: firstFrameUrl,
          last_frame_image: lastFrameUrl,
          aspect_ratio: aspectRatio,
          resolution: '480p',
          duration: 5,
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({}));
        throw new Error(err?.message || `Failed to submit video ${index + 1}`);
      }

      const submitJson = await submitRes.json();
      const requestId = submitJson?.data?.requestId || submitJson?.data?.requestID || submitJson?.data?.taskId;
      if (!requestId) throw new Error(`Missing requestId for video ${index + 1}`);

      const videoUrl = await pollReplicateVideoResult(String(requestId), token);
      const playable = await resolveVideoForPlayer(videoUrl);
      setGeneratedVideoAtIndex(index, playable);
      setVideoErrors((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
    } catch (e: any) {
      console.error(`[selfieVideo] regenerateVideo ${index + 1} failed`, e);
      rollbackDeduction(requiredCredits);
      setGeneratedVideos((prev) => {
        const next = [...prev];
        next[index] = previousUrl;
        return next;
      });
      setVideoErrors((prev) => {
        const next = [...prev];
        next[index] = e?.message || 'Video regeneration failed';
        return next;
      });
      alert(e?.message || 'Failed to regenerate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextFromImages = () => {
    // If videos are already being requested, just navigate
    if (videosRequested) {
      setStep(2);
      return;
    }

    const hasVideos = Array.isArray(generatedVideos) && generatedVideos.some((u) => typeof u === 'string' && u.length > 0);
    const hasEmptySlots = Array.isArray(generatedVideos) && generatedVideos.some((u) => !u || String(u).length === 0);

    // If we already have fully-generated videos, just navigate. If some slots are empty, generate only those.
    if (hasVideos && !hasEmptySlots) {
      setStep(2);
      return;
    }

    void handleImagesToVideos();
  };

  // Merge generated videos client-side using ffmpeg.wasm (xfade crossfade for smooth transitions)
  const mergeGeneratedVideos = async (videoUrls: string[]): Promise<string> => {
    if (!videoUrls || videoUrls.length === 0) throw new Error('No videos to merge');

    // short crossfade duration (seconds)
    const xfadeDur = 0.2;
    // assumed per-video duration in seconds (replicate-generated videos use 5s in this workflow)
    const perDuration = 5;

    // Load @ffmpeg/ffmpeg as a UMD script at runtime to avoid Next/Turbopack server-side resolution issues
    const loadFFmpegUmd = async () => {
      if (typeof window === 'undefined') throw new Error('FFmpeg must be loaded in the browser');
      const w = window as any;
      if (w.FFmpeg && typeof w.FFmpeg.createFFmpeg === 'function') return w.FFmpeg;

      await new Promise<void>((resolve, reject) => {
        const src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.0/dist/ffmpeg.min.js';
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          // If already added but not yet ready, wait for load event
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('Failed to load FFmpeg script')));
          return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load FFmpeg script'));
        document.head.appendChild(s);
      });

      const w2 = window as any;
      if (!w2.FFmpeg || typeof w2.FFmpeg.createFFmpeg !== 'function') throw new Error('FFmpeg UMD did not initialize correctly');
      return w2.FFmpeg;
    };

    const FFmpegPkg = await loadFFmpegUmd();
    const createFFmpeg = FFmpegPkg.createFFmpeg;
    const ffmpeg = createFFmpeg({
      log: false,
      corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
    });

    // Minimal fetchFile replacement: returns Uint8Array suitable for ffmpeg.FS writeFile
    const fetchFile = async (inputUrl: string) => {
      const res = await fetch(inputUrl);
      if (!res.ok) throw new Error(`Failed to fetch ${inputUrl}: ${res.status}`);
      const ab = await res.arrayBuffer();
      return new Uint8Array(ab);
    };
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    // Write inputs to FS
    for (let i = 0; i < videoUrls.length; i++) {
      const url = videoUrls[i];
      try {
        const data = await fetchFile(url);
        ffmpeg.FS('writeFile', `in${i}.mp4`, data);
      } catch (e) {
        throw new Error(`Failed to fetch or write video ${i + 1}: ${String(e)}`);
      }
    }

    // Build filter_complex for chained xfade transitions
    // Prepare input labels
    const n = videoUrls.length;
    // Build video streams labels [0:v]...[n-1:v] -> apply xfade chain
    // We'll name intermediate outputs v0, v1, ... starting from in0
    let filterParts: string[] = [];

    // Ensure formats are compatible and set pixel format
    for (let i = 0; i < n; i++) {
      filterParts.push(`[${i}:v]format=yuv420p,setsar=1[v${i}];`);
    }

    // Chain xfade operations
    if (n === 1) {
      // Single file: just pass through
      filterParts.push(`[v0]copy[outv]`);
    } else {
      // first xfade between v0 and v1
      let prevName = `v0`;
      let curOut = `v01`;
      const firstOffset = perDuration - xfadeDur;
      filterParts.push(`[${prevName}][v1]xfade=transition=fade:duration=${xfadeDur}:offset=${firstOffset}[${curOut}];`);
      prevName = curOut;

      for (let i = 2; i < n; i++) {
        const nextOut = `v0${i}`;
        const offset = i * (perDuration - xfadeDur);
        filterParts.push(`[${prevName}][v${i}]xfade=transition=fade:duration=${xfadeDur}:offset=${offset}[${nextOut}];`);
        prevName = nextOut;
      }

      // final mapping
      filterParts.push(`[${prevName}]fps=30,format=yuv420p[outv]`);
    }

    const filterComplex = filterParts.join('');

    // Build ffmpeg args: -i in0.mp4 -i in1.mp4 ... -filter_complex "..." -map [outv] -c:v libx264 -preset veryfast -crf 23 out.mp4
    const args: string[] = [];
    for (let i = 0; i < n; i++) {
      args.push('-i', `in${i}.mp4`);
    }
    args.push('-filter_complex', filterComplex, '-map', '[outv]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-movflags', 'frag_keyframe+empty_moov', 'out.mp4');

    try {
      await ffmpeg.run(...args);
      const outData = ffmpeg.FS('readFile', 'out.mp4');
      const blob = new Blob([outData.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      return url;
    } catch (e: any) {
      throw new Error(`FFmpeg failed: ${e?.message || String(e)}`);
    } finally {
      // cleanup input files to free memory
      try {
        for (let i = 0; i < n; i++) ffmpeg.FS('unlink', `in${i}.mp4`);
        if (ffmpeg.FS('readdir', '/').includes('out.mp4')) ffmpeg.FS('unlink', 'out.mp4');
      } catch (e) {
        // ignore cleanup errors
      }
    }
  };

  // Resolve a remote video URL to a playable URL for the browser by trying the local proxy first.
  const resolveVideoForPlayer = async (remoteUrl: string): Promise<string> => {
    if (!remoteUrl) return remoteUrl;
    try {
      const proxyUrl = `/api/proxy/video?url=${encodeURIComponent(remoteUrl)}`;
      const res = await fetch(proxyUrl, { method: 'GET', cache: 'no-cache' });
      if (res.ok || res.status === 304) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        return blobUrl;
      }
    } catch (e) {
      console.warn('[selfieVideo] proxy fetch failed for video, falling back to original url', remoteUrl, e);
    }

    // Try direct CORS fetch as a last resort
    try {
      const r2 = await fetch(remoteUrl, { method: 'GET', mode: 'cors', cache: 'no-cache' });
      if (r2.ok || r2.status === 304) {
        const blob2 = await r2.blob();
        const blobUrl2 = URL.createObjectURL(blob2);
        return blobUrl2;
      }
    } catch (e) {
      console.warn('[selfieVideo] direct fetch failed for video', remoteUrl, e);
    }

    // Give up and return the original URL (may fail due to CORS)
    return remoteUrl;
  };

  const setGeneratedVideoAtIndex = (index: number, url: string) => {
    setGeneratedVideos((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const prevVal = next[index];
      if (prevVal && typeof prevVal === 'string' && prevVal.startsWith('blob:')) {
        try { URL.revokeObjectURL(prevVal); } catch (e) { /* ignore */ }
      }
      next[index] = url;
      return next;
    });
  };

  const handleVideosToFinal = async () => {
    const vids = generatedVideos.filter((u) => typeof u === 'string' && u.length > 0);
    if (vids.length === 0) {
      alert('No generated videos to merge.');
      return;
    }

    setIsGenerating(true);
    try {
      // Merge and produce final video URL
      const mergedUrl = await mergeGeneratedVideos(vids);
      setFinalVideoUrl(mergedUrl);
      setStep(3);
    } catch (e: any) {
      console.error('[selfieVideo] merge videos failed', e);
      alert(e?.message || 'Failed to merge videos. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenInEditor = async () => {
    const vids = generatedVideos.filter((u) => typeof u === 'string' && u.length > 0);
    if (vids.length === 0) {
      alert('No generated videos to open in editor.');
      return;
    }

    try {
      // Use remote URLs if available (preferred for cross-origin), otherwise fallback to current vids
      const videosToExport = remoteVideoUrlsRef.current.length > 0
        ? remoteVideoUrlsRef.current.filter(u => u && u.length > 0)
        : vids;

      console.log('[selfieVideo] preparing export with videos:', videosToExport);

      const payload = { videos: videosToExport, frameSize };

      // Use internal route of the same app
      const editorBaseUrl = window.location.origin + '/view/Generation/VideoGeneration/Editor';
      const hashPayload = encodeURIComponent(JSON.stringify(payload));
      const editorUrl = `${editorBaseUrl}#wild_import=${hashPayload}`;

      console.log('[selfieVideo] opening internal editor with hash payload');
      const newWin = window.open(editorUrl, '_blank');
      const editorOrigin = window.location.origin; // Same origin now!

      // KEEP existing fallback logic just in case hash fails or is too long (though usually 2k-4k chars is fine)
      // Try to fetch each video and send blobs to the editor via postMessage to avoid COEP/CORP cross-origin fetch issues.
      // NOTE: If CSP blocks blob fetches, we'll just send the URLs directly
      try {
        const payloadForEditor: any = {
          frameSize,
          videos: [] as any[]
        };

        // Check if videos are already blob URLs - if so, send them directly to avoid CSP issues
        const areAllBlobUrls = vids.every(u => typeof u === 'string' && u.startsWith('blob:'));

        if (areAllBlobUrls) {
          console.log('[selfieVideo] videos are already blob URLs, sending directly');
          payloadForEditor.videos = vids;
        } else {
          // Try to fetch and convert to blobs (may fail due to CSP)
          const fetchResults = await Promise.all(vids.map(async (u) => {
            try {
              const r = await fetch(u, { mode: 'cors', cache: 'no-cache' });
              if (!(r.ok || r.status === 304)) throw new Error(`HTTP ${r.status}`);
              const b = await r.blob();
              return { ok: true, blob: b };
            } catch (e) {
              console.warn('[selfieVideo] failed to fetch video as blob', u, e);
              return { ok: false, url: u };
            }
          }));
          console.log('[selfieVideo] fetchResults prepared', fetchResults.map(r => (r.ok ? 'blob' : 'url')));

          // Build payload with blobs or proxy URLs
          const proxyBase = 'http://localhost:3000/api/proxy/video?url=';
          payloadForEditor.videos = fetchResults.map((r) => {
            if (r && r.ok) return r.blob;
            const candidate = r && typeof r.url === 'string' && r.url ? r.url : null;
            return candidate ? `${proxyBase}${encodeURIComponent(candidate)}` : '';
          });
        }

        console.log('[selfieVideo] prepared payload with', payloadForEditor.videos.length, 'videos for editor');

        // Write fallback metadata to localStorage containing proxy URLs (useful only in same-origin cases).
        // NOTE: This won't work cross-origin (different ports), but kept as fallback for same-origin scenarios.
        try {
          localStorage.setItem('wild_import_videos', JSON.stringify({ videos: vids, frameSize }));
          console.log('[selfieVideo] wrote fallback to localStorage (won\'t work cross-origin)');
        } catch (e) {
          console.warn('Failed to write localStorage import payload', e);
        }

        // Handshake: wait for editor readiness then send structured payload (blobs or urls)
        const handshakeHandler = (ev: MessageEvent) => {
          try {
            if (!ev.data) return;
            if (ev.origin !== editorOrigin) return; // ensure origin matches editor
            if (ev.data.type === 'wild_editor_ready') {
              console.log('[selfieVideo] received wild_editor_ready from editor');
              try {
                if (newWin && newWin.postMessage) {
                  newWin.postMessage({ type: 'wild_import_videos', payload: payloadForEditor }, editorOrigin);
                  console.log('[selfieVideo] sent payload to editor via handshake (', payloadForEditor.videos.length, 'videos)');
                }
              } catch (e) {
                console.warn('[selfieVideo] failed to postMessage via handshake', e);
              }
              window.removeEventListener('message', handshakeHandler);
            }
          } catch (e) {
            // ignore
          }
        };

        window.addEventListener('message', handshakeHandler);

        // Fallback: if handshake doesn't arrive in time, post after delay (editor should read localStorage or receive urls)
        const fallbackTimer = setTimeout(() => {
          console.log('[selfieVideo] handshake timeout, sending via fallback postMessage');
          try {
            if (newWin && newWin.postMessage) {
              try {
                newWin.postMessage({ type: 'wild_import_videos', payload: payloadForEditor }, editorOrigin);
                console.log('[selfieVideo] sent payload to editor via fallback postMessage (', payloadForEditor.videos.length, 'videos) -> editorOrigin');
              } catch (err1) {
                try {
                  newWin.postMessage({ type: 'wild_import_videos', payload: payloadForEditor }, '*');
                  console.log('[selfieVideo] sent payload to editor via fallback postMessage (', payloadForEditor.videos.length, 'videos) -> *');
                } catch (err2) {
                  console.warn('postMessage to editor failed (both editorOrigin and *)', err1, err2);
                }
              }
            } else if (!newWin) {
              console.warn('[selfieVideo] window was closed, reopening editor');
              window.open(editorUrl, '_blank');
            }
          } catch (err) {
            console.warn('postMessage to editor failed (fallback); editor should read localStorage on load', err);
          }
          window.removeEventListener('message', handshakeHandler);
        }, 5000); // Increased timeout to give editor more time to load

        // Clear fallback if window unloads
        const cleanup = () => {
          clearTimeout(fallbackTimer);
          window.removeEventListener('message', handshakeHandler);
        };
        window.addEventListener('beforeunload', cleanup);
      } catch (e) {
        console.error('[selfieVideo] open in editor failed preparing blobs', e);
        // Best-effort fallback: write urls only and open editor
        try {
          localStorage.setItem('wild_import_videos', JSON.stringify(payload));
        } catch (er) {
          console.warn('Failed to write localStorage import payload', er);
        }
        try {
          if (!newWin) window.open(editorUrl, '_blank');
        } catch (err) {
          console.error('[selfieVideo] fallback open editor failed', err);
        }
      }
    } catch (e) {
      console.error('[selfieVideo] open in editor failed', e);
      alert('Failed to open editor. Please ensure your video editor is running on http://localhost:3001');
    }
  };

  const openUploadModal = (target: 'selfie' | 'friends' | 'step2Friend') => {
    setUploadTarget(target);
    setIsUploadModalOpen(true);
  };

  const handleUpload = (urls: string[]) => {
    if (uploadTarget === 'selfie') {
      if (urls.length > 0) {
        setSelfiePhoto(urls[0]);
      }
    } else if (uploadTarget === 'friends') {
      // If uploadReplaceIndex is set, replace that friend photo and clear corresponding generated image
      if (uploadReplaceIndex !== null && typeof uploadReplaceIndex === 'number') {
        const idx = uploadReplaceIndex;
        setFriendPhotos((prev) => {
          const next = [...prev];
          if (urls.length > 0) next[idx] = urls[0];
          return next;
        });
        setGeneratedImages((prev) => {
          const next = [...prev];
          // clear the generated image so user can regenerate
          next[idx] = '';
          return next;
        });
        setUploadReplaceIndex(null);
      } else {
        setFriendPhotos([...friendPhotos, ...urls]);
      }
    } else if (uploadTarget === 'step2Friend') {
      if (urls.length > 0) {
        setStep2FriendPhoto(urls[0]);
      }
    }
    setIsUploadModalOpen(false);
    setUploadTarget(null);
  };

  const handleCreateImageWithStep2Friend = async () => {
    if (!selfiePhoto || !step2FriendPhoto) return;
    // After this action, total friend photos will be friendPhotos.length + 1
    const totalRequired = (friendPhotos.length + 1) * IMAGE_COST;
    const delta = Math.max(0, totalRequired - prevImageCreditsRef.current);
    if (delta > 0 && creditBalance < delta) {
      alert(`You need ${delta} more credits to create this image. Your balance is ${creditBalance}.`);
      return;
    }

    if (delta > 0) {
      if (!tryDeduct(delta, prevImageCreditsRef)) return;
    }
    setIsGenerating(true);
    setShowLogoGifForCreate(true);
    setHideControlsDuringGenerate(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Please log in to generate images');
        if (delta > 0) rollbackDeduction(delta, prevImageCreditsRef);
        return;
      }

      const endpoint = API_BASE ? `${API_BASE}/api/workflows/selfie-video/generate-image` : '/api/workflows/selfie-video/generate-image';
      // Set model and aspect ratio as per requirements
      const model = 'gpt-1.5-image';
      const aspect_ratio = frameSize === 'vertical' ? '2:3' : '3:2';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          selfieImageUrl: selfiePhoto,
          friendImageUrl: step2FriendPhoto,
          frameSize: frameSize,
          customBackground: customBackground || undefined,
          customClothes: customClothes || undefined,
          model,
          aspect_ratio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Failed to generate image');
      }

      const data = await response.json();
      const imageUrl = data?.data?.imageUrl;
      if (!imageUrl) throw new Error('Missing imageUrl in response');

      const billing = { debitedCredits: Number(data?.data?.debitedcredits ?? data?.data?.debitedCredits ?? 0) || 0, status: String(data?.data?.status ?? data?.data?.debitStatus ?? data?.data?.debitstatus ?? '') };

      // Append the new image and billing
      const prevImgs = generatedImages;
      const newImages = [...prevImgs, imageUrl];
      setGeneratedImages(newImages);
      setGeneratedImageBilling((prev) => [...prev, billing]);
      setFriendPhotos((prev) => [...prev, step2FriendPhoto]);

      // Preserve existing generated videos where possible.
      // If the images array grew, append empty slots for the missing videos so we only generate those.
      setGeneratedVideos((prev) => {
        const prevVideos = Array.isArray(prev) ? [...prev] : [];
        const slots = Math.max(0, newImages.length - 1);
        // Truncate if fewer slots
        if (prevVideos.length > slots) {
          return prevVideos.slice(0, slots);
        }
        // Append empty strings for new slots
        while (prevVideos.length < slots) prevVideos.push('');
        return prevVideos;
      });

      // Keep playback/errors arrays in sync with videos
      setVideoPlayed((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        while (next.length < Math.max(0, newImages.length - 1)) next.push(false);
        return next.slice(0, Math.max(0, newImages.length - 1));
      });
      setVideoErrors((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        while (next.length < Math.max(0, newImages.length - 1)) next.push(null);
        return next.slice(0, Math.max(0, newImages.length - 1));
      });

      setVideosRequested(false);
      setStep2FriendPhoto(null);
    } catch (e: any) {
      console.error('[selfieVideo] handleCreateImageWithStep2Friend error', e);
      if (delta > 0) rollbackDeduction(delta, prevImageCreditsRef);
      alert(e?.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
      setShowLogoGifForCreate(false);
      setHideControlsDuringGenerate(false);
    }
  };

  const stepDisplayNumber = Math.min(4, Math.max(1, step + 1));

  return (
    <>
      <style>{`
        .animate-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .video-placeholder { position: relative; overflow: hidden; }
        .video-placeholder::after {
          content: ''; position: absolute; top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer { 100% { left: 150%; } }
      `}</style>

      <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 md:pl-20 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        {/* overlay excludes left sidebar area on md+ so sidebar remains visible */}
        <div className="absolute top-0 right-0 bottom-0 left-0 md:left-20 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>

        <div className={`relative w-full max-w-6xl h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>

          {(!isFullScreenStep || step === 3) && (
            <button onClick={onClose} className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          )}

          <div className="flex w-full h-full">
            <div className={`w-full md:w-[40%] p-8 lg:p-12 flex flex-col border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto ${isFullScreenStep ? 'hidden' : 'flex'}`}>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-white/10 px-2 py-1 rounded-full">Step 1/4</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
                <p className="text-slate-400 text-lg mb-8">Upload your photo and friend photos to start.</p>

                <div className="mb-4">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">1. Your Photo</label>
                  {selfiePhoto ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
                      <img src={selfiePhoto} className="w-full h-full object-cover" alt="selfie" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => openUploadModal('selfie')}>
                        {/* <span className="text-white text-xs font-medium">Change Photo</span> */}
                      </div>
                    </div>


                  ) : (
                    <div onClick={() => openUploadModal('selfie')} className="border border-dashed border-white/15 rounded-xl bg-black/20 h-24 flex items-center justify-center gap-3 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center text-slate-400"><Camera size={16} /></div>
                      <span className="text-sm text-slate-400">Upload your selfie</span>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">2. Friend Photos</label>
                  {friendPhotos.length === 0 ? (
                    <div onClick={() => openUploadModal('friends')} className="border border-dashed border-white/15 rounded-xl bg-black/20 h-24 flex items-center justify-center gap-3 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-[#60a5fa]/20 transition-all"><Plus size={16} /></div>
                      <span className="text-sm text-slate-400 group-hover:text-white">Upload friend photos</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {friendPhotos.map((photo, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
                          <img src={photo} className="w-full h-full object-cover" alt="friend" />
                          <button
                            onClick={() => setFriendPhotos(friendPhotos.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => openUploadModal('friends')} className="w-20 h-20 rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center hover:text-[#60a5fa] transition-all"><Plus size={20} /></button>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">3. Frame Size</label>
                  <div className="flex gap-3">
                    <button onClick={() => setFrameSize("vertical")} className={`flex-1 py-2 rounded-lg text-sm border ${frameSize === "vertical" ? "bg-[#60a5fa]/20 border-[#60a5fa] text-[#60a5fa]" : "border-white/10 text-slate-400"}`}>Vertical (9:16)</button>
                    <button onClick={() => setFrameSize("horizontal")} className={`flex-1 py-2 rounded-lg text-sm border ${frameSize === "horizontal" ? "bg-[#60a5fa]/20 border-[#60a5fa] text-[#60a5fa]" : "border-white/10 text-slate-400"}`}>Horizontal (16:9)</button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
                    4. Custom Background
                    <span className="text-[9px] normal-case font-normal text-slate-300 bg-slate-800/50 px-1.5 py-0.5 rounded">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={customBackground}
                    onChange={(e) => setCustomBackground(e.target.value)}
                    placeholder="e.g., beach sunset, office, studio..."
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">Describe the background you want for your video</p>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
                    5. Custom Clothes
                    <span className="text-[9px] normal-case font-normal text-slate-300 bg-slate-800/50 px-1.5 py-0.5 rounded">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={customClothes}
                    onChange={(e) => setCustomClothes(e.target.value)}
                    placeholder="e.g., formal suits, casual streetwear, traditional outfits..."
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">If set, update the outfits for everyone in the photo to match this style.</p>
                </div>
              </div>

              {/* Total reserved credits badge */}
              <div className="absolute right-6 bottom-6 z-40">
                <div className="px-3 py-2 bg-white/5 text-xs text-slate-200 rounded-md border border-white/10">Reserved: {totalReservedCredits()} credits</div>
              </div>

              <div className="pt-6 border-t border-white/5 mt-auto">
                {!hideControlsDuringGenerate && (
                  <button onClick={handleMergeImages} disabled={isGenerating || !selfiePhoto || friendPhotos.length === 0} className={`w-full py-4 bg-[#60a5fa] hover:bg-[#4f8edb] text-black font-bold rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 ${(isGenerating || !selfiePhoto || friendPhotos.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isGenerating ? <><span className="animate-spin"><Sparkles size={18} /></span> Generating...</> : "Submit & Generate"}
                  </button>
                )}
                {generatedImages.some((img) => Boolean(img)) && (
                  !hideControlsDuringGenerate && (
                    <button
                      onClick={() => setStep(1)}
                      className="w-full mt-3 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-all hover:scale-[1.01]"
                    >
                      Next
                    </button>
                  )
                )}
              </div>
            </div>

            <div className={`relative bg-[#020202] ${isFullScreenStep ? 'w-full h-full p-0 flex flex-col' : 'w-full md:w-[60%] p-8 flex items-center justify-center'}`}>
              {/* Generating overlay: shows a centered animation/message during long-running operations */}
              {isGenerating && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md">
                  <div className="flex flex-col items-center gap-4 px-6 py-6 rounded-lg">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <div className="animate-spin text-white"><Sparkles size={34} /></div>
                    </div>
                    <div className="text-white font-semibold text-lg">
                      {step === 2 ? 'Generating videos...' : step === 0 ? 'Generating images...' : 'Processing...'}
                    </div>
                    <div className="text-slate-300 text-sm">This can take a minute — please keep this window open.</div>
                  </div>
                </div>
              )}
              {step === 0 && (
                <div className="text-center opacity-50">
                  <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10"><ImageIcon size={48} className="text-slate-600" /></div>
                  <p className="text-slate-500">Preview will appear here</p>
                </div>
              )}

              {step === 1 && (
                <div className="w-full h-full flex flex-col animate-in relative">
                  <div className="flex justify-between items-start p-8 z-20 absolute top-0 w-full bg-gradient-to-b from-black/80 to-transparent">
                    <div>
                      <div className="inline-flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-white/10 px-2 py-1 rounded-full">Step {stepDisplayNumber}/4</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">Images</span>

                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 pb-24 flex justify-center items-center">
                    <div className={`grid gap-6 w-full max-w-7xl content-center ${frameSize === 'horizontal' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>


                      {generatedImages.map((src, i) => (
                        <div key={i} className={`relative group bg-[#111] rounded-lg overflow-hidden border border-white/10 ${frameSize === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]'}`}>
                          {src ? (
                            <>
                              <img src={src} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="generated" />
                              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a
                                  href={src}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-black/70 text-white border border-white/20 hover:bg-black/80 transition-colors"
                                >
                                  Download
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="animate-spin"><Sparkles size={24} className="text-slate-600" /></div>
                            </div>
                          )}
                          {generatedImageBilling[i] && (
                            <div className="absolute top-3 left-3 bg-black/60 text-xs text-slate-200 px-2 py-1 rounded-md border border-white/10">
                              {generatedImageBilling[i].debitedCredits ? `${generatedImageBilling[i].debitedCredits} cr` : ''} {generatedImageBilling[i].status ? `· ${generatedImageBilling[i].status}` : ''}
                            </div>
                          )}
                          <div
                            className="absolute bottom-3 right-3 flex items-center gap-2"
                          >
                            {!hideControlsDuringGenerate && (
                              <div
                                onClick={() => regenerateImage(i)}
                                className="w-7 h-7 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-[#60a5fa] hover:text-black transition-all cursor-pointer"
                                aria-label="Regenerate image"
                              >
                                <RefreshCw size={14} />
                              </div>
                            )}

                          </div>
                        </div>
                      ))}

                      {/* Step 2 friend preview/upload tile */}
                      <div
                        className={`relative group bg-[#111] rounded-lg overflow-hidden border border-white/10 ${frameSize === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]'}`}
                      >
                        {step2FriendPhoto ? (
                          <>
                            <img src={step2FriendPhoto} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="friend preview" />
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => openUploadModal('step2Friend')}
                                disabled={isGenerating}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md bg-black/70 text-white border border-white/20 hover:bg-black/80 transition-colors ${(isGenerating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                Upload
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleCreateImageWithStep2Friend()}
                                disabled={isGenerating || !selfiePhoto}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md bg-[#60a5fa] text-black hover:bg-[#4f8edb] transition-colors ${(isGenerating || !selfiePhoto) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {showLogoGifForCreate ? (
                                  <img src="/logo.gif" alt="loading" className="w-6 h-6 object-contain" />
                                ) : (
                                  'Create'
                                )}
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openUploadModal('step2Friend')}
                            disabled={isGenerating}
                            className={`w-full h-full flex flex-col items-center justify-center gap-3 ${(isGenerating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-colors">
                              <Plus size={18} />
                            </div>
                            <div className="text-sm text-slate-400 group-hover:text-white transition-colors">Upload friend photo</div>
                          </button>
                        )}
                      </div>

                      <div className="absolute right-6 bottom-6 z-30">
                        <div className="px-3 py-2 bg-black/40 text-xs text-slate-200 rounded-md border border-white/10">Step credits: {prevImageCreditsRef.current} img, {prevVideoCreditsRef.current} vid — Total {totalReservedCredits()}</div>
                      </div>

                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 z-30">
                    <button onClick={handleNextFromImages} className="py-3 px-8 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-md shadow-lg transition-all hover:scale-105">
                      Next
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="w-full h-full flex flex-col animate-in relative">
                  <div className="flex justify-between items-start p-8 z-20 absolute top-0 w-full bg-gradient-to-b from-black/80 to-transparent">
                    <div>
                      <div className="inline-flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-white/10 px-2 py-1 rounded-full">Step {stepDisplayNumber}/4</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">Videos</span>

                      </div>
                    </div>
                    <button onClick={() => setStep(1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                      <ArrowLeft size={24} className="text-white" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 pb-24 flex justify-center items-center">
                    <div className={`grid gap-6 w-full max-w-7xl content-center ${frameSize === 'horizontal' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
                      {(generatedVideos.length > 0 ? generatedVideos : ['']).map((src, i) => {
                        const err = videoErrors[i];

                        if (err) {
                          return (
                            <div key={i} className={`relative group bg-[#111] rounded-lg overflow-hidden border border-red-500/60 ${frameSize === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]'}`}>
                              <div className="w-full h-full flex items-center justify-center px-4 text-center text-sm text-red-300">
                                {err}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void regenerateVideo(i);
                                }}
                                className="absolute bottom-3 right-3 w-7 h-7 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-[#60a5fa] hover:text-black transition-all"
                                aria-label="Regenerate video"
                              >
                                {!hideControlsDuringGenerate && <RefreshCw size={14} />}
                              </button>
                            </div>
                          );
                        }

                        if (!src) {
                          return (
                            <div key={i} className={`relative group bg-[#111] rounded-lg overflow-hidden border border-white/10 video-placeholder ${frameSize === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]'}`}>
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="animate-spin"><Sparkles size={24} className="text-slate-600" /></div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={i}
                            className={`relative group bg-[#111] rounded-lg overflow-hidden border border-white/10 ${frameSize === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]'}`}
                            onClick={() => {
                              const v = videoRefs.current[i];
                              if (v) {
                                v.play().catch(() => { });
                              }
                              setVideoPlayed((prev) => {
                                const next = [...prev];
                                next[i] = true;
                                return next;
                              });
                            }}
                          >
                            <video
                              src={src}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                              muted
                              playsInline
                              loop
                              preload="metadata"
                              controls
                              ref={(el) => { videoRefs.current[i] = el; }}
                            />
                            {!videoPlayed[i] && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const v = videoRefs.current[i];
                                  if (v) {
                                    v.play().catch(() => { });
                                  }
                                  setVideoPlayed((prev) => {
                                    const next = [...prev];
                                    next[i] = true;
                                    return next;
                                  });
                                }}
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <div className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur flex items-center justify-center pl-1">
                                  <Play size={18} fill="white" />
                                </div>
                              </button>
                            )}
                            <a
                              href={src}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-3 right-3 px-3 py-1.5 text-xs font-medium rounded-md bg-black/70 text-white border border-white/20 hover:bg-black/80 transition-colors"
                            >
                              Download
                            </a>
                            {/* Aspect ratio badge (shows 9:16 or 16:9 to match generated video) */}
                            <div className="absolute top-3 right-14 px-2 py-1 rounded-md bg-black/60 text-xs font-semibold text-white border border-white/10">
                              {frameSize === 'vertical' ? '9:16' : '16:9'}
                            </div>
                            {/* If this is the last generated video tile, show a small Loop button to rotate images and regenerate sequence */}
                            {/* {i === Math.max(0, generatedVideos.length - 1) && generatedImages.filter(u => typeof u === 'string' && u.length > 0).length >= 2 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleLoopAndRegenerate();
                                }}
                                className="absolute bottom-3 right-12 px-3 py-1.5 text-xs font-semibold rounded-md bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 hover:text-black transition-all"
                                aria-label="Loop and regenerate"
                              >
                                Loop
                              </button>
                            )} */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void regenerateVideo(i);
                              }}
                              className="absolute bottom-3 right-3 w-7 h-7 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-[#60a5fa] hover:text-black transition-all"
                              aria-label="Regenerate video"
                            >
                              {!hideControlsDuringGenerate && <RefreshCw size={14} />}
                            </button>
                          </div>
                        );
                      })}
                      {/* Dedicated Loop tile: appears to the right of videos grid and matches aspect ratio */}
                      {generatedImages.filter(u => typeof u === 'string' && u.length > 0).length >= 2 && (
                        <div className={`relative group bg-[#0d0d0d] rounded-lg overflow-hidden border border-white/10 flex items-center justify-center ${frameSize === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]'}`}>
                          <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 text-xs font-semibold text-white border border-white/10">
                            {frameSize === 'vertical' ? '9:16' : '16:9'}
                          </div>
                          <div className="text-center px-4">
                            <div className="mb-3 text-sm text-slate-300">Create loop video</div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); void handleLoopAndRegenerate(); }}
                              disabled={isGenerating}
                              className={`px-6 py-3 rounded-lg text-sm font-semibold ${isGenerating ? 'bg-white/10 text-slate-400 cursor-not-allowed' : 'bg-[#60a5fa] text-black hover:bg-[#4f8edb]'}`}
                            >
                              {isGenerating ? 'Generating...' : 'Loop'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 z-30">
                    <button onClick={handleOpenInEditor} className="py-3 px-8 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-md shadow-lg transition-all hover:scale-105">
                      Open in Editor
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="w-full h-full flex flex-col items-center justify-center animate-in bg-black relative">
                  <div className="absolute top-0 left-0 right-0 p-8 z-20 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="inline-flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-white/10 px-2 py-1 rounded-full">Step {stepDisplayNumber}/4</span>
                    </div>
                    <div className="text-white text-xl font-medium">Final Video</div>
                  </div>
                  <div className="w-full max-w-4xl aspect-video bg-[#111] border border-white/10 rounded-xl overflow-hidden relative shadow-2xl">
                    <img src={finalVideoUrl || ""} className="w-full h-full object-cover opacity-80" alt="final video" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center pl-1 cursor-pointer hover:scale-110 transition-transform"><Play size={40} fill="white" /></div>
                    </div>
                    <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleLoopAndRegenerate();
                        }}
                        disabled={isGenerating || generatedImages.filter(u => typeof u === 'string' && u.length > 0).length < 2}
                        className={`px-3 py-2 rounded-md text-sm font-semibold border border-white/20 transition-all ${isGenerating ? 'bg-white/10 text-slate-400 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        aria-label="Loop and regenerate"
                      >
                        Loop
                      </button>
                      <a
                        href={finalVideoUrl || undefined}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 rounded-md text-sm font-semibold border border-white/20 shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all ${finalVideoUrl ? 'bg-[#3b82f6] hover:bg-[#2563eb] text-white' : 'bg-white/10 text-slate-400 cursor-not-allowed'}`}
                        aria-disabled={!finalVideoUrl}
                      >
                        Download
                      </a>
                    </div>
                    <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black to-transparent">
                      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-[#60a5fa]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal - Higher z-index to appear above SelfieVideo modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[110]">
          <UploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onAdd={handleUpload}
            remainingSlots={uploadTarget === 'selfie' || uploadTarget === 'step2Friend' ? 1 : 10}
            initialTab="computer"
            enableCameraCapture
            cameraFacingMode={uploadTarget === 'selfie' ? 'user' : 'environment'}
          />
        </div>
      )}
    </>
  );
}