'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedModel } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';
import { getModelCreditInfo } from '@/utils/modelCredits';

const ModelsDropdown = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-kontext-pro');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  const models = [
    { name: 'Flux Kontext [DEV]', value: 'flux-kontext-dev', description: 'Fast local generation via ngrok' },
    { name: 'Flux Kontext [PRO]', value: 'flux-kontext-pro', description: 'Best for professional stickers' },
    { name: 'Flux Kontext [MAX]', value: 'flux-kontext-max', description: 'High-quality sticker designs' },
    { name: 'Flux Pro 1.1', value: 'flux-pro-1.1', description: 'Ultra-detailed stickers' }
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

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('mockup-models'));
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
      {activeDropdown === 'mockup-models' && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          {modelsWithCredits.map((model) => (
            <button
              key={model.value}
              onClick={(e) => {
                e.stopPropagation();
                handleModelSelect(model.value);
              }}
              className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition text-[13px] flex items-center justify-between"
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{model.name}</span>
                {model.credits && (
                  <span className="text-xs opacity-70 mt-0.5">{model.credits} credits</span>
                )}
              </div>
              {selectedModel === model.value && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelsDropdown;


