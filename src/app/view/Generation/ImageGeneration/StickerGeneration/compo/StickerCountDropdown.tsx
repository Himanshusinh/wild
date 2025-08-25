'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setImageCount } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const StickerCountDropdown = () => {
  const dispatch = useAppDispatch();
  const imageCount = useAppSelector((state: any) => state.generation?.imageCount || 1);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  const stickerCounts = [
    { value: '1', label: '1 Sticker', description: 'Single sticker design' },
    { value: '2', label: '2 Stickers', description: 'Two variations' },
    { value: '3', label: '3 Stickers', description: 'Three options' },
    { value: '4', label: '4 Stickers', description: 'Multiple choices' }
  ];

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('stickerCount'));
  };

  const handleStickerCountSelect = (count: string) => {
    dispatch(setImageCount(Number(count)));
    dispatch(toggleDropdown(''));
  };

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM8.5 16L12 13.5 15.5 16 12 18.5 8.5 16z"/>
        </svg>
        <span>Number of Stickers</span>
      </button>
      {activeDropdown === 'stickerCount' && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          {stickerCounts.map((option) => (
            <button
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                handleStickerCountSelect(option.value);
              }}
              className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition text-[13px] flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-white/60 mt-0.5">{option.description}</span>
              </div>
              {imageCount === Number(option.value) && (
                <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StickerCountDropdown;
