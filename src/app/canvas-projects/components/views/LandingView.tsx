import React from 'react';
import { ArrowUpRight, Play, Hexagon, Sparkles, Grid, Box, Share2 } from 'lucide-react';
import { NodeCard } from '../ui/NodeCard';
import { BentoCard } from '../ui/BentoCard';
import { ModelItem } from '../ui/ModelItem';
import { WorkflowVisualizer } from '../features/WorkflowVisualizer';
import { InteractiveFeatureNodeGraph } from '../features/InteractiveFeatureNodeGraph';

interface LandingViewProps {
    setActiveTab: (tab: string) => void;
}

export function LandingView({ setActiveTab }: LandingViewProps) {
    return (
        <div className="flex flex-col items-center animate-in fade-in duration-700 slide-in-from-bottom-4">

            {/* Hero */}
            <div className="text-center  mx-auto mt-12 ">
                <div className="inline-flex items-center gap-2 border border-[#60a5fa]/30 bg-[#60a5fa]/10 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest text-[#60a5fa] mb-8 shadow-[0_0_10px_rgba(96,165,250,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse"></span>
                    Beta v1.0
                </div>
                <h1 className="text-6xl md:text-8xl font-medium tracking-tight text-white mb-8 leading-[0.95]">
                    The operating system <br />
                    <span className="text-slate-500">for creative intelligence.</span>
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Everything - text, image, and video - on one unified canvas.
                </p>
                <div className="mt-12 flex items-center justify-center gap-4">
                    <button onClick={() => setActiveTab('')} className="group relative px-8 py-4 bg-white text-black rounded-full text-base font-semibold overflow-hidden transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        <span className="relative z-10 flex items-center gap-2">Launching Soon<ArrowUpRight size={18} /></span>
                        <div className="absolute inset-0 bg-[#60a5fa] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                    </button>
                    {/* <button className="px-8 py-4 bg-[#111] border border-white/10 text-white rounded-full text-base font-medium hover:bg-[#222] transition-colors flex items-center gap-2">
                        <Play size={16} fill="currentColor" /> Watch Demo
                    </button> */}
                </div>
            </div>

            {/* --- NODE WORKFLOW VISUALIZER (3-Step) --- */}
            <WorkflowVisualizer />

            {/* --- NEW SECTION: INTERACTIVE FEATURE HUB (Weavy Style) --- */}
            <InteractiveFeatureNodeGraph />

            {/* --- PREMIUM MODEL GRID --- */}


            {/* Feature Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12">
                <BentoCard title="Infinite Canvas" subtitle="Spatial Organization" icon={<Grid size={20} />} bg="bg-gradient-to-b from-[#111] to-[#000]" />
                <BentoCard title="50+ Models" subtitle="Unified API Access" icon={<Box size={20} />} bg="bg-gradient-to-b from-[#111] to-[#000]" />
                <BentoCard title="Team Sync" subtitle="Coming Soon" icon={<Share2 size={20} />} bg="bg-gradient-to-b from-[#111] to-[#000]" />
            </div>
        </div>
    );
}
