'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ChevronUp } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { getIsPublic } from '@/lib/publicFlag';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import VideoUploadModal from '@/app/view/Generation/VideoGeneration/TextToVideo/compo/VideoUploadModal';
import { loadMoreHistory } from '@/store/slices/historySlice';
import { useHistoryLoader } from '@/hooks/useHistoryLoader';
import { downloadFileWithNaming } from '@/utils/downloadUtils';

type EditFeature = 'upscale' | 'remove-bg';

const EditVideoInterface: React.FC = () => {
  const user = useAppSelector((state: any) => state.auth?.user);
  const searchParams = useSearchParams();
  const [selectedFeature, setSelectedFeature] = useState<EditFeature>('upscale');
  const [inputs, setInputs] = useState<Record<EditFeature, string | null>>({
    'upscale': null,
    'remove-bg': null,
  });
  // Per-feature outputs and processing flags so operations don't block each other
  const [outputs, setOutputs] = useState<Record<EditFeature, string | null>>({
    'upscale': null,
    'remove-bg': null,
  });
  const [processing, setProcessing] = useState<Record<EditFeature, boolean>>({
    'upscale': false,
    'remove-bg': false,
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showUpscaleAdvanced, setShowUpscaleAdvanced] = useState(false);
  const [showRemoveBgAdvanced, setShowRemoveBgAdvanced] = useState(false);
  // SeedVR upscale params (video)
  const [seedvrUpscaleMode, setSeedvrUpscaleMode] = useState<'factor' | 'target'>('factor');
  const [seedvrUpscaleFactor, setSeedvrUpscaleFactor] = useState<number>(2);
  const [seedvrTargetResolution, setSeedvrTargetResolution] = useState<'720p' | '1080p' | '1440p' | '2160p'>('1080p');
  const [seedvrNoiseScale, setSeedvrNoiseScale] = useState<number>(0.1);
  const [seedvrOutputFormat, setSeedvrOutputFormat] = useState<'X264 (.mp4)' | 'VP9 (.webm)' | 'PRORES4444 (.mov)' | 'GIF (.gif)'>('X264 (.mp4)');
  const [seedvrOutputQuality, setSeedvrOutputQuality] = useState<'low' | 'medium' | 'high' | 'maximum'>('high');
  const [seedvrOutputWriteMode, setSeedvrOutputWriteMode] = useState<'fast' | 'balanced' | 'small'>('balanced');
  const [seedvrSyncMode, setSeedvrSyncMode] = useState<boolean>(false);
  const [seedvrSeed, setSeedvrSeed] = useState<string>('');
  
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
  const [inputNaturalSize, setInputNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  // Form states
  const [model, setModel] = useState<'fal-ai/birefnet/v2/video' | 'fal-ai/seedvr/upscale/video' | '851-labs/background-remover' | 'lucataco/remove-bg'>('fal-ai/birefnet/v2/video');
  const [output, setOutput] = useState<'' | 'png' | 'jpg' | 'jpeg' | 'webp'>('png');
  const [threshold, setThreshold] = useState<string>('');
  const [reverseBg, setReverseBg] = useState(false);
  const [backgroundType, setBackgroundType] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<'output' | 'backgroundType' | 'seedvrQuality' | 'seedvrWriteMode' | 'seedvrTargetResolution' | 'birefModel' | 'birefOperatingResolution' | 'birefOutputType' | 'birefQuality' | 'birefWriteMode' | ''>('');
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const historyEntries = useAppSelector((s: any) => (s.history?.entries || []).filter((e: any) => e.generationType === 'text-to-video'));
  const historyLoading = useAppSelector((s: any) => s.history?.loading || false);
  const historyHasMore = useAppSelector((s: any) => s.history?.hasMore || false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to check if URL is a video
  const isVideoUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
    const videoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const lowerUrl = url.toLowerCase();
    // Check file extension
    if (videoExtensions.some(ext => lowerUrl.includes(ext))) return true;
    // Check data URI mime type
    if (url.startsWith('data:') && videoMimeTypes.some(mime => url.includes(mime))) return true;
    // Check blob URL (assume it's video for video edit interface)
    if (url.startsWith('blob:')) return true;
    return false;
  };

  // Initialize from query params: feature and image and ensure we have some video history via unified loader
  useHistoryLoader({ generationType: 'text-to-video', initialLimit: 30 });
  useEffect(() => {
    try {
      // Allow tab selection via query
      const featureParam = (searchParams?.get('feature') || '').toLowerCase();
      const imageParam = searchParams?.get('image') || '';
      const storagePathParam = searchParams?.get('sp') || '';
      const validFeature = ['upscale', 'remove-bg'].includes(featureParam)
        ? (featureParam as EditFeature)
        : null;
        if (validFeature) {
        setSelectedFeature(validFeature);
        // Set default model based on feature
        if (validFeature === 'remove-bg') {
          setModel('fal-ai/birefnet/v2/video' as any);
        } else if (validFeature === 'upscale') {
          setModel('fal-ai/seedvr/upscale/video' as any);
        }
        // Prefer raw storage path if provided; use frontend proxy URL for preview rendering
        if (storagePathParam) {
          const frontendProxied = `/api/proxy/resource/${encodeURIComponent(storagePathParam)}`;
          // Apply to both features so switching tabs preserves the same input
          setInputs({
            'upscale': frontendProxied,
            'remove-bg': frontendProxied,
          });
        } else if (imageParam && imageParam.trim() !== '') {
          setInputs({
            'upscale': imageParam,
            'remove-bg': imageParam,
          });
        }
      } else if (imageParam && imageParam.trim() !== '') {
        // Fallback: if only image provided, attach to both features
        setInputs({
          'upscale': imageParam,
          'remove-bg': imageParam,
        });
      }
    } catch { }
    // Only run once on mount for initial hydration from URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BiRefNet (video remove bg) params
  const [birefModel, setBirefModel] = useState<'General Use (Light)' | 'General Use (Light 2K)' | 'General Use (Heavy)' | 'Matting' | 'Portrait' | 'General Use (Dynamic)'>('General Use (Light)');
  const [birefOperatingResolution, setBirefOperatingResolution] = useState<'1024x1024' | '2048x2048' | '2304x2304'>('1024x1024');
  const [birefOutputMask, setBirefOutputMask] = useState<boolean>(false);
  const [birefRefineFg, setBirefRefineFg] = useState<boolean>(true);
  const [birefSyncMode, setBirefSyncMode] = useState<boolean>(false);
  const [birefOutputType, setBirefOutputType] = useState<'X264 (.mp4)' | 'VP9 (.webm)' | 'PRORES4444 (.mov)' | 'GIF (.gif)'>('X264 (.mp4)');
  const [birefQuality, setBirefQuality] = useState<'low' | 'medium' | 'high' | 'maximum'>('high');
  const [birefWriteMode, setBirefWriteMode] = useState<'fast' | 'balanced' | 'small'>('balanced');

  // Ensure SeedVR is the default model when switching to Upscale
  useEffect(() => {
    if (selectedFeature === 'upscale') {
      if (model !== 'fal-ai/seedvr/upscale/video') {
        setModel('fal-ai/seedvr/upscale/video' as any);
      }
    } else if (selectedFeature === 'remove-bg') {
      if (model !== 'fal-ai/birefnet/v2/video') {
        setModel('fal-ai/birefnet/v2/video' as any);
      }
    }
  }, [selectedFeature, model]);

  // Auto-detect input video/image dimensions
  useEffect(() => {
    const src = inputs.upscale || inputs['remove-bg'];
    if (!src) return;
    (async () => {
      try {
        let measurableSrc = String(src);
        // Make relative paths absolute for measurement
        if (!/^https?:|^data:|^blob:/i.test(measurableSrc)) {
          measurableSrc = new URL(measurableSrc, window.location.origin).href;
        }
        // If it's a proxy path that streams, load via fetch->blob to avoid CORS hiccups, then measure
        const needsBlob = measurableSrc.startsWith(window.location.origin) || measurableSrc.startsWith('/');
        if (needsBlob && !/^data:|^blob:/i.test(measurableSrc)) {
          try {
            const resp = await fetch(measurableSrc, { cache: 'force-cache' });
            const blob = await resp.blob();
            measurableSrc = URL.createObjectURL(blob);
          } catch {
            // fallback to direct src
          }
        }
        await new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            const w = Math.max(1, Math.floor(img.naturalWidth || 0));
            const h = Math.max(1, Math.floor(img.naturalHeight || 0));
            setInputNaturalSize({ width: w, height: h });
            try { if (measurableSrc.startsWith('blob:')) URL.revokeObjectURL(measurableSrc); } catch {}
            resolve();
          };
          img.onerror = () => resolve();
          img.src = measurableSrc;
        });
      } catch {}
    })();
  }, [inputs]);

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

  // Allow page scroll so actions are reachable on small screens
  // (removed the global overflow lock)

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

  const features: { id: 'upscale' | 'remove-bg'; label: string; description: string }[] = [
    { id: 'upscale', label: 'Upscale', description: 'Increase resolution while preserving details' },
    { id: 'remove-bg', label: 'Remove BG', description: 'Remove background from your image' },
  ];

  // Feature preview assets and display labels
  const featurePreviewGif: Record<EditFeature, string> = {
    'upscale': '/editimage/upscale_banner.jpg',
    'remove-bg': '/editimage/RemoveBG_banner.jpg',
  };
  const featureDisplayName: Record<EditFeature, string> = {
    'upscale': 'Upscale',
    'remove-bg': 'Remove BG',
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const video = e.target?.result as string;
        // Apply selected video to both features
        setInputs({
          'upscale': video,
          'remove-bg': video,
        });
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

    const toDataUriIfLocal = async (src: string): Promise<string> => {
      if (!src) return src as any;
      if (src.startsWith('data:')) return src;
      if (src.startsWith('blob:')) {
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          return src;
        }
      }
      // If the video/image is stored on Zata (or another known storage served via
      // the `/api/proxy/download/:path` backend route), fetch via our proxy
      // so we avoid cross-origin/read restrictions, then convert to data URI.
      // This ensures the backend can access the file even if the original URL
      // is not accessible from the production server.
      try {
        const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
        if (String(src).startsWith(ZATA_PREFIX)) {
          const path = src.substring(ZATA_PREFIX.length);
          const proxyUrl = `${API_BASE}/api/proxy/download/${encodeURIComponent(path)}`;
          try {
            const pResp = await fetch(proxyUrl, { credentials: 'include' });
            if (pResp && pResp.ok) {
              const blob = await pResp.blob();
              return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(String(reader.result || ''));
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            }
          } catch (e) {
            // fallthrough to attempt direct fetch below
            console.warn('[toDataUriIfLocal] proxy fetch failed, falling back to direct fetch', e);
          }
          // Try direct fetch from Zata as fallback (may work if CORS allows)
          try {
            const directResp = await fetch(src, { 
              method: 'GET',
              mode: 'cors',
              credentials: 'omit'
            });
            if (directResp && directResp.ok) {
              const blob = await directResp.blob();
              return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(String(reader.result || ''));
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            }
          } catch (directErr) {
            console.warn('[toDataUriIfLocal] direct fetch also failed', directErr);
          }
        }
      } catch (e) {
        // ignore and continue
      }

      // Last resort: return the original src (backend will try to use it as video_url)
      return src;
    };

    const currentInputRaw = inputs[selectedFeature];
    const currentInput = toAbsoluteProxyUrl(currentInputRaw) as any;
    if (!currentInput) return;
    setErrorMsg('');
    setOutputs((prev) => ({ ...prev, [selectedFeature]: null }));
    setProcessing((prev) => ({ ...prev, [selectedFeature]: true }));
    try {
      // Convert video URL to data URI to ensure backend can access it (fixes production issues)
      const normalizedInput = currentInputRaw ? await toDataUriIfLocal(String(currentInputRaw)) : '';
      const isPublic = await getIsPublic();
      
      if (selectedFeature === 'upscale') {
        // Video Upscale via FAL SeedVR
        const src = inputs['upscale'];
        if (!src) throw new Error('Please upload a video to upscale');
        const body: any = {};
        // Use normalizedInput (data URI) if conversion succeeded, otherwise fall back to video_url
        if (normalizedInput && normalizedInput.startsWith('data:')) {
          // For data URI, send video (validator will convert data URI to video_url)
          body.video = normalizedInput;
        } else if (String(src).startsWith('data:')) {
          // Fallback: if original src is already a data URI, use it
          body.video = src;
        } else {
          // Use the absolute proxy URL (Zata URL) as fallback
          body.video_url = currentInput;
        }
        body.upscale_mode = seedvrUpscaleMode;
        if (seedvrUpscaleMode === 'factor') body.upscale_factor = Number(seedvrUpscaleFactor) || 2;
        if (seedvrUpscaleMode === 'target') body.target_resolution = seedvrTargetResolution;
        if (seedvrSeed !== '') body.seed = Math.round(Number(seedvrSeed) || 0);
        body.noise_scale = Number.isFinite(Number(seedvrNoiseScale)) ? Number(seedvrNoiseScale) : 0.1;
        body.output_format = seedvrOutputFormat;
        body.output_quality = seedvrOutputQuality;
        body.output_write_mode = seedvrOutputWriteMode;
        if (seedvrSyncMode) body.sync_mode = true;
        const res = await axiosInstance.post('/api/fal/seedvr/upscale/video', body);
        // Backend returns { videos: [{ url: string, ... }], historyId, ... }
        const videoUrl = res?.data?.data?.videos?.[0]?.url || res?.data?.videos?.[0]?.url || '';
        if (videoUrl) {
          setOutputs(prev => ({ ...prev, ['upscale']: videoUrl }));
        } else {
          console.error('[Video Upscale] No video URL in response:', res?.data);
        }
        try { setCurrentHistoryId(res?.data?.data?.historyId || null); } catch {}
        return;
      }
      if (selectedFeature === 'remove-bg') {
        const src = inputs['remove-bg'];
        if (!src) throw new Error('Please upload a video');
        const body: any = {};
        // Use normalizedInput (data URI) if conversion succeeded, otherwise fall back to video_url
        if (normalizedInput && normalizedInput.startsWith('data:')) {
          body.video = normalizedInput; // validator uploads and sets video_url
        } else if (String(src).startsWith('data:')) {
          // Fallback: if original src is already a data URI, use it
          body.video = src;
        } else {
          // Use the absolute proxy URL (Zata URL) as fallback
          body.video_url = currentInput;
        }
        // BiRefNet parameters
        body.model = birefModel;
        body.operating_resolution = birefOperatingResolution;
        if (birefOutputMask) body.output_mask = true;
        if (birefRefineFg === false) body.refine_foreground = false; else body.refine_foreground = true;
        if (birefSyncMode) body.sync_mode = true;
        body.video_output_type = birefOutputType;
        body.video_quality = birefQuality;
        body.video_write_mode = birefWriteMode;
        // Ensure we're calling the backend endpoint (not Next.js)
        const endpoint = '/api/fal/birefnet/v2/video/remove-bg';
        console.log('[Video Remove BG] Calling endpoint:', endpoint, 'with body:', { ...body, video_url: body.video_url?.substring(0, 100) + '...', video: body.video ? 'data URI (length: ' + body.video.length + ')' : 'none' });
        const res = await axiosInstance.post(endpoint, body);
        const out = res?.data?.data?.videos?.[0]?.url || res?.data?.videos?.[0]?.url || res?.data?.data?.video?.url || res?.data?.video?.url || '';
        if (out) setOutputs((prev) => ({ ...prev, ['remove-bg']: out }));
        try { setCurrentHistoryId(res?.data?.data?.historyId || null); } catch {}
      }
    } catch (e) {
      console.error('[EditVideo] run.error', e);
      const errorData = (e as any)?.response?.data;
      const status = (e as any)?.response?.status;
      const config = (e as any)?.config;
      
      // Check if we got an HTML response (Next.js error page)
      if (errorData && typeof errorData === 'string' && errorData.includes('<!DOCTYPE html>')) {
        const baseURL = config?.baseURL || axiosInstance.defaults.baseURL;
        const url = config?.url || '';
        console.error('[EditVideo] Got HTML response - request may have hit Next.js instead of backend', {
          baseURL,
          url,
          fullUrl: baseURL ? `${baseURL}${url}` : url,
          status
        });
        setErrorMsg(`Backend connection error. Please check that NEXT_PUBLIC_API_BASE_URL is set correctly. (Status: ${status || 'unknown'})`);
        return;
      }
      
      let msg = (errorData && (errorData.message || errorData.error)) || (e as any)?.message || 'Request failed';
      if (!msg && Array.isArray(errorData)) {
        try { msg = errorData.map((x: any) => x?.msg || x).join(', '); } catch { }
      }
      if (typeof msg !== 'string') {
        try { msg = JSON.stringify(errorData); } catch { }
      }
      console.log('[EditVideo] Error details:', { errorData, status, url: config?.url, baseURL: config?.baseURL });
      setErrorMsg(String(msg));
    } finally {
      setProcessing((prev) => ({ ...prev, [selectedFeature]: false }));
    }
  };

  const handleReset = () => {
    setInputs({ 'upscale': null, 'remove-bg': null });
    setOutputs({ 'upscale': null, 'remove-bg': null });
    // Set appropriate default model based on selected feature
    if (selectedFeature === 'remove-bg') {
      setModel('fal-ai/birefnet/v2/video' as any);
      // Reset BiRefNet parameters to defaults
      setBirefModel('General Use (Light)');
      setBirefOperatingResolution('1024x1024');
      setBirefOutputMask(false);
      setBirefRefineFg(true);
      setBirefSyncMode(false);
      setBirefOutputType('X264 (.mp4)');
      setBirefQuality('high');
      setBirefWriteMode('balanced');
      setShowRemoveBgAdvanced(false);
    } else if (selectedFeature === 'upscale') {
      setModel('fal-ai/seedvr/upscale/video' as any);
    }
    setOutput('png');
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
      
      await downloadFileWithNaming(url, null, 'image', 'edited');
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
    <div className=" bg-[#07070B]">
      {/* Sticky header like ArtStation */}
      <div className="w-full fixed top-0 z-30 px-4  pb-2 bg-[#07070B] backdrop-blur-xl shadow-xl md:pr-5 pt-10">
        <div className="flex items-center gap-4">
          <div className="shrink-0 px-1 ml-6 sm:ml-5 md:ml-7 lg:ml-7 ">
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-semibold">Edit Videos</h1>
            <p className="text-white/80 text-base sm:text-lg md:text-xl">Transform your videos with AI</p>
          </div>
          {/* feature tabs moved to left sidebar */}
                </div>
            </div>
      {/* Spacer to offset fixed header height */}
      {/* <div className="h-[110px]"></div> */}
      {/* Upload from Library/Computer Modal */}
      <VideoUploadModal
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
              filters: { generationType: 'text-to-video' },
              paginationParams: { limit: 20 }
            })).unwrap();
          } catch { }
        }}
        onAdd={(urls: string[]) => {
          const first = urls[0];
          if (first) {
            // Apply selected video from modal to both features
            setInputs({
              'upscale': first,
              'remove-bg': first,
            });
            // Clear all outputs when a new video is selected so the output area re-renders
            setOutputs({
              'upscale': null,
              'remove-bg': null,
            });
            // Also reset zoom and pan state
            setScale(1);
            setOffset({ x: 0, y: 0 });
          }
        }}
      />
      <div className="flex flex-1 min-h-0 py-1 overflow-hidden pt-14" >
        {/* Left Sidebar - Controls */}
        <div className="w-auto bg-transparent flex flex-col h-full rounded-br-2xl mb-3 overflow-hidden relative md:w-[450px] ml-8 sm:ml-16 md:ml-9 lg:ml-9">
          {/* Error Message */}
            {errorMsg && (
            <div className="mx-3 mt-2 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
              <p className="text-red-400 text-xs">{errorMsg}</p>
            </div>
          )}


          {/* Feature tabs (two rows) */}
          <div className="px-3 md:px-4 pt-3 w-auto">
            <div className="grid grid-cols-4 gap-2">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => {
                    setSelectedFeature(feature.id as EditFeature);
                    if (feature.id === 'remove-bg') {
                      setModel('851-labs/background-remover');
                    } else if (feature.id === 'upscale') {
                      setModel('fal-ai/seedvr/upscale/video');
                    }
                    setProcessing((p) => ({ ...p, [feature.id]: false }));
                  }}
                  className={`text-left bg-white/5 items-center justify-center rounded-lg p-1 h-18 w-auto border transition ${selectedFeature === feature.id ? 'border-white/30 bg-white/10' : 'border-white/10 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-0 justify-center">
                    <div className={`w-6 h-6 rounded flex items-center justify-center  ${selectedFeature === feature.id ? '' : ''}`}>
                      {feature.id === 'upscale' && (<img src="/icons/scaling.svg" alt="Upscale" className="w-6 h-6" />)}
                      {feature.id === 'remove-bg' && (<img src="/icons/image-minus.svg" alt="Remove background" className="w-6 h-6" />)}
                    </div>
                    
                  </div>
                  <div className="flex items-center justify-center pt-1">                  
                    <span className="text-white text-xs md:text-sm text-center">{feature.label}</span>
                  </div>

                </button>
              ))}
            </div>
          </div>

          {/* Feature Preview (GIF banner) */}
          <div className="px-3 md:px-4 mb-2 pt-4">
            <div className="relative rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/15 h-24 md:h-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featurePreviewGif[selectedFeature]} alt="Feature preview" className="w-full h-full object-cover opacity-90" />
              <div className="absolute top-1 left-1 bg-black/70 text-white text-[11px] md:text-xs px-2 py-0.5 rounded">
                {featureDisplayName[selectedFeature]}
              </div>
            </div>
          </div>

          {/* Configuration area (no scroll). Add bottom padding so footer doesn't overlap. */}
          <div className="flex-1 min-h-0 p-3 overflow-hidden md:p-4">
            <h3 className="text-xs font-medium text-white/80 mb-2 md:text-sm">Parameters</h3>

            {selectedFeature === 'remove-bg' && model === 'fal-ai/birefnet/v2/video' && (
              <>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Model</label>
                    <div className="relative edit-dropdown">
                      <button onClick={() => setActiveDropdown(activeDropdown === 'birefModel' ? '' : 'birefModel')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                        <span className="truncate">{birefModel}</span>
                        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'birefModel' ? 'rotate-180' : ''}`} />
                      </button>
                      {activeDropdown === 'birefModel' && (
                        <div className="absolute z-30 top-full mt-2 left-0 w-56 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                          {(['General Use (Light)', 'General Use (Light 2K)', 'General Use (Heavy)', 'Matting', 'Portrait', 'General Use (Dynamic)'] as const).map((opt) => (
                            <button key={opt} onClick={() => { setBirefModel(opt); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${birefModel === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{opt}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Operating Resolution</label>
                    <div className="relative edit-dropdown">
                      <button onClick={() => setActiveDropdown(activeDropdown === 'birefOperatingResolution' ? '' : 'birefOperatingResolution')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                        <span className="truncate">{birefOperatingResolution}</span>
                        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'birefOperatingResolution' ? 'rotate-180' : ''}`} />
                      </button>
                      {activeDropdown === 'birefOperatingResolution' && (
                        <div className="absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                          {(['1024x1024', '2048x2048', '2304x2304'] as const).map((opt) => (
                            <button key={opt} onClick={() => { setBirefOperatingResolution(opt); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${birefOperatingResolution === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{opt}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-white/70 2xl:text-sm">Output Mask</label>
                    <button type="button" onClick={() => setBirefOutputMask(v => !v)} className={`h-[30px] w-16 px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium transition ${birefOutputMask ? 'bg-white text-black' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>{birefOutputMask ? 'On' : 'Off'}</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-white/70 2xl:text-sm">Refine Foreground</label>
                    <button type="button" onClick={() => setBirefRefineFg(v => !v)} className={`h-[30px] w-16 px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium transition ${birefRefineFg ? 'bg-white text-black' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>{birefRefineFg ? 'On' : 'Off'}</button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <h4 className="text-xs font-medium text-white/80">Additional Settings</h4>
                  <button type="button" onClick={() => setShowRemoveBgAdvanced(v => !v)} className="px-2 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white/80 border border-white/20">{showRemoveBgAdvanced ? 'Less' : 'More'}</button>
                </div>
                {showRemoveBgAdvanced && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-white/70 2xl:text-sm">Sync Mode</label>
                      <button type="button" onClick={() => setBirefSyncMode(v => !v)} className={`h-[30px] w-16 px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium transition ${birefSyncMode ? 'bg-white text-black' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>{birefSyncMode ? 'On' : 'Off'}</button>
                    </div>
                    <div className="text-[11px] text-white/50">Note: When sync_mode is true, the media will be returned as a Base64 URI and not stored.</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1">Video Output Type</label>
                        <div className="relative edit-dropdown">
                          <button onClick={() => setActiveDropdown(activeDropdown === 'birefOutputType' ? '' : 'birefOutputType')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                            <span className="truncate">{birefOutputType}</span>
                            <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'birefOutputType' ? 'rotate-180' : ''}`} />
                          </button>
                          {activeDropdown === 'birefOutputType' && (
                            <div className="absolute z-30 top-full mt-2 left-0 w-56 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                              {(['X264 (.mp4)', 'VP9 (.webm)', 'PRORES4444 (.mov)', 'GIF (.gif)'] as const).map((fmt) => (
                                <button key={fmt} onClick={() => { setBirefOutputType(fmt); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${birefOutputType === fmt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{fmt}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1">Video Quality</label>
                        <div className="relative edit-dropdown">
                          <button onClick={() => setActiveDropdown(activeDropdown === 'birefQuality' ? '' : 'birefQuality')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                            <span className="truncate">{birefQuality}</span>
                            <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'birefQuality' ? 'rotate-180' : ''}`} />
                          </button>
                          {activeDropdown === 'birefQuality' && (
                            <div className="absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                              {(['low', 'medium', 'high', 'maximum'] as const).map((q) => (
                                <button key={q} onClick={() => { setBirefQuality(q); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${birefQuality === q ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{q}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1">Video Write Mode</label>
                      <div className="relative edit-dropdown">
                        <button onClick={() => setActiveDropdown(activeDropdown === 'birefWriteMode' ? '' : 'birefWriteMode')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                          <span className="truncate">{birefWriteMode}</span>
                          <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'birefWriteMode' ? 'rotate-180' : ''}`} />
                        </button>
                        {activeDropdown === 'birefWriteMode' && (
                          <div className="absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                            {(['fast', 'balanced', 'small'] as const).map((m) => (
                              <button key={m} onClick={() => { setBirefWriteMode(m); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${birefWriteMode === m ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{m}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

              {selectedFeature === 'upscale' && model === 'fal-ai/seedvr/upscale/video' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Upscale Mode</label>
                      <div className="relative edit-dropdown">
                        <button onClick={() => setActiveDropdown(activeDropdown === 'backgroundType' ? '' : 'backgroundType')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                          <span className="truncate">{seedvrUpscaleMode}</span>
                          <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'backgroundType' ? 'rotate-180' : ''}`} />
                        </button>
                        {activeDropdown === 'backgroundType' && (
                          <div className="absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                            {(['factor','target'] as const).map((opt) => (
                              <button key={opt} onClick={() => { setSeedvrUpscaleMode(opt); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${seedvrUpscaleMode === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{opt}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {seedvrUpscaleMode === 'factor' ? (
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Upscale Factor</label>
                        <input type="number" min={0.1} max={10} step={0.1} value={seedvrUpscaleFactor} onChange={(e)=>setSeedvrUpscaleFactor(Math.max(0.1, Math.min(10, Number(e.target.value) || 2)))} className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs" />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Target Resolution</label>
                        <div className="relative edit-dropdown">
                          <button onClick={() => setActiveDropdown(activeDropdown === 'seedvrTargetResolution' ? '' : 'seedvrTargetResolution')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                            <span className="truncate">{seedvrTargetResolution}</span>
                            <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'seedvrTargetResolution' ? 'rotate-180' : ''}`} />
                          </button>
                          {activeDropdown === 'seedvrTargetResolution' && (
                            <div className="absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                              {(['720p','1080p','1440p','2160p'] as const).map((opt) => (
                                <button key={opt} onClick={() => { setSeedvrTargetResolution(opt); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${seedvrTargetResolution === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{opt}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <h4 className="text-xs font-medium text-white/80">Additional Settings</h4>
                    <button type="button" onClick={() => setShowUpscaleAdvanced(v => !v)} className="px-2 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white/80 border border-white/20">{showUpscaleAdvanced ? 'Less' : 'More'}</button>
                  </div>
                  {showUpscaleAdvanced && (
                    <div className="space-y-2 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1">Seed</label>
                          <input type="number" value={seedvrSeed as any} onChange={(e)=>setSeedvrSeed(e.target.value)} placeholder="random" className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1">Noise Scale</label>
                          <input type="number" min={0} max={2} step={0.01} value={seedvrNoiseScale} onChange={(e)=>setSeedvrNoiseScale(Math.max(0, Math.min(2, Number(e.target.value) || 0.1)))} className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1">Output Format</label>
                          <div className="relative edit-dropdown">
                            <button onClick={() => setActiveDropdown(activeDropdown === 'output' ? '' : 'output')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                              <span className="truncate">{seedvrOutputFormat}</span>
                              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'output' ? 'rotate-180' : ''}`} />
                            </button>
                            {activeDropdown === 'output' && (
                              <div className="absolute z-30 top-full mt-2 left-0 w-56 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                                {(['X264 (.mp4)','VP9 (.webm)','PRORES4444 (.mov)','GIF (.gif)'] as const).map((fmt) => (
                                  <button key={fmt} onClick={() => { setSeedvrOutputFormat(fmt); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${seedvrOutputFormat === fmt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{fmt}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1">Output Quality</label>
                          <div className="relative edit-dropdown">
                            <button onClick={() => setActiveDropdown(activeDropdown === 'seedvrQuality' ? '' : 'seedvrQuality')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                              <span className="truncate">{seedvrOutputQuality}</span>
                              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'seedvrQuality' ? 'rotate-180' : ''}`} />
                            </button>
                            {activeDropdown === 'seedvrQuality' && (
                              <div className="absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                                {(['low','medium','high','maximum'] as const).map((q) => (
                                  <button key={q} onClick={() => { setSeedvrOutputQuality(q); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${seedvrOutputQuality === q ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{q}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1">Write Mode</label>
                          <div className="relative edit-dropdown">
                            <button onClick={() => setActiveDropdown(activeDropdown === 'seedvrWriteMode' ? '' : 'seedvrWriteMode')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                              <span className="truncate">{seedvrOutputWriteMode}</span>
                              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'seedvrWriteMode' ? 'rotate-180' : ''}`} />
                            </button>
                            {activeDropdown === 'seedvrWriteMode' && (
                              <div className="absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                                {(['fast','balanced','small'] as const).map((m) => (
                                  <button key={m} onClick={() => { setSeedvrOutputWriteMode(m); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${seedvrOutputWriteMode === m ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{m}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-end">
                          <div className="w-full">
                            <label className="block text-xs font-medium text-white/70 mb-1">Sync Mode</label>
                            <button type="button" onClick={() => setSeedvrSyncMode(v=>!v)} className={`h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium transition ${seedvrSyncMode ? 'bg-white text-black' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>{seedvrSyncMode ? 'On' : 'Off'}</button>
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] text-white/50">Note: When sync_mode is true, the media will be returned as a Base64 URI and not stored.</div>
                    </div>
                  )}
                </>
              )}

              {selectedFeature === 'remove-bg' && (
                <>
                  <div className="flex items-center justify-between mt-2">
                    <h4 className="text-xs font-medium text-white/80">Additional Settings</h4>
                    <button type="button" onClick={() => setShowUpscaleAdvanced(v => !v)} className="px-2 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white/80 border border-white/20">{showUpscaleAdvanced ? 'Less' : 'More'}</button>
                  </div>
                  {showUpscaleAdvanced && (
                    <div className="space-y-2 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1">Model</label>
                          <div className="relative edit-dropdown">
                            <button onClick={() => setActiveDropdown(activeDropdown === 'backgroundType' ? '' : 'backgroundType')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                              <span className="truncate">{birefModel}</span>
                              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'backgroundType' ? 'rotate-180' : ''}`} />
                            </button>
                            {activeDropdown === 'backgroundType' && (
                              <div className="absolute z-30 top-full mt-2 left-0 w-64 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                                {(['General Use (Light)','General Use (Light 2K)','General Use (Heavy)','Matting','Portrait','General Use (Dynamic)'] as const).map((opt) => (
                                  <button key={opt} onClick={() => { setBirefModel(opt); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${birefModel === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{opt}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1">Operating Resolution</label>
                          <div className="relative edit-dropdown">
                            <button onClick={() => setActiveDropdown(activeDropdown === 'seedvrTargetResolution' ? '' : 'seedvrTargetResolution')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                              <span className="truncate">{birefOperatingResolution}</span>
                              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'seedvrTargetResolution' ? 'rotate-180' : ''}`} />
                            </button>
                            {activeDropdown === 'seedvrTargetResolution' && (
                              <div className="absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                                {(['1024x1024','2048x2048','2304x2304'] as const).map((opt) => (
                                  <button key={opt} onClick={() => { setBirefOperatingResolution(opt); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${birefOperatingResolution === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{opt}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-end">
                          <div className="w-full">
                            <label className="block text-xs font-medium text-white/70 mb-1">Output Mask</label>
                            <button type="button" onClick={() => setBirefOutputMask(v=>!v)} className={`h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium transition ${birefOutputMask ? 'bg-white text-black' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>{birefOutputMask ? 'On' : 'Off'}</button>
                          </div>
                        </div>
                        <div className="flex items-end">
                          <div className="w-full">
                            <label className="block text-xs font-medium text-white/70 mb-1">Refine Foreground</label>
                            <button type="button" onClick={() => setBirefRefineFg(v=>!v)} className={`h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium transition ${birefRefineFg ? 'bg-white text-black' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>{birefRefineFg ? 'On' : 'Off'}</button>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1">Video Output Type</label>
                          <div className="relative edit-dropdown">
                            <button onClick={() => setActiveDropdown(activeDropdown === 'output' ? '' : 'output')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                              <span className="truncate">{birefOutputType}</span>
                              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'output' ? 'rotate-180' : ''}`} />
                            </button>
                            {activeDropdown === 'output' && (
                              <div className="absolute z-30 top-full mt-2 left-0 w-56 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                                {(['X264 (.mp4)','VP9 (.webm)','PRORES4444 (.mov)','GIF (.gif)'] as const).map((fmt) => (
                                  <button key={fmt} onClick={() => { setBirefOutputType(fmt); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${birefOutputType === fmt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{fmt}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1">Video Quality</label>
                          <div className="relative edit-dropdown">
                            <button onClick={() => setActiveDropdown(activeDropdown === 'seedvrQuality' ? '' : 'seedvrQuality')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                              <span className="truncate">{birefQuality}</span>
                              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'seedvrQuality' ? 'rotate-180' : ''}`} />
                            </button>
                            {activeDropdown === 'seedvrQuality' && (
                              <div className="absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                                {(['low','medium','high','maximum'] as const).map((q) => (
                                  <button key={q} onClick={() => { setBirefQuality(q); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${birefQuality === q ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{q}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1">Video Write Mode</label>
                          <div className="relative edit-dropdown">
                            <button onClick={() => setActiveDropdown(activeDropdown === 'seedvrWriteMode' ? '' : 'seedvrWriteMode')} className="h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium bg-white/5 text-white/90 flex items-center justify-between">
                              <span className="truncate">{birefWriteMode}</span>
                              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'seedvrWriteMode' ? 'rotate-180' : ''}`} />
                            </button>
                            {activeDropdown === 'seedvrWriteMode' && (
                              <div className="absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2">
                                {(['fast','balanced','small'] as const).map((m) => (
                                  <button key={m} onClick={() => { setBirefWriteMode(m); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${birefWriteMode === m ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{m}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-end">
                          <div className="w-full">
                            <label className="block text-xs font-medium text-white/70 mb-1">Sync Mode</label>
                            <button type="button" onClick={() => setBirefSyncMode(v=>!v)} className={`h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium transition ${birefSyncMode ? 'bg-white text-black' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>{birefSyncMode ? 'On' : 'Off'}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}


            {/* Bottom action buttons under parameters */}
            <div className="mt-3 pt-2 border-t border-white/10">
              <div className="flex gap-2 2xl:gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors 2xl:text-sm 2xl:py-2"
                >
                  Reset
                </button>
                <button
                  onClick={handleRun}
                  disabled={!inputs[selectedFeature] || processing[selectedFeature]}
                  className="flex-1 px-2 py-1.5 text-xs font-semibold text-white bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors 2xl:text-sm 2xl:py-2"
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
          <div className="p-4 flex items-center justify-center pt-3 h-full">
            <div
              className="bg-white/5 rounded-xl border border-white/10 relative overflow-hidden min-h-[24rem] h-full w-full max-w-6xl md:max-w-[100rem] flex items-center justify-center"
              onDragOver={(e) => { try { e.preventDefault(); } catch {} }}
              onDrop={(e) => {
                try {
                  e.preventDefault();
                  const file = e.dataTransfer?.files?.[0];
                  if (!file || !file.type.startsWith('video/')) return;
                 const reader = new FileReader();
                 reader.onload = (ev) => {
                   const video = ev.target?.result as string;
                   // Apply dropped video to both features so switching tabs preserves the same input
                   setInputs({
                     'upscale': video,
                     'remove-bg': video,
                   });
                   // Clear all outputs when a new video is dropped so the output area re-renders
                   setOutputs({
                     'upscale': null,
                     'remove-bg': null,
                   });
                   // Also reset zoom and pan state
                   setScale(1);
                   setOffset({ x: 0, y: 0 });
                 };
                  reader.readAsDataURL(file);
                } catch {}
              }}
            >
                {/* Dotted grid background overlay */}
              <div className="absolute inset-0 z-0  pointer-events-none opacity-30 bg-[radial-gradient(circle,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px]" />
              {outputs[selectedFeature] && (
                <div className="absolute top-5 left-4 z-10 ">
                  <span className="text-xs font-medium text-white bg-black/80 px-2 py-1 rounded md:text-sm md:px-3 md:py-1.5">Output {selectedFeature === 'upscale' ? 'Video' : 'Image'}</span>
                </div>
              )}
              

              {/* Bottom-left controls: menu (if output) and upload (always when image present) */}
              {(outputs[selectedFeature] || inputs[selectedFeature]) && (
                <div className="absolute bottom-3 left-3 z-50 md:bottom-16 md:left-4 flex items-center gap-2">
              {outputs[selectedFeature] && (
                    <div className="relative">
                  <button
                    ref={menuButtonRef}
                        className="p-2.5 bg-black/80 hover:bg-black/70 text-white rounded-lg transition-all duration-200 border border-white/30 md:p-2"
                    aria-haspopup="menu"
                    aria-expanded={showImageMenu}
                        onClick={() => setShowImageMenu(v => !v)}
                  >
                    <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="5" cy="12" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="19" cy="12" r="2" />
                    </svg>
                      </button>
                    </div>
                  )}
                  {/* Upload other button next to menu */}
                  <button
                    onClick={() => {
                      // Do not clear existing image/output here. Only open the modal.
                      // If user picks a new image, onAdd will replace the input.
                      try { handleOpenUploadModal(); } catch {}
                    }}
                    className="p-2 bg-black/80 hover:bg-black/70 text-white rounded-lg transition-all duration-200 border border-white/30"
                    title="Upload other"
                  >
                    <Image src="/icons/fileupload.svg" alt="Upload" width={18} height={18} />
                  </button>

                  
                  
                  {/* Themed dropdown menu */}
                  {outputs[selectedFeature] && showImageMenu && (
                    <div ref={menuRef} className="absolute bottom-10 left-0 bg-black/80 border border-white/30 rounded-lg shadow-2xl min-w-[100px] overflow-hidden md:min-w-[150px]">
                      <button
                        onClick={async () => {
                          console.log('Download clicked!')
                          await handleDownloadOutput();
                          setShowImageMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-green-500/20 text-sm flex items-center gap-3 transition-colors duration-200 border-b border-white/10 md:text-base md:py-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download
                      </button>
                      <button
                        onClick={async () => {
                          console.log('Share clicked!')
                          await handleShareOutput();
                          setShowImageMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-blue-500/20 text-sm flex items-center gap-3 transition-colors duration-200 md:text-base md:py-2"
                      >
                        <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z" />
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
                        className="w-full px-4 py-3 text-left text-red-300 hover:bg-red-500/10 text-sm flex items-center gap-3 transition-colors duration-200 border-t border-white/10 md:text-base md:py-2"
                      >
                        <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              {outputs[selectedFeature] ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  {(inputs[selectedFeature]) ? (
                    // Comparison slider removed - always show output video in zoom mode
                    <div className="w-full h-full relative flex items-center justify-center min-h-[24rem] md:min-h-[35rem] lg:h-[40rem]">
                       {/* Zoom mode (all features) - always show output */}
                        <div
                          ref={imageContainerRef}
                          className="w-full h-full relative cursor-move select-none flex items-center justify-center min-h-[24rem] md:min-h-[35rem] lg:h-[40rem]"
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          onWheel={handleWheel}
                          onKeyDown={handleKeyDown}
                          tabIndex={0}
                          style={{ outline: 'none' }}
                        >
                          {isVideoUrl(outputs[selectedFeature]) ? (
                            <video
                              src={outputs[selectedFeature] as string}
                              controls
                              className="max-w-full max-h-full w-auto h-auto object-contain"
                              style={{
                                transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                                transformOrigin: 'center center',
                              }}
                              onLoadedData={(e) => {
                                const video = e.target as HTMLVideoElement;
                                setNaturalSize({ width: video.videoWidth, height: video.videoHeight });
                              }}
                            />
                          ) : (
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
                          )}
                          
                          {/* Zoom Controls */}
                          <div className="absolute bottom-3 right-3 z-30 2xl:bottom-16 2xl:right-4">
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
                    </div>
                  ) : (
                    // Regular image viewer with zoom controls
                    <div
                      ref={imageContainerRef}
                      className="w-full h-full relative cursor-move select-none flex items-center justify-center min-h-[24rem] md:min-h-[35rem] lg:min-h-[45rem]"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onWheel={handleWheel}
                      onKeyDown={handleKeyDown}
                      tabIndex={0}
                      style={{ outline: 'none' }}
                    >
                      {isVideoUrl(outputs[selectedFeature]) ? (
                        <video
                          src={outputs[selectedFeature] as string}
                          controls
                          className="max-w-full max-h-full w-auto h-auto object-contain"
                          style={{
                            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                            transformOrigin: 'center center',
                          }}
                          onLoadedData={(e) => {
                            const video = e.target as HTMLVideoElement;
                            setNaturalSize({ width: video.videoWidth, height: video.videoHeight });
                          }}
                        />
                      ) : (
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
                      )}
                      
                      {/* Zoom Controls */}
                      <div className="absolute bottom-3 right-3 z-30 2xl:bottom-16 2xl:right-4">
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
                <div className="w-full h-full relative flex items-center justify-center min-h-[24rem] md:min-h-[35rem] lg:h-[45rem]">
                  {inputs[selectedFeature] ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isVideoUrl(inputs[selectedFeature]) ? (
                        <video
                          src={inputs[selectedFeature] as string}
                          controls
                          className="max-w-full max-h-full w-auto h-auto object-contain"
                          onLoadedData={(e) => {
                            const video = e.target as HTMLVideoElement;
                            setInputNaturalSize({ width: video.videoWidth, height: video.videoHeight });
                          }}
                        />
                      ) : (
                        <Image
                          src={inputs[selectedFeature] as string} 
                          alt="Input" 
                          fill 
                          className="object-contain object-center"
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement;
                            setInputNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleOpenUploadModal}
                      className="text-white/80 hover:text-white transition-colors text-center"
                    >
                      <svg className="w-10 h-10 mx-auto mb-2 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 15a4 4 0 004 4h10a4 4 0 100-8h-1.26A8 8 0 103 15z" />
                        </svg>
                      <span className="text-xs">Drop video here or click to upload</span>
                    </button>
                    )}
                </div>
              )}
              {/* Fill mask overlay moved to input area */}
              {processing[selectedFeature] && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                  <img src="/styles/Logo.gif" alt="Generating..." className="w-32 h-32 md:w-48 md:h-48 opacity-90" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



export default EditVideoInterface;

