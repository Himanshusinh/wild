"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { API_BASE } from "../routes";

interface Creator {
    uid: string;
    username: string;
    photoURL?: string;
    totalCreations: number;
}

const UserAvatar = ({ src, name }: { src?: string; name: string }) => {
    const [error, setError] = useState(false);

    // Generate a reliable fallback URL using ui-avatars.com
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128&bold=true`;

    return (
        <div className="relative w-12 h-12">
            <img
                src={(!src || error) ? fallbackUrl : src}
                alt={name}
                onError={() => setError(true)}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-md transition-opacity duration-300"
            />
        </div>
    );
};

const TopCreators = () => {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchTopCreators = async () => {
            try {
                const apiBase = API_BASE || "https://wildmindai.com";
                const res = await fetch(`${apiBase}/api/feed/top-creators?limit=10`);
                if (!res.ok) throw new Error("Failed to fetch top creators");
                const json = await res.json();
                setCreators(json.data || []);
            } catch (error) {
                console.error("[TopCreators] Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopCreators();
    }, []);

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: direction === "right" ? scrollAmount : -scrollAmount,
                behavior: "smooth"
            });
        }
    };

    if (loading) return (
        <div className="w-full px-4 md:px-12 py-8 animate-pulse">
            <div className="h-8 w-64 bg-white/5 rounded-lg mb-4" />
            <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="min-w-[280px] h-20 bg-white/5 rounded-xl border border-white/5" />
                ))}
            </div>
        </div>
    );

    if (creators.length === 0) return null;

    return (
        <section className="w-full py-8 text-white relative">
            <div className="laptop:px-8 tablet:px-6 space-y-1  mb-8">
                <h2 className="text-xl md:text-2xl font-medium tracking-tight">Top Creators of the Month</h2>
                <p className="text-zinc-400 text-sm md:text-base max-w-2xl">
                    Discover standout artists from our community. Follow your favorites and get inspired to create your own.
                </p>
            </div>

            <div className="relative group/main">
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4 md:px-10 pb-6"
                >
                    {creators.map((creator) => (
                        <Link
                            key={creator.uid}
                            href={`/c/${creator.username || creator.uid}`}
                            className="group/card flex-shrink-0 min-w-[280px] flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-[#12121A]/50 backdrop-blur-sm hover:bg-[#1A1A24] hover:border-white/20 transition-all duration-300 shadow-xl"
                        >
                            <div className="relative flex-shrink-0">
                                <UserAvatar src={creator.photoURL} name={creator.username} />
                                <div className="absolute -top-1.5 -right-1.5 text-xs filter drop-shadow-md brightness-125">👑</div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate capitalize text-zinc-100 group-hover/card:text-white transition-colors">
                                    {creator.username}
                                </p>
                                <p className="text-zinc-500 text-[11px] font-medium mt-0.5">
                                    {creator.totalCreations.toLocaleString()} Creations
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Navigation Buttons */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/main:opacity-100 transition-all duration-300 desktop:flex hidden hover:bg-white hover:text-black hover:scale-110 shadow-2xl"
                >
                    <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/main:opacity-100 transition-all duration-300 desktop:flex hidden hover:bg-white hover:text-black hover:scale-110 shadow-2xl"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>

                {/* Gradient Fades */}
                <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-[#07070B] via-[#07070B]/80 to-transparent pointer-events-none z-10" />
                <div className="absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-[#07070B] to-transparent pointer-events-none z-10" />
            </div>
        </section>
    );
};

export default TopCreators;
