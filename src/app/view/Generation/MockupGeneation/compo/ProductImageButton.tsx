'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

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

const ProductImageButton = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const open = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setSelectedId(null);
      setUploadedName('');
      setIsOpen(true);
    }
  };
  const closeWithoutSave = () => {
    setSelectedId(null);
    setUploadedName('');
    setIsOpen(false);
  };
  const saveAndClose = () => {
    // For now, we just close; tie into Redux or parent later
    setIsOpen(false);
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

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={open}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-1"
      >
        Product Image
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
                    if (file) setUploadedName(file.name);
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
                    onClick={() => setSelectedId(img.id)}
                    className={`relative aspect-square w-[90px] rounded-xl overflow-hidden ring-2 transition ${selectedId === img.id ? 'ring-[#2F6BFF]' : 'ring-white/20 hover:ring-white/30'}`}
                    aria-label={`Choose ${img.alt || 'product'}`}
                  >
                    {img.src ? (
                      <Image src={img.src} alt={img.alt || 'Product'} fill className="object-cover" />
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
                  <div className="text-white/90 text-sm truncate w-[90px] text-center">{img.alt || 'Product'}</div>
                </div>
              ))}
            </div>

            <button
              className="absolute bottom-3 right-3 p-2 rounded-lg transition group text-[#2F6BFF] hover:text-[#60A5FA]"
              onClick={saveAndClose}
              aria-label="Save"
              title="Save"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M13 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageButton;


