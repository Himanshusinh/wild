'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hexagon, Zap, Layers, Box } from 'lucide-react';
import { TabButton } from './components/ui/TabButton';
import { LandingView } from './components/views/LandingView';
import { ProjectsView } from './components/views/ProjectsView';
import { TemplatesView } from './components/views/TemplatesView';
import FooterNew from '../view/core/FooterNew';
import SidePannelFeatures from '../view/Generation/Core/SidePannelFeatures';

/**
 * WILD CANVAS - Premium AI Creative Suite
 * Design Philosophy: Deep Black, Electric Blue (#60a5fa) Accents, Cinematic Bento Grids.
 */

export default function App() {
    const [activeTab, setActiveTab] = useState('landing');
    const [isScrolled, setIsScrolled] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    // Check authentication status
    useEffect(() => {
        try {
            const hasSessionCookie = document.cookie.split(';').some(c => c.trim().startsWith('app_session='));
            const hasLocalAuth = Boolean(localStorage.getItem('authToken') || localStorage.getItem('user'));
            setIsAuthenticated(hasSessionCookie || hasLocalAuth);
        } catch {
            setIsAuthenticated(false);
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const renderView = () => {
        switch (activeTab) {
            case 'projects': 
                return isAuthenticated ? <ProjectsView /> : renderUnauthenticatedView();
            case 'templates': 
                return <TemplatesView />;
            default: 
                return <LandingView setActiveTab={setActiveTab} isAuthenticated={isAuthenticated} />;
        }
    };

    const renderUnauthenticatedView = () => (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Sign in to View Your Projects
            </h2>
            <p className="text-gray-400 mb-8 max-w-md">
                Create an account or sign in to access your canvas projects and start creating.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => router.push('/view/signup')}
                    className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                >
                    Get Started Free
                </button>
                <button
    onClick={() => router.push('/view/login')}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-lg font-semibold transition-colors"
                >
                    Sign In
                </button>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen bg-black text-white font-sans selection:bg-[#60a5fa] selection:text-white overflow-x-hidden ${isAuthenticated ? 'pl-20' : ''}`}>
            {/* Sidebar for authenticated users */}
            {isAuthenticated && <SidePannelFeatures />}

            {/* --- Ambient Background Effects (Blue Theme) --- */}
            <div className={`fixed inset-0 pointer-events-none z-0 ${isAuthenticated ? 'left-20' : ''}`}>
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
            <div className="flex justify-center pt-24 pb-10 sticky top-0 z-50">
                <nav className="p-1.5 bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] flex items-center gap-1">
                    <TabButton
                        isActive={activeTab === 'landing'}
                        onClick={() => setActiveTab('landing')}
                        label="Wild Studio"
                        icon={<img src="/core/ws_solid.svg" alt="Wild Studio" className="w-[24px] h-[24px]" />}
                    />
                    {isAuthenticated && (
                        <>
                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                            <TabButton isActive={activeTab === 'projects'} onClick={() => setActiveTab('projects')} label="My Projects" icon={<Layers size={14} />} />
                        </>
                    )}
                    {/* <TabButton isActive={activeTab === 'templates'} onClick={() => setActiveTab('templates')} label="Templates" icon={<Box size={14} />} /> */}
                </nav>
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
