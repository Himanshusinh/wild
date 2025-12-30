'use client';

import { useState, useRef, useEffect } from 'react';

export default function ImageComparisonSlider({ beforeImage, afterImage, beforeLabel = "Before", afterLabel = "After", imagePosition = "object-top", imageFit = "object-cover" }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    // Constrain between 0 and 100
    const newPosition = Math.min(Math.max(percentage, 0), 100);
    setSliderPosition(newPosition);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#111] select-none group"
      style={{ touchAction: 'none' }}
    >
      {/* Before Image (Bottom Layer - Right Side) */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={afterImage}
          alt={afterLabel}
          className={`w-full h-full ${imageFit} ${imagePosition}`}
          draggable={false}
        />
        {/* After Label */}
        <div className="absolute top-3 right-3 bg-[#60a5fa]/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#60a5fa] border border-[#60a5fa]/30 z-10">
          {afterLabel}
        </div>
      </div>

      {/* After Image (Top Layer - Left Side) with Clip */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className={`w-full h-full ${imageFit} ${imagePosition}`}
          draggable={false}
        />
        {/* Before Label */}
        <div
          className="absolute top-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-white/5 z-10"
          style={{ opacity: sliderPosition > 15 ? 1 : 0, transition: 'opacity 0.2s' }}
        >
          {beforeLabel}
        </div>
      </div>

      {/* Slider Line and Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize z-20"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Slider Handle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center cursor-ew-resize group-hover:scale-110 transition-transform"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* Left Arrow */}
          <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          {/* Right Arrow */}
          <svg className="w-6 h-6 text-black -ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Instruction Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-2 rounded-full text-xs text-slate-300 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Drag to compare
      </div>
    </div>
  );
}
