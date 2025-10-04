'use client';

import React, { useEffect, useRef } from 'react';
import { Crop, ChevronUp } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setFrameSize } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const FrameSizeDropdown = () => {
  const dispatch = useAppDispatch();
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-dev');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show for all models, including Google Nano Banana (now supports aspect_ratio)

  // Model-aware frame size options
  // Common set supported across providers; Runway maps to pixel ratios internally
  const baseSizes = [
    { name: 'Square', value: '1:1', icon: 'square' },
    { name: 'Portrait', value: '3:4', icon: 'portrait' },
    { name: 'Portrait Tall', value: '2:3', icon: 'portrait' },
    { name: 'Vertical', value: '9:16', icon: 'portrait' },
    { name: 'Landscape', value: '4:3', icon: 'landscape' },
    { name: 'Landscape Wide', value: '3:2', icon: 'landscape' },
    { name: 'Wide', value: '16:9', icon: 'landscape' },
    { name: 'Ultra Wide', value: '21:9', icon: 'ultrawide' },
  ];

  // Some providers (MiniMax) specify an explicit allowed list; others accept broader ranges.
  const isRunway = selectedModel?.startsWith('gen4_image');
  const isMiniMax = selectedModel === 'minimax-image-01';
  const isFlux = selectedModel?.startsWith('flux');

  const frameSizes = (() => {
    if (isMiniMax) {
      // MiniMax: 1:1,16:9,4:3,3:2,2:3,3:4,9:16,21:9
      const allowed = new Set(['1:1', '16:9', '4:3', '3:2', '2:3', '3:4', '9:16', '21:9']);
      return baseSizes.filter(s => allowed.has(s.value));
    }
    if (isRunway) {
      // Runway: we map to pixel ratios later; keep a rich but safe set
      return baseSizes;
    }
    if (isFlux) {
      // Flux models accept aspect or width/height derived; use common set
      return baseSizes;
    }
    return baseSizes;
  })();

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('frameSize'));
  };

  const handleFrameSizeSelect = (sizeValue: string) => {
    dispatch(setFrameSize(sizeValue));
    dispatch(toggleDropdown(''));
  };

  // Auto-close dropdown after 5 seconds
  useEffect(() => {
    if (activeDropdown === 'frameSize') {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for 5 seconds
      timeoutRef.current = setTimeout(() => {
        dispatch(toggleDropdown(''));
      }, 5000);
    } else {
      // Clear timeout if dropdown is closed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeDropdown, dispatch]);

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${frameSize !== '1:1'
            ? 'bg-white text-black'
            : 'bg-transparent text-white/90 hover:bg-white/5'
          }`}
      >
        <Crop className="w-4 h-4 mr-1" />
        {frameSizes.find(s => s.value === frameSize)?.name || 'Frame Size'}
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'frameSize' ? 'rotate-180' : ''}`} />
      </button>
      {activeDropdown === 'frameSize' && (
        <div className="absolute bottom-full left-0 mb-2 w-44 bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          {frameSizes.map((size) => (
            <button
              key={size.value}
              onClick={(e) => {
                e.stopPropagation();
                handleFrameSizeSelect(size.value);
              }}
              className={`w-full px-3 py-2 text-left transition text-[13px] flex items-center justify-between gap-3 ${frameSize === size.value
                  ? 'bg-white text-black'
                  : 'text-white/90 hover:bg-white/10'
                }`}
            >
              <span className="flex items-center gap-2">
                {/* Icon */}
                {size.icon === 'square' && (
                  <span className={`inline-block w-4 h-4 border ${frameSize === size.value ? 'border-black' : 'border-white/60'
                    }`}></span>
                )}
                {size.icon === 'portrait' && (
                  <span className={`inline-block w-3 h-4 border ${frameSize === size.value ? 'border-black' : 'border-white/60'
                    }`}></span>
                )}
                {size.icon === 'landscape' && (
                  <span className={`inline-block w-4 h-3 border ${frameSize === size.value ? 'border-black' : 'border-white/60'
                    }`}></span>
                )}
                {size.icon === 'ultrawide' && (
                  <span className={`inline-block w-5 h-2 border ${frameSize === size.value ? 'border-black' : 'border-white/60'
                    }`}></span>
                )}
                <span>{size.name}</span>
                <span className={`text-[12px] ${frameSize === size.value ? 'text-black/70' : 'text-white/50'
                  }`}>{size.value}</span>
              </span>
              {frameSize === size.value && <div className="w-2 h-2 bg-black rounded-full" />}
            </button>
            
          ))}
        </div>
      )}
    </div>
  );
};

export default FrameSizeDropdown;
