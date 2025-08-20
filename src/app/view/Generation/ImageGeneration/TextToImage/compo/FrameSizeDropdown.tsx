'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setFrameSize } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const FrameSizeDropdown = () => {
  const dispatch = useAppDispatch();
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  const frameSizes = [
    { name: 'Square', value: '1:1' },
    { name: 'Portrait', value: '3:4' },
    { name: 'Landscape', value: '4:3' },
    { name: 'Wide', value: '16:9' },
    { name: 'Ultra Wide', value: '21:9' }
  ];

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('frameSize'));
  };

  const handleFrameSizeSelect = (sizeValue: string) => {
    dispatch(setFrameSize(sizeValue));
    dispatch(toggleDropdown(''));
  };

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-1"
      >
        Frame Size
      </button>
      {activeDropdown === 'frameSize' && (
        <div className="absolute bottom-full left-0 mb-2 w-36 bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          {frameSizes.map((size) => (
            <button
              key={size.value}
              onClick={(e) => {
                e.stopPropagation();
                handleFrameSizeSelect(size.value);
              }}
              className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition text-[13px] flex items-center justify-between"
            >
              <span>{size.name}</span>
              {frameSize === size.value && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FrameSizeDropdown;
