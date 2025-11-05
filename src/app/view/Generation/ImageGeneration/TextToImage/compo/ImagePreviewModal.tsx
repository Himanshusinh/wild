'use client';

import React from 'react';
import { HistoryEntry } from '@/types/history';

interface ImagePreviewModalProps {
  preview: { entry: HistoryEntry; image: { id?: string; url: string } } | null;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ preview, onClose }) => {
  const toProxyPath = React.useCallback((urlOrPath: string | undefined) => {
    if (!urlOrPath) return '';
    const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
    if (urlOrPath.startsWith(ZATA_PREFIX)) return urlOrPath.substring(ZATA_PREFIX.length);
    return urlOrPath;
  }, []);

  const toMediaProxyUrl = React.useCallback((urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `/api/proxy/media/${encodeURIComponent(path)}` : '';
  }, [toProxyPath]);

  if (!preview) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-70 flex items-center justify-center p-2 md:py-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    > 

    <button aria-label="Close" className="text-white/100 hover:text-white text-lg absolute top-8 right-10 " onClick={onClose}>✕</button>
      <div 
        className="relative  h-full  md:w-full md:max-w-6xl w-[90%] max-w-[90%] bg-transparent  border border-white/10 rounded-3xl overflow-hidden shadow-3xl"
        onClick={(e) => e.stopPropagation()}
      > 
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-transparent  ">
          <div className="text-white/70 text-sm"></div>
          <div className="flex items-center gap-2">
            {/* <button 
              className="p-2 rounded-full  text-white transition-colors" 
              onClick={handleDelete}
              aria-label="Delete image"
            >
              <Trash2 className="w-5 h-5" />
            </button> */}
          </div>
        </div>
        <div className="relative bg-transparent h-[60vh] md:h-[84vh] flex items-center justify-center">
          <img
            src={toMediaProxyUrl(preview.image.url) || preview.image.url}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="object-contain w-auto h-auto max-w-full max-h-full mx-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;


