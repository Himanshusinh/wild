'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setImageCount } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const ImageCountDropdown = () => {
  const dispatch = useAppDispatch();
  const imageCount = useAppSelector((state: any) => state.generation?.imageCount || 1);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  const imageCounts = ['1', '2', '3', '4'];

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('images'));
  };

  const handleImageCountSelect = (count: string) => {
    dispatch(setImageCount(Number(count)));
    dispatch(toggleDropdown(''));
  };

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-1"
      >
        number of image
      </button>
      {activeDropdown === 'images' && (
        <div className="absolute bottom-full left-0 mb-2 w-32 bg-black/90 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/40 pb-2 pt-2 shadow-2xl">
          {imageCounts.map((number) => (
            <button
              key={number}
              onClick={(e) => {
                e.stopPropagation();
                handleImageCountSelect(number);
              }}
              className="w-full px-4 py-2 text-left text-white hover:bg-white/20 transition text-[13px] flex items-center justify-between"
            >
              <span className="font-medium text-white">{number}</span>
              {imageCount === Number(number) && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCountDropdown;
