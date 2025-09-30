'use client';

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { HistoryEntry } from '@/types/history';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  setPrompt, 
  generateImages,
  setIsGenerating
} from '@/store/slices/generationSlice';
import { bflGenerate } from '@/store/slices/generationsApi';
import { useGenerationCredits } from '@/hooks/useCredits';
import { 
  toggleDropdown, 
  addNotification 
} from '@/store/slices/uiSlice';
import { 
  addHistoryEntry, 
  updateHistoryEntry,
  loadHistory,
  loadMoreHistory,
  removeHistoryEntry
} from '@/store/slices/historySlice';
// historyService removed; backend persists history
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
const saveHistoryEntryWithId = async (_id: string, _entry: any) => undefined as unknown as string;
const updateFirebaseHistory = async (_id: string, _updates: any) => {};

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
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Redux state
  const prompt = useAppSelector((state: any) => state.generation?.prompt || '');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-kontext-dev');
  const imageCount = useAppSelector((state: any) => state.generation?.imageCount || 1);
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const isGenerating = useAppSelector((state: any) => state.generation?.isGenerating || false);
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const historyLoading = useAppSelector((state: any) => state.history?.loading || false);
  const hasMoreHistory = useAppSelector((state: any) => state.history?.hasMore ?? true);
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

  // Product and model image states
  const [productImage, setProductImage] = useState<string | null>(null);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<string>('product-only');

  // Auto-set generation mode based on selected model
  useEffect(() => {
    if (!selectedModel) return; // Don't run if selectedModel is not set yet
    
    console.log('🔄 Model changed to:', selectedModel);
    // All Flux models support both product-only and product-with-model modes
    // Default to product-only for easier user experience
    setGenerationMode('product-only');
    console.log('✅ Set generation mode to: product-only');
  }, [selectedModel]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 Current state:', {
      selectedModel,
      generationModel: !!selectedModel,
      generationMode,
      productImage: !!productImage,
      modelImage: !!modelImage,
      prompt: prompt.length > 0
    });
  }, [selectedModel, generationMode, productImage, modelImage, prompt]);

  // Debug logging on mount
  useEffect(() => {
    console.log('🚀 Component mounted with initial state:', {
      selectedModel,
      generationMode,
      productImage: !!productImage,
      modelImage: !!modelImage,
      prompt: prompt.length > 0
    });
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

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
      return;
    }
    
    console.log('🚀 Starting product generation...');
    console.log('📝 Prompt:', prompt);
    console.log('🤖 Model:', selectedModel);
    console.log('🎯 Generation Mode:', generationMode);
    console.log('🖼️ Product Image:', !!productImage);
    console.log('👤 Model Image:', !!modelImage);
    
    // Validate required inputs based on generation mode
    // All models now support description-only generation
    if (generationMode === 'product-with-model') {
      if (!productImage || !modelImage) {
        dispatch(addNotification({ type: 'error', message: 'Both product image and model image are required for product with model pose generation' }));
        return;
      }
    }
    // For product-only mode, images are optional - user can generate from description only

    // Create a loading entry immediately to show loading frames
    const loadingEntry: HistoryEntry = {
      id: `loading-${Date.now()}`, // Simplified ID without random to prevent duplicates
      prompt: prompt, // Store only user prompt, not backend prompt
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

    // Add loading entry to show frames immediately
    dispatch(addHistoryEntry(loadingEntry));

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

      // Create the completed entry
      const completedEntry: HistoryEntry = {
        id: result.historyId || loadingEntry.id,
        prompt: prompt,
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

      // Update the loading entry with completed data
      dispatch(updateHistoryEntry({
        id: loadingEntry.id,
        updates: completedEntry
      }));

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

    } catch (error: any) {
      console.error('Product generation failed:', error);
      
      // Update the loading entry to show error
      dispatch(updateHistoryEntry({
        id: loadingEntry.id,
        updates: {
          status: 'failed',
          error: error.message || 'Failed to generate product images'
        }
      }));

      // Show error notification
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to generate product images'
      }));

      // Handle credit failure
      if (transactionId) {
        await handleGenerationFailure(transactionId);
      }
    }
  };

  // Handle image preview
  const handleImageClick = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
    setIsPreviewOpen(true);
  };



  // Close preview modal
  const closePreview = () => {
    setIsPreviewOpen(false);
    setSelectedEntry(null);
  };

  // Load product generation history entries
  useEffect(() => {
    // Fetch all history; client-side filtering will select product items
    dispatch(loadHistory({ 
      filters: undefined as unknown as any,
      paginationParams: { limit: 50 }
    }));
  }, [dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800) {
        if (hasMoreHistory && !historyLoading) {
          // Paginate full history; client-side filtering will select product items
          dispatch(loadMoreHistory({ filters: undefined as unknown as any, paginationParams: { limit: 10 } }));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dispatch, hasMoreHistory, historyLoading]);

  // Filter product generation history entries
  const productHistoryEntries = historyEntries
    .filter((entry: HistoryEntry) => {
      // If it has explicit product-generation type, include it
      if (entry.generationType === 'product-generation') {
        return true;
      }
      
      // If it has explicit product style, include it
      if (entry.style === 'product') {
        return true;
      }
      
      // For text-to-image entries, check if they're clearly products
      if (entry.generationType === 'text-to-image') {
        // Include if it has product-related keywords
        const hasProductKeywords = entry.prompt?.toLowerCase().includes('product') ||
                                  entry.prompt?.toLowerCase().includes('studio product');
        
        // Exclude if it has conflicting styles (logo or sticker)
        const hasConflictingStyle = entry.style === 'logo' || entry.style === 'sticker';
        
        // Exclude if it has logo-related keywords (even without style)
        const hasLogoKeywords = entry.prompt?.toLowerCase().includes('logo') ||
                               entry.prompt?.startsWith('Logo:');
        
        // Exclude if it has sticker-related keywords (even without style)
        const hasStickerKeywords = entry.prompt?.toLowerCase().includes('sticker') ||
                                  entry.prompt?.toLowerCase().includes('sticker design');
        
        return hasProductKeywords && !hasConflictingStyle && !hasLogoKeywords && !hasStickerKeywords;
      }
      
      return false;
    })
    .sort((a: HistoryEntry, b: HistoryEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Group entries by date
  const groupedByDate = productHistoryEntries.reduce((groups: { [key: string]: HistoryEntry[] }, entry: HistoryEntry) => {
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

  // Check if generation button should be enabled
  const canGenerate = (() => {
    const hasPrompt = prompt.trim().length > 0;
    const notGenerating = !isGenerating;
    
    // Don't enable if selectedModel is not set yet
    if (!selectedModel) {
      console.log('🔍 No selectedModel yet, disabling button');
      return false;
    }
    
    // All models now support description-only generation
    if (generationMode === 'product-with-model') {
      // For product-with-model mode, prompt, product image, and model image are required
      const canGen = hasPrompt && productImage && modelImage && notGenerating;
      console.log('🔍 product-with-model canGenerate check:', {
        hasPrompt,
        productImage: !!productImage,
        modelImage: !!modelImage,
        notGenerating,
        result: canGen
      });
      return canGen;
    } else {
      // For product-only mode, only prompt is required (description-only generation enabled)
      const canGen = hasPrompt && notGenerating;
      console.log('🔍 product-only canGenerate check:', {
        hasPrompt,
        notGenerating,
        result: canGen
      });
      return canGen;
    }
    
    return false;
  })();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as HTMLElement).closest('.dropdown-container')) {
        dispatch(toggleDropdown(''));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown, dispatch]);

  return (
    <div className="min-h-screen p-6">
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
                {isGenerating ? 'Generating...' : (
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

      {/* History Section */}
      <div className="max-w-7xl mx-auto pt-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Product Generation History</h2>
          <p className="text-white/60">Your generated product images will appear here</p>
        </div>

        {productHistoryEntries.length === 0 && historyLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
              <div className="text-white text-lg">Loading your product generations...</div>
            </div>
          </div>
        ) : productHistoryEntries.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Image
                src="/icons/imagegenerationwhite.svg"
                alt="Product Generation"
                width={48}
                height={48}
                className="opacity-50"
              />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No products generated yet</h3>
            <p className="text-white/60">
              {selectedModel === 'flux-krea' 
                ? 'Start by typing a product description above' 
                : 'Start by uploading a product image and typing a prompt above'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-8">
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

                {/* All Product Images for this Date - Horizontal Layout */}
                <div className="flex flex-wrap gap-3 ml-9">
                  {groupedByDate[date].map((entry: HistoryEntry) => 
                    entry.images.map((image, imageIndex) => (
                      <div
                        key={`${entry.id}-${image.id}`}
                        data-image-id={`${entry.id}-${image.id}`}
                        onClick={() => handleImageClick(entry)}
                        className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                      >
                        {entry.status === 'generating' ? (
                          // Loading frame
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            {image.url ? (
                              // Image is loaded but still generating
                              <div className="relative w-full h-full">
                                <Image
                                  src={image.url}
                                  alt={`Generated product ${imageIndex + 1}`}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-white/40 border-t-white/80 rounded-full animate-spin"></div>
                                </div>
                              </div>
                            ) : (
                              // Still loading this image
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                                <div className="text-xs text-white/60">
                                  Generating...
                                </div>
                              </div>
                            )}
                          </div>
                        ) : entry.status === 'failed' ? (
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
                        ) : image.url ? (
                          // Completed product with shimmer loading
                          <div className="relative w-full h-full">
                            <Image
                              src={image.url}
                              alt={`Generated product ${imageIndex + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              sizes="192px"
                              onLoad={() => {
                                // Remove shimmer when image loads
                                setTimeout(() => {
                                  const shimmer = document.querySelector(`[data-image-id="${entry.id}-${image.id}"] .shimmer`) as HTMLElement;
                                  if (shimmer) {
                                    shimmer.style.opacity = '0';
                                  }
                                }, 100);
                              }}
                            />
                            {/* Shimmer loading effect */}
                            <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                          </div>
                        ) : (
                          // No image available
                          <div className="w-full h-full bg-gradient-to-br from-gray-800/20 to-gray-900/20 flex items-center justify-center">
                            <div className="text-xs text-white/60">No image</div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Pagination loader at bottom */}
        {hasMoreHistory && historyLoading && productHistoryEntries.length > 0 && (
          <div className="flex items-center justify-center py-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
              <div className="text-sm text-white/60">Loading more products...</div>
            </div>
          </div>
        )}
      </div>

      {/* Product Image Preview Modal */}
      {selectedEntry && (
        <ProductImagePreview
          isOpen={isPreviewOpen}
          onClose={closePreview}
          entry={selectedEntry}
        />
      )}
    </div>
  );
};

export default ProductWithModelPoseInputBox;
