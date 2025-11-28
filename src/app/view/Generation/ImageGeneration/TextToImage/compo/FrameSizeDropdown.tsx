'use client';

import React, { useEffect, useRef } from 'react';
import { Crop, ChevronUp } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setFrameSize } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

type FrameSizeDropdownProps = {
  openDirection?: 'up' | 'down';
};

const FrameSizeDropdown = ({ openDirection = 'up' }: FrameSizeDropdownProps) => {
  const dispatch = useAppDispatch();
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-dev');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      }, 20000);
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
    // Additional ratios for various models
    { name: 'Portrait 4:5', value: '4:5', icon: 'portrait', hideValue: true },
    { name: 'Landscape 5:4', value: '5:4', icon: 'landscape', hideValue: true },
    { name: 'Ultra Wide 2:1', value: '2:1', icon: 'ultrawide', hideValue: true },
    { name: 'Portrait 1:2', value: '1:2', icon: 'portrait', hideValue: true },
    { name: 'Ultra Wide 3:1', value: '3:1', icon: 'ultrawide', hideValue: true },
    { name: 'Portrait 1:3', value: '1:3', icon: 'portrait', hideValue: true },
    // Additional ratios for Ideogram and BFL Flux
    { name: 'Portrait 10:16', value: '10:16', icon: 'portrait', hideValue: true },
    { name: 'Landscape 16:10', value: '16:10', icon: 'landscape', hideValue: true },
    { name: 'Portrait 9:21', value: '9:21', icon: 'portrait', hideValue: true },
  ];

  // Some providers (MiniMax) specify an explicit allowed list; others accept broader ranges.
  const isRunway = selectedModel?.startsWith('gen4_image');
  const isMiniMax = selectedModel === 'minimax-image-01';
  const isFlux = selectedModel?.startsWith('flux');
  const isLucidOrigin = selectedModel === 'leonardoai/lucid-origin';
  const isPhoenix = selectedModel === 'leonardoai/phoenix-1.0';
  const isImagen = selectedModel === 'imagen-4-ultra' || selectedModel === 'imagen-4' || selectedModel === 'imagen-4-fast';
  const isSeedream = selectedModel === 'seedream-v4';
  const isGoogleNanoBanana = selectedModel === 'gemini-25-flash-image';
  const isFlux2Pro = selectedModel === 'flux-2-pro';
  const isIdeogram = selectedModel === 'ideogram-ai/ideogram-v3' || selectedModel === 'ideogram-ai/ideogram-v3-quality';

  const frameSizes = (() => {
    if (isFlux2Pro) {
      // Flux 2 Pro: supported aspect ratios from schema
      // Supported: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
      // Map to our aspect ratios: 1:1 (square/square_hd), 3:4 (portrait_4_3), 9:16 (portrait_16_9), 4:3 (landscape_4_3), 16:9 (landscape_16_9)
      const allowed = new Set(['1:1', '4:3', '3:4', '16:9', '9:16']);
      return baseSizes.filter(s => allowed.has(s.value));
    }
    if (isGoogleNanoBanana) {
      // Google Nano Banana: only these aspect ratios are supported according to official schema
      // Supported: 21:9, 1:1, 4:3, 3:2, 2:3, 5:4, 4:5, 3:4, 16:9, 9:16
      const allowed = new Set(['21:9', '1:1', '4:3', '3:2', '2:3', '5:4', '4:5', '3:4', '16:9', '9:16']);
      return baseSizes.filter(s => allowed.has(s.value));
    }
    if (isImagen) {
      // Imagen 4 models: 1:1,16:9,9:16,3:4,4:3 (from validateFalGenerate)
      const allowed = new Set(['1:1', '16:9', '9:16', '3:4', '4:3']);
      return baseSizes.filter(s => allowed.has(s.value));
    }
    if (isSeedream) {
      // Seedream v4: follow schema exactly, include match_input_image
      // Supported: match_input_image,1:1,4:3,3:4,16:9,9:16,3:2,2:3,21:9 (from validateImageGenerate)
      const allowed = [
        { name: 'Match Input Image ', value: 'match_input_image', icon: 'square' },
        { name: 'Square', value: '1:1', icon: 'square' },
        { name: 'Landscape', value: '4:3', icon: 'landscape' },
        { name: 'Portrait', value: '3:4', icon: 'portrait' },
        { name: 'Wide', value: '16:9', icon: 'landscape' },
        { name: 'Vertical', value: '9:16', icon: 'portrait' },
        { name: 'Landscape Wide', value: '3:2', icon: 'landscape' },
        { name: 'Portrait Tall', value: '2:3', icon: 'portrait' },
        { name: 'Ultra Wide', value: '21:9', icon: 'ultrawide' },
      ];
      return allowed;
    }
    if (isIdeogram) {
      // Ideogram v3: 1:3,3:1,1:2,2:1,9:16,16:9,10:16,16:10,2:3,3:2,3:4,4:3,4:5,5:4,1:1 (from validateImageGenerate)
      const allowed = new Set(['1:3', '3:1', '1:2', '2:1', '9:16', '16:9', '10:16', '16:10', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '1:1']);
      return baseSizes.filter(s => allowed.has(s.value));
    }
    if (isLucidOrigin) {
      // Lucid Origin: 1:1,16:9,9:16,3:2,2:3,4:5,5:4,3:4,4:3,2:1,1:2,3:1,1:3 (from validateImageGenerate)
      const allowed = new Set(['1:1', '16:9', '9:16', '3:2', '2:3', '4:5', '5:4', '3:4', '4:3', '2:1', '1:2', '3:1', '1:3']);
      return baseSizes.filter(s => allowed.has(s.value));
    }
    if (isPhoenix) {
      // Phoenix 1.0: 1:1,16:9,9:16,3:2,2:3,4:5,5:4,3:4,4:3,2:1,1:2,3:1,1:3 (from validateImageGenerate)
      const allowed = new Set(['1:1', '16:9', '9:16', '3:2', '2:3', '4:5', '5:4', '3:4', '4:3', '2:1', '1:2', '3:1', '1:3']);
      return baseSizes.filter(s => allowed.has(s.value));
    }
    if (isMiniMax) {
      // MiniMax: 1:1,16:9,4:3,3:2,2:3,3:4,9:16,21:9
      const allowed = new Set(['1:1', '16:9', '4:3', '3:2', '2:3', '3:4', '9:16', '21:9']);
      return baseSizes.filter(s => allowed.has(s.value));
    }
    if (isFlux) {
      // BFL Flux models: 1:1,3:4,4:3,16:9,9:16,3:2,2:3,21:9,9:21,16:10,10:16 (from validateBflGenerate)
      const allowed = new Set(['1:1', '3:4', '4:3', '16:9', '9:16', '3:2', '2:3', '21:9', '9:21', '16:10', '10:16']);
      return baseSizes.filter(s => allowed.has(s.value));
    }
    if (isRunway) {
      // Runway: we map to pixel ratios later; keep a rich but safe set
      return baseSizes;
    }
    return baseSizes;
  })();

  // Auto-switch to supported frame size when model changes
  useEffect(() => {
    const currentFrameSize = frameSize;
    const isCurrentFrameSizeSupported = frameSizes.some(size => size.value === currentFrameSize);
    
    if (!isCurrentFrameSizeSupported && frameSizes.length > 0) {
      // Switch to the first supported frame size (usually 1:1)
      dispatch(setFrameSize(frameSizes[0].value));
    }
  }, [selectedModel, frameSizes, frameSize, dispatch]);

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('frameSize'));
  };

  const handleFrameSizeSelect = (sizeValue: string) => {
    dispatch(setFrameSize(sizeValue));
    dispatch(toggleDropdown(''));
  };

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className={`h-[28px] md:h-[32px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${frameSize !== '1:1'
            ? 'bg-transparent text-white/90'
            : 'bg-transparent text-white/90 hover:bg-white/5'
          }`}
      >
        <Crop className="w-4 h-4 mr-1" />
        {frameSizes.find(s => s.value === frameSize)?.name || 'Frame Size'}
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'frameSize' ? 'rotate-180' : ''}`} />
      </button>
      {activeDropdown === 'frameSize' && (
        <div
          className={`
            md:absolute md:${openDirection === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'} md:left-0 md:w-44 md:bg-black/80 md:backdrop-blur-xl md:rounded-xl md:ring-1 md:ring-white/30 md:pb-2 md:pt-2 md:z-50 z-[70] md:shadow-2xl
            fixed bg-black/90 backdrop-blur-xl shadow-2xl left-0 right-0 top-0 w-full z-[9999] rounded-b-xl ring-1 ring-white/30 pb-2 pt-2
          `}
          style={window.innerWidth <= 768 ? {
            position: 'fixed',
            left: 0,
            right: 0,
            top: 0,
            width: '100vw',
            zIndex: 9999,
            borderRadius: '0 0 16px 16px',
            maxHeight: '50vh',
            minHeight: 120,
            overflowY: 'auto',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          } : {}}
        >


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
              {size.value !== 'match_input_image' && !(size as any).hideValue && (
                <span className={`text-[12px] ${frameSize === size.value ? 'text-black/70' : 'text-white/50'}`}>{size.value}</span>
              )}
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
