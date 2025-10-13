'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setStyle } from '@/store/slices/generationSlice';
import { STYLE_CATALOG } from '@/styles/stylesCatalog';

interface StylePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const StylePopup = ({ isOpen, onClose }: StylePopupProps) => {
  const dispatch = useAppDispatch();
  const currentStyle = useAppSelector((state: any) => state.generation?.style || 'none');
  // Do not force any default model here; empty string means no model chosen yet
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || '');
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-close popup after 5 seconds
  useEffect(() => {
    if (isOpen) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for 5 seconds
      timeoutRef.current = setTimeout(() => {
        onClose();
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
  }, [isOpen, onClose]);

  // Model-specific style filtering
  const isLucidOrigin = selectedModel === 'leonardoai/lucid-origin';
  const isPhoenix = selectedModel === 'leonardoai/phoenix-1.0';

  // Filter styles based on selected model
  const styles = (() => {
    if (isLucidOrigin) {
      // Lucid Origin: Only show model-specific styles
      const allowedStyles = new Set([
        'bokeh', 'cinematic', 'cinematic_close_up', 'creative', 'dynamic', 'fashion', 
        'film', 'food', 'hdr', 'long_exposure', 'macro', 'minimalist', 'monochrome', 
        'moody', 'neutral', 'none', 'portrait', 'retro', 'stock_photo', 'unprocessed', 'vibrant'
      ]);
      return STYLE_CATALOG.filter(style => allowedStyles.has(style.value));
    }
    if (isPhoenix) {
      // Phoenix 1.0: Only show model-specific styles
      const allowedStyles = new Set([
        'render_3d', 'bokeh', 'cinematic', 'cinematic_concept', 'creative', 'dynamic', 
        'fashion', 'graphic_design_pop_art', 'graphic_design_vector', 'hdr', 'illustration', 
        'macro', 'minimalist', 'moody', 'none', 'portrait', 'pro_bw_photography', 
        'pro_color_photography', 'pro_film_photography', 'portrait_fashion', 'ray_traced', 
        'sketch_bw', 'sketch_color', 'stock_photo', 'vibrant'
      ]);
      return STYLE_CATALOG.filter(style => allowedStyles.has(style.value));
    }
    // For other models, show only original styles (exclude new model-specific styles)
    const originalStyles = new Set([
      'none', 'neutral_studio', 'realistic', 'minimalist', 'watercolor', 'oil_painting', 
      'abstract', 'cyberpunk', 'neon_noir', 'isometric', 'vintage_poster', 'vaporwave', 
      'pixel_art', 'cartoon', 'pencil_sketch', 'claymation', 'fantasy', 'sci_fi', 
      'steampunk', 'abstract_geometry', 'surrealism', 'render_3d', 'ukiyoe', 'graffiti', 
      'renaissance', 'pop_art'
    ]);
    return STYLE_CATALOG.filter(style => originalStyles.has(style.value));
  })();

  // Auto-switch to supported style when model changes
  useEffect(() => {
    const currentStyleValue = currentStyle;
    const isCurrentStyleSupported = styles.some(style => style.value === currentStyleValue);
    
    if (!isCurrentStyleSupported && styles.length > 0) {
      // Switch to the first supported style (usually 'none')
      dispatch(setStyle(styles[0].value));
    }
  }, [selectedModel, styles, currentStyle, dispatch]);

  const handleStyleSelect = (styleValue: string) => {
    dispatch(setStyle(styleValue));
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const popupContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999]"
        onClick={onClose}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Popup */}
      <div
        className="fixed inset-0 flex items-center justify-center z-[10000] p-4 pointer-events-none"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div
          className="relative w-full max-w-2xl max-h-[70vh] rounded-2xl backdrop-blur-xl overflow-hidden shadow-2xl pointer-events-auto transform"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
            border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            transform: 'translate3d(0, 0, 0)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2
              className="text-lg font-semibold"
              style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
            >
              Choose Style
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          {/* Styles Grid */}
          <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)] custom-scrollbar">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {styles.map((style) => (
                <div
                  key={style.value}
                  onClick={() => handleStyleSelect(style.value)}
                  className={`
                    relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-200
                    ${currentStyle === style.value 
                      ? 'ring-2 ring-blue-500 scale-105' 
                      : 'hover:scale-105 hover:shadow-lg'
                    }
                  `}
                >
                  {/* Style Preview Image */}
                  <div className="aspect-square relative bg-gray-200 rounded-lg overflow-hidden">
                    <Image src={style.image} alt={style.name} fill sizes="(max-width: 768px) 33vw, 25vw" style={{ objectFit: 'cover' }} />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 text-white/95 text-xs px-2 py-1 rounded bg-black/40 backdrop-blur-sm">
                      {style.name}
                    </div>
                    
                    {/* Selected Indicator */}
                    {currentStyle === style.value && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Style Info */}
                  <div className="p-2">
                    <h3
                      className="font-medium text-xs mb-1"
                      style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
                    >
                      {style.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {createPortal(popupContent, document.body)}
    </>
  );
};

// Helper function to get style-specific gradients
const getStyleGradient = (style: string) => {
  const gradients: { [key: string]: string } = {
    realistic: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    artistic: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    cartoon: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    anime: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    abstract: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    vintage: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    minimalist: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    cyberpunk: 'linear-gradient(135deg, #0c0c0c 0%, #ff00ff 50%, #00ffff 100%)'
  };
  return gradients[style] || gradients.realistic;
};

// Icons removed

export default StylePopup;
