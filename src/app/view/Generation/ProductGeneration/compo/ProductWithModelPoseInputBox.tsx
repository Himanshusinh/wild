'use client';

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { HistoryEntry } from '@/types/history';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  setPrompt
} from '@/store/slices/generationSlice';
import { bflGenerate, falGenerate } from '@/store/slices/generationsApi';
import { 
  toggleDropdown, 
  addNotification 
} from '@/store/slices/uiSlice';
import { useGenerationCredits } from '@/hooks/useCredits';
import { 
  loadMoreHistory,
  loadHistory,
} from "@/store/slices/historySlice";
// Frontend history writes removed; rely on backend history service
const updateFirebaseHistory = async (_id: string, _updates: any) => { };
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
// No-op action creators to satisfy existing dispatch calls without affecting store
const updateHistoryEntry = (_: any) => ({ type: 'history/noop' } as any);
const addHistoryEntry = (_: any) => ({ type: 'history/noop' } as any);

// Import the product-specific components
import ModelsDropdown from './ModelsDropdown';
import UploadProductButton from './UploadProductButton';
import UploadModelButton from './UploadModelButton';
import FrameSizeButton from './FrameSizeButton';
import ImageCountButton from './ImageCountButton';
import ProductImagePreview from './ProductImagePreview';
import GenerationModeDropdown from './GenerationModeDropdown';

