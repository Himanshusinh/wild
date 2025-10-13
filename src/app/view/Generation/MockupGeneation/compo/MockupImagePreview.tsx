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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-2" onClick={onClose}>
      <div className="relative w-full max-w-6xl bg-black/40 ring-1 ring-white/20 rounded-2xl overflow-hidden shadow-2xl" style={{ height: '92vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-end px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
          <button aria-label="Close" className="text-white/80 hover:text-white text-lg" onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className="pt-[52px] h-[calc(92vh-52px)] md:flex md:flex-row md:gap-0">
          {/* Media */}
          <div className="relative bg-black/30 h-[40vh] md:h-full md:flex-1 flex items-center justify-center">
            {selected && (
              <Image src={selected.url} alt={entry.prompt} fill className="object-contain p-2" />
            )}
          </div>
          
          {/* Sidebar */}
          <div className="p-4 md:p-5 text-white border-t md:border-t-0 md:border-l border-white/10 bg-black/30 h-[52vh] md:h-full md:w-[34%] overflow-y-auto">
            {/* Action Buttons */}
            <div className="mb-4 flex gap-2">
              <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-sm">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>

            {/* Prompt */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-white/60 text-xs uppercase tracking-wider mb-2">
                <span>Prompt</span>
                <button 
                  onClick={handleCopyPrompt}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Copy prompt"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-white/60 hover:text-white">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                </button>
              </div>
              <div className="text-white/90 text-xs leading-relaxed whitespace-pre-wrap break-words">
                {getUserPrompt(entry.prompt)}
              </div>
            </div>
            
            {/* Date */}
            <div className="mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Date</div>
              <div className="text-white text-sm">{new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {(() => { const d = new Date(entry.timestamp); const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); return `${dd}-${mm}-${yyyy}` })()}</div>
            </div>
            {/* Details */}
            <div className="mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Details</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Model:</span>
                  <span className="text-white text-sm">{entry.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Format:</span>
                  <span className="text-white text-sm">Mockup</span>
                </div>
              </div>
            </div>
            {/* Gallery */}
            {entry.images.length > 1 && (
              <div className="mb-4">
                <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Mockups ({entry.images.length})</div>
                <div className="grid grid-cols-3 gap-2">
                  {entry.images.map((img, i) => (
                    <button 
                      key={img.id} 
                      onClick={() => setSelectedIndex(i)} 
                      className={`relative aspect-square rounded-md overflow-hidden border transition-all duration-200 ${
                        selectedIndex === i 
                          ? 'border-white ring-2 ring-white/30' 
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <Image 
                        src={img.url} 
                        alt={`Mockup ${i + 1}`} 
                        fill 
                        className="object-cover" 
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-6">
              <button 
                onClick={onClose}
                className="w-full px-4 py-2.5 bg-[#2D6CFF] text-white rounded-lg hover:bg-[#255fe6] transition-colors text-sm font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockupImagePreview;


