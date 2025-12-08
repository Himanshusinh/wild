'use client';

import React, { useState, useEffect } from 'react';
import { Hexagon, Zap, Layers, Box } from 'lucide-react';
import { TabButton } from './components/ui/TabButton';
import { LandingView } from './components/views/LandingView';
import { ProjectsView } from './components/views/ProjectsView';
import { TemplatesView } from './components/views/TemplatesView';
import FooterNew from '../view/core/FooterNew';

/**
 * WILD CANVAS - Premium AI Creative Suite
 * Design Philosophy: Deep Black, Electric Blue (#60a5fa) Accents, Cinematic Bento Grids.
 */

export default function App() {
    const [activeTab, setActiveTab] = useState('landing');
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const renderView = () => {
        switch (activeTab) {
            case 'projects': return <ProjectsView />;
            case 'templates': return <TemplatesView />;
            default: return <LandingView setActiveTab={setActiveTab} />;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#60a5fa] selection:text-white overflow-x-hidden pl-20">

            {/* --- Ambient Background Effects (Blue Theme) --- */}
            <div className="fixed inset-0 pointer-events-none z-0 left-20">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
                {/* Abstract Grid */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(96, 165, 250, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 165, 250, 0.03) 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}></div>
                {/* Deep Blue Glows */}
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/[0.05] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/[0.05] rounded-full blur-[100px]" />
            </div>

            {/* --- Floating "Dock" Navigation --- */}
            <div className="fixed top-24 left-[calc(50%+2.5rem)] -translate-x-1/2 z-50">
                {/* <nav className="p-1.5 bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] flex items-center gap-1"> */}
                {/* <TabButton isActive={activeTab === 'landing'} onClick={() => setActiveTab('landing')} label="WildCanvas" icon={<Zap size={14} />} /> */}
                {/* <div className="w-px h-4 bg-white/10 mx-1"></div> */}
                {/* <TabButton isActive={activeTab === 'projects'} onClick={() => setActiveTab('projects')} label="My Projects" icon={<Layers size={14} />} /> */}
                {/* <TabButton isActive={activeTab === 'templates'} onClick={() => setActiveTab('templates')} label="Templates" icon={<Box size={14} />} /> */}
                {/* </nav> */}
            </div>

            {/* --- Main Content --- */}
            <main className="relative z-10  pb-32 px-6 min-h-screen">
                <div className="max-w-[1400px] mx-auto">
                    {renderView()}
                </div>
            </main>

            <FooterNew />
        </div>
    );
}
