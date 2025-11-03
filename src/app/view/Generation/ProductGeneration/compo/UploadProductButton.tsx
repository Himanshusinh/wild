'use client';

import React, { useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';

interface UploadProductButtonProps {
  onImageUpload: (imageData: string | null) => void;
  isDisabled?: boolean;
}

const UploadProductButton: React.FC<UploadProductButtonProps> = ({ onImageUpload, isDisabled: externalDisabled }) => {
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-kontext-dev');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // Disable product image upload only for flux-krea (text-only) or when externally disabled
  const isTextOnlyModel = selectedModel === 'flux-krea';
  const isDisabled = externalDisabled || isTextOnlyModel;

  const handleClick = () => {
    if (isDisabled) return;
    inputRef.current?.click();
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        alert("Image too large. Maximum size is 2MB per image.");
        // Clear the input
        event.target.value = "";
        return;
      }
      
      setSelectedFileName(file.name);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          onImageUpload(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedFileName('');
    onImageUpload(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const displayLabel = selectedFileName ? (selectedFileName.length > 20 ? selectedFileName.slice(0, 17) + '...' : selectedFileName) : 'Upload Product';

  return (
    <div className="relative dropdown-container">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`h-[32px] px-4 rounded-lg text-[13px] font-medium transition flex items-center gap-2 ${
          isDisabled 
            ? 'text-white/40 bg-white/5 ring-1 ring-white/10 cursor-not-allowed' 
            : 'text-white/90 bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5'
        }`}
        aria-label="Upload product"
        title={isDisabled ? "Product image not needed for text-only model" : "Upload product"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        <span>{displayLabel}</span>
      </button>
      {selectedFileName && (
        <button
          onClick={clearImage}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
          title="Remove image"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default UploadProductButton;
