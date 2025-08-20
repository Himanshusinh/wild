'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setFrameSize } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const ResolutionDropdown = () => {
  const dispatch = useAppDispatch();
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1080p');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'MiniMax-Hailuo-02');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  // Different resolutions based on selected model
  const getResolutionsForModel = (model: string) => {
    switch (model) {
      case 'MiniMax-Hailuo-02':
        return [
          { value: '1080p', label: '1080p', description: 'Full HD (1920×1080)' },
          { value: '768p', label: '768p', description: 'HD (1024×768)' },
          { value: '512p', label: '512p', description: 'SD (512×512)' }
        ];
      case 'T2V-01-Director':
      case 'I2V-01-Director':
      case 'S2V-01':
        return [
          { value: '720p', label: '720p', description: 'HD (1280×720)' }
        ];
      default:
        return [
          { value: '1080p', label: '1080p', description: 'Full HD (1920×1080)' }
        ];
    }
  };

  const resolutions = getResolutionsForModel(selectedModel);

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('resolution'));
  };

  const handleResolutionSelect = (resolutionValue: string) => {
    dispatch(setFrameSize(resolutionValue));
    dispatch(toggleDropdown(''));
  };

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
        </svg>
        <span>Resolution</span>
      </button>
      {activeDropdown === 'resolution' && (
        <div className="absolute bottom-full left-0 mb-2 w-44 bg-black/90 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/40 pb-2 pt-2 shadow-2xl">
          {resolutions.map((res) => (
            <button
              key={res.value}
              onClick={(e) => {
                e.stopPropagation();
                handleResolutionSelect(res.value);
              }}
              className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition text-[13px] flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium text-white">{res.label}</span>
                <span className="text-xs text-white/85 mt-0.5">{res.description}</span>
              </div>
              {frameSize === res.value && (
                <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResolutionDropdown;
