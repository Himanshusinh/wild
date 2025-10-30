'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { ChevronUp } from 'lucide-react';
import { toggleDropdown } from '@/store/slices/uiSlice';
import { setLucidStyle, setLucidContrast, setLucidMode, setLucidPromptEnhance } from '@/store/slices/generationSlice';

const LucidOriginOptions = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-dev');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lucid Origin specific state from Redux
  const lucidStyle = useAppSelector((state: any) => state.generation?.lucidStyle || 'none');
  const lucidContrast = useAppSelector((state: any) => state.generation?.lucidContrast || 'medium');
  const lucidMode = useAppSelector((state: any) => state.generation?.lucidMode || 'standard');
  const lucidPromptEnhance = useAppSelector((state: any) => state.generation?.lucidPromptEnhance || false);

  // Auto-close dropdown after 5 seconds
  useEffect(() => {
    if (activeDropdown === 'lucidOriginOptions') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        dispatch(toggleDropdown(''));
      }, 20000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeDropdown, dispatch]);

  // Only show when Lucid Origin is selected
  if (selectedModel !== 'leonardoai/lucid-origin') {
    return null;
  }

  // const lucidStyles = [
  //   { value: 'none', label: 'None' },
  //   { value: 'bokeh', label: 'Bokeh' },
  //   { value: 'cinematic', label: 'Cinematic' },
  //   { value: 'cinematic_close_up', label: 'Cinematic Close Up' },
  //   { value: 'creative', label: 'Creative' },
  //   { value: 'dynamic', label: 'Dynamic' },
  //   { value: 'fashion', label: 'Fashion' },
  //   { value: 'film', label: 'Film' },
  //   { value: 'food', label: 'Food' },
  //   { value: 'hdr', label: 'HDR' },
  //   { value: 'long_exposure', label: 'Long Exposure' },
  //   { value: 'macro', label: 'Macro' },
  //   { value: 'minimalist', label: 'Minimalist' },
  //   { value: 'monochrome', label: 'Monochrome' },
  //   { value: 'moody', label: 'Moody' },
  //   { value: 'neutral', label: 'Neutral' },
  //   { value: 'portrait', label: 'Portrait' },
  //   { value: 'retro', label: 'Retro' },
  //   { value: 'stock_photo', label: 'Stock Photo' },
  //   { value: 'unprocessed', label: 'Unprocessed' },
  //   { value: 'vibrant', label: 'Vibrant' }
  // ];

  const contrastOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  const modeOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'ultra', label: 'Ultra' }
  ];

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('lucidOriginOptions'));
  };

  const handleStyleSelect = (styleValue: string) => {
    dispatch(setLucidStyle(styleValue));
    // Don't close dropdown - keep it open for other selections
  };

  const handleContrastSelect = (contrastValue: string) => {
    dispatch(setLucidContrast(contrastValue));
    // Don't close dropdown - keep it open for other selections
  };

  const handleModeSelect = (modeValue: string) => {
    dispatch(setLucidMode(modeValue));
    // Don't close dropdown - keep it open for other selections
  };

  const handlePromptEnhanceToggle = () => {
    dispatch(setLucidPromptEnhance(!lucidPromptEnhance));
    // Don't close dropdown - keep it open for other selections
  };

  return (
    <>
      <div className="relative dropdown-container">
        <button
          onClick={handleDropdownClick}
          className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
        >
          <span>Other Options</span>
          <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'lucidOriginOptions' ? 'rotate-180' : ''}`} />
        </button>

      {activeDropdown === 'lucidOriginOptions' && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-black/70 backdrop-blur-xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-50">
          {/* Style Selection */}
          <div className="px-4 py-2">
            {/* <div className="text-xs text-white/70 mb-2">Style</div>
            <div className="max-h-32 overflow-y-auto custom-scrollbar">
              {lucidStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStyleSelect(style.value);
                  }}
                  className={`w-full px-3 py-2 text-left transition text-[13px] flex items-center justify-between ${lucidStyle === style.value
                      ? 'bg-white text-black'
                      : 'text-white/90 hover:bg-white/10'
                    }`}
                >
                  <span>{style.label}</span>
                  {lucidStyle === style.value && <div className="w-2 h-2 bg-black rounded-full" />}
                </button>
              ))}
            </div> */}
          </div>

          {/* Contrast Selection */}
          <div className="px-4 py-2">
            <div className="text-xs text-white/70 mb-2">Contrast</div>
            <div className="max-h-32 overflow-y-auto custom-scrollbar">
              {contrastOptions.map((contrast) => (
                <button
                  key={contrast.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContrastSelect(contrast.value);
                  }}
                  className={`w-full px-3 py-2 text-left transition text-[13px] flex items-center justify-between ${lucidContrast === contrast.value
                      ? 'bg-white text-black'
                      : 'text-white/90 hover:bg-white/10'
                    }`}
                >
                  <span>{contrast.label}</span>
                  {lucidContrast === contrast.value && <div className="w-2 h-2 bg-black rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="px-4 py-2">
            <div className="text-xs text-white/70 mb-2">Mode</div>
            <div className="max-h-32 overflow-y-auto custom-scrollbar">
              {modeOptions.map((mode) => (
                <button
                  key={mode.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModeSelect(mode.value);
                  }}
                  className={`w-full px-3 py-2 text-left transition text-[13px] flex items-center justify-between ${lucidMode === mode.value
                      ? 'bg-white text-black'
                      : 'text-white/90 hover:bg-white/10'
                    }`}
                >
                  <span>{mode.label}</span>
                  {lucidMode === mode.value && <div className="w-2 h-2 bg-black rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Enhance Toggle */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePromptEnhanceToggle();
                }}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  lucidPromptEnhance
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-white/40 hover:border-white/60'
                }`}
              >
                {lucidPromptEnhance && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
              <span className="text-white/90 text-[13px]">Prompt Enhance</span>
            </div>
          </div>
        </div>
      )}
      </div>
      
    </>
  );
};

export default LucidOriginOptions;
