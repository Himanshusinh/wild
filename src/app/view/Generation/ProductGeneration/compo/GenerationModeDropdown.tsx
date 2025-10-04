'use client';

import React, { useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleDropdown } from '@/store/slices/uiSlice';
import { ChevronUp } from 'lucide-react';

interface GenerationModeDropdownProps {
  selectedMode: string;
  onModeSelect: (mode: string) => void;
  isVisible: boolean;
  selectedModel: string;
}

const GenerationModeDropdown: React.FC<GenerationModeDropdownProps> = ({ 
  selectedMode, 
  onModeSelect, 
  isVisible,
  selectedModel
}) => {
  const dispatch = useAppDispatch();
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Define modes based on selected model
  const getModes = () => {
    if (selectedModel === 'flux-kontext-dev') {
      return [
        { 
          name: 'Product with Model Pose', 
          value: 'product-with-model', 
          description: 'Generate product images with model poses' 
        }
      ];
    } else {
      // flux-kontext-pro and flux-kontext-max have both options
      return [
        { 
          name: 'Product Generation', 
          value: 'product-only', 
          description: 'Generate product images from description only' 
        },
        { 
          name: 'Product with Model Pose', 
          value: 'product-with-model', 
          description: 'Generate product images with model poses' 
        }
      ];
    }
  };

  const modes = getModes();

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('product-generation-mode'));
  };

  const handleModeSelect = (modeValue: string) => {
    onModeSelect(modeValue);
    dispatch(toggleDropdown(''));
  };

  // Auto-close dropdown after 5 seconds
  useEffect(() => {
    if (activeDropdown === 'product-generation-mode') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        dispatch(toggleDropdown(''));
      }, 5000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeDropdown, dispatch]);

  // Hide generation mode dropdown for flux-krea since it only supports product generation
  if (!isVisible) return null;
  
  // For flux-krea and flux-kontext-dev, don't show generation mode since they have fixed modes
  if (selectedModel === 'flux-krea' || selectedModel === 'flux-kontext-dev') return null;

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          selectedMode !== 'product-only'
            ? 'bg-white text-black'
            : 'bg-transparent text-white/90 hover:bg-white/5'
        }`}
      >
        {(() => {
          const currentMode = modes.find(m => m.value === selectedMode);
          return currentMode?.name || 'Generation Mode';
        })()}
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'product-generation-mode' ? 'rotate-180' : ''}`} />
      </button>
      {activeDropdown === 'product-generation-mode' && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={(e) => {
                e.stopPropagation();
                handleModeSelect(mode.value);
              }}
              className={`w-full px-4 py-3 text-left transition text-[13px] flex items-center justify-between ${
                selectedMode === mode.value
                  ? 'bg-white text-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{mode.name}</span>
                <span className={`text-xs mt-0.5 ${
                  selectedMode === mode.value ? 'text-black/70' : 'text-white/60'
                }`}>{mode.description}</span>
              </div>
              {selectedMode === mode.value && (
                <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GenerationModeDropdown;
