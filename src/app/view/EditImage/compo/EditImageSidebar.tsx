import React, { ReactNode } from 'react';

interface EditImageSidebarProps {
  imagePreview?: ReactNode;
  parameters?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode; // Legacy support
}

export const EditImageSidebar: React.FC<EditImageSidebarProps> = ({ 
  imagePreview, 
  parameters, 
  footer,
  children 
}) => {
  return (
    <div className="absolute left-[14px] top-[14px] bottom-[14px] w-[242px] bg-[rgba(19,19,23,0.82)] backdrop-blur-[18px] border border-[rgba(255,255,255,0.12)] rounded-2xl flex flex-col overflow-hidden z-20 shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)] md:relative md:left-0 md:top-0 md:bottom-0 md:h-auto md:w-[320px] md:mx-4 md:my-4 md:shrink-0 hidden md:flex">
      {imagePreview}
      
      <div className="flex-1 overflow-y-auto thin-scrollbar relative">
        {parameters || children}
      </div>

      {footer && (
        <div className="p-4 border-t border-white/[0.08] bg-[#131317]/50 backdrop-blur-md">
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
