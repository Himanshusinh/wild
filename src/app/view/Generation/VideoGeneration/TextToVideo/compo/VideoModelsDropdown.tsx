"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Play, Image as ImageIcon, Cpu, Sparkles } from "lucide-react";
import { getModelCreditInfo } from '@/utils/modelCredits';

interface VideoModelsDropdownProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  generationMode: "text_to_video" | "image_to_video" | "video_to_video";
  selectedDuration?: string;
  selectedResolution?: string;
}

const VideoModelsDropdown: React.FC<VideoModelsDropdownProps> = ({
  selectedModel,
  onModelChange,
  generationMode,
  selectedDuration = "5s",
  selectedResolution = "512P",
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
    if (generationMode === "text_to_video") {
      return [
        { value: "MiniMax-Hailuo-02", label: "MiniMax-Hailuo-02", description: "Text→Video / Image→Video, 6s/10s, 512P/768P/1080P", provider: "minimax" },
        { value: "T2V-01-Director", label: "T2V-01-Director", description: "Text→Video only, 6s, 720P, Camera movements", provider: "minimax" }
      ];
    } else if (generationMode === "image_to_video") {
      return [
        { value: "gen4_turbo", label: "Gen-4 Turbo", description: "High-quality, fast generation", provider: "runway" },
        { value: "gen3a_turbo", label: "Gen-3a Turbo", description: "Advanced features, last position support", provider: "runway" },
        { value: "MiniMax-Hailuo-02", label: "MiniMax-Hailuo-02", description: "Image→Video, 6s/10s, 512P/768P/1080P", provider: "minimax" },
        { value: "I2V-01-Director", label: "I2V-01-Director", description: "Image→Video only, 6s, 720P, First frame required", provider: "minimax" },
        { value: "S2V-01", label: "S2V-01", description: "Subject→Video (character reference), 6s, 720P", provider: "minimax" }
      ];
    } else {
      // video_to_video - only Runway models support this
      return [
        { value: "gen4_aleph", label: "Gen-4 Aleph", description: "Style transfer and enhancement", provider: "runway" }
      ];
    }
  };

  const availableModels = getAvailableModels();
  const selectedModelInfo = availableModels.find(model => model.value === selectedModel);

  // Add credits information to models
  const modelsWithCredits = availableModels.map(model => {
    const creditInfo = getModelCreditInfo(model.value, selectedDuration, selectedResolution);
    // Debug logging for Gen-4 Turbo and Gen-3a Turbo
    if (model.value === 'gen4_turbo' || model.value === 'gen3a_turbo') {
      console.log(`Credit debug for ${model.value}:`, {
        selectedDuration,
        selectedResolution,
        credits: creditInfo.credits,
        displayText: creditInfo.displayText
      });
    }
    return {
      ...model,
      credits: creditInfo.credits,
      displayText: creditInfo.displayText
    };
  });

  // Auto-select first available model if current selection is invalid
  useEffect(() => {
    if (availableModels.length > 0 && !availableModels.find(model => model.value === selectedModel)) {
      onModelChange(availableModels[0].value);
    }
  }, [generationMode, availableModels, selectedModel, onModelChange]);

  return (
    <div className="relative dropdown-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          selectedModel === 'gen4_aleph' || selectedModel.includes('MiniMax')
            ? 'bg-white text-black' 
            : 'bg-transparent text-white/90 hover:bg-white/5'
        }`}
      >
        <Cpu className="w-4 h-4 mr-1" />
        {(() => {
          const currentModel = modelsWithCredits.find(m => m.value === selectedModel);
          if (currentModel?.credits) {
            return `${currentModel.label} (${currentModel.displayText})`;
          }
          return selectedModelInfo?.label || selectedModel;
        })()}
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          {/* Mode indicator */}
          <div className="px-4 py-2 text-xs text-white/60 border-b border-white/10">
            {generationMode === "text_to_video" ? "Text → Video Models" : 
             generationMode === "image_to_video" ? "Image → Video Models" : "Video → Video Models"}
          </div>
          
          {modelsWithCredits.map((model) => (
            <button
              key={model.value}
              onClick={() => {
                onModelChange(model.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                selectedModel === model.value
                  ? 'bg-white text-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{model.label}</span>
                  {model.provider === "minimax" && (
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  )}
                </div>
                <span className="text-xs opacity-70">{model.description}</span>
                {model.credits && (
                  <span className="text-xs text-blue-400 mt-0.5">{model.displayText}</span>
                )}
              </div>
              {selectedModel === model.value && (
                <div className="w-2 h-2 bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoModelsDropdown;
