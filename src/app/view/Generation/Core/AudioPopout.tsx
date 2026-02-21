import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
    Music,
    Volume2,
    Mic,
    Radio
} from 'lucide-react';
import WSolid from '@/components/icons/WSolid';

const FeatureItem = ({ href, icon: Icon, title, desc }: any) => (
    <Link
        href={href}
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

const ModelItem = ({ href, tag, tagColor, name, desc }: any) => (
    <Link
        href={href}
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
    onMouseEnter,
    onMouseLeave
}: {
    isVisible: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return createPortal(
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`fixed left-[80px] top-1/2 -translate-y-1/2 z-[99999] flex max-h-[92vh] max-w-[740px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl origin-left transition-all duration-300 ease-out font-[family-name:var(--font-poppins)]
            ${isVisible ? 'opacity-100 pointer-events-auto scale-100 translate-x-0' : 'opacity-0 pointer-events-none scale-95 -translate-x-2'}`}
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
                                <FeatureItem href="/text-to-music" icon={Music} title="AI Music Generation" desc="Create original music from vibes" />
                                <FeatureItem href="/text-to-music?type=sfx" icon={Volume2} title="Sound Effects" desc="Generate cinematic SFX" />
                                <FeatureItem href="/text-to-music?type=tts" icon={Mic} title="Text to Speech" desc="Ultra realistic voiceovers" />
                                <FeatureItem href="/editvideo?tool=lipsync" icon={Radio} title="AI Lip Sync" desc="Sync audio to video characters" />
                            </div>
                        </div>

                        {/* Models Column */}
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase pl-1">Models</div>
                            <div className="flex flex-col gap-0.5 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
                                <ModelItem href="/text-to-music?model=minimax-music-2" tag="TOP PICK" tagColor="#9D4EDD" name="MiniMax Music 2" desc="High quality full tracks" />
                                <ModelItem href="/text-to-music?model=elevenlabs-tts" tag="ULTRA" tagColor="#3A86FF" name="ElevenLabs TTS v3" desc="World's best voice AI" />
                                <ModelItem href="/text-to-music?model=chatterbox-multilingual" tag="QUICK" tagColor="#00B4D8" name="Chatterbox" desc="Multilingual expressive voices" />
                                <ModelItem href="/text-to-music?model=maya-tts" tag="" name="Maya TTS" desc="Fast and emotional TTS" />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
