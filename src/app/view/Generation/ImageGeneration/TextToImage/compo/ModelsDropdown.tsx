"use client";

import React, { useEffect, useRef } from "react";
import { Cpu, ChevronUp, Infinity as InfinityIcon } from "lucide-react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedModel } from '@/store/slices/generationSlice';
import { toggleDropdown, addNotification } from '@/store/slices/uiSlice';
import { getModelCreditInfo } from '@/utils/modelCredits';

type ModelsDropdownProps = {
  openDirection?: 'up' | 'down';
  imageOnly?: boolean;
};

const ModelsDropdown = ({ openDirection = 'up', imageOnly = false }: ModelsDropdownProps) => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector(
    (state: any) => state.generation?.selectedModel || "new-turbo-model"
  );
  const uploadedImages = useAppSelector((state: any) => state.generation?.uploadedImages || []);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  let models = [
    { name: 'Flux 2 Pro', value: 'flux-2-pro' },
    { name: 'Seedream v4 4k', value: 'seedream-v4' },
    { name: 'Seedream 4.5', value: 'seedream-4.5' },

    { name: "Flux Kontext Pro", value: "flux-kontext-pro" },
    { name: "Flux Kontext Max", value: "flux-kontext-max" },
    { name: "Flux Pro 1.1", value: "flux-pro-1.1" },
    { name: "Flux Pro 1.1 Ultra", value: "flux-pro-1.1-ultra" },
    { name: "FLUX.1 Pro", value: "flux-pro" },
    // { name: 'FLUX.1 Dev', value: 'flux-dev' },
    { name: "Runway Gen4 Image", value: "gen4_image" },
    { name: "Runway Gen4 Image Turbo", value: "gen4_image_turbo" },
    { name: "MiniMax Image-01", value: "minimax-image-01" },
    { name: " Nano Banana", value: "gemini-25-flash-image" },
    { name: " Nano Banana Pro", value: "google/nano-banana-pro" },
    { name: "Ideogram v3", value: "ideogram-ai/ideogram-v3" },
    { name: "Ideogram v3 Quality", value: "ideogram-ai/ideogram-v3-quality" },
    // { name: 'Lucid Origin', value: 'leonardoai/lucid-origin' },
    // { name: 'Phoenix 1.0', value: 'leonardoai/phoenix-1.0' },
    { name: "Imagen 4 Ultra", value: "imagen-4-ultra" },
    { name: "Imagen 4", value: "imagen-4" },
    { name: "Imagen 4 Fast", value: "imagen-4-fast" },
    // TODO: Update model name and value with actual model identifier
    // TODO: Update value with actual Replicate model identifier (format: owner/name or owner/name:version)
    { name: "z-image-turbo", value: "new-turbo-model" },
    // Local models
    // { name: 'Flux Schnell (Local)', value: 'flux-schnell' },
    // { name: 'SD 3.5 Medium (Local)', value: 'stable-medium' },
    // { name: 'SD 3.5 Large (Local)', value: 'stable-large' },
    // { name: 'SD 3.5 Turbo (Local)', value: 'stable-turbo' },
    // { name: 'SDXL 1.0 (Local)', value: 'stable-xl' },
    // { name: 'Flux Krea (Local)', value: 'flux-krea' },
    // { name: 'Playground SDXL (Local)', value: 'playground' },
  ];

  // Add credits information to models (but don't display credits)
  const modelsWithCredits = models.map((model) => {
    const creditInfo = getModelCreditInfo(model.value);
    const isFree = model.value === "new-turbo-model";
    const creditLabel = isFree
      ? 'Free (0 credits)'
      : (creditInfo.displayText || (creditInfo.credits != null ? `${creditInfo.credits} credits` : null));

    return {
      ...model,
      credits: creditInfo.credits,
      isFree, // Mark z-image-turbo as special
      creditLabel,
      displayName: model.name,
    };
  });

  // If imageOnly or user uploaded images, restrict to models which support image inputs
  let filteredModels = modelsWithCredits;
  const restrictForImages = imageOnly || uploadedImages.length > 0;
  if (restrictForImages) {
    filteredModels = modelsWithCredits.filter(m =>
      m.value.startsWith('flux-kontext') ||
      m.value === 'gen4_image' ||
      m.value === 'gen4_image_turbo' ||
      m.value === 'gemini-25-flash-image' ||
      m.value === 'google/nano-banana-pro' ||
      m.value === 'seedream-v4' ||
      m.value === 'seedream-4.5' ||
      m.value === 'flux-2-pro'
    );
  }

  // Set default model to z-image-turbo on mount if not set (only if no images uploaded)
  useEffect(() => {
    if (!selectedModel || selectedModel === 'flux-dev') {
      // If images are uploaded, use nano banana instead of z-image-turbo
      if (uploadedImages.length > 0) {
        dispatch(setSelectedModel('gemini-25-flash-image'));
      } else {
        dispatch(setSelectedModel('new-turbo-model'));
      }
    }
  }, []); // Only run on mount

  // If user switches to image-to-image (uploaded images) while an unsupported model is selected, auto-switch to nano banana
  useEffect(() => {
    if (!restrictForImages) return;
    const isIdeogram = typeof selectedModel === 'string' && selectedModel.startsWith('ideogram-ai/ideogram-v3');
    const isImagen4 = typeof selectedModel === 'string' && (selectedModel === 'imagen-4' || selectedModel === 'imagen-4-fast' || selectedModel === 'imagen-4-ultra');
    const isLucidOrPhoenix = typeof selectedModel === 'string' && (selectedModel === 'leonardoai/lucid-origin' || selectedModel === 'leonardoai/phoenix-1.0');
    const isMiniMax = typeof selectedModel === 'string' && selectedModel === 'minimax-image-01';
    const isZImageTurbo = typeof selectedModel === 'string' && (selectedModel === 'new-turbo-model' || selectedModel === 'z-image-turbo');
    
    // If z-image-turbo or other unsupported models are selected when images are uploaded, switch to nano banana
    if (isZImageTurbo || isIdeogram || isImagen4 || isLucidOrPhoenix || isMiniMax) {
      // Prefer nano banana (gemini-25-flash-image) for image-to-image
      const nanoBanana = filteredModels.find(m => m.value === 'gemini-25-flash-image');
      const fallback = nanoBanana?.value || filteredModels[0]?.value || 'gemini-25-flash-image';
      dispatch(setSelectedModel(fallback));
    }
  }, [restrictForImages, selectedModel, filteredModels, dispatch]);

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('models'));
  };

  // Auto-close dropdown after 5 seconds
  useEffect(() => {
    if (activeDropdown === 'models') {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for 5 seconds
      timeoutRef.current = setTimeout(() => {
        dispatch(toggleDropdown(''));
      }, 20000);
    } else {
      // Clear timeout if dropdown is closed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeDropdown, dispatch]);

  const handleModelSelect = (modelValue: string) => {
    // Toast guidance for models that require image input
    if (modelValue === 'gen4_image_turbo' && uploadedImages.length === 0) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Runway Gen4 Image Turbo requires at least one reference image. Please attach an image.'
      }));
    }
    if (modelValue === 'minimax-image-01' && uploadedImages.length > 1) {
      dispatch(addNotification({
        type: 'info',
        message: 'MiniMax Image-01 uses only one reference image. The first image will be used.'
      }));
    }
    dispatch(setSelectedModel(modelValue));
    dispatch(toggleDropdown(''));
  };

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className="Z-50 h-[28px] md:h-[32px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-white text-black hover:bg-white/95 transition flex items-center gap-1"
      >
        {selectedModel === "new-turbo-model" ? (
          <InfinityIcon className="w-4 h-4 mr-1" />
        ) : (
          <Cpu className="w-4 h-4 mr-1" />
        )}
        {filteredModels.find((m) => m.value === selectedModel)?.name || "Models"}
        <ChevronUp
          className={`w-4 h-4 transition-transform duration-200 ${
            activeDropdown === "models" ? "rotate-180" : ""
          }`}
        />
      </button>

      
      {activeDropdown === 'models' && ( 
        <div className={`absolute ${openDirection === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 w-full md:w-[28rem] bg-black/90 backdrop-blur-3xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-80 max-h-100 md:max-h-100 overflow-y-auto dropdown-scrollbar`}>
          {(() => {
            // Priority models moved to LEFT column and marked with crown
            // z-image-turbo is first and highlighted as special
            const leftValues = [
              'new-turbo-model', // z-image-turbo - should be first
              'google/nano-banana-pro',
              'gemini-25-flash-image', // Google Nano Banana
              
              'z-image-turbo',
              'flux-kontext-max',
              'flux-kontext-pro',
              'flux-pro-1.1-ultra',
              'imagen-4',
              'imagen-4-fast',
              'imagen-4-ultra',
            ];
            const leftSet = new Set(leftValues);
            const leftModels = filteredModels
              .filter(m => leftSet.has(m.value))
              .sort((a, b) => leftValues.indexOf(a.value) - leftValues.indexOf(b.value));
            const rightModels = filteredModels.filter(m => !leftSet.has(m.value));
            
            // On mobile: single column with all models combined
            // On desktop: two columns
            const allModels = [...leftModels, ...rightModels];
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Mobile: Single column with all models */}
                <div className="md:hidden divide-y divide-white/10">
                  {allModels.map((model) => (
                    <button
                      key={`mobile-${model.value}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModelSelect(model.value);
                      }}
                      className={`w-full px-4 py-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
                        selectedModel === model.value
                          ? model.isFree
                            ? "bg-gradient-to-r from-[#60a5fa]/30 to-[#3b82f6]/30 text-white border border-[#60a5fa]/50"
                            : "bg-white text-black"
                          : model.isFree
                          ? "text-white/90 hover:bg-[#60a5fa]/10 border-l-2 border-transparent hover:border-[#60a5fa]/50"
                          : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex flex-col mb-0">
                        <span className="flex items-center gap-2">
                          {model.isFree && (
                            <InfinityIcon className="w-4 h-4 text-[#60a5fa]" />
                          )}
                          {model.name}
                          {leftSet.has(model.value) && !model.isFree && (
                            <img src="/icons/crown.svg" alt="pro" className="w-4 h-4" />
                          )}
                        </span>
                        {model.creditLabel && (
                          <span className={`text-[10px] -mt-0.5 ${selectedModel === model.value && !model.isFree ? 'text-black/70' : 'text-white/60'}`}>
                            {model.creditLabel}
                          </span>
                        )}
                      </div>
                      {selectedModel === model.value && (
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Desktop: Two columns */}
                {/* Left column (priority models with crown) */}
                <div className="hidden md:block divide-y divide-white/10">
                  {leftModels.map((model) => (
                    <button
                      key={`left-${model.value}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModelSelect(model.value);
                      }}
                      className={`w-full px-4 py-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
                        selectedModel === model.value
                          ? model.isFree
                            ? "bg-gradient-to-r from-[#60a5fa]/30 to-[#3b82f6]/30 text-white border border-[#60a5fa]/50"
                            : "bg-white text-black"
                          : model.isFree
                          ? "text-white/90 hover:bg-[#60a5fa]/10 border-l-2 border hover:border-[#60a5fa]/50"
                          : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex flex-col mb-0">
                        <span className="flex items-center gap-2">
                          {model.isFree && (
                            <InfinityIcon className="w-4 h-4 text-[#60a5fa]" />
                          )}
                          {model.name}
                          {!model.isFree && (
                            
                            <img src="/icons/crown.svg" alt="pro" className="w-4 h-4" />
                          )}
                        </span>
                        {model.creditLabel && (
                          <span className={`text-[10px] -mt-0.5 ${selectedModel === model.value && !model.isFree ? 'text-black/70' : 'text-white/60'}`}>
                            {model.creditLabel}
                          </span>
                        )}
                      </div>
                      {selectedModel === model.value && (
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
                {/* Right column (all remaining models) */}
                <div className="hidden md:block border-l border-white/10 divide-y divide-white/10">
                  {rightModels.map((model) => (
                    <button
                      key={`right-${model.value}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModelSelect(model.value);
                      }}
                      className={`w-full px-4 py-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
                        selectedModel === model.value
                          ? model.isFree
                            ? "bg-gradient-to-r from-[#60a5fa]/30 to-[#3b82f6]/30 text-white border border-[#60a5fa]/50"
                            : "bg-white text-black"
                          : model.isFree
                          ? "text-white/90 hover:bg-[#60a5fa]/10 border-l-2 border-transparent hover:border-[#60a5fa]/50"
                          : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex flex-col -mb-0">
                        <span className="flex items-center gap-2">
                          {model.isFree && (
                            <InfinityIcon className="w-4 h-4 text-[#60a5fa]" />
                          )}
                          {model.name}
                        </span>
                        {model.creditLabel && (
                          <span className={`text-[10px] -mt-0.5 ${selectedModel === model.value && !model.isFree ? 'text-black/70' : 'text-white/60'}`}>
                            {model.creditLabel}
                          </span>
                        )}
                      </div>
                      {selectedModel === model.value && (
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ModelsDropdown;
