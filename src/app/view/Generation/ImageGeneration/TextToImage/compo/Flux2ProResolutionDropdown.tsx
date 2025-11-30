'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleDropdown } from '@/store/slices/uiSlice';

type Flux2ProResolutionDropdownProps = {
  openDirection?: 'up' | 'down';
  resolution: '1K' | '2K';
  onResolutionChange: (resolution: '1K' | '2K') => void;
};

const Flux2ProResolutionDropdown = ({ 
  openDirection = 'up',
  resolution,
  onResolutionChange
}: Flux2ProResolutionDropdownProps) => {
  const dispatch = useAppDispatch();
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const [isActiveInstance, setIsActiveInstance] = useState(false);
  const buttonJustClickedRef = useRef(false);
  const shouldCloseRef = useRef(false);

  const options: ('1K' | '2K')[] = ['1K', '2K'];

  // Reset active instance when dropdown closes
  useEffect(() => {
    if (activeDropdown !== 'flux2ProResolution') {
      setIsActiveInstance(false);
      setDropdownPosition(null);
    }
  }, [activeDropdown]);

  // Calculate dropdown position when it opens or on scroll/resize
  useEffect(() => {
    const updateDropdownPosition = () => {
      // Only render dropdown for the active instance
      if (activeDropdown === 'flux2ProResolution' && isActiveInstance && buttonRef.current) {
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
        
        const dropdownWidth = 72; // w-18 = 4.5rem = 72px
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
    
    if (activeDropdown === 'flux2ProResolution') {
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      
      // Close dropdown when clicking outside
      // Use bubble phase (default) so React's onClick runs first, then this handler
      const handleClickOutside = (event: MouseEvent) => {
        // Don't close if button was just clicked or we're in the process of closing
        if (buttonJustClickedRef.current || shouldCloseRef.current) {
          return;
        }
        
        const target = event.target as HTMLElement;
        // Don't close if clicking the button itself
        if (buttonRef.current && buttonRef.current.contains(target)) {
          return;
        }
        // Don't close if clicking inside the dropdown
        if (target.closest('[data-dropdown="flux2ProResolution"]')) {
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

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent click outside handler from firing
    
    // Mark that button was just clicked - do this immediately and synchronously
    buttonJustClickedRef.current = true;
    
    // Check current state and toggle accordingly
    const isCurrentlyOpen = activeDropdown === 'flux2ProResolution' && isActiveInstance;
    
    if (isCurrentlyOpen) {
      // Close the dropdown immediately
      setIsActiveInstance(false);
      dispatch(toggleDropdown('')); // Explicitly close by setting to empty
      shouldCloseRef.current = true;
    } else {
      // Open the dropdown
      setIsActiveInstance(true);
      dispatch(toggleDropdown('flux2ProResolution'));
      shouldCloseRef.current = false;
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
      buttonJustClickedRef.current = false;
      shouldCloseRef.current = false;
    }, 300);
  };

  const handleResolutionSelect = (opt: '1K' | '2K') => {
    onResolutionChange(opt);
    setIsActiveInstance(false);
    dispatch(toggleDropdown(''));
  };

  const dropdownContent = activeDropdown === 'flux2ProResolution' && isActiveInstance && dropdownPosition ? (
    <div 
      data-dropdown="flux2ProResolution"
      className="fixed md:w-18 w-18 bg-black/90 backdrop-blur-3xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/30 py-1 z-[9999] md:max-h-150 max-h-100 overflow-y-auto dropdown-scrollbar"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        transform: dropdownPosition.openUp ? 'translateY(calc(-100% - 8px))' : 'none',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={(e) => {
            e.stopPropagation();
            handleResolutionSelect(opt);
          }}
          className={`w-18 md:px-4 px-2 md:py-2 py-1 text-left md:text-[13px] text-[11px] flex items-center justify-between ${resolution === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
        >
          <span>{opt}</span>
          {resolution === opt && (
            <span className="w-2 h-2 bg-black rounded-full"></span>
          )}
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
          className="h-[28px] md:h-[32px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-transparent text-white/90 hover:bg-white/5 transition flex items-center gap-2"
        >
          {resolution}
          <ChevronUp className={`w-4 h-4 transition-transform ${activeDropdown === 'flux2ProResolution' ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};

export default Flux2ProResolutionDropdown;

