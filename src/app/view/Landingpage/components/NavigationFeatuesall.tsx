// Final adjustments for category visibility
'use client';
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface NavigationCompoProps {
  categories?: string[];
  onCategoryChange?: (category: string) => void;
}

const NavigationCompo: React.FC<NavigationCompoProps> = ({
  categories = [
    "All",
    "Image Generation",
    "Video Generation",
    "Branding Kit",
    "Audio Generation",
    "Filming Tools",
    "3D Generation",
  ],
  onCategoryChange,
}) => {
  const [activeCategory, setActiveCategory] = useState("All");

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (onCategoryChange) onCategoryChange(category);
  };

  return (
    <div className="relative -mb-4 py-1 px-2 w-full lg:px-24 xl:px-32">{/* pulled up slightly to reduce gap between categories and cards */}
      <div className="w-full"> 
        <div
          className={cn(
            "bg-black/60 backdrop-blur-xl rounded-[50px] p-3 lg:px-1 lg:py-3 xl:px-0 xl:py-3 w-full max-w-full overflow-hidden border border-gray-800 text-white/25 border-fixed lg:flex lg:justify-center lg:items-center mx-auto lg:max-w-[1200px] xl:max-w-[1400px]",
            "relative z-30"
          )}
        >
          {/* inner scrollable row: border wrapper is full width so rounded edge stays visible */}
          <div className="flex items-center overflow-x-auto scrollbar-hide pr-2 scroll-row">
            {/* leading spacer so the first button doesn't slide under the left rounded border */}
            <div className="w-3 flex-shrink-0 sm:w-6 lg:w-4 xl:w-0" aria-hidden />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`rounded-full font-medium transition-all duration-200 whitespace-nowrap px-4 sm:px-6 py-2 text-sm leading-none ${
                  activeCategory === category
                    ? "bg-[#1C303D] text-white shadow-md transform scale-105"
                    : "text-white"
                }`}
              >
                {category}
              </button>
            ))}
            {/* small spacer so the last button doesn't touch the rounded border */}
            <div className="w-3 flex-shrink-0 sm:w-6 lg:w-4 xl:w-0" aria-hidden />
          </div>
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Prevent the bordered wrapper from responding to horizontal pan gestures
           so the inner row handles horizontal scrolling only. */
        .border-fixed {
          touch-action: pan-y;
        }
        /* Allow smooth momentum scrolling on iOS and horizontal panning inside the row */
        .scroll-row {
          -webkit-overflow-scrolling: touch;
          touch-action: pan-x;
        }
      `}</style>
    </div>
  );
};

export default NavigationCompo;