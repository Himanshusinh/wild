'use client';

import React, { useState } from 'react';

interface FrameSizeProps {
  selectedFrameSize: string;
  onFrameSizeSelect: (size: string) => void;
}

const FrameSize: React.FC<FrameSizeProps> = ({ selectedFrameSize, onFrameSizeSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const frameSizes = [
    'Square',
    'Portrait',
    'Landscape',
    '16:9',
    '4:3',
    '1:1'
  ];

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectFrameSize = (size: string) => {
    onFrameSizeSelect(size);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={toggleDropdown}
        className="px-4 py-2 rounded-full text-[15px] font-medium bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span>{selectedFrameSize}</span>
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
        <div className="absolute bottom-full mb-2 left-0 min-w-[150px] z-[70]">
          <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl overflow-hidden">
            {frameSizes.map((size, index) => (
              <button
                key={index}
                onClick={() => selectFrameSize(size)}
                className="w-full px-4 py-3 text-left text-[15px] font-medium text-white hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FrameSize;
