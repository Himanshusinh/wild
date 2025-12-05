'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleDropdown } from '@/store/slices/uiSlice';

type ZTurboOutputFormatDropdownProps = {
  openDirection?: 'up' | 'down';
  outputFormat: 'png' | 'jpg' | 'webp';
  onOutputFormatChange: (format: 'png' | 'jpg' | 'webp') => void;
  dropdownId: string;
};

const ZTurboOutputFormatDropdown = ({ 
  openDirection = 'up',
  outputFormat,
  onOutputFormatChange,
  dropdownId
}: ZTurboOutputFormatDropdownProps) => {
  const dispatch = useAppDispatch();
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const [isActiveInstance, setIsActiveInstance] = useState(false);
  const buttonJustClickedRef = useRef(false);
  const shouldCloseRef = useRef(false);

  const options: ('png' | 'jpg' | 'webp')[] = ['png', 'jpg', 'webp'];

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
      if (activeDropdown === dropdownId && isActiveInstance && buttonRef.current) {
        const computedStyle = window.getComputedStyle(buttonRef.current);
        const isDisplayed = computedStyle.display !== 'none';
        const isVisible = computedStyle.visibility !== 'hidden';
        const hasOpacity = parseFloat(computedStyle.opacity) > 0;
        
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const hasDimensions = buttonRect.width > 0 && buttonRect.height > 0;
        
        if (!isDisplayed || !isVisible || !hasOpacity || !hasDimensions) {
          setDropdownPosition(null);
          return;
        }
        
        const dropdownWidth = 72; // w-18 = 4.5rem = 72px
        const spaceAbove = buttonRect.top;
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        
        let top: number;
        let left: number;
        
        const shouldOpenUp = openDirection === 'up' || (spaceAbove > spaceBelow && openDirection !== 'down');
        
        if (shouldOpenUp) {
          top = buttonRect.top;
          left = buttonRect.left;
        } else {
          top = buttonRect.bottom + 8;
          left = buttonRect.left;
        }
        
        if (left + dropdownWidth > window.innerWidth) {
          left = window.innerWidth - dropdownWidth - 8;
        }
        if (left < 8) {
          left = 8;
        }
        
        let finalOpenUp = shouldOpenUp;
        if (shouldOpenUp && top < 8) {
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
      
      const handleClickOutside = (event: MouseEvent) => {
        if (buttonJustClickedRef.current || shouldCloseRef.current) {
          return;
        }
        
        const target = event.target as HTMLElement;
        if (buttonRef.current && buttonRef.current.contains(target)) {
          return;
        }
        if (target.closest(`[data-dropdown="${dropdownId}"]`)) {
          return;
        }
        setIsActiveInstance(false);
        dispatch(toggleDropdown(''));
      };
      
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
  }, [activeDropdown, openDirection, dispatch, isActiveInstance, dropdownId]);

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    buttonJustClickedRef.current = true;
    
    const isCurrentlyOpen = activeDropdown === dropdownId && isActiveInstance;
    
    if (isCurrentlyOpen) {
      setIsActiveInstance(false);
      dispatch(toggleDropdown(''));
      shouldCloseRef.current = true;
    } else {
      setIsActiveInstance(true);
      dispatch(toggleDropdown(dropdownId));
      shouldCloseRef.current = false;
    }
    
    setTimeout(() => {
      buttonJustClickedRef.current = false;
      shouldCloseRef.current = false;
    }, 300);
  };

  const handleOutputFormatSelect = (format: 'png' | 'jpg' | 'webp') => {
    onOutputFormatChange(format);
    setIsActiveInstance(false);
    dispatch(toggleDropdown(''));
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
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleOutputFormatSelect(opt);
          }}
          className={`w-18 md:px-4 px-2 md:py-2 py-1 text-left md:text-[13px] text-[11px] flex items-center justify-between ${outputFormat === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
        >
          <span>{opt.toUpperCase()}</span>
          {outputFormat === opt && (
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
          {outputFormat.toUpperCase()}
          <ChevronUp className={`w-4 h-4 transition-transform ${activeDropdown === dropdownId ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};

export default ZTurboOutputFormatDropdown;

