"use client";

import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    Type,
    ChevronDown,
    Zap,
    Check,
    Command,
    Image as ImageIcon,
    Loader2,
    Box,
    Palette,
    Crop,
    Plus,
    Minus
} from 'lucide-react';

/**
 * WILD CANVAS - Image Gen Workflow (Blue Theme)
 * Matches wildcanvas.tsx styling.
 */

const ImageGenerationGuide = () => {
    const [activeTab, setActiveTab] = useState('image');

    return (
        <section className="h-auto  text-white font-sans selection:bg-[#60a5fa] selection:text-white relative overflow-hidden pt-10 pb-40">

            {/* --- Ambient Background (Matches WildCanvas) --- */}
            {/* <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div> */}
                {/* Abstract Grid */}
                {/* <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(96, 165, 250, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 165, 250, 0.03) 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}></div> */}
                {/* Deep Blue Glows */}
                {/* <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/[0.08] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/[0.08] rounded-full blur-[100px]" />
            </div> */}

            <div className="max-w-[1500px] mx-auto px-6 relative z-10">

                {/* --- Header --- */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 border border-[#60a5fa]/30 bg-[#60a5fa]/10 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest text-[#60a5fa] mb-4 shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse"></span>
                        How To Use
                    </div>
                    <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-4">
                        Create Your First  <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-400 to-slate-600">AI Masterpiece in 3 Steps.</span>
                    </h1>

                    {/* <div className="inline-flex p-1 bg-[#111] border border-white/10 rounded-full gap-1 mt-4">
                        <TabButton active={activeTab === 'image'} onClick={() => setActiveTab('image')} icon={<ImageIcon size={14} />} label="Image Gen" />
                        <TabButton active={activeTab === 'edit'} onClick={() => setActiveTab('edit')} icon={<Palette size={14} />} label="AI Canvas" />
                        <TabButton active={activeTab === 'upscale'} onClick={() => setActiveTab('upscale')} icon={<Box size={14} />} label="Upscale" />
                    </div> */}
                </div>

                {/* --- The 3 Steps Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative">

                    {/* STEP 01: PROMPT + IMG2IMG */}
                    <StepCard
                        number="01"
                        title="Input Stream"
                        desc="Text prompt or Image-to-Image."
                        color="group-hover:text-[#60a5fa]"
                    >
                        <BackgroundDots />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-[60%] z-20">
                            <div className="bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl relative overflow-hidden flex flex-col gap-10">
                                {/* Prompt */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                        <Type size={12} className="text-[#60a5fa]" />
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Prompt</span>
                                    </div>
                                    <div className="h-10 text-sm font-mono text-slate-200 relative leading-relaxed">
                                        <Typewriter text="Avant-garde fashion model, holographic dress, studio lighting..." />
                                        <span className="animate-pulse text-[#60a5fa]">|</span>
                                    </div>
                                </div>
                                {/* Drag Zone */}
                                <ImageDragSimulation />
                            </div>
                        </div>
                    </StepCard>

                    {/* STEP 02: CONFIGURE */}
                    <StepCard
                        number="02"
                        title="Configure Node"
                        desc="Select model, count, and ratio."
                        color="group-hover:text-[#60a5fa]"
                    >
                        <BackgroundDots />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-[55%] z-20">
                            <Step2_ConfigPanel />
                        </div>
                    </StepCard>

                    {/* STEP 03: GENERATE (Specific Image) */}
                    <StepCard
                        number="03"
                        title="Render Output"
                        desc="High-fidelity image synthesis."
                        color="group-hover:text-[#60a5fa]"
                    >
                        <BackgroundDots />
                        <Step3_GenerateProcess />
                    </StepCard>

                </div>

            </div>
        </section>
    );
};

// --- SUB-COMPONENTS ---

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button onClick={onClick} className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${active ? 'bg-[#222] text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            {icon} {label}
        </button>
    );
}

function StepCard({ number, title, desc, children, color }: { number: string; title: string; desc: string; children: React.ReactNode; color: string }) {
    // Determine glow colors based on step number
    const glowGradient = number === "01" 
        ? "from-purple-500/20 to-blue-500/20" 
        : number === "02" 
        ? "from-blue-500/20 to-cyan-500/20" 
        : "from-indigo-500/20 to-purple-500/20";
    
    return (
        <div className={`group relative h-[28rem] md:max-h-[28rem] rounded-3xl bg-[#0A0A0A] border border-white/10 overflow-hidden hover:border-[#60a5fa]/40 transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(96,165,250,0.2)]`}>
            {/* Outline Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${glowGradient} opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-xl pointer-events-none`}></div>
            
            {children}
            <div className="absolute top-2 md:top-2 left-2 md:left-2 w-8 h-8 rounded-full border border-white/10 bg-black/40 backdrop-blur flex items-center justify-center text-xs font-mono font-bold text-white/70 z-20 group-hover:bg-white group-hover:text-black transition-colors">{number}</div>
            <div className="absolute bottom-0 left-0 right-0 h-[35%] p-2 pl-4 flex flex-col justify-end pointer-events-none z-20">
                <h3 className={`text-xl font-medium text-white mb-1 transition-colors ${color}`}>{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function BackgroundDots() {
    return (
        <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
        </div>
    );
}

// --- STEP 1 LOGIC ---
function Typewriter({ text }: { text: string }) {
    const [displayText, setDisplayText] = useState('');
    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) { setDisplayText(prev => prev + text.charAt(i)); i++; }
            else { clearInterval(timer); }
        }, 40);
        return () => clearInterval(timer);
    }, [text]);
    return <span>{displayText}</span>;
}

function ImageDragSimulation() {
    const [dragState, setDragState] = useState(0);
    useEffect(() => {
        const sequence = async () => {
            await new Promise(r => setTimeout(r, 2000));
            setDragState(1); await new Promise(r => setTimeout(r, 1500));
            setDragState(2); await new Promise(r => setTimeout(r, 4000));
            setDragState(0); sequence();
        };
        sequence();
    }, []);

    return (
        <div className="relative h-16 w-full mt-2">
            <div className={`absolute inset-0 border border-dashed rounded-lg flex items-center justify-center transition-all duration-300 ${dragState === 2 ? 'border-[#60a5fa]/50 bg-[#60a5fa]/10' : 'border-white/10 bg-white/5'}`}>
                {dragState === 2 ? (
                    <div className="flex items-center gap-2 animate-in zoom-in-90 duration-300">
                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center"><ImageIcon size={14} className="text-[#60a5fa]" /></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-white">Pose_Ref.jpg</span>
                            <span className="text-[8px] text-[#60a5fa]">Image Attached</span>
                        </div>
                    </div>
                ) : (
                    <span className="text-[10px] text-slate-500">Drop image for Image-to-Image</span>
                )}
            </div>
            <div className="absolute z-50 pointer-events-none transition-all duration-[1500ms] ease-in-out flex items-center justify-center" style={{ right: dragState === 1 ? '50%' : '-50px', top: dragState === 1 ? '50%' : '150%', opacity: dragState === 1 ? 1 : 0, transform: 'translate(50%, -50%)' }}>
                <div className="relative">
                    <div className="w-8 h-8 rounded bg-slate-800 border border-white/20 shadow-xl flex items-center justify-center rotate-6"><ImageIcon size={14} className="text-slate-300" /></div>
                    <div className="absolute -bottom-4 -right-4 w-6 h-6"><svg viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg></div>
                </div>
            </div>
        </div>
    );
}

// --- STEP 2 LOGIC ---
function Step2_ConfigPanel() {
    const [step, setStep] = useState(0);
    const [model, setModel] = useState('Flux 1.1 Pro');
    const [count, setCount] = useState(1);
    const [ratio, setRatio] = useState('Square');

    useEffect(() => {
        const sequence = async () => {
            const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
            setStep(0); setModel('Flux 1.1 Pro'); setCount(1); setRatio('Square'); await wait(1000);

            // 1. Model
            setStep(1); await wait(600); setStep(2); await wait(600); setStep(3); await wait(600);
            setModel('Nano Banana Pro'); setStep(4); await wait(400);

            // 2. Count
            setStep(5); await wait(600); setStep(6); setCount(2); await wait(200); setStep(7); await wait(400);

            // 3. Ratio
            setStep(8); await wait(600); setStep(9); await wait(600); setStep(10); await wait(600);
            setRatio('Portrait 3:4'); setStep(11); await wait(4000);

            sequence();
        };
        sequence();
    }, []);

    const getCursorStyle = (s: number) => {
        let style = { top: '150%', left: '50%', transform: 'scale(1)', opacity: 1 };
        switch (s) {
            case 0: return { ...style, opacity: 0 };
            case 1: return { ...style, top: '25%', left: '90%' };
            case 2: return { ...style, top: '25%', left: '90%', transform: 'scale(0.8)' };
            case 3: return { ...style, top: '65%', left: '50%' };
            case 4: return { ...style, top: '65%', left: '50%', transform: 'scale(0.8)' };
            case 5: return { ...style, top: '55%', left: '42%' };
            case 6: return { ...style, top: '55%', left: '42%', transform: 'scale(0.8)' };
            case 7: return { ...style, top: '55%', left: '42%' };
            case 8: return { ...style, top: '55%', left: '90%' };
            case 9: return { ...style, top: '55%', left: '90%', transform: 'scale(0.8)' };
            case 10: return { ...style, top: '90%', left: '75%' };
            case 11: return { ...style, top: '90%', left: '75%', transform: 'scale(0.8)' };
            default: return { ...style, opacity: 0 };
        }
    };

    const cursorStyle = getCursorStyle(step);

    return (
        <div className="bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2">
            {/* Ghost Cursor */}
            <div className="absolute w-4 h-4 pointer-events-none z-50 transition-all duration-500 ease-in-out drop-shadow-md" style={cursorStyle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>
            </div>

            {/* 1. Model Selector */}
            <div className="relative z-30">
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#050505] border transition-colors ${step === 2 || step === 3 ? 'border-[#60a5fa]' : 'border-white/10'}`}>
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-white/10"><Zap size={10} className="text-white" /></div>
                        <span className="text-xs font-medium text-white">{model}</span>
                    </div>
                    <ChevronDown size={12} className="text-slate-500" />
                </div>
                <div className={`absolute top-full left-0 right-0 mt-1 bg-[#0F0F0F] border border-white/10 rounded-lg overflow-hidden shadow-xl transition-all duration-200 z-50 ${step === 2 || step === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                    <div className="px-3 py-2 text-[10px] text-slate-400 border-b border-white/5">Flux 1.1 Pro</div>
                    <div className={`px-3 py-2 text-[10px] text-white flex justify-between items-center ${step === 3 ? 'bg-[#60a5fa]/20 text-[#60a5fa]' : ''}`}>Nano Banana Pro <Check size={10} className={step === 3 ? 'opacity-100' : 'opacity-0'} /></div>
                </div>
            </div>

            {/* Row: Count + Ratio */}
            <div className="grid grid-cols-2 gap-3 relative z-20">
                <div className="flex items-center justify-between bg-[#050505] border border-white/10 rounded-lg p-1">
                    <button className="p-1.5 rounded text-slate-400"><Minus size={10} /></button>
                    <span className="text-xs font-mono font-bold text-white w-4 text-center">{count}</span>
                    <button className={`p-1.5 rounded text-slate-400 transition-colors ${step === 6 ? 'bg-[#60a5fa] text-black' : ''}`}><Plus size={10} /></button>
                </div>
                <div className="relative">
                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg bg-[#050505] border transition-colors h-full ${step === 9 || step === 10 ? 'border-[#60a5fa]' : 'border-white/10'}`}>
                        <div className="flex items-center gap-2">
                            <Crop size={10} className="text-slate-400" />
                            <span className="text-[10px] font-medium text-white">{ratio}</span>
                        </div>
                        <ChevronDown size={10} className="text-slate-500" />
                    </div>
                    <div className={`absolute top-full left-0 right-0 mt-1 bg-[#0F0F0F] border border-white/10 rounded-lg overflow-hidden shadow-xl transition-all duration-200 z-50 ${step === 9 || step === 10 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                        <div className="px-3 py-2 text-[10px] text-slate-400 border-b border-white/5">Square (1:1)</div>
                        <div className={`px-3 py-2 text-[10px] text-white flex justify-between items-center ${step === 10 ? 'bg-[#60a5fa]/20 text-[#60a5fa]' : ''}`}>Portrait (3:4)</div>
                        <div className="px-3 py-2 text-[10px] text-slate-400">Wide (16:9)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- STEP 3 LOGIC ---
function Step3_GenerateProcess() {
    const [genState, setGenState] = useState(0);

    useEffect(() => {
        const sequence = async () => {
            const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
            setGenState(0); await wait(1000);
            setGenState(1); await wait(800);
            setGenState(2); await wait(200);
            setGenState(3); await wait(2000);
            setGenState(4); await wait(4000);
            sequence();
        };
        sequence();
    }, []);

    return (
        <>
            <div className="absolute inset-0 h-[60%] md:max-h-[60%] overflow-hidden ">
                {/* Result Image */}
                <div className={`absolute inset-0 z-10 transition-opacity duration-1000 ${genState === 4 ? 'opacity-100' : 'opacity-0'}`}>
                    <img 
                        src="https://www.wildmindai.com/api/proxy/media/users%2Fwildchild%2Fimage%2F2iHcApu42QmYEftiQWyA%2F2iHcApu42QmYEftiQWyA-image-1_optimized.avif" 
                        alt="Generated image" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-[#60a5fa] text-black text-[10px] font-bold rounded-full animate-in fade-in zoom-in shadow-lg">IMAGE GENERATED</div>
                </div>
                {genState === 3 && (
                    <div className="absolute inset-0 z-20 bg-[#60a5fa]/10 animate-pulse">
                        <div className="w-full h-1 bg-[#60a5fa]/50 absolute top-0 animate-[scan_2s_linear_infinite]"></div>
                    </div>
                )}
            </div>

            {/* <div className="absolute top-4 left-4 w-8 h-8 rounded-full border border-white/10 bg-black/40 backdrop-blur flex items-center justify-center text-xs font-mono font-bold text-white/70 z-20 group-hover:bg-white group-hover:text-black transition-colors">03</div> */}

            <div className="absolute bottom-12 left-0 right-0 h-[40%] p-4 flex flex-col justify-end z-20 pointer-events-none">
                <div
                    className="absolute w-4 h-4 z-50 transition-all duration-500 ease-in-out drop-shadow-xl"
                    style={{
                        top: genState === 0 ? '120%' : genState === 1 || genState === 2 ? '75%' : '120%',
                        left: genState === 0 ? '80%' : genState === 1 || genState === 2 ? '50%' : '50%',
                        opacity: genState === 0 ? 0 : 1,
                        transform: genState === 2 ? 'scale(0.8)' : 'scale(1)'
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>
                </div>

                <div className="w-full bg-[#0A0A0A]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 border-b border-white/5 pb-2">
                        <Type size={10} /> <span>Prompt</span>
                    </div>
                    <div className="text-xs text-slate-300 font-mono truncate opacity-60">High fashion photography, avant-garde model...</div>
                    <div className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all duration-300 ${genState === 3 ? 'bg-[#60a5fa]/10 text-[#60a5fa] border border-[#60a5fa]/50' : 'bg-white text-black hover:bg-[#60a5fa]'}`}>
                        {genState === 3 ? (<><Loader2 size={12} className="animate-spin" /> Generating...</>) : (<>Generate <Sparkles size={12} /></>)}
                    </div>
                </div>
            </div>
            <style>{`@keyframes scan { from { top: 0%; } to { top: 100%; } }`}</style>
        </>
    );
}

export default ImageGenerationGuide;
