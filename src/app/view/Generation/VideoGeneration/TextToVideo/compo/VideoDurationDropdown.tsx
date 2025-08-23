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
    <div className="relative dropdown-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          selectedDuration !== 5 
            ? 'bg-white text-black' 
            : 'bg-transparent text-white/90 hover:bg-white/5'
        }`}
      >
        <Clock className="w-4 h-4 mr-1" />
        {selectedDurationInfo?.label || `${selectedDuration}s`}
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
