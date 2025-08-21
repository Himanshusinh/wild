"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface VideoFrameSizeDropdownProps {
  selectedFrameSize: string;
  onFrameSizeChange: (frameSize: string) => void;
  selectedModel: string;
}

const VideoFrameSizeDropdown: React.FC<VideoFrameSizeDropdownProps> = ({
  selectedFrameSize,
  onFrameSizeChange,
  selectedModel,
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

  // Get available frame sizes based on model
  const getAvailableFrameSizes = () => {
    if (selectedModel === "gen3a_turbo") {
      return [
        { value: "16:10", label: "16:10", description: "Widescreen landscape" },
        { value: "10:16", label: "10:16", description: "Portrait mobile" }
      ];
    } else {
      // gen4_turbo and gen4_aleph support more ratios
      return [
        { value: "16:9", label: "16:9", description: "Widescreen landscape" },
        { value: "9:16", label: "9:16", description: "Portrait mobile" },
        { value: "4:3", label: "4:3", description: "Standard landscape" },
        { value: "3:4", label: "3:4", description: "Portrait standard" },
        { value: "1:1", label: "1:1", description: "Square format" },
        { value: "21:9", label: "21:9", description: "Ultra-wide cinematic" }
      ];
    }
  };

  const availableFrameSizes = getAvailableFrameSizes();
  const selectedFrameSizeInfo = availableFrameSizes.find(size => size.value === selectedFrameSize);

  // Auto-adjust frame size if current selection is not available for the model
  useEffect(() => {
    const availableSizes = getAvailableFrameSizes();
    if (!availableSizes.find(size => size.value === selectedFrameSize)) {
      onFrameSizeChange(availableSizes[0].value);
    }
  }, [selectedModel, selectedFrameSize, onFrameSizeChange]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium">
            {selectedFrameSizeInfo?.label || selectedFrameSize}
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
            {availableFrameSizes.map((size) => (
              <button
                key={size.value}
                onClick={() => {
                  onFrameSizeChange(size.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  selectedFrameSize === size.value
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedFrameSize === size.value ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    <span className="text-xs font-mono text-white/80">{size.value}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{size.label}</div>
                    <div className="text-xs text-white/60 mt-1">{size.description}</div>
                  </div>
                  {selectedFrameSize === size.value && (
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

export default VideoFrameSizeDropdown;
