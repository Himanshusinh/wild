'use client';

import React, { useEffect, useRef } from 'react';
import { Cpu, ChevronUp } from 'lucide-react';
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
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-dev');
  const uploadedImages = useAppSelector((state: any) => state.generation?.uploadedImages || []);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  let models = [
    { name: 'Flux Kontext Pro', value: 'flux-kontext-pro' },
    { name: 'Flux Kontext Max', value: 'flux-kontext-max' },
    { name: 'Flux Pro 1.1', value: 'flux-pro-1.1' },
    { name: 'Flux Pro 1.1 Ultra', value: 'flux-pro-1.1-ultra' },
    { name: 'FLUX.1 Pro', value: 'flux-pro' },
    { name: 'FLUX.1 Dev', value: 'flux-dev' },
    { name: 'Runway Gen4 Image', value: 'gen4_image' },
    { name: 'Runway Gen4 Image Turbo', value: 'gen4_image_turbo' },
    { name: 'MiniMax Image-01', value: 'minimax-image-01' },
    { name: 'Google Nano Banana', value: 'gemini-25-flash-image' },
    { name: 'Google Nano Banana Pro', value: 'google/nano-banana-pro' },
    { name: 'Seedream v4 4k', value: 'seedream-v4' },
    { name: 'Ideogram v3', value: 'ideogram-ai/ideogram-v3' },
    { name: 'Ideogram v3 Quality', value: 'ideogram-ai/ideogram-v3-quality' },
    { name: 'Lucid Origin', value: 'leonardoai/lucid-origin' },
    { name: 'Phoenix 1.0', value: 'leonardoai/phoenix-1.0' },
    { name: 'Imagen 4 Ultra', value: 'imagen-4-ultra' },
    { name: 'Imagen 4', value: 'imagen-4' },
    { name: 'Imagen 4 Fast', value: 'imagen-4-fast' },
    // Local models
    // { name: 'Flux Schnell (Local)', value: 'flux-schnell' },
    // { name: 'SD 3.5 Medium (Local)', value: 'stable-medium' },
    // { name: 'SD 3.5 Large (Local)', value: 'stable-large' },
    // { name: 'SD 3.5 Turbo (Local)', value: 'stable-turbo' },
    // { name: 'SDXL 1.0 (Local)', value: 'stable-xl' },
    // { name: 'Flux Krea (Local)', value: 'flux-krea' },
    // { name: 'Playground SDXL (Local)', value: 'playground' },
  ];

  // Add credits information to models
  const modelsWithCredits = models.map(model => {
    const creditInfo = getModelCreditInfo(model.value);
    return {
      ...model,
      credits: creditInfo.credits,
      displayName: creditInfo.hasCredits ? `${model.name} (${creditInfo.displayText})` : model.name
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
      m.value === 'seedream-v4'
    );
  }

  // If user switches to image-to-image (uploaded images) while an Ideogram model is selected, auto-switch to a supported model
  useEffect(() => {
    if (!restrictForImages) return;
    const isIdeogram = typeof selectedModel === 'string' && selectedModel.startsWith('ideogram-ai/ideogram-v3');
    const isImagen4 = typeof selectedModel === 'string' && (selectedModel === 'imagen-4' || selectedModel === 'imagen-4-fast' || selectedModel === 'imagen-4-ultra');
    const isLucidOrPhoenix = typeof selectedModel === 'string' && (selectedModel === 'leonardoai/lucid-origin' || selectedModel === 'leonardoai/phoenix-1.0');
    const isMiniMax = typeof selectedModel === 'string' && selectedModel === 'minimax-image-01';
    if (isIdeogram || isImagen4 || isLucidOrPhoenix || isMiniMax) {
      const fallback = filteredModels[0]?.value || 'gemini-25-flash-image';
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
        className="Z-50 h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white text-black hover:bg-white/95 transition flex items-center gap-1"
      >
        <Cpu className="w-4 h-4 mr-1" />
        {filteredModels.find(m => m.value === selectedModel)?.name || 'Models'}
      
      <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'models' ? 'rotate-180' : ''}`} />
      
      </button>

      
      {activeDropdown === 'models' && ( 
        <div className={`absolute ${openDirection === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 w-[28rem] bg-black/90 backdrop-blur-3xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-80 max-h-150 overflow-y-auto dropdown-scrollbar`}>
          {(() => {
            // Priority models moved to LEFT column and marked with crown
            const leftValues = [
              'gemini-25-flash-image', // Google Nano Banana
              'imagen-4-ultra',
              'flux-kontext-max',
              'flux-kontext-pro',
              'flux-pro-1.1-ultra',
              'leonardoai/phoenix-1.0',
              'seedream-v4',
              'ideogram-ai/ideogram-v3-quality',
              'imagen-4',
            ];
            const leftSet = new Set(leftValues);
            const leftModels = filteredModels
              .filter(m => leftSet.has(m.value))
              .sort((a, b) => leftValues.indexOf(a.value) - leftValues.indexOf(b.value));
            const rightModels = filteredModels.filter(m => !leftSet.has(m.value));
            return (
              <div className="grid grid-cols-2 gap-0">
                {/* Left column (priority models with crown) */}
                <div className="divide-y divide-white/10">
                  {leftModels.map((model) => (
                    <button
                      key={`left-${model.value}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModelSelect(model.value);
                      }}
                      className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${selectedModel === model.value
                        ? 'bg-white text-black'
                        : 'text-white/90 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col mb-0">
                        <span className="flex items-center gap-2">
                          {model.name}
                          <img src="/icons/crown.svg" alt="pro" className="w-4 h-4" />
                        </span>
                        {model.credits && (
                          <span className="text-[11px] opacity-80 -mt-0.5 font-normal">{model.credits} credits</span>
                        )}
                      </div>
                      {selectedModel === model.value && (
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
                {/* Right column (all remaining models) */}
                <div className="border-l border-white/10 divide-y divide-white/10">
                  {rightModels.map((model) => (
                    <button
                      key={`right-${model.value}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModelSelect(model.value);
                      }}
                      className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${selectedModel === model.value
                        ? 'bg-white text-black'
                        : 'text-white/90 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col -mb-0">
                        <span>{model.name}</span>
                        {model.credits && (
                          <span className="text-[11px] opacity-80 -mt-0.5 font-normal">{model.credits} credits</span>
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
