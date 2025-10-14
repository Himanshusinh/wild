'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Download, ExternalLink, Copy, Check, Share, Trash2 } from 'lucide-react';
import { HistoryEntry, GeneratedImage } from '@/types/history';
import { useAppDispatch } from '@/store/hooks';
import axiosInstance from '@/lib/axiosInstance';
import { removeHistoryEntry } from '@/store/slices/historySlice';

interface LogoImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  entry: HistoryEntry;
}

const LogoImagePreview: React.FC<LogoImagePreviewProps> = ({
  isOpen,
  onClose,
  entry
}) => {
  console.log('LogoImagePreview', entry);
  const [copiedButtonId, setCopiedButtonId] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // Fullscreen state for in-place zoom/pan viewer
  const [isFsOpen, setIsFsOpen] = React.useState(false);
  const [fsScale, setFsScale] = React.useState(1);
  const [fsFitScale, setFsFitScale] = React.useState(1);
  const [fsOffset, setFsOffset] = React.useState({ x: 0, y: 0 });
  const [fsIsPanning, setFsIsPanning] = React.useState(false);
  const [fsLastPoint, setFsLastPoint] = React.useState({ x: 0, y: 0 });
  const [fsNaturalSize, setFsNaturalSize] = React.useState({ width: 0, height: 0 });
  const fsContainerRef = React.useRef<HTMLDivElement>(null);

  // Lock background scroll while modal is open
  React.useEffect(() => {
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

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  const toProxyPath = (urlOrPath: string | undefined) => {
    if (!urlOrPath) return '';
    // Prefer storagePath if provided
    // If full Zata URL, strip prefix to get storagePath
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

  // ---- Fullscreen helpers (unconditional hooks) ----
  const fsClampOffset = React.useCallback((newOffset: { x: number; y: number }, currentScale: number) => {
    if (!fsContainerRef.current) return newOffset;
    const rect = fsContainerRef.current.getBoundingClientRect();
    const imgW = fsNaturalSize.width * currentScale;
    const imgH = fsNaturalSize.height * currentScale;
    const maxX = Math.max(0, (imgW - rect.width) / 2);
    const maxY = Math.max(0, (imgH - rect.height) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, newOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, newOffset.y))
    };
  }, [fsNaturalSize]);

  const fsZoomToPoint = React.useCallback((point: { x: number; y: number }, newScale: number) => {
    if (!fsContainerRef.current) return;
    const rect = fsContainerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newOffsetX = centerX - (point.x * newScale);
    const newOffsetY = centerY - (point.y * newScale);
    const clamped = fsClampOffset({ x: newOffsetX, y: newOffsetY }, newScale);
    setFsScale(newScale);
    setFsOffset(clamped);
  }, [fsClampOffset]);

  const openFullscreen = React.useCallback(() => setIsFsOpen(true), []);
  const closeFullscreen = React.useCallback(() => { setIsFsOpen(false); setFsIsPanning(false); }, []);

  React.useEffect(() => {
    if (!isFsOpen) return;
    const computeFit = () => {
      if (!fsContainerRef.current || !fsNaturalSize.width || !fsNaturalSize.height) return;
      const rect = fsContainerRef.current.getBoundingClientRect();
      const fit = Math.min(rect.width / fsNaturalSize.width, rect.height / fsNaturalSize.height) || 1;
      const base = Math.min(1, fit);
      setFsFitScale(base); setFsScale(base); setFsOffset({ x: 0, y: 0 });
    };
    computeFit();
    const onResize = () => computeFit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isFsOpen, fsNaturalSize]);

  React.useEffect(() => {
    if (!isFsOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isFsOpen]);

  const fsOnWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!fsContainerRef.current) return;
    const rect = fsContainerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const next = Math.max(0.5, Math.min(6, fsScale + delta));
    if (next !== fsScale) fsZoomToPoint({ x: mx, y: my }, next);
  }, [fsScale, fsZoomToPoint]);
  const fsOnMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); setFsIsPanning(true); setFsLastPoint({ x: e.clientX, y: e.clientY }); }, []);
  const fsOnMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!fsIsPanning) return; e.preventDefault();
    const dx = e.clientX - fsLastPoint.x; const dy = e.clientY - fsLastPoint.y;
    const clamped = fsClampOffset({ x: fsOffset.x + dx, y: fsOffset.y + dy }, fsScale);
    setFsOffset(clamped); setFsLastPoint({ x: e.clientX, y: e.clientY });
  }, [fsIsPanning, fsLastPoint, fsOffset, fsClampOffset, fsScale]);
  const fsOnMouseUp = React.useCallback(() => setFsIsPanning(false), []);

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
      } catch { }
    };
    doFetch();
    return () => {
      try { if (revokeUrl) URL.revokeObjectURL(revokeUrl); } catch { }
      controller.abort();
    };
  }, [selectedImagePath]);

  const handleDelete = async () => {
    try {
      if (!window.confirm('Delete this generation permanently? This cannot be undone.')) return;
      await axiosInstance.delete(`/api/generations/${entry.id}`);
      try { dispatch(removeHistoryEntry(entry.id)); } catch {}
      onClose();
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Failed to delete generation');
    }
  };

  const handleDownload = async () => {
    try {
      const downloadUrl = toProxyDownloadUrl(selectedImagePath);
      if (!downloadUrl) return;
      const res = await fetch(downloadUrl, { credentials: 'include' });
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      const baseName = (selectedImagePath || 'logo').split('/').pop() || `logo-${Date.now()}.png`;
      a.download = /\.[a-zA-Z0-9]+$/.test(baseName) ? baseName : `logo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const shareImage = async (url: string) => {
    try {
      if (!navigator.share) {
        await navigator.clipboard.writeText(url);
        alert('Image URL copied to clipboard!');
        return;
      }

      const downloadUrl = toProxyDownloadUrl(selectedImagePath);
      if (!downloadUrl) return;

      const response = await fetch(downloadUrl, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });

      const blob = await response.blob();
      const fileName = (selectedImagePath || 'logo').split('/').pop() || `logo-${Date.now()}.png`;

      const file = new File([blob], fileName, { type: blob.type });

      await navigator.share({
        title: 'Wild Mind AI Generated Logo',
        text: `Check out this AI-generated logo!\n${getUserPrompt(entry.prompt).substring(0, 100)}...`,
        files: [file]
      });

      console.log('Image shared successfully');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Share cancelled by user');
        return;
      }

      console.error('Share failed:', error);
      try {
        await navigator.clipboard.writeText(url);
        alert('Sharing not supported. Image URL copied to clipboard!');
      } catch (copyError) {
        console.error('Copy failed:', copyError);
        alert('Unable to share image. Please try downloading instead.');
      }
    }
  };

  const getUserPrompt = (rawPrompt: string | undefined) => {
    if (!rawPrompt) return '';

    // Handle the new backend prompt format
    // The backend prompt starts with "Create a professional, modern logo for: [USER_PROMPT]"
    const backendPromptMatch = rawPrompt.match(/Create a professional, modern logo for:\s*(.+?)\s*\./i);
    if (backendPromptMatch && backendPromptMatch[1]) {
      return backendPromptMatch[1].trim();
    }

    // Fallback to old format (remove "Logo:" prefix)
    return rawPrompt.replace(/^Logo:\s*/i, '').trim();
  };

  const copyPrompt = async (prompt: string, buttonId: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedButtonId(buttonId);
      setTimeout(() => {
        setCopiedButtonId(null);
      }, 2000); // Hide after 2 seconds
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(selectedImage.url, '_blank');
  };


  return (
  <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-2" onClick={onClose}>
      <div className="relative w-full max-w-6xl bg-white/95 dark:bg-black/40 ring-1 ring-black/10 dark:ring-white/20 rounded-2xl overflow-hidden shadow-2xl" style={{ height: '92vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/10 dark:bg-black/40 backdrop-blur-sm border-b border-black/10 dark:border-white/10">
          <div className="text-black/70 dark:text-white/70 text-sm">{entry.model}</div>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-full  text-black dark:text-white transition-colors" 
              onClick={handleDelete}
              aria-label="Delete image"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button aria-label="Close" className="text-black/70 dark:text-white/80 hover:text-black dark:hover:text-white text-lg" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="pt-20 h-[calc(92vh-52px)] md:flex md:flex-row md:gap-0">
          {/* Media */}
          <div className="relative bg-black/5 dark:bg-black/30 h-[40vh] md:h-full md:flex-1 group flex items-center justify-center">
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
              <div className="absolute top-3 left-3 bg-black/10 dark:bg-white/20 text-black dark:text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm border border-black/20 dark:border-white/30">User upload</div>
            )}
            <button
              aria-label="Fullscreen"
              title="Fullscreen"
              className="absolute top-3 left-3 p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={openFullscreen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M3 9V5a2 2 0 0 1 2-2h4" />
                <path d="M21 9V5a2 2 0 0 0-2-2h-4" />
                <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
                <path d="M3 15v4a2 2 0 0 0 2 2h4" />
              </svg>
            </button>
          </div>

          {/* Sidebar */}
          <div className="px-4 md:p-5 text-black dark:text-white border-t md:border-t-0 md:border-l border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/30 h-[60vh] md:h-full md:w-[34%] overflow-y-none">
            {/* Action Buttons */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-black/20 dark:border-white/25 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-sm"
              >
                <Download className="h-4 w-4" />
                Download
              </button>

              <button
                onClick={() => shareImage(selectedImage?.url)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-black/20 dark:border-white/25 bg-black/10 dark:bg:white/10 hover:bg-black/20 dark:hover:bg-white/20 text-sm"
              >
                <Share className="h-4 w-4" />
                Share
              </button>
            </div>

            {/* Prompt */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-black/60 dark:text-white/60 text-xs uppercase tracking-wider mb-2">
                <span>Prompt</span>
                <button 
                  onClick={() => copyPrompt(getUserPrompt(entry.prompt), `preview-${entry.id}`)}
                  className={`flex items-center gap-2 px-2 py-1.5 text-black dark:text-white text-xs rounded-lg transition-colors ${
                    copiedButtonId === `preview-${entry.id}` 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20'
                  }`}
                >
                  {copiedButtonId === `preview-${entry.id}` ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </>
                  )}
                </button>
              </div>
              <div className="text-black dark:text-white/90 text-xs leading-relaxed whitespace-pre-wrap break-words borde">
                {getUserPrompt(entry.prompt)}
              </div>
            </div>

            {/* Date */}
            <div className="mb-4">
              <div className="text-black/60 dark:text-white/60 text-xs uppercase tracking-wider mb-1">Date</div>
              <div className="text-black dark:text-white text-sm">{new Date(entry.timestamp).toLocaleString()}</div>
            </div>

            {/* Details */}
            <div className="mb-4">
              <div className="text-black/60 dark:text-white/60 text-xs uppercase tracking-wider mb-2">Details</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-black/60 dark:text-white/60 text-sm">Model:</span>
                  <span className="text-black dark:text-white text-sm">{entry.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60 dark:text-white/60 text-sm">Format:</span>
                  <span className="text-black dark:text-white text-sm">Logo</span>
                </div>
              </div>
            </div>

            {/* Gallery */}
            {galleryImages.length > 1 && (
              <div className="mb-4">
                <div className="text-black/60 dark:text-white/60 text-xs uppercase tracking-wider mb-2">Logos ({galleryImages.length})</div>
                <div className="grid grid-cols-2 gap-2">
                  {galleryImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-md overflow-hidden border transition-all ${selectedImageIndex === index
                          ? 'border-black dark:border-white ring-2 ring-black/30 dark:ring-white/30'
                          : 'border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40'
                        }`}
                    >
                      <Image
                        src={(image as any)?.url}
                        alt={`Logo ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {index < inputImages.length && (
                        <div className="absolute top-1 left-1 bg-black/30 dark:bg-black/50 text-black dark:text-white text-[9px] px-1.5 py-0.5 rounded">User upload</div>
                      )}
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
        {isFsOpen && (
          <div className="fixed inset-0 z-[80] bg-white/95 dark:bg-black/95 backdrop-blur-sm flex items-center justify-center">
            <div className="absolute top-3 right-4 z-[90]">
              <button aria-label="Close fullscreen" onClick={closeFullscreen} className="px-3 py-2 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white text-sm ring-1 ring-black/20 dark:ring-white/30">✕</button>
            </div>
            <div
              ref={fsContainerRef}
              className="relative w-full h-full cursor-zoom-in"
              onWheel={fsOnWheel}
              onMouseDown={fsOnMouseDown}
              onMouseMove={fsOnMouseMove}
              onMouseUp={fsOnMouseUp}
              onMouseLeave={fsOnMouseUp}
              style={{ cursor: fsScale > fsFitScale ? (fsIsPanning ? 'grabbing' : 'grab') : 'zoom-in' }}
            >
              <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `translate3d(${fsOffset.x}px, ${fsOffset.y}px, 0) scale(${fsScale})`, transformOrigin: 'center center', transition: fsIsPanning ? 'none' : 'transform 0.15s ease-out' }}>
                <img
                  src={selectedImageObjectUrl || selectedImage?.url || selectedImageProxyUrl}
                  alt={entry.prompt}
                  onLoad={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    setFsNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                  }}
                  className="max-w-full max-h-full object-contain select-none"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoImagePreview;
