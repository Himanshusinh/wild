import React from 'react';
import Image from 'next/image';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mainImage: string;
  category: string;
  description?: string;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  mainImage,
  category,
  description = "Creatively upscale the image. Ensure that all details are crisp and in high quality, Muted color."
}) => {
  if (!isOpen) return null;

  // Mock additional images (you can replace with actual data)
  const additionalImages = [
    mainImage,
    mainImage,
    mainImage,
    mainImage
  ];

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/90 md:bg-black/60 backdrop-blur-sm z-[60] left-[68px]"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="fixed inset-0 left-[68px] z-[70] flex items-center justify-center p-6 overflow-y-auto">
        <div 
          className="bg-[#1E1E1E] rounded-3xl w-full max-w-5xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors z-10"
          >
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="p-8 md:p-12">
            {/* Description Text */}
            <p className="text-white text-base md:text-lg mb-6">
              {description}
            </p>

            {/* Main Image and Upload Button Side by Side */}
            <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
              {/* Main Image */}
              <div className="relative w-full md:w-auto md:flex-shrink-0">
                <div className="relative aspect-square w-full md:w-[400px] rounded-2xl overflow-hidden bg-white/5">
                  <Image
                    src={mainImage}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              
              {/* Upload Image Button - Parallel at top */}
              <div className="flex items-start pt-0">
                <button className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full text-white transition-all duration-200">
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Upload Image
                </button>
              </div>
            </div>

            {/* Additional Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {additionalImages.map((img, index) => (
                <div 
                  key={index}
                  className="relative aspect-square rounded-xl overflow-hidden bg-white/5 cursor-pointer hover:ring-2 hover:ring-white/30 transition-all"
                >
                  <Image
                    src={img}
                    alt={`${title} example ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateModal;

