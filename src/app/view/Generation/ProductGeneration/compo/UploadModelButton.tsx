'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

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

const UploadModelButton = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggle = () => setIsOpen((v) => !v);

  useEffect(() => {
    if (!isOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedId(null);
        setUploadedName('');
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={toggle}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-2"
        aria-label="Upload model"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        <span>Upload Model</span>
      </button>

      {isOpen && (
        <div ref={panelRef} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[90] w-[420px] max-w-[85vw]">
          <div className="relative rounded-2xl bg-black/80 backdrop-blur-xl ring-1 ring-white/20 shadow-2xl p-4 pb-14">
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
                    aria-label={`Choose ${img.alt || 'model'}`}
                  >
                    <Image src={img.src} alt={img.alt || 'Model'} fill className="object-cover" />
                    {selectedId === img.id && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2F6BFF] grid place-items-center shadow">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                    )}
                  </button>
                  <div className="text-white/90 text-sm truncate w-[90px] text-center">{img.alt || 'Model'}</div>
                </div>
              ))}
            </div>

            <button
              className="absolute bottom-3 right-3 p-2 rounded-lg transition group text-[#2F6BFF] hover:text-[#60A5FA]"
              onClick={() => setIsOpen(false)}
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

export default UploadModelButton;
