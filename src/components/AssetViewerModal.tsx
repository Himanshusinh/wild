'use client';

import React from 'react';
import { X } from 'lucide-react';
import { toMediaProxy, toResourceProxy } from '@/lib/thumb';

interface AssetViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetUrl: string;
  assetType: 'image' | 'video' | 'audio';
  title?: string;
}

const AssetViewerModal: React.FC<AssetViewerModalProps> = ({
  isOpen,
  onClose,
  assetUrl,
  assetType,
  title = 'Uploaded Asset'
}) => {
  if (!isOpen || !assetUrl) return null;

  // Get proxy URL for the asset
  const getAssetUrl = () => {
    if (!assetUrl) return '';
    // Try resource proxy first (for storage paths)
    const resourceProxy = toResourceProxy(assetUrl);
    if (resourceProxy) return resourceProxy;
    // Try media proxy
    const mediaProxy = toMediaProxy(assetUrl);
    if (mediaProxy) return mediaProxy;
    // Return original URL if it's already a full URL
    if (assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
      return assetUrl;
    }
    return assetUrl;
  };

  const displayUrl = getAssetUrl();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-black/90 border border-white/20 rounded-2xl p-6 max-w-4xl max-h-[90vh] w-full mx-4 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Asset Display */}
        <div className="flex items-center justify-center min-h-[400px]">
          {assetType === 'image' && (
            <img
              src={displayUrl}
              alt={title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              onError={(e) => {
                console.error('Failed to load image:', displayUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          {assetType === 'video' && (
            <video
              src={displayUrl}
              controls
              className="max-w-full max-h-[70vh] rounded-lg"
              onError={(e) => {
                console.error('Failed to load video:', displayUrl);
              }}
            >
              Your browser does not support the video tag.
            </video>
          )}
          {assetType === 'audio' && (
            <div className="flex flex-col items-center gap-4 p-8">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-white/60"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              <audio
                src={displayUrl}
                controls
                className="w-full max-w-md"
                onError={(e) => {
                  console.error('Failed to load audio:', displayUrl);
                }}
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetViewerModal;

