"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Play, Image as ImageIcon, Cpu, Sparkles, Zap } from "lucide-react";
import { getModelCreditInfo } from '@/utils/modelCredits';

interface VideoModelsDropdownProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  generationMode: "text_to_video" | "image_to_video" | "video_to_video";
  selectedDuration?: string;
  selectedResolution?: string;
  onCloseOtherDropdowns?: () => void;
  onCloseThisDropdown?: () => void;
}

const VideoModelsDropdown: React.FC<VideoModelsDropdownProps> = ({
  selectedModel,
  onModelChange,
  generationMode,
  selectedDuration = "5s",
  selectedResolution = "512P",
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

  // Auto-close dropdown after 20 seconds
  useEffect(() => {
    if (isOpen) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for 20 seconds
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 20000);
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

  // Get available models based on generation mode
  const getAvailableModels = () => {
    if (generationMode === "text_to_video") {
      return [
        { value: "veo3-t2v-8s", label: "Veo3", description: "Google's latest video model, 4s/6s/8s, 720p/1080p", provider: "fal" },
        { value: "veo3-fast-t2v-8s", label: "Veo3 Fast", description: "Faster generation, 4s/6s/8s, 720p/1080p", provider: "fal" },
        { value: "kling-v2.5-turbo-pro-t2v", label: "Kling 2.5 Turbo Pro", description: "Text→Video, 5s/10s, 16:9/9:16/1:1", provider: "replicate" },
        { value: "kling-v2.1-t2v", label: "Kling 2.1", description: "Text→Video, 5s/10s, 16:9/9:16/1:1 (standard/pro)", provider: "replicate" },
        { value: "wan-2.5-t2v", label: "WAN 2.5 T2V", description: "Text→Video, 5s/10s, 480p/720p/1080p", provider: "replicate" },
        { value: "wan-2.5-t2v-fast", label: "WAN 2.5 T2V Fast", description: "Faster text→video, 5s/10s, 480p/720p/1080p", provider: "replicate" },
        { value: "MiniMax-Hailuo-02", label: "MiniMax-Hailuo-02", description: "Text→Video / Image→Video, 6s/10s, 768P/1080P", provider: "minimax" },
        { value: "T2V-01-Director", label: "T2V-01-Director", description: "Text→Video only, 6s, 720P, Camera movements", provider: "minimax" }
      ];
    } else if (generationMode === "image_to_video") {
      return [
        { value: "veo3-i2v-8s", label: "Veo3 ", description: "Google's image-to-video model, 8s, 720p/1080p", provider: "fal" },
        { value: "veo3-fast-i2v-8s", label: "Veo3 Fast", description: "Faster image-to-video, 8s, 720p/1080p", provider: "fal" },
        { value: "kling-v2.5-turbo-pro-i2v", label: "Kling 2.5 Turbo Pro", description: "Image→Video, 5s/10s, 16:9/9:16/1:1", provider: "replicate" },
        { value: "kling-v2.1-i2v", label: "Kling 2.1", description: "Image→Video, 5s/10s, 16:9/9:16/1:1 (standard/pro)", provider: "replicate" },
        { value: "wan-2.5-i2v", label: "WAN 2.5 I2V", description: "Image→Video, 5s/10s, 480p/720p/1080p", provider: "replicate" },
        { value: "wan-2.5-i2v-fast", label: "WAN 2.5 I2V Fast", description: "Faster image→video, 5s/10s, 480p/720p/1080p", provider: "replicate" },
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
  const selectedModelInfo = availableModels.find(model => model.value === selectedModel) || availableModels.find(m => selectedModel.startsWith('kling-') && m.value.startsWith('kling-')) || availableModels[0];

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
    <div ref={dropdownRef} className="relative dropdown-container">
      <button
      onClick={() => {
        try {
          if (onCloseOtherDropdowns) onCloseOtherDropdowns();
        } catch {}
        setIsOpen(!isOpen);
      }}
        className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          selectedModel === 'gen4_aleph' || selectedModel.includes('MiniMax') || selectedModel.includes('veo3') || selectedModel.includes('wan-2.5')
            ? 'bg-white text-black' 
            : 'bg-transparent text-white/90 hover:bg-white/5'
        }`}
      >
        <Cpu className="w-4 h-4 mr-1" />
        {selectedModelInfo?.label || selectedModel}
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-black/30 dark:ring-white/30 pb-2 pt-2">
          {/* Mode indicator */}
          <div className="px-4 py-2 text-xs text-black/60 dark:text-white/60 border-b border-black/10 dark:border-white/10">
            {generationMode === "text_to_video" ? "Text → Video Models" : 
             generationMode === "image_to_video" ? "Image → Video Models" : "Video → Video Models"}
          </div>
          
          {modelsWithCredits.map((model) => (
            <button
              key={model.value}
              onClick={() => {
                try { onModelChange(model.value); } catch {}
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                selectedModel === model.value
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-black/90 dark:text-white/90 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{model.label}</span>
                  {model.provider === "minimax" && (
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  )}
                  {model.provider === "fal" && (
                    <img src="/icons/crown.svg" alt="priority" className="w-4 h-4 opacity-90" />
                  )}
                  {model.provider === "replicate" && (
                    <Zap className="w-3 h-3 text-blue-400" />
                  )}
                </div>
                <span className="text-xs opacity-70">{model.description}</span>
                {model.credits && (
                  <span className="text-xs opacity-70 mt-0.5">{model.displayText}</span>
                )}
              </div>
              {selectedModel === model.value && (
                <div className="w-2 h-2 bg-white dark:bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoModelsDropdown;
