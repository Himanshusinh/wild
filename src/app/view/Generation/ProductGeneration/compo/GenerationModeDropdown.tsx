'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleDropdown } from '@/store/slices/uiSlice';

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

  // Hide generation mode dropdown for flux-krea since it only supports product generation
  if (!isVisible) return null;
  
  // For flux-krea and flux-kontext-dev, don't show generation mode since they have fixed modes
  if (selectedModel === 'flux-krea' || selectedModel === 'flux-kontext-dev') return null;

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-1"
      >
        Generation Mode
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
              className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition text-[13px] flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium">{mode.name}</span>
                <span className="text-xs text-white/60 mt-0.5">{mode.description}</span>
              </div>
              {selectedMode === mode.value && (
                <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GenerationModeDropdown;
