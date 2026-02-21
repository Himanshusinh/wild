"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WORKFLOWS_DATA } from "../../workflows/components/data";
import ImageComparisonSlider from "../../workflows/components/ImageComparisonSlider";

const FEATURE_IDS = [
    "creatively-upscale",
    "remove-background",
    "restore-old-photo",
    "vintage-teleport",
    "polaroid-style",
    "remove-element",
    "replace-element",
    "remove-watermark"
];

const WildMindAIAPPS = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const filteredApps = WORKFLOWS_DATA.filter(app => FEATURE_IDS.includes(app.id));
    const sortedApps = FEATURE_IDS.map(id => filteredApps.find(app => app.id === id)).filter(Boolean);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            // Use 2px threshold to be more robust
            setShowLeftArrow(scrollLeft > 2);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 2);
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener("scroll", checkScroll);
            checkScroll();
            setTimeout(checkScroll, 100);
        }
        return () => container?.removeEventListener("scroll", checkScroll);
    }, []);

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            });
        }
    };

    const getRedirectionPath = (app: any) => {
        if (app.id === 'remove-background') return '/view/workflows/general/remove-background';
        if (app.id === 'restore-old-photo') return '/view/workflows/general/restore-old-photo';
        if (app.id === 'remove-element') return '/view/workflows/general/remove-element';
        if (app.id === 'remove-watermark') return '/view/workflows/general/remove-watermark';
        if (app.id === 'creatively-upscale') return '/view/workflows/general/creatively-upscale';
        if (app.id === 'replace-element') return '/view/workflows/general/replace-element';

        return `/view/workflows/${app.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${app.id}`;
    };

    return (
        <section className="w-full desktop:px-10 tablet:px-16 px-6 py-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl md:text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-zinc-500">WILDMINDAI APPS</span>
                        <span className="text-zinc-400 font-normal">-</span>
                        <span className="text-white">IMAGE EDITING</span>
                    </h2>
                </div>
                <Link
                    href="/view/workflows"
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                >
                    View all
                </Link>
            </div>

            <div className="relative group/carousel">
                {/* Navigation Arrows */}
                <button
                    onClick={() => scroll("left")}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all ${showLeftArrow ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                        }`}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={() => scroll("right")}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all ${showRightArrow ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                        }`}
                >
                    <ChevronRight className="w-6 h-6" />
                </button>

                {/* Carousel Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto no-scrollbar pb-4 px-0"
                >
                    {sortedApps.map((app: any) => (
                        <div
                            key={app.id}
                            className="min-w-[200px] md:min-w-[260px] flex-shrink-0 flex flex-col gap-3 group/card"
                        >
                            <Link href={getRedirectionPath(app)} className="block relative aspect-[3/5] rounded-[1rem] overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl">
                                <ImageComparisonSlider
                                    beforeImage={app.sampleBefore}
                                    afterImage={app.sampleAfter}
                                    beforeLabel="Before"
                                    afterLabel="After"
                                    imageFit={app.imageFit || "object-cover"}
                                    imagePosition={app.imagePosition || "object-center"}
                                    autoSlide={false}
                                    hoverToSlide={true}
                                />
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                                    <h3 className="text-white font-bold text-[10px] md:text-xs tracking-widest uppercase text-center">
                                        {app.title}
                                    </h3>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WildMindAIAPPS;
