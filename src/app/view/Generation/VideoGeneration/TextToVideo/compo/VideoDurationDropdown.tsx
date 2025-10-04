"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";

interface VideoDurationDropdownProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
  onCloseOtherDropdowns?: () => void;
  onCloseThisDropdown?: () => void;
}

const VideoDurationDropdown: React.FC<VideoDurationDropdownProps> = ({
  selectedDuration,
  onDurationChange,
  onCloseOtherDropdowns,
  onCloseThisDropdown,
}) => {
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

  // Auto-close dropdown after 5 seconds
  useEffect(() => {
    if (isOpen) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for 5 seconds
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
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
  }, [isOpen]);

  // Close this dropdown when parent requests it
  useEffect(() => {
    if (onCloseThisDropdown && isOpen) {
      setIsOpen(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [onCloseThisDropdown, isOpen]);

  const availableDurations = [
    { value: 5, label: "5 seconds", description: "Short video" },
    { value: 10, label: "10 seconds", description: "Standard length" }
  ];

  const selectedDurationInfo = availableDurations.find(duration => duration.value === selectedDuration);

  return (
    <div className="relative dropdown-container">
      <button
        onClick={() => {
          // Close other dropdowns if they exist
          if (onCloseOtherDropdowns) {
            onCloseOtherDropdowns();
          }
          setIsOpen(!isOpen);
        }}
        className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          selectedDuration !== 5 
            ? 'bg-white text-black' 
            : 'bg-transparent text-white/90 hover:bg-white/5'
        }`}
      >
        <Clock className="w-4 h-4 mr-1" />
        {selectedDurationInfo?.label || `${selectedDuration}s`}
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-32 bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          {availableDurations.map((duration) => (
            <button
              key={duration.value}
              onClick={() => {
                onDurationChange(duration.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                selectedDuration === duration.value
                  ? 'bg-white text-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span>{duration.label}</span>
              {selectedDuration === duration.value && (
                <div className="w-2 h-2 bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoDurationDropdown;
