'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setImageCount } from '@/store/slices/generationSlice';
import { Minus, Plus } from 'lucide-react';

const LogoCountDropdown = () => {
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
    <div className="flex items-center gap-2 bg-transparent rounded-full border border-black/20 dark:border-white/20 p-1">
      <button
        onClick={handleDecrease}
        disabled={imageCount <= 1}
        className={`w-4 h-4 rounded-full flex items-center justify-center transition ml-2 ${
          imageCount <= 1 
            ? 'text-black dark:text-white cursor-not-allowed' 
            : ' text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20'
        }`}
      >
        <Minus className="w-4 h-4" />
      </button>
      
      <span className="px-1 text-md font-medium text-black dark:text-white/90  text-center">
        {imageCount}
      </span>
      
      <button
        onClick={handleIncrease}
        disabled={imageCount >= 4}
        className={`w-4 h-4 rounded-full flex items-center justify-center transition mr-2 ${
          imageCount >= 4 
            ? ' text-black dark:text-white cursor-not-allowed' 
            : ' text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20'
        }`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default LogoCountDropdown;
