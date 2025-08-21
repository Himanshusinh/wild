"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Play, Image as ImageIcon } from "lucide-react";

interface VideoModelsDropdownProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  generationMode: "image_to_video" | "video_to_video";
}

const VideoModelsDropdown: React.FC<VideoModelsDropdownProps> = ({
  selectedModel,
  onModelChange,
  generationMode,
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

  // Get available models based on generation mode
  const getAvailableModels = () => {
    if (generationMode === "image_to_video") {
      return [
        { value: "gen4_turbo", label: "Gen-4 Turbo", description: "High-quality, fast generation" },
        { value: "gen3a_turbo", label: "Gen-3a Turbo", description: "Advanced features, last position support" }
      ];
    } else {
      return [
        { value: "gen4_aleph", label: "Gen-4 Aleph", description: "Style transfer and enhancement" }
      ];
    }
  };

  const availableModels = getAvailableModels();
  const selectedModelInfo = availableModels.find(model => model.value === selectedModel);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          {generationMode === "image_to_video" ? (
            <ImageIcon className="w-4 h-4 text-blue-400" />
          ) : (
            <Play className="w-4 h-4 text-green-400" />
          )}
          <span className="text-sm text-white font-medium">
            {selectedModelInfo?.label || selectedModel}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50">
          <div className="p-2">
            {availableModels.map((model) => (
              <button
                key={model.value}
                onClick={() => {
                  onModelChange(model.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  selectedModel === model.value
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedModel === model.value ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    {generationMode === "image_to_video" ? (
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Play className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{model.label}</div>
                    <div className="text-xs text-white/60 mt-1">{model.description}</div>
                  </div>
                  {selectedModel === model.value && (
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

export default VideoModelsDropdown;
