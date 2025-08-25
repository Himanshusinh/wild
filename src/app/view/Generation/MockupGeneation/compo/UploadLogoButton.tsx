'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';

const UploadLogoButton = () => {
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

  const displayLabel = selectedFileName ? (selectedFileName.length > 20 ? selectedFileName.slice(0, 17) + '...' : selectedFileName) : 'Upload Logo';

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
    </div>
  );
};

export default UploadLogoButton;


