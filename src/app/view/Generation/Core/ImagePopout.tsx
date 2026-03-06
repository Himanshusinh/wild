import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
    ImagePlus,
    Image as ImageIcon,
    UserCircle,
    Droplet,
    Sparkles,
    Shirt,
    Eraser,
    Palette,
    Box,
    Crop,
    MessageSquare,
    PenTool
} from 'lucide-react';
import WSolid from '@/components/icons/WSolid';

const FeatureItem = ({ href, icon: Icon, title, desc, onClick }: any) => (
    <a
        href={href}
        onClick={onClick}
        className="group/item flex w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-white/10 hover:border-white/20"
    >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white p-2">
            <Icon size={18} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="text-sm font-normal text-white group-hover/item:text-white transition-colors tracking-wide">{title}</div>
            <div className="text-[11px] font-thin text-zinc-300 group-hover/item:text-zinc-100 transition-colors leading-snug">{desc}</div>
        </div>
    </a>
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
                <div className="text-sm font-normal text-white group-hover/item:text-white transition-colors tracking-wide">{name}</div>
                {tag && (
                    <div
                        style={{
                            backgroundColor: `${tagColor}30`, // 30% opacity for background
                            color: tagColor,
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

export const ImagePopout = ({
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
            className={`fixed left-[80px] z-[99999] flex max-h-[92vh] max-w-[740px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl origin-left transition-all duration-300 ease-out  font-[family-name:var(--font-poppins)]
            ${isVisible ? 'opacity-100 pointer-events-auto scale-100 translate-x-0' : 'opacity-0 pointer-events-none scale-95 -translate-x-2'}`}
            style={{ top: typeof posTop === 'number' ? `${posTop}px` : posTop, transform: 'translateY(-50%)' }}
        >
            <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col h-full shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <div className="border-b border-white/10 p-4 shrink-0 bg-[#0a0a0a]">
                    <div className="flex items-center text-sm font-bold text-white tracking-wide">Image Tools</div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0a0a0a]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Features Column */}
                        <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-bold text-zinc-300 mb-0 tracking-[0.2em] uppercase pl-1">Features</div>
                            <div className="flex flex-col gap-0.5">
                                <FeatureItem href="/text-to-image" icon={ImagePlus} title="Create Image" desc="Generate AI Images" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-image/edit-image" icon={ImageIcon} title="Edit Image" desc="Edit using reference image" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-image/edit-image?tool=expand&feature=upscale" icon={Box} title="Upscale" desc="Upscale your assets" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-image/edit-image?tool=expand&feature=remove-bg" icon={Droplet} title="Remove BG" desc="Swap Photo Backgrounds Easily" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-image/edit-image?tool=erase-replace&feature=fill" icon={Eraser} title="Erase / Replace" desc="Precise editing with selection" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-image/edit-image?tool=erase-replace&feature=resize" icon={Crop} title="Expand" desc="Outpaint and expand canvas" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-image/edit-image?tool=erase-replace&feature=vectorize" icon={PenTool} title="Vectorize" desc="Convert image to SVG" onClick={onMouseLeave} />
                                <FeatureItem href="/text-to-image/edit-image?tool=erase-replace&feature=live-chat" icon={MessageSquare} title="Chat to Edit" desc="Edit using chat assistance" onClick={onMouseLeave} />
                            </div>
                        </div>

                        {/* Models Column */}
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] font-bold text-zinc-300 mb-0 tracking-[0.2em] uppercase pl-1">Models</div>
                            <div className="flex flex-col gap-0.5 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
                                <ModelItem href="/text-to-image?model=flux-2-pro" tag="TOP PICK" tagColor="#9D4EDD" name="Flux.2 Pro" desc="Extreme detailing in ultra-detail" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-image?model=qwen/qwen-image-2-pro" tag="NEW" tagColor="#B388FF" name="Qwen Image 2 Pro" desc="Premium high-fidelity generations" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-image?model=qwen/qwen-image-2" tag="NEW" tagColor="#00E5FF" name="Qwen Image 2" desc="State-of-the-art image creation" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-image?model=google/nano-banana-2" tag="LATEST" tagColor="#FF7A00" name="Nano Banana 2" desc="Google's next-gen image model" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-image?model=seedream-5-lite" tag="LATEST" tagColor="#00E5FF" name="Seedream 5 Lite" desc="Top tier text to image model" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-image?model=google/nano-banana-pro" tag="TRENDING" tagColor="#FF7A00" name="Nano Banana Pro" desc="Google's best image Gen model" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-image?model=new-turbo-model" tag="FAST" tagColor="#4CAF50" name="z-image-turbo" desc="Ultra-fast generation model" onClick={onMouseLeave} />
                                <ModelItem href="/text-to-image?model=openai/gpt-image-1.5" tag="SMART" tagColor="#FFFF00" name="GPT Image 1.5" desc="Advanced reasoning for images" onClick={onMouseLeave} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
