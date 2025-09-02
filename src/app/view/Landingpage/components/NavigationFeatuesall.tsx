'use client';

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export function NavigationFeatuesall({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
  } & React.HTMLAttributes<HTMLElement>
>) {
  return (
    React.createElement(
      Tag as any,
      {
        className: cn(
          "relative flex rounded-[50px] border border-white/20 text-white text-sm backdrop-blur-xl bg-black/10 transition duration-300 items-center justify-center overflow-visible p-0.5 decoration-clone w-fit mb:text-xs mb:rounded-[36px]",
          containerClassName,
        ),
        ...(props as any),
      },
      React.createElement(
        "div",
        {
          className: cn(
            "w-auto text-white z-10 bg-transparent px-2 py-1 rounded-[inherit] mb:px-1.5 mb:py-0.5",
            className,
          ),
        },
        children,
      ),
    )
  );
}

interface NavigationCompoProps {
  categories?: string[];
  onCategoryChange?: (category: string) => void;
}

const NavigationCompo: React.FC<NavigationCompoProps> = ({
  categories = [
    'All',
    'Image Generation',
    'Video Generation',
    'Branding Kit',
    'Audio Generation',
    'Filming Tools',
    '3D Generation',
  ],
  onCategoryChange
}) => {
  const [activeCategory, setActiveCategory] = useState('All');

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    onCategoryChange?.(category);
  };

  return (
    <div className="relative -mb-10 mb:-mb-6 mb:px-2">
      <NavigationFeatuesall
        as="div"
        containerClassName="bg-black rounded-full p-1 mb:p-0.5"
        className="bg-black rounded-full p-1 mb:p-0.5"
      >
        <div className="flex flex-wrap space-x-2 min-w-max px-2 py-0.5 overflow-x-auto scrollbar-hide relative z-10 mb:space-x-1.5 mb:space-y-1.5 mb:px-1.5 mb:justify-start">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`rounded-full font-medium transition-all duration-200 whitespace-nowrap px-6 py-1.5 text-sm mb:px-3.5 mb:py-1 mb:text-xs mobile:px-4 ${
                activeCategory === category
                  ? 'bg-[#1C303D] text-white shadow-md transform scale-105 mb:py-1'
                  : 'text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </NavigationFeatuesall>
      
      {/* Add scrollbar hide styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar { 
          display: none;
        }
      `}</style>
    </div>
  );
};

export default NavigationCompo;