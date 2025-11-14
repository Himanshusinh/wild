'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useIntersectionObserverForRef } from '@/hooks/useInfiniteGenerations';
import { API_BASE } from '../../HomePage/routes';
import InputBox from './TextToVideo/compo/InputBox';
import { toMediaProxy, toDirectUrl } from '@/lib/thumb';

type VideoItem = {
    id: string;
    prompt?: string;
    generationType?: string;
    model?: string;
    aspectRatio?: string;
    frameSize?: string;
    aspect_ratio?: string;
    createdAt?: string;
    updatedAt?: string;
    isPublic?: boolean;
    isDeleted?: boolean;
    createdBy?: { uid?: string; username?: string; displayName?: string; photoURL?: string };
    videos?: { id: string; url: string; originalUrl?: string; storagePath?: string; thumbnailUrl?: string }[];
};

type VideoFeature = 'Video' | 'Lipsync' | 'Animate' | 'UGC';

export default function VideoGenerationPage() {
    const [activeFeature, setActiveFeature] = useState<VideoFeature>('Video');
    const [items, setItems] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>();
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [preview, setPreview] = useState<{ url: string; item: VideoItem } | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const loadingMoreRef = useRef(false);
    const requestSeqRef = useRef(0);
    const inFlightRef = useRef<Promise<void> | null>(null);
    const queuedNextRef = useRef<{ reset: boolean } | null>(null);
    const initialLoadDoneRef = useRef(false);

    const fetchFeed = async (reset = false) => {
        try {
            if (inFlightRef.current) {
                queuedNextRef.current = { reset };
                return;
            }
            if (loading) return;
            setLoading(true);
            const seq = ++requestSeqRef.current;
            const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
            const url = new URL(`${baseUrl}/api/feed`);

            url.searchParams.set('limit', '20');
            url.searchParams.set('sortBy', 'createdAt');
            url.searchParams.set('sortOrder', 'desc');
            url.searchParams.set('mode', 'video');

            if (!reset && cursor) {
                url.searchParams.set('cursor', cursor);
            }

            const doFetch = async () => {
                const res = await fetch(url.toString(), { credentials: 'include' });
                return res;
            };
            const p = doFetch();
            inFlightRef.current = p.then(() => undefined, () => undefined);
            const res = await p;

            if (!res.ok) {
                const errorText = await res.text();
                console.error('[VideoGeneration] Fetch failed:', { status: res.status, statusText: res.statusText, errorText });
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            const payload = data?.data || data;
            const meta = payload?.meta || {};
            const normalizeDate = (d: any) => typeof d === 'string' ? d : (d && typeof d === 'object' && typeof d._seconds === 'number' ? new Date(d._seconds * 1000).toISOString() : undefined);
            const newItems: VideoItem[] = (payload?.items || []).map((it: any) => ({
                ...it,
                createdAt: normalizeDate(it?.createdAt) || it?.createdAt,
                updatedAt: normalizeDate(it?.updatedAt) || it?.updatedAt,
                aspectRatio: it?.aspect_ratio || it?.aspectRatio || it?.frameSize,
                frameSize: it?.frameSize || it?.aspect_ratio || it?.aspectRatio,
                aspect_ratio: it?.aspect_ratio || it?.aspectRatio || it?.frameSize,
            }));

            const newCursor = meta?.nextCursor || payload?.nextCursor;

            setItems(prev => {
                if (reset) return newItems;
                const map = new Map<string, VideoItem>();
                prev.forEach(it => map.set(it.id, it));
                newItems.forEach(it => map.set(it.id, it));
                return Array.from(map.values());
            });
            setCursor(newCursor);
            const pageLimit = 20;
            const inferredHasMore = typeof meta?.hasMore === 'boolean'
                ? meta.hasMore
                : (newItems.length >= pageLimit && Boolean(newCursor));
            setHasMore(inferredHasMore);
            setError(null);
        } catch (e: any) {
            const msg = String(e?.message || '');
            if (/abort|cancell?ed|signal/i.test(msg)) {
                console.log('[VideoGeneration] Ignored canceled fetch');
            } else {
                console.error('[VideoGeneration] Feed fetch error:', e);
                setError(e?.message || 'Failed to load feed');
                setHasMore(false);
            }
        } finally {
            setLoading(false);
            inFlightRef.current = null;
            const next = queuedNextRef.current;
            queuedNextRef.current = null;
            if (next) {
                Promise.resolve().then(() => fetchFeed(next.reset));
            }
            initialLoadDoneRef.current = true;
        }
    };

    useEffect(() => {
        loadingMoreRef.current = false;
        try { window.scrollTo({ top: 0, behavior: 'auto' }) } catch { }
        initialLoadDoneRef.current = false;
        setItems([]);
        setCursor(undefined);
        setHasMore(true);
        fetchFeed(true);
    }, []);

    useIntersectionObserverForRef(
        sentinelRef,
        async () => {
            try {
                await fetchFeed(false);
            } catch (err) {
                console.error('[VideoGeneration] Error loading more:', err);
            }
        },
        hasMore,
        loading,
        {
            root: null,
            rootMargin: '600px',
            threshold: 0.01,
            requireUserScrollRef: initialLoadDoneRef
        }
    );

    const filteredItems = useMemo(() => {
        const validItems = items.filter(item => {
            if (item.isDeleted === true) return false;
            if (item.isPublic === false) return false;
            return true;
        });
        return validItems;
    }, [items]);

    const cards = useMemo(() => {
        const seenItem = new Set<string>();
        const out: { item: VideoItem; video: any }[] = [];

        for (const it of filteredItems) {
            if (seenItem.has(it.id)) continue;
            const video = it.videos && it.videos[0];
            if (!video?.url) continue;
            seenItem.add(it.id);
            out.push({ item: it, video });
        }
        return out;
    }, [filteredItems]);

    return (
        <div className="min-h-screen bg-[#07070B]">
            {/* Root layout renders Nav + SidePanel; add spacing here so content aligns */}
            <div className="flex">
                <div className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 lg:px-12 -mt-16">
                    {/* Sticky header + filters (pinned under navbar) */}
                    <div className="sticky top-0 z-20 bg-[#07070B]">
                        <div className="mb-2 md:mb-3 pt-10">
                            <h3 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-semibold mb-2 sm:mb-3">
                                Video Generation
                            </h3>
                            <p className="text-white/80 text-base sm:text-lg md:text-xl">
                                Transform your ideas into stunning videos using advanced AI models
                            </p>
                        </div>

                        {/* Feature Filter Bar */}
                        <div className="mb-4">
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                                {(['Video', 'Lipsync', 'Animate', 'UGC'] as VideoFeature[]).map((feature) => (
                                    <button
                                        key={feature}
                                        onClick={() => setActiveFeature(feature)}
                                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all border ${activeFeature === feature
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

                    {error && <div className="text-red-400 mb-4 text-sm">{error}</div>}

                    {/* Input Box Section - Show for all features, in scrollable area */}
                    <div className="mb-6">
                        <InputBox 
                            placeholder={activeFeature === 'Lipsync' ? "What should the character say?" : "Type your video prompt..."}
                            activeFeature={activeFeature}
                        />
                    </div>

                    {/* Feed container uses main page scrollbar */}
                    <div ref={scrollContainerRef}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 [overflow-anchor:none]">
                            {cards.map(({ item, video }, idx) => {
                                const cardId = `${item.id}-${video.id}-${idx}`;
                                const proxied = toMediaProxy(video.url);

                                return (
                                    <div
                                        key={cardId}
                                        className="mb-0 cursor-pointer group relative [content-visibility:auto] [overflow-anchor:none] w-full"
                                        onClick={() => setPreview({ url: video.url, item })}
                                    >
                                        <div className="relative w-full rounded-lg overflow-hidden bg-transparent group">
                                            <div
                                                style={{ aspectRatio: '16/9', minHeight: 160 }}
                                                className="relative transition-opacity duration-300 ease-out will-change-[opacity] opacity-100"
                                            >
                                                <video
                                                    src={proxied}
                                                    className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.01]"
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                    poster={video.thumbnailUrl || undefined}
                                                    onMouseEnter={async (e) => { try { await (e.currentTarget as HTMLVideoElement).play() } catch { } }}
                                                    onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; try { v.pause(); v.currentTime = 0 } catch { } }}
                                                />
                                                <div className="absolute bottom-2 right-2 opacity-80">
                                                    <div className="bg-black/40 rounded-md p-1">
                                                        <img src="/icons/videoGenerationiconwhite.svg" alt="Video" className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Loading indicator for pagination */}
                        {loading && items.length > 0 && (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                <p className="text-white/60 mt-2">Loading more...</p>
                            </div>
                        )}

                        {/* Initial loading */}
                        {loading && items.length === 0 && (
                            <div className="flex items-center justify-center py-28">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="text-white text-lg">Loading videos...</div>
                                </div>
                            </div>
                        )}

                        {/* No items message */}
                        {!loading && cards.length === 0 && !error && (
                            <div className="text-center py-16">
                                <p className="text-white/60 text-lg">No videos available yet.</p>
                            </div>
                        )}

                        {/* End message */}
                        {!loading && !hasMore && items.length > 0 && (
                            <div className="text-center py-8">
                                <p className="text-white/40 text-sm">You've reached the end</p>
                            </div>
                        )}

                        <div ref={sentinelRef} style={{ height: 1 }} />
                    </div>

                    {/* Preview Modal */}
                    {preview && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-70 flex items-center justify-center p-2 md:py-20" onClick={() => setPreview(null)}>
                            <div className="relative h-full md:w-full md:max-w-6xl w-[90%] max-w-[90%] bg-transparent border border-white/10 rounded-3xl overflow-hidden shadow-3xl"
                                onClick={(e) => e.stopPropagation()}>
                                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-end px-4 py-3 bg-transparent">
                                    <button aria-label="Close" className="text-white/80 hover:text-white text-lg" onClick={() => setPreview(null)}>✕</button>
                                </div>
                                <div className="pt-0 h-full">
                                    <div className="relative bg-black/20 h-full">
                                        <video src={toDirectUrl(toMediaProxy(preview.url)) || preview.url} className="w-full h-full" controls autoPlay playsInline preload="auto" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

