'use client';

import React from 'react';
import { Image } from 'lucide-react';
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
        className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          imageCount !== 1 
            ? 'bg-white text-black' 
            : 'bg-transparent text-white/90 hover:bg-white/5'
        }`}
      >
        <Image className="w-4 h-4 mr-1" />
        {imageCount} Image{imageCount > 1 ? 's' : ''}
      </button>
      {activeDropdown === 'images' && (
        <div className="absolute bottom-full left-0 mb-2 w-32 bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          {imageCounts.map((number) => (
            <button
              key={number}
              onClick={(e) => {
                e.stopPropagation();
                handleImageCountSelect(number);
              }}
              className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                imageCount === Number(number)
                  ? 'bg-white text-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span>{number}</span>
              {imageCount === Number(number) && (
                <div className="w-2 h-2 bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCountDropdown;
