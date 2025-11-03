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
        { value: "sora2-t2v", label: "Sora 2", description: "OpenAI's Sora 2, 4s/8s/12s, 720p, 16:9/9:16", provider: "fal" },
        { value: "sora2-pro-t2v", label: "Sora 2 Pro", description: "OpenAI's Sora 2 Pro, 4s/8s/12s, 720p/1080p, 16:9/9:16", provider: "fal" },
        { value: "veo3.1-t2v-8s", label: "Veo 3.1", description: "Google's latest video model, 4s/6s/8s, 720p/1080p", provider: "fal" },
        { value: "veo3.1-fast-t2v-8s", label: "Veo 3.1 Fast", description: "Faster generation, 4s/6s/8s, 720p/1080p", provider: "fal" },
        { value: "veo3-t2v-8s", label: "Veo3", description: "Google's video model, 4s/6s/8s, 720p/1080p", provider: "fal" },
        { value: "veo3-fast-t2v-8s", label: "Veo3 Fast", description: "Faster generation, 4s/6s/8s, 720p/1080p", provider: "fal" },
        { value: "kling-v2.5-turbo-pro-t2v", label: "Kling 2.5 Turbo Pro", description: "Text→Video & Image→Video, 5s/10s, 16:9/9:16/1:1", provider: "replicate" },
        { value: "seedance-1.0-pro-t2v", label: "Seedance 1.0 Pro", description: "Text→Video, 2-12s, 480p/720p/1080p, 16:9/4:3/1:1/3:4/9:16/21:9/9:21", provider: "replicate" },
        { value: "seedance-1.0-lite-t2v", label: "Seedance 1.0 Lite", description: "Text→Video (faster), 2-12s, 480p/720p/1080p, 16:9/4:3/1:1/3:4/9:16/21:9/9:21", provider: "replicate" },
        { value: "pixverse-v5-t2v", label: "PixVerse v5", description: "Text→Video, 5s/8s, 360p/540p/720p/1080p, 16:9/9:16/1:1", provider: "replicate" },
        { value: "ltx2-pro-t2v", label: "LTX V2 Pro (T2V)", description: "Text→Video, 6s/8s/10s, 1080p/1440p/2160p, 16:9 only", provider: "fal" },
        { value: "ltx2-fast-t2v", label: "LTX V2 Fast (T2V)", description: "Text→Video (fast), 6s/8s/10s, 1080p/1440p/2160p, 16:9 only", provider: "fal" },
        { value: "wan-2.5-t2v", label: "WAN 2.5 T2V", description: "Text→Video, 5s/10s, 480p/720p/1080p", provider: "replicate" },
        { value: "wan-2.5-t2v-fast", label: "WAN 2.5 T2V Fast", description: "Faster text→video, 5s/10s, 480p/720p/1080p", provider: "replicate" },
        { value: "MiniMax-Hailuo-02", label: "MiniMax-Hailuo-02", description: "Text→Video / Image→Video, 6s/10s, 768P/1080P", provider: "minimax" },
        { value: "T2V-01-Director", label: "T2V-01-Director", description: "Text→Video only, 6s, 720P, Camera movements", provider: "minimax" }
      ];
    } else if (generationMode === "image_to_video") {
      return [
        { value: "sora2-i2v", label: "Sora 2", description: "OpenAI's Sora 2 I2V, 4s/8s/12s, auto/720p, auto/16:9/9:16", provider: "fal" },
        { value: "sora2-pro-i2v", label: "Sora 2 Pro", description: "OpenAI's Sora 2 Pro I2V, 4s/8s/12s, auto/720p/1080p, auto/16:9/9:16", provider: "fal" },
        { value: "veo3.1-i2v-8s", label: "Veo 3.1", description: "Google's image-to-video model, 8s, 720p/1080p", provider: "fal" },
        { value: "veo3.1-fast-i2v-8s", label: "Veo 3.1 Fast", description: "Faster image-to-video, 8s, 720p/1080p", provider: "fal" },
        { value: "veo3-i2v-8s", label: "Veo3 ", description: "Google's image-to-video model, 8s, 720p/1080p", provider: "fal" },
        { value: "veo3-fast-i2v-8s", label: "Veo3 Fast", description: "Faster image-to-video, 8s, 720p/1080p", provider: "fal" },
        { value: "kling-v2.5-turbo-pro-i2v", label: "Kling 2.5 Turbo Pro", description: "Text→Video & Image→Video, 5s/10s, 16:9/9:16/1:1", provider: "replicate" },
        { value: "seedance-1.0-pro-i2v", label: "Seedance 1.0 Pro", description: "Image→Video, 2-12s, 480p/720p/1080p, supports last frame", provider: "replicate" },
        { value: "seedance-1.0-lite-i2v", label: "Seedance 1.0 Lite", description: "Image→Video (faster), 2-12s, 480p/720p/1080p, supports last frame", provider: "replicate" },
        { value: "pixverse-v5-i2v", label: "PixVerse v5", description: "Image→Video, 5s/8s, 360p/540p/720p/1080p, 16:9/9:16/1:1", provider: "replicate" },
        { value: "kling-v2.1-i2v", label: "Kling 2.1", description: "Image→Video only, 5s/10s, 720p/1080p (requires start image)", provider: "replicate" },
        { value: "kling-v2.1-master-i2v", label: "Kling 2.1 Master", description: "Image→Video only, 5s/10s, 1080p (requires start image)", provider: "replicate" },
        { value: "wan-2.5-i2v", label: "WAN 2.5 I2V", description: "Image→Video, 5s/10s, 480p/720p/1080p", provider: "replicate" },
        { value: "wan-2.5-i2v-fast", label: "WAN 2.5 I2V Fast", description: "Faster image→video, 5s/10s, 480p/720p/1080p", provider: "replicate" },
        { value: "ltx2-pro-i2v", label: "LTX V2 Pro (I2V)", description: "Image→Video, 6s/8s/10s, 1080p/1440p/2160p, 16:9/9:16/auto", provider: "fal" },
        { value: "ltx2-fast-i2v", label: "LTX V2 Fast (I2V)", description: "Image→Video (fast), 6s/8s/10s, 1080p/1440p/2160p, 16:9/9:16/auto", provider: "fal" },
        { value: "gen4_turbo", label: "Gen-4 Turbo", description: "High-quality, fast generation", provider: "runway" },
        { value: "gen3a_turbo", label: "Gen-3a Turbo", description: "Advanced features, last position support", provider: "runway" },
        { value: "MiniMax-Hailuo-02", label: "MiniMax-Hailuo-02", description: "Image→Video, 6s/10s, 512P/768P/1080P", provider: "minimax" },
        { value: "I2V-01-Director", label: "I2V-01-Director", description: "Image→Video only, 6s, 720P, First frame required", provider: "minimax" },
        { value: "S2V-01", label: "S2V-01", description: "Subject→Video (character reference), 6s, 720P", provider: "minimax" }
      ];
    } else {
      // video_to_video - Runway and Sora 2 models support this
      return [
        { value: "sora2-v2v-remix", label: "Sora 2 Remix", description: "OpenAI's Sora 2 V2V remix, transforms existing videos", provider: "fal" },
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
        className={`h-[28px] md:h-[32px] px-2 md:px-4 rounded-lg text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-white text-black`}
      >
        <Cpu className="w-3 h-3 md:w-4 md:h-4 mr-1" />
        {selectedModelInfo?.label || selectedModel}
        <ChevronUp className={`w-3 h-3 md:w-4 md:h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full md:w-[28rem] bg-black/90 backdrop-blur-3xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-1.5 md:pb-2 pt-1.5 md:pt-2 z-80 max-h-[50vh] md:max-h-150 overflow-y-auto dropdown-scrollbar">
          {(() => {
            // Filter models based on current mode (text-to-video or image-to-video)
            const filteredModels = modelsWithCredits.filter(model => {
              if (generationMode === 'text_to_video') {
                return model.value.includes('t2v') || model.value.includes('T2V') || 
                       model.value === 'gen4_turbo' || model.value === 'gen3a_turbo' ||
                       model.value === 'MiniMax-Hailuo-02' || model.value === 'S2V-01' ||
                       model.value.includes('seedance') || model.value.includes('pixverse') ||
                       model.value.includes('veo3') || model.value.includes('sora2') || model.value.includes('ltx2');
              } else {
                return model.value.includes('i2v') || model.value.includes('I2V') || 
                       model.value === 'gen4_turbo' || model.value === 'gen3a_turbo' ||
                       model.value === 'MiniMax-Hailuo-02' ||
                       model.value.includes('seedance') || model.value.includes('pixverse') ||
                       model.value.includes('veo3') || model.value.includes('sora2') || model.value.includes('ltx2');
              }
            });

            // For text-to-video: single column
            if (generationMode === 'text_to_video') {
              return (
                <div className="divide-y divide-white/10">
                  {filteredModels.map((model) => (
                    <button
                      key={model.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        try { onModelChange(model.value); } catch {}
                        setIsOpen(false);
                      }}
                      className={`w-full px-2 md:px-4 py-1.5 md:py-2 text-left transition text-xs md:text-[13px] flex items-center justify-between ${selectedModel === model.value
                        ? 'bg-white text-black'
                        : 'text-white/90 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col mb-0">
                        <span className="flex items-center gap-1 md:gap-2">
                          {model.label}
                          <img src="/icons/crown.svg" alt="pro" className="w-3 h-3 md:w-4 md:h-4" />
                        </span>
                        <span className="text-[9px] md:text-[11px] opacity-80 -mt-0.5 font-normal">{model.description}</span>
                        {model.credits && (
                          <span className="text-[9px] md:text-[11px] opacity-80 -mt-0.5 font-normal">{model.credits} credits</span>
                        )}
                      </div>
                      {selectedModel === model.value && (
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              );
            }

            // For image-to-video: two columns on desktop, single column on mobile
            const leftModels = filteredModels.slice(0, Math.ceil(filteredModels.length / 2));
            const rightModels = filteredModels.slice(Math.ceil(filteredModels.length / 2));
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Left column */}
                <div className="divide-y divide-white/10">
                  {leftModels.map((model) => (
                    <button
                      key={`left-${model.value}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        try { onModelChange(model.value); } catch {}
                        setIsOpen(false);
                      }}
                      className={`w-full px-2 md:px-4 py-1.5 md:py-2 text-left transition text-xs md:text-[13px] flex items-center justify-between ${selectedModel === model.value
                        ? 'bg-white text-black'
                        : 'text-white/90 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col mb-0">
                        <span className="flex items-center gap-1 md:gap-2">
                          {model.label}
                          <img src="/icons/crown.svg" alt="pro" className="w-3 h-3 md:w-4 md:h-4" />
                        </span>
                        <span className="text-[9px] md:text-[11px] opacity-80 -mt-0.5 font-normal">{model.description}</span>
                        {model.credits && (
                          <span className="text-[9px] md:text-[11px] opacity-80 -mt-0.5 font-normal">{model.credits} credits</span>
                        )}
                      </div>
                      {selectedModel === model.value && (
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
                {/* Right column */}
                <div className="border-l-0 md:border-l md:border-white/10 divide-y divide-white/10">
                  {rightModels.map((model) => (
                    <button
                      key={`right-${model.value}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        try { onModelChange(model.value); } catch {}
                        setIsOpen(false);
                      }}
                      className={`w-full px-2 md:px-4 py-1.5 md:py-2 text-left transition text-xs md:text-[13px] flex items-center justify-between ${selectedModel === model.value
                        ? 'bg-white text-black'
                        : 'text-white/90 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col -mb-0">
                        <span className="flex items-center gap-1 md:gap-2">
                          {model.label}
                          <img src="/icons/crown.svg" alt="pro" className="w-3 h-3 md:w-4 md:h-4" />
                        </span>
                        <span className="text-[9px] md:text-[11px] opacity-80 -mt-0.5 font-normal">{model.description}</span>
                        {model.credits && (
                          <span className="text-[9px] md:text-[11px] opacity-80 -mt-0.5 font-normal">{model.credits} credits</span>
                        )}
                      </div>
                      {selectedModel === model.value && (
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default VideoModelsDropdown;
