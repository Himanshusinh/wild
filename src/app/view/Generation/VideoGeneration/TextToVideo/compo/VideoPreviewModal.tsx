"use client";

import React, { useState } from "react";
import { X, Download, Copy, Play, Pause } from "lucide-react";
import { toast } from "react-hot-toast";

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  prompt: string;
  model: string;
  frameSize: string;
  style?: string;
  generatedTime: string;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  prompt,
  model,
  frameSize,
  style,
  generatedTime,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Video downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download video");
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy prompt:", error);
      toast.error("Failed to copy prompt");
    }
  };

  const getCleanPrompt = (prompt: string) => {
    // Remove common prefixes and clean up the prompt
    return prompt
      .replace(/^(generate|create|make|produce)\s+/i, "")
      .replace(/^(a|an)\s+/i, "")
      .trim();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-white/10 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 group"
        >
          <X className="w-5 h-5 text-white group-hover:text-red-400 transition-colors duration-200" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Video Player */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/20 mb-6">
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              controls
              autoPlay={false}
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            {/* Prompt */}
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-white/80 text-sm font-medium mb-2">Prompt</h3>
                  <p className="text-white text-base leading-relaxed">
                    {getCleanPrompt(prompt)}
                  </p>
                </div>
                <button
                  onClick={handleCopyPrompt}
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 group"
                  title="Copy prompt"
                >
                  <Copy className="w-4 h-4 text-white/60 group-hover:text-white transition-colors duration-200" />
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-white/60 text-xs font-medium mb-1">Model</div>
                <div className="text-white text-sm font-medium">{model}</div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-white/60 text-xs font-medium mb-1">Aspect Ratio</div>
                <div className="text-white text-sm font-medium">{frameSize}</div>
              </div>
              
              {style && (
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-white/60 text-xs font-medium mb-1">Style</div>
                  <div className="text-white text-sm font-medium">{style}</div>
                </div>
              )}
              
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-white/60 text-xs font-medium mb-1">Generated</div>
                <div className="text-white text-sm font-medium">{formatTime(generatedTime)}</div>
              </div>
            </div>

            {/* Download Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleDownload}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-white font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download Video
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewModal;
