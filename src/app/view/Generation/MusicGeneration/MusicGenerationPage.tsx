'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setCurrentGenerationType } from '@/store/slices/uiSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import MusicGenerationInputBox from './TextToMusic/compo/InputBox';
import TextToSpeechInputBox from './TextToMusic/compo/TextToSpeechInputBox';
import SFXInputBox from './TextToMusic/compo/SFXInputBox';
import AudioCloningInputBox from './TextToMusic/compo/AudioCloningInputBox';
import DialogueInputBox from './TextToMusic/compo/DialogueInputBox';
import AudioGenerationInputBox from './TextToMusic/compo/AudioGenerationInputBox';

type MusicFeature = 'Music' | 'Voice (TTS)' | 'SFX' | 'Voice Cloning' | 'Dialogue';

export default function MusicGenerationPage() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const featureParam = (searchParams?.get('feature') || '').toLowerCase();

    // Set UI generation type immediately to prevent showing wrong page on refresh
    React.useMemo(() => {
        try { (dispatch as any)(setCurrentGenerationType('text-to-music' as any)); } catch { }
    }, [dispatch]);

    const validFeatures: MusicFeature[] = ['Music', 'Voice (TTS)', 'SFX', 'Voice Cloning', 'Dialogue'];

    const mapParamToFeature = (param: string): MusicFeature | null => {
        switch (param) {
            case 'music':
            case 'music-generation':
            case 'text-to-music':
                return 'Music';
            case 'tts':
            case 'text-to-speech':
            case 'speech':
                return 'Voice (TTS)';
            case 'sfx':
            case 'sound-effects':
                return 'SFX';
            case 'audio-cloning':
            case 'voice-cloning':
            case 'cloning':
                return 'Voice Cloning';
            case 'dialogue':
            case 'text-to-dialogue':
            case 'conversation':
                return 'Dialogue';
            default:
                return null;
        }
    };

    // Initialise from URL param or localStorage
    const [activeFeature, setActiveFeature] = useState<MusicFeature>(() => {
        const fromUrl = mapParamToFeature(featureParam);
        if (fromUrl) return fromUrl;
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem('wm_active_music_feature');
            const mapped = mapParamToFeature((stored || '').toLowerCase());
            if (mapped) return mapped;
        }
        return 'Music';
    });

    // Sync when URL param changes (e.g., navigation/back/forward)
    useEffect(() => {
        const fromUrl = mapParamToFeature(featureParam);
        if (fromUrl && fromUrl !== activeFeature) {
            setActiveFeature(fromUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [featureParam]);

    // Reflect active feature in UI slice for consistent expectedType gating
    useEffect(() => {
        const type = activeFeature === 'Music' ? 'text-to-music'
            : activeFeature === 'Voice (TTS)' ? 'text-to-speech'
                : activeFeature === 'SFX' ? 'sfx'
                    : activeFeature === 'Dialogue' ? 'text-to-dialogue'
                        : 'text-to-music';
        try { (dispatch as any)(setCurrentGenerationType(type as any)); } catch { }
    }, [activeFeature, dispatch]);

    // Persist active feature to localStorage & URL
    const handleSetFeature = (feature: MusicFeature) => {
        setActiveFeature(feature);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('wm_active_music_feature', feature);
        }
        // Map feature back to short param
        const param = feature === 'Music' ? 'music' :
            feature === 'Voice (TTS)' ? 'tts' :
                feature === 'SFX' ? 'sfx' :
                    feature === 'Voice Cloning' ? 'audio-cloning' :
                        feature === 'Dialogue' ? 'dialogue' : 'music';
        const current = new URLSearchParams(searchParams?.toString());
        current.set('feature', param);
        router.replace(`?${current.toString()}`);
    };

    // Root container: prevent horizontal scroll artifacts
    return (
        <div className="h-screen pt-4 -mt-6 bg-[#07070B] overflow-hidden overflow-x-hidden">
            <style jsx global>{`
                /* Hide main page scrollbar */
                body {
                    overflow: hidden !important;
                }
                
                /* Custom scrollbar for right column - thin and styled */
                .history-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .history-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .history-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                }
                
                .history-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                
                /* Hide scrollbar for left column */
                .input-scrollbar::-webkit-scrollbar {
                    width: 0px;
                    display: none;
                }
                
                .input-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                
                /* Allow dropdowns to overflow scrollable containers */
                .dropdown-container {
                    overflow: visible !important;
                    position: relative;
                }
                
                .dropdown-container > div[class*="absolute"] {
                    position: absolute !important;
                    z-index: 100 !important;
                }
            `}</style>
            {/* Root layout renders Nav + SidePanel; add spacing here so content aligns */}
            <div className="flex h-full">
                <div className="flex flex-col flex-1 min-w-0 px-4 sm:px-6 md:px-8 lg:px-12 -mt-14 h-full overflow-hidden">
                    {/* Sticky header + filters (pinned under navbar) */}
                    <div className="sticky top-0 z-20 bg-[#07070B] flex-shrink-0 -mb-4">
                        <div className="mb-2 md:mb-3 pt-10">
                            <h3 className="text-white text-xl sm:text-4xl md:text-5xl lg:text-4xl font-semibold md:mb-2 mb-0 sm:mb-3">
                                Music Generation
                            </h3>
                            <p className="text-white/80 text-xs md:text-xl ">
                                Transform your ideas into stunning audio using advanced AI models
                            </p>
                        </div>

                        {/* Feature Filter Bar */}
                        <div className="mb-0 w-full">
                            <div className="flex items-center flex-nowrap w-full md:gap-3 gap-1 overflow-x-auto md:pb-0 pb-2 scrollbar-none scroll-smooth">
                                {(['Music', 'Voice (TTS)', 'Dialogue', 'SFX', 'Voice Cloning',] as MusicFeature[]).map((feature) => (
                                    <button
                                        key={feature}
                                        onClick={() => handleSetFeature(feature)}
                                        className={`inline-flex flex-shrink-0 whitespace-nowrap items-center gap-2 md:px-4 px-2 md:py-1.5 py-1 rounded-lg md:text-sm text-xs font-medium transition-all border ${activeFeature === feature
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

                    {/* Responsive layout: stack on small screens, columns on large */}
                    <div className="flex flex-col lg:flex-row gap-6 mt-6 items-start flex-1 min-h-0">
                        {/* Left Column: Input Box (sticky) */}
                        <div
                            className="w-full lg:w-[30%] flex-shrink-0"
                            style={{ position: 'sticky', top: '6.5rem', left: 0, alignSelf: 'flex-start', zIndex: 30, height: 'calc(100vh - 6.5rem)' }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                    WebkitOverflowScrolling: 'touch'
                                }}
                                className="input-scrollbar px-1 pt-4 lg:pt-8 pb-20"
                            >
                                <div className="pr-2" style={{ position: 'relative', paddingBottom: '160px' }}>
                                    {activeFeature === 'Music' && (
                                        <MusicGenerationInputBox />
                                    )}
                                    {activeFeature === 'Voice (TTS)' && (
                                        <TextToSpeechInputBox />
                                    )}
                                    {activeFeature === 'Dialogue' && (
                                        <DialogueInputBox />
                                    )}
                                    {activeFeature === 'SFX' && (
                                        <SFXInputBox />
                                    )}
                                    {activeFeature === 'Voice Cloning' && (
                                        <AudioCloningInputBox />
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Right Column: History */}
                        <div className="flex-1 min-w-0 h-full overflow-y-auto history-scrollbar">
                            {activeFeature === 'Music' && (
                                <MusicGenerationInputBox key={`music-history-${activeFeature}`} showHistoryOnly={true} />
                            )}
                            {activeFeature === 'Voice (TTS)' && (
                                <TextToSpeechInputBox key={`tts-history-${activeFeature}`} showHistoryOnly={true} />
                            )}
                            {activeFeature === 'Dialogue' && (
                                <DialogueInputBox key={`dialogue-history-${activeFeature}`} showHistoryOnly={true} />
                            )}
                            {activeFeature === 'SFX' && (
                                <SFXInputBox key={`sfx-history-${activeFeature}`} showHistoryOnly={true} />
                            )}
                            {activeFeature === 'Voice Cloning' && (
                                <AudioCloningInputBox key={`voice-cloning-history-${activeFeature}`} showHistoryOnly={true} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}




