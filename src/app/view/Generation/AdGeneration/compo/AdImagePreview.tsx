"use client";
import React, { useState } from 'react';
import { HistoryEntry } from '@/types/history';

interface AdImagePreviewProps {
  entry: HistoryEntry;
  onClose: () => void;
}

const AdImagePreview: React.FC<AdImagePreviewProps> = ({ entry, onClose }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(entry.prompt);
    } catch (error) {
      console.error('Error copying prompt:', error);
    }
  };

  const handleOpenInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h3 className="text-lg font-semibold text-white">Video Ad Preview</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Preview */}
            <div className="lg:col-span-2">
              <div className="bg-black/20 rounded-lg overflow-hidden">
                {entry.images[selectedImageIndex] && (
                  <video
                    src={entry.images[selectedImageIndex].url}
                    controls
                    className="w-full h-auto"
                    poster={entry.images[selectedImageIndex].url}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-4">
              {/* Prompt */}
              <div>
                <h4 className="text-white font-medium mb-2">Prompt</h4>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/80 text-sm">{entry.prompt}</p>
                  <button
                    onClick={handleCopyPrompt}
                    className="mt-2 text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Prompt
                  </button>
                </div>
              </div>

              {/* Model & Settings */}
              <div>
                <h4 className="text-white font-medium mb-2">Details</h4>
                <div className="bg-white/5 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Model:</span>
                    <span className="text-white text-sm">{entry.model}</span>
                  </div>
                  {entry.frameSize && (
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Resolution:</span>
                      <span className="text-white text-sm">{entry.frameSize}</span>
                    </div>
                  )}
                  {entry.style && (
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Settings:</span>
                      <span className="text-white text-sm">{entry.style}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Generated:</span>
                    <span className="text-white text-sm">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <h4 className="text-white font-medium mb-2">Actions</h4>
                <div className="space-y-2">
                  {entry.images[selectedImageIndex] && (
                    <>
                      <button
                        onClick={() => handleDownload(
                          entry.images[selectedImageIndex].url,
                          `ad-${entry.id}-${selectedImageIndex}.mp4`
                        )}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors"
                      >
                        Download Video
                      </button>
                      <button
                        onClick={() => handleOpenInNewTab(entry.images[selectedImageIndex].url)}
                        className="w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg text-sm transition-colors"
                      >
                        Open in New Tab
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          {entry.images.length > 1 && (
            <div className="mt-6">
              <h4 className="text-white font-medium mb-3">Generated Videos</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {entry.images.map((image, index) => (
                  <div
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-blue-500'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <video
                      src={image.url}
                      className="w-full h-24 object-cover"
                      muted
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdImagePreview;