const ProductWithModelPoseInputBox = () => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const prompt = useAppSelector((state: any) => state.generation?.prompt || '');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-kontext-dev');
  const imageCount = useAppSelector((state: any) => state.generation?.imageCount || 1);
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const isGenerating = useAppSelector((state: any) => state.generation?.isGenerating || false);
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const loading = useAppSelector((state: any) => state.history?.loading || false);
  const hasMore = useAppSelector((state: any) => state.history?.hasMore ?? true);
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');

  // Credits management
  const {
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    creditBalance,
    clearCreditsError,
  } = useGenerationCredits('image', selectedModel, {
    frameSize: frameSize,
    count: imageCount,
  });

  // Local state for preview modal
  const [previewEntry, setPreviewEntry] = useState<HistoryEntry | null>(null);
  
  // Local, ephemeral entry to mimic history-style preview while generating
  const [localGeneratingEntries, setLocalGeneratingEntries] = useState<HistoryEntry[]>([]);
  
  // Local state to track generation status for button text
  const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);

  // Product and model image states
  const [productImage, setProductImage] = useState<string | null>(null);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<string>('product-only');

  // Auto-clear local preview after it has completed/failed and backend history refresh kicks in
  useEffect(() => {
    const entry = localGeneratingEntries[0] as any;
    if (!entry) return;
    if (entry.status === 'completed' || entry.status === 'failed') {
      const timer = setTimeout(() => setLocalGeneratingEntries([]), 1500);
      return () => clearTimeout(timer);
    }
  }, [localGeneratingEntries]);

  // Auto-set generation mode based on selected model
  useEffect(() => {
    if (!selectedModel) return; // Don't run if selectedModel is not set yet
    
    console.log('🔄 Model changed to:', selectedModel);
    // All Flux models support both product-only and product-with-model modes
    // Default to product-only for easier user experience
    setGenerationMode('product-only');
    console.log('✅ Set generation mode to: product-only');
  }, [selectedModel]);

  // Load product-generation history on mount
  useEffect(() => {
    dispatch(loadHistory({ 
      filters: { generationType: 'product-generation' }, 
      paginationParams: { limit: 50 } 
    }));
  }, [dispatch]);

  // IntersectionObserver-based infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const hasUserScrolledRef = useRef(false);

  useEffect(() => {
    const onScroll = () => { hasUserScrolledRef.current = true; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll as any);
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      if (!hasUserScrolledRef.current) return;
      if (!hasMore || loading || loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      try {
        await (dispatch as any)(loadMoreHistory({ 
          filters: { generationType: 'product-generation' }, 
          paginationParams: { limit: 10 } 
        })).unwrap();
      } catch (e) {
        console.error('[Product] IO loadMore error', e);
      } finally {
        loadingMoreRef.current = false;
      }
    }, { root: null, threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, dispatch]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Set local generation state immediately
    setIsGeneratingLocally(true);

    // Clear any previous credit errors
    clearCreditsError();

    // Validate and reserve credits before generation
    let transactionId: string;
    try {
      const creditResult = await validateAndReserveCredits();
      transactionId = creditResult.transactionId;
      console.log('✅ Credits reserved for product generation:', creditResult);
    } catch (creditError: any) {
      console.error('❌ Credit validation failed:', creditError);
      dispatch(addNotification({
        type: 'error',
        message: creditError.message || 'Insufficient credits for generation'
      }));
      setIsGeneratingLocally(false);
      return;
    }
    
    // Validate required inputs based on generation mode
    if (generationMode === 'product-with-model') {
      if (!productImage || !modelImage) {
        dispatch(addNotification({ type: 'error', message: 'Both product image and model image are required for product with model pose generation' }));
        setIsGeneratingLocally(false);
        return;
      }
    }

    // Create local preview entry immediately
    const loadingEntry: HistoryEntry = {
      id: `loading-${Date.now()}`,
      prompt: `Product: ${prompt}`,
      model: selectedModel,
      generationType: 'product-generation',
      images: Array.from({ length: imageCount }, (_, index) => ({
        id: `loading-${index}`,
        url: '',
        originalUrl: ''
      })),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: imageCount,
      status: 'generating'
    };

    // Set local preview to show loading frames immediately
    setLocalGeneratingEntries([loadingEntry]);

    try {
      let result;
      
      // Use Flux API for product generation
      let backendPrompt;
      
      if (generationMode === 'product-with-model') {
        // Product with model pose case
         backendPrompt =
`
Use the provided reference MODEL IMAGE as the main subject.

MODEL FIDELITY — KEEP IDENTITY EXACT:
• Match 1:1 the model’s face geometry, skin tone, age appearance, body proportions, height, gender, hairstyle/hairline, facial hair, eye color, and distinctive facial features.
• Do NOT alter ethnicity, age, gender, face structure, or body shape. Do NOT beautify, slim, liquify, or morph.
• Do NOT add/remove tattoos, scars, moles, piercings, or accessories unless explicitly requested in ${prompt}.

Create a professional product photograph featuring: ${prompt}.

PRODUCT INTERACTION & FIT (if wearable/held):
• Wearables (clothing, eyewear, footwear, jewelry, bags): correct fit and physics — natural drape, proper strap tension, no cloth/body clipping, believable weight and stretch.
• Handheld/usage: natural grip and finger count, accurate finger placement, no occlusion of the key product details.
• The product is the HERO: true scale, exact color, correct materials/textures (leather grain, knit weave, brushed metal, glass reflections); crisp branding if allowed.

PHOTOGRAPHY DIRECTION (studio-grade):
• Composition: product-forward hero framing; keep the model’s face intact and recognizable; safe margins for crops.
• Posing: confident, relaxed, non-exaggerated; do not block the product.
• Lighting: soft three-point studio setup (soft key, gentle fill, subtle rim); controlled highlights, clean speculars, natural shadows; avoid blown whites/crushed blacks.
• Background: e-commerce neutral (white/off-white/light gray). Only use lifestyle/background scenery if explicitly requested in ${prompt} and keep it minimal.
• Focus & Detail: tack-sharp edges; show stitching, seams, fasteners (zips, buttons, buckles) and surface micro-texture.
• Color Accuracy: neutral white balance; no unwanted casts; reproduce exact product color.

REALISM & QUALITY:
• Physically plausible shadows/reflections, consistent perspective, natural contact points—no floating.
• High resolution; clean edges; centered, stable geometry.

OUTPUT INTENT:
• Editorial yet commercial product image suitable for e-commerce and ads.
• No extra props unless they directly support the product.
• No text, no watermarks, no frames, no stickers, no overlays.

ANGLE PRIORITY (if multiple views are requested): front hero → 3/4 view → macro texture/detail → functional detail (zip/closure/port) → interior (bags/shoes/jackets). Maintain the SAME MODEL IDENTITY across all views.

NEGATIVE PROMPT — AVOID:
blurry, low-res, pixelation, JPEG artifacts, over/underexposed, heavy vignette, color cast, banding, posterization, text, watermark, borders, stickers, extra/missing/fused fingers, warped hands, twisted wrists, broken anatomy, distorted/changed face, altered age/gender/ethnicity, beautified/liquified/slimmed body, fake fabric physics, clipping, rubbery leather, melted metal, incorrect reflections, unrealistic shadows, floating product, mismatched perspective, busy/cluttered background, extreme fisheye, unrealistic DoF, neon oversaturation.

MODEL TUNING HINTS (for generators):
• Tags: studio lighting, photoreal, high-detail, calibrated color, e-commerce.
• Optional EXIF flavor: 50–85mm portrait, f/5.6–8, ISO 100–200, softbox key.
`.trim();

      } else {
        // Product-only case
         backendPrompt =
`
Create a professional lifestyle product photograph of: ${prompt}.  
Goal: authentic, attractive product presentation that feels natural and aspirational.

PHOTOGRAPHY DIRECTION (lifestyle-grade):
• Composition: product is hero but integrated into a natural setting; keep clear visibility of key features while showing real context.  
• Background: genuine, realistic environment appropriate to the product (e.g. living room, kitchen, office desk, street, café, gym, studio, outdoors). Background should feel authentic, not stock or artificial.  
• Props: only tasteful, relevant props that enhance realism and context (e.g. coffee cup on desk for a laptop, notebook for a pen, shoes on pavement). No clutter or distractions.  
• Lighting: natural or styled to fit the scene (soft daylight, window light, warm ambient indoor light, or dramatic accent if product suits). Ensure accurate product colors with controlled highlights/shadows.  
• Angles: front hero or 3/4 preferred, with environment providing depth. Use shallow depth of field if it supports realism but keep the product tack-sharp.  

MATERIALS & DETAILS:
• Show true textures (leather grain, fabric weave, glass clarity, brushed metal).  
• Keep product colors accurate, no color cast.  
• Ensure realistic scale and perspective, with natural contact shadows/reflections on surfaces.  

OUTPUT INTENT:
• Marketing-quality product photo for ads, lifestyle websites, and social media.  
• Engaging, aspirational, and realistic — feels like genuine photography.  
• No watermarks, text overlays, frames, borders, or artificial mockups.  

NEGATIVE PROMPT — AVOID:
clean white cutout backgrounds, sterile studio shots, fake 3D renders, floating products, cartoonish look, unrealistic props, over-saturated neon colors, heavy vignette, stock-photo clichés, messy or cluttered environment, warped geometry, blurry focus on product, pixelation, text, stickers, watermarks.

GENERATOR HINTS:
• Tags: lifestyle photography, photoreal, commercial advertising, natural lighting, high detail.  
• Optional EXIF flavor: 35–50mm lens, f/2.8–4 for shallow DOF, ISO 200–400, daylight or warm indoor light.
`.trim();

      }
      
      if (selectedModel === 'gemini-25-flash-image') {
        // Route to FAL (Google Nano Banana) for product images with SSE streaming support
        const payload = {
          prompt: backendPrompt,
          model: selectedModel,
          n: imageCount,
          uploadedImages: generationMode === 'product-with-model'
            ? [productImage, modelImage].filter((img): img is string => img !== null)
            : [productImage].filter((img): img is string => img !== null),
          output_format: 'jpeg',
          generationType: 'product-generation',
        } as any;

        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const url = `${apiBase ? apiBase.replace(/\/$/, '') : ''}/api/fal/generate`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`FAL request failed: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        let aggregatedImages: any[] = [];

        if (contentType.includes('text/event-stream') && response.body) {
          // Stream SSE updates and progressively update local preview tiles
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const messages = buffer.split('\n\n');
            buffer = messages.pop() || '';

            for (const msg of messages) {
              const trimmed = msg.trim();
              const dataLine = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : null;
              if (!dataLine) continue;
              try {
                const evt = JSON.parse(dataLine);
                const incomingUrl = evt.imageUrl || evt.image_url || evt.url || null;
                if (incomingUrl) {
                  const imageObj = { id: `fal-${aggregatedImages.length}`, url: incomingUrl, originalUrl: incomingUrl };
                  aggregatedImages = [...aggregatedImages, imageObj];
                  setLocalGeneratingEntries(prev => prev.map(e => ({
                    ...e,
                    images: aggregatedImages.map((img: any) => ({ id: img.id, url: img.url, originalUrl: img.originalUrl }))
                  })));
                }
                if (evt.type === 'complete' && Array.isArray(evt.images)) {
                  aggregatedImages = evt.images;
                }
              } catch {
                // ignore parse errors
              }
            }
          }

          result = { images: aggregatedImages, historyId: undefined } as any;
        } else {
          // Fallback to JSON response if backend is not streaming
          const json = await response.json();
          result = (json?.data || json) as any;
        }
      } else {
        // Route to BFL (Flux models)
        result = await dispatch(bflGenerate({
          prompt: backendPrompt,
          model: selectedModel,
          n: imageCount,
          frameSize: frameSize,
          style: 'product',
          generationType: 'product-generation',
          uploadedImages: generationMode === 'product-with-model' ? 
            [productImage, modelImage].filter((img): img is string => img !== null) : 
            [productImage].filter((img): img is string => img !== null)
        })).unwrap();
      }

      if (!result.images) {
        throw new Error('No images received from Flux API');
      }

      // Create completed entry
      const completedEntry: HistoryEntry = {
        id: result.historyId || Date.now().toString(),
        prompt: `Product: ${prompt}`,
        model: selectedModel,
        generationType: 'product-generation',
        images: result.images,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: imageCount,
        status: 'completed',
        frameSize: frameSize,
        style: 'product'
      };

      // Update local preview to completed
      setLocalGeneratingEntries([completedEntry]);

      // Clear the prompt and images
      dispatch(setPrompt(''));
      setProductImage(null);
      setModelImage(null);

      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: `Successfully generated ${imageCount} product image${imageCount > 1 ? 's' : ''}!`
      }));

      // Handle credit success
      if (transactionId) {
        await handleGenerationSuccess(transactionId);
      }

      // Refresh history to show the new product
      dispatch(loadHistory({ 
        filters: { generationType: 'product-generation' }, 
        paginationParams: { limit: 10 } 
      }));

      // Reset local generation state
      setIsGeneratingLocally(false);

    } catch (error: any) {
      console.error('Product generation failed:', error);
      
      // Update local preview to failed
      setLocalGeneratingEntries(prev => prev.map(entry => ({
        ...entry,
        status: 'failed' as const,
        error: error.message || 'Generation failed'
      })));

      // Show error notification
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Product generation failed'
      }));

      // Handle credit failure
      if (transactionId) {
        await handleGenerationFailure(transactionId);
      }

      // Reset local generation state
      setIsGeneratingLocally(false);
    }
  };

  // Handle image preview
  const handleImageClick = (entry: HistoryEntry) => {
    setPreviewEntry(entry);
  };

  // Close preview modal
  const closePreview = () => setPreviewEntry(null);

  // Filter entries strictly for product-generation only
  const finalProductEntries = (historyEntries || []).filter((entry: any) => entry.generationType === 'product-generation');

  // Debug logging
  console.log('📦 Product Generation - All entries:', historyEntries.length);
  console.log('📦 Product Generation - Final entries:', finalProductEntries.length);
  console.log('📦 Product Generation - Sample entries:', historyEntries.slice(0, 3).map((e: any) => ({ 
    id: e.id, 
    generationType: e.generationType, 
    prompt: e.prompt?.substring(0, 50) + '...',
    style: e.style 
  })));

  // Group entries by date
  const groupedByDate = finalProductEntries.reduce((groups: { [key: string]: HistoryEntry[] }, entry: HistoryEntry) => {
    const date = new Date(entry.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Today key for local preview
  const todayKey = new Date().toDateString();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeDropdown &&
        !(event.target as HTMLElement).closest(".dropdown-container")
      ) {
        dispatch(toggleDropdown(""));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown, dispatch]);

  // Check if generation button should be enabled
  const canGenerate = (() => {
    const hasPrompt = prompt.trim().length > 0;
    const notGenerating = !isGeneratingLocally;
    
    // Don't enable if selectedModel is not set yet
    if (!selectedModel) {
      return false;
    }
    
    // All models now support description-only generation
    if (generationMode === 'product-with-model') {
      // For product-with-model mode, prompt, product image, and model image are required
      return hasPrompt && productImage && modelImage && notGenerating;
    } else {
      // For product-only mode, only prompt is required (description-only generation enabled)
      return hasPrompt && notGenerating;
    }
  })();

  return (
    <>
      <div className=" inset-0  pl-[0] pr-6 pb-6 overflow-y-auto no-scrollbar z-0">
        <div className="py-6 pl-4 ">
          {/* History Header - Fixed during scroll */}
          <div className="fixed top-0 mt-1 left-0 right-0 z-30 py-5 ml-18 mr-1 bg-white/10 backdrop-blur-xl shadow-xl pl-6 border border-white/10 rounded-2xl ">
            <h2 className="text-xl font-semibold text-white pl-0 ">Product Generation History</h2>
          </div>
          {/* Spacer to keep content below fixed header */}
          <div className="h-0"></div>

          {/* Main Loader */}
          {loading && finalProductEntries.length === 0 && (
            <div className="flex items-center justify-center ">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                <div className="text-white text-lg">Loading your generation history...</div>
              </div>
            </div>
          )}

          {/* No History State */}
          {!loading && finalProductEntries.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="text-white text-lg">No products generated yet</div>
                <div className="text-white/60 text-sm max-w-md">
                  Create your first AI-generated product image using the interface below
                </div>
              </div>
            </div>
          )}

          {/* History Entries - Grouped by Date */}
          {finalProductEntries.length > 0 && (
            <div className=" space-y-8  ">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-4">
                  {/* Date Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-white/60"
                      >
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-white/70">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </h3>
                  </div>

                  {/* All Images for this Date - Horizontal Layout */}
                  <div className="flex flex-wrap gap-3 ml-9">
                    {/* Prepend local preview tiles at the start of today's row to push images right */}
                    {date === todayKey && localGeneratingEntries.length > 0 && (
                      <>
                        {localGeneratingEntries[0].images.map((image: any, idx: number) => (
                          <div key={`local-${idx}`} className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                            {localGeneratingEntries[0].status === 'generating' ? (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                                  <div className="text-xs text-white/60">Generating...</div>
                                </div>
                              </div>
                            ) : localGeneratingEntries[0].status === 'failed' ? (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                                <div className="flex flex-col items-center gap-2">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                  </svg>
                                  <div className="text-xs text-red-400">Failed</div>
                                </div>
                              </div>
                            ) : (
                              <Image
                                src={image.url || image.originalUrl || '/placeholder-product.png'}
                                alt={localGeneratingEntries[0].prompt}
                                fill
                                className="object-cover"
                                sizes="192px"
                              />
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Product</div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Regular history entries */}
                    {groupedByDate[date].map((entry: any) => 
                      (entry.images || []).map((image: any) => (
                        <div
                          key={`${entry.id}-${image.id}`}
                          onClick={() => setPreviewEntry(entry)}
                          className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                        >
                          {entry.status === "generating" ? (
                            // Loading frame
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                                <div className="text-xs text-white/60">
                                  Generating...
                                </div>
                              </div>
                            </div>
                          ) : entry.status === "failed" ? (
                            // Error frame
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                              <div className="flex flex-col items-center gap-2">
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="text-red-400"
                                >
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                <div className="text-xs text-red-400">Failed</div>
                              </div>
                            </div>
                          ) : (
                            // Completed product
                            <Image
                              src={image.url || image.originalUrl || '/placeholder-product.png'}
                              alt={entry.prompt}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              sizes="192px"
                            />
                          )}
                          
                          {/* Product badge */}
                          {/* <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                            Product
                          </div> */}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Indicator */}
          {hasMore && loading && finalProductEntries.length > 0 && (
            <div className="flex items-center justify-center py-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                <div className="text-sm text-white/60">Loading more products...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[780px] z-[60]">
        <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          <div className="flex items-center gap-3 p-3">
            <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
              <input
                type="text"
                placeholder={
                  selectedModel === 'flux-kontext-dev' 
                    ? "Describe the product you want to generate..." 
                    : selectedModel === 'flux-krea' && generationMode === 'product-with-model'
                    ? "Describe the scene and pose for your product..."
                    : "Type your product prompt..."
                }
                value={prompt}
                onChange={(e) => dispatch(setPrompt(e.target.value))}
                className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-none"
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition-colors"
              >
                {isGeneratingLocally ? 'Generating Product...' : (
                  generationMode === 'product-only'
                    ? 'Generate Product'
                    : 'Generate with Model Pose'
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
            <ModelsDropdown />
            <GenerationModeDropdown 
              selectedMode={generationMode}
              onModeSelect={setGenerationMode}
              isVisible={true}
              selectedModel={selectedModel}
            />
            <UploadProductButton 
              onImageUpload={setProductImage} 
              isDisabled={selectedModel === 'flux-krea'}
            />
            {/* Model image upload - only show for models that support it */}
            {(selectedModel === 'flux-kontext-dev' || 
              (selectedModel !== 'flux-krea' && generationMode === 'product-with-model')) && (
              <UploadModelButton 
                onImageUpload={setModelImage} 
                isDisabled={false}
              />
            )}
            {/* Frame size selection - available for all models except flux-krea (which is text-only) */}
            {selectedModel !== 'flux-krea' && selectedModel !== 'gemini-25-flash-image' && <FrameSizeButton />}
            <ImageCountButton />
          </div>
        </div>
      </div>

      {/* Product Image Preview Modal */}
      {previewEntry && (
        <ProductImagePreview
          isOpen={true}
          onClose={closePreview}
          entry={previewEntry}
        />
      )}
    </>
  );
};

export default ProductWithModelPoseInputBox;