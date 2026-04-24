import React, { ReactNode } from 'react';

interface EditImageSidebarProps {
  imagePreview?: ReactNode;
  parameters?: ReactNode;
  footer?: ReactNode;
  mobileDropdownOpen?: boolean;
  children?: ReactNode; // Legacy support
}

export const EditImageSidebar: React.FC<EditImageSidebarProps> = ({ 
  imagePreview, 
  parameters, 
  footer,
  mobileDropdownOpen = false,
  children 
}) => {
  return (
    <div className="order-2 md:order-1 w-full flex-1 min-h-0 flex flex-col gap-3 overflow-hidden z-20 md:absolute md:left-[14px] md:top-[14px] md:bottom-[14px] md:w-[242px] md:bg-[rgba(14,14,18,0.82)] md:backdrop-blur-[18px] md:border md:border-[rgba(255,255,255,0.12)] md:rounded-2xl md:overflow-hidden md:relative md:left-0 md:top-0 md:bottom-0 md:h-auto md:w-[320px] md:mx-4 md:my-4 md:shrink-0 md:gap-0">
      {imagePreview}
      
      <div className={`relative flex-1 min-h-0 rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(20,20,26,0.96)] md:flex-1 md:max-h-none md:overflow-visible md:overflow-y-auto md:rounded-none md:border-0 md:bg-transparent ${mobileDropdownOpen ? "overflow-visible" : "overflow-y-auto overscroll-y-contain thin-scrollbar"}`}>
        {parameters || children}
      </div>

      {footer && (
        <div className="pt-3 bg-transparent md:p-4 md:border-t md:border-white/[0.08] md:bg-[#0E0E12]/50 md:backdrop-blur-md">
          {footer}
        </div>
      )}

      <style jsx global>{`
        .thin-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background: #222228;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};
