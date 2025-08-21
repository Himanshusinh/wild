'use client';

import React from 'react';
import Image from 'next/image';
import { HistoryEntry } from '@/types/history';

interface ImagePreviewModalProps {
  preview: { entry: HistoryEntry; image: { id?: string; url: string } } | null;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ preview, onClose }) => {
  if (!preview) return null;

  const extractStyleFromPrompt = (promptText: string): string | undefined => {
    const match = promptText.match(/\[\s*Style:\s*([^\]]+)\]/i);
    return match?.[1]?.trim();
  };

  const getCleanPrompt = (promptText: string): string => {
    return promptText.replace(/\[\s*Style:\s*[^\]]+\]/i, '').trim();
  };

  const downloadImage = async (url: string) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'generated-image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const displayedStyle = preview.entry.style || extractStyleFromPrompt(preview.entry.prompt) || '—';
  const displayedAspect = preview.entry.frameSize || '—';

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button aria-label="Close" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-30">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
             <div className="relative w-full max-w-[1200px] max-h-[90vh] bg-black/20 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col md:flex-row h-full">
          <div className="relative flex-1 min-h-[320px] md:min-h-[600px] bg-transparent group">
            {preview.image?.url && (
              <Image src={preview.image.url} alt={preview.entry.prompt} fill className="object-contain" />
            )}
            <button
              aria-label="Fullscreen"
              title="Fullscreen"
              className="absolute top-3 left-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => window.open(preview.image.url, '_blank')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M3 9V5a2 2 0 0 1 2-2h4" />
                <path d="M21 9V5a2 2 0 0 0-2-2h-4" />
                <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
                <path d="M3 15v4a2 2 0 0 0 2 2h4" />
              </svg>
            </button>
          </div>
                     <div className="w-full md:w-[380px] p-5 md:p-6 bg-white/5 backdrop-blur-xl border-l border-white/10 text-white overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm opacity-80">Prompt</div>
              <button
                onClick={() => downloadImage(preview.image.url)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/20"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 3v12" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M5 19h14" />
                </svg>
                <span className="text-sm">Download</span>
              </button>
            </div>
                                      <div className="text-sm bg-white/5 backdrop-blur-sm rounded-lg p-3 mb-5 border border-white/10">
               <div className="flex items-start gap-2">
                 <div className="opacity-90 leading-relaxed flex-1 max-w-[280px] break-words">{getCleanPrompt(preview.entry.prompt)}</div>
                 <button
                   onClick={() => {
                     navigator.clipboard.writeText(getCleanPrompt(preview.entry.prompt));
                     // You can add a toast notification here if you have access to the dispatch
                   }}
                   className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white/80 flex-shrink-0 mt-0.5"
                   title="Copy prompt"
                 >
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                     <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                     <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                   </svg>
                 </button>
               </div>
             </div>
                         <div className="space-y-2 text-sm">
               <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                 <span className="opacity-60">Model</span>
                 <span className="opacity-90">{preview.entry.model}</span>
               </div>
               <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                 <span className="opacity-60">Style</span>
                 <span className="opacity-90">{displayedStyle}</span>
               </div>
               <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                 <span className="opacity-60">Aspect ratio</span>
                 <span className="opacity-90">{displayedAspect}</span>
               </div>
               <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                 <span className="opacity-60">Generated</span>
                 <span className="opacity-90">{new Date(preview.entry.timestamp).toLocaleString()}</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;


