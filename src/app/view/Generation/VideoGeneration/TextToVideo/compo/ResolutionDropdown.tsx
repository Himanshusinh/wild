"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Monitor } from "lucide-react";

interface ResolutionDropdownProps {
  selectedModel: string;
  selectedResolution: string;
  onResolutionChange: (resolution: string) => void;
  disabled?: boolean;
}

const ResolutionDropdown: React.FC<ResolutionDropdownProps> = ({
  selectedModel,
  selectedResolution,
  onResolutionChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get available resolutions based on model
  const getAvailableResolutions = () => {
    if (selectedModel === "wan-2.2-animate-replace") {
      return ["480p", "720p"]; // WAN 2.2 Animate Replace only supports 480p and 720p
    } else if (selectedModel?.includes("seedance")) {
      return ["480p", "720p", "1080p"];
    } else if (selectedModel === "MiniMax-Hailuo-02") {
      return ["768P", "1080P"];
    } else if (selectedModel.includes("Director") || selectedModel === "S2V-01") {
      return ["720P"];
    } else if (selectedModel?.includes("ltx2")) {
      return ["1080p", "1440p", "2160p"]; // LTX V2 supports 1080p/1440p/2160p
    } else if (selectedModel?.includes('veo3.1')) {
      // Veo 3.1 supports 720p/1080p
      return ["720p","1080p"];
    } else if (selectedModel?.includes('veo3')) {
      return ["720p","1080p"];
    } else if (selectedModel?.includes('sora2')) {
      // Sora 2 Standard T2V: 720p; Pro T2V: 720p/1080p; I2V: auto/720p (Pro also 1080p)
      const lower = selectedModel.toLowerCase();
      if (lower.includes('i2v')) return ["auto","720p","1080p"];
      if (lower.includes('pro')) return ["720p","1080p"];
      return ["720p"];
    }
    return ["1080P"];
  };

  const availableResolutions = getAvailableResolutions();

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

  const handleResolutionSelect = (resolution: string) => {
    onResolutionChange(resolution);
    setIsOpen(false);
  };

  // Auto-select first available resolution if current selection is invalid
  useEffect(() => {
    if (availableResolutions.length > 0 && !availableResolutions.includes(selectedResolution)) {
      onResolutionChange(availableResolutions[0]);
    }
  }, [selectedModel, selectedResolution, availableResolutions, onResolutionChange]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent  text-white ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <Monitor className="md:w-4 w-3 h-3 md:h-4  mr-1" />
        {selectedResolution || 'Resolution'}
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 md:w-48 w-28 bg-black/70 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-50">
          {availableResolutions.map((resolution) => (
            <button
              key={resolution}
              onClick={() => handleResolutionSelect(resolution)}
              className={`w-full md:px-4 md:p-2 p-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
                selectedResolution === resolution ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span className="md:text-sm text-xs">{resolution}</span>
              {selectedResolution === resolution && <div className="w-2 h-2 bg-black rounded-full"></div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResolutionDropdown;
