'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setImageCount } from '@/store/slices/generationSlice';

const COUNTS = [1, 2, 3, 4];

const ImageCountButton = () => {
  const dispatch = useAppDispatch();
  const saved = useAppSelector((s: any) => s.generation?.imageCount || 1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [draft, setDraft] = useState<number>(saved);

  const open = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setDraft(saved);
      setIsOpen(true);
    }
  };
  const closeWithoutSave = () => {
    setDraft(saved);
    setIsOpen(false);
  };
  const save = () => {
    dispatch(setImageCount(draft));
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
        className="h-[32px] px-3 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-2"
        aria-label="Image count"
        title="Image count"
      >
        <span className="text-white/90 text-[13px]">Image</span>
        <span className="text-white/90 text-[13px]">{saved}</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[90] w-[120px] max-w-[85vw]">
          <div className="relative rounded-2xl bg-black/80 backdrop-blur-xl ring-1 ring-white/20 shadow-2xl p-2">
            <div className="flex flex-col gap-1.5 px-1 pb-1 max-h-[230px] overflow-auto">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setDraft(c); dispatch(setImageCount(c)); setIsOpen(false); }}
                  className={`h-[28px] px-2 rounded-lg text-white/90 text-[12px] font-medium transition ring-1 text-center mt-2 ${saved === c ? 'ring-[#2F6BFF] bg-white/10' : 'ring-white/20 hover:ring-white/30 hover:bg-white/5'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCountButton;


