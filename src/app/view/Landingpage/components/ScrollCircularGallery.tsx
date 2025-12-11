'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface GalleryItem {
    image: string;
    text?: string;
}

interface ScrollCircularGalleryProps {
    items: GalleryItem[];
    radius?: number;
}

export default function ScrollCircularGallery({
    items,
}: ScrollCircularGalleryProps) {
    return (
        <div className="py-20 px-4 md:px-8">
            {/* Modern Bento Grid Showcase */}
            <div className="mx-auto max-w-[1600px]">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
                >
                    {items.map((item, index) => (
                        <FeatureCard key={index} item={item} index={index} />
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

function FeatureCard({ item, index }: { item: GalleryItem; index: number }) {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{
                y: -12,
                scale: 1.02,
            }}
            transition={{
                duration: 0.1,
                ease: "easeOut",
            }}
            className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-black/50 backdrop-blur-xl shadow-2xl hover:shadow-purple-500/20 hover:shadow-2xl hover:border-purple-500/30 transition-all duration-100"
            style={{
                transformStyle: "preserve-3d",
            }}
        >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-100 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />

            {/* Shine effect on hover */}
            <motion.div
                className="absolute inset-0 z-20 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.1 }}
                style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), transparent 60%)',
                }}
            />

            {/* Image with parallax effect */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        scale: isHovered ? 1.08 : 1,
                    }}
                    transition={{
                        duration: 0.15,
                        ease: "easeOut",
                    }}
                    className="w-full h-full"
                >
                    <Image
                        src={item.image}
                        alt={item.text || `Feature ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </motion.div>

                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            </div>

            {/* Content */}
            {item.text && (
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-30">
                    <motion.div
                        animate={{
                            y: isHovered ? -4 : 0,
                        }}
                        transition={{
                            duration: 0.1,
                            ease: "easeOut",
                        }}
                    >
                        <h3 className="text-white font-bold text-lg md:text-xl bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text drop-shadow-2xl">
                            {item.text}
                        </h3>
                    </motion.div>

                    {/* Hover indicator */}
                    <motion.div
                        className="mt-2 flex items-center gap-2 text-sm text-white/60"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                            opacity: isHovered ? 1 : 0,
                            x: isHovered ? 0 : -10,
                        }}
                        transition={{ duration: 0.1 }}
                    >
                        <span>Explore</span>
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                        </svg>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
