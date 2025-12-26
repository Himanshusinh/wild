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
  const [isGenerating, setIsGenerating] = useState(false);

  // State Management: 0: Upload, 1: Images Grid, 2: Videos Grid, 3: Final Video
  const [step, setStep] = useState(0);
  const [frameSize, setFrameSize] = useState<"vertical" | "horizontal">("vertical");
  const [friendPhotos, setFriendPhotos] = useState<string[]>([]);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [customBackground, setCustomBackground] = useState<string>("");

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'selfie' | 'friends' | null>(null);

  // Result Data
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [videoPlayed, setVideoPlayed] = useState<boolean[]>([]);
  const [videoErrors, setVideoErrors] = useState<(string | null)[]>([]);
  const [videosRequested, setVideosRequested] = useState<boolean>(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const {
    creditBalance,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction,
  } = useCredits();

  const IMAGE_COST = 98;
  const VIDEO_COST = 360;

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(false);
      setStep(0);
      setFriendPhotos([]);
      setSelfiePhoto(null);
      setCustomBackground("");
      setGeneratedImages([]);
      setGeneratedVideos([]);
      setFinalVideoUrl(null);
      setVideoErrors([]);
      setVideoPlayed([]);
      setVideosRequested(false);
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

    const requiredCredits = friendPhotos.length * IMAGE_COST;
    if (creditBalance < requiredCredits) {
      alert(`You need ${requiredCredits} credits to generate these images. Your balance is ${creditBalance}.`);
      return;
    }

    deductCreditsOptimisticForGeneration(requiredCredits);
    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Please log in to generate images');
        setIsGenerating(false);
        rollbackOptimisticDeduction(requiredCredits);
        return;
      }

      const generatePromises = friendPhotos.map(async (friendPhoto, index) => {
        try {
          const response = await fetch('/api/workflows/selfie-video/generate-image', {
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
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to generate image ${index + 1}`);
          }

          const data = await response.json();
          return {
            success: true,
            imageUrl: data.data.imageUrl,
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
      let hasErrors = false;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          generatedUrls[index] = result.value.imageUrl;
        } else {
          hasErrors = true;
          generatedUrls[index] = '';
          console.error(`Image ${index + 1} failed:`, result.status === 'fulfilled' ? result.value.error : result.reason);
        }
      });

      setGeneratedImages(generatedUrls);
      setIsGenerating(false);

      if (!hasErrors && generatedUrls.every(url => url)) {
        setStep(1);
      } else {
        rollbackOptimisticDeduction(requiredCredits);
        alert('Some images failed to generate. Please try again.');
      }
    } catch (error: any) {
      console.error('Error in handleMergeImages:', error);
      setIsGenerating(false);
      rollbackOptimisticDeduction(requiredCredits);
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

    deductCreditsOptimisticForGeneration(requiredCredits);
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
        rollbackOptimisticDeduction(requiredCredits);
        setGeneratedImages((prev) => {
          const next = [...prev];
          next[index] = previousUrl;
          return next;
        });
        return;
      }

      const response = await fetch('/api/workflows/selfie-video/generate-image', {
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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate image');
      }

      const data = await response.json();
      const newUrl = data?.data?.imageUrl;
      if (!newUrl) throw new Error('Missing imageUrl in response');

      // IMPORTANT: use a fresh array reference so React re-renders
      setGeneratedImages((prev) => {
        const next = [...prev];
        next[index] = newUrl;
        return next;
      });
    } catch (error: any) {
      console.error(`Error regenerating image ${index + 1}:`, error);
      alert('Failed to regenerate image. Please try again.');
      rollbackOptimisticDeduction(requiredCredits);
      setGeneratedImages((prev) => {
        const next = [...prev];
        next[index] = previousUrl;
        return next;
      });
    }
  };

  const handleImagesToVideos = async () => {
    const images = generatedImages.filter((u) => typeof u === 'string' && u.length > 0);
    if (images.length < 2) {
      alert('Please generate at least 2 images first.');
      return;
    }

    const slots = Math.max(0, images.length - 1);
    const requiredCredits = slots * VIDEO_COST;
    if (creditBalance < requiredCredits) {
      alert(`You need ${requiredCredits} credits to generate these videos. Your balance is ${creditBalance}.`);
      return;
    }

    deductCreditsOptimisticForGeneration(requiredCredits);
    setIsGenerating(true);
    // n images => n-1 videos (pairwise transitions)
    setGeneratedVideos(new Array(slots).fill(''));
    setVideoPlayed(new Array(slots).fill(false));
    setVideoErrors(new Array(slots).fill(null));
    setVideosRequested(true);
    setStep(2);

    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Please log in to generate videos');
        setIsGenerating(false);
        rollbackOptimisticDeduction(requiredCredits);
        return;
      }

      const aspectRatio = frameSize === 'vertical' ? '9:16' : '16:9';
      const backgroundClause = customBackground && customBackground.trim().length > 0
        ? ` Set the scene in ${customBackground}.`
        : '';
      const basePrompt = `Create a smooth, realistic video transition from the first frame ({FIRST_FRAME_DESC}) to the last frame ({LAST_FRAME_DESC}). The person who appears in BOTH the first and last frames must remain the same individual and act as the anchor of the transition. Do not morph; instead, show this shared person moving naturally through space—walking or stepping forward toward the second person in the last frame to take a selfie together.

    Drive the transition with continuous physical motion of this shared person (forward movement, slight body shift, natural arm extension). Let the background and scene evolve gradually as they move; no abrupt swaps. The camera may gently orbit up to 180 degrees around the shared person to emphasize motion, but keep the movement smooth and cinematic. Ensure the shared person visibly walks or advances so it feels intentional and natural, never like a morph.${backgroundClause}

    Strictly preserve identity, facial features, skin tone, hairstyle, and proportions of all subjects. Maintain consistent lighting, camera perspective, and environmental continuity. Use smooth camera easing and realistic motion interpolation. Avoid abrupt scene cuts, sudden background swaps, morphing artifacts, ghosting, warping, text, logos, or watermarks.`;

      // 1) Submit all jobs first (so you'll see multiple submit requests)
      const submitJobs = await Promise.all(
        Array.from({ length: images.length - 1 }).map(async (_v, i) => {
          const firstFrameUrl = images[i];
          const lastFrameUrl = images[i + 1];

          const submitRes = await fetch('/api/replicate/seedance-i2v/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              model: 'bytedance/seedance-1-pro',
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
            throw new Error(msg);
          }

          const submitJson = await submitRes.json();
          const requestId = submitJson?.data?.requestId || submitJson?.data?.requestID || submitJson?.data?.taskId;
          if (!requestId) throw new Error(`Missing requestId for video ${i + 1}`);
          return { index: i, requestId: String(requestId) };
        })
      );

      // 2) Poll all results concurrently and fill slots as they complete
      await Promise.all(
        submitJobs.map(async ({ index, requestId }) => {
          try {
            const videoUrl = await pollReplicateVideoResult(requestId, token);
            setGeneratedVideos((prev) => {
              const next = [...prev];
              next[index] = videoUrl;
              return next;
            });
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
      rollbackOptimisticDeduction(requiredCredits);
      alert(err?.message || 'Failed to generate videos. Please try again.');
    }
  };

  const handleVideosToFinal = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setFinalVideoUrl("https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200");
      setIsGenerating(false);
      setStep(3);
    }, 2000);
  };

  const openUploadModal = (target: 'selfie' | 'friends') => {
    setUploadTarget(target);
    setIsUploadModalOpen(true);
  };

  const handleUpload = (urls: string[]) => {
    if (uploadTarget === 'selfie') {
      if (urls.length > 0) {
        setSelfiePhoto(urls[0]);
      }
    } else if (uploadTarget === 'friends') {
      setFriendPhotos([...friendPhotos, ...urls]);
    }
    setIsUploadModalOpen(false);
    setUploadTarget(null);
  };

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

      <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>

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
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10 group">
                      <img src={selfiePhoto} className="w-full h-full object-cover" alt="selfie" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => openUploadModal('selfie')}>
                        <span className="text-white text-sm font-medium">Change Photo</span>
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
                    <span className="text-[9px] normal-case font-normal text-slate-600 bg-slate-800/50 px-1.5 py-0.5 rounded">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={customBackground}
                    onChange={(e) => setCustomBackground(e.target.value)}
                    placeholder="e.g., beach sunset, office, studio..."
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all"
                  />
                  <p className="text-[11px] text-slate-600 mt-1.5">Describe the background you want for your video</p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 mt-auto">
                <button onClick={handleMergeImages} disabled={isGenerating || !selfiePhoto || friendPhotos.length === 0} className={`w-full py-4 bg-[#60a5fa] hover:bg-[#4f8edb] text-black font-bold rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 ${(isGenerating || !selfiePhoto || friendPhotos.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isGenerating ? <><span className="animate-spin"><Sparkles size={18} /></span> Generating...</> : "Submit & Generate"}
                </button>
                {generatedImages.some((img) => Boolean(img)) && (
                  <button
                    onClick={() => setStep(1)}
                    className="w-full mt-3 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-all hover:scale-[1.01]"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>

            <div className={`relative bg-[#020202] ${isFullScreenStep ? 'w-full h-full p-0 flex flex-col' : 'w-full md:w-[60%] p-8 flex items-center justify-center'}`}>
              {step === 0 && (
                <div className="text-center opacity-50">
                  <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10"><ImageIcon size={48} className="text-slate-600" /></div>
                  <p className="text-slate-500">Preview will appear here</p>
                </div>
              )}

              {step === 1 && (
                <div className="w-full h-full flex flex-col animate-in relative">
                  <div className="flex justify-between items-center p-8 z-20 absolute top-0 w-full bg-gradient-to-b from-black/80 to-transparent">
                    <h2 className="text-white text-xl font-medium">Images</h2>
                    <button onClick={() => setStep(0)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                      <ArrowLeft size={24} className="text-white" />
                    </button>
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
                          <div
                            onClick={() => regenerateImage(i)}
                            className="absolute bottom-3 right-3 w-7 h-7 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-[#60a5fa] hover:text-black transition-all cursor-pointer"
                            aria-label="Regenerate image"
                          >
                            <RefreshCw size={14} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 z-30">
                    <button onClick={handleImagesToVideos} className="py-3 px-8 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-md shadow-lg transition-all hover:scale-105">
                      Next
                    </button>
                  </div>
                  <div className="absolute bottom-8 right-8 z-30">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!(videosRequested || generatedVideos.some((u) => u))}
                      className={`py-3 px-8 rounded-md shadow-lg transition-all hover:scale-105 ${videosRequested || generatedVideos.some((u) => u) ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
                    >
                      Go to Videos
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="w-full h-full flex flex-col animate-in relative">
                  <div className="flex justify-between items-center p-8 z-20 absolute top-0 w-full bg-gradient-to-b from-black/80 to-transparent">
                    <h2 className="text-white text-xl font-medium">Videos</h2>
                    <button onClick={() => setStep(1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                      <ArrowLeft size={24} className="text-white" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 pb-24 flex justify-center items-center">
                    {(() => {
                      const allReady = generatedVideos.length > 0 && generatedVideos.every((u) => typeof u === 'string' && u.length > 0);
                      const anyError = videoErrors.some((m) => m);
                      if (!allReady && !anyError) {
                        // Show placeholders until all videos are ready
                        const count = Math.max(1, generatedVideos.length || 2);
                        return (
                          <div className={`grid gap-6 w-full max-w-7xl content-center ${frameSize === 'horizontal' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
                            {Array.from({ length: count }).map((_, i) => (
                              <div key={i} className={`relative group bg-[#111] rounded-lg overflow-hidden border border-white/10 video-placeholder ${frameSize === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]'}`}>
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="animate-spin"><Sparkles size={24} className="text-slate-600" /></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      // Render videos when all ready or show errors inline
                      return (
                        <div className={`grid gap-6 w-full max-w-7xl content-center ${frameSize === 'horizontal' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
                          {generatedVideos.map((src, i) => {
                            const err = videoErrors[i];
                            if (err) {
                              return (
                                <div key={i} className={`relative group bg-[#111] rounded-lg overflow-hidden border border-red-500/60 ${frameSize === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]'}`}>
                                  <div className="w-full h-full flex items-center justify-center px-4 text-center text-sm text-red-300">
                                    {err}
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
                                    v.play().catch(() => {});
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
                                        v.play().catch(() => {});
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
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="absolute bottom-8 left-8 z-30">
                    <button onClick={handleVideosToFinal} className="py-3 px-8 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-md shadow-lg transition-all hover:scale-105">
                      Next
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="w-full h-full flex flex-col items-center justify-center animate-in bg-black relative">
                  <div className="absolute top-8 left-8 text-white text-xl font-medium z-20">Final Video</div>
                  <div className="w-full max-w-4xl aspect-video bg-[#111] border border-white/10 rounded-xl overflow-hidden relative shadow-2xl">
                    <img src={finalVideoUrl || ""} className="w-full h-full object-cover opacity-80" alt="final video" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center pl-1 cursor-pointer hover:scale-110 transition-transform"><Play size={40} fill="white" /></div>
                    </div>
                    <div className="absolute top-4 right-4 z-30">
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
            remainingSlots={uploadTarget === 'selfie' ? 1 : 10}
          />
        </div>
      )}
    </>
  );
}