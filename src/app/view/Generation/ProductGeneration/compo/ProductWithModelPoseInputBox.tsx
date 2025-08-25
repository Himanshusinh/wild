'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { HistoryEntry } from '@/types/history';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  setPrompt, 
  generateImages
} from '@/store/slices/generationSlice';
import { 
  toggleDropdown, 
  addNotification 
} from '@/store/slices/uiSlice';
import { 
  addHistoryEntry, 
  updateHistoryEntry 
} from '@/store/slices/historySlice';

// Import the product-specific components
import ModelsDropdown from './ModelsDropdown';
import UploadProductButton from './UploadProductButton';
import UploadModelButton from './UploadModelButton';
import FrameSizeButton from './FrameSizeButton';
import ImageCountButton from './ImageCountButton';
import ProductImagePreview from './ProductImagePreview';

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
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');

  // Product and model image states
  const [productImage, setProductImage] = useState<string | null>(null);
  const [modelImage, setModelImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // For Flux models, product image is required
    if (selectedModel !== 'flux-kontext-dev' && !productImage) return;

    // Create a loading entry immediately to show loading frames
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

    // Add loading entry to show frames immediately
    dispatch(addHistoryEntry(loadingEntry));

    try {
      let result;
      
      // Check if using local model or Flux model
      if (selectedModel === 'flux-kontext-dev') {
        // Call local product generation API - only needs prompt and image count
        const localResponse = await fetch('/api/local/product-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            imageCount
          })
        });

        if (!localResponse.ok) {
          throw new Error(`Local API failed: ${localResponse.status}`);
        }

        // The server route handles SSE and uploads to Firebase, returns final JSON with images
        result = await localResponse.json();
      } else {
        // Use existing Flux API for Kontext models
        let backendPrompt;
        
        if (modelImage) {
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
        
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt_upsampling:true,
            prompt: backendPrompt,
            model: selectedModel,
            n: imageCount,
            aspect_ratio: frameSize, // Use the selected frame size as aspect_ratio
            style: 'product',
            generationType: 'product-generation',
            uploadedImages: modelImage ? [productImage, modelImage] : [productImage]
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        result = await response.json();

        if (!result.images) {
          throw new Error('No images received from Flux API');
        }
      }

      // Create the completed entry
      const completedEntry: HistoryEntry = {
        id: result.historyId || Date.now().toString(),
        prompt: `Product: ${prompt}`,
        model: selectedModel === 'flux-kontext-dev' ? 'Flux Kontext [DEV]' : selectedModel,
        generationType: 'product-generation',
        images: result.images,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: imageCount,
        status: 'completed',
        frameSize: selectedModel === 'flux-kontext-dev' ? '1:1' : frameSize, // Use selected frame size for Flux models
        style: 'product'
      };

      // Update the loading entry with completed data for both local and Flux models
      dispatch(updateHistoryEntry({
        id: loadingEntry.id,
        updates: completedEntry
      }));

      // Clear the prompt and images (only clear images for Flux models)
      dispatch(setPrompt(''));
      if (selectedModel !== 'flux-kontext-dev') {
        setProductImage(null);
        setModelImage(null);
      }

      // Show success notification for both local and Flux models
      dispatch(addNotification({
        type: 'success',
        message: `Successfully generated ${imageCount} product image${imageCount > 1 ? 's' : ''}!`
      }));

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

  // Filter product generation history entries
  const productHistoryEntries = historyEntries
    .filter((entry: HistoryEntry) => entry.generationType === 'product-generation')
    .sort((a: HistoryEntry, b: HistoryEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Check if generation button should be enabled
  const canGenerate = (() => {
    const hasPrompt = prompt.trim().length > 0;
    const isLocalModel = selectedModel === 'flux-kontext-dev';
    const hasRequiredInputs = isLocalModel || productImage;
    const notGenerating = !isGenerating;
    
    return hasPrompt && hasRequiredInputs && notGenerating;
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
                placeholder={selectedModel === 'flux-kontext-dev' ? "Describe the product you want to generate..." : "Type your product prompt..."}
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
                {isGenerating ? 'Generating...' : (selectedModel === 'flux-kontext-dev' ? 'Generate from Description' : 'Generate Product')}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
            <ModelsDropdown />
            <UploadProductButton onImageUpload={setProductImage} />
            <UploadModelButton onImageUpload={setModelImage} />
            <FrameSizeButton />
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

        {productHistoryEntries.length === 0 ? (
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
              {selectedModel === 'flux-kontext-dev' 
                ? 'Start by typing a product description above' 
                : 'Start by uploading a product image and typing a prompt above'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {productHistoryEntries.map((entry: HistoryEntry) => (
              <div key={entry.id} className="space-y-4">
                {/* Prompt Text */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white/90 text-sm leading-relaxed">{entry.prompt}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                      <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                      <span>{entry.model}</span>
                      <span>{entry.images.length} image{entry.images.length !== 1 ? 's' : ''}</span>
                      {entry.status === 'generating' && (
                        <span className="text-yellow-400 flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          Generating... {entry.images.filter(img => img.url).length}/{entry.imageCount}
                        </span>
                      )}
                      {entry.status === 'failed' && (
                        <span className="text-red-400">Failed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 ml-9">
                  {entry.images.map((image, imageIndex) => (
                    <div key={image.id} className="aspect-square relative group">
                      {entry.status === 'generating' ? (
                        <div className="w-full h-full bg-white/5 rounded-lg flex items-center justify-center">
                          {image.url ? (
                            // Image is loaded but still generating
                            <div className="relative w-full h-full">
                              <Image
                                src={image.url}
                                alt={`Generated product ${imageIndex + 1}`}
                                fill
                                className="object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white/40 border-t-white/80 rounded-full animate-spin"></div>
                              </div>
                            </div>
                          ) : (
                            // Still loading this image
                            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                          )}
                        </div>
                      ) : image.url ? (
                        <Image
                          src={image.url}
                          alt={`Generated product ${imageIndex + 1}`}
                          fill
                          className="object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                          onClick={() => handleImageClick(entry)}
                        />
                      ) : (
                        <div className="w-full h-full bg-red-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-red-400 text-xs">Failed</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
