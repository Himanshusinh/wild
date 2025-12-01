'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const [isActiveInstance, setIsActiveInstance] = useState(false);
  const buttonJustClickedRef = useRef(false);
  const shouldCloseRef = useRef(false);
  const selectingRef = useRef(false);

  // Reset active instance when dropdown closes
  useEffect(() => {
    if (activeDropdown !== 'frameSize') {
      setIsActiveInstance(false);
      setDropdownPosition(null);
    }
  }, [activeDropdown]);

  // Calculate dropdown position when it opens or on scroll/resize
  useEffect(() => {
    const updateDropdownPosition = () => {
      // Only render dropdown for the active instance
      if (activeDropdown === 'frameSize' && isActiveInstance && buttonRef.current) {
        // Check if button is actually visible (not hidden by CSS like display:none or hidden class)
        const computedStyle = window.getComputedStyle(buttonRef.current);
        const isDisplayed = computedStyle.display !== 'none';
        const isVisible = computedStyle.visibility !== 'hidden';
        const hasOpacity = parseFloat(computedStyle.opacity) > 0;
        
        // Check if element has dimensions (not collapsed)
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const hasDimensions = buttonRect.width > 0 && buttonRect.height > 0;
        
        // Only create dropdown if button is actually visible
        if (!isDisplayed || !isVisible || !hasOpacity || !hasDimensions) {
          setDropdownPosition(null);
          return;
        }
        
        const dropdownWidth = 176; // w-44 = 11rem = 176px
        const spaceAbove = buttonRect.top;
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        
        let top: number;
        let left: number;
        
        // Determine if we should open up or down based on available space
        const shouldOpenUp = openDirection === 'up' || (spaceAbove > spaceBelow && openDirection !== 'down');
        
        if (shouldOpenUp) {
          // Position top of dropdown at button top, then translate up by 100% to make it grow upward
          top = buttonRect.top;
          left = buttonRect.left;
        } else {
          // Position below the button
          top = buttonRect.bottom + 8; // mt-2 = 8px
          left = buttonRect.left;
        }
        
        // Ensure dropdown doesn't go off screen horizontally
        if (left + dropdownWidth > window.innerWidth) {
          left = window.innerWidth - dropdownWidth - 8;
        }
        if (left < 8) {
          left = 8;
        }
        
        // If opening up and dropdown would go off screen, switch to opening down
        let finalOpenUp = shouldOpenUp;
        if (shouldOpenUp && top < 8) {
          // Switch to opening down instead
          top = buttonRect.bottom + 8;
          finalOpenUp = false;
        }
        
        setDropdownPosition({ top, left, openUp: finalOpenUp });
      } else {
        setDropdownPosition(null);
      }
    };

    updateDropdownPosition();
    
    if (activeDropdown === 'frameSize') {
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      
      // Close dropdown when clicking outside
      // Use bubble phase so React's onClick runs first
      const handleClickOutside = (event: MouseEvent) => {
        // Don't close if button was just clicked, we're in the process of closing, or selecting
        if (buttonJustClickedRef.current || shouldCloseRef.current || selectingRef.current) {
          return;
        }
        
        const target = event.target as HTMLElement;
        // Don't close if clicking the button itself
        if (buttonRef.current && buttonRef.current.contains(target)) {
          return;
        }
        // Don't close if clicking inside the dropdown
        if (target.closest('[data-dropdown="frameSize"]')) {
          return;
        }
        // Close the dropdown
        setIsActiveInstance(false);
        dispatch(toggleDropdown(''));
      };
      
      // Use bubble phase (default) so React's onClick runs first, then this handler
      // Add a small delay to ensure React's event handlers complete first
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [activeDropdown, openDirection, dispatch, isActiveInstance]);

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
  const isZTurbo = selectedModel === 'new-turbo-model';

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
    if (isZTurbo) {
      // z-image-turbo: accepts width/height directly, so supports all common aspect ratios
      // Supported ratios: 1:1, 3:4, 2:3, 9:16, 4:3, 3:2, 16:9, 21:9, 4:5, 5:4, 2:1, 1:2, 3:1, 1:3, 10:16, 16:10, 9:21
      const allowed = new Set(['1:1', '3:4', '2:3', '9:16', '4:3', '3:2', '16:9', '21:9', '4:5', '5:4', '2:1', '1:2', '3:1', '1:3', '10:16', '16:10', '9:21']);
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

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent click outside handler from firing
    
    // Mark that button was just clicked - do this immediately and synchronously
    buttonJustClickedRef.current = true;
    
    // Check current state and toggle accordingly
    const isCurrentlyOpen = activeDropdown === 'frameSize' && isActiveInstance;
    
    if (isCurrentlyOpen) {
      // Close the dropdown immediately
      setIsActiveInstance(false);
      dispatch(toggleDropdown('')); // Explicitly close by setting to empty
      shouldCloseRef.current = true;
    } else {
      // Open the dropdown
      setIsActiveInstance(true);
      dispatch(toggleDropdown('frameSize'));
      shouldCloseRef.current = false;
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
      buttonJustClickedRef.current = false;
      shouldCloseRef.current = false;
    }, 300);
  };

  const handleFrameSizeSelect = (sizeValue: string) => {
    // Mark that we're selecting to prevent click outside handler from interfering
    selectingRef.current = true;
    
    dispatch(setFrameSize(sizeValue));
    setIsActiveInstance(false);
    dispatch(toggleDropdown(''));
    
    // Reset the flag after a short delay
    setTimeout(() => {
      selectingRef.current = false;
    }, 100);
  };

  const dropdownContent = activeDropdown === 'frameSize' && isActiveInstance && dropdownPosition ? (
    <div 
      data-dropdown="frameSize"
      className="fixed md:w-50 w-44 bg-black/90 backdrop-blur-3xl shadow-2xl rounded-xl ring-1 ring-white/30 pb-2 pt-2 z-[9999] md:max-h-150 max-h-100 overflow-y-auto dropdown-scrollbar"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        transform: dropdownPosition.openUp ? 'translateY(calc(-100% - 8px))' : 'none',
      }}
      onMouseDown={(e) => {
        // Prevent mousedown from triggering click outside handler
        e.stopPropagation();
      }}
      onClick={(e) => {
        // Prevent clicks inside dropdown from bubbling to document
        e.stopPropagation();
      }}
    >
      {frameSizes.map((size) => (
        <button
          key={size.value}
          onMouseDown={(e) => {
            // Prevent mousedown from triggering click outside handler
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFrameSizeSelect(size.value);
          }}
          className={`w-full px-3 py-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between gap-3 ${frameSize === size.value
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
  ) : null;

  return (
    <>
      <div className="relative dropdown-container">
        <button
          ref={buttonRef}
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
      </div>
      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};

export default FrameSizeDropdown;
