'use client';

import React, { useRef } from 'react';
import { useScroll, useTransform, motion, MotionValue } from 'framer-motion';

interface ScrollColorRevealSectionProps {
    children: React.ReactNode;
    containerClassName?: string;
    textClassName?: string;
}

export default function ScrollColorRevealSection({
    children,
    containerClassName = "",
    textClassName = "",
}: ScrollColorRevealSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    // Extract text content from children to count total characters for sequential animation
    // We expect children to be passed as individual ScrollColorReveal-like blocks or just text
    // Let's assume children is a list of strings or elements containing strings.

    const sentences: string[] = [];
    React.Children.forEach(children, (child) => {
        if (typeof child === 'string') {
            sentences.push(child);
        } else if (React.isValidElement(child)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const props = child.props as any;
            if (props.children) {
                if (typeof props.children === 'string') {
                    sentences.push(props.children);
                } else if (Array.isArray(props.children)) {
                    sentences.push(props.children.join(''));
                }
            }
        }
    });

    return (
        <div ref={containerRef} className={`relative h-[300vh] ${containerClassName}`}>
            <div className="sticky top-0 h-screen flex flex-col items-center justify-center">
                <div className={`flex flex-col items-center gap-8 ${textClassName}`}>
                    {sentences.map((sentence, sIdx) => {
                        const sentenceWords = sentence.split(' ');
                        return (
                            <p key={sIdx} className="flex flex-wrap justify-center gap-x-[0.2em] text-center">
                                {sentenceWords.map((word, wIdx) => {
                                    // Calculate global index for this word
                                    let previousWordsCount = 0;
                                    for (let i = 0; i < sIdx; i++) {
                                        previousWordsCount += sentences[i].split(' ').length;
                                    }

                                    const totalWords = sentences.reduce((acc, curr) => acc + curr.split(' ').length, 0);
                                    const globalWordIndex = previousWordsCount + wIdx;

                                    const start = globalWordIndex / totalWords;
                                    const end = start + (1 / totalWords);

                                    return (
                                        <Word key={`${sIdx}-${wIdx}`} word={word} progress={scrollYProgress} range={[start, end]} />
                                    );
                                })}
                            </p>
                        );
                    })}
                </div>
            </div>
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
