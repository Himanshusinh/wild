'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setStyle } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const DurationDropdown = () => {
  const dispatch = useAppDispatch();
  const duration = useAppSelector((state: any) => state.generation?.style || '6s');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'MiniMax-Hailuo-02');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  // Different durations based on selected model
  const getDurationsForModel = (model: string) => {
    switch (model) {
      case 'MiniMax-Hailuo-02':
        return [
          { value: '6s', label: '6 seconds', description: 'Standard duration' },
          { value: '10s', label: '10 seconds', description: 'Extended duration' }
        ];
      case 'T2V-01-Director':
      case 'I2V-01-Director':
      case 'S2V-01':
        return [
          { value: '6s', label: '6 seconds', description: 'Fixed duration' }
        ];
      default:
        return [
          { value: '6s', label: '6 seconds', description: 'Standard duration' }
        ];
    }
  };

  const durations = getDurationsForModel(selectedModel);

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('duration'));
  };

  const handleDurationSelect = (durationValue: string) => {
    dispatch(setStyle(durationValue));
    dispatch(toggleDropdown(''));
  };

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
        </svg>
        <span>Duration</span>
      </button>
      {activeDropdown === 'duration' && (
        <div className="absolute bottom-full left-0 mb-2 w-40 bg-black/90 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/40 pb-2 pt-2 shadow-2xl">
          {durations.map((dur) => (
            <button
              key={dur.value}
              onClick={(e) => {
                e.stopPropagation();
                handleDurationSelect(dur.value);
              }}
              className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition text-[13px] flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium text-white">{dur.label}</span>
                <span className="text-xs text-white/85 mt-0.5">{dur.description}</span>
              </div>
              {duration === dur.value && (
                <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DurationDropdown;
