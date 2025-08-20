'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedModel } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const ModelsDropdown = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'speech-2.5-hd-preview');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  const models = [
    { 
      name: 'Speech 2.5 HD Preview', 
      value: 'speech-2.5-hd-preview', 
      description: 'Ultimate Similarity',
      features: 'Ultra-High Quality, 40 languages, 7 emotions',
      quality: 'HD',
      type: 'Preview'
    },
    { 
      name: 'Speech 2.5 Turbo Preview', 
      value: 'speech-2.5-turbo-preview', 
      description: 'Ultimate Value',
      features: 'Low latency, 40 languages, 7 emotions',
      quality: 'Turbo',
      type: 'Preview'
    },
    { 
      name: 'Speech 02 HD', 
      value: 'speech-02-hd', 
      description: 'Stronger replication similarity',
      features: 'High quality voice, 24 languages, 7 emotions',
      quality: 'HD',
      type: 'Stable'
    },
    { 
      name: 'Speech 02 Turbo', 
      value: 'speech-02-turbo', 
      description: 'Superior rhythm and stability',
      features: 'Low latency, 24 languages, 7 emotions',
      quality: 'Turbo',
      type: 'Stable'
    }
  ];

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('models'));
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
      {activeDropdown === 'models' && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-black/90 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/40 pb-2 pt-2 max-h-96 overflow-y-auto shadow-2xl">
          {models.map((model) => (
            <button
              key={model.value}
              onClick={(e) => {
                e.stopPropagation();
                handleModelSelect(model.value);
              }}
              className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition text-[13px] flex items-start justify-between"
            >
              <div className="flex flex-col flex-1">
                <span className="font-medium text-white">{model.name}</span>
                <span className="text-xs text-white/85 mt-0.5">{model.description}</span>
                <span className="text-xs text-white/75 mt-1">{model.features}</span>
                <div className="flex items-center gap-2 mt-1 text-xs text-white/65">
                  <span className="px-2 py-0.5 bg-white/20 rounded">{model.quality}</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded">{model.type}</span>
                </div>
              </div>
              {selectedModel === model.value && (
                <div className="w-2 h-2 bg-white rounded-full flex-shrink-0 mt-1"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelsDropdown;
