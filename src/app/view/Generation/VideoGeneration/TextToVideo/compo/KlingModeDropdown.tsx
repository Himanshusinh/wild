"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronUp, Settings2 } from "lucide-react";

interface KlingModeDropdownProps {
  value: 'standard' | 'pro';
  onChange: (mode: 'standard' | 'pro') => void;
  onCloseOtherDropdowns?: () => void;
  onCloseThisDropdown?: () => void;
}

const KlingModeDropdown: React.FC<KlingModeDropdownProps> = ({ value, onChange, onCloseOtherDropdowns, onCloseThisDropdown }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <div className="relative dropdown-container" ref={dropdownRef}>
      <button
        onClick={() => {
          try { if (onCloseOtherDropdowns) onCloseOtherDropdowns(); } catch {}
          setIsOpen(!isOpen);
        }}
        className={`h-[28px] md:h-[32px] px-2 md:px-4 rounded-lg text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-white text-black`}
      >
        <Settings2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
        {selected?.label || (value === 'pro' ? 'Pro' : 'Standard')}
        <ChevronUp className={`w-3 h-3 md:w-4 md:h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-[70vw] md:w-40 bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-1.5 md:pb-2 pt-1.5 md:pt-2 z-50">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`w-full px-2 md:px-4 py-1.5 md:py-2 text-left transition text-[10px] md:text-[13px] flex items-center justify-between ${
                value === opt.value ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{opt.label}</span>
                <span className="text-[9px] md:text-xs opacity-70">{opt.description}</span>
              </div>
              {value === opt.value && <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full"></div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default KlingModeDropdown;



