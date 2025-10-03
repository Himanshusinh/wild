'use client';

import React from 'react';
import Image from 'next/image';
import { Share } from 'lucide-react';
import { HistoryEntry } from '@/types/history';
import { useAppDispatch } from '@/store/hooks';
import axiosInstance from '@/lib/axiosInstance';
import { removeHistoryEntry } from '@/store/slices/historySlice';

interface ImagePreviewModalProps {
  preview: { entry: HistoryEntry; image: { id?: string; url: string } } | null;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ preview, onClose }) => {
  const dispatch = useAppDispatch();
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
    return path ? `${API_BASE}/api/proxy/resource/${encodeURIComponent(path)}?ngrok-skip-browser-warning=true` : '';
  };

  const toProxyDownloadUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `${API_BASE}/api/proxy/download/${encodeURIComponent(path)}` : '';
  };

  const toFrontendProxyResourceUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `/api/proxy/resource/${encodeURIComponent(path)}` : '';
  };

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
      try { if (revoke) URL.revokeObjectURL(revoke); } catch {}
    };
  }, [selectedImage?.url, preview?.image?.url]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-2" onClick={onClose}>
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
              onClick={() => window.open(toFrontendProxyResourceUrl((selectedImage as any)?.storagePath || selectedImage?.url || preview.image.url), '_blank')}
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

export default ImagePreviewModal;


