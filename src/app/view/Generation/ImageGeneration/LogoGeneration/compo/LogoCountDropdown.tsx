'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setImageCount } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const LogoCountDropdown = () => {
  const dispatch = useAppDispatch();
  const imageCount = useAppSelector((state: any) => state.generation?.imageCount || 1);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  const logoCounts = [
    { value: '1', label: '1 Logo', description: 'Single logo design' },
    { value: '2', label: '2 Logos', description: 'Two variations' },
    { value: '3', label: '3 Logos', description: 'Three options' },
    { value: '4', label: '4 Logos', description: 'Multiple choices' }
  ];

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('logoCount'));
  };

  const handleLogoCountSelect = (count: string) => {
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
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span>Number of Logos</span>
      </button>
      {activeDropdown === 'logoCount' && (
        <div className="absolute bottom-full left-0 mb-2 w-44 bg-black/90 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/40 pb-2 pt-2 shadow-2xl">
          {logoCounts.map((option) => (
            <button
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                handleLogoCountSelect(option.value);
              }}
              className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition text-[13px] flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium text-white">{option.label}</span>
                <span className="text-xs text-white/85 mt-0.5">{option.description}</span>
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

export default LogoCountDropdown;
