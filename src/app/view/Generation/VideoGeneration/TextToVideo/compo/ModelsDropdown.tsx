'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedModel } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const ModelsDropdown = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'MiniMax-Hailuo-02');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  const models = [
    { 
      name: 'MiniMax Hailuo 02', 
      value: 'MiniMax-Hailuo-02', 
      description: 'Text to Video & Image to Video',
      features: 'SOTA instruction following, Extreme physics mastery',
      resolution: '1080p/768p/512p',
      duration: '6s/10s',
      fps: '24 fps'
    },
    { 
      name: 'T2V-01-Director', 
      value: 'T2V-01-Director', 
      description: 'Text to Video',
      features: 'Enhanced precision shot control',
      resolution: '720p',
      duration: '6s',
      fps: '25 fps'
    },
    { 
      name: 'I2V-01-Director', 
      value: 'I2V-01-Director', 
      description: 'Image to Video',
      features: 'Enhanced precision shot control',
      resolution: '720p',
      duration: '6s',
      fps: '25 fps'
    },
    { 
      name: 'S2V-01', 
      value: 'S2V-01', 
      description: 'Image to Video',
      features: 'Maintaining Character Consistency',
      resolution: '720p',
      duration: '6s',
      fps: '25 fps'
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
                  <span>{model.resolution}</span>
                  <span>•</span>
                  <span>{model.duration}</span>
                  <span>•</span>
                  <span>{model.fps}</span>
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
