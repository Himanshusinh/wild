'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setImageCount } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const FpsDropdown = () => {
  const dispatch = useAppDispatch();
  const imageCount = useAppSelector((state: any) => state.generation?.imageCount || 24);
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'MiniMax-Hailuo-02');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  // Different FPS based on selected model
  const getFpsForModel = (model: string) => {
    switch (model) {
      case 'MiniMax-Hailuo-02':
        return [
          { value: 24, label: '24 FPS', description: 'Cinema standard' },
          { value: 30, label: '30 FPS', description: 'Smooth motion' }
        ];
      case 'T2V-01-Director':
      case 'I2V-01-Director':
      case 'S2V-01':
        return [
          { value: 25, label: '25 FPS', description: 'PAL standard' }
        ];
      default:
        return [
          { value: 24, label: '24 FPS', description: 'Cinema standard' }
        ];
    }
  };

  const fpsOptions = getFpsForModel(selectedModel);

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('fps'));
  };

  const handleFpsSelect = (fpsValue: number) => {
    dispatch(setImageCount(fpsValue));
    dispatch(toggleDropdown(''));
  };

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span>FPS</span>
      </button>
      {activeDropdown === 'fps' && (
        <div className="absolute bottom-full left-0 mb-2 w-40 bg-black/90 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/40 pb-2 pt-2 shadow-2xl">
          {fpsOptions.map((fps) => (
            <button
              key={fps.value}
              onClick={(e) => {
                e.stopPropagation();
                handleFpsSelect(fps.value);
              }}
              className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition text-[13px] flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium text-white">{fps.label}</span>
                <span className="text-xs text-white/85 mt-0.5">{fps.description}</span>
              </div>
              {imageCount === fps.value && (
                <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FpsDropdown;
