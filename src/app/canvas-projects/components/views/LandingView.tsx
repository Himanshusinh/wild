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
            <div className="text-center max-w-4xl mx-auto mt-12 mb-20">
                <div className="inline-flex items-center gap-2 border border-[#60a5fa]/30 bg-[#60a5fa]/10 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest text-[#60a5fa] mb-8 shadow-[0_0_10px_rgba(96,165,250,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse"></span>
                    System Online v2.4
                </div>
                <h1 className="text-6xl md:text-8xl font-medium tracking-tight text-white mb-8 leading-[0.95]">
                    The operating system <br />
                    <span className="text-slate-500">for creative intelligence.</span>
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Unify text, image, and video models on a single infinite canvas.
                    Build complex node-based workflows without writing a line of code.
                </p>
                <div className="mt-12 flex items-center justify-center gap-4">
                    <button onClick={() => setActiveTab('projects')} className="group relative px-8 py-4 bg-white text-black rounded-full text-base font-semibold overflow-hidden transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        <span className="relative z-10 flex items-center gap-2">Start Creating <ArrowUpRight size={18} /></span>
                        <div className="absolute inset-0 bg-[#60a5fa] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                    </button>
                    <button className="px-8 py-4 bg-[#111] border border-white/10 text-white rounded-full text-base font-medium hover:bg-[#222] transition-colors flex items-center gap-2">
                        <Play size={16} fill="currentColor" /> Watch Demo
                    </button>
                </div>
            </div>

            {/* --- NODE WORKFLOW VISUALIZER (3-Step) --- */}
            <WorkflowVisualizer />

            {/* --- NEW SECTION: INTERACTIVE FEATURE HUB (Weavy Style) --- */}
            <InteractiveFeatureNodeGraph />

            {/* --- PREMIUM MODEL GRID --- */}
            <section className="w-full mb-32 animate-in fade-in duration-1000 delay-200">
                <div className="mb-12">
                    <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">One subscription <br /> to rule them all.</h2>
                    <p className="text-slate-400 text-lg">One plan. 50+ models. Stay on the creative edge without chasing licenses.</p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min">

                    {/* 1. Google (Wide Hero) */}
                    <div className="lg:col-span-3 md:col-span-2 relative h-80 rounded-3xl overflow-hidden border border-white/5 group bg-[#020617]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent mix-blend-multiply"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                        <div className="absolute top-8 left-8"><h3 className="text-4xl font-bold text-white">Google</h3></div>
                        <div className="absolute bottom-8 left-8 right-8 grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                            <ModelItem title="Gemini 2.5 Flash" desc="SOTA Image Generation" pro />
                            <ModelItem title="Imagen 3" desc="Photorealistic synthesis" pro />
                            <ModelItem title="Imagen 4" desc="High-fidelity image synthesis" pro />
                            <ModelItem title="Gemini 2.5 Pro" desc="Advanced reasoning" pro />
                            <ModelItem title="Veo2" desc="Realistic short video" pro />
                            <ModelItem title="Veo3" desc="Cinematic long-form" pro />
                        </div>
                    </div>

                    {/* 2. Runway (Tall Hero) */}
                    <div className="lg:col-span-1 md:col-span-1 md:row-span-2 relative h-[41rem] rounded-3xl overflow-hidden border border-white/5 group bg-[#0F0F05]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-50 group-hover:scale-105 transition-all duration-700 grayscale mix-blend-screen"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-amber-900/40 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black"></div>
                        <div className="absolute top-8 left-8"><h3 className="text-4xl font-bold text-white">runway</h3></div>
                        <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-6">
                            <ModelItem title="Aleph" desc="Creative foundation model" pro />
                            <ModelItem title="Gen-4 Turbo" desc="Real-time video generation" pro />
                            <ModelItem title="References" desc="Style/subject consistency" />
                            <ModelItem title="Act-Two" desc="Narrative video storytelling" />
                            <ModelItem title="Gen-3 Alpha" desc="Cinematic video realism" pro />
                        </div>
                    </div>

                    {/* 3. Wan */}
                    <div className="lg:col-span-1 md:col-span-1 relative h-80 rounded-3xl overflow-hidden border border-white/5 group bg-[#110505]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-50 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/40 to-red-900/40 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors"></div>
                        <div className="absolute top-8 left-8"><h3 className="text-3xl font-bold text-white flex items-center gap-2"><Hexagon size={24} fill="white" /> Wan</h3></div>
                        <div className="absolute bottom-8 left-8 right-8 space-y-4">
                            <ModelItem title="Wan 2.2" desc="Culturally tuned image model" pro />
                        </div>
                    </div>

                    {/* 4. OpenAI */}
                    <div className="lg:col-span-2 md:col-span-1 relative h-80 rounded-3xl overflow-hidden border border-white/5 group bg-[#021109]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-emerald-900/30 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-black/60"></div>
                        <div className="absolute top-8 left-8"><h3 className="text-3xl font-bold text-white">OpenAI</h3></div>
                        <div className="absolute bottom-8 left-8 right-8 grid grid-cols-2 gap-4">
                            <ModelItem title="GPT-5" desc="State-of-the-art multimodal AI" pro />
                            <ModelItem title="GPT-4o Mini" desc="Small, fast multimodal" />
                            <ModelItem title="GPT Image" desc="Detailed image editing" />
                        </div>
                    </div>

                    {/* 5. Black Forest Labs */}
                    <div className="lg:col-span-2 md:col-span-2 relative h-72 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1635776062360-af423602aff3?q=80&w=800')] bg-cover bg-center opacity-30 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-black mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                        <div className="absolute top-8 left-8"><h3 className="text-2xl font-bold text-white">Black Forest Labs</h3></div>
                        <div className="absolute bottom-8 left-8 right-8 grid grid-cols-2 gap-y-4 gap-x-8">
                            <ModelItem title="FLUX 1.1 Pro" desc="Balanced photo/creative" pro />
                            <ModelItem title="FLUX Kontext Max" desc="Multi-reference guided" pro />
                            <ModelItem title="FLUX Dev" desc="Developer-focused gen" />
                            <ModelItem title="FLUX Redux" desc="Image refinement polish" />
                            <ModelItem title="FLUX Depth" desc="Depth-map guided" />
                            <ModelItem title="FLUX Canny" desc="Edge-map controlled" />
                        </div>
                    </div>

                    {/* 6. Stability AI */}
                    <div className="lg:col-span-1 md:col-span-1 relative h-72 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800')] bg-cover bg-center opacity-50 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-yellow-600/20 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="absolute top-8 left-8"><h3 className="text-2xl font-bold text-white">stability.ai</h3></div>
                        <div className="absolute bottom-8 left-8 right-8">
                            <ModelItem title="Stable Diffusion 3.5" desc="Open, versatile synthesis" />
                        </div>
                    </div>

                    {/* 7. Hailuo AI */}
                    <div className="lg:col-span-1 md:col-span-3 relative h-72 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-cyan-900/30 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-black/60"></div>
                        <div className="absolute top-8 left-8"><h3 className="text-2xl font-bold text-white">Hailuo AI</h3></div>
                        <div className="absolute bottom-8 left-8 right-8 space-y-3">
                            <ModelItem title="Minimax Hailuo" desc="General-purpose image" pro />
                            <ModelItem title="Minimax Hailuo 02 Pro" desc="Enhanced precision" pro />
                        </div>
                    </div>

                    {/* 8. Pika */}
                    <div className="lg:col-span-1 relative h-64 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614726365723-49cfae968603?q=80&w=800')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="absolute top-6 left-6"><h3 className="text-3xl font-bold text-white">Pika</h3></div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <ModelItem title="Pika" desc="Creative, fast video" />
                        </div>
                    </div>

                    {/* 9. Kling AI */}
                    <div className="lg:col-span-2 relative h-64 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?q=80&w=800')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-red-900/20 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                        <div className="absolute top-6 left-6"><h3 className="text-2xl font-bold text-white flex gap-2"><Sparkles size={24} className="text-[#60a5fa]" /> KlingAI</h3></div>
                        <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-4">
                            <ModelItem title="Kling 2.1 Master" desc="Refined cinematic video" pro />
                            <ModelItem title="Kling 2.0 Master" desc="Advanced cinematic video" pro />
                            <ModelItem title="Kling Pro 1.5" desc="Prior-gen high-quality" pro />
                            <ModelItem title="Kling Pro 1.6" desc="High-quality video gen" pro />
                        </div>
                    </div>

                    {/* 10. Recraft */}
                    <div className="lg:col-span-1 relative h-64 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-fuchsia-600/20 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="absolute top-6 left-6"><h3 className="text-2xl font-bold text-white tracking-widest uppercase font-mono">RECRAFT</h3></div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <ModelItem title="Recraft V3" desc="Vector & design-oriented" />
                        </div>
                    </div>

                    {/* 11. ByteDance | Seed */}
                    <div className="lg:col-span-2 relative h-48 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=800')] bg-cover bg-center opacity-30 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-black/60"></div>
                        <div className="absolute top-6 left-6"><h3 className="text-xl font-bold text-white flex items-center gap-2">ByteDance | Seed</h3></div>
                    </div>

                    {/* 12. Moonvalley */}
                    <div className="lg:col-span-2 relative h-48 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="absolute top-6 left-6"><h3 className="text-xl font-bold text-white tracking-widest">MOONVALLEY</h3></div>
                    </div>

                </div>
            </section>

            {/* Feature Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <BentoCard title="Infinite Canvas" subtitle="Spatial Organization" icon={<Grid size={20} />} bg="bg-gradient-to-b from-[#111] to-[#000]" />
                <BentoCard title="50+ Models" subtitle="Unified API Access" icon={<Box size={20} />} bg="bg-gradient-to-b from-[#111] to-[#000]" />
                <BentoCard title="Team Sync" subtitle="Coming Soon" icon={<Share2 size={20} />} bg="bg-gradient-to-b from-[#111] to-[#000]" />
            </div>
        </div>
    );
}
