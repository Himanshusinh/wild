'use client';

import React, { useState } from 'react';

interface SelectModelProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
}

const SelectModel: React.FC<SelectModelProps> = ({ selectedModel, onModelSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const models = [
    'FLUX.1 Dev',
    'FLUX.1 Pro',
    'FLUX.1 Lite',
    'DALL-E 3',
    'Midjourney',
    'Stable Diffusion'
  ];

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectModel = (model: string) => {
    onModelSelect(model);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={toggleDropdown}
        className="px-4 py-2 rounded-full text-[15px] font-medium bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-2"
      >
        <span>{selectedModel}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown - positioned above the button */}
      {isDropdownOpen && (
        <div className="absolute bottom-full mb-2 left-0 min-w-[200px] z-[70]">
          <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl overflow-hidden">
            {models.map((model, index) => (
              <button
                key={index}
                onClick={() => selectModel(model)}
                className="w-full px-4 py-3 text-left text-[15px] font-medium text-white hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
              >
                {model}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectModel;
