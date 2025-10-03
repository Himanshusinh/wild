'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Download, ExternalLink, Copy, Check, Share } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const dispatch = useAppDispatch();

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
    window.open(selectedImage.url, '_blank');
  };

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-2" onClick={onClose}>
      <div className="relative w-full max-w-6xl bg-black/40 ring-1 ring-white/20 rounded-2xl overflow-hidden shadow-2xl" style={{ height: '92vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
          <div className="text-white/70 text-sm">{entry.model}</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-sm" onClick={handleDelete}>Delete</button>
            <button aria-label="Close" className="text-white/80 hover:text-white text-lg" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="pt-[52px] h-[calc(92vh-52px)] md:flex md:flex-row md:gap-0">
          {/* Media */}
          <div className="relative bg-black/30 h-[40vh] md:h-full md:flex-1 group flex items-center justify-center">
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

          {/* Sidebar */}
          <div className="px-4 md:p-5 text-white border-t md:border-t-0 md:border-l border-white/10 bg-black/30 h-[60vh] md:h-full md:w-[34%] overflow-y-none">
            {/* Action Buttons */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-sm"
              >
                <Download className="h-4 w-4" />
                Download
              </button>

              <button
                onClick={() => shareImage(selectedImage?.url)}
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
              <div className="text-white/90 text-xs leading-relaxed whitespace-pre-wrap break-words borde">
                {getUserPrompt(entry.prompt)}
              </div>
            </div>

            {/* Date */}
            <div className="mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Date</div>
              <div className="text-white text-sm">{new Date(entry.timestamp).toLocaleString()}</div>
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
                  <span className="text-white text-sm">Logo</span>
                </div>
              </div>
            </div>

            {/* Gallery */}
            {galleryImages.length > 1 && (
              <div className="mb-4">
                <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Logos ({galleryImages.length})</div>
                <div className="grid grid-cols-2 gap-2">
                  {galleryImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-md overflow-hidden border transition-all ${selectedImageIndex === index
                          ? 'border-white ring-2 ring-white/30'
                          : 'border-white/20 hover:border-white/40'
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

export default LogoImagePreview;
