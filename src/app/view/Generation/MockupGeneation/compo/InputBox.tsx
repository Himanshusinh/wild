'use client';

import React, { useEffect } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setPrompt } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';
import ModelsDropdown from './ModelsDropdown';
import UploadLogoButton from './UploadLogoButton';
import BusinessNameButton from './BusinessNameButton';
import TagLineButton from './TagLineButton';
import ProductImageButton from './ProductImageButton';
import FrameSizeButton from './FrameSizeButton';
import ImageCountButton from './ImageCountButton';

const InputBox = () => {
  const dispatch = useAppDispatch();

  const prompt = useAppSelector((state: any) => state.generation?.prompt || '');
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  // Removed inline editor state; handled in child components

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as HTMLElement).closest('.dropdown-container')) {
        dispatch(toggleDropdown(''));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown, dispatch]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[780px] z-[60]">
      <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
            <input
              type="text"
              placeholder="Type your prompt..."
              value={prompt}
              onChange={(e) => dispatch(setPrompt(e.target.value))}
              className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-none"
            />
          </div>
          <div className="flex flex-col items-end gap-2">
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <button
              disabled
              className="bg-[#2F6BFF] opacity-60 text-white px-6 py-2.5 rounded-full text-[15px] font-semibold"
            >
              Generate
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          <UploadLogoButton />
          <ModelsDropdown />
          <ProductImageButton />
          <BusinessNameButton />
          <TagLineButton />
          <FrameSizeButton />
          <ImageCountButton />
        </div>
      </div>
    </div>
  );
};

export default InputBox;


