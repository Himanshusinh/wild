 'use client';

import React from 'react';
import { Share, Trash2 } from 'lucide-react';
import { HistoryEntry } from '@/types/history';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import axiosInstance from '@/lib/axiosInstance';
import { removeHistoryEntry, updateHistoryEntry } from '@/store/slices/historySlice';
import { downloadFileWithNaming, getFileType, getExtensionFromUrl } from '@/utils/downloadUtils';
import { getModelDisplayName } from '@/utils/modelDisplayNames';

interface VideoPreviewModalProps {
  preview: { entry: HistoryEntry; video: any } | null;
  onClose: () => void;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ preview, onClose }) => {
  // Early return BEFORE any hooks to keep hook order stable across renders
  if (!preview) return null;

  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.auth?.user);
  // Fullscreen overlay state
  const [isFsOpen, setIsFsOpen] = React.useState(false);
  const [fsScale, setFsScale] = React.useState(1);
  const [fsFitScale, setFsFitScale] = React.useState(1);
  const [fsOffset, setFsOffset] = React.useState({ x: 0, y: 0 });
  const [fsIsPanning, setFsIsPanning] = React.useState(false);
  const [fsLastPoint, setFsLastPoint] = React.useState({ x: 0, y: 0 });
  const [fsNaturalSize, setFsNaturalSize] = React.useState({ width: 0, height: 0 });
  const fsContainerRef = React.useRef<HTMLDivElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';

  const toProxyPath = (urlOrPath: any): string => {
    if (!urlOrPath) return '';
    if (typeof urlOrPath !== 'string') return '';
    const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
    if (urlOrPath.startsWith(ZATA_PREFIX)) return urlOrPath.substring(ZATA_PREFIX.length);
    // If it's already a storagePath-like value, return as-is
    if (/^users\//.test(urlOrPath)) return urlOrPath;
    // Otherwise, external URL – do not proxy
    return '';
  };

  const toProxyResourceUrl = (urlOrPath: any) => {
    const path = toProxyPath(urlOrPath);
    // Use frontend-origin proxy route to avoid CORS (Zata only)
    return path ? `/api/proxy/media/${encodeURIComponent(path)}` : '';
  };

  const toProxyDownloadUrl = (urlOrPath: any) => {
    const path = toProxyPath(urlOrPath);
    // Use frontend-origin proxy route to avoid CORS (Zata only)
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

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
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
      // Try to detect video format from the video element or URL
      let videoExtension = 'mp4'; // Default to mp4
      
      // Check if we can get more info from the video element
      const videoElement = document.querySelector('video');
      if (videoElement && videoElement.src) {
        // Try to detect from video element's source
        if (videoElement.src.includes('webm')) videoExtension = 'webm';
        else if (videoElement.src.includes('mov')) videoExtension = 'mov';
        else if (videoElement.src.includes('avi')) videoExtension = 'avi';
        else if (videoElement.src.includes('mp4')) videoExtension = 'mp4';
      }
      
      // Check URL patterns
      if (url.includes('webm')) videoExtension = 'webm';
      else if (url.includes('mov')) videoExtension = 'mov';
      else if (url.includes('avi')) videoExtension = 'avi';
      else if (url.includes('mp4')) videoExtension = 'mp4';
      
      console.log('[VideoPreviewModal] Detected video extension:', videoExtension);
      
      // Create a custom URL with the detected extension for better detection
      const urlWithExtension = url.includes('.') ? url : `${url}.${videoExtension}`;
      
      // Get username from user state or fallback to 'user'
      const username = user?.username || user?.displayName || null;
      await downloadFileWithNaming(urlWithExtension, username, 'video');
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

  const toggleVisibility = async () => {
    try {
      const next = !isPublicFlag;
      setIsPublicFlag(next);
      try {
        if (preview.entry?.id) {
          const target = preview.video as any;
          const payload: any = target ? { video: { id: target?.id, url: target?.url || target?.firebaseUrl, storagePath: target?.storagePath, isPublic: next } } : { isPublic: next };
          await axiosInstance.patch(`/api/generations/${preview.entry.id}`, payload);
          try {
            const videos = Array.isArray((preview.entry as any).videos) ? (preview.entry as any).videos.map((vd: any) => {
              if ((target?.id && vd.id === target.id) || (target?.url && vd.url === target.url) || (target?.storagePath && vd.storagePath === target.storagePath)) {
                return { ...vd, isPublic: next };
              }
              return vd;
            }) : (preview.entry as any).videos;
            dispatch(updateHistoryEntry({ id: preview.entry.id, updates: { videos } as any }));
          } catch {}
        }
      } catch {}
    } catch {}
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
  const proxied = toProxyResourceUrl(videoPath);
  const videoUrl = proxied || rawVideoUrl;

  // Stream directly from same-origin proxy for faster start and range support

  console.log('Extracted video URL:', videoUrl);
  console.log('Original video object:', preview.video);

  const cleanPrompt = getCleanPrompt(preview.entry.prompt);
  const [isPromptExpanded, setIsPromptExpanded] = React.useState(false);
  const [copiedButtonId, setCopiedButtonId] = React.useState<string | null>(null);
  const [isPublicFlag, setIsPublicFlag] = React.useState<boolean>(true);
  const [videoDuration, setVideoDuration] = React.useState<number | null>(null);
  const isLongPrompt = cleanPrompt.length > 280;
  
  // Update isPublicFlag based on selected video
  React.useEffect(() => {
    const isPublic = ((preview.video as any)?.isPublic !== false);
    setIsPublicFlag(isPublic);
  }, [preview.video]);

  // Reset video duration when preview changes
  React.useEffect(() => {
    setVideoDuration(null);
  }, [preview]);

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
    <div className="fixed inset-0 bg-black/90 md:bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-2 md:py-20" onClick={onClose}>
      <div className="relative h-full md:w-full md:max-w-6xl w-[90%] max-w-[90%] bg-transparent border border-white/10 rounded-3xl overflow-hidden shadow-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-transparent">
          <div className="text-white/70 text-sm"></div>
          <div className="flex items-center gap-2">
            <button aria-label="Close" className="text-white/80 hover:text-white text-lg" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="md:flex md:flex-row md:gap-0">
          {/* Media */}
          <div className="relative bg-transparent h-[35vh] md:h-[84vh] md:flex-1 group flex items-center justify-center">
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
                  autoPlay={true}
                  muted={false}
                  onError={(e) => console.error('Video error:', e)}
                  onLoadStart={() => console.log('Video loading started')}
                  onLoadedData={() => console.log('Video loaded successfully')}
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    if (video.duration && !isNaN(video.duration)) {
                      setVideoDuration(video.duration);
                      console.log('Video duration captured:', video.duration);
                    }
                  }}
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
              <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-lg">
                <div className="text-center text-white/60">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No video content available</p>
                </div>
              </div>
            )}
            {(((preview.entry as any)?.inputVideos || []) as any[]).some((v: any) => (v?.storagePath && v.storagePath === (preview.video as any)?.storagePath) || (v?.url && v.url === (preview.video as any)?.url)) && (
              <div className="absolute top-3 left-3 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/30">User upload</div>
            )}
            
            <button
              aria-label="Fullscreen"
              title="Fullscreen"
              className="absolute top-3 left-3 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-opacity"
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
          <div className="relative md:p-5 text-white white/10 bg-transparent h-[calc(100vh-35vh-60px)] md:h-[84vh] md:w-[34%] mt-4 md:mt-10 flex flex-col">
            {/* Action Buttons - Fixed on mobile */}
            <div className="md:mb-4 sticky md:relative top-0 md:top-auto left-0 right-0 md:left-auto md:right-auto z-40 md:z-auto p-4 md:p-0 bg-transparent md:bg-transparent backdrop-blur-0 md:backdrop-blur-0 border-b-0 md:border-b-0 md:mb-4 flex-shrink-0">
              <div className="flex gap-2">
              <div className="relative group flex-1">
                <button
                  onClick={() => downloadVideo(videoUrl)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20"
                  aria-label="Download"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white">
                    <path d="M12 3v12" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M5 19h14" />
                  </svg>
                </button>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 backdrop-blur-3xl -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Download</div>
              </div>

              <div className="relative group flex-1">
                <button
                  onClick={() => shareVideo(videoUrl)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20"
                  aria-label="Share"
                >
                  <Share className="h-4 w-4 text-white" />
                </button>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Share</div>
              </div>

              <div className="relative group flex-1">
                <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20" aria-label="Delete video">
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Delete</div>
              </div>

              <div className="relative group flex-1">
                <button
                  onClick={toggleVisibility}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20"
                  aria-pressed={isPublicFlag}
                  aria-label="Toggle visibility"
                  title={isPublicFlag ? 'Public' : 'Private'}
                >
                  {isPublicFlag ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l18 18"/><path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88"/><path d="M16.1 16.1C14.84 16.7 13.46 17 12 17 7 17 2.73 13.89 1 9.5a14.78 14.78 0 0 1 5.06-5.56"/></svg>
                  )}
                </button>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">{isPublicFlag ? 'Public' : 'Private'}</div>
              </div>
            </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 md:p-0 flex-1 overflow-y-auto custom-scrollbar">
            {/* Prompt */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-white/60 text-xs uppercase tracking-wider mb-2">
                <span>Prompt</span>
                <button 
                  onClick={() => copyPrompt(cleanPrompt, `preview-${preview.entry.id}`)}
                  className={`flex items-center gap-2 px-2 py-1.5 text-white text-xs rounded-lg transition-colors ${
                    copiedButtonId === `preview-${preview.entry.id}` 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-white/10 hover:bg-white/20'
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
              <div className={`text-white/90 text-xs leading-relaxed whitespace-pre-wrap break-words ${!isPromptExpanded && isLongPrompt ? 'line-clamp-4' : ''}`}>
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
              <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Date</div>
              <div className="text-white text-sm">{new Date(preview.entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {(() => { const d = new Date(preview.entry.timestamp); const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); return `${dd}-${mm}-${yyyy}` })()}</div>
            </div>
            
            {/* Details */}
            <div className="mb-4">
              <div className="text-white/60 text-sm uppercase tracking-wider mb-0">Details</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Model:</span>
                  <span className="text-white/80 text-sm">{getModelDisplayName(preview.entry.model)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Style:</span>
                  <span className="text-white/80 text-sm">{displayedStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Aspect ratio:</span>
                  <span className="text-white/80 text-sm">{displayedAspect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Duration:</span>
                  <span className="text-white/80 text-sm">
                    {videoDuration !== null ? formatDuration(videoDuration) : ((preview.entry as any).duration ? `${(preview.entry as any).duration}s` : '—')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Format:</span>
                  <span className="text-white/80 text-sm">Video</span>
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
        {/* Fullscreen viewer overlay */}
        {isFsOpen && (
          <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-3 right-4 z-[90]">
              <button aria-label="Close fullscreen" onClick={closeFullscreen} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm ring-1 ring-white/30">✕</button>
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
                  autoPlay={true}
                  muted={false}
                  className="max-w-full max-h-full object-contain select-none"
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget as HTMLVideoElement;
                    setFsNaturalSize({ width: v.videoWidth || 1280, height: v.videoHeight || 720 });
                    if (v.duration && !isNaN(v.duration)) {
                      setVideoDuration(v.duration);
                      console.log('Fullscreen video duration captured:', v.duration);
                    }
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
    </div>
  );
};

export default VideoPreviewModal;
