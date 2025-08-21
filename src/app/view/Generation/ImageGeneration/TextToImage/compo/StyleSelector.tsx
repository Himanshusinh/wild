'use client';

import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import StylePopup from '@/app/view/Generation/ImageGeneration/TextToImage/compo/StylePopup';

const StyleSelector = () => {
  const style = useAppSelector((state: any) => state.generation?.style || 'realistic');
  const [isStylePopupOpen, setIsStylePopupOpen] = useState(false);

  // Helper function to get style icon
  const getStyleIcon = (styleValue: string) => {
    const icons: { [key: string]: string } = {
      realistic: '📷',
      artistic: '🎨',
      cartoon: '🎭',
      anime: '🌸',
      abstract: '🔮',
      vintage: '📻',
      minimalist: '⚪',
      cyberpunk: '🤖'
    };
    return icons[styleValue] || '🎨';
  };

  return (
    <>
      <div className="relative dropdown-container">
        <button
          onClick={() => setIsStylePopupOpen(true)}
          className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-2 ${
            style !== 'realistic' 
              ? 'bg-white text-black' 
              : 'bg-transparent text-white/90 hover:bg-white/5'
          }`}
        >
          <span className="text-sm">{getStyleIcon(style)}</span>
          <span className="capitalize">{style}</span>
          <div className={`w-3 h-3 flex items-center justify-center ${
            style !== 'realistic' ? 'text-black' : 'text-white/60'
          }`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="opacity-60">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Style Popup */}
      <StylePopup 
        isOpen={isStylePopupOpen} 
        onClose={() => setIsStylePopupOpen(false)} 
      />
    </>
  );
};

export default StyleSelector;
