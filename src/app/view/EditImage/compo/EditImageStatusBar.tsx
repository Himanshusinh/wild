'use client';

import React from 'react';

interface EditImageStatusBarProps {
  isProcessing: boolean;
  statusText?: string;
  progress?: number;
  credits?: number;
}

export const EditImageStatusBar: React.FC<EditImageStatusBarProps> = ({
  isProcessing,
  statusText = 'Processing...',
  progress = 65, // Example default
  credits
}) => {
  if (!isProcessing) return null;

  return (
    <div className="status-bar bg-[#0E0E12]/90 backdrop-blur-xl border border-white/10 rounded-full h-11 px-5 flex items-center gap-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="relative flex-1 h-1 bg-white/5 rounded-full overflow-hidden min-w-[120px]">
        <div 
          className="absolute inset-0 bg-[#2F6BFF] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] animate-pulse" />
        <span className="text-[13px] font-medium text-white/90">
          {statusText}
        </span>
      </div>

      <div className="h-4 w-px bg-white/10 mx-1" />

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 group cursor-help" title="Undo (Coming Soon)">
          <div className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-bold text-white/40 group-hover:text-white/60 transition-colors">⌘ Z</div>
          <span className="text-[11px] font-medium text-white/30 group-hover:text-white/50 transition-colors">Undo</span>
        </div>
      </div>
      
      {credits !== undefined && (
        <div className="ml-auto pl-2">
           <span className="text-[11px] font-semibold text-[#2F6BFF] uppercase tracking-wider">{credits} Credits</span>
        </div>
      )}
    </div>
  );
};
