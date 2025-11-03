'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useAppSelector } from '@/store/hooks';

interface UploadModelButtonProps {
  onImageUpload: (imageData: string | null) => void;
  isDisabled?: boolean;
}

type PresetImage = {
  id: string;
  src: string;
  alt?: string;
};

const presetImages: PresetImage[] = [
  // Replace these with your own static assets placed under /public
  { id: 'm1', src: '/core/logosquare.png', alt: 'Model 1' },
  { id: 'm2', src: '/next.svg', alt: 'Model 2' },
  { id: 'm3', src: '/vercel.svg', alt: 'Model 3' },
];

const UploadModelButton: React.FC<UploadModelButtonProps> = ({ onImageUpload, isDisabled: externalDisabled }) => {
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-kontext-dev');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Disable model image upload only for flux-krea (text-only) or when externally disabled
  const isTextOnlyModel = selectedModel === 'flux-krea';
  const isDisabled = externalDisabled || isTextOnlyModel;

  const toggle = () => {
    if (isDisabled) return;
    setIsOpen((v) => !v);
  };

  const handlePresetSelect = (img: PresetImage) => {
    setSelectedId(img.id);
    onImageUpload(img.src);
    setIsOpen(false);
  };

  const handleFileUpload = (file: File) => {
    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      alert("Image too large. Maximum size is 2MB per image.");
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    
    setUploadedName(file.name);
    setSelectedId(null);
    
    // Convert file to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onImageUpload(result);
      }
    };
    reader.readAsDataURL(file);
    setIsOpen(false);
  };

  const clearModel = () => {
    setSelectedId(null);
    setUploadedName('');
    onImageUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isOpen]);

  const hasModel = selectedId || uploadedName;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={toggle}
        disabled={isDisabled}
        className={`h-[32px] px-4 rounded-lg text-[13px] font-medium transition flex items-center gap-2 ${
          isDisabled 
            ? 'text-white/40 bg-white/5 ring-1 ring-white/10 cursor-not-allowed' 
            : 'text-white/90 bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5'
        }`}
        aria-label="Upload model"
        title={isDisabled ? "Model image not needed for text-only model" : "Upload model"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        <span>{hasModel ? 'Model Selected' : 'Upload Model'}</span>
      </button>

      {hasModel && (
        <button
          onClick={clearModel}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
          title="Remove model"
        >
          ×
        </button>
      )}

      {isOpen && (
        <div ref={panelRef} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[50] w-auto max-w-[85vw]">
          <div className="relative rounded-lg bg-black/70 backdrop-blur-3xl border shadow-xl border-white/20 shadow-2xl p-4 pb-14 z-[100]">
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
                  className="relative aspect-square w-[90px] rounded-xl bg-gradient-to-br from-[#3b82f6]/20 to-[#9333ea]/20 ring-1 ring-white/20 hover:ring-white/30 hover:from-[#3b82f6]/25 hover:to-[#9333ea]/25 transition grid place-items-center"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/90">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <div className="text-white/90 text-sm">Upload</div>
                {uploadedName && (
                  <div className="text-xs text-white/60 truncate">{uploadedName}</div>
                )}
              </div>

              {presetImages.map((img) => (
                <div key={img.id} className="space-y-2">
                  <button
                    onClick={() => handlePresetSelect(img)}
                    className={`relative aspect-square w-[90px] rounded-xl overflow-hidden ring-2 transition ${selectedId === img.id ? 'ring-[#2F6BFF]' : 'ring-white/20 hover:ring-white/30'}`}
                    aria-label={`Choose ${img.alt || 'model'}`}
                  >
                    {img.src ? (
                      <Image src={img.src} alt={img.alt || 'Model'} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                    {selectedId === img.id && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2F6BFF] grid place-items-center shadow">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                    )}
                  </button>
                  <div className="text-white/90 text-sm">{img.alt || 'Model'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadModelButton;
