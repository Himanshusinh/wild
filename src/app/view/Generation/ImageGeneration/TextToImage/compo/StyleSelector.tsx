'use client';

import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import StylePopup from '@/app/view/Generation/ImageGeneration/TextToImage/compo/StylePopup';
import { ChevronDown, ChevronUp } from 'lucide-react';

const StyleSelector = () => {
  const style = useAppSelector((state: any) => state.generation?.style || 'none');
  const [isStylePopupOpen, setIsStylePopupOpen] = useState(false);

  // Icons removed: display only text

  return (
    <>
      <div className="relative dropdown-container">
        <button
          onClick={() => setIsStylePopupOpen(true)}
          className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex justify-center items-center gap-2 ${style !== 'none'
              ? 'bg-white text-black'
              : 'bg-transparent text-white/90 hover:bg-white/5'
            }`}
        >
          <span className="capitalize">{style}</span>
          <div className={`w-4 h-4 flex  items-center justify-center ${style !== 'none' ? 'text-black' : 'text-white/90'
            }`}>
            <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isStylePopupOpen ? 'rotate-180' : ''}`} />
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
