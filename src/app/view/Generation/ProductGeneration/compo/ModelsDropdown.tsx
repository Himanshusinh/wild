'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedModel } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const ModelsDropdown = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-kontext-dev');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  const models = [
    { name: 'Flux Kontext [DEV]', value: 'flux-kontext-dev', description: 'Generate from description only (no image upload)' },
    { name: 'Flux Kontext [PRO]', value: 'flux-kontext-pro', description: 'Best for professional products' },
    { name: 'Flux Kontext [MAX]', value: 'flux-kontext-max', description: 'High-quality product designs' }
  ];

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('product-models'));
  };

  const handleModelSelect = (modelValue: string) => {
    dispatch(setSelectedModel(modelValue));
    dispatch(toggleDropdown(''));
  };

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-1"
      >
        Models
      </button>
      {activeDropdown === 'product-models' && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          {models.map((model) => (
            <button
              key={model.value}
              onClick={(e) => {
                e.stopPropagation();
                handleModelSelect(model.value);
              }}
              className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition text-[13px] flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-white/60 mt-0.5">{model.description}</span>
              </div>
              {selectedModel === model.value && (
                <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelsDropdown;
