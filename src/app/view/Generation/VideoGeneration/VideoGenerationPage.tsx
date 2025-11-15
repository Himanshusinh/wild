'use client';

import React, { useState } from 'react';
import InputBox from './TextToVideo/compo/InputBox';

type VideoFeature = 'Video' | 'Lipsync' | 'Animate' | 'UGC';

export default function VideoGenerationPage() {
    const [activeFeature, setActiveFeature] = useState<VideoFeature>('Video');

    return (
        <div className="min-h-screen bg-[#07070B]">
            {/* Root layout renders Nav + SidePanel; add spacing here so content aligns */}
            <div className="flex">
                <div className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 lg:px-12 -mt-16">
                    {/* Sticky header + filters (pinned under navbar) */}
                    <div className="sticky top-0 z-20 bg-[#07070B]">
                        <div className="mb-2 md:mb-3 pt-10">
                            <h3 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-semibold mb-2 sm:mb-3">
                                Video Generation
                            </h3>
                            <p className="text-white/80 text-base sm:text-lg md:text-xl">
                                Transform your ideas into stunning videos using advanced AI models
                            </p>
                        </div>

                        {/* Feature Filter Bar */}
                        <div className="mb-4">
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                                {(['Video', 'Lipsync', 'Animate', 'UGC'] as VideoFeature[]).map((feature) => (
                                    <button
                                        key={feature}
                                        onClick={() => setActiveFeature(feature)}
                                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all border ${activeFeature === feature
                                            ? 'bg-white border-white/5 text-black shadow-sm'
                                            : 'bg-gradient-to-b from-white/5 to-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        {feature}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Input Box Section - Show for all features, in scrollable area */}
                    <div className="mb-6">
                        <InputBox 
                            placeholder={activeFeature === 'Lipsync' ? "What should the character say?" : "Type your video prompt..."}
                            activeFeature={activeFeature}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

