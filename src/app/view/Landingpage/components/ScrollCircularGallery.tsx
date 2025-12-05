'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import Image from 'next/image';
import { getImageUrl } from "@/routes/imageroute";

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
    radius = 550 // Reduced radius to fit all 5 images in viewport
}: ScrollCircularGalleryProps) {
    const rotation = useMotionValue(0);
    const tilt = useMotionValue(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const logoUrl = getImageUrl("core", "logo");

    // Auto-rotate
    useAnimationFrame((time, delta) => {
        const currentRotation = rotation.get();
        // Rotate slowly (adjust speed by changing divisor)
        rotation.set(currentRotation + delta * 0.01);
    });

    const handlePan = (event: any, info: any) => {
        // Horizontal drag -> Y-axis rotation
        const currentRotation = rotation.get();
        rotation.set(currentRotation + info.delta.x / 5);

        // Vertical drag -> X-axis tilt (clamped between -45 and 45)
        const currentTilt = tilt.get();
        const newTilt = currentTilt - info.delta.y / 5; // Invert Y for natural feel
        if (newTilt >= -45 && newTilt <= 45) {
            tilt.set(newTilt);
        }
    };

    return (
        <div
            ref={containerRef}
            className="h-[90vh] relative flex items-center justify-center overflow-hidden perspective-[2000px] cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => e.preventDefault()} // Prevent text selection
        >
            <div className="relative h-full w-full flex items-center justify-center overflow-hidden perspective-[2000px]">
                <motion.div
                    style={{
                        rotateY: rotation, // Rotate based on drag
                        rotateX: tilt, // Tilt based on drag
                        transformStyle: 'preserve-3d',
                    }}
                    onPan={handlePan}
                    className="relative flex items-center justify-center w-full h-full"
                >
                    {/* Center 3D Logo */}
                    {logoUrl && (
                        <div
                            className="absolute flex items-center justify-center transform-style-3d"
                            style={{
                                transform: 'translateZ(0px)',
                            }}
                        >
                            <div className="relative w-32 h-32">
                                <Image
                                    src={logoUrl}
                                    alt="WildMind Logo"
                                    fill
                                    className="object-contain drop-shadow-2xl"
                                    priority
                                />
                            </div>
                        </div>
                    )}

                    {items.map((item, index) => {
                        const angle = (index / items.length) * 360;

                        return (
                            <div
                                key={index}
                                className="absolute"
                                style={{
                                    transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                                    transformStyle: 'preserve-3d',
                                }}
                            >
                                <div className="w-[330px] h-[230px] relative rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/50 backdrop-blur-sm transform transition-transform duration-300">
                                    <Image
                                        src={item.image}
                                        alt={item.text || `Gallery item ${index}`}
                                        fill
                                        className="object-cover"
                                    />
                                    {item.text && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <p className="text-black font-bold text-3xl text-center px-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.5)' }}>
                                                {item.text}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}
