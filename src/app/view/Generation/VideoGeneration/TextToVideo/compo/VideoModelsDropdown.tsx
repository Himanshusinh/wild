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
  activeFeature?: 'Video' | 'Lipsync' | 'Animate' | 'UGC';
}

const VideoModelsDropdown: React.FC<VideoModelsDropdownProps> = ({
  selectedModel,
  onModelChange,
  generationMode,
  selectedDuration = "5s",
  selectedResolution = "512P",
  onCloseOtherDropdowns,
  onCloseThisDropdown,
  activeFeature = 'Video',
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

  // Get available models - always return all 20 models for consistent visibility
  // Models will auto-convert between t2v/i2v variants based on mode and user input
  const getAvailableModels = () => {
    // For Animate feature, show WAN 2.2 Animate models and Runway Act-Two (check this FIRST)
    if (activeFeature === 'Animate') {
      return [
        { value: "wan-2.2-animate-replace", label: "WAN Animate Replace", description: "Replace character in video with uploaded image, 480p/720p, 5-60fps", provider: "replicate" },
        { value: "wan-2.2-animate-animation", label: "WAN Animate Animation", description: "Animate character image using video motion reference, 480p/720p, 5-60fps", provider: "replicate" },
        { value: "runway-act-two", label: "Runway Act-Two", description: "Control character expressions and movements using reference video, 1280:720/720:1280/960:960", provider: "runway" }
      ];
    }
    
    // For Lipsync feature, only show specific models
    if (activeFeature === 'Lipsync') {
      return [
        { value: "veo3.1-t2v-8s", label: "Veo 3.1", description: "Google's latest video model, 4s/6s/8s, 720p/1080p", provider: "fal" },
        { value: "veo3.1-fast-t2v-8s", label: "Veo 3.1 Fast", description: "Faster generation, 4s/6s/8s, 720p/1080p", provider: "fal" },
        { value: "wan-2.5-t2v", label: "WAN 2.5 Speak", description: "Text→Video & Image→Video, 5s/10s, 480p/720p/1080p", provider: "replicate" },
        { value: "wan-2.5-t2v-fast", label: "WAN 2.5 Fast Speak", description: "Text→Video & Image→Video (faster), 5s/10s, 720p/1080p only", provider: "replicate" },
        { value: "kling-v2.5-turbo-pro-t2v", label: "Kling Lipsync", description: "Text→Video & Image→Video, 5s/10s, 16:9/9:16/1:1", provider: "replicate" }
      ];
    }
    
    // Handle video-to-video mode separately (but not for Animate feature)
    if (generationMode === "video_to_video") {
      return [
        { value: "sora2-v2v-remix", label: "Sora 2 Remix", description: "OpenAI's Sora 2 V2V remix, transforms existing videos", provider: "fal" },
        { value: "gen4_aleph", label: "Gen-4 Aleph", description: "Style transfer and enhancement", provider: "runway" }
      ];
    }
    
    // For text-to-video and image-to-video modes, always return all models
    // This ensures consistent visibility regardless of current mode
    return [
      { value: "sora2-t2v", label: "Sora 2", description: "OpenAI's Sora 2, 4s/8s/12s, 720p, 16:9/9:16", provider: "fal" },
      { value: "sora2-pro-t2v", label: "Sora 2 Pro", description: "OpenAI's Sora 2 Pro, 4s/8s/12s, 720p/1080p, 16:9/9:16", provider: "fal" },
      { value: "veo3.1-t2v-8s", label: "Veo 3.1", description: "Google's latest video model, 4s/6s/8s, 720p/1080p", provider: "fal" },
      { value: "veo3.1-fast-t2v-8s", label: "Veo 3.1 Fast", description: "Faster generation, 4s/6s/8s, 720p/1080p", provider: "fal" },
      { value: "kling-v2.5-turbo-pro-t2v", label: "Kling 2.5 Turbo Pro", description: "Text→Video & Image→Video, 5s/10s, 16:9/9:16/1:1", provider: "replicate" },
      { value: "kling-v2.1-t2v", label: "Kling 2.1", description: "Image→Video only, 5s/10s, 720p/1080p (requires start image)", provider: "replicate" },
      { value: "kling-v2.1-master-t2v", label: "Kling 2.1 Master", description: "Image→Video only, 5s/10s, 1080p (requires start image)", provider: "replicate" },
      { value: "seedance-1.0-pro-t2v", label: "Seedance 1.0 Pro", description: "Text→Video & Image→Video, 2-12s, 480p/720p/1080p, 16:9/4:3/1:1/3:4/9:16/21:9/9:21", provider: "replicate" },
      { value: "seedance-1.0-lite-t2v", label: "Seedance 1.0 Lite", description: "Text→Video & Image→Video (faster), 2-12s, 480p/720p/1080p, 16:9/4:3/1:1/3:4/9:16/21:9/9:21", provider: "replicate" },
      { value: "pixverse-v5-t2v", label: "PixVerse v5", description: "Text→Video & Image→Video, 5s/8s, 360p/540p/720p/1080p, 16:9/9:16/1:1", provider: "replicate" },
      { value: "ltx2-pro-t2v", label: "LTX V2 Pro", description: "Text→Video & Image→Video, 6s/8s/10s, 1080p/1440p/2160p, 16:9 only", provider: "fal" },
      { value: "ltx2-fast-t2v", label: "LTX V2 Fast", description: "Text→Video & Image→Video (fast), 6s/8s/10s, 1080p/1440p/2160p, 16:9 only", provider: "fal" },
      { value: "wan-2.5-t2v", label: "WAN 2.5", description: "Text→Video & Image→Video, 5s/10s, 480p/720p/1080p", provider: "replicate" },
      { value: "wan-2.5-t2v-fast", label: "WAN 2.5 Fast", description: "Text→Video & Image→Video (faster), 5s/10s, 720p/1080p only", provider: "replicate" },
      { value: "gen4_turbo", label: "Gen-4 Turbo", description: "High-quality, fast generation", provider: "runway" },
      { value: "gen3a_turbo", label: "Gen-3a Turbo", description: "Advanced features, last position support", provider: "runway" },
      { value: "MiniMax-Hailuo-02", label: "MiniMax-Hailuo-02", description: "Text→Video / Image→Video, 6s/10s, 768P/1080P", provider: "minimax" },
      { value: "T2V-01-Director", label: "T2V-01-Director", description: "Text→Video only, 6s, 720P, Camera movements", provider: "minimax" },
      { value: "I2V-01-Director", label: "I2V-01-Director", description: "Image→Video only, 6s, 720P, First frame required", provider: "minimax" },
      { value: "S2V-01", label: "S2V-01", description: "Subject→Video (character reference), 6s, 720P", provider: "minimax" }
    ];
  };

  const availableModels = getAvailableModels();
  const selectedModelInfo = availableModels.find(model => model.value === selectedModel) || availableModels.find(m => selectedModel.startsWith('kling-') && m.value.startsWith('kling-')) || availableModels[0];

  // Add credits information to models
  // Normalize duration/resolution for credit lookup (accept number or string, enforce 'Xs' and lowercase res)
  // IMPORTANT: Normalize here with defaults so credits always resolve, even before user selects duration/resolution
  const normalizeDuration = (d: any, defaultDuration: string): string => {
    if (d == null) return defaultDuration;
    if (typeof d === 'number') return `${d}s`;
    const s = String(d);
    return /s$/.test(s) ? s : `${s}s`;
  };
  
  const normalizeResolution = (r: any, defaultRes: string): string => {
    if (!r) return defaultRes;
    return String(r).toLowerCase();
  };

  const modelsWithCredits = availableModels.map(model => {
    // Per-model normalization/fallbacks so credits always resolve from the first render
    let d: string;
    let r: string | undefined;
    
    if (model.value.includes('wan-2.5')) {
      // WAN models: default to 5s and 720p if not provided
      d = normalizeDuration(selectedDuration, '5s');
      const rRaw = normalizeResolution(selectedResolution, '720p');
      const rLower = rRaw.toLowerCase();
      if (rLower.includes('480')) r = '480p';
      else if (rLower.includes('720')) r = '720p';
      else if (rLower.includes('1080')) r = '1080p';
      else r = '720p';
    } else if (model.value.startsWith('kling-')) {
      // Kling v2.5 only needs duration, v2.1 needs resolution
      d = normalizeDuration(selectedDuration, '5s');
      if (model.value.includes('v2.1')) {
        const rRaw = normalizeResolution(selectedResolution, '720p');
        const rLower = rRaw.toLowerCase();
        if (rLower.includes('1080')) r = '1080p';
        else r = '720p';
      } else {
        // For v2.5, don't pass resolution as it's not needed for pricing
        r = undefined;
      }
    } else if (model.value === 'MiniMax-Hailuo-02') {
      // MiniMax requires explicit resolution and duration to price
      d = normalizeDuration(selectedDuration, '6s');
      const rRaw = selectedResolution || '1080P';
      const rUpper = String(rRaw).toUpperCase();
      if (rUpper.includes('512')) r = '512P';
      else if (rUpper.includes('768')) r = '768P';
      else if (rUpper.includes('1080')) r = '1080P';
      else r = '1080P';
    } else if (model.value.includes('pixverse')) {
      d = normalizeDuration(selectedDuration, '5s');
      const rRaw = normalizeResolution(selectedResolution, '720p');
      const rLower = rRaw.toLowerCase();
      if (rLower.includes('360')) r = '360p';
      else if (rLower.includes('540')) r = '540p';
      else if (rLower.includes('720')) r = '720p';
      else if (rLower.includes('1080')) r = '1080p';
      else r = '720p';
    } else if (model.value.includes('veo3') || model.value.includes('veo3.1')) {
      d = normalizeDuration(selectedDuration, '8s');
      const rRaw = normalizeResolution(selectedResolution, '1080p');
      const rLower = rRaw.toLowerCase();
      if (rLower.includes('1080')) r = '1080p';
      else r = '720p';
    } else if (model.value.includes('sora2')) {
      d = normalizeDuration(selectedDuration, '8s');
      // Sora 2 Pro needs resolution, standard Sora 2 doesn't
      if (model.value.includes('pro')) {
        const rRaw = normalizeResolution(selectedResolution, '720p');
        const rLower = rRaw.toLowerCase();
        if (rLower.includes('1080')) r = '1080p';
        else r = '720p';
      } else {
        r = undefined; // Standard Sora 2 doesn't need resolution
      }
    } else if (model.value.includes('seedance')) {
      d = normalizeDuration(selectedDuration, '5s');
      const rRaw = normalizeResolution(selectedResolution, '720p');
      const rLower = rRaw.toLowerCase();
      if (rLower.includes('480')) r = '480p';
      else if (rLower.includes('720')) r = '720p';
      else if (rLower.includes('1080')) r = '1080p';
      else r = '720p';
    } else if (model.value === 'gen4_turbo' || model.value === 'gen3a_turbo') {
      // Gen-4 Turbo and Gen-3a Turbo: only need duration, not resolution
      d = normalizeDuration(selectedDuration, '5s');
      r = undefined; // These models don't use resolution for pricing
    } else {
      // For other models, normalize with defaults
      d = normalizeDuration(selectedDuration, '5s');
      r = normalizeResolution(selectedResolution, '720p');
    }
    
    let creditInfo = getModelCreditInfo(model.value, d, r);
    // As a final safety net, retry with strict defaults if no credits resolved
    if (!creditInfo.hasCredits) {
      if (model.value.includes('wan-2.5')) {
        creditInfo = getModelCreditInfo(model.value, '5s', '720p');
      } else if (model.value.startsWith('kling-')) {
        // v2.5 only needs duration
        creditInfo = getModelCreditInfo(model.value, '5s');
      } else if (model.value === 'MiniMax-Hailuo-02') {
        creditInfo = getModelCreditInfo(model.value, '6s', '1080P');
      } else if (model.value === 'gen4_turbo' || model.value === 'gen3a_turbo') {
        // Gen-4 Turbo and Gen-3a Turbo: default to 5s, no resolution needed
        creditInfo = getModelCreditInfo(model.value, '5s');
      }
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
  }, [generationMode, availableModels, selectedModel, onModelChange, activeFeature]);

  return (
    <div ref={dropdownRef} className="relative dropdown-container">
      <button
      onClick={() => {
        try {
          if (onCloseOtherDropdowns) onCloseOtherDropdowns();
        } catch {}
        setIsOpen(!isOpen);
      }}
        className={`md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-white text-black`}
      >
        <Cpu className="md:w-4 w-3 h-3 md:h-4  mr-1" />
        {selectedModelInfo?.label || selectedModel}
        <ChevronUp className={`md:w-4 w-3 h-3 md:h-4  transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 md:w-[28rem] w-40 bg-black/90 backdrop-blur-3xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-80 md:max-h-150 max-h-100 overflow-y-auto dropdown-scrollbar">
          {(() => {
            // Show all models regardless of mode - models that support both T2V and I2V should be visible in both modes
            // This ensures consistent model visibility (always 20 models)
            const filteredModels = modelsWithCredits.filter(model => {
              // Exclude video-to-video models from text/image modes
              if (model.value.includes('v2v') || model.value.includes('remix')) {
                return false;
              }
              // Show all other models - they will handle mode conversion automatically
              return true;
            });

            // For text-to-video: two columns like image-to-video
            if (generationMode === 'text_to_video') {
              const left = filteredModels.slice(0, Math.ceil(filteredModels.length / 2));
              const right = filteredModels.slice(Math.ceil(filteredModels.length / 2));
              return (
                <div className="md:grid md:grid-cols-2 grid-cols-1 gap-0">
                  <div className="divide-y divide-white/10">
                    {left.map((model) => (
                      <button
                        key={`t2v-left-${model.value}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          try { onModelChange(model.value); } catch {}
                          setIsOpen(false);
                        }}
                        className={`w-full md:px-4 md:p-2 p-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${selectedModel === model.value
                          ? 'bg-white text-black'
                          : 'text-white/90 hover:bg-white/10'
                          }`}
                      >
                        <div className="flex flex-col mb-0">
                          <span className="flex items-center gap-2">
                            {model.label}
                            <img src="/icons/crown.svg" alt="pro" className="md:w-4 w-3 h-3 md:h-4" />
                          </span>
                          <span className="md:text-[11px] text-[9px] opacity-80 -mt-0.5 font-normal">{model.displayText || (model.credits != null ? `${model.credits} credits` : 'credits unavailable')}</span>
                        </div>
                        {selectedModel === model.value && (
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="md:border-l border-white/10 divide-y divide-white/10">
                    {right.map((model) => (
                      <button
                        key={`t2v-right-${model.value}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          try { onModelChange(model.value); } catch {}
                          setIsOpen(false);
                        }}
                        className={`w-full md:px-4 md:p-2 p-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${selectedModel === model.value
                          ? 'bg-white text-black'
                          : 'text-white/90 hover:bg-white/10'
                          }`}
                      >
                        <div className="flex flex-col -mb-0">
                          <span className="flex items-center gap-2">
                            {model.label}
                            <img src="/icons/crown.svg" alt="pro" className="md:w-4 w-3 h-3 md:h-4" />
                          </span>
                          <span className="md:text-[11px] text-xs opacity-80 -mt-0.5 font-normal">{model.displayText || (model.credits != null ? `${model.credits} credits` : 'credits unavailable')}</span>
                        </div>
                        {selectedModel === model.value && (
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            // For image-to-video: two columns
            const leftModels = filteredModels.slice(0, Math.ceil(filteredModels.length / 2));
            const rightModels = filteredModels.slice(Math.ceil(filteredModels.length / 2));
            
            return (
              <div className="md:grid md:grid-cols-2 grid-cols-1 gap-0">
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
                      className={`w-full md:px-4 md:p-2 p-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${selectedModel === model.value
                        ? 'bg-white text-black'
                        : 'text-white/90 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col mb-0">
                        <span className="flex items-center gap-2">
                          {model.label}
                          <img src="/icons/crown.svg" alt="pro" className="md:w-4 w-3 h-3 md:h-4" />
                        </span>
                        {/* <span className="text-[11px] opacity-80 -mt-0.5 font-normal">{model.description}</span> */}
                        <span className="md:text-[11px] text-xs opacity-80 -mt-0.5 font-normal">{model.displayText || (model.credits != null ? `${model.credits} credits` : 'credits unavailable')}</span>
                      </div>
                      {selectedModel === model.value && (
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
                {/* Right column */}
                <div className="md:border-l border-white/10 divide-y divide-white/10">
                  {rightModels.map((model) => (
                    <button
                      key={`right-${model.value}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        try { onModelChange(model.value); } catch {}
                        setIsOpen(false);
                      }}
                      className={`w-full md:px-4 md:p-2 p-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${selectedModel === model.value
                        ? 'bg-white text-black'
                        : 'text-white/90 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col -mb-0">
                        <span className="flex items-center gap-2">
                          {model.label}
                          <img src="/icons/crown.svg" alt="pro" className="md:w-4 w-3 h-3 md:h-4" />
                        </span>
                        {/* <span className="text-[11px] opacity-80 -mt-0.5 font-normal">{model.description}</span> */}
                        <span className="md:text-[11px] text-xs opacity-80 -mt-0.5 font-normal">{model.displayText || (model.credits != null ? `${model.credits} credits` : 'credits unavailable')}</span>
                      </div>
                      {selectedModel === model.value && (
                        <div className="w-2 h-2 bg-black rounded-full"></div>
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
