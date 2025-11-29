  'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { FilePlus, ChevronUp } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { getIsPublic } from '@/lib/publicFlag';
import FrameSizeDropdown from '@/app/view/Generation/ImageGeneration/TextToImage/compo/FrameSizeDropdown';
import StyleSelector from '@/app/view/Generation/ImageGeneration/TextToImage/compo/StyleSelector';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import { loadMoreHistory, loadHistory } from '@/store/slices/historySlice';
import { useHistoryLoader } from '@/hooks/useHistoryLoader';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { toast } from 'react-hot-toast';

type EditFeature = 'upscale' | 'remove-bg' | 'resize' | 'fill' | 'vectorize' | 'erase' | 'expand' | 'reimagine' | 'live-chat';

const EditImageInterface: React.FC = () => {
  const user = useAppSelector((state: any) => state.auth?.user);
  const searchParams = useSearchParams();
  const [selectedFeature, setSelectedFeature] = useState<EditFeature>('upscale');
  const [inputs, setInputs] = useState<Record<EditFeature, string | null>>({
    'upscale': null,
    'remove-bg': null,
    'resize': null,
    'fill': null,
    'vectorize': null,
    'erase': null,
    'expand': null,
    'reimagine': null,
    'live-chat': null,
  });
  // Per-feature outputs and processing flags so operations don't block each other
  const [outputs, setOutputs] = useState<Record<EditFeature, string | null>>({
    'upscale': null,
    'remove-bg': null,
    'resize': null,
    'fill': null,
    'vectorize': null,
    'erase': null,
    'expand': null,
    'reimagine': null,
    'live-chat': null,
  });
  const [processing, setProcessing] = useState<Record<EditFeature, boolean>>({
    'upscale': false,
    'remove-bg': false,
    'resize': false,
    'fill': false,
    'vectorize': false,
    'erase': false,
    'expand': false,
    'reimagine': false,
    'live-chat': false,
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
  // Fill mask drawing
  const fillCanvasRef = useRef<HTMLCanvasElement>(null);
  const fillContainerRef = useRef<HTMLDivElement>(null);
  const [inputNaturalSize, setInputNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isMasking, setIsMasking] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [brushSize, setBrushSize] = useState(18);
  const [eraseMode, setEraseMode] = useState(false);
  // Reimagine: Selection confirmation and floating prompt
  const [reimagineSelectionConfirmed, setReimagineSelectionConfirmed] = useState(false);
  const [reimaginePrompt, setReimaginePrompt] = useState('');
  const [reimagineSelectionBounds, setReimagineSelectionBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  // Real-time selection bounds for visual feedback
  const [reimagineLiveBounds, setReimagineLiveBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  // Reimagine: Selection mode (brush or rectangle)
  const [reimagineSelectionMode, setReimagineSelectionMode] = useState<'brush' | 'rectangle'>('rectangle');
  // Reimagine: Model selection (auto, nano-banana, seedream-4k)
  const [reimagineModel, setReimagineModel] = useState<'auto' | 'nano-banana' | 'seedream-4k'>('auto');
  // Rectangle selection state
  const [isDrawingRectangle, setIsDrawingRectangle] = useState(false);
  const [rectangleStart, setRectangleStart] = useState<{ x: number; y: number } | null>(null);
  const [rectangleCurrent, setRectangleCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [fillSeed, setFillSeed] = useState<string>('');
  const [fillNegativePrompt, setFillNegativePrompt] = useState<string>('');
  const [fillNumImages, setFillNumImages] = useState<number>(1);
  const [fillSyncMode, setFillSyncMode] = useState<boolean>(false);
  // Expand feature state
  const [expandOriginalSize, setExpandOriginalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [expandBounds, setExpandBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });
  const [expandAspectRatio, setExpandAspectRatio] = useState<string>('custom');
  const [expandCustomWidth, setExpandCustomWidth] = useState<number>(0);
  const [expandCustomHeight, setExpandCustomHeight] = useState<number>(0);
  // Effective provider-conformant size (after normalization)
  const [expandEffectiveWidth, setExpandEffectiveWidth] = useState<number>(0);
  const [expandEffectiveHeight, setExpandEffectiveHeight] = useState<number>(0);
  const expandCanvasRef = useRef<HTMLCanvasElement>(null);
  const expandContainerRef = useRef<HTMLDivElement>(null);
  const expandImageRef = useRef<HTMLImageElement | null>(null);
  const [expandResizing, setExpandResizing] = useState<string | null>(null); // 'left', 'right', 'top', 'bottom', 'top-left', etc.
  const [expandHoverEdge, setExpandHoverEdge] = useState<string | null>(null);
  
  // Form states
  const [model, setModel] = useState<'' | 'philz1337x/clarity-upscaler' | 'fermatresearch/magic-image-refiner' | 'nightmareai/real-esrgan' | '851-labs/background-remover' | 'lucataco/remove-bg' | 'philz1337x/crystal-upscaler' | 'fal-ai/topaz/upscale/image' | 'fal-ai/bria/expand' | 'fal-ai/bria/genfill' | 'google_nano_banana' | 'seedream_4'>('philz1337x/crystal-upscaler');
  const [prompt, setPrompt] = useState('');
  const [scaleFactor, setScaleFactor] = useState('');
  const [faceEnhance, setFaceEnhance] = useState(false);
  const [swinTask, setSwinTask] = useState<'classical_sr' | 'real_sr' | 'compressed_sr'>('real_sr');
  const getSwinTaskLabel = (t: 'classical_sr' | 'real_sr' | 'compressed_sr') => {
    if (t === 'classical_sr') return 'classical_sr: Upscale high-quality inputs (classical super-resolution).';
    if (t === 'real_sr') return 'real_sr: Upscale real-world photos with mixed noise/compression (default).';
    return 'compressed_sr: Upscale heavily compressed/low-bitrate images.';
  };
  const getUpscaleModelLabel = (m: string) => {
    if (m === 'philz1337x/clarity-upscaler') return 'Clarity Upscaler';
    if (m === 'nightmareai/real-esrgan') return 'Real-ESRGAN';
    if (m === 'philz1337x/crystal-upscaler') return 'Crystal Upscaler';
    if (m === 'fal-ai/topaz/upscale/image') return 'Topaz Upscaler';
    if (m === 'fal-ai/bria/expand') return 'Bria Expand (Resize)';
  if (m === 'fal-ai/bria/genfill') return 'Bria GenFill';
  if (m === 'google_nano_banana') return 'Google Nano Banana';
  if (m === 'seedream_4') return 'Seedream 4';
    if (m === '851-labs/background-remover') return '851 Labs Remove BG';
    if (m === 'lucataco/remove-bg') return 'LucaTaco Remove BG';
    return m;
  };
  const [output, setOutput] = useState<'' | 'png' | 'jpg' | 'jpeg' | 'webp'>('png');
  // Topaz upscaler state
  const [topazModel, setTopazModel] = useState<'Low Resolution V2' | 'Standard V2' | 'CGI' | 'High Fidelity V2' | 'Text Refine' | 'Recovery' | 'Redefine' | 'Recovery V2'>('Standard V2');
  const [topazUpscaleFactor, setTopazUpscaleFactor] = useState<number>(2);
  const [topazCropToFill, setTopazCropToFill] = useState<boolean>(false);
  const [topazOutputFormat, setTopazOutputFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [topazSubjectDetection, setTopazSubjectDetection] = useState<'All' | 'Foreground' | 'Background'>('All');
  const [topazFaceEnhance, setTopazFaceEnhance] = useState<boolean>(true);
  const [topazFaceCreativity, setTopazFaceCreativity] = useState<number>(0);
  const [topazFaceStrength, setTopazFaceStrength] = useState<number>(0.8);
  // Outpaint (resize) controls
  const [resizeExpandLeft, setResizeExpandLeft] = useState<number>(0);
  const [resizeExpandRight, setResizeExpandRight] = useState<number>(0);
  const [resizeExpandTop, setResizeExpandTop] = useState<number>(0);
  const [resizeExpandBottom, setResizeExpandBottom] = useState<number>(400);
  const [resizeZoomOutPercentage, setResizeZoomOutPercentage] = useState<number>(20);
  const [resizeNumImages, setResizeNumImages] = useState<number>(1);
  const [resizeSafetyChecker, setResizeSafetyChecker] = useState<boolean>(true);
  const [resizeSyncMode, setResizeSyncMode] = useState<boolean>(false);
  const [resizeOutputFormat, setResizeOutputFormat] = useState<'png' | 'jpeg' | 'jpg' | 'webp'>('png');
  const [resizeAspectRatio, setResizeAspectRatio] = useState<'' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2' | '4:5' | '5:4'>('');
  // Bria Expand specific fields
  const [resizeCanvasW, setResizeCanvasW] = useState<number | ''>('');
  const [resizeCanvasH, setResizeCanvasH] = useState<number | ''>('');
  const [resizeOrigW, setResizeOrigW] = useState<number | ''>('');
  const [resizeOrigH, setResizeOrigH] = useState<number | ''>('');
  const [resizeOrigX, setResizeOrigX] = useState<number | ''>('');
  const [resizeOrigY, setResizeOrigY] = useState<number | ''>('');
  const [resizeSeed, setResizeSeed] = useState<string>('');
  const [resizeNegativePrompt, setResizeNegativePrompt] = useState<string>('');
  const [dynamic, setDynamic] = useState('');
  const [sharpen, setSharpen] = useState('');
  const [backgroundType, setBackgroundType] = useState('');
  // Interactive expand overlay state (left/right/top/bottom margins added around original image)
  const [expandLeftPx, setExpandLeftPx] = useState<number>(0);
  const [expandRightPx, setExpandRightPx] = useState<number>(0);
  const [expandTopPx, setExpandTopPx] = useState<number>(0);
  const [expandBottomPx, setExpandBottomPx] = useState<number>(0);
  const [draggingEdge, setDraggingEdge] = useState<null | 'left' | 'right' | 'top' | 'bottom'>(null);
  const dragStartRef = useRef<{x:number;y:number;l:number;r:number;t:number;b:number} | null>(null);


  const [threshold, setThreshold] = useState<string>('');
  const [reverseBg, setReverseBg] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'model' | 'output' | 'swinTask' | 'backgroundType' | 'vectorizeModel' | 'vColorMode' | 'vHierarchical' | 'vMode' | 'resizeOutput' | 'resizeAspect' | 'replaceModel' | 'expandAspect' | 'topazModel' | ''>('');
  // Live Chat dropdown keys
  const [liveActiveDropdown, setLiveActiveDropdown] = useState<'liveModel' | 'liveFrame' | 'liveResolution' | ''>('');
  // Vectorize controls
  const [vectorizeModel, setVectorizeModel] = useState<'fal-ai/recraft/vectorize' | 'fal-ai/image2svg'>('fal-ai/recraft/vectorize');
  const [vColorMode, setVColorMode] = useState<'color' | 'binary'>('color');
  const [vHierarchical, setVHierarchical] = useState<'stacked' | 'cutout'>('stacked');
  const [vMode, setVMode] = useState<'spline' | 'polygon'>('spline');
  const [vFilterSpeckle, setVFilterSpeckle] = useState<number>(4);
  const [vColorPrecision, setVColorPrecision] = useState<number>(6);
  const [vLayerDifference, setVLayerDifference] = useState<number>(16);
  const [vCornerThreshold, setVCornerThreshold] = useState<number>(60);
  const [vLengthThreshold, setVLengthThreshold] = useState<number>(4);
  const [vMaxIterations, setVMaxIterations] = useState<number>(10);
  const [vSpliceThreshold, setVSpliceThreshold] = useState<number>(45);
  const [vPathPrecision, setVPathPrecision] = useState<number>(3);
  const [vectorizeSuperMode, setVectorizeSuperMode] = useState<boolean>(false);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  // Live Chat feature state
  const [liveModel, setLiveModel] = useState<'gemini-25-flash-image' | 'google/nano-banana-pro' | 'seedream-v4'>('gemini-25-flash-image');
  const [liveFrameSize, setLiveFrameSize] = useState<'1:1' | '3:4' | '4:3' | '16:9' | '9:16'>('1:1');
  const [liveResolution, setLiveResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [livePrompt, setLivePrompt] = useState<string>('');
  const [liveChatMessages, setLiveChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; status?: 'generating' | 'done' }>>([]);
  const [liveHistory, setLiveHistory] = useState<string[]>([]);
  const [activeLiveIndex, setActiveLiveIndex] = useState<number>(-1);
  const [liveOriginalInput, setLiveOriginalInput] = useState<string | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const lastMsgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = chatListRef.current;
    if (!el) return;
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } catch (e) {
      // older browsers fallback
      el.scrollTop = el.scrollHeight;
    }
  }, [liveChatMessages]);

  // Live Chat dropdowns are closed by default; frame dropdown opens only after model selection.

  const liveAllowedModels: Array<{ label: string; value: 'gemini-25-flash-image' | 'google/nano-banana-pro' | 'seedream-v4' }> = [
    { label: 'Google Nano Banana', value: 'gemini-25-flash-image' },
    { label: 'Google Nano Banana Pro', value: 'google/nano-banana-pro' },
    { label: 'Seedream v4 4k', value: 'seedream-v4' },
  ];

  const liveFrameSizes = [
    { name: 'Square', value: '1:1' },
    { name: 'Portrait', value: '3:4' },
    { name: 'Landscape', value: '4:3' },
    { name: 'Wide', value: '16:9' },
    { name: 'Vertical', value: '9:16' },
  ];

  const parseOutputUrl = (res: any): string => (
    res?.data?.images?.[0]?.url ||
    res?.data?.data?.images?.[0]?.url ||
    res?.data?.data?.url ||
    res?.data?.url ||
    ''
  );

  const handleLiveGenerate = async () => {
    try {
      const img = inputs['live-chat'] || (activeLiveIndex >= 0 ? liveHistory[activeLiveIndex] : null);
      if (!img) {
        setErrorMsg('Please upload or select an image for Live Chat');
        return;
      }
      if (!livePrompt.trim()) return;

      setProcessing((p) => ({ ...p, ['live-chat']: true }));
      setErrorMsg('');
      setLiveChatMessages((prev) => [
        ...prev,
        { role: 'user', text: livePrompt },
        { role: 'assistant', text: 'Generating...', status: 'generating' },
      ]);

      let out = '';
      if (liveModel === 'seedream-v4') {
        const payload: any = {
          prompt: livePrompt,
          model: 'bytedance/seedream-4',
          size: liveResolution,
          aspect_ratio: liveFrameSize,
          image_input: [img],
          sequential_image_generation: 'disabled',
          max_images: 1,
          isPublic: true,
        };
        const res = await axiosInstance.post('/api/replicate/generate', payload);
        out = parseOutputUrl(res);
      } else {
        const payload: any = {
          prompt: livePrompt,
          model: liveModel,
          n: 1,
          uploadedImages: [img],
          output_format: 'jpeg',
          frameSize: liveFrameSize,
          size: liveResolution,
          generationType: 'live-chat',
        };
        const res = await axiosInstance.post('/api/fal/generate', payload);
        out = parseOutputUrl(res);
      }

      if (out) {
        setOutputs((prev) => ({ ...prev, ['live-chat']: out }));
        setLiveHistory((prev) => [...prev, out]);
        setActiveLiveIndex((prev) => prev + 1 >= 0 ? prev + 1 : 0);
        // Preserve the original input used for this generation so it can be shown
        // in the right-side thumbnail column below generated images.
        if (!liveOriginalInput && inputs['live-chat']) {
          setLiveOriginalInput(inputs['live-chat'] as string);
        }
        // Continue using the latest generated image as the working input
        setInputs((prev) => ({ ...prev, ['live-chat']: out }));
      }

      setLiveChatMessages((prev) => {
        const idx = prev.findIndex((m) => m.status === 'generating' && m.role === 'assistant');
          if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { role: 'assistant', text: 'Image generated', status: 'done' };
          return copy;
        }
        return prev;
      });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Generation failed');
      setLiveChatMessages((prev) => {
        const idx = prev.findIndex((m) => m.status === 'generating' && m.role === 'assistant');
          if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { role: 'assistant', text: 'Generation failed', status: 'done' };
          return copy;
        }
        return prev;
      });
    } finally {
      setProcessing((p) => ({ ...p, ['live-chat']: false }));
      setLivePrompt('');
    }
  };
  const selectedGeneratorModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-dev');
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const selectedStyle = useAppSelector((state: any) => state.generation?.style || 'none');
  const reduxUploadedImages = useAppSelector((state: any) => state.generation?.uploadedImages || []);
  const dispatch = useAppDispatch();

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Get raw history entries from Redux
  const allHistoryEntries = useAppSelector((s: any) => s.history?.entries || []);
  const historyLoading = useAppSelector((s: any) => s.history?.loading || false);
  const historyHasMore = useAppSelector((s: any) => s.history?.hasMore || false);
  const historyFilters = useAppSelector((s: any) => s.history?.filters || {});
  const historyError = useAppSelector((s: any) => s.history?.error || null);
  
  // Memoize filtered history entries to prevent unnecessary rerenders
  const historyEntries = useMemo(() => {
    console.log('[EditImage] Filtering history entries:', {
      totalRawEntries: allHistoryEntries.length,
      filters: historyFilters,
    });
    
    const filtered = allHistoryEntries.filter((e: any) => {
      const isTextToImage = e.generationType === 'text-to-image';
      const isCompleted = e.status === 'completed';
      const hasImages = Array.isArray(e.images) && e.images.length > 0;
      const passes = isTextToImage && isCompleted && hasImages;
      
      if (!passes && isTextToImage) {
        console.log('[EditImage] Entry filtered out:', {
          id: e.id,
          status: e.status,
          hasImages: hasImages,
          imagesCount: Array.isArray(e.images) ? e.images.length : 0,
        });
      }
      
      return passes;
    });
    
    console.log('[EditImage] Filtered history entries result:', {
      filteredCount: filtered.length,
      rawCount: allHistoryEntries.length,
    });
    
    return filtered;
  }, [allHistoryEntries, historyFilters]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTabChangeRef = useRef<string | null>(null);

  // Initialize from query params: feature and image + self-managed history load for library images
  // Use forceInitial to bypass cache on mount
  const { refreshImmediate: refreshHistoryImmediate } = useHistoryLoader({ 
    generationType: 'text-to-image', 
    initialLimit: 30,
    forceInitial: true, // Force initial load, bypass cache
  });
  
  // Load history when upload modal opens - ALWAYS make fresh API call
  const modalOpenedRef = useRef(false);
  useEffect(() => {
    if (isUploadOpen && !modalOpenedRef.current) {
      modalOpenedRef.current = true;
      // Always make fresh API call when modal opens
      refreshHistoryImmediate(30, true);
    } else if (!isUploadOpen) {
      modalOpenedRef.current = false;
    }
  }, [isUploadOpen, refreshHistoryImmediate]);
  
  // Log history entries when they change (for debugging)
  useEffect(() => {
    console.log('[EditImage] History state changed:', {
      allHistoryEntriesCount: allHistoryEntries.length,
      filteredHistoryEntriesCount: historyEntries.length,
      loading: historyLoading,
      hasMore: historyHasMore,
      filters: historyFilters,
      error: historyError,
      isModalOpen: isUploadOpen,
    });
    
    if (isUploadOpen && historyEntries.length > 0) {
      console.log('[EditImage] Sample history entries (first 3):', historyEntries.slice(0, 3).map((e: any) => ({
        id: e.id,
        generationType: e.generationType,
        status: e.status,
        imagesCount: Array.isArray(e.images) ? e.images.length : 0,
        firstImageUrl: e.images?.[0]?.url?.substring(0, 50) + '...',
      })));
    }
  }, [allHistoryEntries.length, historyEntries.length, historyLoading, historyHasMore, historyFilters, historyError, isUploadOpen]);
  useEffect(() => {
    try {
      // Allow tab selection via query or path (for /edit-image/fill)
      const featureParam = (searchParams?.get('feature') || '').toLowerCase() || (typeof window !== 'undefined' && window.location.pathname.includes('/edit-image/fill') ? 'fill' : '');
      const imageParam = searchParams?.get('image') || '';
      const storagePathParam = searchParams?.get('sp') || '';
      const validFeature = ['upscale', 'remove-bg', 'resize', 'fill', 'vectorize', 'reimagine'].includes(featureParam)
        ? (featureParam as EditFeature)
        : null;
      if (validFeature) {
        setSelectedFeature(validFeature);
        // Set default model based on feature
        if (validFeature === 'remove-bg') {
          setModel('851-labs/background-remover');
        } else if (validFeature === 'upscale') {
          setModel('philz1337x/crystal-upscaler');
        } else if (validFeature === 'resize') {
          setModel('fal-ai/bria/expand');
        } else if (validFeature === 'fill') {
          setModel('fal-ai/bria/genfill' as any);
        } else if (validFeature === 'vectorize') {
          setModel('fal-ai/recraft/vectorize' as any);
        }
        // Prefer raw storage path if provided; use frontend proxy URL for preview rendering
        if (storagePathParam) {
          const decodedPath = decodeURIComponent(storagePathParam).replace(/^\/+/, '');
          const ZATA_PREFIX = (process.env.NEXT_PUBLIC_ZATA_PREFIX || '').replace(/\/$/, '/');
          const directUrl = decodedPath ? `${ZATA_PREFIX}${decodedPath}` : '';
          // Apply to all features so switching tabs preserves the same input
          setInputs({
            'upscale': directUrl,
            'remove-bg': directUrl,
            'resize': directUrl,
            'fill': directUrl,
            'vectorize': directUrl,
            'erase': directUrl,
            'expand': directUrl,
            'reimagine': directUrl,
            'live-chat': directUrl,
          });
        } else if (imageParam && imageParam.trim() !== '') {
          setInputs({
            'upscale': imageParam,
            'remove-bg': imageParam,
            'resize': imageParam,
            'fill': imageParam,
            'vectorize': imageParam,
            'erase': imageParam,
            'expand': imageParam,
            'reimagine': imageParam,
            'live-chat': imageParam,
          });
        }
      } else if (imageParam && imageParam.trim() !== '') {
        // Fallback: if only image provided, attach to current feature
        setInputs({
          'upscale': imageParam,
          'remove-bg': imageParam,
          'resize': imageParam,
          'fill': imageParam,
          'vectorize': imageParam,
          'erase': imageParam,
          'expand': imageParam,
          'reimagine': imageParam,
          'live-chat': imageParam,
        });
      }
    } catch { }
    // Only run once on mount for initial hydration from URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure Bria is the default model when switching to Resize
  useEffect(() => {
    if (selectedFeature === 'resize' && model !== 'fal-ai/bria/expand') {
      setModel('fal-ai/bria/expand');
    }
  }, [selectedFeature]);

  // Ensure Google Nano Banana is the default model when switching to Replace, Erase, or Reimagine
  useEffect(() => {
    if (selectedFeature === 'fill' || selectedFeature === 'erase' || selectedFeature === 'reimagine') {
      // Always use Google Nano Banana for Replace, Erase, and Reimagine features
      if (model !== 'google_nano_banana') {
        setModel('google_nano_banana');
      }
    }
    // Reset reimagine state when switching features
    if (selectedFeature !== 'reimagine') {
      setReimagineSelectionConfirmed(false);
      setReimaginePrompt('');
      setReimagineSelectionBounds(null);
      setReimagineSelectionBounds(null);
      setReimagineLiveBounds(null);
      setReimagineReferenceImage(null);
    }
  }, [selectedFeature, model]);

  // Reimagine State
  const [reimagineReferenceImage, setReimagineReferenceImage] = useState<string | null>(null);

  // Ensure Seedream is the default model when switching to Expand
  useEffect(() => {
    if (selectedFeature === 'expand') {
      // Always use Seedream for Expand feature
      if (model !== 'seedream_4') {
        setModel('seedream_4');
      }
    }
  }, [selectedFeature, model]);

  // Initialize expand bounds when image loads
  useEffect(() => {
    if (selectedFeature === 'expand' && expandOriginalSize.width > 0 && expandOriginalSize.height > 0) {
      // Initialize bounds to original image (no expansion)
      setExpandBounds({ left: 0, top: 0, right: 0, bottom: 0 });
      setExpandCustomWidth(expandOriginalSize.width);
      setExpandCustomHeight(expandOriginalSize.height);
      setExpandEffectiveWidth(expandOriginalSize.width);
      setExpandEffectiveHeight(expandOriginalSize.height);
    }
  }, [selectedFeature, expandOriginalSize]);

  // Helper: normalize requested selection into provider constraints (Seedream: 1024..4096)
  const normalizeExpandDims = useCallback((w: number, h: number) => {
    const MIN = 1024; const MAX = 4096;
    if ((w < MIN || h < MIN) && Math.min(w, h) >= 512) {
      const factor = MIN / Math.min(w, h);
      w = Math.round(w * factor);
      h = Math.round(h * factor);
    }
    w = Math.max(MIN, Math.min(MAX, w));
    h = Math.max(MIN, Math.min(MAX, h));
    const snap = (n: number) => n - (n % 8);
    return { w: snap(w), h: snap(h) };
  }, []);

  // Update expand dimensions when bounds change
  useEffect(() => {
    if (selectedFeature === 'expand' && expandOriginalSize.width > 0 && expandOriginalSize.height > 0) {
      // Calculate cropped region (negative bounds mean cropping)
      const cropLeft = Math.max(0, -expandBounds.left);
      const cropTop = Math.max(0, -expandBounds.top);
      const cropRight = Math.max(0, -expandBounds.right);
      const cropBottom = Math.max(0, -expandBounds.bottom);
      
      // Cropped dimensions
      const croppedWidth = expandOriginalSize.width - cropLeft - cropRight;
      const croppedHeight = expandOriginalSize.height - cropTop - cropBottom;
      
      // Expansion beyond cropped region (positive bounds)
      const expandLeft = Math.max(0, expandBounds.left);
      const expandTop = Math.max(0, expandBounds.top);
      const expandRight = Math.max(0, expandBounds.right);
      const expandBottom = Math.max(0, expandBounds.bottom);
      
      // Final dimensions = cropped region + expansion
      const newWidth = croppedWidth + expandLeft + expandRight;
      const newHeight = croppedHeight + expandTop + expandBottom;
      
      // Round to integers and clamp to valid range (64-4096); allow heights < 1024 when cropping
      const clamp = (v: number) => Math.max(64, Math.min(4096, Math.round(v)));
      const rw = clamp(newWidth);
      const rh = clamp(newHeight);
      setExpandCustomWidth(rw);
      setExpandCustomHeight(rh);
      const eff = normalizeExpandDims(rw, rh);
      setExpandEffectiveWidth(eff.w);
      setExpandEffectiveHeight(eff.h);
    }
  }, [expandBounds, expandOriginalSize, selectedFeature, normalizeExpandDims]);

  // Populate resize fields when switching to resize feature if image is already loaded
  useEffect(() => {
    if (selectedFeature === 'resize' && model === 'fal-ai/bria/expand' && inputNaturalSize.width > 0 && inputNaturalSize.height > 0) {
      // Update original image size to match detected dimensions
      setResizeOrigW(inputNaturalSize.width);
      setResizeOrigH(inputNaturalSize.height);
      // Update canvas size to match detected dimensions
      // This ensures fields are populated when switching to resize feature
      setResizeCanvasW(inputNaturalSize.width);
      setResizeCanvasH(inputNaturalSize.height);
      // Reset margins when entering resize tab
      setExpandLeftPx(0);
      setExpandRightPx(0);
      setExpandTopPx(0);
      setExpandBottomPx(0);
    }
  }, [selectedFeature, model, inputNaturalSize]);

  // Auto-detect input image dimensions and prefill Bria fields
  // Ensure we always know the natural dimensions of the input image so any mask
  // that we export can be scaled to the image's pixel size. This runs whenever
  // inputs change and picks the first available input image across features.
  useEffect(() => {
    const src = inputs.upscale || inputs['remove-bg'] || inputs.resize || inputs.fill || inputs.vectorize || inputs[selectedFeature];
    if (!src) return;
    // Note: we intentionally run this regardless of currently selected feature
    // so mask export (fill/remove-bg) can scale to the true image pixel size.
    (async () => {
      try {
        let measurableSrc = String(src);
        // Make relative paths absolute for Image measurement
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
            // Auto-populate resize fields when resize feature is selected and using Bria Expand
            if (selectedFeature === 'resize' && model === 'fal-ai/bria/expand') {
              // Always update original image size to match input image dimensions
              setResizeOrigW(w);
              setResizeOrigH(h);
              // Always update canvas size to match input image dimensions when a new image is loaded
              // This ensures both fields reflect the current input image dimensions
              setResizeCanvasW(w);
              setResizeCanvasH(h);
              // Reset interactive margins
              setExpandLeftPx(0);
              setExpandRightPx(0);
              setExpandTopPx(0);
              setExpandBottomPx(0);
            }
            try { if (measurableSrc.startsWith('blob:')) URL.revokeObjectURL(measurableSrc); } catch {}
            resolve();
          };
          img.onerror = () => resolve();
          img.src = measurableSrc;
        });
      } catch {}
    })();
  }, [inputs, selectedFeature, model]);

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

  // Debug: Log when outputs change
  useEffect(() => {
    console.log('[EditImage] outputs changed:', { 
      selectedFeature, 
      'remove-bg': outputs['remove-bg'],
      outputs: outputs[selectedFeature],
      allOutputs: outputs 
    });
  }, [outputs, selectedFeature]);

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

  // Hide empty page scrollbar when content doesn't exceed viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflowY = html.style.overflowY;
    const prevBodyOverflowY = body.style.overflowY;

    const update = () => {
      const contentHeight = Math.max(
        body.scrollHeight,
        html.scrollHeight,
        body.offsetHeight,
        html.offsetHeight,
        body.clientHeight,
        html.clientHeight
      );
      const needsScroll = contentHeight > window.innerHeight + 1;
      const val = needsScroll ? 'auto' : 'hidden';
      html.style.overflowY = val;
      body.style.overflowY = val;
    };

    const onResize = () => {
      requestAnimationFrame(update);
    };

    const observer = new MutationObserver(() => requestAnimationFrame(update));
    try {
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    } catch {}

    update();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      try { observer.disconnect(); } catch {}
      html.style.overflowY = prevHtmlOverflowY;
      body.style.overflowY = prevBodyOverflowY;
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
    { id: 'remove-bg', label: 'Remove BG', description: 'Remove background from your image' },
    { id: 'fill', label: 'Replace', description: 'Mask areas to regenerate with a prompt' },
    { id: 'erase', label: 'Erase', description: 'Erase masked areas from the image' },
    // { id: 'expand', label: 'Expand', description: 'Expand image by stretching canvas boundaries' },
    { id: 'resize', label: 'Resize', description: 'Resize image to specific dimensions' },
    { id: 'vectorize', label: 'Vectorize', description: 'Convert raster to SVG vector' },
    { id: 'reimagine', label: 'Reimagine', description: 'Reimagine your image with AI' },
    { id: 'live-chat', label: 'Live Chat', description: 'Chat-driven edits & regenerations' },
  ] as const;

  // Feature preview assets and display labels
  const featurePreviewGif: Record<EditFeature, string> = {
    'upscale': '/editimage/upscale_banner.jpg',
    'remove-bg': '/editimage/RemoveBG_banner.jpg',
    'fill': '/editimage/replace_banner.jpg',
    'erase': '/editimage/replace_banner.jpg',
    'expand': '/editimage/resize_banner.jpg',
    'resize': '/editimage/resize_banner.jpg',
    'vectorize': '/editimage/vector_banner.jpg',
    'reimagine': '/editimage/replace_banner.jpg',
    'live-chat': '/editimage/resize_banner.jpg',
  };
  const featureDisplayName: Record<EditFeature, string> = {
    'upscale': 'Upscale',
    'remove-bg': 'Remove BG',
    'fill': 'Replace',
    'erase': 'Erase',
    'expand': 'Expand',
    'resize': 'Resize',
    'vectorize': 'Vectorize',
    'reimagine': 'Reimagine',
    'live-chat': 'Live Chat',
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = e.target?.result as string;
        // Apply selected image to all features
        setInputs({
          'upscale': img,
          'remove-bg': img,
          'resize': img,
          'fill': img,
          'vectorize': img,
          'erase': img,
          'expand': img,
          'reimagine': img,
          'live-chat': img,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenUploadModal = () => setIsUploadOpen(true);

  // Fill: canvas helpers for mask drawing
  const getCanvasContext = useCallback(() => {
    const c = fillCanvasRef.current;
    if (!c) return null as any;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    // Ensure the transform is set correctly (it should be set in resizeCanvasToContainer)
    // But we verify it's correct here to handle edge cases
    const dpr = window.devicePixelRatio || 1;
    const currentTransform = ctx.getTransform();
    // Only reset if transform is clearly wrong (identity matrix when it shouldn't be)
    // We check if scale is 1 when DPR > 1, which would indicate transform wasn't applied
    if (dpr > 1 && currentTransform.a === 1 && currentTransform.d === 1) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    return ctx;
  }, []);

  const resizeCanvasToContainer = useCallback(() => {
    const container = fillContainerRef.current;
    const canvas = fillCanvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Save existing canvas content if there's a mask
    let savedDataUrl: string | null = null;
    if (hasMask) {
      try {
        savedDataUrl = canvas.toDataURL('image/png');
      } catch (e) {
        // If toDataURL fails, continue without saving
      }
    }
    
    const oldWidth = canvas.width / dpr;
    const oldHeight = canvas.height / dpr;
    const newWidth = Math.floor(rect.width * dpr);
    const newHeight = Math.floor(rect.height * dpr);
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    const newCtx = getCanvasContext();
    if (newCtx) {
      newCtx.setTransform(1, 0, 0, 1, 0, 0);
      newCtx.scale(dpr, dpr);
      
      // Ensure canvas is transparent
      newCtx.clearRect(0, 0, rect.width, rect.height);
      
      // Restore saved content if it exists
      if (savedDataUrl) {
        const img = document.createElement('img');
        img.onload = () => {
          const currentCtx = fillCanvasRef.current?.getContext('2d');
          if (currentCtx) {
            currentCtx.setTransform(1, 0, 0, 1, 0, 0);
            currentCtx.scale(dpr, dpr);
            currentCtx.clearRect(0, 0, rect.width, rect.height);
            currentCtx.drawImage(img, 0, 0, rect.width, rect.height);
          }
        };
        img.src = savedDataUrl;
      } else {
        // No mask to preserve, ensure canvas is transparent
        newCtx.clearRect(0, 0, rect.width, rect.height);
        setHasMask(false);
      }
    }
  }, [getCanvasContext, hasMask]);

  useEffect(() => {
    if (selectedFeature !== 'fill' && selectedFeature !== 'erase' && selectedFeature !== 'reimagine') return;
    const onResize = () => resizeCanvasToContainer();
    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      resizeCanvasToContainer();
    }, 0);
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', onResize);
    };
  }, [selectedFeature, resizeCanvasToContainer]);

  // Recreate canvas when image changes on Fill or Erase or Reimagine
  useEffect(() => {
    if (selectedFeature !== 'fill' && selectedFeature !== 'erase' && selectedFeature !== 'reimagine') return;
    // Use setTimeout to ensure DOM is ready after image loads
    const timeoutId = setTimeout(() => {
      resizeCanvasToContainer();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [inputs.fill, inputs.erase, inputs.reimagine, selectedFeature, resizeCanvasToContainer]);

  const beginMaskStroke = useCallback((x: number, y: number) => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = eraseMode ? 'destination-out' : 'source-over';
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsMasking(true);
    setHasMask(true);
  }, [brushSize, eraseMode, getCanvasContext]);

  const continueMaskStroke = useCallback((x: number, y: number) => {
    if (!isMasking) return;
    const ctx = getCanvasContext();
    if (!ctx) return;
    
    // The context is already scaled by DPR, so we use brushSize directly
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = eraseMode ? 'destination-out' : 'source-over';
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    
    // Continue the existing path - this creates a smooth continuous line
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Draw a filled circle at the current point to ensure complete coverage
    // This prevents gaps when moving the mouse quickly
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Continue the path from current point (don't start a new path)
    // This ensures smooth continuous strokes
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasMask(true);
    
    // For reimagine: Update live bounds in real-time for visual feedback
    if (selectedFeature === 'reimagine') {
      requestAnimationFrame(() => {
        const canvas = fillCanvasRef.current;
        if (canvas) {
          const ctx2 = canvas.getContext('2d');
          if (ctx2) {
            const imageData = ctx2.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
            let found = false;
            
            for (let y = 0; y < canvas.height; y++) {
              for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];
                if (a > 128 && r > 200 && g > 200 && b > 200) {
                  found = true;
                  minX = Math.min(minX, x);
                  minY = Math.min(minY, y);
                  maxX = Math.max(maxX, x);
                  maxY = Math.max(maxY, y);
                }
              }
            }
            
            if (found) {
              const container = fillContainerRef.current;
              if (container) {
                const rect = container.getBoundingClientRect();
                const scaleX = rect.width / canvas.width;
                const scaleY = rect.height / canvas.height;
                setReimagineLiveBounds({
                  x: minX * scaleX,
                  y: minY * scaleY,
                  width: (maxX - minX) * scaleX,
                  height: (maxY - minY) * scaleY
                });
              }
            }
          }
        }
      });
    }
  }, [isMasking, brushSize, eraseMode, getCanvasContext, selectedFeature]);

  const endMaskStroke = useCallback(() => {
    if (!isMasking) return;
    const ctx = getCanvasContext();
    if (ctx) ctx.closePath();
    setIsMasking(false);
    
    // For reimagine: Calculate selection bounds when stroke ends
    if (selectedFeature === 'reimagine' && hasMask) {
      const canvas = fillCanvasRef.current;
      if (canvas) {
        const ctx2 = canvas.getContext('2d');
        if (ctx2) {
          const imageData = ctx2.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
          let found = false;
          
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const idx = (y * canvas.width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const a = data[idx + 3];
              if (a > 128 && r > 200 && g > 200 && b > 200) {
                found = true;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
          }
          
          if (found) {
            const container = fillContainerRef.current;
            if (container) {
              const rect = container.getBoundingClientRect();
              const scaleX = rect.width / canvas.width;
              const scaleY = rect.height / canvas.height;
              setReimagineSelectionBounds({
                x: minX * scaleX,
                y: minY * scaleY,
                width: (maxX - minX) * scaleX,
                height: (maxY - minY) * scaleY
              });
            }
          }
        }
      }
    }
  }, [isMasking, getCanvasContext, selectedFeature, hasMask]);

  // Expand: Canvas helpers for interactive expansion
  const getExpandCanvasContext = useCallback(() => {
    const c = expandCanvasRef.current;
    if (!c) return null as any;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    return ctx;
  }, []);

  const drawExpandCanvas = useCallback(() => {
    if (selectedFeature !== 'expand') return;
    const ctx = getExpandCanvasContext();
    if (!ctx) return;
    const container = expandContainerRef.current;
    if (!container || expandOriginalSize.width === 0 || expandOriginalSize.height === 0) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const canvas = expandCanvasRef.current;
    if (!canvas) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    // Reset any previous transform before scaling. Without this the scale accumulated
    // on repeated draws, causing incorrect handle hit detection (especially vertically).
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    // Get actual rendered image size from the Image element (object-contain)
    // The image is rendered with object-contain, so we need to calculate its actual display size
    const imgAspect = expandOriginalSize.width / expandOriginalSize.height;
    const containerAspect = rect.width / rect.height;
    let imgDisplayW, imgDisplayH, imgDisplayX, imgDisplayY;
    
    // Calculate the same way object-contain does: fit image within container while maintaining aspect ratio
    if (imgAspect > containerAspect) {
      // Image is wider than container - fit to width
      imgDisplayW = rect.width;
      imgDisplayH = imgDisplayW / imgAspect;
    } else {
      // Image is taller than container - fit to height
      imgDisplayH = rect.height;
      imgDisplayW = imgDisplayH * imgAspect;
    }
    // Center the image
    imgDisplayX = (rect.width - imgDisplayW) / 2;
    imgDisplayY = (rect.height - imgDisplayH) / 2;

    // Calculate expansion bounds in display coordinates
    const maxWidth = 4096;
    const maxHeight = 4096;
    const maxDisplayW = (imgDisplayW / expandOriginalSize.width) * maxWidth;
    const maxDisplayH = (imgDisplayH / expandOriginalSize.height) * maxHeight;
    const maxDisplayX = imgDisplayX - (maxDisplayW - imgDisplayW) / 2;
    const maxDisplayY = imgDisplayY - (maxDisplayH - imgDisplayH) / 2;

    // Calculate cropped region (negative bounds = crop, positive = expand)
    const cropLeft = Math.max(0, -expandBounds.left);
    const cropTop = Math.max(0, -expandBounds.top);
    const cropRight = Math.max(0, -expandBounds.right);
    const cropBottom = Math.max(0, -expandBounds.bottom);
    
    // Expansion beyond cropped region (positive bounds)
    const expandLeft = Math.max(0, expandBounds.left);
    const expandTop = Math.max(0, expandBounds.top);
    const expandRight = Math.max(0, expandBounds.right);
    const expandBottom = Math.max(0, expandBounds.bottom);
    
    // Convert to display coordinates
    const cropLeftDisplay = (cropLeft / expandOriginalSize.width) * imgDisplayW;
    const cropTopDisplay = (cropTop / expandOriginalSize.height) * imgDisplayH;
    const cropRightDisplay = (cropRight / expandOriginalSize.width) * imgDisplayW;
    const cropBottomDisplay = (cropBottom / expandOriginalSize.height) * imgDisplayH;
    
    const expandLeftDisplay = (expandLeft / expandOriginalSize.width) * imgDisplayW;
    const expandRightDisplay = (expandRight / expandOriginalSize.width) * imgDisplayW;
    const expandTopDisplay = (expandTop / expandOriginalSize.height) * imgDisplayH;
    const expandBottomDisplay = (expandBottom / expandOriginalSize.height) * imgDisplayH;

    // White border position (cropped region + expansion)
    const currentDisplayX = imgDisplayX + cropLeftDisplay - expandLeftDisplay;
    const currentDisplayY = imgDisplayY + cropTopDisplay - expandTopDisplay;
    const croppedDisplayW = imgDisplayW - cropLeftDisplay - cropRightDisplay;
    const croppedDisplayH = imgDisplayH - cropTopDisplay - cropBottomDisplay;
    const currentDisplayW = croppedDisplayW + expandLeftDisplay + expandRightDisplay;
    const currentDisplayH = croppedDisplayH + expandTopDisplay + expandBottomDisplay;

    // Draw green border (max limits)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(maxDisplayX, maxDisplayY, maxDisplayW, maxDisplayH);

    // Draw black border (original image)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(imgDisplayX, imgDisplayY, imgDisplayW, imgDisplayH);

    // Draw current expansion border (dotted)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(currentDisplayX, currentDisplayY, currentDisplayW, currentDisplayH);

    // Draw resize handles (small squares on edges)
    const handleSize = 8;
    ctx.fillStyle = '#22c55e';
    ctx.setLineDash([]);
    
    // Top handle
    ctx.fillRect(currentDisplayX + currentDisplayW / 2 - handleSize / 2, currentDisplayY - handleSize / 2, handleSize, handleSize);
    // Bottom handle
    ctx.fillRect(currentDisplayX + currentDisplayW / 2 - handleSize / 2, currentDisplayY + currentDisplayH - handleSize / 2, handleSize, handleSize);
    // Left handle
    ctx.fillRect(currentDisplayX - handleSize / 2, currentDisplayY + currentDisplayH / 2 - handleSize / 2, handleSize, handleSize);
    // Right handle
    ctx.fillRect(currentDisplayX + currentDisplayW - handleSize / 2, currentDisplayY + currentDisplayH / 2 - handleSize / 2, handleSize, handleSize);
  }, [selectedFeature, expandOriginalSize, expandBounds, getExpandCanvasContext]);

  // Redraw canvas when bounds or image changes
  useEffect(() => {
    if (selectedFeature === 'expand') {
      drawExpandCanvas();
      const handleResize = () => drawExpandCanvas();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [selectedFeature, expandBounds, expandOriginalSize, drawExpandCanvas]);

  const getExpandHandle = (x: number, y: number): string | null => {
    const container = expandContainerRef.current;
    if (!container || expandOriginalSize.width === 0 || expandOriginalSize.height === 0) return null;

    const rect = container.getBoundingClientRect();
    const imgAspect = expandOriginalSize.width / expandOriginalSize.height;
    const containerAspect = rect.width / rect.height;
    let imgDisplayW, imgDisplayH, imgDisplayX, imgDisplayY;
    
    // Use same calculation as drawExpandCanvas (object-contain sizing)
    if (imgAspect > containerAspect) {
      imgDisplayW = rect.width;
      imgDisplayH = imgDisplayW / imgAspect;
    } else {
      imgDisplayH = rect.height;
      imgDisplayW = imgDisplayH * imgAspect;
    }
    imgDisplayX = (rect.width - imgDisplayW) / 2;
    imgDisplayY = (rect.height - imgDisplayH) / 2;

    // Calculate cropped region (negative bounds = crop, positive = expand)
    const cropLeft = Math.max(0, -expandBounds.left);
    const cropTop = Math.max(0, -expandBounds.top);
    const cropRight = Math.max(0, -expandBounds.right);
    const cropBottom = Math.max(0, -expandBounds.bottom);
    
    // Expansion beyond cropped region (positive bounds)
    const expandLeft = Math.max(0, expandBounds.left);
    const expandTop = Math.max(0, expandBounds.top);
    const expandRight = Math.max(0, expandBounds.right);
    const expandBottom = Math.max(0, expandBounds.bottom);
    
    // Convert to display coordinates
    const cropLeftDisplay = (cropLeft / expandOriginalSize.width) * imgDisplayW;
    const cropTopDisplay = (cropTop / expandOriginalSize.height) * imgDisplayH;
    const cropRightDisplay = (cropRight / expandOriginalSize.width) * imgDisplayW;
    const cropBottomDisplay = (cropBottom / expandOriginalSize.height) * imgDisplayH;
    
    const expandLeftDisplay = (expandLeft / expandOriginalSize.width) * imgDisplayW;
    const expandRightDisplay = (expandRight / expandOriginalSize.width) * imgDisplayW;
    const expandTopDisplay = (expandTop / expandOriginalSize.height) * imgDisplayH;
    const expandBottomDisplay = (expandBottom / expandOriginalSize.height) * imgDisplayH;

    // White border position (cropped region + expansion)
    const currentDisplayX = imgDisplayX + cropLeftDisplay - expandLeftDisplay;
    const currentDisplayY = imgDisplayY + cropTopDisplay - expandTopDisplay;
    const croppedDisplayW = imgDisplayW - cropLeftDisplay - cropRightDisplay;
    const croppedDisplayH = imgDisplayH - cropTopDisplay - cropBottomDisplay;
    const currentDisplayW = croppedDisplayW + expandLeftDisplay + expandRightDisplay;
    const currentDisplayH = croppedDisplayH + expandTopDisplay + expandBottomDisplay;

    const threshold = 10; // px distance for grabbing near an edge anywhere along it

    // Edge hit-tests along the full length
    const nearTop = Math.abs(y - currentDisplayY) <= threshold && x >= currentDisplayX - threshold && x <= currentDisplayX + currentDisplayW + threshold;
    if (nearTop) return 'top';
    const nearBottom = Math.abs(y - (currentDisplayY + currentDisplayH)) <= threshold && x >= currentDisplayX - threshold && x <= currentDisplayX + currentDisplayW + threshold;
    if (nearBottom) return 'bottom';
    const nearLeft = Math.abs(x - currentDisplayX) <= threshold && y >= currentDisplayY - threshold && y <= currentDisplayY + currentDisplayH + threshold;
    if (nearLeft) return 'left';
    const nearRight = Math.abs(x - (currentDisplayX + currentDisplayW)) <= threshold && y >= currentDisplayY - threshold && y <= currentDisplayY + currentDisplayH + threshold;
    if (nearRight) return 'right';

    // If inside but not near edge, consider a move hit-test
    if (x >= currentDisplayX && x <= currentDisplayX + currentDisplayW && y >= currentDisplayY && y <= currentDisplayY + currentDisplayH) {
      return 'move';
    }

    return null;
  };

  const handleExpandMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedFeature !== 'expand' || expandOriginalSize.width === 0) return;
    const rect = expandContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const handle = getExpandHandle(x, y);
    
    if (handle && handle !== 'move') {
      setExpandResizing(handle);
      e.preventDefault();
      dragStartRef.current = { x, y, l: expandBounds.left, r: expandBounds.right, t: expandBounds.top, b: expandBounds.bottom };
    } else if (handle === 'move') {
      // Allow moving the entire rectangle: click inside current display region (not on a handle)
      // Recompute current display rectangle similarly to drawExpandCanvas for hit testing.
      const container = expandContainerRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const imgAspect = expandOriginalSize.width / expandOriginalSize.height;
      const containerAspect = cRect.width / cRect.height;
      let imgDisplayW: number, imgDisplayH: number, imgDisplayX: number, imgDisplayY: number;
      if (imgAspect > containerAspect) {
        imgDisplayW = cRect.width;
        imgDisplayH = imgDisplayW / imgAspect;
      } else {
        imgDisplayH = cRect.height;
        imgDisplayW = imgDisplayH * imgAspect;
      }
      imgDisplayX = (cRect.width - imgDisplayW) / 2;
      imgDisplayY = (cRect.height - imgDisplayH) / 2;
      // Derive current display rect from bounds
      const cropLeft = Math.max(0, -expandBounds.left);
      const cropTop = Math.max(0, -expandBounds.top);
      const cropRight = Math.max(0, -expandBounds.right);
      const cropBottom = Math.max(0, -expandBounds.bottom);
      const expandLeft = Math.max(0, expandBounds.left);
      const expandTop = Math.max(0, expandBounds.top);
      const expandRight = Math.max(0, expandBounds.right);
      const expandBottom = Math.max(0, expandBounds.bottom);
      const cropLeftDisplay = (cropLeft / expandOriginalSize.width) * imgDisplayW;
      const cropTopDisplay = (cropTop / expandOriginalSize.height) * imgDisplayH;
      const expandLeftDisplay = (expandLeft / expandOriginalSize.width) * imgDisplayW;
      const expandTopDisplay = (expandTop / expandOriginalSize.height) * imgDisplayH;
      const croppedDisplayW = imgDisplayW - cropLeftDisplay - (cropRight / expandOriginalSize.width) * imgDisplayW;
      const croppedDisplayH = imgDisplayH - cropTopDisplay - (cropBottom / expandOriginalSize.height) * imgDisplayH;
      const currentDisplayX = imgDisplayX + cropLeftDisplay - expandLeftDisplay;
      const currentDisplayY = imgDisplayY + cropTopDisplay - expandTopDisplay;
      const currentDisplayW = croppedDisplayW + (expandLeft / expandOriginalSize.width) * imgDisplayW + (expandRight / expandOriginalSize.width) * imgDisplayW;
      const currentDisplayH = croppedDisplayH + (expandTop / expandOriginalSize.height) * imgDisplayH + (expandBottom / expandOriginalSize.height) * imgDisplayH;
      if (x >= currentDisplayX && x <= currentDisplayX + currentDisplayW && y >= currentDisplayY && y <= currentDisplayY + currentDisplayH) {
        setExpandResizing('move');
        dragStartRef.current = { x, y, l: expandBounds.left, r: expandBounds.right, t: expandBounds.top, b: expandBounds.bottom };
        e.preventDefault();
      }
    }
  };

  const handleExpandMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedFeature !== 'expand' || expandOriginalSize.width === 0) return;
    const rect = expandContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate image display size (same as drawExpandCanvas - object-contain sizing)
    const imgAspect = expandOriginalSize.width / expandOriginalSize.height;
    const containerAspect = rect.width / rect.height;
    let imgDisplayW, imgDisplayH, imgDisplayX, imgDisplayY;
    
    if (imgAspect > containerAspect) {
      imgDisplayW = rect.width;
      imgDisplayH = imgDisplayW / imgAspect;
    } else {
      imgDisplayH = rect.height;
      imgDisplayW = imgDisplayH * imgAspect;
    }
    imgDisplayX = (rect.width - imgDisplayW) / 2;
    imgDisplayY = (rect.height - imgDisplayH) / 2;

    // Convert display coordinates to image coordinates
    const scaleX = expandOriginalSize.width / imgDisplayW;
    const scaleY = expandOriginalSize.height / imgDisplayH;

    const maxWidth = 4096;
    const maxHeight = 4096;

    // Hover-only cursor feedback
    if (!expandResizing) {
      const h = getExpandHandle(x, y);
      setExpandHoverEdge(h);
      return;
    }

    if (expandResizing === 'move' && dragStartRef.current) {
      // Move the rectangle without changing its size. Translate all four bounds.
      const start = dragStartRef.current;
      const dxDisplay = x - start.x;
      const dyDisplay = y - start.y;
      const scaleX = expandOriginalSize.width / imgDisplayW;
      const scaleY = expandOriginalSize.height / imgDisplayH;
      const dxImage = dxDisplay * scaleX;
      const dyImage = dyDisplay * scaleY;
      setExpandBounds({
        left: start.l + dxImage,
        right: start.r + dxImage,
        top: start.t + dyImage,
        bottom: start.b + dyImage,
      });
      return; // handled
    }

    setExpandBounds(prev => {
      let newLeft = prev.left;
      let newRight = prev.right;
      let newTop = prev.top;
      let newBottom = prev.bottom;

      if (expandResizing === 'left') {
        // Positive = expand outward to the left, Negative = crop from left
        const delta = (imgDisplayX - x) * scaleX;
        newLeft = Math.max(-expandOriginalSize.width + 1, Math.min(maxWidth - expandOriginalSize.width, delta));
      } else if (expandResizing === 'right') {
        // Positive = expand outward to the right, Negative = crop from right
        const delta = (x - (imgDisplayX + imgDisplayW)) * scaleX;
        newRight = Math.max(-expandOriginalSize.width + 1, Math.min(maxWidth - expandOriginalSize.width, delta));
      } else if (expandResizing === 'top') {
        // Positive = expand upward, Negative = crop from top
        const delta = (imgDisplayY - y) * scaleY;
        newTop = Math.max(-expandOriginalSize.height + 1, Math.min(maxHeight - expandOriginalSize.height, delta));
      } else if (expandResizing === 'bottom') {
        // Positive = expand downward, Negative = crop from bottom
        const delta = (y - (imgDisplayY + imgDisplayH)) * scaleY;
        newBottom = Math.max(-expandOriginalSize.height + 1, Math.min(maxHeight - expandOriginalSize.height, delta));
      }

      // Ensure we don't crop more than the image size
      const newCropLeft = Math.max(0, -newLeft);
      const newCropTop = Math.max(0, -newTop);
      const newCropRight = Math.max(0, -newRight);
      const newCropBottom = Math.max(0, -newBottom);
      
      if (newCropLeft + newCropRight >= expandOriginalSize.width) {
        if (expandResizing === 'left') newLeft = prev.left;
        if (expandResizing === 'right') newRight = prev.right;
      }
      if (newCropTop + newCropBottom >= expandOriginalSize.height) {
        if (expandResizing === 'top') newTop = prev.top;
        if (expandResizing === 'bottom') newBottom = prev.bottom;
      }

      return { left: newLeft, top: newTop, right: newRight, bottom: newBottom };
    });
  };

  const handleExpandMouseUp = () => {
    setExpandResizing(null);
    setExpandHoverEdge(null);
  };

  const pointFromMouseEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = fillCanvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    // The context is already scaled by DPR in resizeCanvasToContainer,
    // so we use display coordinates directly
    return { 
      x: e.clientX - r.left, 
      y: e.clientY - r.top 
    };
  };

  const pointFromTouchEvent = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const c = fillCanvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return { x: 0, y: 0 };
    // The context is already scaled by DPR in resizeCanvasToContainer,
    // so we use display coordinates directly
    return { 
      x: touch.clientX - r.left, 
      y: touch.clientY - r.top 
    };
  };

  const handleRun = async () => {
    const toAbsoluteProxyUrl = (url: string | null | undefined) => {
      if (!url) return url as any;
      if (url.startsWith('data:')) return url as any;
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
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
      // If the image is stored on Zata (or another known storage served via
      // the `/api/proxy/download/:path` backend route), fetch via our proxy
      // so we avoid cross-origin/read restrictions, then convert to data URI.
      try {
        const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
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
        }
      } catch (e) {
        // ignore and continue
      }

      // Last resort: try a direct fetch (may fail due to CORS). If it fails,
      // return the original src so existing behavior remains.
      return src;
    };

    const currentInputRaw = inputs[selectedFeature];
    const currentInput = toAbsoluteProxyUrl(currentInputRaw) as any;
    if (!currentInput) return;
    setErrorMsg('');
    setOutputs((prev) => ({ ...prev, [selectedFeature]: null }));
    setProcessing((prev) => ({ ...prev, [selectedFeature]: true }));
    try {
      const normalizedInput = currentInputRaw ? await toDataUriIfLocal(String(currentInputRaw)) : '';
      const isPublic = await getIsPublic();
      if (selectedFeature === 'vectorize') {
        const img = inputs[selectedFeature];
        if (!img) throw new Error('Please upload an image to vectorize');
        
        let vectorizeInput = normalizedInput;
        let vectorizeInputUrl = currentInput;
        
        // Super mode: First convert image to 2D vector using Seedream
        if (vectorizeSuperMode) {
          try {
            // Step 1: Use Seedream to convert image to 2D vector
            const seedreamPayload: any = {
              prompt: 'convert into 2D vector image',
              model: 'bytedance/seedream-4',
              size: '2K',
              image_input: [String(normalizedInput).startsWith('data:') ? normalizedInput : currentInput],
              sequential_image_generation: 'disabled',
              max_images: 1,
              isPublic: false, // Intermediate step, don't make public
            };
            
            const seedreamRes = await axiosInstance.post('/api/replicate/generate', seedreamPayload);
            const seedreamOut = seedreamRes?.data?.images?.[0]?.url || seedreamRes?.data?.data?.images?.[0]?.url || seedreamRes?.data?.data?.url || seedreamRes?.data?.url || '';
            
            if (!seedreamOut) {
              throw new Error('Seedream conversion failed. Please try again.');
            }
            
            // Step 2: Use the Seedream output as input for vectorization
            // Convert to data URI if needed for vectorize API
            try {
              const seedreamNormalized = await toDataUriIfLocal(seedreamOut);
              vectorizeInput = seedreamNormalized;
              vectorizeInputUrl = seedreamOut;
            } catch {
              // If conversion fails, use URL directly
              vectorizeInputUrl = seedreamOut;
            }
          } catch (seedreamError: any) {
            console.error('[EditImage] Seedream conversion error:', seedreamError);
            const errorMsg = seedreamError?.response?.data?.message || seedreamError?.message || 'Seedream conversion failed';
            throw new Error(`Super mode failed: ${errorMsg}`);
          }
        }
        
        // Step 3: Vectorize the image (either original or Seedream output)
        if (vectorizeModel === 'fal-ai/recraft/vectorize') {
          const body: any = { isPublic };
          if (String(vectorizeInput).startsWith('data:')) body.image = vectorizeInput;
          else body.image_url = vectorizeInputUrl;
          const res = await axiosInstance.post('/api/fal/recraft/vectorize', body);
          const out = res?.data?.data?.images?.[0]?.url || res?.data?.images?.[0]?.url || res?.data?.data?.image?.url || res?.data?.data?.url || res?.data?.url || '';
          if (out) setOutputs((prev) => ({ ...prev, ['vectorize']: out }));
          try { setCurrentHistoryId(res?.data?.data?.historyId || res?.data?.historyId || null); } catch { }
          // Refresh global history so the Image Generation page sees the new vectorize entry immediately.
          // Omit generationType & expectedType so the thunk is not aborted while user is on edit-image view.
          try {
            await (dispatch as any)(loadHistory({
              paginationParams: { limit: 60 },
              requestOrigin: 'page',
              debugTag: `refresh-after-vectorize:${Date.now()}`,
            }));
          } catch {}
        } else {
          // fal-ai/image2svg
          const body: any = {
            isPublic,
            colormode: vColorMode,
            hierarchical: vHierarchical,
            mode: vMode,
            filter_speckle: vFilterSpeckle,
            color_precision: vColorPrecision,
            layer_difference: vLayerDifference,
            corner_threshold: vCornerThreshold,
            length_threshold: vLengthThreshold,
            max_iterations: vMaxIterations,
            splice_threshold: vSpliceThreshold,
            path_precision: vPathPrecision,
          };
          if (String(vectorizeInput).startsWith('data:')) body.image = vectorizeInput; else body.image_url = vectorizeInputUrl;
          const res = await axiosInstance.post('/api/fal/image2svg', body);
          const out = res?.data?.data?.images?.[0]?.url || res?.data?.images?.[0]?.url || res?.data?.data?.image?.url || res?.data?.data?.url || res?.data?.url || '';
          if (out) setOutputs((prev) => ({ ...prev, ['vectorize']: out }));
          try { setCurrentHistoryId(res?.data?.data?.historyId || res?.data?.historyId || null); } catch { }
          // Refresh global history so the Image Generation page sees the new vectorize entry immediately.
          // Omit generationType & expectedType so the thunk is not aborted while user is on edit-image view.
          try {
            await (dispatch as any)(loadHistory({
              paginationParams: { limit: 60 },
              requestOrigin: 'page',
              debugTag: `refresh-after-vectorize:${Date.now()}`,
            }));
          } catch {}
        }
        return;
      }
      if (selectedFeature === 'expand') {
        const img = inputs[selectedFeature];
        if (!img) throw new Error('Please upload an image to expand');
        if (expandOriginalSize.width === 0 || expandOriginalSize.height === 0) {
          throw new Error('Image dimensions not detected. Please wait for image to load.');
        }
        
        // Calculate cropped region (negative bounds = crop, positive = expand)
        const cropLeft = Math.max(0, -expandBounds.left);
        const cropTop = Math.max(0, -expandBounds.top);
        const cropRight = Math.max(0, -expandBounds.right);
        const cropBottom = Math.max(0, -expandBounds.bottom);
        
        // Cropped dimensions
        const croppedWidth = expandOriginalSize.width - cropLeft - cropRight;
        const croppedHeight = expandOriginalSize.height - cropTop - cropBottom;
        
        // Expansion beyond cropped region (positive bounds)
        const expandLeft = Math.max(0, expandBounds.left);
        const expandTop = Math.max(0, expandBounds.top);
        const expandRight = Math.max(0, expandBounds.right);
        const expandBottom = Math.max(0, expandBounds.bottom);
        
  // Final dimensions = cropped region + expansion (raw selection)
  const rawWidth = croppedWidth + expandLeft + expandRight;
  const rawHeight = croppedHeight + expandTop + expandBottom;
  const roundTo8 = (n: number) => Math.max(64, Math.min(4096, Math.round(n / 8) * 8));
  const finalWidth = roundTo8(rawWidth);
  const finalHeight = roundTo8(rawHeight);
        
        // Crop the image if needed (if there's any cropping)
        let croppedImageDataUri = normalizedInput;
        if (cropLeft > 0 || cropTop > 0 || cropRight > 0 || cropBottom > 0) {
          // Create a canvas to crop the image
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = croppedWidth;
          cropCanvas.height = croppedHeight;
          const cropCtx = cropCanvas.getContext('2d');
          if (cropCtx) {
            const sourceImg = document.createElement('img');
            sourceImg.crossOrigin = 'anonymous';
            await new Promise<void>((resolve, reject) => {
              sourceImg.onload = () => {
                try {
                  // Draw the cropped region
                  cropCtx.drawImage(
                    sourceImg,
                    cropLeft, cropTop, croppedWidth, croppedHeight, // Source region
                    0, 0, croppedWidth, croppedHeight // Destination
                  );
                  croppedImageDataUri = cropCanvas.toDataURL('image/png');
                  resolve();
                } catch (err) {
                  reject(err);
                }
              };
              sourceImg.onerror = reject;
              if (String(normalizedInput).startsWith('data:')) {
                sourceImg.src = normalizedInput;
              } else {
                sourceImg.src = currentInput || String(img);
              }
            });
          }
        }
        
        // Use cropped image (data URI) or currentInput (URL) for image_input
        // Backend will handle uploading data URIs to Zata
        const imageInput = String(croppedImageDataUri).startsWith('data:') ? croppedImageDataUri : (currentInput || String(img));
        
        // Provider normalization (shared helper)
        const providerDims = normalizeExpandDims(finalWidth, finalHeight);

        const buildPayload = (w: number, h: number) => ({
          prompt: 'Expand image likewise',
          model: 'bytedance/seedream-4',
          size: 'custom',
          width: w,
          height: h,
          image_input: [imageInput],
          sequential_image_generation: 'disabled',
          max_images: 1,
          isPublic,
        });

        let res;
        try {
          res = await axiosInstance.post('/api/replicate/generate', buildPayload(providerDims.w, providerDims.h));
        } catch (err: any) {
          const msg = String(err?.response?.data?.message || '');
          if (/1024-4096/i.test(msg)) {
            // Fallback: force both dimensions to MIN keeping aspect
            const aspect = finalWidth / finalHeight || 1;
            let w = 1024, h = 1024;
            if (aspect > 1) { w = 1024; h = Math.round(1024 / aspect); } else { h = 1024; w = Math.round(1024 * aspect); }
            const fixed = normalizeExpandDims(w, h);
            res = await axiosInstance.post('/api/replicate/generate', buildPayload(fixed.w, fixed.h));
          } else {
            throw err;
          }
        }
        const out = res?.data?.images?.[0]?.url || res?.data?.data?.images?.[0]?.url || res?.data?.data?.url || res?.data?.url || '';
        if (out) setOutputs((prev) => ({ ...prev, ['expand']: out }));
        try { setCurrentHistoryId(res?.data?.data?.historyId || res?.data?.historyId || null); } catch { }
        return;
      }
      if (selectedFeature === 'fill' || selectedFeature === 'erase') {
        const img = inputs[selectedFeature];
        if (!img) throw new Error(`Please upload an image for ${selectedFeature === 'fill' ? 'fill' : selectedFeature === 'erase' ? 'erase' : 'reimagine'}`);
        
        // For fill, prompt is required; for erase, we use hardcoded prompt
        if (selectedFeature === 'fill' && (!prompt || !prompt.trim())) {
          setErrorMsg('Please enter a prompt for fill');
          setProcessing((prev) => ({ ...prev, [selectedFeature]: false }));
          return;
        }
        // Export mask as PNG data URI and ensure its pixel size matches the
        // actual input image dimensions (FAL requires mask and image to have
        // identical width/height). This may involve fetching the image to
        // read its natural size and rescaling the mask accordingly.
        let maskDataUrl: string | undefined;
        {
          const c = fillCanvasRef.current;
          if (!c) return;
          if (!hasMask) {
            setErrorMsg('Please draw a mask on the image to specify the area to replace');
            setProcessing((prev) => ({ ...prev, ['fill']: false }));
            return;
          }
          try {
            const off = document.createElement('canvas');
            const dispRect = fillContainerRef.current?.getBoundingClientRect();
            const displayW = Math.max(1, Math.floor(dispRect?.width || c.width));
            const displayH = Math.max(1, Math.floor(dispRect?.height || c.height));
            const natW = Math.max(1, Math.floor(inputNaturalSize.width || displayW));
            const natH = Math.max(1, Math.floor(inputNaturalSize.height || displayH));
            off.width = natW;
            off.height = natH;
            const octx = off.getContext('2d');
            if (!octx) {
              maskDataUrl = c.toDataURL('image/png');
            } else {
              // Use the canvas's internal pixel dimensions as the source when
              // resampling. `c.width`/`c.height` are the device-pixel buffer
              // sizes; using them prevents accidental 1x1 outputs when the
              // display size differs (DPR scaling).
              
              // Get the source canvas image data to check what was actually drawn
              const sourceCtx = c.getContext('2d');
              if (!sourceCtx) {
                // Fallback: just fill with black
                octx.fillStyle = 'rgb(0, 0, 0)';
                octx.fillRect(0, 0, natW, natH);
                maskDataUrl = off.toDataURL('image/png');
              } else {
                // Get source canvas data first to see what was actually drawn
                const sourceImgData = sourceCtx.getImageData(0, 0, c.width, c.height);
                const sourceData = sourceImgData.data;
                
                // Create the output image data directly from source
                const outputImgData = octx.createImageData(natW, natH);
                const outputData = outputImgData.data;
                
                // Fill with black background first
                for (let i = 0; i < outputData.length; i += 4) {
                  outputData[i] = 0;       // R - black
                  outputData[i + 1] = 0;   // G - black
                  outputData[i + 2] = 0;   // B - black
                  outputData[i + 3] = 255;  // A - fully opaque
                }
                
                // Now check source canvas and set white only where pixels were actually drawn
                for (let y = 0; y < natH; y++) {
                  for (let x = 0; x < natW; x++) {
                    // Map output coordinates to source canvas coordinates
                    const srcX = Math.floor((x / natW) * c.width);
                    const srcY = Math.floor((y / natH) * c.height);
                    const srcIdx = (srcY * c.width + srcX) * 4;
                    const outIdx = (y * natW + x) * 4;
                    
                    if (srcIdx < sourceData.length) {
                      // Check if this pixel was actually drawn (has significant alpha and is white)
                      const srcAlpha = sourceData[srcIdx + 3];
                      const srcR = sourceData[srcIdx];
                      const srcG = sourceData[srcIdx + 1];
                      const srcB = sourceData[srcIdx + 2];
                      
                      // Only set to white if source pixel was actually drawn (alpha > 50 and is white)
                      if (srcAlpha > 50 && srcR > 200 && srcG > 200 && srcB > 200) {
                        // Masked area: set to white
                        outputData[outIdx] = 255;     // R
                        outputData[outIdx + 1] = 255; // G
                        outputData[outIdx + 2] = 255; // B
                        outputData[outIdx + 3] = 255; // A
                      }
                      // Otherwise keep it black (already set above)
                    }
                  }
                }
                
                // Put the processed image data onto the canvas
                octx.putImageData(outputImgData, 0, 0);
                maskDataUrl = off.toDataURL('image/png');
              }
            }
          } catch {
            // Fallback: create a proper mask with black background
            const c2 = fillCanvasRef.current as HTMLCanvasElement | null;
            if (c2) {
              try {
                const fallbackCanvas = document.createElement('canvas');
                const dispRect = fillContainerRef.current?.getBoundingClientRect();
                const displayW = Math.max(1, Math.floor(dispRect?.width || c2.width));
                const displayH = Math.max(1, Math.floor(dispRect?.height || c2.height));
                const natW = Math.max(1, Math.floor(inputNaturalSize.width || displayW));
                const natH = Math.max(1, Math.floor(inputNaturalSize.height || displayH));
                fallbackCanvas.width = natW;
                fallbackCanvas.height = natH;
                const fallbackCtx = fallbackCanvas.getContext('2d');
                if (fallbackCtx) {
                  const sourceCtx = c2.getContext('2d');
                  if (sourceCtx) {
                    // Get source canvas data
                    const sourceImgData = sourceCtx.getImageData(0, 0, c2.width, c2.height);
                    const sourceData = sourceImgData.data;
                    
                    // Create output image data
                    const outputImgData = fallbackCtx.createImageData(natW, natH);
                    const outputData = outputImgData.data;
                    
                    // Fill with black background first
                    for (let i = 0; i < outputData.length; i += 4) {
                      outputData[i] = 0;       // R - black
                      outputData[i + 1] = 0;   // G - black
                      outputData[i + 2] = 0;   // B - black
                      outputData[i + 3] = 255; // A - fully opaque
                    }
                    
                    // Check source canvas and set white only where pixels were actually drawn
                    for (let y = 0; y < natH; y++) {
                      for (let x = 0; x < natW; x++) {
                        const srcX = Math.floor((x / natW) * c2.width);
                        const srcY = Math.floor((y / natH) * c2.height);
                        const srcIdx = (srcY * c2.width + srcX) * 4;
                        const outIdx = (y * natW + x) * 4;
                        
                        if (srcIdx < sourceData.length) {
                          const srcAlpha = sourceData[srcIdx + 3];
                          const srcR = sourceData[srcIdx];
                          const srcG = sourceData[srcIdx + 1];
                          const srcB = sourceData[srcIdx + 2];
                          
                          // Only set to white if source pixel was actually drawn
                          if (srcAlpha > 50 && srcR > 200 && srcG > 200 && srcB > 200) {
                            outputData[outIdx] = 255;
                            outputData[outIdx + 1] = 255;
                            outputData[outIdx + 2] = 255;
                            outputData[outIdx + 3] = 255;
                          }
                        }
                      }
                    }
                    
                    fallbackCtx.putImageData(outputImgData, 0, 0);
                    maskDataUrl = fallbackCanvas.toDataURL('image/png');
                  } else {
                    // If can't get source context, just fill with black
                    fallbackCtx.fillStyle = 'rgb(0, 0, 0)';
                    fallbackCtx.fillRect(0, 0, natW, natH);
                    maskDataUrl = fallbackCanvas.toDataURL('image/png');
                  }
                } else {
                  maskDataUrl = c2.toDataURL('image/png');
                }
              } catch {
                maskDataUrl = c2.toDataURL('image/png');
              }
            } else {
              maskDataUrl = undefined;
            }
          }
        }
        if (!maskDataUrl) return; // Error already set above

        // Sanity-check the exported mask: ensure it actually contains painted
        // pixels (non-zero alpha). If the mask appears empty (often caused by
        // canvas sizing/probing failures) abort with a helpful message.
        try {
          const sanityOff = document.createElement('canvas');
          const dispRect = fillContainerRef.current?.getBoundingClientRect();
          const displayW = Math.max(1, Math.floor(dispRect?.width || (fillCanvasRef.current?.width || 1)));
          const displayH = Math.max(1, Math.floor(dispRect?.height || (fillCanvasRef.current?.height || 1)));
          const natW = Math.max(1, Math.floor(inputNaturalSize.width || displayW));
          const natH = Math.max(1, Math.floor(inputNaturalSize.height || displayH));
          sanityOff.width = natW;
          sanityOff.height = natH;
          const sctx = sanityOff.getContext('2d');
          if (sctx) {
            const maskImg = new window.Image();
            await new Promise<void>((resolve) => {
              maskImg.onload = () => {
                try {
                  sctx.drawImage(maskImg, 0, 0, natW, natH);
                } catch (e) {}
                resolve();
              };
              maskImg.onerror = () => resolve();
              maskImg.src = maskDataUrl as string;
            });
            try {
              const data = sctx.getImageData(0, 0, Math.max(1, natW), Math.max(1, natH)).data;
              let alphaNonZero = false;
              for (let i = 3; i < data.length; i += 4) {
                if (data[i] !== 0) { alphaNonZero = true; break; }
              }
              if (!alphaNonZero) {
                setErrorMsg('Mask appears empty. Please draw a mask with the brush and try again.');
                setProcessing((prev) => ({ ...prev, [selectedFeature]: false }));
                return;
              }
            } catch (e) {
              // If getImageData fails (CORS), continue; we'll try rescaling below
            }
          }
        } catch (e) {
          // ignore sanity errors and proceed to probing/rescaling
        }

        // If we're sending an image_url (not a data URI), fetch the image to
        // obtain its true natural size and rescale the mask to match if needed.
        const fillSourceImage = String(normalizedInput).startsWith('data:') ? normalizedInput : currentInput;
        if (!String(fillSourceImage).startsWith('data:')) {
          try {
            const probeImg = new window.Image();
            probeImg.crossOrigin = 'anonymous';
            const imgUrl = currentInput as string;
            await new Promise<void>((resolve) => {
              probeImg.onload = () => resolve();
              probeImg.onerror = () => resolve();
              probeImg.src = imgUrl;
            });
            const imgW = Math.max(1, Math.floor((probeImg as any).naturalWidth || 0));
            const imgH = Math.max(1, Math.floor((probeImg as any).naturalHeight || 0));
            if (imgW && imgH) {
              // Create an image from the mask data URL then draw into a canvas of the target size
              const maskImg = new window.Image();
              maskImg.crossOrigin = 'anonymous';
              await new Promise<void>((resolve) => {
                maskImg.onload = () => {
                  try {
                    const final = document.createElement('canvas');
                    final.width = imgW;
                    final.height = imgH;
                    const fctx = final.getContext('2d');
                    if (fctx) fctx.drawImage(maskImg, 0, 0, imgW, imgH);
                    maskDataUrl = final.toDataURL('image/png');
                  } catch (e) {
                    // keep existing maskDataUrl on error
                  }
                  resolve();
                };
                maskImg.onerror = () => resolve();
                maskImg.src = maskDataUrl as string;
              });
            }
          } catch (e) {
            // Ignore probe failures; fallback maskDataUrl will be used and may fail server-side if sizes mismatch
            console.warn('[Fill] failed to probe input image size for mask rescaling', e);
          }
        }



        // Branch: Google Nano Banana uses unified /api/replace/edit for both Replace and Erase
        if (model === 'google_nano_banana') {
          try {
            // For erase, use hardcoded prompt; for fill, use user's prompt
            const erasePrompt = 'remove the masked part from image';
            const finalPrompt = selectedFeature === 'erase' ? erasePrompt : prompt.trim();
            
            const payload: any = {
              input_image: String(normalizedInput).startsWith('data:') ? normalizedInput : currentInput,
              masked_image: maskDataUrl,
              prompt: finalPrompt,
              model: 'google_nano_banana',
            };
            const res = await axiosInstance.post('/api/replace/edit', payload);
            const edited = res?.data?.data?.edited_image || res?.data?.edited_image || '';
            if (edited) setOutputs((prev) => ({ ...prev, [selectedFeature]: edited }));
            try { setCurrentHistoryId(res?.data?.data?.historyId || null); } catch { }
            // Refresh global history so the Image Generation page sees the new edit entry immediately
            try {
              await (dispatch as any)(loadHistory({
                paginationParams: { limit: 60 },
                requestOrigin: 'page',
                debugTag: `refresh-after-${selectedFeature}:${Date.now()}`,
              }));
            } catch {}
            return;
          } catch (replaceErr) {
            console.error(`[${selectedFeature === 'erase' ? 'Erase' : 'Replace'}] API Error:`, replaceErr);
            throw replaceErr;
          }
        }
        const body: any = {
          isPublic,
          prompt: prompt.trim(),
        };
        // Add image (data URI or URL)
        if (String(fillSourceImage).startsWith('data:')) {
          body.image = fillSourceImage;
        } else {
          body.image_url = currentInput;
        }
        // Add mask (data URI or URL)
        if (String(maskDataUrl).startsWith('data:')) {
          body.mask = maskDataUrl;
        } else {
          body.mask_url = maskDataUrl;
        }
        // Optional parameters
        if (fillNegativePrompt && fillNegativePrompt.trim()) {
          body.negative_prompt = fillNegativePrompt.trim();
        }
        if (String(fillSeed).trim() !== '' && Number.isFinite(Number(fillSeed))) {
          body.seed = Math.floor(Number(fillSeed));
        }
        const numImages = Number(fillNumImages ?? 1);
        if (Number.isFinite(numImages) && numImages >= 1 && numImages <= 4) {
          body.num_images = Math.round(numImages);
        }
        if (fillSyncMode) {
          body.sync_mode = true;
        }
        console.log('[Fill] Request payload:', { ...body, image: body.image ? '[IMAGE_DATA]' : body.image_url, mask: body.mask ? '[MASK_DATA]' : body.mask_url });
        try {
          const res = await axiosInstance.post('/api/fal/bria/genfill', body);
          const imagesArray = res?.data?.data?.images || res?.data?.images || [];
          const out = imagesArray[0]?.url || res?.data?.data?.image?.url || res?.data?.data?.url || res?.data?.url || '';
          if (out) setOutputs((prev) => ({ ...prev, ['fill']: out }));
          try { setCurrentHistoryId(res?.data?.data?.historyId || null); } catch { }
          // Refresh global history so the Image Generation page sees the new fill entry immediately
          try {
            await (dispatch as any)(loadHistory({
              paginationParams: { limit: 60 },
              requestOrigin: 'page',
              debugTag: `refresh-after-fill:${Date.now()}`,
            }));
          } catch {}
          return;
        } catch (fillError) {
          console.error('[Fill] API Error:', fillError);
          const fillErrorData = (fillError as any)?.response?.data;
          console.log('[Fill] Error response:', fillErrorData);
          throw fillError;
        }
      }

      if (selectedFeature === 'resize' && model === 'fal-ai/bria/expand') {
        // Build Bria Expand payload from UI. If fields are empty, try to infer from image + expand sliders
        const isDataInput = String(normalizedInput).startsWith('data:');
        const payload: any = { isPublic, sync_mode: !!resizeSyncMode };
        if (prompt && prompt.trim()) payload.prompt = prompt.trim();
        if (resizeNegativePrompt && resizeNegativePrompt.trim()) payload.negative_prompt = resizeNegativePrompt.trim();
        if (resizeSeed !== '') payload.seed = Math.round(Number(resizeSeed) || 0);
        if (resizeAspectRatio) payload.aspect_ratio = resizeAspectRatio;
        if (resizeCanvasW && resizeCanvasH) payload.canvas_size = [Number(resizeCanvasW), Number(resizeCanvasH)];
        if (resizeOrigW && resizeOrigH) payload.original_image_size = [Number(resizeOrigW), Number(resizeOrigH)];
        if (resizeOrigX !== '' && resizeOrigY !== '') payload.original_image_location = [Number(resizeOrigX), Number(resizeOrigY)];
        if (isDataInput) payload.image = normalizedInput; else payload.image_url = currentInput;

        // Bria Expand can take longer than default timeout, so set a longer timeout (120 seconds)
        const res = await axiosInstance.post('/api/fal/bria/expand', payload, {
          timeout: 120000 // 120 seconds
        });
        const outUrl = res?.data?.data?.image?.url || res?.data?.data?.images?.[0]?.url || res?.data?.images?.[0]?.url || res?.data?.data?.url || res?.data?.url || '';
        if (outUrl) setOutputs((prev) => ({ ...prev, ['resize']: outUrl }));
        try { setCurrentHistoryId(res?.data?.data?.historyId || null); } catch { }
        // Refresh global history so the Image Generation page sees the new resize entry immediately
        try {
          await (dispatch as any)(loadHistory({
            paginationParams: { limit: 60 },
            requestOrigin: 'page',
            debugTag: `refresh-after-resize:${Date.now()}`,
          }));
        } catch {}
        return;
      }


      if (selectedFeature === 'remove-bg') {
        const body: any = {
          image: String(normalizedInput).startsWith('data:') ? normalizedInput : currentInput,
          isPublic,
          model,
        };
        if (model.startsWith('bria/eraser')) {
          // Export mask if drawn, scaled to input natural size
          const maskDataUrl = (() => {
            const c = fillCanvasRef.current;
            if (!c) return undefined as any;
            if (!hasMask) return undefined as any;
            try {
              const off = document.createElement('canvas');
              const dispRect = fillContainerRef.current?.getBoundingClientRect();
              const displayW = Math.max(1, Math.floor(dispRect?.width || c.width));
              const displayH = Math.max(1, Math.floor(dispRect?.height || c.height));
              const natW = Math.max(1, Math.floor(inputNaturalSize.width || displayW));
              const natH = Math.max(1, Math.floor(inputNaturalSize.height || displayH));
              off.width = natW;
              off.height = natH;
              const octx = off.getContext('2d');
              if (!octx) return c.toDataURL('image/png');
              // See note above: draw from the canvas's full pixel buffer.
              octx.drawImage(c, 0, 0, c.width, c.height, 0, 0, natW, natH);
              // Quick sanity: ensure mask has non-zero alpha
              try {
                const d = octx.getImageData(0, 0, Math.max(1, natW), Math.max(1, natH)).data;
                let hasAlpha = false;
                for (let i = 3; i < d.length; i += 4) { if (d[i] !== 0) { hasAlpha = true; break; } }
                if (!hasAlpha) return undefined as any;
              } catch (e) {
                // ignore getImageData errors (CORS)
              }
              return off.toDataURL('image/png');
            } catch {
              const c = fillCanvasRef.current as HTMLCanvasElement | null;
              return c ? c.toDataURL('image/png') : undefined;
            }
          })();
          if (maskDataUrl) body.mask = maskDataUrl;
          body.mask_type = 'manual';
          body.preserve_alpha = true;
          body.sync = true;
        } else if (model.startsWith('851-labs/')) {
          if (output) body.format = output as any;
          if (backgroundType) body.background_type = backgroundType;
          if (threshold) body.threshold = Number(threshold);
          if (reverseBg) body.reverse = true;
        }
        const res = await axiosInstance.post('/api/replicate/remove-bg', body);
        console.log('[EditImage] remove-bg.res', res?.data);
        
        // Extract URL from response - match upscale pattern exactly
        // Backend returns { data: { images: [{ url, storagePath }] } }
        const first = res?.data?.data?.images?.[0]?.url || res?.data?.data?.images?.[0] || res?.data?.data?.url || res?.data?.url || '';
        
        if (first) {
          console.log('[EditImage] remove-bg output URL:', { first, selectedFeature });
          // Set output directly like upscale does - no URL conversion needed since backend returns full URL
          setOutputs((prev) => ({ ...prev, ['remove-bg']: first }));
          // Ensure processing is set to false
          setProcessing((prev) => ({ ...prev, ['remove-bg']: false }));
          try { setCurrentHistoryId(res?.data?.data?.historyId || null); } catch { }
          // Refresh global history so the Image Generation page sees the new remove-bg entry immediately
          try {
            await (dispatch as any)(loadHistory({
              paginationParams: { limit: 60 },
              requestOrigin: 'page',
              debugTag: `refresh-after-remove-bg:${Date.now()}`,
            }));
          } catch {}
        } else {
          console.error('[EditImage] remove-bg: No output URL found in response', res?.data);
          setProcessing((prev) => ({ ...prev, ['remove-bg']: false }));
        }
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
            if (out) { }
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
          if (out) { }
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
          if (out) { }
        }
      } else if (selectedFeature === 'reimagine') {
          if (!reimagineSelectionBounds) {
             setErrorMsg('Please select a region to reimagine.');
             return;
          }
          
          if (!reimaginePrompt || !reimaginePrompt.trim()) {
            setErrorMsg('Please enter a prompt for reimagine.');
            return;
          }

          // Calculate selection bounds in natural image space
          const containerRect = fillContainerRef.current?.getBoundingClientRect();
          if (!containerRect) throw new Error('Container not found');

          const natW = inputNaturalSize.width;
          const natH = inputNaturalSize.height;

          if (!natW || !natH) throw new Error('Image dimensions not found');

          // CRITICAL FIX: When image uses object-fit:contain, we need to calculate
          // the actual displayed dimensions within the container
          const containerAspect = containerRect.width / containerRect.height;
          const imageAspect = natW / natH;

          let displayedWidth: number;
          let displayedHeight: number;
          let offsetX = 0;
          let offsetY = 0;

          if (imageAspect > containerAspect) {
            // Image is wider - constrained by width
            displayedWidth = containerRect.width;
            displayedHeight = containerRect.width / imageAspect;
            offsetY = (containerRect.height - displayedHeight) / 2;
          } else {
            // Image is taller - constrained by height
            displayedHeight = containerRect.height;
            displayedWidth = containerRect.height * imageAspect;
            offsetX = (containerRect.width - displayedWidth) / 2;
          }

          // Calculate scale factors based on displayed size
          const scaleX = natW / displayedWidth;
          const scaleY = natH / displayedHeight;

          // Adjust selection bounds to account for the offset (letterboxing/pillarboxing)
          const adjustedSelectionBounds = {
            x: reimagineSelectionBounds.x - offsetX,
            y: reimagineSelectionBounds.y - offsetY,
            width: reimagineSelectionBounds.width,
            height: reimagineSelectionBounds.height,
          };

          const scaledBounds = {
            x: Math.floor(adjustedSelectionBounds.x * scaleX),
            y: Math.floor(adjustedSelectionBounds.y * scaleY),
            width: Math.floor(adjustedSelectionBounds.width * scaleX),
            height: Math.floor(adjustedSelectionBounds.height * scaleY),
          };

          console.log('[Frontend] Image dimensions:', { natW, natH });
          console.log('[Frontend] Container dimensions:', { width: containerRect.width, height: containerRect.height });
          console.log('[Frontend] Displayed dimensions:', { displayedWidth, displayedHeight });
          console.log('[Frontend] Offset:', { offsetX, offsetY });
          console.log('[Frontend] Scale factors:', { scaleX, scaleY });
          console.log('[Frontend] Original selection bounds:', reimagineSelectionBounds);
          console.log('[Frontend] Adjusted selection bounds:', adjustedSelectionBounds);
          console.log('[Frontend] Scaled selection bounds:', scaledBounds);

          // Call backend reimagine endpoint
          const payload: any = {
            image_url: currentInput,
            selection_bounds: scaledBounds,
            prompt: reimaginePrompt.trim(),
            isPublic,
          };

          // Include reference image if available
          if (reimagineReferenceImage) {
            payload.referenceImage = reimagineReferenceImage;
          }

          // Only include model if user explicitly chose one (not 'auto')
          if (reimagineModel !== 'auto') {
            payload.model = reimagineModel;
            console.log('🎯 [Frontend] MANUALLY SELECTED MODEL:', reimagineModel);
          } else {
            console.log('🤖 [Frontend] AUTO MODEL SELECTION (backend will decide)');
          }

          console.log('[Frontend] Reimagine Payload:', payload);

          const res = await axiosInstance.post('/api/reimagine/generate', payload);
          const reimaginedUrl = res?.data?.data?.reimagined_image || res?.data?.reimagined_image || '';

          if (!reimaginedUrl) throw new Error('No reimagined image returned');

          setOutputs(prev => ({ ...prev, ['reimagine']: reimaginedUrl }));
          try { setCurrentHistoryId(res?.data?.data?.historyId || null); } catch {}

          // Refresh history
          try {
            await (dispatch as any)(loadHistory({
              paginationParams: { limit: 60 },
              requestOrigin: 'page',
              debugTag: `refresh-after-reimagine:${Date.now()}`,
            }));
          } catch {}

          // Reset selection
          setReimagineSelectionConfirmed(false);
          setReimagineSelectionBounds(null);
          setReimagineLiveBounds(null);
          setHasMask(false);
          setReimaginePrompt('');

          // Clear visual mask
          const fillCtx = fillCanvasRef.current?.getContext('2d');
          if (fillCtx && fillContainerRef.current) {
             fillCtx.clearRect(0, 0, fillContainerRef.current.clientWidth, fillContainerRef.current.clientHeight);
          }

          toast.success('Reimagine complete!');
          return;

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
        let payload: any = { image: String(normalizedInput).startsWith('data:') ? normalizedInput : currentInput, model };
        if (model === 'philz1337x/clarity-upscaler') {
          const dyn = dynamic ? Number(dynamic) : 6;
          const shp = sharpen ? Number(sharpen) : 0;
          payload = { ...payload, scale_factor: clarityScale, output_format: output, dynamic: Number.isFinite(dyn) ? dyn : 6, sharpen: Number.isFinite(shp) ? shp : 0 };
        } else if (model === 'nightmareai/real-esrgan') {
          payload = { ...payload, scale: esrganScale, face_enhance: faceEnhance };
        } else if (model === 'philz1337x/crystal-upscaler') {
          const crystalScale = Math.max(1, Math.min(6, clarityScale));
          const fmt = (output === 'jpg' || output === 'png') ? output : 'png';
          payload = { ...payload, scale_factor: crystalScale, output_format: fmt };
        } else if (model === 'fal-ai/topaz/upscale/image') {
          // Use FAL Topaz Upscaler endpoint
          const normalizedLocal = normalizedInput;
          const isData = String(normalizedLocal).startsWith('data:');
          const body: any = {
            ...(isData ? { image: normalizedLocal } : { image_url: currentInput }),
            model: topazModel,
            upscale_factor: Number(topazUpscaleFactor) || 2,
            crop_to_fill: Boolean(topazCropToFill),
            output_format: topazOutputFormat,
            subject_detection: topazSubjectDetection,
            face_enhancement: Boolean(topazFaceEnhance),
          };
          if (topazFaceCreativity != null) body.face_enhancement_creativity = Number(topazFaceCreativity) || 0;
          if (topazFaceStrength != null) body.face_enhancement_strength = Number(topazFaceStrength) || 0.8;
          const res = await axiosInstance.post('/api/fal/topaz/upscale/image', body);
          const first = res?.data?.data?.images?.[0]?.url || res?.data?.images?.[0]?.url || res?.data?.data?.image?.url || res?.data?.data?.url || res?.data?.url || '';
          if (first) setOutputs((prev) => ({ ...prev, ['upscale']: first }));
          try { setCurrentHistoryId(res?.data?.data?.historyId || null); } catch { }
          // Refresh global history so the Image Generation page sees the new upscale entry immediately
          try {
            await (dispatch as any)(loadHistory({
              paginationParams: { limit: 60 },
              requestOrigin: 'page',
              debugTag: `refresh-after-upscale-topaz:${Date.now()}`,
            }));
          } catch {}
          return;
        } 
        // else if (model === 'fermatresearch/magic-image-refiner') {
        //   payload = { ...payload };
         
        const res = await axiosInstance.post('/api/replicate/upscale', payload);
        console.log('[EditImage] upscale.res', res?.data);
        const first = res?.data?.data?.images?.[0]?.url || res?.data?.data?.images?.[0] || res?.data?.data?.url || res?.data?.url || '';
        if (first) setOutputs((prev) => ({ ...prev, ['upscale']: first }));
        try { setCurrentHistoryId(res?.data?.data?.historyId || null); } catch { }
        // Refresh global history so the Image Generation page sees the new upscale entry immediately
        try {
          await (dispatch as any)(loadHistory({
            paginationParams: { limit: 60 },
            requestOrigin: 'page',
            debugTag: `refresh-after-upscale:${Date.now()}`,
          }));
        } catch {}
      }
    } catch (e) {
      console.error('[EditImage] run.error', e);
      const errorData = (e as any)?.response?.data;
      let msg = (errorData && (errorData.message || errorData.error)) || (e as any)?.message || 'Request failed';
      if (!msg && Array.isArray(errorData)) {
        try { msg = errorData.map((x: any) => x?.msg || x).join(', '); } catch { }
      }
      if (typeof msg !== 'string') {
        try { msg = JSON.stringify(errorData); } catch { }
      }
      console.log('[EditImage] Error details:', errorData);
      setErrorMsg(String(msg));
    } finally {
      setProcessing((prev) => ({ ...prev, [selectedFeature]: false }));
    }
  };

  const handleReset = () => {
    setInputs({ 'upscale': null, 'remove-bg': null, 'resize': null, 'fill': null, 'vectorize': null, 'erase': null, 'expand': null, 'reimagine': null, 'live-chat': null });
    setOutputs({ 'upscale': null, 'remove-bg': null, 'resize': null, 'fill': null, 'vectorize': null, 'erase': null, 'expand': null, 'reimagine': null, 'live-chat': null });
    // Set appropriate default model based on selected feature
    if (selectedFeature === 'remove-bg') {
      setModel('851-labs/background-remover');
    } else if (selectedFeature === 'upscale') {
      setModel('philz1337x/crystal-upscaler');
    } else if (selectedFeature === 'resize') {
      setModel('fal-ai/bria/expand');
    } else if (selectedFeature === 'vectorize') {
      setModel('fal-ai/recraft/vectorize' as any);
    }
    setPrompt('');
    setScaleFactor('');
    setOutput('png');
    setDynamic('');
    setSharpen('');
    setBackgroundType('rgba');
    setThreshold('');
    setResizeExpandLeft(0);
    setResizeExpandRight(0);
    setResizeExpandTop(0);
    setResizeExpandBottom(400);
    setResizeZoomOutPercentage(20);
    setResizeNumImages(1);
    setResizeSafetyChecker(true);
    setResizeSyncMode(false);
    setResizeOutputFormat('png');
    setResizeAspectRatio('');
    setFillSeed('');
    setFillNegativePrompt('');
    setFillNumImages(1);
    setFillSyncMode(false);
    setIsMasking(false);
    setHasMask(false);
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
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
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
          <div className="shrink-0 px-1 ml-6 sm:ml-8 md:ml-7 lg:ml-7 ">
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-semibold">Edit Images</h1>
            <p className="text-white/80 text-base sm:text-lg md:text-xl">Transform your images with AI</p>
          </div>
          {/* feature tabs moved to left sidebar */}
                </div>
            </div>
      {/* Spacer to offset fixed header height */}
      {/* <div className="h-[110px]"></div> */}
      {/* Upload from Library/Computer Modal */}
      <UploadModal
        key={`upload-modal-${isUploadOpen}`}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        historyEntries={historyEntries as any}
        remainingSlots={1}
        hasMore={historyHasMore}
        loading={historyLoading}
        onTabChange={useCallback((tab: 'library' | 'computer' | 'uploads') => {
          // Tab change handled internally by UploadModal
        }, [])}
        onAdd={(urls: string[]) => {
          const first = urls[0];
          if (first) {
            // Apply selected image from modal to all features
            setInputs({
              'upscale': first,
              'remove-bg': first,
              'resize': first,
              'fill': first,
              'vectorize': first,
              'erase': first,
              'expand': first,
              'reimagine': first,
              'live-chat': first,
            });
            // Clear all outputs when a new image is selected so the output area re-renders
            setOutputs({
              'upscale': null,
              'remove-bg': null,
              'resize': null,
              'fill': null,
              'vectorize': null,
              'erase': null,
              'expand': null,
              'reimagine': null,
              'live-chat': null,
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
                      setModel('philz1337x/crystal-upscaler');
                    } else if (feature.id === 'resize') {
                      setModel('fal-ai/bria/expand');
                    } else if (feature.id === 'vectorize') {
                      setModel('fal-ai/recraft/vectorize' as any);
                    }
                    setProcessing((p) => ({ ...p, [feature.id]: false }));
                  }}
                  className={`text-left bg-white/5 items-center justify-center rounded-lg p-1 h-18 w-auto border transition ${selectedFeature === feature.id ? 'border-white/30 bg-white/10' : 'border-white/10 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-0 justify-center ">
                    <div className={`w-6 h-6 rounded flex items-center justify-center  ${selectedFeature === feature.id ? '' : ''}`}>
                      {feature.id === 'upscale' && (<img src="/icons/scaling.svg" alt="Upscale" className="w-6 h-6" />)}
                      {feature.id === 'remove-bg' && (<img src="/icons/image-minus.svg" alt="Remove background" className="w-6 h-6" />)}
                      {/* {feature.id === 'expand' && (<img src="/icons/resize.svg" alt="Expand" className="w-6 h-6" />)} */}
                      {feature.id === 'erase' && (<img src="/icons/erase.svg" alt="Erase" className="w-8 h-8" />)}
                    
                      {feature.id === 'resize' && (<img src="/icons/resize.svg" alt="Resize" className="w-5 h-5" />)}
                      {feature.id === 'fill' && (<img src="/icons/inpaint.svg" alt="Image Fill" className="w-6 h-6" />)}
                      {feature.id === 'vectorize' && (<img src="/icons/vector.svg" alt="Vectorize" className="w-7 h-7" />)}
                      {feature.id === 'reimagine' && (<img src="/icons/reimagine.svg" alt="Reimagine" className="w-6 h-6" />)}
                      {feature.id === 'live-chat' && (<img src="/icons/chat.svg" alt="Live Chat" className="w-6 h-6" />)}
                    </div>
                    
                  </div>
                  <div className="flex items-center justify-center pt-1">                  
                    <span className="text-white text-xs md:text-sm text-center">{feature.label}</span>
                  </div>

                </button>
              ))}
            </div>
          </div>

          {/* Feature Preview (GIF banner) - hidden for Live Chat */}
          {selectedFeature !== 'live-chat' && (
            <div className="px-3 md:px-4 mb-2 pt-4 z-10">
              <div className="relative rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/15 h-24 md:h-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featurePreviewGif[selectedFeature]} alt="Feature preview" className="w-full h-full object-cover opacity-90" />
                <div className="absolute top-1 left-1 bg-black/70 text-white text-[11px] md:text-xs px-2 py-0.5 rounded">
                  {featureDisplayName[selectedFeature]}
                </div>
              </div>
            </div>
          )}

          {/* Input Image section removed: unified canvas lives on the right */}

          {/* Reimagine Reference Image */}
          {selectedFeature === 'reimagine' && (
            <div className="px-3 md:px-4">
              <label className="block text-xs font-medium text-white/70 mb-2 md:text-sm">Reference Image (Optional)</label>
              
              {!reimagineReferenceImage ? (
                <div 
                  className="border border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors group"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setReimagineReferenceImage(ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                  <span className="text-xs text-white/50 text-center">Click to upload reference</span>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                  <img src={reimagineReferenceImage} alt="Reference" className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      onClick={() => setReimagineReferenceImage(null)}
                      className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                      title="Remove"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                    <span className="text-[10px] text-white/80">Reference Image</span>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-white/40 mt-2">
                Upload an image to extract details, texture, or style. This will be used as a guide for the generation.
              </p>
            </div>
          )}

          {/* Vectorize model & parameters */}
          {selectedFeature === 'vectorize' && (
            <div className="px-3 md:px-4">
              {/* <h3 className="text-xs pl-1 font-medium text-white/80 mb-1 md:text-lg">Vectorize Options</h3> */}
              <div className="space-y-2">
                {/* Super Mode Toggle */}
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1 mt-2 md:text-sm">Mode</label>
                  <div className="relative bg-white/5 border border-white/20 rounded-lg p-1 flex">
                    <button
                      onClick={() => setVectorizeSuperMode(false)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                        !vectorizeSuperMode
                          ? 'bg-white text-black'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setVectorizeSuperMode(true)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                        vectorizeSuperMode
                          ? 'bg-white text-black'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Super best for production
                    </button>
                  </div>
                  {vectorizeSuperMode && (
                    <div className="text-[11px] text-white/50 mt-1">
                      First converts image to 2D vector using Seedream, then vectorizes the result
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1 mt-2 md:text-sm ">Model</label>
                  <div className="relative edit-dropdown">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === 'vectorizeModel' ? '' : 'vectorizeModel')}
                      className={`h-[32px]  w-full px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-transparent text-white/90 z-70`}
                    >
                      <span className="truncate">{vectorizeModel === 'fal-ai/recraft/vectorize' ? 'Recraft Vectorize' : 'Image to SVG'}</span>
                      <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'vectorizeModel' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === 'vectorizeModel' && (
                      <div className={`absolute top-full mt-2 z-30  left-0 w-auto bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-0 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                        {[
                          { label: 'Recraft Vectorize', value: 'fal-ai/recraft/vectorize' },
                          { label: 'Image to SVG', value: 'fal-ai/image2svg' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { setVectorizeModel(opt.value as any); setActiveDropdown(''); }}
                            className={`w-full px-3 py-2 text-left text-[13px] z-70 ${vectorizeModel === opt.value ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                          >
                            <span className="truncate">{opt.label}</span>
                          </button>
                        ))}
                        </div>
                      )}
                  </div>
                </div>
                {vectorizeModel === 'fal-ai/image2svg' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Colormode</label>
                        <div className="relative edit-dropdown">
                      <button
                            onClick={() => setActiveDropdown(activeDropdown === 'vColorMode' ? '' : 'vColorMode')}
                            className={`h-[30px] w-full px-3 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-white/5 text-white/90`}
                      >
                            <span className="truncate">{vColorMode}</span>
                            <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'vColorMode' ? 'rotate-180' : ''}`} />
                      </button>
                          {activeDropdown === 'vColorMode' && (
                            <div className={`absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                              {['color','binary'].map((opt) => (
                                <button key={opt} onClick={() => { setVColorMode(opt as any); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${vColorMode === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{opt}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Hierarchical</label>
                        <div className="relative edit-dropdown">
                    <button
                            onClick={() => setActiveDropdown(activeDropdown === 'vHierarchical' ? '' : 'vHierarchical')}
                            className={`h-[30px] w-full px-3 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-white/5 text-white/90`}
                    >
                            <span className="truncate">{vHierarchical}</span>
                            <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'vHierarchical' ? 'rotate-180' : ''}`} />
                    </button>
                          {activeDropdown === 'vHierarchical' && (
                            <div className={`absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                              {['stacked','cutout'].map((opt) => (
                                <button key={opt} onClick={() => { setVHierarchical(opt as any); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${vHierarchical === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{opt}</button>
                              ))}
                            </div>
                          )}
                </div>
                        </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Mode</label>
                        <div className="relative edit-dropdown">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === 'vMode' ? '' : 'vMode')}
                            className={`h-[30px] w-full px-3 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-white/5 text-white/90`}
                          >
                            <span className="truncate">{vMode}</span>
                            <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'vMode' ? 'rotate-180' : ''}`} />
                          </button>
                          {activeDropdown === 'vMode' && (
                            <div className={`absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                              {['spline','polygon'].map((opt) => (
                                <button key={opt} onClick={() => { setVMode(opt as any); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${vMode === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{opt}</button>
                              ))}
                      </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Filter Speckle</label>
                        <input type="number" value={vFilterSpeckle} onChange={(e) => setVFilterSpeckle(Number(e.target.value))} className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Color Precision</label>
                        <input type="number" value={vColorPrecision} onChange={(e) => setVColorPrecision(Number(e.target.value))} className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Layer Difference</label>
                        <input type="number" value={vLayerDifference} onChange={(e) => setVLayerDifference(Number(e.target.value))} className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Corner Threshold</label>
                        <input type="number" value={vCornerThreshold} onChange={(e) => setVCornerThreshold(Number(e.target.value))} className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Length Threshold</label>
                        <input type="number" step="0.1" value={vLengthThreshold} onChange={(e) => setVLengthThreshold(Number(e.target.value))} className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Max Iterations</label>
                        <input type="number" value={vMaxIterations} onChange={(e) => setVMaxIterations(Number(e.target.value))} className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Splice Threshold</label>
                        <input type="number" value={vSpliceThreshold} onChange={(e) => setVSpliceThreshold(Number(e.target.value))} className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Path Precision</label>
                        <input type="number" value={vPathPrecision} onChange={(e) => setVPathPrecision(Number(e.target.value))} className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons moved to bottom under Parameters */}
 
          {/* Configuration area (no scroll). Add bottom padding so footer doesn't overlap. */}
          <div className="flex-1 min-h-0 p-3 overflow-hidden md:p-4">
                    {selectedFeature === 'live-chat' && (
                      <>
                        <h3 className="text-xs font-medium text-white/80 mb-2 md:text-sm">Live Chat Controls</h3>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {/* Model dropdown */}
                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Model</label>
                              <div className="relative edit-dropdown">
                                <button
                                  onClick={() => setLiveActiveDropdown(liveActiveDropdown === 'liveModel' ? '' : 'liveModel')}
                                  className={`h-[32px] w-full px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-transparent text-white/90`}
                                >
                                  <span className="truncate">{liveAllowedModels.find(m => m.value === liveModel)?.label || 'Select model'}</span>
                                  <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${liveActiveDropdown === 'liveModel' ? 'rotate-180' : ''}`} />
                                </button>
                                {liveActiveDropdown === 'liveModel' && (
                                  <div className={`absolute top-full z-30 left-0 w-full bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                                    {liveAllowedModels.map(opt => (
                                      <button key={opt.value} onClick={() => { setLiveModel(opt.value); setLiveActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${liveModel === opt.value ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>
                                        <span className="truncate">{opt.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Frame size */}
                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Frame Size</label>
                              <div className="relative edit-dropdown">
                                <button
                                  onClick={() => setLiveActiveDropdown(liveActiveDropdown === 'liveFrame' ? '' : 'liveFrame')}
                                  className={`h-[32px] w-full px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-transparent text-white/90`}
                                >
                                  <span className="truncate">{liveFrameSizes.find(s => s.value === liveFrameSize)?.name || liveFrameSize}</span>
                                  <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${liveActiveDropdown === 'liveFrame' ? 'rotate-180' : ''}`} />
                                </button>
                                {liveActiveDropdown === 'liveFrame' && (
                                  <div className={`absolute top-full z-30 left-0 w-full bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                                    {liveFrameSizes.map(opt => (
                                      <button key={opt.value} onClick={() => { setLiveFrameSize(opt.value as any); setLiveActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${liveFrameSize === opt.value ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>
                                        <span className="truncate">{opt.name}</span>
                                        <span className="ml-2 text-white/50 text-[11px]">{opt.value}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Resolution shown for Pro & Seedream */}
                          {(liveModel === 'google/nano-banana-pro' || liveModel === 'seedream-v4') && (
                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Resolution</label>
                              <div className="relative edit-dropdown">
                                <button
                                  onClick={() => setLiveActiveDropdown(liveActiveDropdown === 'liveResolution' ? '' : 'liveResolution')}
                                  className={`h-[32px] w-full px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-transparent text-white/90`}
                                >
                                  <span className="truncate">{liveResolution}</span>
                                  <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${liveActiveDropdown === 'liveResolution' ? 'rotate-180' : ''}`} />
                                </button>
                                {liveActiveDropdown === 'liveResolution' && (
                                  <div className={`absolute top-full z-30 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2`}>
                                    {(['1K','2K','4K'] as const).map(r => (
                                      <button key={r} onClick={() => { setLiveResolution(r); setLiveActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${liveResolution === r ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{r}</button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Chat UI */}
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Chat to Edit</label>
                            <div className={`bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2  flex flex-col ${(liveModel === 'google/nano-banana-pro' || liveModel === 'seedream-v4') ? 'h-[23rem]' : 'h-[27rem]'}`}>
                              <div ref={(el) => { chatListRef.current = el; }} className="flex-1 overflow-y-auto space-y-2 pr-1 pb-1 very-thin-scrollbar">
                                {liveChatMessages.length === 0 && (
                                  <div className="text-[12px] text-white/50">Start by uploading an image on the right, then tell me what to change.</div>
                                )}
                                {liveChatMessages.map((m, i) => (
                                  <div
                                    key={i}
                                    ref={(el) => { if (i === liveChatMessages.length - 1) lastMsgRef.current = el; }}
                                    className={`flex items-start gap-2 transition-transform duration-150 ${m.role === 'user' ? 'justify-end' : ''}`}
                                  >
                                    <div className={`px-2 py-1 rounded-lg text-xs ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/90'}`}>
                                      {m.text}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-2">
                                <div className="relative">
                                  <input
                                    value={livePrompt}
                                    onChange={(e)=>setLivePrompt(e.target.value)}
                                    placeholder="Tell me your edit request"
                                    className="w-full h-[36px] px-3 pr-10 bg-transparent border border-white/10 rounded-full text-white text-sm placeholder-white/50"
                                    onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); handleLiveGenerate(); } }}
                                  />
                                  <button
                                    type="button"
                                    onClick={handleLiveGenerate}
                                    disabled={processing['live-chat'] || !livePrompt.trim()}
                                    aria-label="Generate"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/10 text-white rounded-full flex items-center justify-center border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                                      <circle cx="12" cy="12" r="9" />
                                      <path d="M10 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    {selectedFeature !== 'vectorize' && selectedFeature !== 'live-chat' && (
              <>
            <h3 className="text-xs font-medium text-white/80 mb-2 md:text-sm">Parameters</h3>

            <div className="space-y-1">
              {selectedFeature !== 'fill' && selectedFeature !== 'erase' && selectedFeature !== 'expand' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Model</label>
                  <div className="relative edit-dropdown">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === 'model' ? '' : 'model')}
                      className={`h-[32px] w-full px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between ${model ? 'bg-transparent text-white/90' : 'bg-transparent text-white/90 hover:bg-white/5'}`}
                    >
                      <span className="truncate">
                            {model ? getUpscaleModelLabel(model) : 'Select model'}
                      </span>
                      <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'model' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === 'model' && (
                      <div className={`absolute top-full z-30 left-0 w-full bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                        {(selectedFeature === 'remove-bg'
                          ? [
                              { label: '851-labs/background-remover', value: '851-labs/background-remover' },
                              { label: 'lucataco/remove-bg', value: 'lucataco/remove-bg' },
                              ]
                              : selectedFeature === 'resize'
                                ? [
                                  { label: 'Bria Expand', value: 'fal-ai/bria/expand' },
                            ]
                          : [
                                  { label: 'Crystal Upscaler', value: 'philz1337x/crystal-upscaler' },
                                  { label: 'Topaz Upscaler', value: 'fal-ai/topaz/upscale/image' },
                                  { label: 'Real-ESRGAN', value: 'nightmareai/real-esrgan' },
                            ]
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { setModel(opt.value as any); setActiveDropdown(''); }}
                            className={`w-full px-3 py-2 text-left text-[13px] ${model === opt.value ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                          >
                            <span className="truncate">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Right-side placeholder for alignment; can hold extra params per feature */}
                <div />
              </div>
              )}
                    {selectedFeature === 'remove-bg' && String(model).startsWith('bria/eraser') && (
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Brush Size</label>
                        <input type="range" min={3} max={150} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full" />
                        <div className="text-[11px] text-white/50 mt-1">{brushSize}px</div>
                      </div>
                    )}
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
                              {['png', 'jpg', 'jpeg', 'webp'].map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => { setOutput(fmt as any); setActiveDropdown(''); }}
                            className={`w-full px-3 py-2 text-left text-[13px] flex items-center justify-between ${output === fmt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                          >
                            <span className="uppercase">{fmt}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>

              {/* Prompt for Fill (not shown for Erase) */}
              {selectedFeature === 'fill' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Brush Size</label>
                    <input type="range" min={3} max={150} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full" />
                    <div className="text-[11px] text-white/50 mt-1">{brushSize}px</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Prompt</label>
                    <input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what to fill"
                      className="w-full h-[32px] px-2 bg-transparent border border-white/20 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 md:text-sm"
                    />
                  </div>
                </>
              )}
              
              {/* Erase feature - no prompt input, uses hardcoded prompt */}
              {selectedFeature === 'erase' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Brush Size</label>
                    <input type="range" min={3} max={150} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full" />
                    <div className="text-[11px] text-white/50 mt-1">{brushSize}px</div>
                  </div>
                  <div className="text-xs text-white/60 mb-2">
                    Draw on the image to mark areas you want to erase. The masked areas will be removed automatically.
                  </div>
                </>
              )}

              {/* Expand feature */}
              {selectedFeature === 'expand' && (
                <>
                  {expandOriginalSize.width > 0 && expandOriginalSize.height > 0 && (
                    <div className="mb-2">
                      <div className="text-xs text-white/70">
                        Original: {expandOriginalSize.width} × {expandOriginalSize.height}px
                      </div>
                      <div className="text-xs text-white/70 mt-1">
                        New: {expandCustomWidth} × {expandCustomHeight}px
                        { (expandEffectiveWidth !== expandCustomWidth || expandEffectiveHeight !== expandCustomHeight) && (
                          <>
                            <span className="mx-1 text-white/40">•</span>
                            <span className="text-white/70">Generated: {expandEffectiveWidth} × {expandEffectiveHeight}px</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandBounds({ left: 0, top: 0, right: 0, bottom: 0 });
                          }}
                          className="px-3 py-1.5 text-[11px] rounded bg-white/10 hover:bg-white/20 text-white/80 border border-white/20"
                        >Reset</button>
                        <button
                          type="button"
                          onClick={() => {
                            // Center the selection rectangle relative to original image
                            const w = expandCustomWidth;
                            const h = expandCustomHeight;
                            const dw = w - expandOriginalSize.width; // can be negative (crop) or positive (expand)
                            const dh = h - expandOriginalSize.height;
                            let left: number, right: number, top: number, bottom: number;
                            if (dw >= 0) {
                              left = Math.floor(dw / 2); right = dw - left;
                            } else {
                              const crop = -dw; // pixels to remove
                              const cLeft = Math.floor(crop / 2); const cRight = crop - cLeft;
                              left = -cLeft; right = -cRight;
                            }
                            if (dh >= 0) {
                              top = Math.floor(dh / 2); bottom = dh - top;
                            } else {
                              const crop = -dh;
                              const cTop = Math.floor(crop / 2); const cBottom = crop - cTop;
                              top = -cTop; bottom = -cBottom;
                            }
                            setExpandBounds({ left, top, right, bottom });
                          }}
                          className="px-3 py-1.5 text-[11px] rounded bg-white/10 hover:bg-white/20 text-white/80 border border-white/20"
                        >Center</button>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Aspect Ratio</label>
                    <div className="relative edit-dropdown">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === 'expandAspect' ? '' : 'expandAspect')}
                        className={`h-[32px] w-full px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-transparent text-white/90`}
                      >
                        <span className="truncate">{expandAspectRatio === 'custom' ? 'Custom' : expandAspectRatio}</span>
                        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'expandAspect' ? 'rotate-180' : ''}`} />
                      </button>
                      {activeDropdown === 'expandAspect' && (
                        <div className={`absolute bottom-full mb-2 z-100 left-0 w-full bg-black/95 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar shadow-2xl`}>
                          {['custom', '1:1', '4:3', '3:4', '16:9', '9:16', '21:9', '3:2', '2:3'].map((ar) => (
                            <button
                              key={ar}
                              onClick={() => {
                                setExpandAspectRatio(ar);
                                setActiveDropdown('');
                                if (ar !== 'custom' && expandOriginalSize.width > 0 && expandOriginalSize.height > 0) {
                                  const [w, h] = ar.split(':').map(Number);
                                  const aspect = w / h;
                                  const origAspect = expandOriginalSize.width / expandOriginalSize.height;
                                  let newWidth = expandOriginalSize.width;
                                  let newHeight = expandOriginalSize.height;
                                  if (aspect > origAspect) {
                                    newWidth = Math.round(expandOriginalSize.height * aspect);
                                  } else {
                                    newHeight = Math.round(expandOriginalSize.width / aspect);
                                  }
                                  const left = Math.max(0, Math.floor((newWidth - expandOriginalSize.width) / 2));
                                  const right = newWidth - expandOriginalSize.width - left;
                                  const top = Math.max(0, Math.floor((newHeight - expandOriginalSize.height) / 2));
                                  const bottom = newHeight - expandOriginalSize.height - top;
                                  setExpandBounds({ left, top, right, bottom });
                                }
                              }}
                              className={`w-full px-3 py-2 text-left text-[13px] flex items-center justify-between ${expandAspectRatio === ar ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                            >
                              <span className="truncate">{ar === 'custom' ? 'Custom' : ar}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-white/60 mt-2">
                    Drag the edges of the image on the canvas to expand or crop. The new dimensions will be calculated automatically.
                  </div>
                </>
              )}

              {/* Prompt not used by current backend operations; keep hidden unless resize later needs it */}
                  {selectedFeature === 'resize' && model === 'fal-ai/bria/expand' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Canvas Size*</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min={1} max={5000} value={resizeCanvasW as any} onChange={(e)=>setResizeCanvasW(e.target.value === '' ? '' : Math.max(1, Math.min(5000, Number(e.target.value) || 1)))} placeholder="W" className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs focus:outline-none" />
                            <input type="number" min={1} max={5000} value={resizeCanvasH as any} onChange={(e)=>setResizeCanvasH(e.target.value === '' ? '' : Math.max(1, Math.min(5000, Number(e.target.value) || 1)))} placeholder="H" className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs focus:outline-none" />
                          </div>
                          <div className="text-[11px] text-white/45 mt-1">Must be ≤ 5000 × 5000</div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Aspect Ratio</label>
                          <div className="relative edit-dropdown">
                            <button onClick={() => setActiveDropdown(activeDropdown === 'resizeAspect' ? '' : 'resizeAspect')} className={`h-[32px] w-full px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-transparent text-white/90`}>
                              <span className="truncate">{resizeAspectRatio || 'Select the Aspect Ratio'}</span>
                              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'resizeAspect' ? 'rotate-180' : ''}`} />
                            </button>
                            {activeDropdown === 'resizeAspect' && (
                              <div className={`absolute top -full mt-2 z-30 left-0 w-full bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-56 overflow-y-auto dropdown-scrollbar`}>
                                {['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9'].map((ar) => (
                                  <button key={ar} onClick={() => { setResizeAspectRatio(ar as any); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${resizeAspectRatio === ar ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{ar}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Original Image Size</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min={1} max={5000} value={resizeOrigW as any} onChange={(e)=>setResizeOrigW(e.target.value === '' ? '' : Math.max(1, Math.min(5000, Number(e.target.value) || 1)))} placeholder="W" className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs focus:outline-none" />
                          <input type="number" min={1} max={5000} value={resizeOrigH as any} onChange={(e)=>setResizeOrigH(e.target.value === '' ? '' : Math.max(1, Math.min(5000, Number(e.target.value) || 1)))} placeholder="H" className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs focus:outline-none" />
                        </div>
                      </div>

                      {/* <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Original Image Location (X,Y)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={resizeOrigX as any} onChange={(e)=>setResizeOrigX(e.target.value === '' ? '' : Math.round(Number(e.target.value) || 0))} placeholder="X" className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs focus:outline-none" />
                          <input type="number" value={resizeOrigY as any} onChange={(e)=>setResizeOrigY(e.target.value === '' ? '' : Math.round(Number(e.target.value) || 0))} placeholder="Y" className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs focus:outline-none" />
                        </div>
                        <div className="text-[11px] text-white/45 mt-1">X,Y may be outside canvas to crop the original</div>
                      </div> */}

                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Negative Prompt (Optional)</label>
                        <textarea value={resizeNegativePrompt} onChange={(e)=>setResizeNegativePrompt(e.target.value)} rows={1} className="w-full px-2 py-1 bg-black/80 border border-white/25 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none md:text-sm md:py-2" />
                      </div>

                      {/* <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1 md:text-sm">Seed (Optional)</label>
                          <input type="number" value={resizeSeed} onChange={(e)=>setResizeSeed(e.target.value)} className="w-full h-[30px] px-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs focus:outline-none" />
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center justify-between bg-white/5 border border-white/15 rounded-lg px-3 py-2 w-full">
                            <div className="pr-4">
                              <p className="text-xs font-medium text-white/80">Sync Mode</p>
                              <p className="text-[11px] text-white/50">Return media as data URI.</p>
                            </div>
                            <button type="button" onClick={() => setResizeSyncMode(v => !v)} className={`px-3 py-1 text-xs rounded-lg border border-white/25 transition ${resizeSyncMode ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>{resizeSyncMode ? 'On' : 'Off'}</button>
                          </div>
                        </div>
                      </div> */}
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
                        <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm pt-1">Scale (0-10)</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={1}
                              value={Number(String(scaleFactor).replace('x', '')) || 4}
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
                      {model === 'philz1337x/crystal-upscaler' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm pt-1">Scale factor (1-6)</label>
                            <input
                              type="number"
                              min={1}
                              max={6}
                              step={1}
                              value={Number(String(scaleFactor).replace('x', '')) || 2}
                              onChange={(e) => setScaleFactor(String(Math.max(1, Math.min(6, Number(e.target.value)))))}
                              className="w-full h-[30px] px-2 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 2xl:text-sm 2xl:py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm pt-1">Output format</label>
                            <div className="relative edit-dropdown">
                              <button
                                onClick={() => setActiveDropdown(activeDropdown === 'output' ? '' : 'output')}
                                className={`h-[30px] w-full px-3 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between ${output ? 'bg-transparent text-white/90' : 'bg-transparent text-white/90 hover:bg-white/5'}`}
                              >
                                <span className="truncate uppercase">{(output || 'png').toString()}</span>
                                <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'output' ? 'rotate-180' : ''}`} />
                              </button>
                              {activeDropdown === 'output' && (
                                <div className={`absolute z-30 mb-1 bottom-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                                  {['png', 'jpg'].map((fmt) => (
                                    <button
                                      key={fmt}
                                      onClick={() => { setOutput(fmt as any); setActiveDropdown(''); }}
                                      className={`w-full px-3 py-2 text-left text-[13px] flex items-center justify-between ${output === fmt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                                    >
                                      <span className="uppercase">{fmt}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {model === 'fal-ai/topaz/upscale/image' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm pt-2">Model</label>
                              <div className="relative edit-dropdown">
                                <button onClick={() => setActiveDropdown(activeDropdown === 'topazModel' ? '' : 'topazModel')} className={`h-[30px] w-full px-3 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-transparent text-white/90`}>
                                  <span className="truncate">{topazModel}</span>
                                  <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'topazModel' ? 'rotate-180' : ''}`} />
                                </button>
                                {activeDropdown === 'topazModel' && (
                                  <div className={`absolute z-30 top-full mt-2 left-0 w-56 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                                    {['Low Resolution V2','Standard V2','CGI','High Fidelity V2','Text Refine','Recovery','Redefine','Recovery V2'].map((opt) => (
                                      <button key={opt} onClick={() => { setTopazModel(opt as any); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${topazModel === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{opt}</button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm pt-2">Upscale factor</label>
                              <input type="number" min={0.1} step={0.1} value={topazUpscaleFactor} onChange={(e)=>setTopazUpscaleFactor(Number(e.target.value)||2)} className="w-full h-[30px] px-2 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 2xl:text-sm 2xl:py-2" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Output format</label>
                              <div className="relative edit-dropdown">
                                <button onClick={() => setActiveDropdown(activeDropdown === 'output' ? '' : 'output')} className={`h-[30px] w-full px-3 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-transparent text-white/90`}>
                                  <span className="truncate uppercase">{topazOutputFormat}</span>
                                  <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'output' ? 'rotate-180' : ''}`} />
                                </button>
                                {activeDropdown === 'output' && (
                                  <div className={`absolute z-30 top-full mt-2 left-0 w-40 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                                    {(['jpeg','png'] as const).map((fmt) => (
                                      <button key={fmt} onClick={() => { setTopazOutputFormat(fmt); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${topazOutputFormat === fmt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}><span className="uppercase">{fmt}</span></button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Subject detection</label>
                              <div className="relative edit-dropdown">
                                <button onClick={() => setActiveDropdown(activeDropdown === 'backgroundType' ? '' : 'backgroundType')} className={`h-[30px] w-full px-3 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-transparent text-white/90`}>
                                  <span className="truncate">{topazSubjectDetection}</span>
                                  <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'backgroundType' ? 'rotate-180' : ''}`} />
                                </button>
                                {activeDropdown === 'backgroundType' && (
                                  <div className={`absolute z-30 top-full mt-2 left-0 w-44 bg-black/80 backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 max-h-64 overflow-y-auto dropdown-scrollbar`}>
                                    {(['All','Foreground','Background'] as const).map((opt) => (
                                      <button key={opt} onClick={() => { setTopazSubjectDetection(opt); setActiveDropdown(''); }} className={`w-full px-3 py-2 text-left text-[13px] ${topazSubjectDetection === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}>{opt}</button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Face enhancement</label>
                              <button type="button" onClick={() => setTopazFaceEnhance(v=>!v)} className={`h-[30px] w-full px-3 rounded-lg ring-1 ring-white/20 text-[13px] font-medium transition ${topazFaceEnhance ? 'bg-white text-black' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>{topazFaceEnhance ? 'Enabled' : 'Disabled'}</button>
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-2 text-xs text-white/70">
                                <input type="checkbox" className="accent-white/90" checked={topazCropToFill} onChange={(e)=>setTopazCropToFill(e.target.checked)} /> Crop to fill
                              </label>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Face creativity (0-1)</label>
                              <input type="number" min={0} max={1} step={0.1} value={topazFaceCreativity} onChange={(e)=>setTopazFaceCreativity(Math.max(0, Math.min(1, Number(e.target.value) || 0)))} className="w-full h-[30px] px-2 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 2xl:text-sm 2xl:py-2" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-white/70 mb-1 2xl:text-sm">Face strength (0-1)</label>
                              <input type="number" min={0} max={1} step={0.1} value={topazFaceStrength} onChange={(e)=>setTopazFaceStrength(Math.max(0, Math.min(1, Number(e.target.value) || 0.8)))} className="w-full h-[30px] px-2 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 2xl:text-sm 2xl:py-2" />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* {model === 'mv-lab/swin2sr' && (
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
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )} */}
                </>
              )}
                </>
              )}

            {/* Bottom action buttons under parameters (hidden for Live Chat) */}
            {selectedFeature !== 'live-chat' && (
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
            )}
          </div>
 
            {/* Footer removed; buttons are rendered at the end of Parameters above */}
 
          </div>
 
        {/* Right Main Area - Image Display */}
        <div className="flex-1 flex flex-col bg-[#07070B] overflow-hidden">


          {/* Right Main Area - Output preview parallel to input image */}
          <div className="p-4 flex items-start justify-center pt-3  ">
              <div
              className={`bg-white/5 rounded-xl border border-white/10 relative overflow-hidden w-full max-w-6xl md:max-w-[100rem] ${selectedFeature === 'live-chat' ? 'min-h-[24rem] md:min-h-[35rem] lg:min-h-[45rem]' : 'min-h-[24rem] md:h-auto md:max-h-[50rem]'}`}
              onDragOver={(e) => { try { e.preventDefault(); } catch {} }}
              onDrop={(e) => {
                try {
                  e.preventDefault();
                  const file = e.dataTransfer?.files?.[0];
                  if (!file) return;
                 const reader = new FileReader();
                 reader.onload = (ev) => {
                   const img = ev.target?.result as string;
                   // Apply dropped image to all features so switching tabs preserves the same input
                   setInputs({
                     'upscale': img,
                     'remove-bg': img,
                     'resize': img,
                     'fill': img,
                     'vectorize': img,
                     'erase': img,
                     'expand': img,
                     'reimagine': img,
                     'live-chat': img,
                   });
                   // Clear all outputs when a new image is dropped so the output area re-renders
                   setOutputs({
                     'upscale': null,
                     'remove-bg': null,
                     'resize': null,
                     'fill': null,
                     'vectorize': null,
                     'erase': null,
                     'expand': null,
                     'reimagine': null,
                     'live-chat': null,
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
                  <span className="text-xs font-medium text-white bg-black/80 px-2 py-1 rounded md:text-sm md:px-3 md:py-1.5">{selectedFeature === 'upscale' && upscaleViewMode === 'comparison' ? 'Input Image' : 'Output Image'}</span>
                </div>
              )}
              

              {/* Bottom-left controls: menu (if output) and upload (always when image present) */}
              {(outputs[selectedFeature] || inputs[selectedFeature]) && (
                <div className="absolute bottom-3 left-3 z-50 md:bottom-4 md:left-4 flex items-center gap-2">
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
                <div className="w-full h-full relative">
                  {(inputs[selectedFeature]) ? (
                    // Upscale (toggle compare/zoom) OR Remove-BG (compare only)
                        <div className={`w-full h-full relative ${selectedFeature === 'live-chat' ? 'min-h-[24rem] md:min-h-[35rem] lg:min-h-[45rem]' : 'min-h-[24rem] md:min-h-[35rem] lg:min-h-[45rem]'}`}>
                      {inputs[selectedFeature] && selectedFeature !== 'resize' && (
                       <div className="absolute bottom-3 left-1/2 -translate-x-1/2 transform z-30 2xl:bottom-4">
                        <div className="flex bg-black/80 rounded-lg p-1">
                          <button
                            onClick={() => setUpscaleViewMode('comparison')}
                              className={`px-2 py-1 text-xs rounded transition-colors ${upscaleViewMode === 'comparison' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}
                          >
                            Compare
                          </button>
                          <button
                            onClick={() => setUpscaleViewMode('zoom')}
                              className={`px-2 py-1 text-xs rounded transition-colors ${upscaleViewMode === 'zoom' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}
                          >
                            Zoom
                          </button>
                        </div>
                      </div>
                      )}

                      {selectedFeature !== 'resize' && upscaleViewMode === 'comparison' ? (
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
                              onError={(e) => {
                                console.error('[EditImage] Output image failed to load:', {
                                  src: outputs[selectedFeature],
                                  selectedFeature,
                                  error: e
                                });
                              }}
                              onLoad={() => {
                                console.log('[EditImage] Output image loaded successfully:', {
                                  src: outputs[selectedFeature],
                                  selectedFeature
                                });
                              }}
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
                       // Zoom mode (all features)
                        <div
                          ref={imageContainerRef}
                          className={`w-full h-full relative cursor-move select-none ${selectedFeature === 'live-chat' ? 'min-h-[24rem] md:min-h-[35rem] lg:min-h-[45rem]' : 'min-h-[24rem] md:min-h-[35rem] lg:min-h-[45rem]'}`}
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
                              console.log('[EditImage] Zoom mode output image loaded:', {
                                src: outputs[selectedFeature],
                                selectedFeature,
                                dimensions: { width: img.naturalWidth, height: img.naturalHeight }
                              });
                            }}
                            onError={(e) => {
                              console.error('[EditImage] Zoom mode output image failed to load:', {
                                src: outputs[selectedFeature],
                                selectedFeature,
                                error: e
                              });
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
                      className={`w-full h-full relative cursor-move select-none ${selectedFeature === 'live-chat' ? 'min-h-[24rem] md:min-h-[35rem] lg:min-h-[45rem]' : 'min-h-[24rem] md:min-h-[35rem] lg:min-h-[45rem]'}`}
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
                          console.log('[EditImage] No-input mode output image loaded:', {
                            src: outputs[selectedFeature],
                            selectedFeature,
                            dimensions: { width: img.naturalWidth, height: img.naturalHeight }
                          });
                        }}
                        onError={(e) => {
                          console.error('[EditImage] No-input mode output image failed to load:', {
                            src: outputs[selectedFeature],
                            selectedFeature,
                            error: e
                          });
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
                <div className={`w-full h-full flex items-center justify-center ${selectedFeature === 'live-chat' ? 'min-h-[24rem] md:min-h-[35rem] lg:min-h-[45rem]' : 'min-h-[24rem] md:min-h-[35rem] lg:min-h-[45rem]'}`}>
                  {inputs[selectedFeature] ? (
                    <div className="absolute inset-0">
                      <Image
                        src={inputs[selectedFeature] as string} 
                        alt="Input" 
                        fill 
                        className="object-contain object-center"
                        onLoad={(e) => {
                          if (selectedFeature === 'expand') {
                            const img = e.target as HTMLImageElement;
                            setExpandOriginalSize({ width: img.naturalWidth, height: img.naturalHeight });
                            setInputNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                            // Trigger canvas redraw after a short delay to ensure container is ready
                            setTimeout(() => {
                              drawExpandCanvas();
                            }, 100);
                          } else {
                            const img = e.target as HTMLImageElement;
                            setInputNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                          }
                        }}
                      />
                      {selectedFeature === 'expand' && expandOriginalSize.width > 0 && (
                        <div ref={expandContainerRef} className="absolute inset-0 z-10">
                          <canvas
                            ref={expandCanvasRef}
                            className="absolute inset-0 w-full h-full"
                            style={{ 
                              pointerEvents: 'auto', 
                              userSelect: 'none',
                              cursor: (expandResizing || expandHoverEdge) === 'left' || (expandResizing || expandHoverEdge) === 'right' 
                                ? 'ew-resize' 
                                : (expandResizing || expandHoverEdge) === 'top' || (expandResizing || expandHoverEdge) === 'bottom' 
                                  ? 'ns-resize' 
                                  : (expandResizing || expandHoverEdge) === 'move' 
                                    ? 'move' 
                                    : 'default'
                            }}
                            onMouseDown={handleExpandMouseDown}
                            onMouseMove={handleExpandMouseMove}
                            onMouseUp={handleExpandMouseUp}
                            onMouseLeave={handleExpandMouseUp}
                          />
                        </div>
                      )}
                      {(selectedFeature === 'fill' || selectedFeature === 'erase' || selectedFeature === 'reimagine' || (selectedFeature === 'remove-bg' && String(model).startsWith('bria/eraser'))) && (
                        <div ref={fillContainerRef} className="absolute inset-0 z-10">
                          {/* Reimagine: Selection Mode Toggle */}
                          {/* Reimagine: Selection Mode Toggle - Floating Dock (Rectangle Only) */}
                          {selectedFeature === 'reimagine' && !reimagineSelectionConfirmed && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-black/60 backdrop-blur-xl rounded-full p-1.5 border border-white/10 shadow-2xl transition-all hover:bg-black/70">
                              <button
                                onClick={() => {
                                  setReimagineSelectionMode('rectangle');
                                  setReimagineLiveBounds(null);
                                  setReimagineSelectionBounds(null);
                                  setHasMask(false);
                                  setRectangleStart(null);
                                  setRectangleCurrent(null);
                                  const ctx = fillCanvasRef.current?.getContext('2d');
                                  if (ctx && fillContainerRef.current) {
                                    const rect = fillContainerRef.current.getBoundingClientRect();
                                    ctx.clearRect(0, 0, rect.width, rect.height);
                                  }
                                }}
                                className={`p-2.5 rounded-full transition-all duration-200 group relative bg-white text-black shadow-lg`}
                                title="Selection Tool"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                </svg>
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  Selection Tool
                                </span>
                              </button>
                            </div>
                          )}
                          
                          <canvas
                            ref={fillCanvasRef}
                            className="absolute inset-0 w-full h-full touch-none"
                            style={{ 
                              pointerEvents: selectedFeature === 'reimagine' && reimagineSelectionConfirmed ? 'none' : 'auto', 
                              userSelect: 'none',
                              backgroundColor: 'transparent',
                              mixBlendMode: 'normal',
                              cursor: selectedFeature === 'reimagine' && reimagineSelectionMode === 'rectangle' 
                                ? (isDrawingRectangle ? 'crosshair' : (reimagineLiveBounds || reimagineSelectionBounds ? 'move' : 'crosshair'))
                                : 'crosshair'
                            }}
                            onMouseDown={(e) => { 
                              if (selectedFeature === 'reimagine' && reimagineSelectionConfirmed) return;
                              e.preventDefault();
                              const p = pointFromMouseEvent(e);
                              
                              if (selectedFeature === 'reimagine' && reimagineSelectionMode === 'rectangle') {
                                // Check if clicking inside existing selection
                                const bounds = reimagineLiveBounds || reimagineSelectionBounds;
                                if (bounds && 
                                    p.x >= bounds.x && p.x <= bounds.x + bounds.width &&
                                    p.y >= bounds.y && p.y <= bounds.y + bounds.height) {
                                  // Start dragging
                                  setIsDraggingSelection(true);
                                  setDragStart({ x: p.x - bounds.x, y: p.y - bounds.y });
                                } else {
                                  // Start drawing new rectangle
                                  setIsDrawingRectangle(true);
                                  setRectangleStart(p);
                                  setRectangleCurrent(p);
                                  setReimagineLiveBounds(null);
                                  setReimagineSelectionBounds(null);
                                  setHasMask(false);
                                  // Clear canvas
                                  const ctx = fillCanvasRef.current?.getContext('2d');
                                  if (ctx && fillContainerRef.current) {
                                    const rect = fillContainerRef.current.getBoundingClientRect();
                                    ctx.clearRect(0, 0, rect.width, rect.height);
                                  }
                                }
                              } else {
                                // Brush mode or other features
                                beginMaskStroke(p.x, p.y);
                              }
                            }}
                            onMouseMove={(e) => {
                              if (selectedFeature === 'reimagine' && reimagineSelectionConfirmed) return;
                              e.preventDefault();
                              const p = pointFromMouseEvent(e);
                              
                              if (selectedFeature === 'reimagine' && reimagineSelectionMode === 'rectangle') {
                                if (isDraggingSelection && dragStart && (reimagineLiveBounds || reimagineSelectionBounds)) {
                                  // Dragging existing selection
                                  const bounds = reimagineLiveBounds || reimagineSelectionBounds;
                                  if (bounds) {
                                    const containerWidth = fillContainerRef.current?.getBoundingClientRect().width || 0;
                                    const containerHeight = fillContainerRef.current?.getBoundingClientRect().height || 0;
                                    const newX = Math.max(0, Math.min(p.x - dragStart.x, containerWidth - bounds.width));
                                    const newY = Math.max(0, Math.min(p.y - dragStart.y, containerHeight - bounds.height));
                                    setReimagineLiveBounds({
                                      x: newX,
                                      y: newY,
                                      width: bounds.width,
                                      height: bounds.height
                                    });
                                    // Update canvas mask - Do NOT draw white fill
                                    const ctx = fillCanvasRef.current?.getContext('2d');
                                    if (ctx) {
                                      ctx.clearRect(0, 0, containerWidth, containerHeight);
                                    }
                                  }
                                } else if (isDrawingRectangle && rectangleStart) {
                                  // Drawing new rectangle
                                  setRectangleCurrent(p);
                                  const bounds = {
                                    x: Math.min(rectangleStart.x, p.x),
                                    y: Math.min(rectangleStart.y, p.y),
                                    width: Math.abs(p.x - rectangleStart.x),
                                    height: Math.abs(p.y - rectangleStart.y)
                                  };
                                  setReimagineLiveBounds(bounds);
                                }
                              } else {
                                // Brush mode
                                continueMaskStroke(p.x, p.y);
                              }
                            }}
                            onMouseUp={(e) => {
                              if (selectedFeature === 'reimagine' && reimagineSelectionConfirmed) return;
                              e.preventDefault();
                              
                              if (selectedFeature === 'reimagine' && reimagineSelectionMode === 'rectangle') {
                                if (isDraggingSelection) {
                                  setIsDraggingSelection(false);
                                  setDragStart(null);
                                  // Finalize dragged position
                                  if (reimagineLiveBounds) {
                                    setReimagineSelectionBounds(reimagineLiveBounds);
                                  }
                              } else if (isDrawingRectangle && rectangleStart && rectangleCurrent) {
                                  setIsDrawingRectangle(false);
                                  // Finalize rectangle
                                  let bounds = {
                                    x: Math.min(rectangleStart.x, rectangleCurrent.x),
                                    y: Math.min(rectangleStart.y, rectangleCurrent.y),
                                    width: Math.abs(rectangleCurrent.x - rectangleStart.x),
                                    height: Math.abs(rectangleCurrent.y - rectangleStart.y)
                                  };

                                  // Check for Tap (very small movement) -> Create 1024x1024 selection
                                  const dist = Math.sqrt(Math.pow(rectangleCurrent.x - rectangleStart.x, 2) + Math.pow(rectangleCurrent.y - rectangleStart.y, 2));
                                  if (dist < 10) {
                                    // It's a tap! Create 1024x1024 selection centered on tap
                                    const container = fillContainerRef.current;
                                    const canvas = fillCanvasRef.current;
                                    if (container && canvas && inputNaturalSize.width > 0) {
                                      const rect = container.getBoundingClientRect();
                                      
                                      // Calculate actual rendered image dimensions (object-contain)
                                      const imgAspect = inputNaturalSize.width / inputNaturalSize.height;
                                      const containerAspect = rect.width / rect.height;
                                      
                                      let renderWidth, renderHeight; // offsetX, offsetY not needed for scale, but needed for bounds clamping if we were strict
                                      
                                      if (containerAspect > imgAspect) {
                                        // Container is wider than image - image is height-constrained
                                        renderHeight = rect.height;
                                        renderWidth = rect.height * imgAspect;
                                      } else {
                                        // Container is taller than image - image is width-constrained
                                        renderWidth = rect.width;
                                        renderHeight = rect.width / imgAspect;
                                      }
                                      
                                      // Uniform scale factor
                                      const scale = renderWidth / inputNaturalSize.width;
                                      
                                      // Target size in canvas pixels (representing 1024x1024 on image)
                                      const targetSize = 1024 * scale;
                                      
                                      // Center on tap location (rectangleStart)
                                      let newX = rectangleStart.x - (targetSize / 2);
                                      let newY = rectangleStart.y - (targetSize / 2);
                                      
                                      // Clamp to canvas bounds (allowing it to go into letterboxed area is fine, 
                                      // but ideally we clamp to the image area? For now clamp to canvas/container)
                                      newX = Math.max(0, Math.min(newX, rect.width - targetSize));
                                      newY = Math.max(0, Math.min(newY, rect.height - targetSize));
                                      
                                      bounds = {
                                        x: newX,
                                        y: newY,
                                        width: targetSize,
                                        height: targetSize
                                      };
                                    }
                                  }

                                  if (bounds.width > 10 && bounds.height > 10) {
                                    setReimagineLiveBounds(bounds);
                                    setReimagineSelectionBounds(bounds);
                                    // Do NOT draw white fill on canvas
                                    const ctx = fillCanvasRef.current?.getContext('2d');
                                    if (ctx) {
                                      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                                      setHasMask(true);
                                    }
                                  }
                                  setRectangleStart(null);
                                  setRectangleCurrent(null);
                                }
                              } else {
                                // Brush mode
                                endMaskStroke();
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedFeature === 'reimagine' && reimagineSelectionConfirmed) return;
                              e.preventDefault();
                              
                              if (selectedFeature === 'reimagine' && reimagineSelectionMode === 'rectangle') {
                                if (isDraggingSelection) {
                                  setIsDraggingSelection(false);
                                  setDragStart(null);
                                  if (reimagineLiveBounds) {
                                    setReimagineSelectionBounds(reimagineLiveBounds);
                                  }
                                }
                                if (isDrawingRectangle) {
                                  setIsDrawingRectangle(false);
                                  setRectangleStart(null);
                                  setRectangleCurrent(null);
                                }
                              } else {
                                endMaskStroke();
                              }
                            }}
                            onTouchStart={(e) => {
                              if (selectedFeature === 'reimagine' && reimagineSelectionConfirmed) return;
                              // e.preventDefault(); // Removed to fix passive event listener error; touch-action: none handles this
                              const p = pointFromTouchEvent(e);
                              if (selectedFeature === 'reimagine' && reimagineSelectionMode === 'rectangle') {
                                const bounds = reimagineLiveBounds || reimagineSelectionBounds;
                                if (bounds && 
                                    p.x >= bounds.x && p.x <= bounds.x + bounds.width &&
                                    p.y >= bounds.y && p.y <= bounds.y + bounds.height) {
                                  setIsDraggingSelection(true);
                                  setDragStart({ x: p.x - bounds.x, y: p.y - bounds.y });
                                } else {
                                  setIsDrawingRectangle(true);
                                  setRectangleStart(p);
                                  setRectangleCurrent(p);
                                }
                              } else {
                                beginMaskStroke(p.x, p.y);
                              }
                            }}
                            onTouchMove={(e) => {
                              if (selectedFeature === 'reimagine' && reimagineSelectionConfirmed) return;
                              // e.preventDefault(); // Removed to fix passive event listener error
                              const p = pointFromTouchEvent(e);
                              if (selectedFeature === 'reimagine' && reimagineSelectionMode === 'rectangle') {
                                if (isDraggingSelection && dragStart && (reimagineLiveBounds || reimagineSelectionBounds)) {
                                  const bounds = reimagineLiveBounds || reimagineSelectionBounds;
                                  const containerWidth = fillContainerRef.current?.getBoundingClientRect().width || 0;
                                  const containerHeight = fillContainerRef.current?.getBoundingClientRect().height || 0;
                                  if (bounds) {
                                    const newX = Math.max(0, Math.min(p.x - dragStart.x, containerWidth - bounds.width));
                                    const newY = Math.max(0, Math.min(p.y - dragStart.y, containerHeight - bounds.height));
                                    setReimagineLiveBounds({ x: newX, y: newY, width: bounds.width, height: bounds.height });
                                    // Do NOT draw white fill on canvas
                                    const ctx = fillCanvasRef.current?.getContext('2d');
                                    if (ctx) {
                                      ctx.clearRect(0, 0, containerWidth, containerHeight);
                                    }
                                  }
                                } else if (isDrawingRectangle && rectangleStart) {
                                  setRectangleCurrent(p);
                                  const bounds = {
                                    x: Math.min(rectangleStart.x, p.x),
                                    y: Math.min(rectangleStart.y, p.y),
                                    width: Math.abs(p.x - rectangleStart.x),
                                    height: Math.abs(p.y - rectangleStart.y)
                                  };
                                  setReimagineLiveBounds(bounds);
                                }
                              } else {
                                continueMaskStroke(p.x, p.y);
                              }
                            }}
                            onTouchEnd={(e) => {
                              if (selectedFeature === 'reimagine' && reimagineSelectionConfirmed) return;
                              // e.preventDefault(); // Removed to fix passive event listener error
                              
                              if (selectedFeature === 'reimagine' && reimagineSelectionMode === 'rectangle') {
                                if (isDraggingSelection) {
                                  setIsDraggingSelection(false);
                                  setDragStart(null);
                                  if (reimagineLiveBounds) setReimagineSelectionBounds(reimagineLiveBounds);
                                } else if (isDrawingRectangle && rectangleStart && rectangleCurrent) {
                                  setIsDrawingRectangle(false);
                                  // Finalize rectangle
                                  let bounds = {
                                    x: Math.min(rectangleStart.x, rectangleCurrent.x),
                                    y: Math.min(rectangleStart.y, rectangleCurrent.y),
                                    width: Math.abs(rectangleCurrent.x - rectangleStart.x),
                                    height: Math.abs(rectangleCurrent.y - rectangleStart.y)
                                  };

                                  // Check for Tap (very small movement) -> Create 1024x1024 selection
                                  const dist = Math.sqrt(Math.pow(rectangleCurrent.x - rectangleStart.x, 2) + Math.pow(rectangleCurrent.y - rectangleStart.y, 2));
                                  if (dist < 10) {
                                    // It's a tap! Create 1024x1024 selection centered on tap
                                    const container = fillContainerRef.current;
                                    const canvas = fillCanvasRef.current;
                                    if (container && canvas && inputNaturalSize.width > 0) {
                                      const rect = container.getBoundingClientRect();
                                      
                                      // Calculate actual rendered image dimensions (object-contain)
                                      const imgAspect = inputNaturalSize.width / inputNaturalSize.height;
                                      const containerAspect = rect.width / rect.height;
                                      
                                      let renderWidth, renderHeight;
                                      
                                      if (containerAspect > imgAspect) {
                                        // Container is wider than image - image is height-constrained
                                        renderHeight = rect.height;
                                        renderWidth = rect.height * imgAspect;
                                      } else {
                                        // Container is taller than image - image is width-constrained
                                        renderWidth = rect.width;
                                        renderHeight = rect.width / imgAspect;
                                      }
                                      
                                      // Uniform scale factor
                                      const scale = renderWidth / inputNaturalSize.width;
                                      
                                      // Target size in canvas pixels (representing 1024x1024 on image)
                                      const targetSize = 1024 * scale;
                                      
                                      // Center on tap location (rectangleStart)
                                      let newX = rectangleStart.x - (targetSize / 2);
                                      let newY = rectangleStart.y - (targetSize / 2);
                                      
                                      // Clamp to canvas bounds
                                      newX = Math.max(0, Math.min(newX, rect.width - targetSize));
                                      newY = Math.max(0, Math.min(newY, rect.height - targetSize));
                                      
                                      bounds = {
                                        x: newX,
                                        y: newY,
                                        width: targetSize,
                                        height: targetSize
                                      };
                                    }
                                  }

                                  if (bounds.width > 10 && bounds.height > 10) {
                                    setReimagineLiveBounds(bounds);
                                    setReimagineSelectionBounds(bounds);
                                    const ctx = fillCanvasRef.current?.getContext('2d');
                                    if (ctx) {
                                      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                                      setHasMask(true);
                                    }
                                  }
                                  setRectangleStart(null);
                                  setRectangleCurrent(null);
                                }
                              } else {
                                endMaskStroke();
                              }
                            }}
                          />
                          
                          {/* Reimagine: Visual Selection Feedback */}
                          {selectedFeature === 'reimagine' && (reimagineLiveBounds || reimagineSelectionBounds) && (
                            <>
                              {/* Dark overlay on non-selected areas - Removed gradient, using box-shadow on selection box instead for linearity */}
                              
                              {/* Selection Bounding Box Border */}
                              {(reimagineLiveBounds || reimagineSelectionBounds) && (
                                <div
                                  className="absolute pointer-events-none z-16 border border-white/50 rounded-lg transition-all duration-200"
                                  style={{
                                    left: `${(reimagineLiveBounds || reimagineSelectionBounds)?.x || 0}px`,
                                    top: `${(reimagineLiveBounds || reimagineSelectionBounds)?.y || 0}px`,
                                    width: `${(reimagineLiveBounds || reimagineSelectionBounds)?.width || 0}px`,
                                    height: `${(reimagineLiveBounds || reimagineSelectionBounds)?.height || 0}px`,
                                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)', // Darken outside
                                  }}
                                >
                                  {/* Minimalist Corner Handles */}
                                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                                  
                                  {/* Animated border effect - Linear Shadow (Clean Border) */}
                                  <div className="absolute inset-0 border border-white/80 rounded-lg shadow-none" />
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Reimagine: Confirm Selection Button - Removed in favor of direct prompt interaction */}
                          {selectedFeature === 'reimagine' && hasMask && !reimagineSelectionConfirmed && (
                             <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
                               <button
                                 onClick={() => {
                                   setReimagineSelectionConfirmed(true);
                                 }}
                                 className="px-6 py-2.5 bg-white text-black hover:bg-gray-100 rounded-full shadow-xl font-medium transition-all transform hover:scale-105 flex items-center gap-2"
                               >
                                 <span>Continue</span>
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                   <path d="M5 12h14"></path>
                                   <path d="m12 5 7 7-7 7"></path>
                                 </svg>
                               </button>
                             </div>
                           )}
                          
                          {/* Reimagine: Floating Prompt Input - Clean Glassmorphism */}
                          {selectedFeature === 'reimagine' && reimagineSelectionConfirmed && reimagineSelectionBounds && (
                            <div
                              className="absolute z-20 w-full max-w-2xl left-1/2 -translate-x-1/2"
                              style={{
                                top: `${Math.min(reimagineSelectionBounds.y + reimagineSelectionBounds.height + 20, (fillContainerRef.current?.getBoundingClientRect().height || 800) - 100)}px`,
                              }}
                            >
                              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                <div className="pl-3 text-purple-400">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={processing.reimagine ? "animate-spin" : ""}>
                                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
                                  </svg>
                                </div>
                                
                                {/* Model Selector - Compact */}
                                <select
                                  value={reimagineModel}
                                  onChange={(e) => setReimagineModel(e.target.value as 'auto' | 'nano-banana' | 'seedream-4k')}
                                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 outline-none cursor-pointer transition-colors"
                                  title="AI Model"
                                >
                                  <option value="auto" className="bg-gray-900">🚀 Auto (Recommended)</option>
                                  <option value="nano-banana" className="bg-gray-900">⚡ Nano (Fast, ≤1024px)</option>
                                  <option value="seedream-4k" className="bg-gray-900">✨ Seedream 4K (Quality)</option>
                                </select>

                                <input
                                  type="text"
                                  value={reimaginePrompt}
                                  onChange={(e) => setReimaginePrompt(e.target.value)}
                                  placeholder="Describe the change..."
                                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 h-10 text-sm font-medium"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && reimaginePrompt.trim() && !processing.reimagine) {
                                      handleRun();
                                    }
                                  }}
                                />
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setReimagineSelectionConfirmed(false);
                                      setReimaginePrompt('');
                                      setReimagineSelectionBounds(null);
                                      const ctx = fillCanvasRef.current?.getContext('2d');
                                      if (ctx && fillContainerRef.current) {
                                        const rect = fillContainerRef.current.getBoundingClientRect();
                                        ctx.clearRect(0, 0, rect.width, rect.height);
                                        setHasMask(false);
                                      }
                                    }}
                                    className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                                    title="Cancel"
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M18 6 6 18"></path>
                                      <path d="m6 6 12 12"></path>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={handleRun}
                                    disabled={!reimaginePrompt.trim() || processing.reimagine}
                                    className="p-2 bg-white text-black rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Generate"
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 12h14"></path>
                                      <path d="m12 5 7 7-7 7"></path>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
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
                      <span className="text-xs">Drop image here or click to upload</span>
                    </button>
                    )}
                </div>
              )}
              {/* Live Chat thumbnails moved to the right-side preview area (avoid duplicate thumbnails inside output container) */}
              {/* Fill mask overlay moved to input area */}
              {processing[selectedFeature] && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                  <img src="/styles/Logo.gif" alt="Generating..." className="w-32 h-32 md:w-48 md:h-48 opacity-90" />
                </div>
              )}
            </div>

            {/* Live Chat: Right-side thumbnail column (generated images then input) */}
            {selectedFeature === 'live-chat' && (
              <div className="px-4 mt-0">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 h-[24rem] md:h-[35rem] lg:h-[45rem] very-thin-scrollbar overflow-y-auto">
                  <div className="flex flex-col items-end gap-3 pr-1">
                    {/* Generated images (latest first) */}
                    {(liveHistory || []).slice().reverse().map((url, revIdx) => {
                      // revIdx 0 is latest; compute original index
                      const origIdx = liveHistory.length - 1 - revIdx;
                      const isActive = outputs['live-chat'] === url && activeLiveIndex === origIdx;
                      return (
                        <button
                          key={`gen-${origIdx}-${url}`}
                          onClick={() => {
                            setActiveLiveIndex(origIdx);
                            setOutputs((prev) => ({ ...prev, ['live-chat']: url }));
                            setInputs((prev) => ({ ...prev, ['live-chat']: url }));
                          }}
                          className={`bg-white/5 rounded-xl border p-2 w-36 h-36 overflow-hidden ${isActive ? 'border-white' : 'border-white/20 hover:border-white/40'}`}
                          title={`Generation ${origIdx + 1}`}
                        >
                          <img src={url} alt={`Gen ${origIdx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}

                    {/* Input image thumbnail shown below generated images if present and not duplicate */}
                    {(liveOriginalInput || inputs['live-chat']) && (
                      (() => {
                        const inputUrl = (liveOriginalInput || inputs['live-chat']) as string;
                        const alreadyShown = liveHistory.length > 0 && liveHistory[liveHistory.length - 1] === inputUrl;
                        if (alreadyShown) return null;
                        const isActiveInput = outputs['live-chat'] === inputUrl && activeLiveIndex === -1;
                        return (
                          <button
                            key={`input-thumb`}
                            onClick={() => {
                              setActiveLiveIndex(-1);
                              setOutputs((prev) => ({ ...prev, ['live-chat']: inputUrl }));
                              setInputs((prev) => ({ ...prev, ['live-chat']: inputUrl }));
                            }}
                            className={`bg-white/5 rounded-xl border p-2 w-36 h-36 overflow-hidden ${isActiveInput ? 'border-white' : 'border-white/20 hover:border-white/40'}`}
                            title={`Input image`}
                          >
                            <img src={inputUrl} alt={`Input`} className="w-full h-full object-cover" />
                          </button>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <style jsx global>{`
            .very-thin-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: rgba(255,255,255,0.12) transparent;
            }
            .very-thin-scrollbar::-webkit-scrollbar {
              width: 4px;
              height: 4px;
            }
            .very-thin-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.12);
              border-radius: 999px;
              border: 1px solid rgba(255,255,255,0.02);
            }
            .very-thin-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            /* Note: global scrollbar hiding removed so browser shows scrollbar only when content overflows */
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default EditImageInterface;
