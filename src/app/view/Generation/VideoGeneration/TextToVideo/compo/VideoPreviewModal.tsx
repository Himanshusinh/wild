'use client';

import React from 'react';
import { HistoryEntry } from '@/types/history';

interface VideoPreviewModalProps {
  preview: { entry: HistoryEntry; video: any } | null;
  onClose: () => void;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ preview, onClose }) => {
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
    return path ? `${API_BASE}/api/proxy/media/${encodeURIComponent(path)}` : '';
  };

  const toProxyDownloadUrl = (urlOrPath: any) => {
    const path = toProxyPath(urlOrPath);
    return path ? `${API_BASE}/api/proxy/download/${encodeURIComponent(path)}` : '';
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
          <div className="relative flex-1 min-h-[320px] md:min-h-[600px] bg-transparent group flex items-center justify-center">
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
              className="absolute top-3 left-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
          
          <div className="w-full md:w-[380px] p-5 md:p-6 bg-white/5 backdrop-blur-xl border-l border-white/10 text-white overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm opacity-80">Prompt</div>
              <button
                onClick={() => downloadVideo(videoUrl)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/20"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 3v12" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M5 19h14" />
                </svg>
                <span className="text-sm">
                  {videoUrl && videoUrl.startsWith('data:image/') ? 'Download Image' : 'Download Video'}
                </span>
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
              {/* <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                <span className="opacity-60">Style</span>
                <span className="opacity-90">{displayedStyle}</span>
              </div> */}
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

export default VideoPreviewModal;
