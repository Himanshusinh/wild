'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import axiosInstance from '@/lib/axiosInstance';
import { getIsPublic } from '@/lib/publicFlag';
import ModelsDropdown from '@/app/view/Generation/ImageGeneration/TextToImage/compo/ModelsDropdown';
import FrameSizeDropdown from '@/app/view/Generation/ImageGeneration/TextToImage/compo/FrameSizeDropdown';
import StyleSelector from '@/app/view/Generation/ImageGeneration/TextToImage/compo/StyleSelector';
import { useAppSelector } from '@/store/hooks';

type EditFeature = 'upscale' | 'remove-bg' | 'resize' | 'using-prompt';

const EditImageInterface: React.FC = () => {
  const searchParams = useSearchParams();
  const [selectedFeature, setSelectedFeature] = useState<EditFeature>('upscale');
  const [inputs, setInputs] = useState<Record<EditFeature, string | null>>({
    'upscale': null,
    'remove-bg': null,
    'resize': null,
    'using-prompt': null,
  });
  // Per-feature outputs and processing flags so operations don't block each other
  const [outputs, setOutputs] = useState<Record<EditFeature, string | null>>({
    'upscale': null,
    'remove-bg': null,
    'resize': null,
    'using-prompt': null,
  });
  const [processing, setProcessing] = useState<Record<EditFeature, boolean>>({
    'upscale': false,
    'remove-bg': false,
    'resize': false,
    'using-prompt': false,
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [fitScale, setFitScale] = useState(1);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Form states
  const [model, setModel] = useState<'' | 'philz1337x/clarity-upscaler' | 'fermatresearch/magic-image-refiner' | 'nightmareai/real-esrgan' | 'mv-lab/swin2sr' | '851-labs/background-remover' | 'lucataco/remove-bg'>('');
  const [prompt, setPrompt] = useState('');
  const [scaleFactor, setScaleFactor] = useState('');
  const [output, setOutput] = useState<'' | 'png' | 'jpg' | 'jpeg' | 'webp'>('');
  const [dynamic, setDynamic] = useState('');
  const [sharpen, setSharpen] = useState('');
  const [backgroundType, setBackgroundType] = useState('');
  const [threshold, setThreshold] = useState<string>('');
  const selectedGeneratorModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-dev');
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const selectedStyle = useAppSelector((state: any) => state.generation?.style || 'realistic');
  const reduxUploadedImages = useAppSelector((state: any) => state.generation?.uploadedImages || []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from query params: feature and image
  useEffect(() => {
    try {
      const featureParam = (searchParams?.get('feature') || '').toLowerCase();
      const imageParam = searchParams?.get('image') || '';
      const storagePathParam = searchParams?.get('sp') || '';
      const validFeature = ['upscale', 'remove-bg', 'resize', 'using-prompt'].includes(featureParam)
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

  // Zoom and pan utility functions
  const clampOffset = useCallback((newOffset: { x: number; y: number }, currentScale: number) => {
    if (!imageContainerRef.current) return newOffset;

    const container = imageContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Calculate image dimensions at current scale
    const imageWidth = naturalSize.width * currentScale;
    const imageHeight = naturalSize.height * currentScale;

    // Calculate maximum offset to keep image covering container
    const maxOffsetX = Math.max(0, (imageWidth - containerWidth) / 2);
    const maxOffsetY = Math.max(0, (imageHeight - containerHeight) / 2);

    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffset.x)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffset.y))
    };
  }, [naturalSize]);

  const zoomToPoint = useCallback((point: { x: number; y: number }, newScale: number) => {
    if (!imageContainerRef.current) return;

    const container = imageContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;

    // Calculate offset to center the zoom on the click point
    const newOffsetX = containerCenterX - (point.x * newScale);
    const newOffsetY = containerCenterY - (point.y * newScale);

    const clampedOffset = clampOffset({ x: newOffsetX, y: newOffsetY }, newScale);

    setScale(newScale);
    setOffset(clampedOffset);
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

    const container = imageContainerRef.current;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.1, Math.min(6, scale + delta));

    if (newScale !== scale) {
      zoomToPoint({ x: mouseX, y: mouseY }, newScale);
    }
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

  const features = [
    { id: 'upscale', label: 'Upscale', description: 'Increase resolution while preserving details' },
    { id: 'remove-bg', label: 'Remove Background', description: 'Remove background from your image' },
    { id: 'using-prompt', label: 'Using Prompt', description: 'Edit image using text prompts' },
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
          format: output,
          isPublic,
          model,
        };
        if (backgroundType) body.background_type = backgroundType;
        if (threshold) body.threshold = threshold;
        const res = await axiosInstance.post('/api/replicate/remove-bg', body);
        console.log('[EditImage] remove-bg.res', res?.data);
        const out = res?.data?.data?.url || res?.data?.data?.image || res?.data?.data?.images?.[0]?.url || res?.data?.url || res?.data?.image || '';
        if (out) setOutputs((prev) => ({ ...prev, ['remove-bg']: out }));
      } else if (selectedFeature === 'using-prompt') {
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
              setOutputs((prev) => ({ ...prev, ['using-prompt']: imageUrl as string }));
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
            if (out) setOutputs((prev) => ({ ...prev, ['using-prompt']: out }));
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
          if (out) setOutputs((prev) => ({ ...prev, ['using-prompt']: out }));
        } else if (isFluxKontext) {
          // Flux Kontext I2I through the same payload shape as text-to-image
          const payload: any = {
            prompt: prompt || '',
            model: chosenModel,
            n: 1,
            frameSize: frameSize,
            generationType: 'text-to-image',
            uploadedImages: [currentInput],
            style: 'realistic',
            isPublic,
          };
          const res = await axiosInstance.post('/api/bfl/generate', payload);
          const out = res?.data?.images?.[0]?.url || res?.data?.data?.images?.[0]?.url || res?.data?.data?.url || res?.data?.url || '';
          if (out) setOutputs((prev) => ({ ...prev, ['using-prompt']: out }));
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
        const dyn = Number(dynamic);
        const shp = Number(sharpen);

        let payload: any = { image: currentInput, prompt: prompt || undefined, isPublic, model };
        // if (model === 'philz1337x/clarity-upscaler') {
        //   payload = { ...payload, scale_factor: clarityScale, output_format: output, dynamic: Number.isFinite(dyn) ? dyn : 6, sharpen: Number.isFinite(shp) ? shp : 0 };
        // } else 
        if (model === 'nightmareai/real-esrgan') {
          payload = { ...payload, scale: esrganScale };
        }
        // else if (model === 'fermatresearch/magic-image-refiner') {
        //   payload = { ...payload };
        else if (model === 'mv-lab/swin2sr') {
          payload = { ...payload };
        }
        const res = await axiosInstance.post('/api/replicate/upscale', payload);
        console.log('[EditImage] upscale.res', res?.data);
        const first = res?.data?.data?.images?.[0]?.url || res?.data?.data?.images?.[0] || res?.data?.data?.url || res?.data?.url || '';
        if (first) setOutputs((prev) => ({ ...prev, ['upscale']: first }));
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
    setInputs({ 'upscale': null, 'remove-bg': null, 'resize': null, 'using-prompt': null });
    setOutputs({ 'upscale': null, 'remove-bg': null, 'resize': null, 'using-prompt': null });
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

  const inferExtensionFromType = (contentType: string | null | undefined, fallbackExt: string = 'png') => {
    if (!contentType) return fallbackExt
    const map: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
    }
    return map[contentType.toLowerCase()] || fallbackExt
  }

  const inferExtensionFromUrl = (url: string, fallbackExt: string = 'png') => {
    try {
      const u = new URL(url)
      const pathname = u.pathname || ''
      const m = pathname.match(/\.([a-zA-Z0-9]+)$/)
      if (m && m[1]) return m[1].toLowerCase()
    } catch { }
    const m2 = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
    if (m2 && m2[1]) return m2[1].toLowerCase()
    return fallbackExt
  }

  const handleDownloadOutput = async () => {
    try {
      const url = outputs[selectedFeature]
      if (!url) return
      // Try proxy first if available
      const possibleProxy = `/api/proxy/external?url=${encodeURIComponent(url)}`
      let res = await fetch(possibleProxy)
      if (!res.ok) {
        // fallback to direct fetch
        res = await fetch(url, { credentials: 'include' as any })
      }
      if (!res.ok) throw new Error('Download failed')
      const ct = res.headers.get('content-type')
      const blob = await res.blob()
      const extByType = inferExtensionFromType(ct, inferExtensionFromUrl(url))
      const fileName = `edit-output-${Date.now()}.${extByType}`
      const a = document.createElement('a')
      const objectUrl = URL.createObjectURL(blob)
      a.href = objectUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (e) {
      console.error('[EditImage] download.error', e)
      alert('Failed to download output')
    }
  }

  const buildShareUrl = (rawUrl: string) => `/api/proxy/external?url=${encodeURIComponent(rawUrl)}`

  const handleShareOutput = async () => {
    try {
      const url = outputs[selectedFeature]
      if (!url) return
      // Fetch blob (prefer proxy)
      const proxyUrl = buildShareUrl(url)
      let res = await fetch(proxyUrl)
      if (!res.ok) {
        res = await fetch(url, { credentials: 'include' as any })
      }
      if (!res.ok) throw new Error('Share fetch failed')
      const blob = await res.blob()
      const ext = inferExtensionFromType(blob.type, inferExtensionFromUrl(url))
      const fileName = `edited-image.${ext}`
      if ((navigator as any).share && (navigator as any).canShare?.({ files: [new File([blob], fileName, { type: blob.type })] })) {
        const file = new File([blob], fileName, { type: blob.type || 'image/*' })
        await (navigator as any).share({
          title: 'Wild Mind Edited Image',
          text: 'Check out this edited image!',
          files: [file],
        })
        return
      }
      // Fallback: copy link
      await navigator.clipboard.writeText(proxyUrl)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1500)
    } catch (e) {
      console.error('[EditImage] share.error', e)
      try {
        const url = outputs[selectedFeature]
        if (!url) return
        await navigator.clipboard.writeText(buildShareUrl(url))
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 1500)
      } catch { }
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-black">
      <div className="flex h-screen py-1">
        {/* Left Sidebar - Controls */}
        <div className="w-80 bg-white/5 border-r border-white/10 flex flex-col h-181 rounded-br-xl overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-white/10">
            <h1 className="text-base font-semibold text-white mb-1">Edit Images</h1>
            <p className="text-white/60 text-xs">Transform your images with AI</p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mx-3 mt-2 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
              <p className="text-red-400 text-xs">{errorMsg}</p>
            </div>
          )}

          {/* Input Image Upload */}
          <div className="p-3 border-b border-white/10">
            <h3 className="text-xs font-medium text-white/80 mb-2">Input Image</h3>
            <div className="relative">
              <div className="h-48 bg-white/5 rounded-xl border-2 border-dashed border-white/20 overflow-hidden">
                {inputs[selectedFeature] ? (
                  <>
                    <Image src={inputs[selectedFeature] as string} alt="Input" fill className="object-cover rounded-xl" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 left-1 right-1 bg-black/70 hover:bg-black/80 text-white text-xs py-0.5 px-1 rounded-full transition-colors"
                    >
                      Change
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInputs((prev) => ({ ...prev, [selectedFeature]: null }));
                        setOutputs((prev) => ({ ...prev, [selectedFeature]: null }));
                        setProcessing((p) => ({ ...p, [selectedFeature]: false }));
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center text-white/50 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm">Upload Image</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>
            </div>
          </div>

          {/* Action Buttons - Moved to top for visibility */}
          <div className="p-3 border-b border-white/10">
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                {selectedFeature === 'remove-bg' ? 'Clear' : 'Reset'}
              </button>
              <button
                onClick={handleRun}
                disabled={!inputs[selectedFeature] || processing[selectedFeature]}
                className="flex-1 px-2 py-1.5 text-xs font-semibold text-white bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
              >
                {processing[selectedFeature] ? 'Processing...' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Configuration - No Scroll */}
          <div className="flex-1 p-3">
            <h3 className="text-xs font-medium text-white/80 mb-2">Parameters</h3>

            {selectedFeature === 'using-prompt' ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Edit Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the edit you want to apply to the image"
                    rows={2}
                    className="w-full h-16 px-3 py-4 bg-white/5 border border-white/20 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none flex items-center justify-center text-center"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Aspect Ratio</label>
                    <FrameSizeDropdown openDirection="up" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Style</label>
                    <StyleSelector />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Model</label>
                    <select
                      value={model}
                      onChange={(e) => { setModel(e.target.value as any); setOutputs((prev) => ({ ...prev, [selectedFeature]: null })); setProcessing((p) => ({ ...p, [selectedFeature]: false })); }}
                      className="w-full px-2 pr-6 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                    >
                      <option value="" disabled hidden>Select model</option>
                      {selectedFeature === 'remove-bg' ? (
                        <>
                          <option value="851-labs/background-remover">851-labs/background-remover</option>
                          <option value="lucataco/remove-bg">lucataco/remove-bg</option>
                        </>
                      ) : (
                        <>
                          <option value="nightmareai/real-esrgan">NightmareAI Real-ESRGAN</option>
                          <option value="mv-lab/swin2sr">MV-Lab Swin2SR</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Output Format</label>
                    <select
                      value={output}
                      onChange={(e) => setOutput(e.target.value as any)}
                      className="w-full px-2 pr-6 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                    >
                      <option value="" disabled hidden>Select format</option>
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WEBP</option>
                    </select>
                  </div>
                </div>

                {selectedFeature !== 'remove-bg' && (
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Prompt (Optional)</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe details to guide the edit"
                      rows={1}
                      className="w-full px-2 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Scale Factor</label>
                    <input
                      type="text"
                      value={scaleFactor}
                      onChange={(e) => setScaleFactor(e.target.value)}
                      placeholder="e.g., 2x or 4x"
                      className="w-full px-2 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                  {selectedFeature === 'remove-bg' && (
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1">Background Type</label>
                      <input
                        type="text"
                        value={backgroundType}
                        onChange={(e) => setBackgroundType(e.target.value)}
                        placeholder="e.g., rgba or white"
                        className="w-full px-2 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                      />
                    </div>
                  )}
                </div>

                {selectedFeature === 'remove-bg' && (
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Threshold</label>
                    <input
                      type="text"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      placeholder="0.0 to 1.0"
                      className="w-full px-2 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                )}

                {selectedFeature === 'upscale' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1">Dynamic</label>
                      <input
                        type="text"
                        value={dynamic}
                        onChange={(e) => setDynamic(e.target.value)}
                        placeholder="0-10 (optional)"
                        className="w-full px-2 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1">Sharpen</label>
                      <input
                        type="text"
                        value={sharpen}
                        onChange={(e) => setSharpen(e.target.value)}
                        placeholder="0.0-1.0 (optional)"
                        className="w-full px-2 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Main Area - Image Display */}
        <div className="flex-1 flex flex-col bg-black overflow-hidden">
          {/* Header (no cards) */}
          <div className="p-6 border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-white/80">AI Tools</h2>
              {outputs[selectedFeature] && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadOutput}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-full transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={handleShareOutput}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-full transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    {shareCopied ? 'Copied!' : 'Share'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Horizontal Cards directly above preview */}
          <div className="px-4 pt-3 pb-0">
            <div className="grid grid-cols-4 gap-3 pb-1">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  onClick={() => {
                    setSelectedFeature(feature.id);
                    setOutputs((prev) => ({ ...prev, [feature.id]: null }));
                    setProcessing((p) => ({ ...p, [feature.id]: false }));
                  }}
                  className={`min-w-0 w-full bg-white/5 rounded-lg p-3 border cursor-pointer transition-all ${selectedFeature === feature.id
                      ? 'border-white/30 bg-white/10'
                      : 'border-white/10 hover:bg-white/10'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedFeature === feature.id ? 'bg-white/20' : 'bg-white/10'
                      }`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white text-sm font-medium">{feature.label}</h3>
                      <p className="text-white/60 text-xs">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-4">
            <div className="h-133 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden">
              {/* Output Image Label */}
              <div className="absolute top-3 left-3 z-10">
                <span className="text-xs font-medium text-white/80 bg-black/50 px-2 py-1 rounded">Output Image</span>
              </div>
              {processing[selectedFeature] ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
                  <p className="text-white/70 text-xs">Processing your image...</p>
                </div>
              ) : outputs[selectedFeature] ? (
                <>
                  {selectedFeature === 'upscale' && inputs[selectedFeature] ? (
                    // Comparison slider for upscale
                    <div className="relative w-full h-full">
                      <div className="relative w-full h-full overflow-hidden">
                        {/* Original image (left side) */}
                        <div 
                          className="absolute inset-0"
                          style={{ clipPath: `inset(0 ${100 - sliderPosition}%} 0 0)` }}
                        >
                          <Image
                            src={inputs[selectedFeature] as string}
                            alt="Original"
                            fill
                            className="object-contain"
                          />
                        </div>
                        
                        {/* Generated image (right side) */}
                        <div 
                          className="absolute inset-0"
                          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                        >
                          <Image
                            src={outputs[selectedFeature] as string}
                            alt="Generated"
                            fill
                            className="object-contain"
                          />
                        </div>
                        
                        {/* Slider line */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
                          style={{ left: `${sliderPosition}%` }}
                        >
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"></div>
                        </div>
                        
                        {/* Labels positioned at edges */}
                        <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-white text-xs z-30">
                          Original
                        </div>
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-xs z-30">
                          Generated
                        </div>
                        
                        {/* Slider input */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sliderPosition}
                          onChange={(e) => setSliderPosition(Number(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                        />
                      </div>
                    </div>
                  ) : (
                    // Regular image viewer for other features
                    <div
                      ref={imageContainerRef}
                      tabIndex={0}
                      className="relative w-full h-full focus:outline-none"
                      onClick={handleImageClick}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onWheel={handleWheel}
                      onKeyDown={handleKeyDown}
                      style={{
                        cursor: isPanning ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in'),
                        overscrollBehavior: 'none',
                        userSelect: 'none'
                      }}
                    >
                      <div
                        className="flex items-center justify-center w-full h-full"
                        style={{
                          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                          transformOrigin: 'center center',
                          transition: isPanning ? 'none' : 'transform 0.2s ease-out'
                        }}
                      >
                        <Image
                          ref={imageRef}
                          src={outputs[selectedFeature] as string}
                          alt="Output"
                          width={naturalSize.width || 800}
                          height={naturalSize.height || 600}
                          className="object-contain max-w-full max-h-full"
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement;
                            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                          }}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Zoom Controls - Only show for non-upscale or when no comparison slider */}
                  {selectedFeature !== 'upscale' && (
                    <div className="absolute bottom-3 right-3 z-30">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const newScale = Math.max(0.1, scale - 0.1);
                          setScale(newScale);
                          setOffset(clampOffset(offset, newScale));
                        }}
                        className="w-7 h-7 flex items-center justify-center text-white text-sm rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                        disabled={scale <= 0.1}
                      >
                        −
                      </button>
                      <button
                        onClick={resetZoom}
                        className="px-3 py-1.5 text-white text-xs rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => {
                          const newScale = Math.min(6, scale + 0.1);
                          setScale(newScale);
                          setOffset(clampOffset(offset, newScale));
                        }}
                        className="w-7 h-7 flex items-center justify-center text-white text-sm rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                        disabled={scale >= 6}
                      >
                        +
                      </button>
                      <span className="text-white text-xs px-2 font-medium">{Math.round(scale * 100)}%</span>
                    </div>
                  </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-white/50 text-xs">Upload an image and configure settings to get started</p>
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
