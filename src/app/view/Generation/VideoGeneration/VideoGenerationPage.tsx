'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import InputBox from './TextToVideo/compo/InputBox';
import AnimateInputBox from './TextToVideo/compo/AnimateInputBox';
import VideoGenerationGuide from './TextToVideo/compo/VideoGenerationGuide';

type VideoFeature = 'Video' | 'Lipsync' | 'Animate';

export default function VideoGenerationPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeFeature, setActiveFeature] = useState<VideoFeature>('Video');
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    
    // Get history entries to check if we should show the info button
    const historyEntries = useAppSelector((state: any) => {
        const allEntries = state.history?.entries || [];
        const normalize = (t?: string) => t?.replace(/[_-]/g, '-').toLowerCase() || '';
        const filtered = allEntries.filter((entry: any) => {
            const normalizedType = normalize(entry.generationType);
            return ['text-to-video', 'image-to-video', 'video-to-video'].includes(normalizedType);
        });
        // Group by date to check if we have sorted dates
        const groupedByDate = filtered.reduce((groups: { [key: string]: any[] }, entry: any) => {
            const date = new Date(entry.timestamp).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(entry);
            return groups;
        }, {});
        const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
            new Date(b).getTime() - new Date(a).getTime()
        );
        return { entries: filtered, sortedDates };
    });

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
                            <div className="flex items-center gap-2">
                                <h3 className="text-white text-xl sm:text-4xl md:text-5xl lg:text-4xl font-semibold mb-0 sm:mb-3">
                                    Video Generation
                                </h3>
                                {/* Info button - only show when there are generations */}
                                {historyEntries.entries.length > 0 && historyEntries.sortedDates.length > 0 && (
                                    <button
                                        onClick={() => setIsGuideModalOpen(true)}
                                        className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors mt-1"
                                        aria-label="Show guide"
                                    >
                                        <span className="text-white text-sm font-semibold">i</span>
                                    </button>
                                )}
                            </div>
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

            {/* Guide Modal - shows when info button is clicked */}
            {isGuideModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop with blur */}
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-md"
                        onClick={() => setIsGuideModalOpen(false)}
                    />
                    {/* Modal Content */}
                    <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-transparent rounded-xl">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsGuideModalOpen(false)}
                            className="absolute md:top-4 -top-0 md:right-4 right-0 z-20 md:w-8 md:h-8 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            aria-label="Close guide"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        {/* Guide Content */}
                        <VideoGenerationGuide />
                    </div>
                </div>
            )}
        </div>
    );
}

