'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { ChevronUp } from 'lucide-react';
import { toggleDropdown } from '@/store/slices/uiSlice';
import { setPhoenixStyle, setPhoenixContrast, setPhoenixMode, setPhoenixPromptEnhance } from '@/store/slices/generationSlice';

const PhoenixOptions = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-dev');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Phoenix 1.0 specific state from Redux
  const phoenixStyle = useAppSelector((state: any) => state.generation?.phoenixStyle || 'none');
  const phoenixContrast = useAppSelector((state: any) => state.generation?.phoenixContrast || 'medium');
  const phoenixMode = useAppSelector((state: any) => state.generation?.phoenixMode || 'fast');
  const phoenixPromptEnhance = useAppSelector((state: any) => state.generation?.phoenixPromptEnhance || false);

  // Auto-close dropdown after 5 seconds
  useEffect(() => {
    if (activeDropdown === 'phoenixOptions') {
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

  // Only show when Phoenix 1.0 is selected
  if (selectedModel !== 'leonardoai/phoenix-1.0') {
    return null;
  }

  // const phoenixStyles = [
  //   { value: 'none', label: 'None' },
  //   { value: '3d_render', label: '3D Render' },
  //   { value: 'bokeh', label: 'Bokeh' },
  //   { value: 'cinematic', label: 'Cinematic' },
  //   { value: 'cinematic_concept', label: 'Cinematic Concept' },
  //   { value: 'creative', label: 'Creative' },
  //   { value: 'dynamic', label: 'Dynamic' },
  //   { value: 'fashion', label: 'Fashion' },
  //   { value: 'graphic_design_pop_art', label: 'Graphic Design Pop Art' },
  //   { value: 'graphic_design_vector', label: 'Graphic Design Vector' },
  //   { value: 'hdr', label: 'HDR' },
  //   { value: 'illustration', label: 'Illustration' },
  //   { value: 'macro', label: 'Macro' },
  //   { value: 'minimalist', label: 'Minimalist' },
  //   { value: 'moody', label: 'Moody' },
  //   { value: 'portrait', label: 'Portrait' },
  //   { value: 'pro_bw_photography', label: 'Pro B&W Photography' },
  //   { value: 'pro_color_photography', label: 'Pro Color Photography' },
  //   { value: 'pro_film_photography', label: 'Pro Film Photography' },
  //   { value: 'portrait_fashion', label: 'Portrait Fashion' },
  //   { value: 'ray_traced', label: 'Ray Traced' },
  //   { value: 'sketch_bw', label: 'Sketch B&W' },
  //   { value: 'sketch_color', label: 'Sketch Color' },
  //   { value: 'stock_photo', label: 'Stock Photo' },
  //   { value: 'vibrant', label: 'Vibrant' }
  // ];

  const contrastOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  const modeOptions = [
    { value: 'fast', label: 'Fast' },
    { value: 'quality', label: 'Quality' },
    { value: 'ultra', label: 'Ultra' }
  ];

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('phoenixOptions'));
  };

  const handleStyleSelect = (styleValue: string) => {
    dispatch(setPhoenixStyle(styleValue));
    // Don't close dropdown - keep it open for other selections
  };

  const handleContrastSelect = (contrastValue: string) => {
    dispatch(setPhoenixContrast(contrastValue));
    // Don't close dropdown - keep it open for other selections
  };

  const handleModeSelect = (modeValue: string) => {
    dispatch(setPhoenixMode(modeValue));
    // Don't close dropdown - keep it open for other selections
  };

  const handlePromptEnhanceToggle = () => {
    dispatch(setPhoenixPromptEnhance(!phoenixPromptEnhance));
    // Don't close dropdown - keep it open for other selections
  };

  return (
    <>
      <div className="relative dropdown-container">
        <button
          onClick={handleDropdownClick}
          className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
        >
          <span>Phoenix Options</span>
          <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'phoenixOptions' ? 'rotate-180' : ''}`} />
        </button>

      {activeDropdown === 'phoenixOptions' && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-black/70 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-50">
          {/* Style Selection */}
          {/* <div className="px-4 py-2">
            <div className="text-xs text-white/70 mb-2">Style</div>
            <div className="max-h-32 overflow-y-auto cool-scrollbar">
              {phoenixStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStyleSelect(style.value);
                  }}
                  className={`w-full px-3 py-2 text-left transition text-[13px] flex items-center justify-between ${phoenixStyle === style.value
                      ? 'bg-white text-black'
                      : 'text-white/90 hover:bg-white/10'
                    }`}
                >
                  <span>{style.label}</span>
                  {phoenixStyle === style.value && <div className="w-2 h-2 bg-black rounded-full" />}
                </button>
              ))}
            </div>
          </div> */}

          {/* Contrast Selection */}
          <div className="px-4 py-2">
            <div className="text-xs text-white/70 mb-2">Contrast</div>
            <div className="max-h-32 overflow-y-auto cool-scrollbar">
              {contrastOptions.map((contrast) => (
                <button
                  key={contrast.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContrastSelect(contrast.value);
                  }}
                  className={`w-full px-3 py-2 text-left transition text-[13px] flex items-center justify-between ${phoenixContrast === contrast.value
                      ? 'bg-white text-black'
                      : 'text-white/90 hover:bg-white/10'
                    }`}
                >
                  <span>{contrast.label}</span>
                  {phoenixContrast === contrast.value && <div className="w-2 h-2 bg-black rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="px-4 py-2">
            <div className="text-xs text-white/70 mb-2">Mode</div>
            <div className="max-h-32 overflow-y-auto cool-scrollbar">
              {modeOptions.map((mode) => (
                <button
                  key={mode.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModeSelect(mode.value);
                  }}
                  className={`w-full px-3 py-2 text-left transition text-[13px] flex items-center justify-between ${phoenixMode === mode.value
                      ? 'bg-white text-black'
                      : 'text-white/90 hover:bg-white/10'
                    }`}
                >
                  <span>{mode.label}</span>
                  {phoenixMode === mode.value && <div className="w-2 h-2 bg-black rounded-full" />}
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
                  phoenixPromptEnhance
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-white/40 hover:border-white/60'
                }`}
              >
                {phoenixPromptEnhance && (
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
      
      <style jsx global>{`
        /* Custom scrollbar for Phoenix Options */
        .cool-scrollbar {
          scrollbar-width: thin; /* Firefox */
          scrollbar-color: rgba(255,255,255,0.35) transparent; /* Firefox */
        }
        .cool-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .cool-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .cool-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(59,130,246,0.6), rgba(147,51,234,0.6));
          border-radius: 9999px;
          border: 1px solid transparent;
          background-clip: padding-box;
        }
        .cool-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(59,130,246,0.9), rgba(147,51,234,0.9));
        }
      `}</style>
    </>
  );
};

export default PhoenixOptions;
