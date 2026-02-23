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
import WSolid from '@/components/icons/WSolid';

const FeatureItem = ({ href, icon: Icon, title, desc, onClick }: any) => (
    <Link
        href={href}
        onClick={onClick}
        className="group/item flex w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-white/10 hover:border-white/20"
    >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white p-2">
            <Icon size={18} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="text-sm font-semibold text-white group-hover/item:text-white transition-colors tracking-wide">{title}</div>
            <div className="text-[11px] font-medium text-zinc-300 group-hover/item:text-zinc-100 transition-colors leading-snug">{desc}</div>
        </div>
    </Link>
);

const ModelItem = ({ href, tag, tagColor, name, desc, onClick }: any) => (
    <Link
        href={href}
        onClick={onClick}
        className="group/item flex w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-white/10 hover:border-white/20"
    >
        <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-white p-2`} style={{ borderColor: tagColor || 'rgba(255,255,255,0.1)', backgroundColor: tagColor ? `${tagColor}15` : 'rgba(255,255,255,0.05)' }}>
            <WSolid className={`w-[18px] h-[18px] ${tagColor ? '' : 'opacity-70 group-hover/item:opacity-100 transition-opacity'}`} fill={tagColor || 'currentColor'} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-white group-hover/item:text-white transition-colors tracking-wide">{name}</div>
                {tag && (
                    <div
                        style={{
                            backgroundColor: `${tagColor}30`,
                            color: tagColor
                        }}
                        className="px-1.5 py-[2px] text-[9px] font-bold tracking-widest uppercase rounded leading-none"
                    >
                        {tag}
                    </div>
                )}
            </div>
            <div className="text-[11px] font-medium text-zinc-300 group-hover/item:text-zinc-100 transition-colors leading-snug">{desc}</div>
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
            className={`fixed left-[80px] z-[99999] flex max-h-[92vh] w-[640px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl origin-left transition-all duration-300 ease-out font-[family-name:var(--font-poppins)]
            ${isVisible ? 'opacity-100 pointer-events-auto scale-100 translate-x-0' : 'opacity-0 pointer-events-none scale-95 -translate-x-2'}`}
            style={{ top: typeof posTop === 'number' ? `${posTop}px` : posTop, transform: 'translateY(-50%)' }}
        >
            <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col h-full shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <div className="border-b border-white/10 p-4 shrink-0 bg-[#0a0a0a]">
                    <div className="flex items-center text-sm font-bold text-white tracking-wide">Audio Tools</div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0a0a0a]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Features Column */}
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase pl-1">Features</div>
                            <div className="flex flex-col gap-0.5">
                                <FeatureItem href="/text-to-music?type=tts&feature=music" icon={Music} title="AI Music Generation" desc="Create original music from vibes" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-music?type=tts&feature=tts" icon={Mic} title="Text to Speech" desc="Ultra realistic voiceovers" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-music?type=tts&feature=dialogue" icon={MessageSquare} title="AI Dialogue" desc="Generate conversational audio" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-music?type=tts&feature=sfx" icon={Volume2} title="Sound Effects" desc="Generate cinematic SFX" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-music?type=tts&feature=audio-cloning" icon={UserRound} title="AI Voice Cloning" desc="Clone any voice accurately" onClick={onMouseLeave} />
                            </div>
                        </div>

                        {/* Models Column */}
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase pl-1">Models</div>
                            <div className="flex flex-col gap-0.5 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
                                <ModelItem href="/text-to-music?type=tts&feature=music&model=minimax-music-2" tag="TOP PICK" tagColor="#9D4EDD" name="MiniMax Music 2" desc="High quality full tracks" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-music?type=tts&feature=tts&model=elevenlabs-tts" tag="ULTRA" tagColor="#3A86FF" name="ElevenLabs TTS v3" desc="World's best voice AI" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-music?type=tts&feature=tts&model=chatterbox-multilingual" tag="QUICK" tagColor="#00B4D8" name="Chatterbox" desc="Multilingual expressive voices" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-music?type=tts&feature=tts&model=maya-tts" tag="" name="Maya TTS" desc="Fast and emotional TTS" onClick={onMouseLeave} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
