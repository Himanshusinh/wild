'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  RotateCcw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Zap, 
  Bookmark, 
  Share2, 
  Plus, 
  Check,
  User,
  Shirt,
  Sparkles,
  Layers
} from 'lucide-react';

const MODELS = [
  { id: 'm1', name: 'Aria', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 'm2', name: 'Leo', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 'm3', name: 'Mira', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 'm4', name: 'Kai', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 'm5', name: 'Noor', image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&h=250&auto=format&fit=crop' },
];

const TOP_WEAR = [
  { id: 't1', name: 'Silk Blouse', image: 'https://images.unsplash.com/photo-1583845010359-994328227448?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 't2', name: 'Linen Shirt', image: 'https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 't3', name: 'Oversized Hoodie', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 't4', name: 'Denim Jacket', image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 't5', name: 'Crop Top', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200&h=250&auto=format&fit=crop' },
];

const BOTTOM_WEAR = [
  { id: 'b1', name: 'Cargo Pants', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 'b2', name: 'Mini Skirt', image: 'https://images.unsplash.com/photo-1582142837900-2c97c11991a8?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 'b3', name: 'Wide Jeans', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 'b4', name: 'Chino Shorts', image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=200&h=250&auto=format&fit=crop' },
];

export function VirtualTryonTool() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedTop, setSelectedTop] = useState<any>(null);
  const [selectedBottom, setSelectedBottom] = useState<any>(null);

  const resetSelection = () => {
    setSelectedModel(MODELS[0]);
    setSelectedTop(null);
    setSelectedBottom(null);
  };

  return (
    <div className="w-full h-[760px] max-h-[85vh] bg-[#161616] border border-white/5 rounded-[24px] overflow-hidden flex flex-col md:flex-row shadow-2xl relative font-sans">
      {/* Corner Glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/[0.02] blur-[120px] pointer-events-none" />

      {/* LEFT: PREVIEW (30%) */}
      <div className="w-full md:w-[30%] h-full border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col gap-6 bg-[#0A0A0F] z-10 shrink-0">
        {/* <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-[#FAFAFA] font-bold text-lg tracking-tight">Preview</h2>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-black">Virtual Stage</p>
            </div>
          </div>
        </div> */}

        <div className="relative flex-1 min-h-0 rounded-2xl bg-[#07070B] border border-white/5 overflow-hidden flex items-center justify-center group shadow-inner">
          {/* Grid lines background */}
          <div className="absolute inset-0 opacity-[0.02]" 
            style={{ 
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} 
          />

          {/* Model Display */}
          <div className="relative w-full h-full p-6 flex items-center justify-center">
            {selectedModel ? (
              <motion.div 
                key={selectedModel.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative h-full aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-white/10"
              >
                <img 
                  src={selectedModel.image} 
                  alt={selectedModel.name}
                  className="w-full h-full object-cover"
                />
                
                {(selectedTop || selectedBottom) && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex flex-col items-center justify-end pb-8 gap-2">
                    {selectedTop && (
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        TOP: {selectedTop.name.toUpperCase()}
                      </div>
                    )}
                    {selectedBottom && (
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        BOTTOM: {selectedBottom.name.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="text-white/10 flex flex-col items-center gap-4">
                <div className="p-5 rounded-full bg-white/5 border border-white/5">
                  <User size={40} />
                </div>
                <p className="text-sm font-bold uppercase tracking-wider">Initialize Model</p>
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-[#1A1A1A]/90 backdrop-blur-2xl border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-2xl">
            <button className="p-2.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><RotateCcw size={14}/></button>
            <button className="p-2.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><ZoomIn size={14}/></button>
            <button className="p-2.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><ZoomOut size={14}/></button>
            <button className="p-2.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><Maximize2 size={14}/></button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/20">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
            Active Stage
          </div>
          <div className="font-mono">1024 × 1280</div>
        </div>
      </div>

      {/* RIGHT: SELECTION (70%) */}
      <div className="flex-1 h-full p-8 md:p-12 flex flex-col gap-12 z-10 overflow-y-auto bg-[#0D0D0D] custom-scrollbar">
        <div className="flex items-center justify-between shrink-0">
          {/* <div>
            <h1 className="text-4xl font-black text-[#FAFAFA] tracking-tighter mb-2">Virtual Try-On</h1>
            <p className="text-[#87878C] text-sm md:text-base max-w-lg leading-relaxed font-medium">Design your unique look with high-fidelity neural processing.</p>
          </div> */}
          <button 
            onClick={resetSelection}
            className="hidden sm:flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest hover:bg-white/10"
          >
            <RotateCcw size={14} />
            Reset Look
          </button>
        </div>

        {/* SELECTION ROWS */}
        <div className="space-y-14">
          
          {/* ROW 1: MODELS */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-white/20 font-black flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                01. Identity Selection
              </h3>
            </div>
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1 snap-x snap-mandatory">
              <button className="flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-white/10 transition-all group snap-start">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:scale-110 transition-all duration-500 border border-white/5">
                  <Plus size={24} />
                </div>
                <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">Upload</span>
              </button>
              
              {MODELS.map((m) => (
                <button 
                  key={m.id}
                  onClick={() => setSelectedModel(m)}
                  className={`relative flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] overflow-hidden border-2 transition-all duration-500 group snap-start ${
                    selectedModel?.id === m.id ? 'border-white ring-[6px] ring-white/5 scale-[1.02] shadow-2xl z-20' : 'border-transparent hover:border-white/10'
                  }`}
                >
                  <img src={m.image} alt={m.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <p className="text-[12px] text-white font-black tracking-tight">{m.name}</p>
                  </div>
                  {selectedModel?.id === m.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black shadow-2xl">
                      <Check size={14} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ROW 2: TOP WEAR */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-white/20 font-black flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                02. Upper Body
              </h3>
            </div>
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1 snap-x snap-mandatory">
              <button className="flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-white/10 transition-all group snap-start">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:scale-110 transition-all duration-500 border border-white/5">
                  <Plus size={24} />
                </div>
                <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">Add Upper</span>
              </button>

              {TOP_WEAR.map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setSelectedTop(t)}
                  className={`relative flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] overflow-hidden border-2 transition-all duration-500 group snap-start ${
                    selectedTop?.id === t.id ? 'border-white ring-[6px] ring-white/5 scale-[1.02] shadow-2xl z-20' : 'border-transparent hover:border-white/10'
                  }`}
                >
                  <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <p className="text-[12px] text-white font-black tracking-tight">{t.name}</p>
                  </div>
                  {selectedTop?.id === t.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black shadow-2xl">
                      <Check size={14} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ROW 3: BOTTOM WEAR (ACTIVE) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-white/20 font-black flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                03. Lower Body
              </h3>
            </div>
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1 snap-x snap-mandatory">
              <button className="flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-white/10 transition-all group snap-start">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:scale-110 transition-all duration-500 border border-white/5">
                  <Plus size={24} />
                </div>
                <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">Add Lower</span>
              </button>

              {BOTTOM_WEAR.map((b) => (
                <button 
                  key={b.id}
                  onClick={() => setSelectedBottom(b)}
                  className={`relative flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] overflow-hidden border-2 transition-all duration-500 group snap-start ${
                    selectedBottom?.id === b.id ? 'border-white ring-[6px] ring-white/5 scale-[1.02] shadow-2xl z-20' : 'border-transparent hover:border-white/10'
                  }`}
                >
                  <img src={b.image} alt={b.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <p className="text-[12px] text-white font-black tracking-tight">{b.name}</p>
                  </div>
                  {selectedBottom?.id === b.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black shadow-2xl">
                      <Check size={14} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ROW 4: EXTRAS (ACTIVE SLOTS) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-white/20 font-black flex items-center gap-3">
                <Sparkles size={16} className="text-white/10" />
                Future Collections
              </h3>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
              {['Footwear', 'Accessories', 'Headwear', 'Bags'].map((cat) => (
                <div key={cat} className="flex-shrink-0 w-[180px] h-20 rounded-[24px] bg-white/[0.02] border border-white/5 flex items-center justify-between px-5 hover:bg-white/[0.04] transition-all group cursor-pointer border-dashed">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] text-[#FAFAFA] font-black tracking-tight">{cat}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse" />
                      <span className="text-[8px] text-white/10 font-black uppercase tracking-[0.2em]">In Production</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/10 group-hover:text-white transition-all border border-white/5">
                    <Plus size={14} />
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="mt-auto pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <span className="text-[#87878C] text-xs font-black uppercase tracking-widest">Neural Processing Units:</span>
              <div className="flex items-center gap-2 text-white">
                <Zap size={20} fill="currentColor" className="text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                <span className="text-3xl font-black tracking-tighter italic">120</span>
                <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] ml-2">Credits</span>
              </div>
            </div>
            <p className="text-white/10 text-[10px] font-black tracking-[0.2em] uppercase">V-SYNC Enabled • 4D Generative Output (~45s)</p>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none h-16 px-12 bg-white hover:bg-[#FAFAFA] text-black font-black text-[12px] uppercase tracking-[0.25em] rounded-2xl transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_40px_rgba(255,255,255,0.2)] active:scale-[0.97] flex items-center justify-center gap-4">
              <Layers size={20} strokeWidth={3} />
              SYNC ASSETS
            </button>
            <div className="flex gap-2">
              <button className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all hover:bg-white/10 active:scale-95 group">
                <Bookmark size={22} className="group-hover:fill-white transition-all" />
              </button>
              <button className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all hover:bg-white/10 active:scale-95">
                <Share2 size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
