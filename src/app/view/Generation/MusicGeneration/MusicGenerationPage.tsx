'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentGenerationType } from '@/store/slices/uiSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSignInUrl } from '@/routes/routes';
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
    const modelParam = searchParams?.get('model') || undefined;
    const { user } = useAppSelector((state: any) => state?.auth || { user: null });

    // Debug logging to verify auth state
    useEffect(() => {
        console.log('MusicGenerationPage: User state:', user);
    }, [user]);

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
        <div className="min-h-screen bg-[#0E0E12] overflow-x-hidden">
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
            `}</style>

            <div className="flex h-screen overflow-hidden">
                <div className="flex flex-col flex-1 min-w-0 px-4 sm:px-6 md:px-8 h-full">
                    {/* Sticky header - moved down slightly to avoid Nav overlap */}
                    <div className="sticky top-0 z-[50] bg-[#0E0E12] pt-4 pb-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <h3 className="text-white text-xl sm:text-2xl md:text-2xl font-semibold whitespace-nowrap">
                                    Music Generation
                                </h3>

                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                    {(['Music', 'Voice (TTS)', 'Dialogue', 'SFX', 'Voice Cloning'] as MusicFeature[]).map((feature) => (
                                        <button
                                            key={feature}
                                            onClick={() => handleSetFeature(feature)}
                                            className={`
                                                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs 
                                                transition-all duration-200 whitespace-nowrap relative
                                                active:scale-95
                                                ${activeFeature === feature
                                                    ? 'bg-white text-black font-semibold shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                                    : 'bg-white/10 text-white/90 border border-white/5 hover:bg-white hover:text-black hover:scale-105'}
                                            `}
                                            aria-label={feature}
                                            style={{
                                                pointerEvents: 'auto',
                                                cursor: 'pointer',
                                                zIndex: 10000
                                            }}
                                        >
                                            <span>{feature}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {!user && (
                                <button
                                    onClick={() => router.push(getSignInUrl())}
                                    className='flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/20 hover:border-white/30 transition-all duration-200 shadow-lg'
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                        <p className="text-white/60 text-xs sm:text-sm">
                            Transform your ideas into stunning audio using advanced AI models
                        </p>
                    </div>

                    {/* Content area: flexbox for main content + history */}
                    <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0 overflow-hidden">
                        {/* Left Column: Input Box (scrollable) */}
                        <div className="w-full lg:w-[350px] xl:w-[400px] flex-shrink-0 h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto input-scrollbar pr-2 py-4">
                                <div className="space-y-6 pb-32">
                                    {activeFeature === 'Music' && <MusicGenerationInputBox selectedModel={modelParam} />}
                                    {activeFeature === 'Voice (TTS)' && <TextToSpeechInputBox selectedModel={modelParam} />}
                                    {activeFeature === 'Dialogue' && <DialogueInputBox selectedModel={modelParam} />}
                                    {activeFeature === 'SFX' && <SFXInputBox selectedModel={modelParam} />}
                                    {activeFeature === 'Voice Cloning' && <AudioCloningInputBox selectedModel={modelParam} />}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: History (scrollable) */}
                        <div className="flex-1 min-w-0 h-full overflow-y-auto history-scrollbar py-4">
                            <div className="pb-20">
                                {activeFeature === 'Music' && (
                                    <MusicGenerationInputBox key={`m-hist-${activeFeature}`} showHistoryOnly={true} />
                                )}
                                {activeFeature === 'Voice (TTS)' && (
                                    <TextToSpeechInputBox key={`t-hist-${activeFeature}`} showHistoryOnly={true} />
                                )}
                                {activeFeature === 'Dialogue' && (
                                    <DialogueInputBox key={`d-hist-${activeFeature}`} showHistoryOnly={true} />
                                )}
                                {activeFeature === 'SFX' && (
                                    <SFXInputBox key={`s-hist-${activeFeature}`} showHistoryOnly={true} />
                                )}
                                {activeFeature === 'Voice Cloning' && (
                                    <AudioCloningInputBox key={`v-hist-${activeFeature}`} showHistoryOnly={true} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
