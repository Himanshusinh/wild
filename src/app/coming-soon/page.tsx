"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Squares from "../view/core/Squares";

const ComingSoonPage: React.FC = () => {
    const router = useRouter();

    return (
        <div className="relative w-full min-h-screen bg-[#07070B] overflow-hidden flex flex-col">
            {/* Background Effect */}
            <div className="absolute inset-0 z-0">
                <Squares
                    direction="diagonal"
                    speed={0.5}
                    squareSize={40}
                    borderColor="#333"
                    hoverFillColor="#222"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07070B]/50 to-[#07070B]" />
            </div>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-center relative z-10 px-6 py-32 text-center">
                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {/* Badge */}
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 text-sm font-medium mb-4">
                        <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                        Under Maintenance
                    </div>

                    {/* Heading */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white">
                        <span className="block italic font-serif text-blue-500/90 mb-2">Coming <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                            Soon
                        </span> </span>

                    </h1>

                    {/* Subtext */}
                    <p className="text-lg md:text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                        We are currently under maintenance. We will be back shortly with something amazing.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <button
                            onClick={() => router.back()}
                            className="group flex items-center gap-2 px-10 py-4 rounded-full border border-white/10 bg-white/5 text-white font-semibold transition-all hover:bg-white/10 hover:border-white/20"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            Go Back
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ComingSoonPage;
