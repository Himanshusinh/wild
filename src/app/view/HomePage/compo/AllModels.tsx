"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Cpu, Sparkles, Wand2, Zap, Play, Image as ImageIcon } from "lucide-react";

const MODELS = [
    {
        id: "google/nano-banana-pro",
        name: "Nano Banana Pro",
        description: "High-quality 2K/4K image generation with extreme detail.",
        type: "image",
        icon: <Sparkles className="w-5 h-5 text-blue-400" />,
        color: "from-blue-600/20 to-cyan-600/20",
        href: "/text-to-image?model=google/nano-banana-pro"
    },
    {
        id: "openai/gpt-image-1.5",
        name: "GPT Image 1.5",
        description: "Versatile image generation powered by GPT-like instruction following.",
        type: "image",
        icon: <Wand2 className="w-5 h-5 text-purple-400" />,
        color: "from-purple-600/20 to-pink-600/20",
        href: "/text-to-image?model=openai/gpt-image-1.5"
    },
    {
        id: "seedream-4.5",
        name: "Seedream v4.5",
        description: "The latest evolution in cinematic quality image synthesis.",
        type: "image",
        icon: <ImageIcon className="w-5 h-5 text-emerald-400" />,
        color: "from-emerald-600/20 to-teal-600/20",
        href: "/text-to-image?model=seedream-4.5"
    },
    {
        id: "new-turbo-model",
        name: "z-image-turbo",
        description: "Standard quality image generation at high speed.",
        type: "image",
        icon: <Zap className="w-5 h-5 text-yellow-400" />,
        color: "from-yellow-600/20 to-orange-600/20",
        href: "/text-to-image?model=new-turbo-model"
    },
    {
        id: "flux-2-pro",
        name: "Flux 2 Pro",
        description: "Professional grade image generation with high detail.",
        type: "image",
        icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
        color: "from-indigo-600/20 to-purple-600/20",
        href: "/text-to-image?model=flux-2-pro"
    },
    {
        id: "veo3.1-t2v-8s",
        name: "Google Veo 3.1",
        description: "State-of-the-art video generation from Google.",
        type: "video",
        icon: <Play className="w-5 h-5 text-orange-400" />,
        color: "from-orange-600/20 to-red-600/20",
        href: "/text-to-video?model=veo3.1-t2v-8s"
    },
    {
        id: "seedance-1.0-pro-fast-t2v",
        name: "Seedance Pro Fast",
        description: "Ultra-fast professional video generation.",
        type: "video",
        icon: <Zap className="w-5 h-5 text-yellow-400" />,
        color: "from-yellow-600/20 to-orange-600/20",
        href: "/text-to-video?model=seedance-1.0-pro-fast-t2v"
    },
    {
        id: "sora2-pro-t2v",
        name: "Sora 2 Pro",
        description: "Premium high-fidelity video generation.",
        type: "video",
        icon: <Cpu className="w-5 h-5 text-indigo-400" />,
        color: "from-indigo-600/20 to-blue-600/20",
        href: "/text-to-video?model=sora2-pro-t2v"
    },
    {
        id: "gen4_turbo",
        name: "Runway Gen 4",
        description: "The next generation of video creativity tools.",
        type: "video",
        icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
        color: "from-cyan-600/20 to-blue-600/20",
        href: "/text-to-video?model=gen4_turbo"
    },
    {
        id: "wan-2.5-t2v",
        name: "Wan 2.5",
        description: "Advanced video generation with smooth motion.",
        type: "video",
        icon: <Play className="w-5 h-5 text-rose-400" />,
        color: "from-rose-600/20 to-pink-600/20",
        href: "/text-to-video?model=wan-2.5-t2v"
    },
    {
        id: "seedance-1.0-lite-t2v",
        name: "Seedance Lite",
        description: "Fast and efficient video generation.",
        type: "video",
        icon: <Zap className="w-5 h-5 text-lime-400" />,
        color: "from-lime-600/20 to-emerald-600/20",
        href: "/text-to-video?model=seedance-1.0-lite-t2v"
    }
];

const AllModels = () => {
    return (
        <section className="desktop:px-10 tablet:px-16 px-6 py-6 md:py-10">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-medium text-white mb-0">Get started with</h2>
                    <p className="text-zinc-400 text-sm">Choose a model to start creating instantly</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 desktop:grid-cols-5 gap-4">
                {MODELS.map((model) => (
                    <Link
                        key={model.id}
                        href={model.href}
                        className="group relative isolate flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-800/60 hover:border-white/20 active:scale-[0.98]"
                    >
                        {/* Background Glow */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${model.color} opacity-0 transition-opacity group-hover:opacity-100 -z-10`} />

                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                                {model.icon}
                            </div>
                            <div className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-medium uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                {model.type}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-semibold text-white mb-0.5 flex items-center gap-2">
                                {model.name}
                                <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                            </h3>
                            <p className="text-xs text-zinc-500 line-clamp-1 group-hover:text-zinc-400">
                                {model.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default AllModels;
