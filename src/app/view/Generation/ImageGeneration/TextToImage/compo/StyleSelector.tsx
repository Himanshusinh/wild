'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import StylePopup from '@/app/view/Generation/ImageGeneration/TextToImage/compo/StylePopup';
import { ChevronDown, ChevronUp } from 'lucide-react';

const StyleSelector = () => {
  const style = useAppSelector((state: any) => state.generation?.style || 'none');
  const [isStylePopupOpen, setIsStylePopupOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Icons removed: display only text

  // Auto-close popup after 5 seconds
  useEffect(() => {
    if (isStylePopupOpen) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for 5 seconds
      timeoutRef.current = setTimeout(() => {
        setIsStylePopupOpen(false);
      }, 20000);
    } else {
      // Clear timeout if popup is closed
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
  }, [isStylePopupOpen]);

  return (
    <>
      <div className="relative dropdown-container">
        <button
          onClick={() => setIsStylePopupOpen(true)}
          className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-black/20 dark:ring-white/20 hover:ring-black/30 dark:hover:ring-white/30 transition flex justify-center items-center gap-2 ${style !== 'none'
              ? 'bg-transparent text-black/90 dark:text-white/90'
              : 'bg-transparent text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
        >
          <span className="capitalize">{style === 'none' ? 'Style' : style}</span>
          <div className={`w-4 h-4 flex items-center justify-center ${style !== 'none' ? 'text-black/90 dark:text-white/90' : 'text-black/90 dark:text-white/90'
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
