"use client";

import React, { useEffect, useState } from "react";
import UpscalePopup from "./UpscalePopup";
import RemoveBgPopup from "./RemoveBgPopup";
import ResizePopup from "./ResizePopup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUpscale: () => void;
  onRemoveBg: () => void;
  onResize: () => void;
};

const EditPopup: React.FC<Props> = ({ isOpen, onClose, onUpscale, onRemoveBg, onResize }) => {
  const [tab, setTab] = useState<'upscale' | 'remove' | 'resize'>('upscale');
  // Lock background scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = (document.documentElement as HTMLElement).style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    (document.documentElement as HTMLElement).style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      (document.documentElement as HTMLElement).style.overscrollBehavior = prevOverscroll;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 md:bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-2  " onClick={onClose}>
      <div className="relative w-[100%] max-w-3xl bg-white/5 backdrop-blur-3xl  ring-1 ring-white/20 rounded-2xl overflow-hidden shadow-2xl " onClick={(e)=>e.stopPropagation()}>
        {/* Header tabs */}
        <div className="px-4 pt-4">
          <div className="text-white/90 text-base font-semibold mb-3">Edit image</div>
          <div className="flex gap-2 mb-2">
            {[
              { key: 'upscale', label: 'Upscale' },
              { key: 'remove', label: 'Remove background' },
              { key: 'resize', label: 'Resize' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  if (key === 'upscale') setTab('upscale');
                  else if (key === 'remove') setTab('remove');
                  else if (key === 'resize') setTab('resize');
                }}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${tab === key ? 'bg-white/20 ring-1 ring-white/30 text-white' : 'bg-white/10 hover:bg-white/15 text-white/80'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4">
          <div className={`transition-opacity duration-200 ${tab === 'upscale' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
            <div className="text-white/80 mb-3 text-sm">Increase resolution while preserving details.</div>
            {/* Render Upscale tool inline inside this modal */}
            <UpscalePopup inline isOpen={true} onClose={() => {}} />
          </div>
          <div className={`transition-opacity duration-200 ${tab === 'remove' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
            <div className="text-white/80 mb-3 text-sm pl-4">Remove background to get a clean cutout.</div>
            {/* Render Remove BG tool inline inside this modal */}
            <RemoveBgPopup inline isOpen={true} onClose={() => {}} />
          </div>
          <div className={`transition-opacity duration-200 ${tab === 'resize' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
            <div className="text-white/80 mb-3 text-sm pl-4">Quickly change canvas size/aspect.</div>
            <ResizePopup inline isOpen={true} onClose={() => {}} />
          </div>

          <div className="mt-8 flex justify-end">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-white/80 hover:text-white">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPopup;


