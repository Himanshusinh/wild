import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
    Wand2,
    Camera,
    Smile,
    TrendingUp
} from 'lucide-react';
import WSolid from '@/components/icons/WSolid';

const FeatureItem = ({ href, icon: Icon, title, desc, onClick, isSoon }: any) => {
    const Element = isSoon ? 'div' : Link;
    return (
        <Element
            href={isSoon ? undefined : href}
            onClick={isSoon ? undefined : onClick}
            className={`group/item flex w-full items-center gap-3 rounded-lg border border-transparent p-2 transition-colors ${isSoon ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-white/10 hover:border-white/20'}`}
        >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white p-2">
                <Icon size={18} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-normal text-white group-hover/item:text-white transition-colors tracking-wide">{title}</div>
                    {isSoon && (
                        <div className="px-1.5 py-[2px] text-[9px] font-bold tracking-widest uppercase bg-yellow-500/20 text-yellow-500 rounded leading-none">
                            SOON
                        </div>
                    )}
                </div>
                <div className="text-[11px] font-thin text-zinc-300 group-hover/item:text-zinc-100 transition-colors leading-snug">{desc}</div>
            </div>
        </Element>
    );
};

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
                <div className="text-sm font-normal text-white group-hover/item:text-white transition-colors tracking-wide">{name}</div>
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
            <div className="text-[11px] font-thin text-zinc-300 group-hover/item:text-zinc-100 transition-colors leading-snug">{desc}</div>
        </div>
    </Link>
);

export const AppsPopout = ({
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
            className={`fixed left-[80px] z-[99999] flex max-h-[92vh] max-w-[740px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl origin-left transition-all duration-300 ease-out font-[family-name:var(--font-poppins)]
            ${isVisible ? 'opacity-100 pointer-events-auto scale-100 translate-x-0' : 'opacity-0 pointer-events-none scale-95 -translate-x-2'}`}
            style={{ top: typeof posTop === 'number' ? `${posTop}px` : posTop, transform: 'translateY(-50%)' }}
        >
            <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col h-full shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <div className="border-b border-white/10 p-4 shrink-0 bg-[#0a0a0a]">
                    <div className="flex items-center text-sm font-bold text-white tracking-wide">AI Workflows</div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0a0a0a]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Categories Column */}
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] font-bold text-zinc-300 tracking-[0.2em] uppercase pl-1">Categories</div>
                            <div className="flex flex-col gap-0.5">
                                <FeatureItem href="/view/workflows/general" icon={Wand2} title="General" desc="Upscale, manage elements" onClick={onMouseLeave} />
                                <FeatureItem href="/view/workflows/fun" icon={Smile} title="Fun" desc="Creative fun effects" onClick={onMouseLeave} />
                                <FeatureItem href="/view/workflows/viral-trend" icon={TrendingUp} title="Viral Trend" desc="Trending social styles" onClick={onMouseLeave} isSoon />
                                <FeatureItem href="/view/workflows/photography" icon={Camera} title="Photography" desc="Enhance and transform" onClick={onMouseLeave} />
                            </div>
                        </div>

                        {/* Popular Workflows Column */}
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] font-bold text-zinc-300 tracking-[0.2em] uppercase pl-1">Popular Apps</div>
                            <div className="flex flex-col gap-0.5 max-h-[480px] overflow-y-auto custom-scrollbar pr-2 pb-4">
                                <ModelItem href="/view/workflows/general/creatively-upscale" tag="TRENDING" tagColor="#FF7A00" name="Creatively Upscale" desc="Crisp, high quality 4K upscaling" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/general/restore-old-photo" tag="TOP PICK" tagColor="#9D4EDD" name="Restore Old Photo" desc="Bring old memories back" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/general/remove-element" tag="ULTRA" tagColor="#3A86FF" name="Remove Element" desc="Seamlessly erase objects" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/general/replace-element" tag="" name="Replace Element" desc="Swap objects naturally" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/fun/polaroid-style" tag="LATEST" tagColor="#00E5FF" name="Polaroid Style Photos" desc="Instant vintage aesthetic" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/fun/vintage-teleport" tag="" name="Vintage Image" desc="Travel back in time" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/fun/people-age" tag="QUICK" tagColor="#00B4D8" name="People Age" desc="See your future self" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/fun/custom-stickers" tag="" name="Create Custom Stickers" desc="Turn ideas to stickers" onClick={onMouseLeave} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
