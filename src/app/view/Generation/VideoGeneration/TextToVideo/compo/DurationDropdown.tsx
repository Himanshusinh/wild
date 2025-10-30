"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DurationDropdownProps {
  selectedModel: string;
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
  disabled?: boolean;
}

const DurationDropdown: React.FC<DurationDropdownProps> = ({
  selectedModel,
  selectedDuration,
  onDurationChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get available durations based on model
  const getAvailableDurations = () => {
    if (selectedModel === "MiniMax-Hailuo-02") {
      return [6, 10];
    } else {
      return [6];
    }
  };

  const availableDurations = getAvailableDurations();

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

  const handleDurationSelect = (duration: number) => {
    onDurationChange(duration);
    setIsOpen(false);
  };

  // Auto-select first available duration if current selection is invalid
  useEffect(() => {
    if (availableDurations.length > 0 && !availableDurations.includes(selectedDuration)) {
      onDurationChange(availableDurations[0]);
    }
  }, [selectedModel, selectedDuration, availableDurations, onDurationChange]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${isOpen ? "bg-white/10 border-white/20" : ""}`}
      >
        <div className="flex flex-col items-start">
          <span className="text-white font-medium">Duration</span>
          <span className="text-xs text-white/60 mt-0.5">{selectedDuration}s</span>
        </div>
        <ChevronUp
          className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          <div className="p-2">
            {availableDurations.map((duration) => (
              <button
                key={duration}
                onClick={() => handleDurationSelect(duration)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-white/10 ${
                  selectedDuration === duration ? "bg-white/20" : ""
                }`}
              >
                <span className="text-white font-medium text-sm">{duration}s</span>
                <div className="text-xs text-white/60 mt-1">
                  {duration === 6 && 'Standard duration (6 seconds)'}
                  {duration === 10 && 'Extended duration (10 seconds)'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DurationDropdown;
