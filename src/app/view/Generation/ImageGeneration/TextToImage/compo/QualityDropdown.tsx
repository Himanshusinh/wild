'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleDropdown } from '@/store/slices/uiSlice';
import { getCreditsForModel } from '@/utils/modelCredits';

type QualityType = 'low' | 'medium' | 'high' | 'auto';

type QualityDropdownProps = {
  openDirection?: 'up' | 'down';
  quality: QualityType;
  onQualityChange: (quality: QualityType) => void;
  dropdownId: string; // 'gptImage15Quality'
  model?: 'openai/gpt-image-1.5' | 'openai/gpt-image-2';
};

const QualityDropdown = ({ 
  openDirection = 'up',
  quality,
  onQualityChange,
  dropdownId,
  model = 'openai/gpt-image-1.5'
}: QualityDropdownProps) => {
  const dispatch = useAppDispatch();
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const isOpen = activeDropdown === dropdownId && dropdownPosition !== null;

  const qualityOptions: QualityType[] = ['low', 'medium', 'high', 'auto'];
  const qualityLabels: Record<QualityType, string> = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'auto': 'Auto'
  };
  const hideClosedButtonCreditsOnMobile = model === 'openai/gpt-image-2';

  // Get credits for each quality option (for GPT Image models)
  const getQualityCredits = (qual: QualityType): number | null => {
    return getCreditsForModel(model, undefined, undefined, undefined, undefined, qual);
  };

  // Clear position when another dropdown opens
  useEffect(() => {
    if (activeDropdown !== dropdownId) {
      setDropdownPosition(null);
    }
  }, [activeDropdown, dropdownId]);

  // Update position on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.width === 0) { setDropdownPosition(null); return; }

      const dropdownWidth = 140;
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldOpenUp = openDirection === 'up' || (spaceAbove > spaceBelow && openDirection !== 'down');

      let top = shouldOpenUp ? rect.top : rect.bottom + 8;
      let left = rect.left;

      if (left + dropdownWidth > window.innerWidth) left = window.innerWidth - dropdownWidth - 8;
      if (left < 8) left = 8;
      if (shouldOpenUp && top < 8) top = rect.bottom + 8;

      setDropdownPosition({ top, left, openUp: shouldOpenUp });
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, openDirection]);

  // Outside-click: close when clicking outside button and dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (buttonRef.current?.contains(target)) return;
      if (target.closest(`[data-dropdown="${dropdownId}"]`)) return;
      setDropdownPosition(null);
      dispatch(toggleDropdown(''));
    };

    // Small timeout so this listener is added AFTER the current click event finishes
    const timerId = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpen, dropdownId, dispatch]);

  // Calculate position immediately and toggle open/close
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOpen) {
      // Close
      setDropdownPosition(null);
      dispatch(toggleDropdown(''));
      return;
    }

    // Open — calculate position right now, no extra render cycle needed
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const dropdownWidth = 140;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUp = openDirection === 'up' || (spaceAbove > spaceBelow && openDirection !== 'down');

    let top = shouldOpenUp ? rect.top : rect.bottom + 8;
    let left = rect.left;

    if (left + dropdownWidth > window.innerWidth) left = window.innerWidth - dropdownWidth - 8;
    if (left < 8) left = 8;
    if (shouldOpenUp && top < 8) top = rect.bottom + 8;

    setDropdownPosition({ top, left, openUp: shouldOpenUp });
    dispatch(toggleDropdown(dropdownId));
  };

  const handleQualitySelect = (opt: QualityType) => {
    onQualityChange(opt);
    setDropdownPosition(null);
    dispatch(toggleDropdown(''));
  };

  const dropdownContent = isOpen && dropdownPosition ? (
    <div 
      data-dropdown={dropdownId}
      className="fixed w-[140px] bg-black/90 backdrop-blur-3xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/30 py-1 z-[9999] max-h-60 overflow-y-auto dropdown-scrollbar"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        transform: dropdownPosition.openUp ? 'translateY(calc(-100% - 8px))' : 'none',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {qualityOptions.map((opt) => (
        <button
          key={opt}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleQualitySelect(opt);
          }}
          className={`w-full md:px-4 px-2 md:py-2 py-1 text-left md:text-[13px] text-[11px] flex items-center justify-between ${quality === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
        >
          <div className="flex flex-col">
            <span>{qualityLabels[opt]}</span>
            {(() => {
              const credits = getQualityCredits(opt);
              return credits !== null ? (
                <span className={`md:text-[11px] text-[9px] -mt-0.5 font-normal ${quality === opt ? 'text-black/70' : 'opacity-80'}`}>
                  {credits} credits
                </span>
              ) : null;
            })()}
          </div>
          {quality === opt && (
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
          type="button"
          onClick={handleDropdownClick}
          className="h-[23px] md:h-[32px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-transparent text-white/90 hover:bg-white/5 transition flex items-center gap-2"
        >
          <div className="flex flex-col items-start">
            <span>{qualityLabels[quality]}</span>
            {(() => {
              const credits = getQualityCredits(quality);
              if (credits === null) return null;
              return (
                <>
                  <span className="hidden md:inline md:text-[9px] -mt-0.5 opacity-75">
                    {credits} credits
                  </span>
                  {!hideClosedButtonCreditsOnMobile && (
                    <span className="md:hidden text-[8px] -mt-0.5 opacity-75">
                      {credits} credits
                    </span>
                  )}
                </>
              );
            })()}
          </div>
          <ChevronUp className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};

export default QualityDropdown;
