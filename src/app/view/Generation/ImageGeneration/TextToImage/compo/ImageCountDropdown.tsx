'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setImageCount } from '@/store/slices/generationSlice';

const ImageCountDropdown = () => {
  const dispatch = useAppDispatch();
  const imageCount = useAppSelector((state: any) => state.generation?.imageCount || 1);

  const handleDecrease = () => {
    if (imageCount > 1) {
      dispatch(setImageCount(imageCount - 1));
    }
  };

  const handleIncrease = () => {
    if (imageCount < 4) {
      dispatch(setImageCount(imageCount + 1));
    }
  };

  return (
    <div className="flex items-center md:gap-2 gap-0 bg-transparent rounded-lg border border-white/20 md:p-1.5 p-1">
      <button
        onClick={handleDecrease}
        disabled={imageCount <= 1}
        className={`w-4 h-4 rounded-full flex items-center justify-center transition md:ml-2 ml-0 ${
          imageCount <= 1 
            ? 'text-white cursor-not-allowed' 
            : ' text-white hover:bg-white/20'
        }`}
      >
        <Minus className="w-4 h-4" />
      </button>
      
      <span className="px-1 md:text-md text-sm font-medium text-white/90  text-center">
        {imageCount}
      </span>
      
      <button
        onClick={handleIncrease}
        disabled={imageCount >= 4}
        className={`w-4 h-4 rounded-full flex items-center justify-center transition md:mr-2 mr-0 ${
          imageCount >= 4 
            ? ' text-white cursor-not-allowed' 
            : ' text-white hover:bg-white/20'
        }`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ImageCountDropdown;
