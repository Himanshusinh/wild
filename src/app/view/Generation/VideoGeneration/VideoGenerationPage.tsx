'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import InputBox from './TextToVideo/compo/InputBox';
import AnimateInputBox from './TextToVideo/compo/AnimateInputBox';
import VideoGenerationGuide from './TextToVideo/compo/VideoGenerationGuide';
import HistoryControls from './TextToVideo/compo/HistoryControls';
import { usePathname } from 'next/navigation';
import EditVideoInterface from '../../EditVideo/compo/EditVideoInterface';

type VideoFeature = 'Video' | 'Lipsync' | 'Animate' | 'Edit';

export default function VideoGenerationPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [activeFeature, setActiveFeature] = useState<VideoFeature>('Video');
    const isInlineEditVideoPage = pathname?.startsWith('/text-to-video/edit-video');

    useEffect(() => {
        if (isInlineEditVideoPage) {
            setActiveFeature('Edit');
        }
    }, [isInlineEditVideoPage]);
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
                <div className="flex-1 min-w-0 px-2 sm:px-6 md:px-8">
                    {/* Sticky header + filters (pinned under navbar) */}
                    <div className="sticky top-0 z-20 bg-[#07070B]">
                        <div className="mb-0 md:mb-1 pt-8 md:pt-2">
                            <div className="flex items-center justify-between gap-4 mb-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white text-xl sm:text-2xl md:text-2xl  font-semibold">
                                        Video Generation
                                    </h3>
                                    {/* Info button - only show when there are generations */}
                                    {historyEntries.entries.length > 0 && historyEntries.sortedDates.length > 0 && (
                                        <button
                                            onClick={() => setIsGuideModalOpen(true)}
                                            className="relative group w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors -mt-1"
                                            aria-label="Show guide"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10.9199 10.4384C10.9199 9.84191 11.4034 9.3584 11.9999 9.3584C12.5963 9.3584 13.0798 9.84191 13.0798 10.4384C13.0798 10.804 12.8988 11.1275 12.6181 11.3241C12.3474 11.5136 12.0203 11.7667 11.757 12.0846C11.4909 12.406 11.2499 12.8431 11.2499 13.3846C11.2499 13.7988 11.5857 14.1346 11.9999 14.1346C12.4141 14.1346 12.7499 13.7988 12.7499 13.3846C12.7499 13.3096 12.7806 13.2004 12.9123 13.0413C13.047 12.8786 13.2441 12.7169 13.4784 12.5528C14.1428 12.0876 14.5798 11.3141 14.5798 10.4384C14.5798 9.01348 13.4247 7.8584 11.9999 7.8584C10.575 7.8584 9.41992 9.01348 9.41992 10.4384C9.41992 10.8526 9.75571 11.1884 10.1699 11.1884C10.5841 11.1884 10.9199 10.8526 10.9199 10.4384Z" fill="#ffffff" />
                                                <path d="M11.9991 14.6426C11.5849 14.6426 11.2491 14.9783 11.2491 15.3926C11.2491 15.8068 11.5849 16.1426 11.9991 16.1426C12.4134 16.1426 12.7499 15.8068 12.7499 15.3926C12.7499 14.9783 12.4134 14.6426 11.9991 14.6426Z" fill="#ffffff" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M12 4C7.58172 4 4 7.58172 4 12V20H12C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12C21.5 17.2467 17.2467 21.5 12 21.5H3.25C2.83579 21.5 2.5 21.1642 2.5 20.75V12Z" fill="#ffffff" />
                                            </svg>
                                            <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-50">
                                                How To Use
                                            </div>
                                        </button>
                                    )}
                                    {/* Desktop buttons: hidden on small screens */}
                                    <div className="hidden md:flex items-center md:gap-3 gap-2 overflow-x-auto scrollbar-none ml-2 md:ml-4">
                                        {(['Video', 'Lipsync', 'Animate', 'Edit'] as VideoFeature[]).map((feature) => (
                                            <button
                                                key={feature}
                                                onClick={() => {
                                                    if (feature === 'Edit') {
                                                        router.push('/text-to-video/edit-video?feature=upscale');
                                                        return;
                                                    }
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
                                                className={`inline-flex items-center md:gap-2 gap-1 md:px-3 px-2 md:py-0.75 py-1 rounded-lg md:text-sm text-xs font-medium transition-all border whitespace-nowrap ${activeFeature === feature
                                                    ? 'bg-white border-white/5 text-black shadow-sm'
                                                    : 'bg-gradient-to-b from-white/5 to-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                                                    }`}
                                            >
                                                {feature}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Desktop: Search, Sort, and Date controls - positioned at right end of Video Generation text */}
                                <div className="hidden md:flex items-center pt-2">
                                    <HistoryControls mode="video" />
                                </div>
                            </div>
                            <p className="text-white/80 text-xs sm:text-lg md:text-sm pb-2">
                                Transform your ideas into stunning videos using advanced AI models
                            </p>

                            {/* Mobile-only feature buttons: placed below the descriptive text */}
                            <div className="flex md:hidden items-center gap-2 overflow-x-auto scrollbar-none ">
                                {(['Video', 'Lipsync', 'Animate', 'Edit'] as VideoFeature[]).map((feature) => (
                                    <button
                                        key={feature + '-mobile'}
                                        onClick={() => {
                                            if (feature === 'Edit') {
                                                router.push('/text-to-video/edit-video?feature=upscale');
                                                return;
                                            }
                                            setActiveFeature(feature);
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
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${activeFeature === feature
                                            ? 'bg-white border-white/5 text-black shadow-sm'
                                            : 'bg-gradient-to-b from-white/5 to-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        {feature}
                                    </button>
                                ))}
                            </div>
                            <div className="flex md:hidden items-center pt-0">
                                <HistoryControls mode="video" />
                            </div>

                        </div>
                    </div>

                    {/* Input Box Section - Show for all features, in scrollable area */}
                    <div className="mb-6">
                        {isInlineEditVideoPage ? (
                            <EditVideoInterface />
                        ) : activeFeature === 'Animate' ? (
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
                    <div className="relative z-10 w-full max-w-[1500px] max-h-[90vh] overflow-y-auto bg-transparent rounded-xl">
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

