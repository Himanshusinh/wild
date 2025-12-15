"use client";

import React, { useState, useEffect } from 'react';
import {
    Play,
    Settings2,
    Type,
    ChevronDown,
    Zap,
    Monitor,
    Clock,
    Check,
    Sparkles,
    Command,
    MonitorPlay,
    Mic,
    Wand2,
    Image as ImageIcon,
    Loader2
} from 'lucide-react';

/**
 * WILD CANVAS - Complete "How To" Section
 * Step 1: Typewriter + Image Drag
 * Step 2: Ghost Cursor Configuration
 * Step 3: Ghost Cursor Click -> Generating -> Video Reveal
 */

const VideoGenerationGuide = () => {
    const [activeTab, setActiveTab] = useState('video');

    return (
        <section className="h-auto text-white font-sans selection:bg-[#60a5fa] selection:text-white relative overflow-hidden pt-0">

            {/* --- Ambient Background --- */}
            {/* <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
                <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#60a5fa]/20 to-transparent blur-sm"></div>
            </div> */}

            <div className="max-w-[1500px] mx-auto px-6 relative z-10">

                {/* --- Header --- */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 border border-[#60a5fa]/30 bg-[#60a5fa]/10 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest text-[#60a5fa] mb-4 shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse"></span>
                        How To Use
                    </div>
                    <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-4">
                        From Imagination to 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-400 to-slate-600"> Reality in 3 steps.</span>
                    </h1>

                    {/* Tabs */}
                    {/* <div className="inline-flex p-1 bg-[#111] border border-white/10 rounded-full gap-1 mt-4">
                        <TabButton active={activeTab === 'video'} onClick={() => setActiveTab('video')} icon={<MonitorPlay size={14} />} label="Video" />
                        <TabButton active={activeTab === 'lipsync'} onClick={() => setActiveTab('lipsync')} icon={<Mic size={14} />} label="Lipsync" />
                        <TabButton active={activeTab === 'animate'} onClick={() => setActiveTab('animate')} icon={<Wand2 size={14} />} label="Animate" />
                    </div> */}
                </div>

                {/* --- The 3 Steps Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative overflow-visible">

                    {/* STEP 01: PROMPT + IMAGE DRAG */}
                    <StepCard
                        number="01"
                        title="Input Stream"
                        desc="Text prompt or Image-to-Video."
                        color="group-hover:text-purple-400"
                        img=""
                    >   
                    <BackgroundDots />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-[60%] z-20">
                            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-2xl relative overflow-hidden flex flex-col gap-10">
                                <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                                    <Type size={12} className="text-purple-400" />
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Prompt</span>
                                </div>
                                <div className="h-10 text-sm font-mono text-slate-200 relative mb-4">
                                    <Typewriter text="Cyberpunk city in heavy rain, neon lights..." />
                                    <span className="animate-pulse text-purple-400">|</span>
                                </div>
                                <ImageDragSimulation />
                            </div>
                        </div>
                    </StepCard>

                    {/* STEP 02: CONFIGURE (Looping UI) */}
                    <StepCard
                        number="02"
                        title="Configure Node"
                        desc="Select model, aspect ratio, and motion."
                        img=""
                        color="group-hover:text-[#60a5fa]"
                    >
                        <div className="absolute top-28 left-1/2 -translate-x-1/2 -translate-y-10 w-[85%] transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-[55%] z-20 overflow-visible">
                            <SimulatedConfigPanel />
                        </div>
                        <BackgroundDots />
                    </StepCard>

                    {/* STEP 03: GENERATE (Click -> Load -> Reveal) */}
                    <StepCard
                        number="03"
                        title="Render Output"
                        desc="Watch the engine build your video."
                        img=""
                        color="group-hover:text-emerald-400"
                    >
                                                <BackgroundDots />

                        <SimulatedGenerateProcess />
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

function StepCard({ number, title, desc, img, children, color }: { number: string; title: string; desc: string; img: string; children: React.ReactNode; color: string }) {
    // Determine glow colors based on step number
    const glowGradient = number === "01" 
        ? "from-purple-500/20 to-blue-500/20" 
        : number === "02" 
        ? "from-blue-500/20 to-cyan-500/20" 
        : "from-indigo-500/20 to-purple-500/20";
    
    return (
        <div className={`group relative h-[24rem] md:max-h-[26rem] rounded-3xl bg-[#0A0A0A] border border-white/10 overflow-hidden hover:border-[#60a5fa]/40 transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(96,165,250,0.2)]`}>
            {/* Outline Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${glowGradient} opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-xl pointer-events-none`}></div>
            
            <div className="absolute inset-0 h-[65%] overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" style={{ backgroundImage: `url(${img})` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent"></div>
            </div>
            <div className="absolute top-2 md:top-2 left-2 md:left-2 w-8 h-8 rounded-full border border-white/10 bg-black/40 backdrop-blur flex items-center justify-center text-xs font-mono font-bold text-white/70 z-50 group-hover:bg-white group-hover:text-black transition-colors">{number}</div>
            {children}
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

// --- STEP 1: TYPEWRITER + DRAG ---
function Typewriter({ text }: { text: string }) {
    const [displayText, setDisplayText] = useState('');
    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) { setDisplayText(prev => prev + text.charAt(i)); i++; }
            else { clearInterval(timer); }
        }, 50);
        return () => clearInterval(timer);
    }, [text]);
    return <span>{displayText}</span>;
}

function ImageDragSimulation() {
    const [dragState, setDragState] = useState(0);

    useEffect(() => {
        const sequence = async () => {
            await new Promise(r => setTimeout(r, 2000));
            setDragState(1);
            await new Promise(r => setTimeout(r, 1500));
            setDragState(2);
            await new Promise(r => setTimeout(r, 4000));
            setDragState(0);
            sequence();
        };
        sequence();
    }, []);

    return (
        <div className="relative h-16 w-full mt-2">
            <div className={`absolute inset-0 border border-dashed rounded-lg flex items-center justify-center transition-all duration-300 ${dragState === 2 ? 'border-purple-400/50 bg-purple-400/10' : 'border-white/10 bg-white/5'}`}>
                {dragState === 2 ? (
                    <div className="flex items-center gap-2 animate-in zoom-in-90 duration-300">
                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center"><ImageIcon size={14} className="text-purple-400" /></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-white">Reference.jpg</span>
                            <span className="text-[8px] text-purple-400">Image Attached</span>
                        </div>
                    </div>
                ) : (
                    <span className="text-[10px] text-slate-500">Drop image for reference</span>
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

// --- STEP 2: CONFIG LOOP ---
function SimulatedConfigPanel() {
    const [step, setStep] = useState(0);
    const [model, setModel] = useState('Select Model');
    const [res, setRes] = useState('720p');
    const [time, setTime] = useState('5s');

    useEffect(() => {
        const sequence = async () => {
            const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
            setStep(0); setModel('Select Model'); setRes('720p'); setTime('5s');
            await wait(1000);
            // Model
            setStep(1); await wait(600); setStep(2); await wait(600);
            setModel('Veo 3.1'); setStep(0); await wait(500);
            // Res
            setStep(3); await wait(600); setStep(4); await wait(600);
            setRes('1080p'); setStep(0); await wait(500);
            // Time
            setStep(5); await wait(600); setStep(6); await wait(600);
            setTime('10s'); setStep(0);
            // Hold
            setStep(7); await wait(3000);
            sequence();
        };
        sequence();
    }, []);

    return (
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex flex-col gap-2 shadow-2xl relative overflow-visible">
            {/* Ghost Cursor */}
            <div className="absolute w-4 h-4 pointer-events-none z-50 transition-all duration-500 ease-in-out" style={{ top: step === 1 || step === 2 ? '30px' : step === 3 || step === 4 ? '80px' : step === 5 || step === 6 ? '130px' : '150px', left: step === 0 ? '50%' : '80%', opacity: step === 0 || step === 7 ? 0 : 1, transform: `translate(${step % 2 === 0 ? '0px' : '5px'}, ${step % 2 === 0 ? '0px' : '10px'})` }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>
            </div>
            {/* Config Items (Model, Res, Time) */}
            <div className="relative z-50 overflow-visible">
                <div className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-default transition-colors ${step === 1 ? 'border-[#60a5fa] bg-white/5' : 'border-white/10 bg-white/5'}`}>
                    <div className="flex items-center gap-2 text-slate-300"><Zap size={12} /> {model}</div>
                    <ChevronDown size={12} className="text-slate-500" />
                </div>
                <div className={`absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-lg overflow-hidden transition-all duration-200 origin-top z-[60] ${step === 1 || step === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="p-2 text-[10px] text-slate-400">Flux Pro</div>
                    <div className={`p-2 text-[10px] flex justify-between items-center ${step === 2 ? 'bg-[#60a5fa] text-black font-bold' : 'text-slate-400'}`}>Veo 3.1 {step === 2 && <Check size={10} />}</div>
                </div>
            </div>
            <div className="relative z-40 overflow-visible">
                <div className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-default transition-colors ${step === 3 ? 'border-[#60a5fa] bg-white/5' : 'border-white/10 bg-white/5'}`}>
                    <div className="flex items-center gap-2 text-slate-300"><Monitor size={12} /> {res}</div>
                    <ChevronDown size={12} className="text-slate-500" />
                </div>
                <div className={`absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-lg overflow-hidden transition-all duration-200 origin-top z-[60] ${step === 3 || step === 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="p-2 text-[10px] text-slate-400">720p HD</div>
                    <div className={`p-2 text-[10px] flex justify-between items-center ${step === 4 ? 'bg-[#60a5fa] text-black font-bold' : 'text-slate-400'}`}>1080p FHD {step === 4 && <Check size={10} />}</div>
                </div>
            </div>
            <div className="relative z-30 overflow-visible">
                <div className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-default transition-colors ${step === 5 ? 'border-[#60a5fa] bg-white/5' : 'border-white/10 bg-white/5'}`}>
                    <div className="flex items-center gap-2 text-slate-300"><Clock size={12} /> {time}</div>
                    <ChevronDown size={12} className="text-slate-500" />
                </div>
                <div className={`absolute top-full left-0 right-0 mb-1 bg-[#1A1A1A] border border-white/10 rounded-lg overflow-hidden transition-all duration-200 origin-bottom z-[60] ${step === 5 || step === 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="p-2 text-[10px] text-slate-400">5 seconds</div>
                    <div className={`p-2 text-[10px] flex justify-between items-center ${step === 6 ? 'bg-[#60a5fa] text-black font-bold' : 'text-slate-400'}`}>10 seconds {step === 6 && <Check size={10} />}</div>
                </div>
            </div>
        </div>
    );
}

// --- STEP 3: GENERATE & REVEAL ---
function SimulatedGenerateProcess() {
    // States: 0=Idle, 1=CursorMove, 2=Click, 3=Generating, 4=Result, 5=Hold
    const [genState, setGenState] = useState(0);

    useEffect(() => {
        const sequence = async () => {
            const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

            setGenState(0);
            await wait(1000);

            // 1. Move Cursor
            setGenState(1);
            await wait(800);

            // 2. Click
            setGenState(2);
            await wait(200);

            // 3. Generating (2s)
            setGenState(3);
            await wait(2000);

            // 4. Show Result (4s hold)
            setGenState(4);
            await wait(4000);

            // Loop
            sequence();
        };
        sequence();
    }, []);

    return (
        <>
            {/* Top Half: Result Viewer */}
            <div className="absolute inset-0 h-[50%] md:max-h-[60%] overflow-hidden bg-[#050505]">
                {/* Result Video (Revealed on State 4) */}
                <div className={`absolute inset-0 z-10 transition-opacity duration-1000 ${genState === 4 ? 'opacity-100' : 'opacity-0'}`}>
                    <img 
                        src="/core/cyberpunk.gif" 
                        alt="Generated video" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-black text-[10px] font-bold rounded-full animate-in fade-in zoom-in shadow-lg">GENERATION COMPLETE</div>
                </div>

                {/* Scanline Effect (during generating) */}
                {genState === 3 && (
                    <div className="absolute inset-0 z-20 bg-emerald-500/10 animate-pulse">
                        <div className="w-full h-1 bg-emerald-500/50 absolute top-0 animate-[scan_2s_linear_infinite]"></div>
                    </div>
                )}
            </div>

            {/* Bottom Half: Command Bar (Animated) */}
            <div className="absolute bottom-12 left-0 right-0 h-[40%] flex flex-col justify-end z-20 pointer-events-none p-4">

                {/* Ghost Cursor */}
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

                {/* Command Bar UI */}
                <div className="w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-3">
                    {/* Prompt Text Area */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 border-b border-white/5 pb-2">
                        <Type size={10} /> <span>Prompt</span>
                    </div>
                    <div className="text-xs text-slate-300 font-mono truncate opacity-60">
                        Cyberpunk city in heavy rain, neon lights...
                    </div>

                    {/* Generate Button (States: Normal vs Generating) */}
                    <div className={`
                w-full py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all duration-300
                ${genState === 3
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/50'
                        : 'bg-white text-black hover:bg-emerald-400'}
             `}>
                        {genState === 3 ? (
                            <>
                                <Loader2 size={12} className="animate-spin" /> Generating...
                            </>
                        ) : (
                            <>
                                Generate <Sparkles size={12} />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Styles for scan animation */}
            <style>{`
        @keyframes scan { from { top: 0%; } to { top: 100%; } }
      `}</style>
        </>
    );
}

export default VideoGenerationGuide;
