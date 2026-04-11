'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleDropdown } from '@/store/slices/uiSlice';

type ThinkingLevelType = 'minimal' | 'high';

type ThinkingLevelDropdownProps = {
  openDirection?: 'up' | 'down';
  thinkingLevel: ThinkingLevelType;
  onThinkingLevelChange: (level: ThinkingLevelType) => void;
  dropdownId: string;
};

const ThinkingLevelDropdown = ({
  openDirection = 'up',
  thinkingLevel,
  onThinkingLevelChange,
  dropdownId,
}: ThinkingLevelDropdownProps) => {
  const dispatch = useAppDispatch();
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const [isActiveInstance, setIsActiveInstance] = useState(false);
  const buttonJustClickedRef = useRef(false);
  const shouldCloseRef = useRef(false);
  const selectingRef = useRef(false);

  const options: ThinkingLevelType[] = ['minimal', 'high'];

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

        const dropdownWidth = 80;
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
        if (buttonJustClickedRef.current || shouldCloseRef.current || selectingRef.current) {
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

  const handleSelect = (opt: ThinkingLevelType) => {
    selectingRef.current = true;
    onThinkingLevelChange(opt);
    setIsActiveInstance(false);
    dispatch(toggleDropdown(''));
    setTimeout(() => {
      selectingRef.current = false;
    }, 100);
  };

  const dropdownContent = activeDropdown === dropdownId && isActiveInstance && dropdownPosition ? (
    <div
      data-dropdown={dropdownId}
      className="fixed bg-black/90 backdrop-blur-3xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/30 py-1 z-[9999] dropdown-scrollbar"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${80}px`,
        transform: dropdownPosition.openUp ? 'translateY(calc(-100% - 8px))' : 'none',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSelect(opt);
          }}
          className={`w-full px-2 py-2 text-left text-[13px] flex items-center justify-center ${thinkingLevel === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
        >
          <span className="font-semibold capitalize">{opt}</span>
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
          className="h-[23px] md:h-[32px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-transparent text-white/90 hover:bg-white/5 transition flex items-center gap-2"
        >
          {thinkingLevel.charAt(0).toUpperCase() + thinkingLevel.slice(1)}
          <ChevronUp className={`w-4 h-4 transition-transform ${activeDropdown === dropdownId ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};

export default ThinkingLevelDropdown;
