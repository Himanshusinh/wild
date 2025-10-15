'use client';

import React from 'react';
import { Share, Trash2 } from 'lucide-react';
import { HistoryEntry } from '@/types/history';
import { useAppDispatch } from '@/store/hooks';
import axiosInstance from '@/lib/axiosInstance';
import { removeHistoryEntry } from '@/store/slices/historySlice';

interface VideoPreviewModalProps {
  preview: { entry: HistoryEntry; video: any } | null;
  onClose: () => void;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ preview, onClose }) => {
  const dispatch = useAppDispatch();
  // Fullscreen overlay state
  const [isFsOpen, setIsFsOpen] = React.useState(false);
  const [fsScale, setFsScale] = React.useState(1);
  const [fsFitScale, setFsFitScale] = React.useState(1);
  const [fsOffset, setFsOffset] = React.useState({ x: 0, y: 0 });
  const [fsIsPanning, setFsIsPanning] = React.useState(false);
  const [fsLastPoint, setFsLastPoint] = React.useState({ x: 0, y: 0 });
  const [fsNaturalSize, setFsNaturalSize] = React.useState({ width: 0, height: 0 });
  const fsContainerRef = React.useRef<HTMLDivElement>(null);
  
  if (!preview) return null;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';

  const toProxyPath = (urlOrPath: any): string => {
    if (!urlOrPath) return '';
    if (typeof urlOrPath !== 'string') return '';
    const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
    if (urlOrPath.startsWith(ZATA_PREFIX)) {
      return urlOrPath.substring(ZATA_PREFIX.length);
    }
    // If it's already a storagePath-like value, return as-is
    if (/^users\//.test(urlOrPath)) return urlOrPath;
    return urlOrPath;
  };

  const toProxyResourceUrl = (urlOrPath: any) => {
    const path = toProxyPath(urlOrPath);
    // Use frontend-origin proxy route to avoid CORS
    return path ? `/api/proxy/media/${encodeURIComponent(path)}` : '';
  };

  const toProxyDownloadUrl = (urlOrPath: any) => {
    const path = toProxyPath(urlOrPath);
    // Use frontend-origin proxy route to avoid CORS
    return path ? `/api/proxy/download/${encodeURIComponent(path)}` : '';
  };

  const toFrontendProxyResourceUrl = (urlOrPath: any) => {
    if (!urlOrPath || typeof urlOrPath !== 'string') return '';
    const path = toProxyPath(urlOrPath);
    return path ? `/api/proxy/media/${encodeURIComponent(path)}` : '';
  };

  const extractStyleFromPrompt = (promptText: string): string | undefined => {
    const match = promptText.match(/\[\s*Style:\s*([^\]]+)\]/i);
    return match?.[1]?.trim();
  };

  const getCleanPrompt = (promptText: string): string => {
    return promptText.replace(/\[\s*Style:\s*[^\]]+\]/i, '').trim();
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

  const downloadVideo = async (url: any) => {
    if (typeof url !== 'string') {
      console.error('Invalid URL for download:', url);
      return;
    }
    
    try {
      const path = toProxyPath((preview.video as any)?.storagePath || url);
      const downloadUrl = toProxyDownloadUrl(path || url);
      if (!downloadUrl) return;
      const res = await fetch(downloadUrl, { credentials: 'include' });
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      const baseName = (path || 'video').split('/').pop() || `video-${Date.now()}.mp4`;
      a.download = /\.[a-zA-Z0-9]+$/.test(baseName) ? baseName : `video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const shareVideo = async (url: any) => {
    if (typeof url !== 'string') {
      console.error('Invalid URL for share:', url);
      return;
    }

    try {
      if (!navigator.share) {
        await navigator.clipboard.writeText(url);
        alert('Video URL copied to clipboard!');
        return;
      }

      const path = toProxyPath((preview.video as any)?.storagePath || url);
      const downloadUrl = toProxyDownloadUrl(path || url);
      if (!downloadUrl) return;
      
      const response = await fetch(downloadUrl, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      const blob = await response.blob();
      const baseName = (path || 'video').split('/').pop() || `video-${Date.now()}.mp4`;
      const fileName = /\.[a-zA-Z0-9]+$/.test(baseName) ? baseName : `video-${Date.now()}.mp4`;
      
      const file = new File([blob], fileName, { type: blob.type });
      
      await navigator.share({
        title: 'Wild Mind AI Generated Video',
        text: `Check out this AI-generated video!\n${getCleanPrompt(preview.entry.prompt).substring(0, 100)}...`,
        files: [file]
      });
      
      console.log('Video shared successfully');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Share cancelled by user');
        return;
      }
      
      console.error('Share failed:', error);
      try {
        await navigator.clipboard.writeText(url);
        alert('Sharing not supported. Video URL copied to clipboard!');
      } catch (copyError) {
        console.error('Copy failed:', copyError);
        alert('Unable to share video. Please try downloading instead.');
      }
    }
  };

  const displayedStyle = preview.entry.style || extractStyleFromPrompt(preview.entry.prompt) || '—';
  const displayedAspect = preview.entry.frameSize || '16:9';

  // Extract video URL and route through proxy for cross-origin safety
  let rawVideoUrl = '';
  if (preview.video) {
    if (typeof preview.video === 'string') {
      rawVideoUrl = preview.video;
    } else if (preview.video.url) {
      rawVideoUrl = preview.video.url;
    } else if (preview.video.firebaseUrl) {
      rawVideoUrl = preview.video.firebaseUrl;
    } else if (preview.video.originalUrl) {
      rawVideoUrl = preview.video.originalUrl;
    }
  }
  const inputVideos = ((preview.entry as any)?.inputVideos || []) as any[];
  const inputImages = ((preview.entry as any)?.inputImages || []) as any[];
  const videoPath = (preview.video as any)?.storagePath || rawVideoUrl;
  const videoUrl = toProxyResourceUrl(videoPath);

  // Stream directly from same-origin proxy for faster start and range support

  console.log('Extracted video URL:', videoUrl);
  console.log('Original video object:', preview.video);

  const cleanPrompt = getCleanPrompt(preview.entry.prompt);
  const [isPromptExpanded, setIsPromptExpanded] = React.useState(false);
  const [copiedButtonId, setCopiedButtonId] = React.useState<string | null>(null);
  const isLongPrompt = cleanPrompt.length > 280;

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

  const fsOnMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (fsContainerRef.current) {
      const rect = fsContainerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
      const atFit = fsScale <= fsFitScale + 0.001;
      if (e.button === 0) {
        if (atFit) {
          const next = Math.min(6, fsScale * 1.2);
          if (next !== fsScale) { fsZoomToPoint({ x: mx, y: my }, next); return; }
        } else { setFsIsPanning(true); setFsLastPoint({ x: e.clientX, y: e.clientY }); return; }
      }
      if (e.button === 1) { setFsIsPanning(true); setFsLastPoint({ x: e.clientX, y: e.clientY }); return; }
      if (e.button === 2) {
        const next = Math.max(0.5, fsScale / 1.2);
        if (next !== fsScale) { fsZoomToPoint({ x: mx, y: my }, next); return; }
      }
    }
    setFsIsPanning(true); setFsLastPoint({ x: e.clientX, y: e.clientY });
  }, [fsScale, fsFitScale, fsZoomToPoint]);
  const fsOnMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!fsIsPanning) return; e.preventDefault();
    const dx = e.clientX - fsLastPoint.x; const dy = e.clientY - fsLastPoint.y;
    const clamped = fsClampOffset({ x: fsOffset.x + dx, y: fsOffset.y + dy }, fsScale);
    setFsOffset(clamped); setFsLastPoint({ x: e.clientX, y: e.clientY });
  }, [fsIsPanning, fsLastPoint, fsOffset, fsClampOffset, fsScale]);
  const fsOnMouseUp = React.useCallback(() => setFsIsPanning(false), []);

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


  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-6xl bg-white/95 dark:bg-black/40 ring-1 ring-gray-200 dark:ring-white/20 rounded-2xl overflow-hidden shadow-2xl" style={{ height: '92vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gray-100/80 dark:bg-black/40 backdrop-blur-sm border-b border-gray-200 dark:border-white/10">
          <div className="text-gray-600 dark:text-white/70 text-sm">{preview.entry.model}</div>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-full text-gray-700 dark:text-white transition-colors" 
              onClick={handleDelete}
              aria-label="Delete video"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button aria-label="Close" className="text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white text-lg" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="pt-20 h-[calc(92vh-52px)] md:flex md:flex-row md:gap-0">
          {/* Media */}
          <div className="relative bg-gray-50 dark:bg-black/30 h-[40vh] md:h-full md:flex-1 group flex items-center justify-center">
            {videoUrl && videoUrl.length > 0 ? (
              videoUrl.startsWith('data:image/') ? (
                <img 
                  src={videoUrl} 
                  alt={preview.entry.prompt}
                  className="max-w-full max-h-full object-contain"
                />
              ) : videoUrl.startsWith('/api/proxy/media/') || videoUrl.startsWith('blob:') || videoUrl.startsWith('http') ? (
                <video 
                  key={videoUrl}
                  src={videoUrl} 
                  controls 
                  className="max-w-full max-h-full object-contain"
                  autoPlay={false}
                  muted
                  onError={(e) => console.error('Video error:', e)}
                  onLoadStart={() => console.log('Video loading started')}
                  onLoadedData={() => console.log('Video loaded successfully')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-lg">
                  <div className="text-center text-white/60">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Invalid video format</p>
                    <p className="text-xs mt-2 opacity-50">{videoUrl.substring(0, 50)}...</p>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-lg">
                <div className="text-center text-gray-600 dark:text-white/60">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No video content available</p>
                </div>
              </div>
            )}
            {(((preview.entry as any)?.inputVideos || []) as any[]).some((v: any) => (v?.storagePath && v.storagePath === (preview.video as any)?.storagePath) || (v?.url && v.url === (preview.video as any)?.url)) && (
              <div className="absolute top-3 left-3 bg-white/80 dark:bg-white/20 text-gray-900 dark:text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm border border-gray-300 dark:border-white/30">User upload</div>
            )}
            
            <button
              aria-label="Fullscreen"
              title="Fullscreen"
              className="absolute top-3 left-3 p-2 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
          <div className="p-4 md:p-5 text-gray-900 dark:text-white border-t md:border-t-0 md:border-l border-gray-200 dark:border-white/10 bg-white/90 dark:bg-black/30 h-[52vh] md:h-full md:w-[34%] overflow-y-auto">
            {/* Action Buttons */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => downloadVideo(videoUrl)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/25 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-sm"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 3v12" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M5 19h14" />
                </svg>
                {videoUrl && videoUrl.startsWith('data:image/') ? 'Download Image' : 'Download Video'}
              </button>
              
              <button
                onClick={() => shareVideo(videoUrl)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/25 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-sm"
              >
                <Share className="h-4 w-4" />
                Share
              </button>
            </div>

            {/* Prompt */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-gray-600 dark:text-white/60 text-xs uppercase tracking-wider mb-2">
                <span>Prompt</span>
                <button 
                  onClick={() => copyPrompt(cleanPrompt, `preview-${preview.entry.id}`)}
                  className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-colors ${
                    copiedButtonId === `preview-${preview.entry.id}` 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white'
                  }`}
                >
                  {copiedButtonId === `preview-${preview.entry.id}` ? (
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
              <div className="text-gray-900 dark:text-white/90 text-xs leading-relaxed whitespace-pre-wrap break-words">
                {cleanPrompt}
              </div>
              {isLongPrompt && (
                <button
                  onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                  className="mt-2 text-xs text-white/70 hover:text-white underline"
                >
                  Read {isPromptExpanded ? 'less' : 'more'}
                </button>
              )}
            </div>
            
            {/* Date */}
            <div className="mb-4">
              <div className="text-gray-600 dark:text-white/60 text-xs uppercase tracking-wider mb-1">Date</div>
              <div className="text-gray-900 dark:text-white text-sm">{new Date(preview.entry.timestamp).toLocaleString()}</div>
            </div>
            
            {/* Details */}
            <div className="mb-4">
              <div className="text-gray-600 dark:text-white/60 text-xs uppercase tracking-wider mb-2">Details</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-white/60 text-sm">Model:</span>
                  <span className="text-gray-900 dark:text-white text-sm">{preview.entry.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-white/60 text-sm">Style:</span>
                  <span className="text-gray-900 dark:text-white text-sm">{displayedStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-white/60 text-sm">Aspect ratio:</span>
                  <span className="text-gray-900 dark:text-white text-sm">{displayedAspect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-white/60 text-sm">Duration:</span>
                  <span className="text-gray-900 dark:text-white text-sm">{(preview.entry as any).duration || '—'}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-white/60 text-sm">Format:</span>
                  <span className="text-gray-900 dark:text-white text-sm">Video</span>
                </div>
              </div>
            </div>

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
      {isFsOpen && (
        <div className="fixed inset-0 z-[80] bg-white/95 dark:bg-black/95 backdrop-blur-sm flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="absolute top-3 right-4 z-[90]">
            <button aria-label="Close fullscreen" onClick={closeFullscreen} className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-900 dark:text-white text-sm ring-1 ring-gray-300 dark:ring-white/30">✕</button>
          </div>
          <div
            ref={fsContainerRef}
            className="relative w-full h-full cursor-zoom-in"
            onWheel={fsOnWheel}
            onMouseDown={fsOnMouseDown}
            onMouseMove={fsOnMouseMove}
            onMouseUp={fsOnMouseUp}
            onMouseLeave={fsOnMouseUp}
            onContextMenu={(e)=>{e.preventDefault();}}
            style={{ cursor: fsScale > fsFitScale ? (fsIsPanning ? 'grabbing' : 'grab') : 'zoom-in' }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: `translate3d(${fsOffset.x}px, ${fsOffset.y}px, 0) scale(${fsScale})`, transformOrigin: 'center center', transition: fsIsPanning ? 'none' : 'transform 0.15s ease-out' }}
            >
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                muted
                className="max-w-full max-h-full object-contain select-none"
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget as HTMLVideoElement;
                  setFsNaturalSize({ width: v.videoWidth || 1280, height: v.videoHeight || 720 });
                }}
              />
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs bg-white/10 px-3 py-1.5 rounded-md ring-1 ring-white/20">
            Left-click to zoom in, right-click to zoom out. When zoomed, drag to pan.
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreviewModal;
