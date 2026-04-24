import React, { ReactNode } from 'react';

interface EditImageCanvasAreaProps {
  topBar?: ReactNode;
  canvas?: ReactNode;
  statusBar?: ReactNode;
  className?: string;
  topBarClassName?: string;
  children?: ReactNode; // Legacy support
}

export const EditImageCanvasArea: React.FC<EditImageCanvasAreaProps> = ({ 
  topBar, 
  canvas, 
  statusBar, 
  className,
  topBarClassName,
  children 
}) => {
  return (
    <div className={`flex-1 flex flex-col relative bg-[#0E0E12] overflow-hidden ${className || ""}`}>
      {topBar && (
        <div className={`w-full h-[48px] flex items-center bg-[#0E0E12] border-b border-white/[0.06] z-30 shrink-0 ${topBarClassName || ""}`}>
          {topBar}
        </div>
      )}
      
      <div className="flex-1 relative overflow-hidden">
        {canvas || children}
      </div>

      {statusBar && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4">
          {statusBar}
        </div>
      )}
    </div>
  );
};

export const CanvasTopBar: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="w-full h-[44px] flex items-center bg-[#0E0E12] border-b border-white/[0.06] z-30 shrink-0">
      {children}
    </div>
  );
};

