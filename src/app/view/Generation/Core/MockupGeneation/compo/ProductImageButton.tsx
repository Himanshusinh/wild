'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setProductImageName, setProductImageUrl } from '@/store/slices/generationSlice';

export interface ProductImageButtonRef {
  getSelectedFile: () => File | null;
}

type PresetImage = {
  id: string;
  src: string;
  alt?: string;
};

const presetImages: PresetImage[] = [
  // Replace with your own static assets placed under /public
  { id: 'p1', src: '/core/logosquare.png', alt: 'Sample Product 1' },
  { id: 'p2', src: '/next.svg', alt: 'Sample Product 2' },
  { id: 'p3', src: '/vercel.svg', alt: 'Sample Product 3' },
];

const ProductImageButton = forwardRef<ProductImageButtonRef>((props, ref) => {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string>('');
  
  const productImageName = useAppSelector((state: any) => state.generation?.productImageName || '');
  const productImageUrl = useAppSelector((state: any) => state.generation?.productImageUrl || '');

  // Expose the selected file for parent components
  useImperativeHandle(ref, () => ({
    getSelectedFile: () => uploadedFile
  }));

  const open = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };
  
  const closeWithoutSave = () => {
    setSelectedId(null);
    setUploadedFile(null);
    setUploadedPreview('');
    setIsOpen(false);
  };
  
  const saveAndClose = () => {
    if (uploadedFile) {
      dispatch(setProductImageName(uploadedFile.name));
      dispatch(setProductImageUrl(uploadedPreview));
    } else if (selectedId) {
      // For preset images, we need to convert them to File objects
      // This is a simplified approach - in production you might want to fetch the actual image
      const presetImage = presetImages.find(img => img.id === selectedId);
      if (presetImage) {
        // Create a mock file from preset image
        // Note: This is a workaround - ideally you'd have actual image files
        const mockFile = new File([''], presetImage.alt || 'preset-image', { type: 'image/png' });
        setUploadedFile(mockFile);
        dispatch(setProductImageName(presetImage.alt || 'preset-image'));
        dispatch(setProductImageUrl(presetImage.src));
      }
    }
    setIsOpen(false);
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setSelectedId(null);
    
    // Create preview
    const url = URL.createObjectURL(file);
    setUploadedPreview(url);
  };

  const handlePresetSelect = (id: string) => {
    setSelectedId(id);
    setUploadedFile(null);
    if (uploadedPreview) {
      URL.revokeObjectURL(uploadedPreview);
      setUploadedPreview('');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeWithoutSave();
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isOpen]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (uploadedPreview) {
        URL.revokeObjectURL(uploadedPreview);
      }
    };
  }, [uploadedPreview]);

  const displayLabel = productImageName ? (productImageName.length > 20 ? productImageName.slice(0, 17) + '...' : productImageName) : 'Product Image';

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={open}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-1"
      >
        {displayLabel}
      </button>

      {isOpen && (
        <div ref={panelRef} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[90] w-[420px] max-w-[85vw]">
          <div className="relative rounded-2xl bg-black/80 backdrop-blur-xl ring-1 ring-white/20 shadow-2xl p-4 pb-14">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-base font-semibold">Choose Product Image</h3>
              <button
                className="p-2 rounded-lg hover:bg-white/10 transition"
                onClick={closeWithoutSave}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/90">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 justify-items-center">
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative aspect-square w-[90px] rounded-xl bg-gradient-to-br from-[#3b82f6]/20 to-[#9333ea]/20 ring-2 transition grid place-items-center ${
                    uploadedFile ? 'ring-[#2F6BFF]' : 'ring-white/20 hover:ring-white/30'
                  }`}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/90">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  {uploadedFile && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2F6BFF] grid place-items-center shadow">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    </span>
                  )}
                </button>
                <div className="text-white/90 text-sm truncate w-[90px] text-center">
                  {uploadedFile ? uploadedFile.name.slice(0, 15) + '...' : 'Upload'}
                </div>
              </div>
              
              {/* Preset Images */}
              {presetImages.map((img) => (
                <div key={img.id} className="space-y-2">
                  <button
                    onClick={() => handlePresetSelect(img.id)}
                    className={`relative aspect-square w-[90px] rounded-xl overflow-hidden ring-2 transition ${
                      selectedId === img.id ? 'ring-[#2F6BFF]' : 'ring-white/20 hover:ring-white/30'
                    }`}
                    aria-label={`Choose ${img.alt || 'product'}`}
                  >
                    <Image src={img.src} alt={img.alt || 'Product'} fill className="object-cover" />
                    {selectedId === img.id && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2F6BFF] grid place-items-center shadow">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      </span>
                    )}
                  </button>
                  <div className="text-white/90 text-sm truncate w-[90px] text-center">{img.alt || 'Product'}</div>
                </div>
              ))}
            </div>

            {/* Save Arrow */}
            <button
              className="absolute bottom-3 right-3 p-2 rounded-lg transition group text-[#2F6BFF] hover:text-[#60A5FA]"
              onClick={saveAndClose}
              aria-label="Save"
              title="Save"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

ProductImageButton.displayName = 'ProductImageButton';

export default ProductImageButton;


