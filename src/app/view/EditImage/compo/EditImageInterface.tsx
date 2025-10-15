'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { FilePlus, ChevronUp } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { getIsPublic } from '@/lib/publicFlag';
import FrameSizeDropdown from '@/app/view/Generation/ImageGeneration/TextToImage/compo/FrameSizeDropdown';
import StyleSelector from '@/app/view/Generation/ImageGeneration/TextToImage/compo/StyleSelector';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import { loadHistory, loadMoreHistory } from '@/store/slices/historySlice';

type EditFeature = 'upscale' | 'remove-bg' | 'resize';

const EditImageInterface: React.FC = () => {
  const searchParams = useSearchParams();
  const [selectedFeature, setSelectedFeature] = useState<EditFeature>('upscale');
  const [inputs, setInputs] = useState<Record<EditFeature, string | null>>({
    'upscale': null,
    'remove-bg': null,
    'resize': null,
  });
  // Per-feature outputs and processing flags so operations don't block each other
  const [outputs, setOutputs] = useState<Record<EditFeature, string | null>>({
    'upscale': null,
    'remove-bg': null,
    'resize': null,
  });
  const [processing, setProcessing] = useState<Record<EditFeature, boolean>>({
    'upscale': false,
    'remove-bg': false,
    'resize': false,
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [upscaleViewMode, setUpscaleViewMode] = useState<'comparison' | 'zoom'>('comparison');
  const [showImageMenu, setShowImageMenu] = useState(false);
 
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [fitScale, setFitScale] = useState(1);
 
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
 
  // Form states
  const [model, setModel] = useState<'' | 'philz1337x/clarity-upscaler' | 'fermatresearch/magic-image-refiner' | 'nightmareai/real-esrgan' | 'mv-lab/swin2sr' | '851-labs/background-remover' | 'lucataco/remove-bg'>('nightmareai/real-esrgan');
  const [prompt, setPrompt] = useState('');
  const [scaleFactor, setScaleFactor] = useState('');
  const [faceEnhance, setFaceEnhance] = useState(false);
  const [swinTask, setSwinTask] = useState<'classical_sr' | 'real_sr' | 'compressed_sr'>('real_sr');
  const getSwinTaskLabel = (t: 'classical_sr' | 'real_sr' | 'compressed_sr') => {
    if (t === 'classical_sr') return 'classical_sr: Upscale high-quality inputs (classical super-resolution).';
    if (t === 'real_sr') return 'real_sr: Upscale real-world photos with mixed noise/compression (default).';
    return 'compressed_sr: Upscale heavily compressed/low-bitrate images.';
  };
  const [output, setOutput] = useState<'' | 'png' | 'jpg' | 'jpeg' | 'webp'>('png');
  const [dynamic, setDynamic] = useState('');
  const [sharpen, setSharpen] = useState('');
  const [backgroundType, setBackgroundType] = useState('');
  const [threshold, setThreshold] = useState<string>('');
  const [reverseBg, setReverseBg] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'model' | 'output' | 'swinTask' | 'backgroundType' | ''>('');
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const selectedGeneratorModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-dev');
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const selectedStyle = useAppSelector((state: any) => state.generation?.style || 'none');
  const reduxUploadedImages = useAppSelector((state: any) => state.generation?.uploadedImages || []);
  const dispatch = useAppDispatch();

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const historyEntries = useAppSelector((s:any)=> (s.history?.entries || []).filter((e:any)=> e.generationType === 'text-to-image'));
  const historyLoading = useAppSelector((s:any)=> s.history?.loading || false);
  const historyHasMore = useAppSelector((s:any)=> s.history?.hasMore || false);
 
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from query params: feature and image
  useEffect(() => {
    // Ensure we have some history for the upload modal library tab
    (async () => {
      try { await (dispatch as any)(loadHistory({ filters: { generationType: 'text-to-image' }, paginationParams: { limit: 30 } })).unwrap(); } catch {}
    })();
    try {
      const featureParam = (searchParams?.get('feature') || '').toLowerCase();
      const imageParam = searchParams?.get('image') || '';
      const storagePathParam = searchParams?.get('sp') || '';
      const validFeature = ['upscale', 'remove-bg', 'resize'].includes(featureParam)
        ? (featureParam as EditFeature)
        : null;
      if (validFeature) {
        setSelectedFeature(validFeature);
        // Set default model based on feature
        if (validFeature === 'remove-bg') {
          setModel('851-labs/background-remover');
        } else if (validFeature === 'upscale') {
          setModel('nightmareai/real-esrgan');
        }
        // Prefer raw storage path if provided; use frontend proxy URL for preview rendering
        if (storagePathParam) {
          const frontendProxied = `/api/proxy/resource/${encodeURIComponent(storagePathParam)}`;
          setInputs((prev) => ({ ...prev, [validFeature]: frontendProxied }));
        } else if (imageParam && imageParam.trim() !== '') {
          setInputs((prev) => ({ ...prev, [validFeature]: imageParam }));
        }
      } else if (imageParam && imageParam.trim() !== '') {
        // Fallback: if only image provided, attach to current feature
        setInputs((prev) => ({ ...prev, [selectedFeature]: imageParam }));
      }
    } catch { }
    // Only run once on mount for initial hydration from URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zoom and pan utility functions (improved from ImagePreviewModal)
  const clampOffset = useCallback((newOffset: { x: number; y: number }, currentScale: number) => {
    if (!imageContainerRef.current) return newOffset;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const imgW = naturalSize.width * currentScale;
    const imgH = naturalSize.height * currentScale;
    const maxX = Math.max(0, (imgW - rect.width) / 2);
    const maxY = Math.max(0, (imgH - rect.height) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, newOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, newOffset.y))
    };
  }, [naturalSize]);

  const zoomToPoint = useCallback((point: { x: number; y: number }, newScale: number) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newOffsetX = centerX - (point.x * newScale);
    const newOffsetY = centerY - (point.y * newScale);
    const clamped = clampOffset({ x: newOffsetX, y: newOffsetY }, newScale);
    setScale(newScale);
    setOffset(clamped);
  }, [clampOffset]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
   
    const container = imageContainerRef.current;
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
   
    if (Math.abs(scale - fitScale) < 1e-3) {
      // Zoom to 1.5x at click point (more reasonable)
      zoomToPoint({ x: clickX, y: clickY }, Math.min(6, fitScale * 1.5));
    } else {
      // Reset to fit
      resetZoom();
    }
  }, [scale, fitScale, zoomToPoint, resetZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPanning(true);
    setLastPoint({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
   
    e.preventDefault();
    const deltaX = e.clientX - lastPoint.x;
    const deltaY = e.clientY - lastPoint.y;
   
    const newOffset = {
      x: offset.x + deltaX,
      y: offset.y + deltaY
    };
   
    const clampedOffset = clampOffset(newOffset, scale);
    setOffset(clampedOffset);
    setLastPoint({ x: e.clientX, y: e.clientY });
  }, [isPanning, scale, offset, lastPoint, clampOffset]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const next = Math.max(0.1, Math.min(6, scale + delta));
    if (next !== scale) zoomToPoint({ x: mx, y: my }, next);
  }, [scale, zoomToPoint]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      const newScale = Math.min(6, scale + 0.1);
      if (newScale !== scale) {
        setScale(newScale);
        setOffset(clampOffset(offset, newScale));
      }
    } else if (e.key === '-') {
      e.preventDefault();
      const newScale = Math.max(0.1, scale - 0.1);
      if (newScale !== scale) {
        setScale(newScale);
        setOffset(clampOffset(offset, newScale));
      }
    } else if (e.key === '0') {
      e.preventDefault();
      resetZoom();
    }
  }, [scale, offset, clampOffset, resetZoom]);


  // Reset offsets on image change; scale will be computed on image load
  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [outputs[selectedFeature]]);

  // Recompute fit scale when container resizes or natural size changes
  useEffect(() => {
    if (!imageContainerRef.current || !naturalSize.width || !naturalSize.height) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const fitCandidate = Math.min(rect.width / naturalSize.width, rect.height / naturalSize.height) || 1;
    const newFit = Math.min(1, fitCandidate); // do not upscale by default
    const centerOffset = { x: 0, y: 0 };
    setFitScale(newFit);
    setScale(1); // Always start at 100% zoom
    setOffset(centerOffset);
  }, [naturalSize]);
  useEffect(() => {
    const handleResize = () => {
      if (!imageContainerRef.current || !naturalSize.width || !naturalSize.height) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const fitCandidate = Math.min(rect.width / naturalSize.width, rect.height / naturalSize.height) || 1;
      const newFit = Math.min(1, fitCandidate);
      const centerOffset = { x: 0, y: 0 };
      setFitScale(newFit);
      setScale(1); // Always reset to 100% zoom on resize
      setOffset(centerOffset);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [naturalSize]);

  // Prevent page scroll when mouse is over image container
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (imageContainerRef.current && imageContainerRef.current.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Add passive: false to allow preventDefault
    document.addEventListener('wheel', handleGlobalWheel, { passive: false });
   
    return () => {
      document.removeEventListener('wheel', handleGlobalWheel);
    };
  }, []);

  // Prevent page scroll on Space when the image viewer has focus
  useEffect(() => {
    const handleSpaceScrollBlock = (e: KeyboardEvent) => {
      if (e.key === ' ' && imageContainerRef.current) {
        const active = document.activeElement;
        if (active && imageContainerRef.current.contains(active)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener('keydown', handleSpaceScrollBlock, { passive: false } as any);
    return () => window.removeEventListener('keydown', handleSpaceScrollBlock as any);
  }, []);

  // Force-disable page scroll while this interface is mounted
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = (document.documentElement as HTMLElement).style.overflow;
    document.body.style.overflow = 'hidden';
    (document.documentElement as HTMLElement).style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      (document.documentElement as HTMLElement).style.overflow = prevHtmlOverflow;
    };
  }, []);

  // Close image menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close image actions menu
      if (showImageMenu) {
        const target = event.target as Node | null;
        const menuEl = menuRef.current;
        const btnEl = menuButtonRef.current;
        if (menuEl && menuEl.contains(target as Node)) return;
        if (btnEl && btnEl.contains(target as Node)) return;
        setShowImageMenu(false);
      }

      // Close edit dropdowns (model/output)
      if (activeDropdown) {
        const el = event.target as HTMLElement | null;
        if (!(el && el.closest('.edit-dropdown'))) {
          setActiveDropdown('');
        }
      }
    };

    if (showImageMenu || activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showImageMenu, activeDropdown]);

  // Debug menu state
  useEffect(() => {
    if (showImageMenu) {
      console.log('🎯 MENU IS NOW VISIBLE! showImageMenu:', showImageMenu);
      console.log('TEST: Menu is now visible, outputs:', outputs[selectedFeature]);
    }
  }, [showImageMenu, outputs, selectedFeature]);

  const features = [
    { id: 'upscale', label: 'Upscale', description: 'Increase resolution while preserving details' },
    { id: 'remove-bg', label: 'Remove Background', description: 'Remove background from your image' },
    { id: 'resize', label: 'Resize (coming Soon....)', description: 'Resize image to specific dimensions' },
  ] as const;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = e.target?.result as string;
        setInputs((prev) => ({ ...prev, [selectedFeature]: img }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenUploadModal = () => setIsUploadOpen(true);

  const handleRun = async () => {
    const toAbsoluteProxyUrl = (url: string | null | undefined) => {
      if (!url) return url as any;
      if (url.startsWith('data:')) return url as any;
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
      // For Replicate, we must provide a publicly reachable URL. Use Zata public URL instead of localhost proxy.
      try {
        const RESOURCE_SEG = '/api/proxy/resource/';
        if (url.startsWith(RESOURCE_SEG)) {
          const decoded = decodeURIComponent(url.substring(RESOURCE_SEG.length));
          return `${ZATA_PREFIX}${decoded}`;
        }
        // Absolute to frontend origin
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const u = new URL(url);
          if (u.pathname.startsWith(RESOURCE_SEG)) {
            const decoded = decodeURIComponent(u.pathname.substring(RESOURCE_SEG.length));
            return `${ZATA_PREFIX}${decoded}`;
          }
          return url as any;
        }
      } catch { }
      return url as any;
    };

    const currentInputRaw = inputs[selectedFeature];
    const currentInput = toAbsoluteProxyUrl(currentInputRaw) as any;
    if (!currentInput) return;
    setErrorMsg('');
    setOutputs((prev) => ({ ...prev, [selectedFeature]: null }));
    setProcessing((prev) => ({ ...prev, [selectedFeature]: true }));
    try {
      const isPublic = await getIsPublic();

      if (selectedFeature === 'remove-bg') {
        const body: any = {
          image: currentInput,
          isPublic,
          model,
        };
        if (model.startsWith('851-labs/')) {
          if (output) body.format = output as any;
          if (backgroundType) body.background_type = backgroundType;
          if (threshold) body.threshold = Number(threshold);
          if (reverseBg) body.reverse = true;
        }
        const res = await axiosInstance.post('/api/replicate/remove-bg', body);
        console.log('[EditImage] remove-bg.res', res?.data);
        const out = res?.data?.data?.url || res?.data?.data?.image || res?.data?.data?.images?.[0]?.url || res?.data?.url || res?.data?.image || '';
        if (out) setOutputs((prev) => ({ ...prev, ['remove-bg']: out }));
      } else if (false) {
        // Route to provider based on selected model
        const chosenModel = selectedGeneratorModel || 'gemini-25-flash-image';
        const isRunway = chosenModel === 'gen4_image' || chosenModel === 'gen4_image_turbo' || chosenModel === 'gemini_2.5_flash';
        const isFalImageModel = chosenModel === 'gemini-25-flash-image' || chosenModel.toLowerCase().includes('seedream');
        const isFluxKontext = chosenModel.startsWith('flux-kontext');
        const isMiniMax = chosenModel === 'minimax-image-01';
        if (isMiniMax) {
          setErrorMsg('MiniMax is not supported for image edit with prompt. Please choose Runway Gen4, Flux Kontext Pro/Max, Google Nano Banana, or Seedream v4.');
          return;
        }
        if (!isRunway && !isFalImageModel && !isFluxKontext) {
          setErrorMsg('This model does not support image edit with prompt. Please select Runway Gen4, Flux Kontext Pro/Max, Google Nano Banana, or Seedream v4.');
          return;
        }

        if (isRunway) {
          // Map simple aspect ratios to Runway pixel ratios
          const mapToRunwayRatio = (ratio: string): string => {
            switch (ratio) {
              case '1:1': return '1024:1024'; // allowed
              case '9:16': return '720:1280'; // allowed
              case '16:9': return '1280:720'; // allowed
              case '3:4': return '1080:1440'; // allowed
              case '4:3': return '1440:1080'; // allowed
              case '2:3': return '720:1080'; // not listed; use closest allowed 720:1280
              case '3:2': return '1360:768'; // allowed set includes 1360:768
              case '21:9': return '1680:720'; // allowed
              default: return '1024:1024';
            }
          };
          const runwayPayload: any = {
            promptText: prompt || '',
            model: chosenModel,
            ratio: mapToRunwayRatio(String(frameSize)),
            referenceImages: [{ uri: currentInput }],
            uploadedImages: [currentInput],
            generationType: 'text-to-image',
            isPublic,
          };
          const res = await axiosInstance.post('/api/runway/generate', runwayPayload);
          const taskId = res?.data?.data?.taskId || res?.data?.taskId;
         
          if (taskId) {
            // Poll for completion like the image generation flow
            let imageUrl: string | undefined;
            for (let attempts = 0; attempts < 360; attempts++) {
              try {
                const statusRes = await axiosInstance.get(`/api/runway/status/${taskId}`);
                const status = statusRes?.data?.data || statusRes?.data;
               
                if (status?.status === 'completed' && Array.isArray(status?.images) && status.images.length > 0) {
                  imageUrl = status.images[0]?.url || status.images[0]?.originalUrl;
                  break;
                }
                if (status?.status === 'failed') {
                  throw new Error('Runway generation failed');
                }
              } catch (statusError) {
                console.error('Status check failed:', statusError);
                if (attempts === 359) throw statusError; // Only throw on final attempt
              }
              await new Promise(res => setTimeout(res, 1000));
            }
           
            if (imageUrl) {
              // no-op after removing using-prompt feature
            } else {
              throw new Error('Runway generation did not complete in time');
            }
          } else {
            throw new Error('No task ID returned from Runway');
          }
        } else if (isFalImageModel) {
          // FAL models
          const promptWithStyle = selectedStyle && selectedStyle !== 'none' ? `${prompt} [Style: ${selectedStyle}]` : (prompt || '');
          let payload: any;
          if (chosenModel.toLowerCase().includes('seedream')) {
            // Seedream v4 expects specific fields
            payload = {
              prompt: promptWithStyle,
              model: 'bytedance/seedream-4',
              size: '2K',
              aspect_ratio: frameSize,
              image_input: [currentInput],
              sequential_image_generation: 'disabled',
              max_images: 1,
              isPublic,
            };
           
            // Use Replicate generate endpoint (same as image generation flow)
            const res = await axiosInstance.post('/api/replicate/generate', payload);
            const out = res?.data?.images?.[0]?.url || res?.data?.data?.images?.[0]?.url || res?.data?.data?.url || res?.data?.url || '';
            if (out) {}
            return;
          } else {
            // Google Nano Banana (gemini-25-flash-image)
            // Use the same image handling as image generation flow
            const imagesToUse = reduxUploadedImages && reduxUploadedImages.length > 0 ? reduxUploadedImages : [currentInput];
            payload = {
              prompt: promptWithStyle,
              model: chosenModel,
              uploadedImages: imagesToUse,
              aspect_ratio: frameSize,
              isPublic,
              num_images: 1,
              output_format: 'jpeg'
            };
          }
          const res = await axiosInstance.post('/api/fal/generate', payload);
          const out = res?.data?.images?.[0]?.url || res?.data?.data?.images?.[0]?.url || res?.data?.data?.url || res?.data?.url || '';
          if (out) {}
        } else if (isFluxKontext) {
          // Flux Kontext I2I through the same payload shape as text-to-image
          const payload: any = {
            prompt: prompt || '',
            model: chosenModel,
            n: 1,
            frameSize: frameSize,
            generationType: 'text-to-image',
            uploadedImages: [currentInput],
            style: 'none',
            isPublic,
          };
          const res = await axiosInstance.post('/api/bfl/generate', payload);
          const out = res?.data?.images?.[0]?.url || res?.data?.data?.images?.[0]?.url || res?.data?.data?.url || res?.data?.url || '';
          if (out) {}
        }
      } else {
        const parseScale = (fallback: number) => {
          const s = String(scaleFactor || '').toLowerCase().trim();
          const n = s.endsWith('x') ? Number(s.replace('x', '')) : Number(s);
          if (!Number.isFinite(n) || n <= 0) return fallback;
          return n;
        };
        // Defaults mirror UpscalePopup: clarity 2, esrgan 4
        const clarityScale = parseScale(2);
        const esrganScale = parseScale(4);
        let payload: any = { image: currentInput, model };
        // if (model === 'philz1337x/clarity-upscaler') {
        //   payload = { ...payload, scale_factor: clarityScale, output_format: output, dynamic: Number.isFinite(dyn) ? dyn : 6, sharpen: Number.isFinite(shp) ? shp : 0 };
        // } else
        if (model === 'nightmareai/real-esrgan') {
          payload = { ...payload, scale: esrganScale, face_enhance: faceEnhance };
        }
        // else if (model === 'fermatresearch/magic-image-refiner') {
        //   payload = { ...payload };
         else if (model === 'mv-lab/swin2sr') {
          payload = { ...payload, task: swinTask };
        }
        const res = await axiosInstance.post('/api/replicate/upscale', payload);
        console.log('[EditImage] upscale.res', res?.data);
        const first = res?.data?.data?.images?.[0]?.url || res?.data?.data?.images?.[0] || res?.data?.data?.url || res?.data?.url || '';
        if (first) setOutputs((prev) => ({ ...prev, ['upscale']: first }));
        try { setCurrentHistoryId(res?.data?.data?.historyId || null); } catch {}
      }
    } catch (e) {
      console.error('[EditImage] run.error', e);
      const msg = (e as any)?.response?.data?.message || (e as any)?.message || 'Request failed';
      setErrorMsg(msg);
    } finally {
      setProcessing((prev) => ({ ...prev, [selectedFeature]: false }));
    }
  };

  const handleReset = () => {
    setInputs({ 'upscale': null, 'remove-bg': null, 'resize': null });
    setOutputs({ 'upscale': null, 'remove-bg': null, 'resize': null });
    // Set appropriate default model based on selected feature
    if (selectedFeature === 'remove-bg') {
      setModel('851-labs/background-remover');
    } else if (selectedFeature === 'upscale') {
      setModel('nightmareai/real-esrgan');
    }
    setPrompt('');
    setScaleFactor('');
    setOutput('png');
    setDynamic('');
    setSharpen('');
    setBackgroundType('rgba');
    setThreshold('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

 

 

 

  // Helper functions from ImagePreviewModal.tsx
  const toProxyPath = React.useCallback((urlOrPath: string | undefined) => {
    if (!urlOrPath) return '';
    const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
    if (urlOrPath.startsWith(ZATA_PREFIX)) {
      return urlOrPath.substring(ZATA_PREFIX.length);
    }
    return urlOrPath;
  }, []);

  const toProxyDownloadUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    return path ? `${API_BASE}/api/proxy/download/${encodeURIComponent(path)}` : '';
  };

  const handleDownloadOutput = async () => {
    try {
      const url = outputs[selectedFeature]
      if (!url) {
        alert('No image available to download')
        return
      }
     
      // Use the same logic as ImagePreviewModal
      const downloadUrl = toProxyDownloadUrl(url);
      if (!downloadUrl) {
        // Fallback to direct download
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited-image-${Date.now()}.jpg`;
        a.target = '_blank';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const response = await fetch(downloadUrl, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      const baseName = (toProxyPath(url) || 'generated-image').split('/').pop() || 'generated-image.jpg';
      a.download = /\.[a-zA-Z0-9]+$/.test(baseName) ? baseName : 'generated-image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error('[EditImage] download.error', e)
      alert('Failed to download image. Please try again.')
    }
  }

  const handleShareOutput = async () => {
    const shareUrl = outputs[selectedFeature] || '';
    try {
      if (!shareUrl) {
        alert('No image available to share')
        return
      }
     
      // Use the same logic as ImagePreviewModal
      if (!navigator.share) {
        // Fallback: Copy image URL to clipboard
        await copyToClipboard(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
        alert('Image URL copied to clipboard!');
        return;
      }

      // Fetch the image as a blob
      const downloadUrl = toProxyDownloadUrl(shareUrl);
      if (!downloadUrl) {
        await copyToClipboard(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
        alert('Image URL copied to clipboard!');
        return;
      }
     
      const response = await fetch(downloadUrl, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
     
      const blob = await response.blob();
      const fileName = (toProxyPath(shareUrl) || 'generated-image').split('/').pop() || 'generated-image.jpg';
     
      // Create a File from the blob
      const file = new File([blob], fileName, { type: blob.type });
     
      // Use Web Share API
      await navigator.share({
        title: 'Wild Mind AI Generated Image',
        text: `Check out this AI-generated image!`,
        files: [file]
      });
     
      console.log('Image shared successfully');
    } catch (error: any) {
      // Handle user cancellation gracefully
      if (error.name === 'AbortError') {
        console.log('Share cancelled by user');
        return;
      }
     
      // Fallback to copying URL
      console.error('Share failed:', error);
      try {
        await copyToClipboard(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
        alert('Sharing not supported. Image URL copied to clipboard!');
      } catch (copyError) {
        console.error('Copy failed:', copyError);
        alert('Unable to share image. Please try downloading instead.');
      }
    }
  }

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#07070B]">
      {/* Header + Feature cards in a single row so the heading sits in the left gap */}
      <div className="w-screen px-4 pt-3 pb-2 bg-[#07070B] md:px-6 md:pt-4 md:pb-3">
        <div className="flex items-center gap-4">
          <div className="shrink-0 px-1 ml-6 sm:ml-8 md:ml-14 lg:ml-14">
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-semibold">Edit Images</h1>
            <p className="text-white/80 text-base sm:text-lg md:text-xl">Transform your images with AI</p>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar md:gap-9 ml-6 sm:ml-8 md:ml-12 md:ml-34">
              {features.map((feature) => (
            <div
                  key={feature.id}
                  onClick={() => {
                    setSelectedFeature(feature.id);
                    // Ensure sensible default model per feature when switching tabs
                    if (feature.id === 'remove-bg') {
                      setModel('851-labs/background-remover');
                    } else if (feature.id === 'upscale') {
                      setModel('nightmareai/real-esrgan');
                    }
                    setProcessing((p) => ({ ...p, [feature.id]: false }));
                  }}
              className={`min-w-[220px] bg-white/5 rounded-lg p-2 border cursor-pointer transition-all md:min-w-[260px] md:p-3 ${selectedFeature === feature.id
                  ? 'border-white/30 bg-white/10'
                  : 'border-white/10 hover:bg-white/10'
                }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded flex items-center justify-center md:w-7 md:h-7 ${selectedFeature === feature.id ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                  <svg className="w-3 h-3 text-white md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
            </div>
                <div>
                  <h3 className="text-white text-xs font-medium md:text-sm">{feature.label}</h3>
            </div>
          </div>
                </div>
          ))}
          </div>
            </div>
      </div>
      {/* Upload from Library/Computer Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        historyEntries={historyEntries as any}
        remainingSlots={1}
        hasMore={historyHasMore}
        loading={historyLoading}
        onLoadMore={async () => {
          try {
            if (!historyHasMore || historyLoading) return;
            await (dispatch as any)(loadMoreHistory({
              filters: { generationType: 'text-to-image' },
              paginationParams: { limit: 20 }
            })).unwrap();
          } catch {}
        }}
        onAdd={(urls: string[]) => {
          const first = urls[0];
          if (first) {
            setInputs((prev) => ({ ...prev, [selectedFeature]: first }));
          }
        }}
      />
      <div className="flex flex-1 min-h-0 py-1 overflow-hidden" style={{ height: 'calc(100vh - 96px)' }}>
        {/* Left Sidebar - Controls */}
        <div className="w-80 bg-transparent flex flex-col h-full rounded-br-2xl mb-3 overflow-hidden relative md:w-96 ml-8 sm:ml-16 md:ml-24 lg:ml-16">
          {/* Error Message */}
            {errorMsg && (
            <div className="mx-3 mt-2 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
              <p className="text-red-400 text-xs">{errorMsg}</p>
            </div>
          )}


          {/* Input Image Upload */}
          <div className="px-3 md:px-4">
            <h3 className="text-xs pl-1  font-medium text-white/80 mb-1 md:text-lg ">Input Image</h3>
            <div className="relative">
              <div className="bg-white/5 px-4 rounded-xl border-2 border-dashed border-white/20 overflow-hidden min-h-[12rem] md:min-h-[14rem] md:min-h-[18rem]">
                  {inputs[selectedFeature] ? (
                    <>
                    <Image src={inputs[selectedFeature] as string} alt="Input" fill className="object-contain rounded-xl p-2" />
                      <button
                        onClick={handleOpenUploadModal}
                        className="absolute bottom-1 right-1 p-1.5 bg-black/70 hover:bg-black/80 text-white rounded-full transition-colors"
                        aria-label="Change image"
                      >
                        <img src="/icons/fileupload.svg" alt="Upload" className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleOpenUploadModal}
                      className="absolute inset-0 flex flex-col items-center justify-center text-white/80 hover:text-white transition-colors"
                    >
                      <img src="/icons/fileupload.svg" alt="Upload" className="w-6 h-6 mb-1 md:w-7 md:h-7" />
                      <span className="text-sm md:text-base">Upload Image</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>
                        </div>
                      </div>

          {/* Action Buttons moved to bottom under Parameters */}
 
          {/* Configuration area (no scroll). Add bottom padding so footer doesn't overlap. */}
          <div className="flex-1 min-h-0 p-3 overflow-hidden md:p-4">
            <h3 className="text-xs font-medium text-white/80 mb-2 md:text-sm">Parameters</h3>

            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Model</label>
                  <div className="relative edit-dropdown">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === 'model' ? '' : 'model')}
                      className={`h-[32px] w-full px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between ${model ? 'bg-transparent text-white/90' : 'bg-transparent text-white/90 hover:bg-white/5'}`}
                    >
                      <span className="truncate">
                        {model || 'Select model'}
                      </span>
                      <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'model' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === 'model' && (
                      <div className={`absolute top-full mt-2 z-30 left-0 w-auto bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                        {(selectedFeature === 'remove-bg'
                          ? [
                              { label: '851-labs/background-remover', value: '851-labs/background-remover' },
                              { label: 'lucataco/remove-bg', value: 'lucataco/remove-bg' },
                            ]
                          : [
                              { label: 'NightmareAI Real-ESRGAN', value: 'nightmareai/real-esrgan' },
                              { label: 'MV-Lab Swin2SR', value: 'mv-lab/swin2sr' },
                            ]
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { setModel(opt.value as any); setActiveDropdown(''); setOutputs((prev) => ({ ...prev, [selectedFeature]: null })); setProcessing((p) => ({ ...p, [selectedFeature]: false })); }}
                            className={`w-full px-3 py-2 text-left text-[13px] flex items-center justify-between ${model === opt.value ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                          >
                            <span className="truncate">{opt.label}</span>
                            {model === opt.value && <div className="w-2 h-2 bg-black rounded-full" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {selectedFeature === 'remove-bg' && model.startsWith('851-labs/') && (
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Output Format</label>
                  <div className="relative edit-dropdown">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === 'output' ? '' : 'output')}
                      className={`h-[32px] w-full px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between ${output ? 'bg-transparent text-white/90' : 'bg-transparent text-white/90 hover:bg-white/5'}`}
                    >
                      <span className="truncate">{output || 'Select format'}</span>
                      <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'output' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === 'output' && (
                      <div className={`absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                        {['png','jpg','jpeg','webp'].map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => { setOutput(fmt as any); setActiveDropdown(''); }}
                            className={`w-full px-3 py-2 text-left text-[13px] flex items-center justify-between ${output === fmt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                          >
                            <span className="uppercase">{fmt}</span>
                            {output === fmt && <div className="w-2 h-2 bg-black rounded-full" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>

              {/* Prompt not used by current backend operations; keep hidden unless resize later needs it */}
              {selectedFeature === 'resize' && (
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Prompt (Optional)</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe details to guide the edit"
                    rows={1}
                    className="w-full px-2 py-1 bg-black/80 border border-white/25 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none md:text-sm md:py-2"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
              {selectedFeature === 'remove-bg' && model.startsWith('851-labs/') && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Background Type</label>
                  <div className="relative edit-dropdown">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === 'backgroundType' ? '' : 'backgroundType')}
                      className={`h-[32px] w-full px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between ${backgroundType ? 'bg-transparent text-white/90' : 'bg-transparent text-white/90 hover:bg-white/5'}`}
                    >
                      <span className="truncate">{backgroundType || 'Select background type'}</span>
                      <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'backgroundType' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === 'backgroundType' && (
                      <div className={`absolute top-full z-30 mt-2 left-0 w-full bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-44 overflow-y-auto dropdown-scrollbar`}>
                        {[
                          { label: 'rgba (Transparent)', value: 'rgba', description: 'Creates transparent background' },
                          { label: 'white', value: 'white', description: 'Solid white background' },
                          { label: 'green', value: 'green', description: 'Solid green background' },
                          { label: 'blur', value: 'blur', description: 'Blurred version of original background' },
                          { label: 'overlay', value: 'overlay', description: 'Semi-transparent colored overlay effect' },
                          { label: 'map', value: 'map', description: 'Creates a black and white image where white areas are foreground, black areas are background' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { setBackgroundType(opt.value); setActiveDropdown(''); }}
                            className={` w-full px-3 py-2 text-left text-[13px] flex flex-col items-start ${backgroundType === opt.value ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate font-medium">{opt.label}</span>
                              {backgroundType === opt.value && <div className="w-2 h-2 bg-black rounded-full" />}
                            </div>
                            <span className={`text-xs mt-1 ${backgroundType === opt.value ? 'text-black/70' : 'text-white/60'}`}>
                              {opt.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

                {/* Buttons moved to bottom footer */}
              </div>

              {selectedFeature === 'remove-bg' && model.startsWith('851-labs/') && (
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Threshold (0.0-1.0)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="0.0 (soft alpha) to 1.0"
                    className="w-full px-2 py-1 bg-transparent border border-white/20 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 2xl:text-sm 2xl:py-2"
                  />
                  <div className="mt-1 text-xs text-white/50">
                    Controls hard segmentation. 0.0 = soft alpha, 1.0 = hard edges
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Reverse</label>
                    <button
                      type="button"
                      onClick={() => setReverseBg(v => !v)}
                      className={`h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium transition ${reverseBg ? 'bg-white text-black' : 'bg-transparent text-white/80 hover:bg-white/10'}`}
                    >
                      {reverseBg ? 'Enabled' : 'Disabled'}
                    </button>
                    <div className="mt-1 text-xs text-white/50">
                      Remove foreground instead of background
                    </div>
                  </div>
                </div>
              )}

              {selectedFeature === 'upscale' && (
                <>
                  {model === 'nightmareai/real-esrgan' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Scale (0-10)</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={1}
                          value={Number(String(scaleFactor).replace('x','')) || 4}
                          onChange={(e) => setScaleFactor(String(Math.max(0, Math.min(10, Number(e.target.value)))))}
                          className="w-full h-[30px] px-2 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 2xl:text-sm 2xl:py-2"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="w-full">
                          <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Face enhance</label>
                          <button
                            type="button"
                            onClick={() => setFaceEnhance(v => !v)}
                            className={`h-[30px] w-full px-3  rounded-lg ring-1 ring-white/20 text-[13px] font-medium transition ${faceEnhance ? 'bg-white text-black' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}
                          >
                            {faceEnhance ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {model === 'mv-lab/swin2sr' && (
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Task</label>
                      <div className="relative edit-dropdown">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === 'swinTask' ? '' : 'swinTask')}
                          className={`h-[32px] w-full px-4 rounded-lg text-[13px] font-medium z-0 ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-black/80 text-white/90`}
                        >
                          <span className="truncate">{getSwinTaskLabel(swinTask)}</span>
                          <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'swinTask' ? 'rotate-180' : ''}`} />
                        </button>
                        {activeDropdown === 'swinTask' && (
                          <div className={`z-0 absolute top-full mt-2 left-0 w-full bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                            {(['classical_sr','real_sr','compressed_sr'] as const).map((t) => (
                              <button
                                key={t}
                                onClick={() => { setSwinTask(t); setActiveDropdown(''); }}
                                className={`w-full px-3 py-2 text-left text-[13px] flex items-center justify-between ${swinTask === t ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                              >
                                <span className="text-left pr-4">{getSwinTaskLabel(t)}</span>
                                {swinTask === t && <div className="w-2 h-2 bg-black rounded-full" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom action buttons under parameters */}
            <div className="mt-3 pt-2 border-t border-white/10">
              <div className="flex gap-2 2xl:gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors 2xl:text-sm 2xl:py-2"
                >
                  Reset
                </button>
                <button
                  onClick={handleRun}
                  disabled={!inputs[selectedFeature] || processing[selectedFeature]}
                  className="flex-1 px-2 py-1.5 text-xs font-semibold text-white bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors 2xl:text-sm 2xl:py-2"
                >
                  {processing[selectedFeature] ? 'Processing...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
 
            {/* Footer removed; buttons are rendered at the end of Parameters above */}
 
          </div>
 
        {/* Right Main Area - Image Display */}
        <div className="flex-1 flex flex-col bg-[#07070B] overflow-hidden">


          {/* Right Main Area - Output preview parallel to input image */}
          <div className="p-4 flex items-start justify-center pt-7  ">
              <div className="bg-white/5 rounded-xl border border-white/10 relative overflow-hidden min-h-[24rem] md:min-h-[28rem] lg:min-h-[36rem] 2xl:min-h-[40rem] w-full max-w-6xl md:max-w-7xl   ">
                {/* Dotted grid background overlay */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-30 bg-[radial-gradient(circle,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute top-5 left-4 z-10 2xl:top-6 2xl:left-6">
                <span className="text-xs font-medium text-white bg-black/80 px-2 py-1 rounded md:text-sm md:px-3 md:py-1.5">{selectedFeature === 'upscale' && upscaleViewMode === 'comparison' ? 'Input Image' : 'Output Image'}</span>
              </div>
             

              {/* Themed three dots menu - only show when there's an output */}
              {outputs[selectedFeature] && (
                <div className="absolute bottom-3 left-3 z-50 md:bottom-4 md:left-4">
                      <button
                    ref={menuButtonRef}
                    onClick={() => {
                      console.log('Three dots clicked!')
                      setShowImageMenu(!showImageMenu)
                    }}
                    className="p-2.5 bg-black/80 hover:bg-black/70 text-white rounded-full transition-all duration-200 border border-white/30 md:p-3"
                  >
                    <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="5" cy="12" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="19" cy="12" r="2"/>
                    </svg>
                  </button>
                 
                  {/* Themed dropdown menu */}
                  {showImageMenu && (
                    <div ref={menuRef} className="absolute bottom-12 left-0 bg-black/80 border border-white/30 rounded-xl shadow-2xl min-w-[160px] overflow-hidden md:min-w-[200px]">
                      <button
                        onClick={async () => {
                          console.log('Download clicked!')
                          await handleDownloadOutput();
                          setShowImageMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/20 text-sm flex items-center gap-3 transition-colors duration-200 border-b border-white/10 md:text-base md:py-3.5"
                      >
                        <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-5-5m5 5l5-5" />
                        </svg>
                        Download
                      </button>
                      <button
                        onClick={async () => {
                          console.log('Share clicked!')
                          await handleShareOutput();
                          setShowImageMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/20 text-sm flex items-center gap-3 transition-colors duration-200 md:text-base md:py-3.5"
                      >
                        <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367-2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        {shareCopied ? 'Copied!' : 'Share'}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const id = currentHistoryId;
                            if (id) {
                              await axiosInstance.delete(`/api/generations/${id}`);
                            }
                            setOutputs((prev) => ({ ...prev, [selectedFeature]: null }));
                            setShowImageMenu(false);
                          } catch (e) {
                            console.error('Delete failed:', e);
                            setShowImageMenu(false);
                          }
                        }}
                          className="w-full px-4 py-3 text-left text-red-300 hover:bg-red-500/10 text-sm flex items-center gap-3 transition-colors duration-200 border-t border-white/10 md:text-base md:py-3.5"
                      >
                        <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6v12m8-12v12M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14M10 6V4a2 2 0 012-2h0a2 2 0 012 2v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              {outputs[selectedFeature] ? (
                <div className="w-full h-full relative">
                  {selectedFeature === 'upscale' && inputs[selectedFeature] ? (
                    // Upscale with toggle between comparison and zoom
                    <div className="w-full h-full relative min-h-[24rem] md:min-h-[28rem] lg:min-h-[36rem] 2xl:min-h-[40rem]">
                      {/* View Mode Toggle - centered at bottom */}
                       <div className="absolute bottom-3 left-1/2 -translate-x-1/2 transform z-30 2xl:bottom-4">
                        <div className="flex bg-black/80 rounded-lg p-1">
                          <button
                            onClick={() => setUpscaleViewMode('comparison')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              upscaleViewMode === 'comparison'
                                ? 'bg-white text-black'
                                : 'text-white hover:bg-white/20'
                            }`}
                          >
                            Compare
                          </button>
                          <button
                            onClick={() => setUpscaleViewMode('zoom')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              upscaleViewMode === 'zoom'
                                ? 'bg-white text-black'
                                : 'text-white hover:bg-white/20'
                            }`}
                          >
                            Zoom
                          </button>
                        </div>
                      </div>

                      {upscaleViewMode === 'comparison' ? (
                        // Comparison slider mode
                        <>
                          <div className="absolute inset-0">
                            <Image
                              src={inputs[selectedFeature] as string}
                              alt="Original"
                              fill
                              className="object-contain object-center"
                            />
                          </div>
                          <div
                            className="absolute inset-0"
                            style={{
                              clipPath: `inset(0 0 0 ${sliderPosition}%)`
                            }}
                          >
                            <Image
                              src={outputs[selectedFeature] as string}
                              alt="Generated"
                              fill
                              className="object-contain object-center"
                              style={{ objectPosition: 'center 55%' }}
                            />
                          </div>
                          <div className="absolute inset-0">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={sliderPosition}
                              onChange={(e) => setSliderPosition(Number(e.target.value))}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                            />
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                              style={{ left: `${sliderPosition}%` }}
                            />
                          </div>
                          <div className="absolute top-5 right-4 z-30 2xl:top-6 2xl:right-6">
                            <span className="text-xs font-medium text-white bg-black/80 px-2 py-1 rounded 2xl:text-sm 2xl:px-3 2xl:py-1.5">Generated</span>
                          </div>
                          </>
                       ) : (
                        // Zoom mode
                        <div
                          ref={imageContainerRef}
                          className="w-full h-full relative cursor-move select-none min-h-[24rem] md:min-h-[28rem] lg:min-h-[36rem] 2xl:min-h-[40rem]"
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          onWheel={handleWheel}
                          onKeyDown={handleKeyDown}
                          tabIndex={0}
                          style={{ outline: 'none' }}
                        >
                          <Image
                            ref={imageRef}
                            src={outputs[selectedFeature] as string}
                            alt="Output"
                            fill
                            className="object-contain object-center"
                            style={{
                              transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                              transformOrigin: 'center center',
                              objectPosition: 'center 55%'
                            }}
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                            }}
                            onClick={handleImageClick}
                          />
                         
                          {/* Zoom Controls */}
                          <div className="absolute bottom-3 right-3 z-30 2xl:bottom-4 2xl:right-4">
                          <div className="flex items-center gap-1 2xl:gap-1.5 bg-black/80 rounded-lg p-1">
                              <button
                                onClick={() => {
                                  const newScale = Math.max(0.1, scale - 0.1);
                                  setScale(newScale);
                                  setOffset(clampOffset(offset, newScale));
                                }}
                                disabled={scale <= 0.1}
                                className="w-5 h-5 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed 2xl:w-6 2xl:h-6"
                              >
                                −
                              </button>
                              <span className="text-white/80 text-xs px-1.5 2xl:text-sm 2xl:px-2">
                                {Math.round(scale * 100)}%
                              </span>
                              <button
                                onClick={() => {
                                  const newScale = Math.min(6, scale + 0.1);
                                  setScale(newScale);
                                  setOffset(clampOffset(offset, newScale));
                                }}
                                disabled={scale >= 6}
                                className="w-5 h-5 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed 2xl:w-6 2xl:h-6"
                              >
                                +
                              </button>
                              <button
                                onClick={resetZoom}
                                className="w-5 h-5 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center 2xl:w-6 2xl:h-6"
                              >
                                ⌂
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular image viewer with zoom controls
                    <div
                      ref={imageContainerRef}
                      className="w-full h-full relative cursor-move select-none min-h-[24rem] md:min-h-[28rem] lg:min-h-[36rem] 2xl:min-h-[40rem]"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onWheel={handleWheel}
                      onKeyDown={handleKeyDown}
                      tabIndex={0}
                      style={{ outline: 'none' }}
                    >
                      <Image
                        ref={imageRef}
                        src={outputs[selectedFeature] as string}
                        alt="Output"
                        fill
                        className="object-contain object-center"
                        style={{
                          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                          transformOrigin: 'center center',
                          objectPosition: 'center 55%'
                        }}
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                        }}
                        onClick={handleImageClick}
                      />
                     
                      {/* Zoom Controls */}
                      <div className="absolute bottom-3 right-3 z-30 2xl:bottom-4 2xl:right-4">
                        <div className="flex items-center gap-1 2xl:gap-1.5 bg-black/80 rounded-lg p-1">
                          <button
                            onClick={() => {
                              const newScale = Math.max(0.1, scale - 0.1);
                              setScale(newScale);
                              setOffset(clampOffset(offset, newScale));
                            }}
                            disabled={scale <= 0.1}
                            className="w-5 h-5 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed 2xl:w-6 2xl:h-6"
                          >
                            −
                          </button>
                          <span className="text-white/80 text-xs px-1.5 2xl:text-sm 2xl:px-2">
                            {Math.round(scale * 100)}%
                          </span>
                          <button
                            onClick={() => {
                              const newScale = Math.min(6, scale + 0.1);
                              setScale(newScale);
                              setOffset(clampOffset(offset, newScale));
                            }}
                            disabled={scale >= 6}
                            className="w-5 h-5 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed 2xl:w-6 2xl:h-6"
                          >
                            +
                          </button>
                          <button
                            onClick={resetZoom}
                            className="w-5 h-5 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center 2xl:w-6 2xl:h-6"
                          >
                            ⌂
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center min-h-[24rem] md:min-h-[28rem] lg:min-h-[36rem] 2xl:min-h-[40rem]">
                  <div className="text-center">
                    {processing[selectedFeature] ? (
                      <>
                        <div className="w-10 h-10 mx-auto mb-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <p className="text-white/50 text-xs">Generating...</p>
                      </>
                    ) : (
                      <>
                        <svg className="w-10 h-10 mx-auto mb-2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-white/50 text-xs">Output will appear here</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditImageInterface;