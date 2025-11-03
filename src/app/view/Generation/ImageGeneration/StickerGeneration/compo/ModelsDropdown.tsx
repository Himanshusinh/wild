'use client';

import React, { useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedModel } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';
import { getModelCreditInfo } from '@/utils/modelCredits';
import { ChevronUp } from 'lucide-react';

const ModelsDropdown = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'gemini-25-flash-image');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const models = [
    { name: 'Google Nano Banana', value: 'gemini-25-flash-image', description: 'Google FAL image model' },
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
    dispatch(toggleDropdown('models'));
  };

  const handleModelSelect = (modelValue: string) => {
    dispatch(setSelectedModel(modelValue));
    dispatch(toggleDropdown(''));
  };

  // Auto-close dropdown after 20 seconds
  useEffect(() => {
    if (activeDropdown === 'models') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        dispatch(toggleDropdown(''));
      }, 20000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeDropdown, dispatch]);

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className={`h-[28px] md:h-[32px] px-2 md:px-4 rounded-lg text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          selectedModel !== 'gemini-25-flash-image'
            ? 'bg-white text-black'
            : 'bg-transparent text-white/90 hover:bg-white/5'
        }`}
      >
        {(() => {
          const currentModel = modelsWithCredits.find(m => m.value === selectedModel);
          return currentModel?.name || currentModel?.displayName || 'Models';
        })()}
        <ChevronUp className={`w-3 h-3 md:w-4 md:h-4 transition-transform duration-200 ${activeDropdown === 'models' ? 'rotate-180' : ''}`} />
      </button>
      {activeDropdown === 'models' && (
        <div className="absolute bottom-full left-0 mb-2 w-full md:w-56 bg-black/90 backdrop-blur-3xl shadow-2xl z-100 rounded-lg overflow-hidden ring-1 ring-white/30 pb-1.5 md:pb-2 pt-1.5 md:pt-2 max-h-[50vh] md:max-h-none overflow-y-auto dropdown-scrollbar">
          {modelsWithCredits.map((model) => (
            <button
              key={model.value}
              onClick={(e) => {
                e.stopPropagation();
                handleModelSelect(model.value);
              }}
              className={`w-full px-2 md:px-4 py-1.5 md:py-3 text-left transition text-[10px] md:text-[13px] flex items-center justify-between ${
                selectedModel === model.value
                  ? 'bg-white text-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className={`text-[9px] md:text-xs mt-0.5 ${
                  selectedModel === model.value ? 'text-black/70' : 'text-white/60'
                }`}>{model.description}</span>
                {model.credits && (
                  <span className={`text-[9px] md:text-xs mt-0.5 ${
                    selectedModel === model.value ? 'text-black/70' : 'opacity-70'
                  }`}>{model.credits} credits</span>
                )}
              </div>
              {selectedModel === model.value && (
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-lg flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelsDropdown;
