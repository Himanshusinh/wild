'use client';

import React from 'react';
import Image from 'next/image';
import { Share, Trash2 } from 'lucide-react';
// Redirect to Edit Image page rather than opening inline popups
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { HistoryEntry } from '@/types/history';
import axiosInstance from '@/lib/axiosInstance';
import { removeHistoryEntry } from '@/store/slices/historySlice';

interface ImagePreviewModalProps {
  preview: { entry: HistoryEntry; image: { id?: string; url: string } } | null;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ preview, onClose }) => {
  const dispatch = useAppDispatch();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  const toProxyPath = React.useCallback((urlOrPath: string | undefined) => {
    if (!urlOrPath) return '';
    const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
    if (urlOrPath.startsWith(ZATA_PREFIX)) {
      return urlOrPath.substring(ZATA_PREFIX.length);
    }
    return urlOrPath;
  }, []);

  const toProxyResourceUrl = React.useCallback((urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `${API_BASE}/api/proxy/resource/${encodeURIComponent(path)}?ngrok-skip-browser-warning=true` : '';
  }, [API_BASE, toProxyPath]);
  
  // Move all hooks to the top before any conditional returns
  const [isPromptExpanded, setIsPromptExpanded] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
  const [objectUrl, setObjectUrl] = React.useState<string>('');
  // Popups removed in favor of redirecting to Edit Image page
  const router = useRouter();

  // single dispatch instance
  // Fullscreen viewer state
  const [isFsOpen, setIsFsOpen] = React.useState(false);
  const [fsScale, setFsScale] = React.useState(1);
  const [fsFitScale, setFsFitScale] = React.useState(1);
  const [fsOffset, setFsOffset] = React.useState({ x: 0, y: 0 });
  const [fsIsPanning, setFsIsPanning] = React.useState(false);
  const [fsLastPoint, setFsLastPoint] = React.useState({ x: 0, y: 0 });
  const [fsNaturalSize, setFsNaturalSize] = React.useState({ width: 0, height: 0 });
  const fsContainerRef = React.useRef<HTMLDivElement>(null);
  
  // -------- Fullscreen helpers (declared before any early returns) ---------
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

  const openFullscreen = React.useCallback(() => {
    setIsFsOpen(true);
  }, []);

  const closeFullscreen = React.useCallback(() => {
    setIsFsOpen(false);
    setFsIsPanning(false);
  }, []);

  // Compute fit scale on open/resize
  React.useEffect(() => {
    if (!isFsOpen) return;
    const computeFit = () => {
      if (!fsContainerRef.current || !fsNaturalSize.width || !fsNaturalSize.height) return;
      const rect = fsContainerRef.current.getBoundingClientRect();
      const fit = Math.min(rect.width / fsNaturalSize.width, rect.height / fsNaturalSize.height) || 1;
      const base = Math.min(1, fit); // do not upscale by default
      setFsFitScale(base);
      setFsScale(base);
      setFsOffset({ x: 0, y: 0 });
    };
    computeFit();
    const onResize = () => computeFit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isFsOpen, fsNaturalSize]);

  // Lock background scroll while fullscreen is open
  React.useEffect(() => {
    if (!isFsOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isFsOpen]);

  const fsOnWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!fsContainerRef.current) return;
    const rect = fsContainerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const next = Math.max(0.5, Math.min(6, fsScale + delta));
    if (next !== fsScale) fsZoomToPoint({ x: mx, y: my }, next);
  }, [fsScale, fsZoomToPoint]);

  const fsOnMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setFsIsPanning(true);
    setFsLastPoint({ x: e.clientX, y: e.clientY });
  }, []);

  const fsOnMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!fsIsPanning) return;
    e.preventDefault();
    const dx = e.clientX - fsLastPoint.x;
    const dy = e.clientY - fsLastPoint.y;
    const clamped = fsClampOffset({ x: fsOffset.x + dx, y: fsOffset.y + dy }, fsScale);
    setFsOffset(clamped);
    setFsLastPoint({ x: e.clientX, y: e.clientY });
  }, [fsIsPanning, fsLastPoint, fsOffset, fsClampOffset, fsScale]);

  const fsOnMouseUp = React.useCallback(() => setFsIsPanning(false), []);
  
  // Build gallery with user uploads first, then generated outputs
  const inputImages = React.useMemo(() => ((preview as any)?.inputImages) || [], [preview]);
  const outputImages = React.useMemo(() => preview?.entry?.images || [], [preview]);
  const galleryImages = React.useMemo(() => [...inputImages, ...outputImages], [inputImages, outputImages]);

  // Select the clicked image as initial selection
  const initialIndex = React.useMemo(() => {
    if (!preview) return 0;
    const mUrl = (preview.image as any)?.url;
    const mPath = (preview.image as any)?.storagePath;
    const idx = galleryImages.findIndex((im: any) => (mUrl && im?.url === mUrl) || (mPath && im?.storagePath && im.storagePath === mPath));
    return idx >= 0 ? idx : 0;
  }, [galleryImages, preview]);

  React.useEffect(() => setSelectedIndex(initialIndex), [initialIndex]);

  // Lock background scroll while modal is open
  React.useEffect(() => {
    if (!preview) return;
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = (document.documentElement as HTMLElement).style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    (document.documentElement as HTMLElement).style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      (document.documentElement as HTMLElement).style.overscrollBehavior = prevOverscroll;
    };
  }, [preview]);

  React.useEffect(() => {
    if (!preview) return;
    
    let revoke: string | null = null;
    setObjectUrl('');
    const run = async () => {
      try {
        const selectedImage = galleryImages[selectedIndex] || preview.image;
        const url = toProxyResourceUrl(selectedImage?.url || preview.image.url);
        if (!url) return;
        const res = await fetch(url, {
          credentials: 'include',
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const obj = URL.createObjectURL(blob);
        revoke = obj;
        setObjectUrl(obj);
      } catch {}
    };
    run();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [selectedIndex, preview, galleryImages, toProxyResourceUrl]);

  if (!preview) return null;

  const toProxyDownloadUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `${API_BASE}/api/proxy/download/${encodeURIComponent(path)}` : '';
  };

  // removed earlier duplicate definition; using single helper below near navigation

  const extractStyleFromPrompt = (promptText: string): string | undefined => {
    const match = promptText.match(/\[\s*Style:\s*([^\]]+)\]/i);
    return match?.[1]?.trim();
  };

  const handleDelete = async () => {
    try {
      if (!window.confirm('Delete this generation permanently? This cannot be undone.')) return;
      await axiosInstance.delete(`/api/generations/${preview.entry.id}`);
      try { dispatch(removeHistoryEntry(preview.entry.id)); } catch {}
      onClose();
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Failed to delete generation');
    }
  };


  const getCleanPrompt = (promptText: string): string => {
    return promptText.replace(/\[\s*Style:\s*[^\]]+\]/i, '').trim();
  };

  const downloadImage = async (url: string) => {
    try {
      const downloadUrl = toProxyDownloadUrl(url);
      if (!downloadUrl) return;
      const response = await fetch(downloadUrl, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
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

  const shareImage = async (url: string) => {
    try {
      // Check if the Web Share API is available
      if (!navigator.share) {
        // Fallback: Copy image URL to clipboard
        await copyToClipboard(url);
        alert('Image URL copied to clipboard!');
        return;
      }

      // Fetch the image as a blob
      const downloadUrl = toProxyDownloadUrl(url);
      if (!downloadUrl) return;
      
      const response = await fetch(downloadUrl, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      const blob = await response.blob();
      const fileName = (toProxyPath(url) || 'generated-image').split('/').pop() || 'generated-image.jpg';
      
      // Create a File from the blob
      const file = new File([blob], fileName, { type: blob.type });
      
      // Use Web Share API
      await navigator.share({
        title: 'Wild Mind AI Generated Image',
        text: `Check out this AI-generated image!\n${cleanPrompt.substring(0, 100)}...`,
        files: [file]
      });
      
      console.log('Image shared successfully');
    } catch (error: any) {
      // Handle user cancellation gracefully
      if (error.name === 'AbortError') {
        console.log('Share cancelled by user');
        return;
      }
      
      // Fallback to copying URL
      console.error('Share failed:', error);
      try {
        await copyToClipboard(url);
        alert('Sharing not supported. Image URL copied to clipboard!');
      } catch (copyError) {
        console.error('Copy failed:', copyError);
        alert('Unable to share image. Please try downloading instead.');
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const displayedStyle = preview.entry.style || extractStyleFromPrompt(preview.entry.prompt) || '—';
  const displayedAspect = preview.entry.frameSize || '—';
  const cleanPrompt = getCleanPrompt(preview.entry.prompt);
  const isLongPrompt = cleanPrompt.length > 280;

  const selectedImage: any = galleryImages[selectedIndex] || preview.image;
  const isUserUploadSelected = selectedIndex < inputImages.length;

  const toFrontendProxyResourceUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `/api/proxy/resource/${encodeURIComponent(path)}` : '';
  };

  const navigateToEdit = (feature: 'upscale' | 'remove-bg' | 'resize') => {
    try {
      const imgUrl = toFrontendProxyResourceUrl((selectedImage as any)?.storagePath) || selectedImage?.url || preview.image.url;
      const qs = new URLSearchParams();
      qs.set('feature', feature);
      if (imgUrl) qs.set('image', imgUrl);
      // Also pass raw storage path when available so the Edit page can reconstruct a public URL for external services
      const storagePath = (selectedImage as any)?.storagePath || (() => {
        const original = selectedImage?.url || '';
        const pathCandidate = toProxyPath(original);
        return pathCandidate && pathCandidate !== original ? pathCandidate : '';
      })();
      if (storagePath) qs.set('sp', storagePath);
      router.push(`/edit-image?${qs.toString()}`);
      onClose();
    } catch {}
  };


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-2 md:py-0">
      <div className="relative md:h-[92vh] h-full md:w-full md:max-w-6xl w-[90%] max-w-[90%] bg-black/40 ring-1 ring-white/20 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
          <div className="text-white/70 text-sm">{preview.entry.model}</div>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-full  text-white transition-colors" 
              onClick={handleDelete}
              aria-label="Delete image"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button aria-label="Close" className="text-white/80 hover:text-white text-lg" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="pt-20 h-[calc(92vh-52px)] md:flex md:flex-row md:gap-0">
          {/* Media */}
          <div className="relative bg-black/30 h-[40vh] md:h-full md:flex-1 group flex items-center justify-center">
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
          <div className="p-4 md:p-5 text-white border-t md:border-t-0 md:border-l border-white/10 bg-black/30 h-[52vh] md:h-full md:w-[34%] overflow-y-auto">
            {/* Action Buttons */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => downloadImage(selectedImage?.url || preview.image.url)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-sm"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 3v12" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M5 19h14" />
                </svg>
                Download
              </button>
              
              <button
                onClick={() => shareImage(selectedImage?.url || preview.image.url)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-sm"
              >
                <Share className="h-4 w-4" />
                Share
              </button>
            </div>

            {/* Prompt */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-white/60 text-xs uppercase tracking-wider mb-2">
                <span>Prompt</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(cleanPrompt);
                  }}
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
                {cleanPrompt}
              </div>
            </div>
            
            {/* Date */}
            <div className="mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Date</div>
              <div className="text-white text-sm">{new Date(preview.entry.timestamp).toLocaleString()}</div>
            </div>
            {/* Details */}
            <div className="mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Details</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Model:</span>
                  <span className="text-white text-sm">{preview.entry.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Style:</span>
                  <span className="text-white text-sm">{displayedStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Aspect ratio:</span>
                  <span className="text-white text-sm">{displayedAspect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Format:</span>
                  <span className="text-white text-sm">Image</span>
                </div>
              </div>
            </div>
            {/* Gallery */}
            {galleryImages.length > 1 && (
              <div className="mb-4">
                <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Images ({galleryImages.length})</div>
                <div className="grid grid-cols-3 gap-2">
                  {galleryImages.map((im, idx) => (
                    <button
                      key={im.id || idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`relative aspect-square rounded-md overflow-hidden border ${selectedIndex === idx ? 'border-white ring-2 ring-white/30' : 'border-white/20 hover:border-white/40'}`}
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

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => navigateToEdit('upscale')}
                  className="flex-1 px-3 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-sm  text-white text-sm ring-1 ring-white/20 transition"
                >
                  Upscale
                </button>
                <button
                  onClick={() => navigateToEdit('remove-bg')}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm ring-1 ring-white/20 transition"
                >
                  Remove background
                </button>
                
              </div>

              <div className="flex gap-2">
              <button
                  onClick={() => navigateToEdit('resize')}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm ring-1 ring-white/20 transition"
                >
                  Resize
                </button>
              <button
                onClick={() => {
                  try {
                    const imgUrl = objectUrl || selectedImage?.url || preview.image.url;
                    const qs = new URLSearchParams();
                    qs.set('prompt', cleanPrompt);
                    if (imgUrl) qs.set('image', imgUrl);
                    // Hard navigate to ensure route stack switches correctly
                    window.location.href = `/text-to-image?${qs.toString()}`;
                    onClose();
                  } catch {}
                }}
                className="flex-1 px-3 py-2 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white rounded-lg transition-colors text-sm font-medium shadow-[0_4px_16px_rgba(47,107,255,.45)]"
              >
                Remix in editor
              </button>
              </div>
              
            </div>
          </div>
        </div>
      </div>
      {/* Fullscreen viewer overlay */}
      {isFsOpen && (
        <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex items-center justify-center">
          <div className="absolute top-3 right-4 z-[90]">
            <button aria-label="Close fullscreen" onClick={closeFullscreen} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm ring-1 ring-white/30">
              ✕
            </button>
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
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate3d(${fsOffset.x}px, ${fsOffset.y}px, 0) scale(${fsScale})`,
                transformOrigin: 'center center',
                transition: fsIsPanning ? 'none' : 'transform 0.15s ease-out'
              }}
            >
              <img
                src={objectUrl || selectedImage?.url || preview.image.url}
                alt={preview.entry.prompt}
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
  );
};

export default ImagePreviewModal;


