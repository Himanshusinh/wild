'use client';

import React from 'react';
import VideoGenerationInputBox from './compo/VideoGenerationInputBox';

const TextToVideo: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#07070B] p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
            Video Generation
          </h1>
          <p className="text-xl text-black/80 dark:text-white/80 max-w-3xl mx-auto">
            Transform your ideas into stunning videos using advanced AI models. 
            Choose between Image-to-Video or Video-to-Video generation modes.
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Input Section */}
          <div className="flex-1">
            <VideoGenerationInputBox />
          </div>

          {/* Info Panel */}
          <div className="lg:w-80 space-y-6">
            {/* Features */}
            <div className="bg-black/5 dark:bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-black dark:text-white mb-4">Features</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-black/80 dark:text-white/80">Image-to-Video Generation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-black/80 dark:text-white/80">Video-to-Video Style Transfer</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-black/80 dark:text-white/80">Multiple AI Models</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-black/80 dark:text-white/80">Customizable Parameters</span>
                </div>
              </div>
            </div>

            {/* Models Info */}
            <div className="bg-black/5 dark:bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-black dark:text-white mb-4">Available Models</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-black dark:text-white font-medium mb-2">Image-to-Video</h4>
                  <div className="space-y-2 text-sm text-black/70 dark:text-white/70">
                    <div>• <strong>Gen-4 Turbo:</strong> High-quality, fast generation</div>
                    <div>• <strong>Gen-3a Turbo:</strong> Advanced features, "last" position support</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-black dark:text-white font-medium mb-2">Video-to-Video</h4>
                  <div className="space-y-2 text-sm text-black/70 dark:text-white/70">
                    <div>• <strong>Gen-4 Aleph:</strong> Style transfer and enhancement</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-black/5 dark:bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-black dark:text-white mb-4">Tips</h3>
              <div className="space-y-3 text-sm text-black/70 dark:text-white/70">
                <div>• Use descriptive prompts for better results</div>
                <div>• Experiment with different aspect ratios</div>
                <div>• Add reference images for style guidance</div>
                <div>• Use seeds for reproducible results</div>
                <div>• Keep videos under 16MB for upload</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToVideo;
