import React from 'react';
import { Search, ArrowUpRight } from 'lucide-react';

export function TemplatesView() {
    const templates = [
        { title: "Flux Realism", tags: ["Photo", "Upscale"], downloads: "2.4k" },
        { title: "Anime Video V3", tags: ["Video", "Style"], downloads: "8.9k" },
        { title: "Product Studio", tags: ["Marketing", "Relight"], downloads: "1.2k" },
        { title: "Logo Vectorizer", tags: ["Utility", "SVG"], downloads: "12k" },
        { title: "Character Sheet", tags: ["Game Dev", "Consistent"], downloads: "5.5k" },
        { title: "ArchViz Exterior", tags: ["3D", "ControlNet"], downloads: "900" },
    ];
    return (
        <div className="animate-in fade-in duration-500">
            <div className="text-center mb-16 max-w-2xl mx-auto">
                <h2 className="text-4xl font-medium tracking-tight text-white mb-4">Start with a Blueprint</h2>
                <p className="text-slate-400 mb-8">Production-ready node graphs curated by the community.</p>
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#60a5fa] to-indigo-600 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-[#0A0A0A] border border-white/10 rounded-full p-2 flex items-center shadow-2xl">
                        <Search className="ml-4 text-slate-500" size={20} />
                        <input type="text" placeholder="Search workflows..." className="w-full bg-transparent border-none focus:ring-0 text-white px-4 py-2 placeholder-slate-600" />
                        <div className="hidden md:flex gap-2">
                            <button className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222] text-slate-400 rounded-full text-xs font-medium transition-colors">Popular</button>
                            <button className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222] text-slate-400 rounded-full text-xs font-medium transition-colors">Newest</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((t, i) => (
                    <div key={i} className="group bg-[#0A0A0A] rounded-xl border border-white/5 hover:border-white/10 p-1 flex flex-col transition-all hover:-translate-y-1">
                        <div className="h-40 bg-[#111] rounded-lg relative overflow-hidden mb-4">
                            <div className={`absolute inset-0 bg-gradient-to-br from-[#111] to-[#222] group-hover:scale-105 transition-transform duration-700`}></div>
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                            <div className="absolute top-3 left-3 flex gap-1">
                                {t.tags.map(tag => (<span key={tag} className="text-[9px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur text-slate-400 border border-white/5 px-2 py-1 rounded-sm">{tag}</span>))}
                            </div>
                        </div>
                        <div className="px-4 pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-white font-medium group-hover:text-[#60a5fa] transition-colors">{t.title}</h3>
                                <span className="text-xs text-slate-500 flex items-center gap-1"><ArrowUpRight size={12} /> {t.downloads}</span>
                            </div>
                            <button className="w-full py-2 mt-2 rounded bg-[#111] text-slate-400 text-xs font-medium hover:bg-white hover:text-black transition-colors">Clone Workflow</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
