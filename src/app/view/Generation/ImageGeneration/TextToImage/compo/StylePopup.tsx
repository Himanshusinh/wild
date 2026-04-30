'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setStyle } from '@/store/slices/generationSlice';
import { STYLE_CATALOG } from '@/styles/stylesCatalog';
import { ALL_INDIAN_STYLES } from '@/styles/indianStyles';
import { X } from 'lucide-react';

// Wrapper component for style preview images with error handling
const StylePreviewImage = ({ src, alt }: { src: string; alt: string }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <Image 
      src={imgSrc} 
      alt={alt} 
      fill 
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw" 
      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      unoptimized
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImgSrc('/styles/Logo.gif');
        }
      }}
    />
  );
};

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
  const [activeCategory, setActiveCategory] = useState<'general' | 'indian'>('general');
  const indianStyleValues = useRef(new Set(ALL_INDIAN_STYLES.map((s) => s.id)));

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
      
      // Set new timeout for 1 minute (Bug 46 fix)
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, 60000);
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
        '3d_cartoon', 'bokeh', 'cinematic', 'cinematic_concept', 'creative', 'dynamic', 
        'fashion', 'graphic_design_pop_art', 'graphic_design_vector', 'hdr', 'illustration', 
        'macro', 'minimalist', 'moody', 'none', 'portrait', 'pro_bw_photography', 
        'pro_color_photography', 'pro_film_photography', 'portrait_fashion', 'ray_tracing', 
        'sketch_bw', 'sketch_color', 'stock_photo', 'vibrant'
      ]);
      return STYLE_CATALOG.filter(style => allowedStyles.has(style.value));
    }
    // For other models, show only original styles (exclude new model-specific styles)
    const originalStyles = new Set([
      'none', 'neutral_studio', 'realistic', 'minimalist', 'watercolor', 'oil_painting', 
      'abstract', 'cyberpunk', 'neon_noir', 'isometric', 'vintage_poster', 'vaporwave', 
      'pixel_art', 'cartoon', 'pencil_sketch', 'claymation', 'fantasy', 'sci_fi', 
      'steampunk', 'abstract_geometry', 'surrealism', '3d_cartoon', 'ukiyoe', 'graffiti', 
      'renaissance', 'pop_art'
    ]);
    return STYLE_CATALOG.filter(style => originalStyles.has(style.value));
  })();

  useEffect(() => {
    const currentStyleValue = currentStyle;
    if (indianStyleValues.current.has(currentStyleValue)) return;
    const isCurrentStyleSupported = styles.some(style => style.value === currentStyleValue);
    
    if (!isCurrentStyleSupported && styles.length > 0) {
      // Switch to the first supported style (usually 'none')
      dispatch(setStyle(styles[0].value));
    }
  }, [selectedModel, styles, currentStyle, dispatch]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveCategory(
      indianStyleValues.current.has(currentStyle) ? 'indian' : 'general',
    );
  }, [isOpen, currentStyle]);

  const allStyles = activeCategory === 'general'
    ? styles
    : ALL_INDIAN_STYLES
        .map((s) => ({
          name: s.title,
          value: s.id,
          image: s.image,
          description: s.desc,
          state: s.name,
          isIndian: true,
        }))
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        );

  const handleStyleSelect = (styleValue: string) => {
    dispatch(setStyle(styleValue));
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const popupContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xl p-3 sm:p-6"
        onClick={onClose}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div
          className="relative w-full max-w-8xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E12] shadow-[0_32px_120px_rgba(0,0,0,0.8)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 sm:px-7">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}>
                Choose Style
              </h2>
              <p className="text-xs text-white/30 font-medium uppercase tracking-widest mt-1">Select a style to begin generating</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/40 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
            <button
              onClick={() => setActiveCategory('general')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === 'general'
                  ? 'bg-white text-black'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              General Styles
            </button>
            <button
              onClick={() => setActiveCategory('indian')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === 'indian'
                  ? 'bg-white text-black'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              Indian Styles
            </button>
          </div>

          {/* Styles Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1.5 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {allStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => handleStyleSelect(style.value)}
                  className="group flex flex-col text-left transition-all hover:-translate-y-1"
                >
                  <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border ${currentStyle === style.value ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-white/10'} bg-[#18181f] transition-all group-hover:border-white/20`}>
                    <StylePreviewImage src={style.image} alt={style.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                    
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div className="flex flex-col">
                        <div className="text-[18px] font-bold uppercase tracking-wider text-white sm:text-[22px]" style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}>
                          {style.name}
                        </div>
                        {activeCategory === 'indian' && (
                          <>
                            <div className="mt-0.5 text-[10px] font-semibold tracking-wide text-white/85">
                              {(style as any).state}
                            </div>
                            <div className="mt-0.5 text-[9px] leading-snug text-white/50 line-clamp-1">
                              {(style as any).description}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Selected Indicator */}
                      {currentStyle === style.value && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mb-1 ml-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
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
