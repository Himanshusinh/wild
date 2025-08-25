'use client';

import React, { useRef, useState } from 'react';

const UploadProductButton = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
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
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-2"
        aria-label="Upload product"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        <span>{displayLabel}</span>
      </button>
    </div>
  );
};

export default UploadProductButton;
