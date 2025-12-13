"use client";

import React from 'react';
import { Type, Cpu, Film, Upload, Zap, Video } from 'lucide-react';

const VideoGenerationGuide = () => {
    const steps = [
        {
            stepNumber: 1,
            title: "Type Your Prompt",
            description: "Describe the video you want to generate. Be creative and detailed! ",
            description2: "You can also upload reference images or videos (optional) for ",
            icons: [Type],
            iconColors: ["text-[#60a5fa]", "text-[#6366f1]"],
            glowColor: "rgba(96, 165, 250, 0.3)",
            borderColor: "border-[#60a5fa]/50",
            bgGradient: "from-blue-500/10 to-indigo-500/5",
            hasBackgroundImage: true,
            backgroundImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
        },
        {
            stepNumber: 2,
            title: "Configure Parameters",
            description: "Choose your model, set the aspect ratio, duration, resolution, and quality. Customize these settings to match your creative vision.",
            icons: [Cpu, Film, Video],
            iconColors: ["text-[#a855f7]", "text-[#f59e0b]", "text-[#10b981]"],
            glowColor: "rgba(168, 85, 247, 0.3)",
            borderColor: "border-[#a855f7]/50",
            bgGradient: "from-purple-500/10 to-pink-500/5",
            hasBackgroundImage: true,
            backgroundImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
        },
        {
            stepNumber: 3,
            title: "Generate",
            description: "Click the Generate button to create your AI video. Watch as your prompt comes to life!",
            icons: [Zap],
            iconColors: ["text-[#60a5fa]"],
            glowColor: "rgba(96, 165, 250, 0.3)",
            borderColor: "border-[#60a5fa]/50",
            bgGradient: "from-blue-500/10 to-cyan-500/5",
            hasBackgroundImage: true,
            backgroundImage: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=1000&auto=format&fit=crop",
        },
    ];

    return (
        <div className="relative flex flex-col items-center justify-center md:h-[50vh] h-full md:max-h-[90vh] z-0 overflow-y-auto md:px-4 px-0 md:pb-0 pb-40 md:mb-0">
            {/* Ambient Background Effects (Blue Theme) - matching wildcanvas */}
            <div className="absolute inset-0 pointer-events-none z-0">
                
            </div>

            <div className="relative z-10 md:max-w-7xl px-2 max-w-full w-full md:space-y-8 space-y-0">
                {/* Header */}
                <div className="text-center md:space-y-4 space-y-1 ">
                    <h2 className="text-xl md:text-4xl font-medium md:tracking-tight text-white">
                        Create Your First AI Video
                    </h2>
                    <p className="text-slate-400 text-md md:text-xl max-w-auto md:mx-auto md:leading-relaxed">
                        Follow these simple steps to generate stunning videos with WildMind AI. 
                    </p>
                </div>

                {/* Steps Grid - 3 Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-8">
                    {steps.map((step, index) => {
                        return (
                            <div
                                key={index}
                                className={`relative group rounded-xl md:p-8 p-4 border border-white/5 transition-all duration-300 hover:scale-105 overflow-hidden ${!step.hasBackgroundImage ? 'bg-[#0A0A0A]' : ''}`}
                                style={{
                                    boxShadow: `0 0 0 0 ${step.glowColor}`,
                                    borderColor: 'rgba(255, 255, 255, 0.05)',
                                } as React.CSSProperties}
                                onMouseEnter={(e) => {
                                    const color = step.glowColor;
                                    e.currentTarget.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}40, 0 0 60px ${color}20`;
                                    e.currentTarget.style.borderColor = step.glowColor.replace('0.3', '0.5');
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = `0 0 0 0 ${step.glowColor}`;
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                }}
                            >
                                {/* Background Image for All Steps */}
                                {step.hasBackgroundImage && step.backgroundImage && (
                                    <>
                                        <div
                                            className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity duration-300 blur-xs"
                                            style={{
                                                backgroundImage: `url(${step.backgroundImage})`,
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-[#0A0A0A]/0 group-hover:bg-[#0A0A0A]/30 transition-colors duration-300" />
                                    </>
                                )}

                                {/* Glow Background Effect - only if no background image */}
                                {!step.hasBackgroundImage && (
                                    <div className={`absolute inset-0 bg-gradient-to-br ${step.bgGradient} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                                )}

                                {/* Outer Glow Ring */}
                                <div
                                    className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300 pointer-events-none"
                                    style={{
                                        background: `radial-gradient(circle, ${step.glowColor}80, transparent 70%)`,
                                    }}
                                />

                                {/* Step Number */}
                                <div className="relative md:-top-5 md:-left-5 -top-3 -left-3 w-8 h-8 md:w-10 md:h-10 bg-transparent backdrop-blur rounded-full flex items-center justify-center border border-white/5 ring-black z-50 group-hover:border-white/20 transition-colors">
                                    <span className="text-white text-base font-bold">{step.stepNumber}</span>
                                </div>

                                {/* Content */}
                                <h3
                                    className="text-white font-medium md:text-xl text-md md:mb-3 mb-0 transition-colors relative z-10"
                                    style={{
                                        color: 'white',
                                    }}
                                    onMouseEnter={(e) => {
                                        const mainColor = step.glowColor.includes('96, 165, 250') ? '#60a5fa' :
                                            step.glowColor.includes('168, 85, 247') ? '#a855f7' : '#60a5fa';
                                        e.currentTarget.style.color = mainColor;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'white';
                                    }}
                                >
                                    {step.title}
                                </h3>
                                <p className="text-slate-200 md:text-sm text-xs font-thin leading-relaxed relative z-10">
                                    {step.description} <br />
                                    {step.description2 && (
                                        <span className="text-slate-200 md:text-sm text-xs leading-relaxed relative z-10">
                                            {step.description2} <span className="text-slate-300 text-sm leading-relaxed relative z-10 font-extrabold">Image-to-Video or Video-to-Video generation.</span>
                                        </span>
                                    )}
                                </p>

                                {/* Generate Button for Step 3 */}
                                {step.stepNumber === 3 && (
                                    <div className="mt-6 relative z-10">
                                        <button className="w-full px-4 md:px-6 py-2 md:py-4 text-base md:text-base text-sm bg-white text-black rounded-full font-semibold overflow-hidden transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)] group/btn relative">
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                <Zap size={18} className="text-black" />
                                                Generate
                                            </span>
                                            <div className="absolute inset-0 bg-[#60a5fa] translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-300 ease-out"></div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default VideoGenerationGuide;

