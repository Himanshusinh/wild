'use client';

import React, { useState } from 'react';

interface ToolbarItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface ToolbarProps {
  items: ToolbarItem[];
}

const Toolbar: React.FC<ToolbarProps> = ({ items }) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleMouseEnter = (itemId: string) => {
    setExpandedItem(itemId);
  };

  const handleMouseLeave = () => {
    setExpandedItem(null);
  };

  return (
    <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-[50]">
      <div className="flex flex-col items-center gap-3 p-3 rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative group"
            onMouseEnter={() => handleMouseEnter(item.id)}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={item.onClick}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 flex items-center justify-center"
            >
              <div className="w-6 h-6">
                {item.icon}
              </div>
            </button>
            
            {/* Tooltip that appears on hover */}
            {expandedItem === item.id && (
              <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 z-[60]">
                <div className="px-3 py-2 rounded-lg bg-black/80 backdrop-blur-sm text-white text-sm font-medium whitespace-nowrap shadow-lg">
                  {item.name}
                  {/* Arrow pointing to the button */}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-black/80 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
