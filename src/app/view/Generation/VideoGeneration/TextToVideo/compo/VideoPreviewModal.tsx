'use client';

import React from 'react';
import { Share } from 'lucide-react';
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
  if (!preview) return null;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

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

  const [objectVideoUrl, setObjectVideoUrl] = React.useState<string>('');
  React.useEffect(() => {
    let revokeUrl: string | null = null;
    setObjectVideoUrl('');
    const path = toProxyPath(videoPath);
    if (!path) return;
    const controller = new AbortController();
    const run = async () => {
      try {
        const url = toProxyResourceUrl(path);
        if (!url) return;
        const res = await fetch(url, { credentials: 'include', signal: controller.signal });
        if (!res.ok) return;
        const blob = await res.blob();
        const obj = URL.createObjectURL(blob);
        revokeUrl = obj;
        setObjectVideoUrl(obj);
      } catch {}
    };
    run();
    return () => {
      try { if (revokeUrl) URL.revokeObjectURL(revokeUrl); } catch {}
      controller.abort();
    };
  }, [videoPath]);

  console.log('Extracted video URL:', videoUrl);
  console.log('Original video object:', preview.video);

  const cleanPrompt = getCleanPrompt(preview.entry.prompt);
  const [isPromptExpanded, setIsPromptExpanded] = React.useState(false);
  const isLongPrompt = cleanPrompt.length > 280;

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-6xl bg-black/40 ring-1 ring-white/20 rounded-2xl overflow-hidden shadow-2xl" style={{ height: '92vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
          <div className="text-white/70 text-sm">{preview.entry.model}</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-sm" onClick={handleDelete}>Delete</button>
            <button aria-label="Close" className="text-white/80 hover:text-white text-lg" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="pt-[52px] h-[calc(92vh-52px)] md:flex md:flex-row md:gap-0">
          {/* Media */}
          <div className="relative bg-black/30 h-[40vh] md:h-full md:flex-1 group flex items-center justify-center">
            {videoUrl && videoUrl.length > 0 ? (
              videoUrl.startsWith('data:image/') ? (
                <img 
                  src={videoUrl} 
                  alt={preview.entry.prompt}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (objectVideoUrl || videoUrl).startsWith('data:video/') || (objectVideoUrl || videoUrl).startsWith('blob:') || (objectVideoUrl || videoUrl).startsWith('http') ? (
                <video 
                  key={objectVideoUrl || videoUrl}
                  src={objectVideoUrl || videoUrl} 
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
              className="absolute top-3 left-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={() => {
                if (rawVideoUrl && typeof rawVideoUrl === 'string') {
                  const target = (preview.video as any)?.storagePath || rawVideoUrl;
                  window.open(toFrontendProxyResourceUrl(target), '_blank');
                }
              }}
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
                onClick={() => downloadVideo(videoUrl)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-sm"
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
                  <span className="text-white/60 text-sm">Duration:</span>
                  <span className="text-white text-sm">{(preview.entry as any).duration || '—'}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Format:</span>
                  <span className="text-white text-sm">Video</span>
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
    </div>
  );
};

export default VideoPreviewModal;
