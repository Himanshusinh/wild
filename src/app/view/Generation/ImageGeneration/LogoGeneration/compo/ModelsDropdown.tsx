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
    { name: 'Flux Kontext [PRO]', value: 'flux-kontext-pro', description: 'Best for professional logos' },
    { name: 'Flux Kontext [MAX]', value: 'flux-kontext-max', description: 'High-quality logo generation' },
    { name: 'Flux Pro 1.1', value: 'flux-pro-1.1', description: 'Ultra-detailed logos' },
    { name: 'Flux Pro', value: 'flux-pro', description: 'Professional logo generation' }
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
        className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-black/20 dark:ring-white/20 hover:ring-black/30 dark:hover:ring-white/30 transition flex items-center gap-1 ${
          selectedModel !== 'gemini-25-flash-image'
            ? 'bg-white text-black dark:bg-white dark:text-black'
            : 'bg-transparent text-black/80 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        {(() => {
          const currentModel = modelsWithCredits.find(m => m.value === selectedModel);
          return currentModel?.name || currentModel?.displayName || 'Models';
        })()}
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'models' ? 'rotate-180' : ''}`} />
      </button>
      {activeDropdown === 'models' && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-white/95 dark:bg-black/90 backdrop-blur-3xl shadow-2xl z-100 rounded-xl overflow-hidden ring-1 ring-black/20 dark:ring-white/30 pb-2 pt-2">
          {modelsWithCredits.map((model) => (
            <button
              key={model.value}
              onClick={(e) => {
                e.stopPropagation();
                handleModelSelect(model.value);
              }}
              className={`w-full px-4 py-3 text-left transition text-[13px] flex items-center justify-between ${
                selectedModel === model.value
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-black/80 dark:text-white/90 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className={`text-xs mt-0.5 ${
                  selectedModel === model.value ? 'text-white/70 dark:text-black/70' : 'text-black/60 dark:text-white/60'
                }`}>{model.description}</span>
                {model.credits && (
                  <span className={`text-xs mt-0.5 ${
                    selectedModel === model.value ? 'text-white/70 dark:text-black/70' : 'text-black/60 dark:text-white/70'
                  }`}>{model.credits} credits</span>
                )}
              </div>
              {selectedModel === model.value && (
                <div className="w-2 h-2 bg-white dark:bg-black rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelsDropdown;
