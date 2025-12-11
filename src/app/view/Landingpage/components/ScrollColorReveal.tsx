'use client';

import React, { useRef } from 'react';
import { useScroll, useTransform, motion, MotionValue } from 'framer-motion';

interface ScrollColorRevealProps {
    children: string;
    containerClassName?: string;
    textClassName?: string;
}

export default function ScrollColorReveal({
    children,
    containerClassName = "",
    textClassName = "",
}: ScrollColorRevealProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start 90%', 'end 30%'],
    });

    const words = children.split(' ');

    return (
        <div ref={containerRef} className={`${containerClassName}`}>
            <p className={`flex flex-wrap justify-center gap-x-[0.2em] ${textClassName}`}>
                {words.map((word, i) => {
                    const start = i / words.length;
                    const end = start + (1 / words.length);
                    return (
                        <Word key={i} word={word} progress={scrollYProgress} range={[start, end]} />
                    );
                })}
            </p>
        </div>
    );
}

interface WordProps {
    word: string;
    progress: MotionValue<number>;
    range: [number, number];
}

const Word = ({ word, progress, range }: WordProps) => {
    const characters = word.split('');
    const amount = range[1] - range[0];
    const step = amount / characters.length;

    return (
        <span className="relative inline-block">
            {characters.map((char, i) => {
                const start = range[0] + (step * i);
                const end = range[0] + (step * (i + 1));
                return (
                    <Char key={i} char={char} progress={progress} range={[start, end]} />
                );
            })}
        </span>
    );
};

interface CharProps {
    char: string;
    progress: MotionValue<number>;
    range: [number, number];
}

const Char = ({ char, progress, range }: CharProps) => {
    const color = useTransform(progress, range, ['#373737', '#CDCDCD']);
    return (
        <motion.span style={{ color }}>
            {char}
        </motion.span>
    );
};
