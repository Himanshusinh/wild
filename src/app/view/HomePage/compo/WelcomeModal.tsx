'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Small delay for smooth animation
            const timer = setTimeout(() => setIsVisible(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70  z-[100] flex items-center justify-center p-4">
            <div
                className={`relative w-full max-w-5xl lg:h-auto md:h-[90vh] pb-6 bg-white/90 dark:bg-[#1c303d]/30 backdrop-blur-3xl border border-black/20 dark:border-white/20 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200"
                >
                    <X className="w-4 h-4 text-gray-600" />
                </button>

                {/* Header */}
                <div className=" p-4 text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">Welcome to WildMind Ai</h1>
                    <p className="text-white text-md leading-relaxed">
                        We're thrilled to have you here. Wild Mind is your all-in-one AI solutions platform designed to transform your creative vision into reality—whether you're a student exploring ideas, a professional crafting content, or a business building your brand.
                    </p>
                </div>

                {/* Content */}
                <div className=" px-6 py-2">
                    {/* Features Section */}
                    <div className="mb-0">
                        <h2 className="text-lg font-base text-white mb-2">
                            Here's what you can create with us:
                        </h2>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-start  px-3  rounded-lg ">
                                {/* <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold text-sm">AI</span>
                </div> */}
                                <div>
                                    <h3 className="font-base text-white mb-1">AI Image Generation - Text to image, image to image, advanced editing canvas, and more.</h3>
                                </div>
                            </div>

                            <div className="flex items-start  px-3  rounded-lg ">
                                {/* <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-600 font-semibold text-sm">AI</span>
                </div> */}
                                <div>
                                    <h3 className="font-base text-white mb-1">AI Video Generation - Bring concepts to life with text to video, subject animations, and video transformations.</h3>
                                </div>
                            </div>

                            <div className="flex items-start  px-3  rounded-lg ">
                                {/* <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-green-600 font-semibold text-sm">AI</span>
                </div> */}
                                <div>
                                    <h3 className="font-base text-white ">AI Music & Audio - Generate original soundtracks and audio from text or existing tracks.</h3>
                                </div>
                            </div>

                            <div className="flex items-start  px-3  rounded-lg ">
                                {/* <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-pink-600 font-semibold text-sm">AI</span>
                </div> */}
                                <div>
                                    <h3 className="font-base text-white mb-1">Branding Tools - Create mockups, product visualizations with models, and complete branding kits tailored to your needs.</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Differentiator Section */}
                    <div className="mb-2  rounded-lg ">
                        <p className="text-md font-base text-white mb-2 px-1">
                            What makes Wild Mind different? Everything you need is here! No juggling multiple subscriptions or platforms. We've combined the best AI models in the market with flexible, usage-based pricing that scales with you. From quick experiments to large-scale projects, you're in control.
                        </p>
                    </div>

                    {/* Call to Action */}
                    <div className="text-left">
                        <h3 className="text-md font-base text-white mb-2">Ready to turn your imagination into reality? Explore our tools, push creative boundaries, and discover what's possible when innovation meets affordability. Your next breakthrough is just a click away.</h3>

                        <div className=" text-white  py-3 rounded-lg font-base text-md inline-block mb-2">
                            Turn your Imagination into Existence, NOW!
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className=" py-0">
                    <div className="text-left px-6">
                        <div className="text-white font-semibold mb-1">Wild Mind AI</div>
                        <div className="text-white/80 text-md">By Wild Child Studios</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeModal;
