import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
    Music,
    Volume2,
    Mic,
    MessageSquare,
    UserRound
} from 'lucide-react';

const FeatureItem = ({ href, icon: Icon, title, desc, onClick, isSoon }: any) => {
    const Element = isSoon ? 'div' : Link;
    return (
        <Element
            href={isSoon ? undefined : href}
            onClick={isSoon ? undefined : onClick}
            className={`group/item relative flex w-full items-center gap-4 rounded-xl border border-transparent p-3 transition-all duration-300 overflow-hidden ${isSoon ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white/[0.03] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'}`}
        >
            {!isSoon && <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none" />}
            
            <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent text-white p-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-300 ${!isSoon && 'group-hover/item:scale-105 group-hover/item:border-white/20 group-hover/item:from-white/[0.08] group-hover/item:to-white/[0.01]'}`}>
                <Icon size={20} className={`opacity-70 transition-all duration-300 ${!isSoon && 'group-hover/item:opacity-100 group-hover/item:scale-110'}`} />
            </div>
            
            <div className="relative flex min-w-0 flex-1 flex-col gap-1 z-10">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white/90 group-hover/item:text-white transition-colors tracking-wide">{title}</div>
                    {isSoon && (
                        <div className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-gradient-to-r from-white/10 to-white/5 text-white/90 rounded-full leading-none border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.2)] backdrop-blur-sm">
                            SOON
                        </div>
                    )}
                </div>
                <div className="text-[11px] font-medium text-white/40 group-hover/item:text-white/60 transition-colors leading-snug">{desc}</div>
            </div>
        </Element>
    );
};

const ModelItem = ({ href, tag, name, desc, onClick, icon: Icon }: any) => (
    <Link
        href={href}
        onClick={onClick}
        className="group/item relative flex w-full cursor-pointer items-center gap-4 rounded-xl border border-transparent p-3 transition-all duration-300 hover:bg-white/[0.03] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent text-white p-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-300 group-hover/item:scale-105 group-hover/item:border-white/20 group-hover/item:from-white/[0.08] group-hover/item:to-white/[0.01]">
            <Icon size={20} className="opacity-70 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-300" />
        </div>
        
        <div className="relative flex min-w-0 flex-1 flex-col gap-1 z-10">
            <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-white/90 group-hover/item:text-white transition-colors tracking-wide">{name}</div>
                {tag && (
                    <div className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-gradient-to-r from-white/10 to-white/5 text-white/90 rounded-full leading-none border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.2)] backdrop-blur-sm">
                        {tag}
                    </div>
                )}
            </div>
            <div className="text-[11px] font-medium text-white/40 group-hover/item:text-white/60 transition-colors leading-snug">{desc}</div>
        </div>
    </Link>
);

export const AudioPopout = ({
    isVisible,
    anchorTop = 0,
    onMouseEnter,
    onMouseLeave
}: {
    isVisible: boolean;
    anchorTop?: number;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}) => {
    const [mounted, setMounted] = useState(false);
    const popupRef = React.useRef<HTMLDivElement>(null);
    const [posTop, setPosTop] = useState<number | string>('50%');

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (isVisible && anchorTop && popupRef.current) {
            const half = popupRef.current.clientHeight / 2;
            let t = anchorTop;
            if (t - half < 16) t = half + 16;
            else if (t + half > window.innerHeight - 16) t = window.innerHeight - half - 16;
            setPosTop(t);
        }
    }, [isVisible, anchorTop]);

    if (!mounted) return null;

    return createPortal(
        <div
            ref={popupRef}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`fixed left-[80px] z-[99999] flex max-h-[92vh] max-w-[700px] w-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0E0E12]/80 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] origin-left transition-all duration-300 ease-out font-[family-name:var(--font-poppins)]
            ${isVisible ? 'opacity-100 pointer-events-auto scale-100 translate-x-0' : 'opacity-0 pointer-events-none scale-95 -translate-x-2'}`}
            style={{ top: typeof posTop === 'number' ? `${posTop}px` : posTop, transform: 'translateY(-50%)' }}
        >
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
            
            <div className="relative flex-1 flex flex-col h-full">
                <div className="border-b border-white/5 p-6 shrink-0 relative">
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        <div className="text-lg font-bold text-white tracking-wide">Audio Tools</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                        {/* Features Column */}
                        <div className="flex flex-col gap-4 relative">
                            <div className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase pl-3 flex items-center gap-2">
                                <span className="h-[1px] w-4 bg-white/20"></span>
                                Features
                            </div>
                            <div className="flex flex-col gap-1">
                                <FeatureItem href="/text-to-music?type=tts&feature=music" icon={Music} title="AI Music Generation" desc="Create original music from vibes" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-music?type=tts&feature=tts" icon={Mic} title="Text to Speech" desc="Ultra realistic voiceovers" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-music?type=tts&feature=dialogue" icon={MessageSquare} title="AI Dialogue" desc="Generate conversational audio" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-music?type=tts&feature=sfx" icon={Volume2} title="Sound Effects" desc="Generate cinematic SFX" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-music?type=tts&feature=audio-cloning" icon={UserRound} title="AI Voice Cloning" desc="Clone any voice accurately" onClick={onMouseLeave} />
                            </div>
                        </div>

                        {/* Models Column */}
                        <div className="flex flex-col gap-4 relative">
                            <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent hidden md:block" />
                            <div className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase pl-3 flex items-center gap-2">
                                <span className="h-[1px] w-4 bg-white/20"></span>
                                Models
                            </div>
                            <div className="flex flex-col gap-1 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
                                <ModelItem href="/text-to-music?type=tts&feature=music&model=minimax-music-2" icon={Music} tag="TOP PICK" name="MiniMax Music 2" desc="High quality full tracks" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-music?type=tts&feature=tts&model=elevenlabs-tts" icon={Mic} tag="ULTRA" name="ElevenLabs TTS v3" desc="World's best voice AI" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-music?type=tts&feature=tts&model=chatterbox-multilingual" icon={MessageSquare} tag="QUICK" name="Chatterbox" desc="Multilingual expressive voices" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-music?type=tts&feature=tts&model=maya-tts" icon={UserRound} tag="" name="Maya TTS" desc="Fast and emotional TTS" onClick={onMouseLeave} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
