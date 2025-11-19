'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setImageCount } from '@/store/slices/generationSlice';

type ImageCountDropdownProps = {
  light?: boolean;
};

const ImageCountDropdown = ({ light = false }: ImageCountDropdownProps) => {
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
    <div className={`${light ? 'flex items-center gap-1.5 md:gap-2 bg-white rounded-md border border-gray-200 p-1' : 'flex items-center gap-1.5 md:gap-2 bg-transparent rounded-lg border border-white/20 p-0.5 md:p-1'}`}>
      <button
        onClick={handleDecrease}
        disabled={imageCount <= 1}
        className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center transition ml-1.5 md:ml-2 ${
          imageCount <= 1 
            ? `${light ? 'text-black/30 cursor-not-allowed' : 'text-white cursor-not-allowed'}` 
            : `${light ? 'text-black hover:bg-gray-100' : ' text-white hover:bg-white/20'}`
        }`}
      >
        <Minus className="w-3 h-3 md:w-4 md:h-4" />
      </button>
      
      <span className={`px-1 text-xs md:text-md font-medium ${light ? 'text-black' : 'text-white/90'}  text-center`}>
        {imageCount}
      </span>
      
      <button
        onClick={handleIncrease}
        disabled={imageCount >= 4}
        className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center transition mr-1.5 md:mr-2 ${
          imageCount >= 4 
            ? `${light ? 'text-black/30 cursor-not-allowed' : ' text-white cursor-not-allowed'}` 
            : `${light ? 'text-black hover:bg-gray-100' : ' text-white hover:bg-white/20'}`
        }`}
      >
        <Plus className="w-3 h-3 md:w-4 md:h-4" />
      </button>
    </div>
  );
};

export default ImageCountDropdown;
