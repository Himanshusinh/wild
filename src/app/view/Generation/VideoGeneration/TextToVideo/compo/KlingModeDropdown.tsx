"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronUp, Settings2 } from "lucide-react";

interface KlingModeDropdownProps {
  value: 'standard' | 'pro';
  onChange: (mode: 'standard' | 'pro') => void;
  onCloseOtherDropdowns?: () => void;
  onCloseThisDropdown?: () => void;
}

const KlingModeDropdown: React.FC<KlingModeDropdownProps> = ({ value, onChange, onCloseOtherDropdowns, onCloseThisDropdown }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUp: boolean; } | null>(null);
  const dropdownId = "video-kling-mode-dropdown";

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (buttonRef.current?.contains(target)) return;
      if (target.closest(`[data-dropdown="${dropdownId}"]`)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownId, isOpen]);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      setDropdownPosition(null);
      return;
    }

    const updateDropdownPosition = () => {
      if (!buttonRef.current) return;
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = window.innerWidth >= 768 ? 192 : 112;
      let left = buttonRect.left;
      let top = buttonRect.top;
      let openUp = true;

      if (left + dropdownWidth > window.innerWidth - 8) {
        left = window.innerWidth - dropdownWidth - 8;
      }
      if (left < 8) left = 8;
      if (top < 8) {
        top = buttonRect.bottom + 8;
        openUp = false;
      }

      setDropdownPosition({ top, left, openUp });
    };

    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen]);

  // Auto-close after 20s to avoid stale open menus
  useEffect(() => {
    if (isOpen) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsOpen(false), 20000);
    } else if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isOpen]);

  // Close when parent requests
  useEffect(() => {
    if (onCloseThisDropdown && isOpen) {
      setIsOpen(false);
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    }
  }, [onCloseThisDropdown, isOpen]);

  const options: Array<{ value: 'standard' | 'pro'; label: string; description: string; }>= [
    { value: 'standard', label: 'Standard', description: '720p' },
    { value: 'pro', label: 'Pro', description: '1080p' },
  ];

  const selected = options.find(o => o.value === value);

  const dropdownContent = isOpen && dropdownPosition ? (
    <div
      data-dropdown={dropdownId}
      className="fixed md:w-48 w-28 bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-[9999]"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        transform: dropdownPosition.openUp ? 'translateY(calc(-100% - 8px))' : 'none',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => { onChange(opt.value); setIsOpen(false); }}
          className={`w-full md:px-4 md:p-2 p-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
            value === opt.value ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
          }`}
        >
          <div className="flex flex-col items-start">
            <span className="font-medium md:text-sm text-xs">{opt.label}</span>
            <span className="md:text-xs   text-xs opacity-70">{opt.description}</span>
          </div>
          {value === opt.value && <div className="w-2 h-2 bg-black rounded-full"></div>}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
    <div className="relative dropdown-container">
      <button
        ref={buttonRef}
        onClick={() => {
          try { if (onCloseOtherDropdowns) onCloseOtherDropdowns(); } catch {}
          setIsOpen(!isOpen);
        }}
        className={`md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5`}
      >
        <Settings2 className="md:w-4 w-3 h-3 md:h-4  mr-1" />
        {selected?.label || (value === 'pro' ? 'Pro' : 'Standard')}
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
    {typeof window !== 'undefined' &&
      dropdownContent &&
      createPortal(dropdownContent, document.body)}
    </>
  );
};

export default KlingModeDropdown;



