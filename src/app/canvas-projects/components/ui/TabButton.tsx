import React from 'react';

interface TabButtonProps {
    isActive: boolean;
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
}

export function TabButton({ isActive, onClick, label, icon }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`
        relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 
        ${isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}
      `}
        >
            {isActive && (
                <div className="absolute inset-0 bg-[#1d303d] rounded-full shadow-[0_0_20px_rgba(29,48,61,0.6)] animate-in zoom-in-95 duration-200"></div>
            )}
            <span className="relative z-10 flex items-center gap-2">{icon} {label}</span>
        </button>
    );
}
