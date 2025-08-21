"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Clock } from "lucide-react";

interface VideoDurationDropdownProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
}

const VideoDurationDropdown: React.FC<VideoDurationDropdownProps> = ({
  selectedDuration,
  onDurationChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const availableDurations = [
    { value: 5, label: "5 seconds", description: "Short video" },
    { value: 10, label: "10 seconds", description: "Standard length" }
  ];

  const selectedDurationInfo = availableDurations.find(duration => duration.value === selectedDuration);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-white font-medium">
            {selectedDurationInfo?.label || `${selectedDuration}s`}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50">
          <div className="p-2">
            {availableDurations.map((duration) => (
              <button
                key={duration.value}
                onClick={() => {
                  onDurationChange(duration.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  selectedDuration === duration.value
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedDuration === duration.value ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{duration.label}</div>
                    <div className="text-xs text-white/60 mt-1">{duration.description}</div>
                  </div>
                  {selectedDuration === duration.value && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDurationDropdown;
