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

  // Load history on mount and handle infinite scroll
  useEffect(() => {
    // Load text-to-image entries since backend stores products under this type
    dispatch(loadHistory({ 
      filters: { generationType: 'text-to-image' }, 
      paginationParams: { limit: 50 } 
    }));
  }, [dispatch]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800) {
        if (hasMore && !loading) {
          dispatch(loadMoreHistory({ 
            filters: { generationType: 'text-to-image' }, 
            paginationParams: { limit: 50 } 
          }));
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
        backendPrompt = `
      Use the provided reference model image as the main subject. 
      MAINTAIN THE MODEL'S IDENTITY EXACTLY: same face geometry, skin tone, age appearance, body proportions, height, gender, hairstyle/hairline, facial hair, eye color, and distinctive facial features. 
      Do NOT change ethnicity, age, gender, facial structure, or body shape. Do NOT beautify, slim, or morph the model. Do NOT add or remove tattoos, scars, moles, piercings, or accessories unless explicitly requested.
      
      Create a professional product photograph featuring: ${prompt}.
      • If wearable (clothing, eyewear, footwear, jewelry, bag), place the product naturally ON the model with correct fit and physics (realistic fabric drape, proper strap tension, no clipping, believable weight).  
      • If handheld or used, pose the model interacting with it naturally (correct finger placement and count, believable grip, no occlusion of key product features).  
      • Ensure the product is the hero: accurate scale, true-to-life color, correct materials and textures (leather grain, knit weave, brushed metal, glass reflections), crisp branding if allowed.  
      
      Photography direction (studio-grade):
      • Composition: product-forward hero framing; keep the model's face intact and recognizable; leave safe margins for cropping.  
      • Posing: confident, natural, non-exaggerated; avoid awkward limb angles; do not block the product.  
      • Lighting: soft three-point studio setup (soft key, gentle fill, subtle rim); clean highlights and controlled shadows; no blown whites or crushed blacks.  
      • Background: e-commerce-ready neutral/studio backdrop (white/off-white/light gray) unless a lifestyle scene is explicitly requested in ${prompt}; keep background uncluttered.  
      • Focus & Detail: tack-sharp edges, stitching, seams, fasteners (zips, buttons, buckles), surface textures; realistic micro-contrast.  
      • Color Accuracy: neutral white balance, no unwanted color cast; exact product color reproduction.  
      • Realism: physically plausible shadows/reflections, correct perspective, natural contact points; no floating artifacts.
      
      Output intent:
      • Editorial yet commercial product photo for e-commerce and marketing.  
      • No extra props unless they directly support the product.  
      • No text, no watermark, no borders, no frames, no mockups.  
      • High resolution, clean edges, centered composition.
      
      If multiple angles are implied, prioritize: front hero, 3/4 view, close-up texture/detail, functional detail (zip/closure/port), interior view (bags/shoes/jackets). Keep the SAME model identity across angles.
      
      AVOID: blurry, low-res, pixelated, jpeg artifacts, overexposed, underexposed, heavy vignette, strong color cast, banding, posterization, text, watermark, logo overlays, frames, borders, stickers, graphics, extra fingers, missing fingers, fused fingers, warped hands, twisted wrists, broken anatomy, extra limbs, distorted face, changed identity, changed age, changed gender, changed ethnicity, beautified/liquified/slimmed face or body, unreal fabric physics, cloth clipping through body, plastic-looking leather, rubbery materials, melted metal, incorrect reflections, unrealistic shadows, floating product, mismatched perspective, busy/cluttered background, distracting props, extreme fisheye, unrealistic depth of field, oversaturated neon tones.
      `.trim();
      } else {
        // Product-only case
        backendPrompt = `
      Create a professional studio product photograph of: ${prompt}.
      Goal: premium, accurate e-commerce presentation.
      
      Photography direction (studio-grade):
      • Composition: centered hero shot with generous negative space; clean margins for cropping.  
      • Angles: front hero and 3/4 preferred (unless otherwise specified); silhouette and key features must be clearly visible.  
      • Background: pure white or neutral studio backdrop (light gray/off-white), seamless; minimal gradient at most; no props unless requested.  
      • Lighting: soft three-point lighting with gentle, grounded shadow; clean speculars for metal/glass/leather; no blowouts.  
      • Materials & Texture: depict true material properties (leather grain, fabric weave, brushed metal, glass clarity); show fine details like stitching, seams, fasteners, ports.  
      • Color Accuracy: calibrated white balance; exact product color; no unwanted tint.  
      • Focus: tack-sharp edges and surfaces; crisp contours; avoid motion blur.  
      • Realism: accurate scale and perspective, believable contact shadow, plausible reflections; no floating artifacts.
      
      Output intent:
      • E-commerce catalog quality, marketing-ready.  
      • No text, no watermark, no borders, no frames, no mockups.  
      • High resolution, clean cut, centered composition.
      
      If additional angles are desired, prioritize: front hero, 3/4, side, back, top, macro close-up (texture/logo/closure), functional detail (zip/port/sole/lining), and interior view if applicable. Generate one best hero image unless multiple angles are explicitly requested.
      
      AVOID: blurry, low-res, pixelated, jpeg artifacts, overexposed, underexposed, heavy vignette, color cast, banding, posterization, text, watermark, logo overlays, frames, borders, stickers, graphics, plastic-looking materials, fake textures, noisy or dirty background, dust/fingerprints/scratches (unless requested), harsh reflections, unrealistic shadows, floating product, warped geometry, extreme perspective distortion, oversaturated neon tones.
      `.trim();
      }
      
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
        filters: { generationType: 'text-to-image' }, 
        paginationParams: { limit: 50 } 
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

  // Filter entries for product generation - only show explicit products
  const productHistoryEntries = historyEntries.filter((entry: any) => {
    // Primary filter: entries with product-generation generationType
    if (entry.generationType === 'product-generation') return true;
    
    // Secondary filter: entries that are explicitly product-related
    if (entry.generationType === 'text-to-image') {
      const prompt = entry.prompt?.toLowerCase() || '';
      const style = entry.style?.toLowerCase() || '';
      
      // Must have explicit product keywords
      const hasProductKeywords = (
        prompt.includes('product') ||
        prompt.includes('studio product') ||
        prompt.startsWith('product:') ||
        style === 'product'
      );
      
      // Exclude all non-product content
      const isNonProduct = (
        prompt.includes('logo') ||
        prompt.includes('brand') ||
        prompt.includes('sticker') ||
        prompt.includes('business logo') ||
        prompt.includes('sticker design') ||
        prompt.includes('business') ||
        prompt.includes('cat') ||
        prompt.includes('dog') ||
        prompt.includes('animal') ||
        prompt.includes('pet') ||
        prompt.includes('tiger') ||
        prompt.includes('lion') ||
        prompt.includes('kitten') ||
        prompt.includes('puppy') ||
        prompt.includes('beard') ||
        prompt.includes('man') ||
        prompt.includes('person') ||
        prompt.includes('human') ||
        style === 'logo' ||
        style === 'brand' ||
        style === 'sticker'
      );
      
      return hasProductKeywords && !isNonProduct;
    }
    
    return false;
  });

  // Only show entries that are explicitly product-related - no fallback
  const finalProductEntries = productHistoryEntries;

  // Debug logging
  console.log('📦 Product Generation - All entries:', historyEntries.length);
  console.log('📦 Product Generation - Filtered product entries:', productHistoryEntries.length);
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
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                            Product
                          </div>
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
            {selectedModel !== 'flux-krea' && <FrameSizeButton />}
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