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

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  const toProxyPath = (urlOrPath: string | undefined) => {
    if (!urlOrPath) return '';
    const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
    if (urlOrPath.startsWith(ZATA_PREFIX)) {
      return urlOrPath.substring(ZATA_PREFIX.length);
    }
    return urlOrPath;
  };

  const toProxyResourceUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `${API_BASE}/api/proxy/resource/${encodeURIComponent(path)}` : '';
  };

  const toProxyDownloadUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `${API_BASE}/api/proxy/download/${encodeURIComponent(path)}` : '';
  };

  const extractStyleFromPrompt = (promptText: string): string | undefined => {
    const match = promptText.match(/\[\s*Style:\s*([^\]]+)\]/i);
    return match?.[1]?.trim();
  };

  const getCleanPrompt = (promptText: string): string => {
    return promptText.replace(/\[\s*Style:\s*[^\]]+\]/i, '').trim();
  };

  const downloadImage = async (url: string) => {
    try {
      const downloadUrl = toProxyDownloadUrl(url);
      if (!downloadUrl) return;
      const response = await fetch(downloadUrl, { credentials: 'include' });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      const baseName = (toProxyPath(url) || 'generated-image').split('/').pop() || 'generated-image.jpg';
      a.download = /\.[a-zA-Z0-9]+$/.test(baseName) ? baseName : 'generated-image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const displayedStyle = preview.entry.style || extractStyleFromPrompt(preview.entry.prompt) || '—';
  const displayedAspect = preview.entry.frameSize || '—';
  const cleanPrompt = getCleanPrompt(preview.entry.prompt);
  const [isPromptExpanded, setIsPromptExpanded] = React.useState(false);
  const isLongPrompt = cleanPrompt.length > 280;

  // Build gallery with user uploads first, then generated outputs
  const inputImages = (((preview.entry as any)?.inputImages) || []) as any[];
  const outputImages = (preview.entry.images || []) as any[];
  const galleryImages = React.useMemo(() => [...inputImages, ...outputImages], [inputImages, outputImages]);

  // Select the clicked image as initial selection
  const initialIndex = React.useMemo(() => {
    const mUrl = (preview.image as any)?.url;
    const mPath = (preview.image as any)?.storagePath;
    const idx = galleryImages.findIndex((im: any) => (mUrl && im?.url === mUrl) || (mPath && im?.storagePath && im.storagePath === mPath));
    return idx >= 0 ? idx : 0;
  }, [galleryImages, preview.image]);

  const [selectedIndex, setSelectedIndex] = React.useState<number>(initialIndex);
  React.useEffect(() => setSelectedIndex(initialIndex), [initialIndex]);

  const selectedImage: any = galleryImages[selectedIndex] || preview.image;
  const isUserUploadSelected = selectedIndex < inputImages.length;

  const [objectUrl, setObjectUrl] = React.useState<string>('');

  React.useEffect(() => {
    let revoke: string | null = null;
    setObjectUrl('');
    const run = async () => {
      try {
        const url = toProxyResourceUrl(selectedImage?.url || preview.image.url);
        if (!url) return;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return;
        const blob = await res.blob();
        const obj = URL.createObjectURL(blob);
        revoke = obj;
        setObjectUrl(obj);
      } catch {}
    };
    run();
    return () => {
      try { if (revoke) URL.revokeObjectURL(revoke); } catch {}
    };
  }, [selectedImage?.url, preview?.image?.url]);

  return (
    <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button aria-label="Close" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-30">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
      <div className="relative w-full max-w-[1200px] max-h-[90vh] bg-black/20 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col md:flex-row h-full">
          <div className="relative flex-1 min-h-[320px] md:min-h-[600px] bg-transparent group flex items-center justify-center">
            {selectedImage?.url && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img src={objectUrl || selectedImage.url || toProxyResourceUrl(selectedImage.url)} alt={preview.entry.prompt} className="max-w-full max-h-full object-contain" />
                {isUserUploadSelected && (
                  <div className="absolute top-3 left-3 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/30">User upload</div>
                )}
              </div>
            )}
            <button
              aria-label="Fullscreen"
              title="Fullscreen"
              className="absolute top-3 left-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => window.open(toProxyResourceUrl(selectedImage?.url || preview.image.url), '_blank')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M3 9V5a2 2 0 0 1 2-2h4" />
                <path d="M21 9V5a2 2 0 0 0-2-2h-4" />
                <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
                <path d="M3 15v4a2 2 0 0 0 2 2h4" />
              </svg>
            </button>
          </div>
          <div className="w-full md:w-[380px] p-5 md:p-6 bg-white/10 backdrop-blur-3xl shadow-sm border-l border-white/10 text-white overflow-y-auto z-30">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm opacity-80 text-white font-semibold pt-4 ">Prompt</div>
              <button
                onClick={() => downloadImage(selectedImage?.url || preview.image.url)}
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
            <div className="text-sm bg-white/5 backdrop-blur-sm rounded-lg p-3 mb-5 border border-white/10 relative">
              <div className="flex items-start gap-2">
                <div className={`opacity-90 leading-relaxed flex-1 max-w-[280px] break-words whitespace-pre-wrap ${isPromptExpanded ? 'max-h-60 overflow-y-auto pr-1' : 'max-h-40 overflow-hidden'}`}>{cleanPrompt}</div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(cleanPrompt);
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
              {!isPromptExpanded && isLongPrompt && (
                <div className="pointer-events-none absolute left-3 right-3 bottom-10 h-10 bg-gradient-to-t from-black/30 to-transparent" />
              )}
              {isLongPrompt && (
                <button
                  onClick={() => setIsPromptExpanded(v => !v)}
                  className="mt-2 text-xs text-white/80 hover:text-white underline"
                >
                  {isPromptExpanded ? 'See less' : 'See more'}
                </button>
              )}
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
              {galleryImages.length > 1 && (
                <div className="mt-3">
                  <div className="text-xs opacity-70 mb-2">Images ({galleryImages.length})</div>
                  <div className="grid grid-cols-3 gap-2">
                    {galleryImages.map((im, idx) => (
                      <button
                        key={im.id || idx}
                        onClick={() => setSelectedIndex(idx)}
                        className={`relative aspect-square rounded-md overflow-hidden border ${selectedIndex === idx ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-white/20 hover:border-white/40'}`}
                      >
                        <img src={im.url} alt={`Image ${idx+1}`} className="w-full h-full object-cover" />
                        {idx < inputImages.length && (
                          <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded">User upload</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;


