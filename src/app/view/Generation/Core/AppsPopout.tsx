import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
    BadgeCheck,
    Building2,
    Wand2,
    Camera,
    Film,
    Smile,
    Shirt,
} from 'lucide-react';

const FeatureItem = ({ href, icon: Icon, title, desc, onClick, isSoon }: any) => {
    const Element = isSoon ? 'div' : Link;
    return (
        <Element
            href={isSoon ? undefined : href}
            onClick={isSoon ? undefined : onClick}
            className={`group/item relative flex w-full items-center gap-2 rounded-xl border border-transparent px-2 py-1 transition-all duration-300 overflow-hidden ${isSoon ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white/[0.03] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'}`}
        >
            {!isSoon && <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none" />}
            
            <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent text-white p-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-300 ${!isSoon && 'group-hover/item:scale-105 group-hover/item:border-white/20 group-hover/item:from-white/[0.08] group-hover/item:to-white/[0.01]'}`}>
                <Icon size={16} className={`opacity-70 transition-all duration-300 ${!isSoon && 'group-hover/item:opacity-100 group-hover/item:scale-110'}`} />
            </div>
            
            <div className="relative flex min-w-0 flex-1 flex-col gap-0 z-10">
                <div className="flex items-center gap-0">
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
            className={`fixed left-[80px] z-[99999] flex max-h-[82vh] max-w-[250px] w-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0E0E12]/80 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] origin-left transition-all duration-300 ease-out font-[family-name:var(--font-poppins)]
            ${isVisible ? 'opacity-100 pointer-events-auto scale-100 translate-x-0' : 'opacity-0 pointer-events-none scale-95 -translate-x-2'}`}
            style={{ top: typeof posTop === 'number' ? `${posTop}px` : posTop, transform: 'translateY(-50%)' }}
        >
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
            
            <div className="relative flex-1 flex flex-col h-full">
                <div className="border-b border-white/5 p-3 px-6 shrink-0 relative">
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        <div className="text-md font-bold text-white tracking-wide">AI Workflows</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar relative">
                    <div className="grid grid-cols-1 gap-6">

                        {/* Categories Column */}
                        <div className="flex flex-col gap-2 relative">
                            <div className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase pl-3 flex items-center gap-2">
                                <span className="h-[1px] w-4 bg-white/20"></span>
                                Categories
                            </div>
                            <div className="flex flex-col gap-1">
                                <FeatureItem href="/view/workflows/general" icon={Wand2} title="General" desc="Upscale, manage elements" onClick={onMouseLeave} />
                                <FeatureItem href="/view/workflows/fun" icon={Smile} title="Fun" desc="Creative fun effects" onClick={onMouseLeave} />
                                <FeatureItem href="/view/workflows/architecture" icon={Building2} title="Architecture" desc="Design & interior concepts" onClick={onMouseLeave} />
                                <FeatureItem href="/view/workflows/photography" icon={Camera} title="Photography" desc="Enhance and transform" onClick={onMouseLeave} />
                                <FeatureItem href="/view/workflows/fashion" icon={Shirt} title="Fashion" desc="Style, looks & products" onClick={onMouseLeave} />
                                <FeatureItem href="/view/workflows/film-industry" icon={Film} title="Film Industry" desc="Cinematic workflows" onClick={onMouseLeave} />
                                <FeatureItem href="/view/workflows/branding" icon={BadgeCheck} title="Branding" desc="Logos, ads & identity" onClick={onMouseLeave} />
                            </div>
                        </div>

                        {/*
                        Popular Workflows Column (hidden for now)
                        <div className="flex flex-col gap-2 relative">
                            <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent hidden md:block" />
                            <div className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase pl-3 flex items-center gap-2">
                                <span className="h-[1px] w-4 bg-white/20"></span>
                                Popular Apps
                            </div>
                            <div className="flex flex-col gap-1 max-h-[480px] overflow-y-auto custom-scrollbar pr-2 pb-4">
                                <ModelItem href="/view/workflows/general/creatively-upscale" icon={Sparkles} tag="TRENDING" name="Creatively Upscale" desc="Crisp, high quality 4K upscaling" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/general/restore-old-photo" icon={History} tag="TOP PICK" name="Restore Old Photo" desc="Bring old memories back" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/general/remove-element" icon={Eraser} tag="ULTRA" name="Remove Element" desc="Seamlessly erase objects" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/general/replace-element" icon={RefreshCw} tag="" name="Replace Element" desc="Swap objects naturally" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/fun/polaroid-style" icon={Camera} tag="LATEST" name="Polaroid Style Photos" desc="Instant vintage aesthetic" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/fun/vintage-teleport" icon={Hourglass} tag="" name="Vintage Image" desc="Travel back in time" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/fun/people-age" icon={UserCircle} tag="QUICK" name="People Age" desc="See your future self" onClick={onMouseLeave} />
                                <ModelItem href="/view/workflows/fun/custom-stickers" icon={Sticker} tag="" name="Create Custom Stickers" desc="Turn ideas to stickers" onClick={onMouseLeave} />
                            </div>
                        </div>
                        */}

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
