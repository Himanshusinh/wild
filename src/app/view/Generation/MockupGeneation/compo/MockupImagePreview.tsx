'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Download, Copy, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { HistoryEntry } from '@/types/history';

interface MockupImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  entry: HistoryEntry;
}

const MockupImagePreview: React.FC<MockupImagePreviewProps> = ({ isOpen, onClose, entry }) => {
  const [copied, setCopied] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  if (!isOpen) return null;

  const selected = entry.images[selectedIndex];
  const getUserPrompt = (raw: string | undefined) => (raw || '').replace(/^Mockup:\s*/i, '').trim();

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(getUserPrompt(entry.prompt));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(selected.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mockup-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {}
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button aria-label="Close" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-30">
        <X className="h-5 w-5" />
      </button>
      <div className="relative w-full max-w-[1200px] max-h-[90vh] bg-black/20 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col md:flex-row h-full">
          {/* Main preview - stays centered and contained */}
          <div className="relative flex-1 min-h-[320px] md:min-h-[600px] bg-transparent flex items-center justify-center">
            {selected && (
              <Image src={selected.url} alt={entry.prompt} fill className="object-contain p-2" />
            )}
          </div>
          {/* Right pane with its own scroll */}
          <div className="w-full md:w-[420px] p-5 md:p-6 bg-white/5 backdrop-blur-xl border-l border-white/10 text-white overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm opacity-80">Prompt</div>
              <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/20">
                <Download className="h-4 w-4" />
                <span className="text-sm">Download</span>
              </button>
            </div>
            <div className="text-sm bg-white/5 backdrop-blur-sm rounded-lg p-3 mb-5 border border-white/10">
              <div className="flex items-start gap-2">
                <div className="opacity-90 leading-relaxed flex-1 max-w-[320px] break-words">{getUserPrompt(entry.prompt)}</div>
                <button onClick={handleCopyPrompt} className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white/80 flex-shrink-0 mt-0.5" title="Copy prompt">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {entry.images.length > 1 && (
              <div className="mb-5">
                <div className="text-sm opacity-80 mb-3">Generated Mockups ({entry.images.length})</div>
                {/* Enhanced thumbnails scroll area with better scrolling */}
                <div className="relative">
                  {/* Scroll indicators */}
                  {entry.images.length > 9 && (
                    <>
                      <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-10 rounded-t-lg"></div>
                      <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-white/10 to-transparent pointer-events-none z-10 rounded-b-lg"></div>
                    </>
                  )}
                  
                  {/* Thumbnails scrollable grid */}
                  <div className="max-h-[52vh] overflow-y-auto pr-1 grid grid-cols-3 gap-2 thumbnails-scroll" ref={scrollContainerRef}>
                    {entry.images.map((img, i) => (
                      <button 
                        key={img.id} 
                        onClick={() => setSelectedIndex(i)} 
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          selectedIndex === i 
                            ? 'border-blue-500 ring-2 ring-blue-500/30 scale-105' 
                            : 'border-white/20 hover:border-white/40 hover:scale-102'
                        }`}
                      >
                        <Image 
                          src={img.url} 
                          alt={`Mockup ${i + 1}`} 
                          fill 
                          className="object-cover transition-transform duration-200 hover:scale-110" 
                        />
                        {/* Image number indicator */}
                        {/* <div className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {i + 1}
                        </div> */}
                      </button>
                    ))}
                  </div>
                  
                  {/* Scroll hint for many images */}
                  {/* {entry.images.length > 9 && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <button
                        onClick={scrollToTop}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        title="Scroll to top"
                      >
                        <ChevronUp className="h-3 w-3 text-white/60" />
                      </button>
                      <span className="text-xs text-white/50">Scroll to see all {entry.images.length} mockups</span>
                      <button
                        onClick={scrollToBottom}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        title="Scroll to bottom"
                      >
                        <ChevronDown className="h-3 w-3 text-white/60" />
                      </button>
                    </div>
                  )} */}
                </div>
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10"><span className="opacity-60">Model</span><span className="opacity-90">{entry.model}</span></div>
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10"><span className="opacity-60">Type</span><span className="opacity-90">Mockup Generation</span></div>
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10"><span className="opacity-60">Images</span><span className="opacity-90">{entry.imageCount}</span></div>
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10"><span className="opacity-60">Generated</span><span className="opacity-90">{new Date(entry.timestamp).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockupImagePreview;


