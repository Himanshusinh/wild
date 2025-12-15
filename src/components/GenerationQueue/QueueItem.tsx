'use client';

import React, { useState } from 'react';
import { QueueItem as QueueItemType } from '@/store/slices/queueSlice';
import { cancelQueueItem } from '@/services/generationQueue';
import Image from 'next/image';

interface QueueItemProps {
  item: QueueItemType;
  isProcessing: boolean;
}

export default function QueueItem({ item, isProcessing }: QueueItemProps) {
  const [imageError, setImageError] = useState<Set<string>>(new Set());
  
  // Extract images from result
  const getImages = (): Array<{ url: string; originalUrl?: string; thumbnailUrl?: string }> => {
    if (!item.result) return [];
    
    // Handle different result formats
    if (item.result.images && Array.isArray(item.result.images)) {
      return item.result.images.map((img: any) => ({
        url: img.url || img.originalUrl || img.thumbnailUrl || '',
        originalUrl: img.originalUrl || img.url,
        thumbnailUrl: img.thumbnailUrl || img.url,
      })).filter((img: any) => img.url);
    }
    
    // Fallback: single image URL
    if (item.result.url) {
      return [{ url: item.result.url, originalUrl: item.result.url }];
    }
    
    return [];
  };

  const images = getImages();
  const hasImages = images.length > 0;
  const getStatusColor = () => {
    switch (item.status) {
      case 'queued':
        return 'from-blue-600/20 to-purple-600/20';
      case 'processing':
        return 'from-blue-600/40 to-purple-600/40';
      case 'completed':
        return 'from-green-600/20 to-emerald-600/20';
      case 'failed':
        return 'from-red-600/20 to-rose-600/20';
      case 'cancelled':
        return 'from-gray-600/20 to-slate-600/20';
      default:
        return 'from-blue-600/20 to-purple-600/20';
    }
  };

  const getStatusIcon = () => {
    switch (item.status) {
      case 'queued':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getGenerationTypeLabel = () => {
    const type = item.generationType || '';
    const labels: Record<string, string> = {
      'text-to-image': 'Image',
      'text-to-video': 'Video',
      'text-to-music': 'Music',
      'text-to-speech': 'Speech',
      'image-to-image': 'Image Edit',
      'image-to-video': 'Video',
      'logo': 'Logo',
      'sticker-generation': 'Sticker',
    };
    return labels[type] || type;
  };

  const handleCancel = async () => {
    if (item.status === 'queued' || item.status === 'processing') {
      await cancelQueueItem(item.id);
    }
  };

  const canCancel = item.status === 'queued' || item.status === 'processing';

  return (
    <div
      className={`
        relative group
        bg-gradient-to-r ${getStatusColor()}
        border border-white/10
        rounded-xl p-3
        transition-all duration-300
        ${isProcessing ? 'ring-2 ring-blue-500/50' : ''}
        hover:border-white/20 hover:shadow-lg
        overflow-hidden
      `}
    >
      {/* Animated background gradient on processing */}
      {item.status === 'processing' && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 animate-[shimmer_2s_infinite] bg-[length:200%_100%]" />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${
              item.status === 'processing' ? 'text-blue-400' :
              item.status === 'completed' ? 'text-green-400' :
              item.status === 'failed' ? 'text-red-400' :
              'text-white/70'
            }`}>
              {getStatusIcon()}
              <span className="capitalize">{item.status}</span>
            </div>
            {item.queuePosition > 0 && item.status === 'queued' && (
              <span className="text-xs text-white/40">#{item.queuePosition}</span>
            )}
          </div>

          {/* Generation info */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-white truncate">
              {getGenerationTypeLabel()}
            </p>
            {item.metadata?.prompt && (
              <p className="text-xs text-white/60 line-clamp-1 truncate">
                {item.metadata.prompt}
              </p>
            )}
            {item.metadata?.model && (
              <p className="text-xs text-white/40">
                {item.metadata.model}
              </p>
            )}
          </div>

          {/* Image Preview - Show loading skeleton when processing, images when completed */}
          {item.status === 'processing' && (
            <div className="mt-3">
              <p className="text-xs text-white/50 mb-2">Generating {item.metadata?.imageCount || 1} image(s)...</p>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: item.metadata?.imageCount || 1 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-lg bg-white/5 border border-white/10 overflow-hidden"
                  >
                    {/* Animated loading skeleton with gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-blue-600/30">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                    </div>
                    {/* Spinning loader */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        </div>
                      </div>
                    </div>
                    {/* Pulsing border */}
                    <div className="absolute inset-0 rounded-lg border-2 border-blue-400/30 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Images */}
          {item.status === 'completed' && hasImages && (
            <div className="mt-3">
              <p className="text-xs text-green-400/70 mb-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {images.length} image(s) generated
              </p>
              <div className="grid grid-cols-2 gap-2">
                {images.slice(0, 4).map((img, idx) => {
                  const imageUrl = img.thumbnailUrl || img.url || img.originalUrl || '';
                  return (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden border border-green-500/30 bg-white/5 group/image cursor-pointer"
                    >
                      {imageUrl && !imageError.has(imageUrl) ? (
                        <>
                          <Image
                            src={imageUrl}
                            alt={`Generated image ${idx + 1}`}
                            fill
                            className="object-cover transition-all duration-300 group-hover/image:scale-110"
                            unoptimized
                            onError={() => {
                              setImageError(prev => new Set([...prev, imageUrl]));
                            }}
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white/0 group-hover/image:text-white/80 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                          <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Click to view full image */}
                      <a
                        href={img.originalUrl || img.url || imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 z-10"
                        title="Click to view full image"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  );
                })}
                {images.length > 4 && (
                  <div className="relative aspect-square rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group/more">
                    <span className="text-xs text-white/60 group-hover/more:text-white transition-colors">+{images.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Credits info */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-white/50">
              {item.creditsCost} credits
            </span>
            {item.creditsDeducted && (
              <span className="text-xs text-green-400/70">✓ Deducted</span>
            )}
          </div>

          {/* Error message */}
          {item.error && (
            <p className="text-xs text-red-400 mt-1 line-clamp-2">
              {item.error}
            </p>
          )}
        </div>

        {/* Cancel button */}
        {canCancel && (
          <button
            onClick={handleCancel}
            className="flex-shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 transition-all duration-200 group/cancel"
            title="Cancel"
          >
            <svg className="w-4 h-4 text-white/60 group-hover/cancel:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar for processing */}
      {item.status === 'processing' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-[progress_2s_ease-in-out_infinite] w-full" />
        </div>
      )}
    </div>
  );
}

