import React from 'react';
import {
    ArrowUpRight, Image as ImageIcon, Film, MessageSquare,
    Layers, Type, Users, Zap, Cpu, Infinity,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { WorkflowVisualizer } from '../features/WorkflowVisualizer';
import { InteractiveFeatureNodeGraph } from '../features/InteractiveFeatureNodeGraph';

interface LandingViewProps {
    setActiveTab: (tab: string) => void;
    isAuthenticated?: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
    {
        icon: <ImageIcon size={17} />,
        title: 'Image Generation',
        desc: 'Create stunning visuals with Flux, DALL·E, Stable Diffusion and 20+ more models.',
        glow: 'rgba(139,92,246,0.08)',
        accent: '#a78bfa',
        border: 'rgba(139,92,246,0.12)',
    },
    {
        icon: <Film size={17} />,
        title: 'Video Creation',
        desc: 'Animate images and generate clips with Runway, Kling, Pika and more.',
        glow: 'rgba(59,130,246,0.08)',
        accent: '#60a5fa',
        border: 'rgba(59,130,246,0.12)',
    },
    {
        icon: <MessageSquare size={17} />,
        title: 'AI Chat Companion',
        desc: 'A creative copilot that understands your canvas and helps you iterate fast.',
        glow: 'rgba(20,184,166,0.08)',
        accent: '#2dd4bf',
        border: 'rgba(20,184,166,0.12)',
    },
    {
        icon: <Layers size={17} />,
        title: 'Infinite Canvas',
        desc: 'Spatial, node-based organisation for every idea, draft, and final piece.',
        glow: 'rgba(99,102,241,0.08)',
        accent: '#818cf8',
        border: 'rgba(99,102,241,0.12)',
    },
    {
        icon: <Type size={17} />,
        title: 'Rich Text Tools',
        desc: 'Write, edit, and format content with AI right on the canvas surface.',
        glow: 'rgba(52,211,153,0.08)',
        accent: '#34d399',
        border: 'rgba(52,211,153,0.12)',
    },
    {
        icon: <Users size={17} />,
        title: 'Team Collaboration',
        desc: 'Share canvases, accept invitations, and build together in one place.',
        glow: 'rgba(244,114,182,0.08)',
        accent: '#f472b6',
        border: 'rgba(244,114,182,0.12)',
        badge: 'Soon',
    },
];

const STATS = [
    { value: '50+', label: 'AI Models', icon: <Cpu size={14} /> },
    { value: '4', label: 'Modalities', icon: <Zap size={14} /> },
    { value: '∞', label: 'Canvas Size', icon: <Infinity size={14} /> },
    { value: '12+', label: 'Tools', icon: <Layers size={14} /> },
];

const MODEL_TAGS = [
    'Flux Pro', 'DALL·E 3', 'Runway Gen-3', 'Kling', 'ElevenLabs', 'GPT-4o', 'Claude 3.5', 'Pika', 'Midjourney',
];

// ─── Component ────────────────────────────────────────────────────────────────
export function LandingView({ setActiveTab, isAuthenticated = false }: LandingViewProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center animate-in fade-in duration-700 w-full">

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <section className="relative w-full flex flex-col items-center text-center pt-10 pb-24 overflow-hidden">
                {/* Background glow orbs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/[0.06] rounded-full blur-[120px]" />
                    <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-violet-600/[0.05] rounded-full blur-[100px]" />
                    <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-cyan-600/[0.04] rounded-full blur-[100px]" />
                </div>

                {/* Badge */}
                <div className="relative inline-flex items-center gap-2 border border-[#60a5fa]/25 bg-[#60a5fa]/[0.07] rounded-full px-3.5 py-1 text-[10px] uppercase tracking-[0.15em] text-[#60a5fa] mb-8 shadow-[0_0_20px_rgba(96,165,250,0.1)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />
                    Beta v1.0 &mdash; Now Available
                </div>

                {/* Headline */}
                <h1 className="relative text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight leading-[0.92] max-w-4xl">
                    <span className="text-white">The operating system</span>
                    <br />
                    <span
                        className="inline-block mt-2"
                        style={{
                            background: 'linear-gradient(90deg, #94a3b8 0%, #64748b 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        for creative intelligence.
                    </span>
                </h1>

                {/* Subheading */}
                <p className="relative text-lg md:text-xl text-slate-500 max-w-xl mx-auto mt-8 leading-relaxed">
                    Generate images, animate videos, and write with AI — all unified on one infinite canvas.
                </p>

                {/* CTAs */}
                <div className="relative mt-10 flex items-center justify-center gap-3">
                    {isAuthenticated ? (
                        <button
                            onClick={() => setActiveTab('projects')}
                            className="group relative flex items-center gap-2 px-7 py-3.5 bg-white text-black rounded-full text-sm font-semibold overflow-hidden transition-all hover:scale-[1.03] shadow-[0_8px_30px_rgba(255,255,255,0.1)]"
                        >
                            <span className="relative z-10 flex items-center gap-2">Open My Projects <ArrowUpRight size={15} /></span>
                            <div className="absolute inset-0 bg-[#60a5fa] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => router.push('/view/signup')}
                                className="group relative flex items-center gap-2 px-7 py-3.5 bg-white text-black rounded-full text-sm font-semibold overflow-hidden transition-all hover:scale-[1.03] shadow-[0_8px_30px_rgba(255,255,255,0.1)]"
                            >
                                <span className="relative z-10 flex items-center gap-2">Get Started Free <ArrowUpRight size={15} /></span>
                                <div className="absolute inset-0 bg-[#60a5fa] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            </button>
                            <button
                                onClick={() => router.push('/view/login')}
                                className="flex items-center gap-2 px-7 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.10] text-white/70 hover:text-white rounded-full text-sm font-medium transition-all"
                            >
                                Sign In
                            </button>
                        </>
                    )}
                </div>

                {/* Model tags */}
                <div className="relative mt-14 flex flex-wrap items-center justify-center gap-2 max-w-2xl">
                    <span className="text-[11px] text-slate-600 mr-1">Powered by</span>
                    {MODEL_TAGS.map(tag => (
                        <span
                            key={tag}
                            className="inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-500"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </section>

            {/* ── Stats strip ──────────────────────────────────────────────── */}
            <section className="w-full max-w-3xl mx-auto mb-24">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {STATS.map(s => (
                        <div
                            key={s.label}
                            className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-white/[0.05] bg-white/[0.02]"
                        >
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                {s.icon} {s.label}
                            </div>
                            <span className="text-3xl font-medium text-white tracking-tight">{s.value}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Feature grid ─────────────────────────────────────────────── */}
            <section className="w-full mb-6">
                <div className="text-center mb-12">
                    <p className="text-xs uppercase tracking-widest text-slate-600 mb-3">Capabilities</p>
                    <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white">
                        Everything you need<br />
                        <span className="text-slate-500">in one place.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {FEATURES.map(f => (
                        <div
                            key={f.title}
                            className="relative group p-6 rounded-2xl border bg-[#050508] transition-all duration-300 hover:scale-[1.01]"
                            style={{ borderColor: f.border, boxShadow: `0 0 0 0 ${f.glow}` }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px 0 ${f.glow}`;
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 0 ${f.glow}`;
                            }}
                        >
                            {/* Glow top-left */}
                            <div
                                className="absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{ background: f.glow, transform: 'translate(-30%, -30%)' }}
                            />

                            {/* Icon */}
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 border"
                                style={{ color: f.accent, background: `${f.glow}`, borderColor: f.border }}
                            >
                                {f.icon}
                            </div>

                            {/* Title + badge */}
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                                {f.badge && (
                                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border" style={{ color: f.accent, borderColor: f.border, background: f.glow }}>
                                        {f.badge}
                                    </span>
                                )}
                            </div>

                            {/* Desc */}
                            <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Workflow section (keep existing interactive component) ───── */}
            <WorkflowVisualizer />

            {/* ── Feature nodes section (keep existing interactive component) */}
            <InteractiveFeatureNodeGraph />

            {/* ── Final CTA ────────────────────────────────────────────────── */}
            <section className="w-full mt-16 mb-4">
                <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#050508] px-8 py-16 text-center">
                    {/* Background glow */}
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/[0.06] rounded-full blur-[80px]" />
                    </div>

                    <div className="relative">
                        <p className="text-xs uppercase tracking-widest text-slate-600 mb-4">Start creating</p>
                        <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
                            Your canvas is waiting.
                        </h2>
                        <p className="text-slate-500 mb-10 max-w-sm mx-auto text-sm leading-relaxed">
                            Join creators building with the most powerful unified AI creative suite.
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => setActiveTab('projects')}
                                    className="group relative flex items-center gap-2 px-8 py-3.5 bg-white text-black rounded-full text-sm font-semibold overflow-hidden transition-all hover:scale-[1.03]"
                                >
                                    <span className="relative z-10 flex items-center gap-2">Open Projects <ArrowUpRight size={15} /></span>
                                    <div className="absolute inset-0 bg-[#60a5fa] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => router.push('/view/signup')}
                                        className="group relative flex items-center gap-2 px-8 py-3.5 bg-white text-black rounded-full text-sm font-semibold overflow-hidden transition-all hover:scale-[1.03]"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">Create Free Account <ArrowUpRight size={15} /></span>
                                        <div className="absolute inset-0 bg-[#60a5fa] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    </button>
                                    <button
                                        onClick={() => router.push('/view/login')}
                                        className="px-8 py-3.5 border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white rounded-full text-sm font-medium transition-all"
                                    >
                                        Sign In
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
