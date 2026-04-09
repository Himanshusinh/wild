'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { ChevronUp } from 'lucide-react';
import { toggleDropdown } from '@/store/slices/uiSlice';
import { setPhoenixStyle, setPhoenixContrast, setPhoenixMode, setPhoenixPromptEnhance } from '@/store/slices/generationSlice';

const PhoenixOptions = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-dev');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUp: boolean; } | null>(null);
  const [isActiveInstance, setIsActiveInstance] = useState(false);
  const buttonJustClickedRef = useRef(false);
  const shouldCloseRef = useRef(false);
  const selectingRef = useRef(false);

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

  useEffect(() => {
    if (activeDropdown !== 'phoenixOptions') {
      setIsActiveInstance(false);
      setDropdownPosition(null);
    }
  }, [activeDropdown]);

  useEffect(() => {
    const updateDropdownPosition = () => {
      if (activeDropdown === 'phoenixOptions' && isActiveInstance && buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const dropdownWidth = 256;
        let left = buttonRect.left;
        let top = buttonRect.top;
        let openUp = true;

        if (left + dropdownWidth > window.innerWidth - 8) left = window.innerWidth - dropdownWidth - 8;
        if (left < 8) left = 8;
        if (top < 8) {
          top = buttonRect.bottom + 8;
          openUp = false;
        }

        setDropdownPosition({ top, left, openUp });
      } else {
        setDropdownPosition(null);
      }
    };

    updateDropdownPosition();

    if (activeDropdown === 'phoenixOptions') {
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);

      const handleClickOutside = (event: MouseEvent) => {
        if (buttonJustClickedRef.current || shouldCloseRef.current || selectingRef.current) return;
        const target = event.target as HTMLElement;
        if (buttonRef.current?.contains(target)) return;
        if (target.closest('[data-dropdown="phoenixOptions"]')) return;
        setIsActiveInstance(false);
        dispatch(toggleDropdown(''));
      };

      document.addEventListener('mousedown', handleClickOutside, true);

      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [activeDropdown, dispatch, isActiveInstance]);

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    buttonJustClickedRef.current = true;
    const isCurrentlyOpen = activeDropdown === 'phoenixOptions' && isActiveInstance;

    if (isCurrentlyOpen) {
      setIsActiveInstance(false);
      dispatch(toggleDropdown(''));
      shouldCloseRef.current = true;
    } else {
      setIsActiveInstance(true);
      dispatch(toggleDropdown('phoenixOptions'));
      shouldCloseRef.current = false;
    }

    setTimeout(() => {
      buttonJustClickedRef.current = false;
      shouldCloseRef.current = false;
    }, 300);
  };

  const handleStyleSelect = (styleValue: string) => {
    selectingRef.current = true;
    dispatch(setPhoenixStyle(styleValue));
    setTimeout(() => {
      selectingRef.current = false;
    }, 100);
  };

  const handleContrastSelect = (contrastValue: string) => {
    selectingRef.current = true;
    dispatch(setPhoenixContrast(contrastValue));
    setTimeout(() => {
      selectingRef.current = false;
    }, 100);
  };

  const handleModeSelect = (modeValue: string) => {
    selectingRef.current = true;
    dispatch(setPhoenixMode(modeValue));
    setTimeout(() => {
      selectingRef.current = false;
    }, 100);
  };

  const handlePromptEnhanceToggle = () => {
    selectingRef.current = true;
    dispatch(setPhoenixPromptEnhance(!phoenixPromptEnhance));
    setTimeout(() => {
      selectingRef.current = false;
    }, 100);
  };

  const dropdownContent =
    activeDropdown === 'phoenixOptions' && isActiveInstance && dropdownPosition ? (
      <div
        data-dropdown="phoenixOptions"
        className="fixed w-64 bg-black/90 backdrop-blur-3xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-[9999] max-h-150 overflow-y-auto dropdown-scrollbar"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          transform: dropdownPosition.openUp
            ? 'translateY(calc(-100% - 8px))'
            : 'none',
        }}
      >
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
    ) : null;

  return (
    <>
      <div className="relative dropdown-container">
        <button
          ref={buttonRef}
          onClick={handleDropdownClick}
          className="h-[28px] md:h-[32px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
        >
          <span>Other Options</span>
          <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'phoenixOptions' ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {typeof window !== 'undefined' &&
        dropdownContent &&
        createPortal(dropdownContent, document.body)}
      
    </>
  );
};

export default PhoenixOptions;
