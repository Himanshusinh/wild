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

const FOOTWEAR = [
  { id: 'f1', name: 'Tech Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 'f2', name: 'Combat Boots', image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 'f3', name: 'Classic Loafers', image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=200&h=250&auto=format&fit=crop' },
];

const ACCESSORIES = [
  { id: 'a1', name: 'Cyber Shades', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 'a2', name: 'Silver Chain', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 'a3', name: 'Beanie Hat', image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=200&h=250&auto=format&fit=crop' },
];

const BAGS = [
  { id: 'bg1', name: 'Crossbody Bag', image: 'https://images.unsplash.com/photo-1584917033904-49097e3f1e8d?q=80&w=200&h=250&auto=format&fit=crop' },
  { id: 'bg2', name: 'Mini Backpack', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=200&h=250&auto=format&fit=crop' },
];

export function VirtualTryonTool() {
  const [selectedModel, setSelectedModel] = useState<any>(MODELS[0]);
  const [selectedTop, setSelectedTop] = useState<any>(null);
  const [selectedBottom, setSelectedBottom] = useState<any>(null);
  const [selectedFootwear, setSelectedFootwear] = useState<any>(null);
  const [selectedAccessory, setSelectedAccessory] = useState<any>(null);
  const [selectedBag, setSelectedBag] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [credits, setCredits] = useState(120);

  const resetSelection = () => {
    setSelectedModel(MODELS[0]);
    setSelectedTop(null);
    setSelectedBottom(null);
    setSelectedFootwear(null);
    setSelectedAccessory(null);
    setSelectedBag(null);
    setZoom(1);
    setRotation(0);
  };

  const handleUpload = (type: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        const newItem = { id: `u-${Date.now()}`, name: 'Custom Upload', image: url };
        if (type === 'model') setSelectedModel(newItem);
        if (type === 'top') setSelectedTop(newItem);
        if (type === 'bottom') setSelectedBottom(newItem);
        if (type === 'footwear') setSelectedFootwear(newItem);
        if (type === 'accessory') setSelectedAccessory(newItem);
        if (type === 'bag') setSelectedBag(newItem);
      }
    };
    input.click();
  };

  const handleSync = () => {
    if (!selectedModel || (!selectedTop && !selectedBottom && !selectedFootwear && !selectedAccessory && !selectedBag)) {
      alert("Please select a model and at least one item!");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setCredits(prev => Math.max(0, prev - 10));
      // In a real app, this would update the preview with the generated image
    }, 3000);
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: zoom,
                  rotate: rotation,
                }}
                className="relative h-full aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-white/10 transition-transform duration-300"
              >
                <img 
                  src={selectedModel.image} 
                  alt={selectedModel.name}
                  className="w-full h-full object-cover"
                />
                
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-50">
                    <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                    <p className="text-white text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Processing Neural Mesh...</p>
                  </div>
                )}

                {(selectedTop || selectedBottom || selectedFootwear || selectedAccessory || selectedBag) && !isGenerating && (
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] flex flex-col items-center justify-end pb-4 gap-1.5">
                    {selectedTop && (
                      <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[8px] font-bold rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        TOP: {selectedTop.name.toUpperCase()}
                      </div>
                    )}
                    {selectedBottom && (
                      <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[8px] font-bold rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        BOTTOM: {selectedBottom.name.toUpperCase()}
                      </div>
                    )}
                    {selectedFootwear && (
                      <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[8px] font-bold rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        FOOTWEAR: {selectedFootwear.name.toUpperCase()}
                      </div>
                    )}
                    {(selectedAccessory || selectedBag) && (
                      <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[8px] font-bold rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        EXTRAS: {(selectedAccessory?.name || selectedBag?.name).toUpperCase()}
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
            <button onClick={() => setRotation(r => r - 90)} className="p-2.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><RotateCcw size={14}/></button>
            <button onClick={() => setZoom(z => Math.min(z + 1, 3))} className="p-2.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><ZoomIn size={14}/></button>
            <button onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))} className="p-2.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><ZoomOut size={14}/></button>
            <button onClick={() => { setZoom(1); setRotation(0); }} className="p-2.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><Maximize2 size={14}/></button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/20">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-amber-500 animate-ping' : 'bg-green-500/40'}`} />
            {isGenerating ? 'Neural Processing' : 'Active Stage'}
          </div>
          <div className="font-mono">1024 × 1280</div>
        </div>
      </div>

      {/* RIGHT: SELECTION (68%) */}
      <div className="flex-1 h-full flex flex-col z-10 bg-[#0D0D0D] relative overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between shrink-0 px-8 md:px-12 py-6 bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
          <button 
            onClick={resetSelection}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest hover:bg-white/10"
          >
            <RotateCcw size={12} />
            Reset Look
          </button>

          <div className="flex items-center gap-4">
            {/* Compact Credits */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Zap size={14} fill="currentColor" className="text-amber-500" />
              <span className="text-sm font-black text-white italic">{credits}</span>
            </div>

            {/* Compact Sync Button */}
            <button 
              onClick={handleSync}
              disabled={isGenerating}
              className={`h-10 px-6 bg-white hover:bg-[#FAFAFA] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl ${isGenerating ? 'opacity-50' : 'active:scale-95'}`}
            >
              {isGenerating ? (
                <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <Layers size={14} strokeWidth={3} />
              )}
              {isGenerating ? 'Syncing...' : 'Sync Assets'}
            </button>
          </div>
        </div>

        {/* SELECTION ROWS - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-14 custom-scrollbar">
          
          {/* ROW 1: MODELS */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-white/20 font-black flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                01. Identity Selection
              </h3>
            </div>
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1 snap-x snap-mandatory">
              <button 
                onClick={() => handleUpload('model')}
                className="flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-white/10 transition-all group snap-start"
              >
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
              <button 
                onClick={() => handleUpload('top')}
                className="flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-white/10 transition-all group snap-start"
              >
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
              <button 
                onClick={() => handleUpload('bottom')}
                className="flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-white/10 transition-all group snap-start"
              >
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

          {/* ROW 4: FOOTWEAR */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-white/20 font-black flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                04. Footwear
              </h3>
            </div>
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1 snap-x snap-mandatory">
              <button 
                onClick={() => handleUpload('footwear')}
                className="flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-white/10 transition-all group snap-start"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:scale-110 transition-all duration-500 border border-white/5">
                  <Plus size={24} />
                </div>
                <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">Add Foot</span>
              </button>

              {FOOTWEAR.map((f) => (
                <button 
                  key={f.id}
                  onClick={() => setSelectedFootwear(f)}
                  className={`relative flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] overflow-hidden border-2 transition-all duration-500 group snap-start ${
                    selectedFootwear?.id === f.id ? 'border-white ring-[6px] ring-white/5 scale-[1.02] shadow-2xl z-20' : 'border-transparent hover:border-white/10'
                  }`}
                >
                  <img src={f.image} alt={f.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <p className="text-[12px] text-white font-black tracking-tight">{f.name}</p>
                  </div>
                  {selectedFootwear?.id === f.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black shadow-2xl">
                      <Check size={14} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ROW 5: ACCESSORIES */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-white/20 font-black flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                05. Accessories
              </h3>
            </div>
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1 snap-x snap-mandatory">
              <button 
                onClick={() => handleUpload('accessory')}
                className="flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-white/10 transition-all group snap-start"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:scale-110 transition-all duration-500 border border-white/5">
                  <Plus size={24} />
                </div>
                <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">Add Acc.</span>
              </button>

              {ACCESSORIES.map((a) => (
                <button 
                  key={a.id}
                  onClick={() => setSelectedAccessory(a)}
                  className={`relative flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] overflow-hidden border-2 transition-all duration-500 group snap-start ${
                    selectedAccessory?.id === a.id ? 'border-white ring-[6px] ring-white/5 scale-[1.02] shadow-2xl z-20' : 'border-transparent hover:border-white/10'
                  }`}
                >
                  <img src={a.image} alt={a.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <p className="text-[12px] text-white font-black tracking-tight">{a.name}</p>
                  </div>
                  {selectedAccessory?.id === a.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black shadow-2xl">
                      <Check size={14} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
          {/* ROW 6: BAGS */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-white/20 font-black flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                06. Bags & Packs
              </h3>
            </div>
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1 snap-x snap-mandatory">
              <button 
                onClick={() => handleUpload('bag')}
                className="flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-white/10 transition-all group snap-start"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:scale-110 transition-all duration-500 border border-white/5">
                  <Plus size={24} />
                </div>
                <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">Add Bag</span>
              </button>

              {BAGS.map((bg) => (
                <button 
                  key={bg.id}
                  onClick={() => setSelectedBag(bg)}
                  className={`relative flex-shrink-0 w-[120px] aspect-[4/5] rounded-[20px] overflow-hidden border-2 transition-all duration-500 group snap-start ${
                    selectedBag?.id === bg.id ? 'border-white ring-[6px] ring-white/5 scale-[1.02] shadow-2xl z-20' : 'border-transparent hover:border-white/10'
                  }`}
                >
                  <img src={bg.image} alt={bg.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <p className="text-[12px] text-white font-black tracking-tight">{bg.name}</p>
                  </div>
                  {selectedBag?.id === bg.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black shadow-2xl">
                      <Check size={14} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
