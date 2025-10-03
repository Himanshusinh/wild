'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Download, ExternalLink, Copy, Check } from 'lucide-react';
import { HistoryEntry, GeneratedImage } from '@/types/history';

interface StickerImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  entry: HistoryEntry;
}

const StickerImagePreview: React.FC<StickerImagePreviewProps> = ({
  isOpen,
  onClose,
  entry
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  const toFrontendProxyResourceUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `/api/proxy/resource/${encodeURIComponent(path)}` : '';
  };

  if (!isOpen) return null;

  const inputImages = ((entry as any)?.inputImages || []) as any[];
  const outputImages = (entry.images || []) as any[];
  const galleryImages = [...inputImages, ...outputImages];
  const selectedImage = galleryImages[selectedImageIndex];
  const isUserUploadSelected = selectedImageIndex < inputImages.length;
  const selectedImagePath = (selectedImage as any)?.storagePath || toProxyPath(selectedImage?.url);
  const selectedImageProxyUrl = toProxyResourceUrl(selectedImagePath);
  const [selectedImageObjectUrl, setSelectedImageObjectUrl] = useState<string>('');

  React.useEffect(() => {
    let revokeUrl: string | null = null;
    setSelectedImageObjectUrl('');
    if (!selectedImagePath) return;
    const controller = new AbortController();
    const doFetch = async () => {
      try {
        const url = toProxyResourceUrl(selectedImagePath);
        if (!url) return;
        const res = await fetch(url, { credentials: 'include', signal: controller.signal });
        if (!res.ok) return;
        const blob = await res.blob();
        const obj = URL.createObjectURL(blob);
        revokeUrl = obj;
        setSelectedImageObjectUrl(obj);
      } catch {}
    };
    doFetch();
    return () => {
      try { if (revokeUrl) URL.revokeObjectURL(revokeUrl); } catch {}
      controller.abort();
    };
  }, [selectedImagePath]);

  const handleDownload = async () => {
    try {
      const downloadUrl = toProxyDownloadUrl(selectedImagePath);
      if (!downloadUrl) return;
      const res = await fetch(downloadUrl, { credentials: 'include' });
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      const baseName = (selectedImagePath || 'sticker').split('/').pop() || `sticker-${Date.now()}.png`;
      a.download = /\.[a-zA-Z0-9]+$/.test(baseName) ? baseName : `sticker-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getUserPrompt = (rawPrompt: string | undefined) => {
    if (!rawPrompt) return '';
    // New backend prompt format
    const m = rawPrompt.match(/Create a fun and engaging sticker design of:\s*(.+?)\s*\./i);
    if (m && m[1]) return m[1].trim();
    // Fallback to older prefix style
    return rawPrompt.replace(/^Sticker:\s*/i, '').trim();
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(getUserPrompt(entry.prompt));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleOpenInNewTab = () => {
    if (!selectedImageProxyUrl) return;
    window.open(selectedImageProxyUrl, '_blank');
  };

  const userPrompt = getUserPrompt(entry.prompt);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const isLongPrompt = (userPrompt || '').length > 280;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button 
        aria-label="Close" 
        onClick={onClose} 
        className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-30"
      >
        <X className="h-5 w-5" />
      </button>
      
      <div className="relative w-full max-w-[1200px] max-h-[90vh] bg-black/20 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col md:flex-row h-full">
          {/* Main Image Display */}
          <div className="relative flex-1 min-h-[320px] md:min-h-[600px] bg-transparent group">
            {selectedImage && (
              <Image 
                src={selectedImageObjectUrl || selectedImage?.url || selectedImageProxyUrl} 
                alt={entry.prompt} 
                fill 
                className="object-contain" 
                unoptimized
              />
            )}
            {isUserUploadSelected && (
              <div className="absolute top-3 left-3 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/30">User upload</div>
            )}
            <button
              aria-label="Fullscreen"
              title="Fullscreen"
              className="absolute top-3 left-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => window.open(toFrontendProxyResourceUrl(selectedImagePath || selectedImage?.url), '_blank')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M3 9V5a2 2 0 0 1 2-2h4" />
                <path d="M21 9V5a2 2 0 0 0-2-2h-4" />
                <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
                <path d="M3 15v4a2 2 0 0 0 2 2h4" />
              </svg>
            </button>
          </div>

          {/* Right Sidebar */}
          <div className="w-full md:w-[380px] p-5 md:p-6 bg-white/5 backdrop-blur-xl border-l border-white/10 text-white overflow-y-auto">
            {/* Prompt Section */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm opacity-80">Prompt</div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">Download</span>
              </button>
            </div>

            {/* Prompt Text */}
            <div className="text-sm bg-white/5 backdrop-blur-sm rounded-lg p-3 mb-5 border border-white/10 relative">
              <div className="flex items-start gap-2">
                <div className={`opacity-90 leading-relaxed flex-1 max-w-[280px] break-words whitespace-pre-wrap ${isPromptExpanded ? 'max-h-60 overflow-y-auto pr-1' : 'max-h-40 overflow-hidden'}`}>{userPrompt}</div>
                <button
                  onClick={handleCopyPrompt}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white/80 flex-shrink-0 mt-0.5"
                  title="Copy prompt"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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

            {/* Image Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="mb-5">
                <div className="text-sm opacity-80 mb-3">Images ({galleryImages.length})</div>
                <div className="grid grid-cols-2 gap-2">
                  {galleryImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index 
                          ? 'border-blue-500 ring-2 ring-blue-500/30' 
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <Image
                        src={(image as any)?.url}
                        alt={`Sticker ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {index < inputImages.length && (
                        <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded">User upload</div>
                      )}
                      {selectedImageIndex === index && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Section */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                <span className="opacity-60">Model</span>
                <span className="opacity-90">{entry.model}</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                <span className="opacity-60">Type</span>
                <span className="opacity-90">Sticker Generation</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                <span className="opacity-60">Images</span>
                <span className="opacity-90">{entry.imageCount} sticker{entry.imageCount > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                <span className="opacity-60">Generated</span>
                <span className="opacity-90">{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickerImagePreview;
