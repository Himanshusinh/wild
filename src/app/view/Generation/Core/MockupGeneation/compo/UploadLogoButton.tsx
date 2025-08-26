'use client';

import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setLogoImageName, setLogoImageUrl } from '@/store/slices/generationSlice';

export interface UploadLogoButtonRef {
  getSelectedFile: () => File | null;
}

const UploadLogoButton = forwardRef<UploadLogoButtonRef>((props, ref) => {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const logoImageName = useAppSelector((state: any) => state.generation?.logoImageName || '');
  const logoImageUrl = useAppSelector((state: any) => state.generation?.logoImageUrl || '');

  // Expose the selected file for parent components
  useImperativeHandle(ref, () => ({
    getSelectedFile: () => selectedFile
  }));

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Store file locally for API calls
      setSelectedFile(file);
      
      // Store serializable data in Redux
      dispatch(setLogoImageName(file.name));
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      dispatch(setLogoImageUrl(url));
    }
  };

  const clearLogo = () => {
    setSelectedFile(null);
    dispatch(setLogoImageName(''));
    dispatch(setLogoImageUrl(''));
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const displayLabel = logoImageName ? (logoImageName.length > 20 ? logoImageName.slice(0, 17) + '...' : logoImageName) : 'Upload Logo';

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
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-2"
        aria-label="Upload logo"
      >
        <Image src="/icons/fileuploadwhite.svg" alt="Upload" width={16} height={16} className="opacity-90" />
        <span>{displayLabel}</span>
      </button>
      
      {/* Clear button if logo is selected */}
      {logoImageName && (
        <button
          onClick={clearLogo}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center transition"
          aria-label="Clear logo"
        >
          ×
        </button>
      )}
      
      {/* Preview if logo is selected */}
      {previewUrl && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[90]">
          <div className="w-20 h-20 rounded-lg overflow-hidden ring-1 ring-white/20">
            <Image src={previewUrl} alt="Logo preview" width={80} height={80} className="object-cover" />
          </div>
        </div>
      )}
    </div>
  );
});

UploadLogoButton.displayName = 'UploadLogoButton';

export default UploadLogoButton;


