'use client';

import { useState, useRef, useEffect } from 'react';

export default function ImageComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  imagePosition = "object-center",
  imageFit = "object-cover",
  autoSlide = false,
  autoSlideSpeed = 0.5,
  hoverToSlide = false
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  // If hoverToSlide is true, we start with NO auto-sliding.
  // Otherwise, fallback to the passed `autoSlide` prop.
  const [isAutoSliding, setIsAutoSliding] = useState(hoverToSlide ? false : autoSlide);
  const containerRef = useRef(null);
  const directionRef = useRef(1); // 1 for right, -1 for left

  const handleMove = (clientX) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    const newPosition = Math.min(Math.max(percentage, 0), 100);
    setSliderPosition(newPosition);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
    setIsAutoSliding(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    if (!isAutoSliding || isDragging) return;

    const intervalId = setInterval(() => {
      setSliderPosition((prev) => {
        let next = prev + (autoSlideSpeed * directionRef.current);

        if (next >= 100) {
          directionRef.current = -1;
          next = 100;
        } else if (next <= 0) {
          directionRef.current = 1;
          next = 0;
        }

        return next;
      });
    }, 16); // ~60fps

    return () => clearInterval(intervalId);
  }, [isAutoSliding, isDragging, autoSlideSpeed]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, sliderPosition]);

  // Ensure manual interaction overrides auto-slide
  useEffect(() => {
    if (isDragging) {
      setIsAutoSliding(false);
    }
  }, [isDragging]);

  const handleMouseEnter = () => {
    if (hoverToSlide && !isDragging) {
      setIsAutoSliding(true);
    }
  };

  const handleMouseLeave = () => {
    if (hoverToSlide) {
      setIsAutoSliding(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none group"
      style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Before Image (Bottom Layer - Right Side) */}
      <div className="absolute inset-0 w-full h-full">
        {typeof afterImage === 'string' ? (
          <img
            src={afterImage}
            alt={afterLabel}
            className={`w-full h-full ${imageFit} ${imagePosition}`}
            draggable={false}
          />
        ) : (
          afterImage
        )}
        {/* After Label */}
        {afterLabel && (
          <div className="absolute top-3 right-3 bg-[#60a5fa]/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#60a5fa] border border-[#60a5fa]/30 z-10">
            {afterLabel}
          </div>
        )}
      </div>

      {/* After Image (Top Layer - Left Side) with Clip */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        {typeof beforeImage === 'string' ? (
          <img
            src={beforeImage}
            alt={beforeLabel}
            className={`w-full h-full ${imageFit} ${imagePosition}`}
            draggable={false}
          />
        ) : (
          beforeImage
        )}
        {/* Before Label */}
        {beforeLabel && (
          <div
            className="absolute top-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-white/5 z-10"
            style={{ opacity: sliderPosition > 15 ? 1 : 0, transition: 'opacity 0.2s' }}
          >
            {beforeLabel}
          </div>
        )}
      </div>

      {/* Slider Line and Handle */}
      <div
        className={`absolute top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize z-20 ${hoverToSlide ? 'opacity-0 group-hover:opacity-100 transition-opacity duration-300' : ''}`}
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Slider Handle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center cursor-ew-resize group-hover:scale-110 transition-transform"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* Left Arrow */}
          <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          {/* Right Arrow */}
          <svg className="w-4 h-4 text-black -ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
