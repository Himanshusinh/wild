'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleDropdown } from '@/store/slices/uiSlice';

type ResolutionType = '1K' | '2K' | '4K' | 'custom';

type ResolutionDropdownProps = {
  openDirection?: 'up' | 'down';
  resolution: ResolutionType;
  onResolutionChange: (resolution: ResolutionType) => void;
  options: ResolutionType[];
  dropdownId: string; // 'flux2ProResolution' | 'nanoBananaProResolution' | 'seedreamSize'
};

const ResolutionDropdown = ({ 
  openDirection = 'up',
  resolution,
  onResolutionChange,
  options,
  dropdownId
}: ResolutionDropdownProps) => {
  const dispatch = useAppDispatch();
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const [isActiveInstance, setIsActiveInstance] = useState(false);
  const buttonJustClickedRef = useRef(false);
  const shouldCloseRef = useRef(false);
  const selectingRef = useRef(false);

  // Reset active instance when dropdown closes
  useEffect(() => {
    if (activeDropdown !== dropdownId) {
      setIsActiveInstance(false);
      setDropdownPosition(null);
    }
  }, [activeDropdown, dropdownId]);

  // Calculate dropdown position when it opens or on scroll/resize
  useEffect(() => {
    const updateDropdownPosition = () => {
      // Only render dropdown for the active instance
      if (activeDropdown === dropdownId && isActiveInstance && buttonRef.current) {
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
    
    if (activeDropdown === dropdownId) {
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      
      // Close dropdown when clicking outside
      // Use mousedown instead of click to avoid conflicts with React's onClick
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
        if (target.closest(`[data-dropdown="${dropdownId}"]`)) {
          return;
        }
        // Close the dropdown
        setIsActiveInstance(false);
        dispatch(toggleDropdown(''));
      };
      
      // Use mousedown event with capture phase to catch events early
      // This ensures we can check before React's onClick handlers run
      document.addEventListener('mousedown', handleClickOutside, true);
      
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [activeDropdown, openDirection, dispatch, isActiveInstance, dropdownId]);

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent click outside handler from firing
    
    // Mark that button was just clicked - do this immediately and synchronously
    buttonJustClickedRef.current = true;
    
    // Check current state and toggle accordingly
    const isCurrentlyOpen = activeDropdown === dropdownId && isActiveInstance;
    
    if (isCurrentlyOpen) {
      // Close the dropdown immediately
      setIsActiveInstance(false);
      dispatch(toggleDropdown('')); // Explicitly close by setting to empty
      shouldCloseRef.current = true;
    } else {
      // Open the dropdown
      setIsActiveInstance(true);
      dispatch(toggleDropdown(dropdownId));
      shouldCloseRef.current = false;
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
      buttonJustClickedRef.current = false;
      shouldCloseRef.current = false;
    }, 300);
  };

  const handleResolutionSelect = (opt: ResolutionType) => {
    // Mark that we're selecting to prevent click outside handler from interfering
    selectingRef.current = true;
    
    onResolutionChange(opt);
    setIsActiveInstance(false);
    dispatch(toggleDropdown(''));
    
    // Reset the flag after a short delay
    setTimeout(() => {
      selectingRef.current = false;
    }, 100);
  };

  const dropdownContent = activeDropdown === dropdownId && isActiveInstance && dropdownPosition ? (
    <div 
      data-dropdown={dropdownId}
      className="fixed w-18 bg-black/90 backdrop-blur-3xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/30 py-1 z-[9999] md:max-h-150 max-h-100 overflow-y-auto dropdown-scrollbar"
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
      {options.map((opt) => (
        <button
          key={opt}
          onMouseDown={(e) => {
            // Prevent mousedown from triggering click outside handler
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
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
          <ChevronUp className={`w-4 h-4 transition-transform ${activeDropdown === dropdownId ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};

export default ResolutionDropdown;

