'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import InputBox from './TextToVideo/compo/InputBox';
import AnimateInputBox from './TextToVideo/compo/AnimateInputBox';

type VideoFeature = 'Video' | 'Lipsync' | 'Animate';

export default function VideoGenerationPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeFeature, setActiveFeature] = useState<VideoFeature>('Video');

    // Initialize from URL parameter
    useEffect(() => {
        const featureParam = searchParams?.get('feature');
        if (featureParam) {
            const normalized = featureParam.toLowerCase();
            if (normalized === 'lipsync') {
                setActiveFeature('Lipsync');
            } else if (normalized === 'animation' || normalized === 'animate') {
                setActiveFeature('Animate');
            }
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-[#07070B]">
            {/* Root layout renders Nav + SidePanel; add spacing here so content aligns */}
            <div className="flex">
                <div className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 lg:px-12 -mt-16">
                    {/* Sticky header + filters (pinned under navbar) */}
                    <div className="sticky top-0 z-20 bg-[#07070B]">
                        <div className="mb-2 md:mb-3 pt-10">
                            <h3 className="text-white text-xl sm:text-4xl md:text-5xl lg:text-4xl font-semibold mb-0 sm:mb-3">
                                Video Generation
                            </h3>
                            <p className="text-white/80 text-xs sm:text-lg md:text-xl">
                                Transform your ideas into stunning videos using advanced AI models
                            </p>
                        </div>

                        {/* Feature Filter Bar */}
                        <div className="mb-4">
                            <div className="flex items-center md:gap-3 gap-2 overflow-x-auto md:pb-2 pb-1 scrollbar-none">
                                {(['Video', 'Lipsync', 'Animate'] as VideoFeature[]).map((feature) => (
                                    <button
                                        key={feature}
                                        onClick={() => {
                                            setActiveFeature(feature);
                                            // Update URL with feature parameter
                                            const params = new URLSearchParams(window.location.search);
                                            if (feature === 'Video') {
                                                params.delete('feature');
                                            } else if (feature === 'Lipsync') {
                                                params.set('feature', 'lipsync');
                                            } else if (feature === 'Animate') {
                                                params.set('feature', 'animation');
                                            }
                                            const queryString = params.toString();
                                            router.push(`/text-to-video${queryString ? '?' + queryString : ''}`, { scroll: false });
                                        }}
                                        className={`inline-flex items-center md:gap-2 gap-1 md:px-4 px-2 md:py-1.5 py-1 rounded-lg md:text-sm text-xs font-medium transition-all border ${activeFeature === feature
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
                        {activeFeature === 'Animate' ? (
                            <AnimateInputBox
                                placeholder="Type your video prompt..."
                            />
                        ) : (
                            <InputBox
                                placeholder={activeFeature === 'Lipsync' ? "What should the character say?" : "Type your video prompt..."}
                                activeFeature={activeFeature}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

