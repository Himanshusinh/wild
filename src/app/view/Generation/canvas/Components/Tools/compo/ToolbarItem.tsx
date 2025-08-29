'use client';

import React from 'react';

interface ToolbarItemProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  onClick: () => void;
  isExpanded?: boolean;
  isSelected?: boolean;
}

const ToolbarItem: React.FC<ToolbarItemProps> = ({ id, name, icon, onClick, isExpanded = false, isSelected = false }) => {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-12 h-12 rounded-xl transition-all duration-300 flex items-center justify-center ${
          isSelected 
            ? 'bg-blue-600/80 ring-2 ring-blue-400/50 shadow-lg' 
            : 'bg-white/10 hover:bg-white/20 hover:scale-105'
        } text-white`}
        title={name}
      >
        <div className="w-6 h-6 flex-shrink-0">
          {icon}
        </div>
      </button>
      
      {/* Tool name appears on hover */}
      {isExpanded && (
        <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 z-[60] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-3 py-2 rounded-lg border border-white/20 shadow-lg whitespace-nowrap">
            {name}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black/80 rotate-45 border-l border-b border-white/20"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolbarItem;
