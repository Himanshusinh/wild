'use client';

import React, { useRef } from 'react';
import { useScroll, useTransform, motion, MotionValue } from 'framer-motion';
import Image from 'next/image';
import { workflowCards } from '../data/workflowData';

// Split cards into pairs
const pairs = [];
for (let i = 0; i < workflowCards.length; i += 2) {
    pairs.push(workflowCards.slice(i, i + 2));
}

export default function WorkflowScrollAnimation() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    return (
        <div ref={containerRef} className="h-[400vh] relative bg-[#07070B]">
            <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
                <div className="relative w-full max-w-7xl h-full flex items-center justify-center">
                    {pairs.map((pair, index) => {
                        // Calculate scroll range for this pair
                        // Total 4 pairs.
                        // Pair 0: Visible 0-0.25. Split 0.25-0.5?
                        // Actually, we want a sequence.
                        // 0 -> 0.25: Pair 0 splits, Pair 1 emerges.
                        // 0.25 -> 0.5: Pair 1 splits, Pair 2 emerges.
                        // 0.5 -> 0.75: Pair 2 splits, Pair 3 emerges.
                        // 0.75 -> 1.0: Pair 3 stays visible (or splits at end).

                        const start = index * 0.25;
                        const end = start + 0.25;

                        return (
                            <WorkflowPair
                                key={index}
                                pair={pair}
                                index={index}
                                scrollYProgress={scrollYProgress}
                                range={[start, end]}
                                totalPairs={pairs.length}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

interface WorkflowPairProps {
    pair: typeof workflowCards;
    index: number;
    scrollYProgress: MotionValue<number>;
    range: [number, number];
    totalPairs: number;
}

function WorkflowPair({ pair, index, scrollYProgress, range, totalPairs }: WorkflowPairProps) {
    const [start, end] = range;

    // Animation Logic:
    // 1. Entrance (only for index > 0): Scale up and fade in from center.
    //    Happens during the PREVIOUS pair's split phase (start - 0.25 to start).
    // 2. Active: Fully visible in center.
    // 3. Exit: Split apart (Left -> -X, Right -> +X) and fade out.
    //    Happens during current range (start to end).

    // Entrance:
    // For index 0, it's always visible initially.
    // For index > 0, it enters while the previous one exits.
    const entranceStart = start - 0.25;
    const entranceEnd = start;

    const opacity = useTransform(scrollYProgress,
        [entranceStart, entranceEnd, start, end],
        index === 0 ? [1, 1, 1, 0] : [0, 1, 1, 0]
    );

    const scale = useTransform(scrollYProgress,
        [entranceStart, entranceEnd, start, end],
        index === 0 ? [1, 1, 1, 1] : [0.5, 1, 1, 1]
    );

    // Split logic
    // Left card moves left, Right card moves right
    const xLeft = useTransform(scrollYProgress, [start, end], [0, -1000]);
    const xRight = useTransform(scrollYProgress, [start, end], [0, 1000]);

    // Rotation for extra flair
    const rotateLeft = useTransform(scrollYProgress, [start, end], [0, -45]);
    const rotateRight = useTransform(scrollYProgress, [start, end], [0, 45]);

    // For the very last pair, we might want it to stay visible or split at the very end.
    // Current logic splits it from 0.75 to 1.0.

    // If we want the last pair to stay, we can adjust the exit range.
    // But user said "4 pairs of 2 so i want that type of parallex scroll".
    // Usually the last item stays or scrolls away. Let's let it split for now to match the flow.

    return (
        <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity, display: index === 0 ? 'flex' : undefined }} // Ensure first is visible
        >
            <div className="flex gap-8 md:gap-32 items-center justify-center w-full px-4">
                {/* Left Card */}
                <motion.div
                    style={{ x: xLeft, rotate: rotateLeft, scale }}
                    className="w-[50rem] md:w-[65rem] lg:w-[80rem]"
                >
                    <div className="relative group w-full h-auto">
                        <div className="w-full h-full relative overflow-hidden">
                            <Image
                                src={pair[0].src}
                                height={800}
                                width={800}
                                className="h-[500px] md:h-[700px] w-full object-cover shadow-none group-hover:shadow-2xl transition-shadow duration-500"
                                alt={pair[0].title}
                                unoptimized
                            />
                            <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                                <h2
                                    className="text-3xl md:text-6xl font-bold tracking-widest uppercase text-center w-full"
                                    style={{
                                        fontFamily: 'var(--font-inter)',
                                        WebkitTextStroke: '1px rgba(255,255,255,0.8)',
                                        color: 'transparent'
                                    }}
                                >
                                    {pair[0].title}
                                </h2>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Card */}
                {pair[1] && (
                    <motion.div
                        style={{ x: xRight, rotate: rotateRight, scale }}
                        className="w-[50rem] md:w-[65rem] lg:w-[80rem]"
                    >
                        <div className="relative group w-full h-auto">
                            <div className="w-full h-full relative overflow-hidden">
                                <Image
                                    src={pair[1].src}
                                    height={800}
                                    width={800}
                                    className="h-[500px] md:h-[700px] w-full object-cover shadow-none group-hover:shadow-2xl transition-shadow duration-500"
                                    alt={pair[1].title}
                                    unoptimized
                                />
                                <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                                    <h2
                                        className="text-3xl md:text-6xl font-bold tracking-widest uppercase text-center w-full"
                                        style={{
                                            fontFamily: 'var(--font-inter)',
                                            WebkitTextStroke: '1px rgba(255,255,255,0.8)',
                                            color: 'transparent'
                                        }}
                                    >
                                        {pair[1].title}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
