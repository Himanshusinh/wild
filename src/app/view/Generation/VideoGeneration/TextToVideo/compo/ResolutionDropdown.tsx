"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

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

  // Get available resolutions based on model
  const getAvailableResolutions = () => {
    if (selectedModel === "MiniMax-Hailuo-02") {
      return ["768P", "1080P"];
    } else if (selectedModel.includes("Director") || selectedModel === "S2V-01") {
      return ["720P"];
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
        className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${isOpen ? "bg-white/10 border-white/20" : ""}`}
      >
        <div className="flex flex-col items-start">
          <span className="text-white font-medium">Resolution</span>
          <span className="text-xs text-white/60 mt-0.5">{selectedResolution}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          <div className="p-2">
            {availableResolutions.map((resolution) => (
              <button
                key={resolution}
                onClick={() => handleResolutionSelect(resolution)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-white/10 ${
                  selectedResolution === resolution ? "bg-white/20" : ""
                }`}
              >
                <span className="text-white font-medium text-sm">{resolution}</span>
                <div className="text-xs text-white/60 mt-1">
                  {resolution === '1080P' && 'Full HD (1920x1080)'}
                  {resolution === '768P' && 'HD+ (1366x768)'}
                  {/* {resolution === '512P' && 'SD (768x512)'} */}
                  {resolution === '720P' && 'HD (1280x720)'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResolutionDropdown;
