'use client';

import React from 'react';

interface TopBarItemProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'icon' | 'button';
  disabled?: boolean;
}

const TopBarItem: React.FC<TopBarItemProps> = ({ id, name, icon, onClick, variant = 'icon', disabled = false }) => {
  if (variant === 'button') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
          disabled 
            ? 'bg-white/5 text-white/40 cursor-not-allowed' 
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        <div className="w-5 h-5">
          {icon}
        </div>
        <span className="text-sm font-medium">{name}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 rounded-lg transition-all duration-300 flex items-center justify-center ${
        disabled 
          ? 'bg-white/5 text-white/40 cursor-not-allowed' 
          : 'bg-white/10 hover:bg-white/20 text-white'
      }`}
    >
      <div className="w-5 h-5">
        {icon}
      </div>
    </button>
  );
};

export default TopBarItem;
