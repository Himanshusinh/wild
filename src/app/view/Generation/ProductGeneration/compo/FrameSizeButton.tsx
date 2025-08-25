'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setFrameSize } from '@/store/slices/generationSlice';

type FrameOption = {
  id: string;
  label: string;
  width: number;  // relative units
  height: number; // relative units
};

const FRAME_OPTIONS: FrameOption[] = [
  { id: '1:1', label: '1:1', width: 1, height: 1 },
  { id: '16:9', label: '16:9', width: 16, height: 9 },
  { id: '9:16', label: '9:16', width: 9, height: 16 },
  { id: '4:5', label: '4:5', width: 4, height: 5 },
  { id: '3:2', label: '3:2', width: 3, height: 2 },
];

const FrameSizeButton = () => {
  const dispatch = useAppDispatch();
  const saved = useAppSelector((s: any) => s.generation?.frameSize || '1:1');
  const selectedModel = useAppSelector((s: any) => s.generation?.selectedModel || 'flux-kontext-dev');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>(saved);

  // Disable frame size selection for local model
  const isLocalModel = selectedModel === 'flux-kontext-dev';
  const isDisabled = isLocalModel;

  const open = () => {
    if (isDisabled) return;
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

  const renderPreviewStyle = (opt: FrameOption, maxPx: number = 64) => {
    const max = maxPx; // px
    let previewWidth = max;
    let previewHeight = (opt.height / opt.width) * previewWidth;
    if (previewHeight > max) {
      previewHeight = max;
      previewWidth = (opt.width / opt.height) * previewHeight;
    }
    return {
      width: `${previewWidth}px`,
      height: `${previewHeight}px`,
    } as React.CSSProperties;
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={open}
        className={`h-[32px] px-3 rounded-full text-[13px] font-medium transition flex items-center gap-2 ${
          isDisabled 
            ? 'text-white/40 bg-white/5 ring-1 ring-white/10 cursor-not-allowed' 
            : 'text-white/90 bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5'
        }`}
        aria-label="Frame size"
        title={isDisabled ? "Frame size not available for local model" : "Frame size"}
        disabled={isDisabled}
      >
        <div className="relative rounded-[4px] bg-white/10 ring-1 ring-white/30"
             style={renderPreviewStyle(FRAME_OPTIONS.find(o => o.id === saved) || FRAME_OPTIONS[0], 22)}>
          <span className="absolute inset-0 grid place-items-center text-[10px] text-white/90">{saved}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[90] w-[110px] max-w-[85vw]">
          <div className="relative rounded-2xl bg-black/80 backdrop-blur-xl ring-1 ring-white/20 shadow-2xl p-2 pt-3">
            <div className="flex flex-col gap-1.5 max-h-[240px] overflow-auto">
              {FRAME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setDraft(opt.id); dispatch(setFrameSize(opt.id)); setIsOpen(false); }}
                  className={`relative w-full rounded-lg transition py-1.5 flex items-center justify-center ${saved === opt.id ? 'ring-[#2F6BFF] bg-[#2F6BFF]/10 shadow-[0_0_8px_rgba(47,107,255,0.3)]' : 'ring-white/20 hover:ring-white/30 hover:bg-white/5'}`}
                  aria-label={`Choose ${opt.label}`}
                >
                  <div className="relative">
                    <div className={`relative rounded-[3px] ring-1 transition ${saved === opt.id ? 'bg-white/20 ring-white/40' : 'bg-white/10 ring-white/30'}`} style={renderPreviewStyle(opt, 36)}>
                      <span className={`absolute inset-0 grid place-items-center text-[10px] transition ${saved === opt.id ? 'text-white font-medium' : 'text-white/90'}`}>{opt.label}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FrameSizeButton;
