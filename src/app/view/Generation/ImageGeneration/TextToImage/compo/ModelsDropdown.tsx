'use client';

import React from 'react';
import { Cpu } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedModel } from '@/store/slices/generationSlice';
import { toggleDropdown, addNotification } from '@/store/slices/uiSlice';

const ModelsDropdown = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-dev');
  const uploadedImages = useAppSelector((state: any) => state.generation?.uploadedImages || []);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

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
    // Local models
    { name: 'Flux Schnell (Local)', value: 'flux-schnell' },
    { name: 'SD 3.5 Medium (Local)', value: 'stable-medium' },
    { name: 'SD 3.5 Large (Local)', value: 'stable-large' },
    { name: 'SD 3.5 Turbo (Local)', value: 'stable-turbo' },
    { name: 'SDXL 1.0 (Local)', value: 'stable-xl' },
    { name: 'Flux Krea (Local)', value: 'flux-krea' },
    { name: 'Playground SDXL (Local)', value: 'playground' },
  ];

  // If user uploaded images, restrict to models which support image inputs
  if (uploadedImages.length > 0) {
    models = models.filter(m => 
      m.value.startsWith('flux-kontext') || 
      m.value === 'gen4_image' || 
      m.value === 'gen4_image_turbo' ||
      m.value === 'minimax-image-01' ||
      m.value === 'gemini-25-flash-image'
    );
  }

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('models'));
  };

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
        className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          selectedModel !== 'flux-dev' 
            ? 'bg-white text-black' 
            : 'bg-transparent text-white/90 hover:bg-white/5'
        }`}
      >
        <Cpu className="w-4 h-4 mr-1" />
        {models.find(m => m.value === selectedModel)?.name || 'Models'}
      </button>
      {activeDropdown === 'models' && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          {models.map((model) => (
            <button
              key={model.value}
              onClick={(e) => {
                e.stopPropagation();
                handleModelSelect(model.value);
              }}
              
              className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                selectedModel === model.value
                  ? 'bg-white text-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span>{model.name}</span>
              {selectedModel === model.value && (
                <div className="w-2 h-2 bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelsDropdown;
