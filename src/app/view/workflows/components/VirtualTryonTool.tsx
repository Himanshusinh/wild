'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCcw, 
  ZoomIn, 
  Maximize2, 
  Plus, 
  Sparkles,
  Layers,
  Loader2,
  Clock,
  Diamond,
  Glasses,
  ShoppingBag,
  Shirt
} from 'lucide-react';

const MODELS = [
  { id: 'm1', name: 'Aria', avatar: '/Users/diya/.gemini/antigravity/brain/6e2d7445-df75-4bf4-b426-b3d22beca121/model_avatars_1778832125506.png', pos: '0 0' },
  { id: 'm2', name: 'Leo', avatar: '/Users/diya/.gemini/antigravity/brain/6e2d7445-df75-4bf4-b426-b3d22beca121/model_avatars_1778832125506.png', pos: '-100px 0' },
  { id: 'm3', name: 'Mira', avatar: '/Users/diya/.gemini/antigravity/brain/6e2d7445-df75-4bf4-b426-b3d22beca121/model_avatars_1778832125506.png', pos: '-200px 0' },
  { id: 'm4', name: 'Kai', avatar: '/Users/diya/.gemini/antigravity/brain/6e2d7445-df75-4bf4-b426-b3d22beca121/model_avatars_1778832125506.png', pos: '-300px 0' },
  { id: 'm5', name: 'Noor', avatar: '/Users/diya/.gemini/antigravity/brain/6e2d7445-df75-4bf4-b426-b3d22beca121/model_avatars_1778832125506.png', pos: '-400px 0' },
];

const CATEGORIES = [
  { id: 'clothes', name: 'Clothes', icon: <Shirt size={14} /> },
  { id: 'jewellery', name: 'Jewellery', icon: <Diamond size={14} /> },
  { id: 'watch', name: 'Watch', icon: <Clock size={14} /> },
  { id: 'shoes', name: 'Shoes', icon: <ShoppingBag size={14} /> },
  { id: 'glasses', name: 'Glasses', icon: <Glasses size={14} /> },
  { id: 'all_in_one', name: 'All in One', icon: <Layers size={14} /> },
];

// Mock Data for Categories
const TOP_WEAR = [
  { id: 't1', name: 'Silk Blouse', color: '#3B4A8A', image: '/Users/diya/.gemini/antigravity/brain/6e2d7445-df75-4bf4-b426-b3d22beca121/silk_blouse_product_1778832542680.png' },
  { id: 't2', name: 'Linen Shirt', color: '#2D5A3D' },
  { id: 't3', name: 'Hoodie', color: '#3A3A55' },
];

const BOTTOM_WEAR = [
  { id: 'b1', name: 'Slim Jeans', color: '#1c2a4a' },
  { id: 'b2', name: 'Trousers', color: '#2A2A1C' },
  { id: 'b3', name: 'Skirt', color: '#4A1A3A' },
];

const JEWELLERY = [
  { id: 'j1', name: 'Gold Chain', color: '#FFD700' },
  { id: 'j2', name: 'Pearl Drop', color: '#F0EAD6' },
];

const WATCHES = [
  { id: 'w1', name: 'Classic Leather', color: '#8B4513' },
  { id: 'w2', name: 'Steel Chrono', color: '#708090' },
];

const SHOES = [
  { id: 's1', name: 'Sneakers', color: '#FFFFFF' },
  { id: 's2', name: 'Leather Boots', color: '#3E2723' },
];

const GLASSES = [
  { id: 'g1', name: 'Aviator', color: '#1A1A1A' },
  { id: 'g2', name: 'Wayfarer', color: '#4B0082' },
];

const ALL_IN_ONE = [
  { id: 'a1', name: 'Summer Fit', color: '#FFDAB9' },
  { id: 'a2', name: 'Formal Suit', color: '#111111' },
];

export function VirtualTryonTool() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [selectedModel, setSelectedModel] = useState<any>(MODELS[0]);
  
  // Specific selections based on category
  const [selectedTop, setSelectedTop] = useState<any>(TOP_WEAR[0]);
  const [selectedBottom, setSelectedBottom] = useState<any>(BOTTOM_WEAR[0]);
  const [selectedSingleItem, setSelectedSingleItem] = useState<any>(null); // For watch, shoes, etc.

  const [isGenerating, setIsGenerating] = useState(false);

  // When category changes, set a default item to preview
  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    if (catId === 'jewellery') setSelectedSingleItem(JEWELLERY[0]);
    else if (catId === 'watch') setSelectedSingleItem(WATCHES[0]);
    else if (catId === 'shoes') setSelectedSingleItem(SHOES[0]);
    else if (catId === 'glasses') setSelectedSingleItem(GLASSES[0]);
    else if (catId === 'all_in_one') setSelectedSingleItem(ALL_IN_ONE[0]);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    // Log the intended prompt based on user's spreadsheet instructions
    let promptInstruction = "";
    if (activeCategory === 'clothes') promptInstruction = "Let the model wear all of these items, full body image";
    else if (activeCategory === 'jewellery') promptInstruction = "Let the model wear all of these jewellery, focus on the jewellery, defocus the rest image, product photography against gray background";
    else if (activeCategory === 'watch') promptInstruction = "Let the model wear the attached watch, focus on the watch, defocus the rest image, product photography against gray background";
    else if (activeCategory === 'shoes') promptInstruction = "Let the Model wear the attached shoe, focus on the shoe, defocus the rest image, product photography against gray background";
    else if (activeCategory === 'glasses') promptInstruction = "Let the Model wear the attached glasses, focus on the glasses, defocus the rest image, product photography against gray background";
    else if (activeCategory === 'all_in_one') promptInstruction = "Let this person wear all of these items, full body image";
    
    console.log("Generating with instruction:", promptInstruction);

    setTimeout(() => {
      setIsGenerating(false);
    }, 2500);
  };

  // Helper to render selection lists for single items
  const renderItemSelectionRow = (title: string, items: any[], stepNum: string) => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <span className="px-2 py-0.5 bg-[#60a5fa]/10 text-[#60a5fa] text-[10px] font-bold rounded-md uppercase">Step {stepNum}</span>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/40">{title}</h3>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {items.map(item => (
          <button 
            key={item.id}
            onClick={() => setSelectedSingleItem(item)}
            className={`shrink-0 w-[110px] rounded-2xl border p-3 flex flex-col items-center gap-3 transition-all duration-300 ${
              selectedSingleItem?.id === item.id ? 'bg-[#60a5fa]/10 border-[#60a5fa]' : 'bg-[#151515] border-white/5 hover:border-white/10'
            }`}
          >
            <div 
              className="w-12 h-12 rounded-full border border-white/10 shadow-inner flex items-center justify-center" 
              style={{ background: item.color }}
            >
              {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-full" />}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest text-center ${
              selectedSingleItem?.id === item.id ? 'text-[#60a5fa]' : 'text-white/40'
            }`}>
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full h-[760px] max-h-[85vh] bg-[#0A0A0F] border border-white/5 rounded-[24px] overflow-hidden flex flex-col md:flex-row shadow-2xl relative font-sans">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-[#60a5fa]/5 blur-[120px] pointer-events-none rounded-full" />

      {/* ── LEFT: PREVIEW ── */}
      <div className="w-full md:w-[45%] h-full border-r border-white/5 flex flex-col items-center justify-center p-10 relative bg-gradient-to-b from-[#0A0A0A] to-[#0D0D0D]">
        <div className="relative w-full max-w-[320px] aspect-[2/3] bg-white/[0.02] border border-white/5 rounded-[30px] overflow-hidden flex items-center justify-center backdrop-blur-xl shadow-2xl group">
          
          {/* Mock Representation of selected state on Avatar */}
          <div className="absolute inset-0 bg-[#111] flex items-center justify-center overflow-hidden opacity-30 mix-blend-screen">
             <img src={selectedModel.avatar} alt="Model" className="w-[300%] max-w-none opacity-50 grayscale" style={{ objectPosition: selectedModel.pos }} />
          </div>

          {/* Abstract SVG to represent try-on state */}
          <svg viewBox="0 0 148 210" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full absolute inset-0 z-10">
            <defs>
              <radialGradient id="skinGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#D4956A" />
                <stop offset="100%" stopColor="#B8754A" />
              </radialGradient>
            </defs>
            <line x1="74" y1="0" x2="74" y2="210" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <line x1="0" y1="105" x2="148" y2="105" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

            {/* Base Body Shapes */}
            <rect x="67" y="68" width="14" height="14" rx="4" fill="url(#skinGrad)" />
            <ellipse cx="74" cy="52" rx="20" ry="22" fill="url(#skinGrad)" />
            
            {/* Dynamic Rendering based on Category */}
            {activeCategory === 'clothes' && (
              <>
                <rect x="44" y="158" width="26" height="50" rx="5" fill={selectedBottom?.color || '#1c2a4a'} />
                <rect x="78" y="158" width="26" height="50" rx="5" fill={selectedBottom?.color || '#1c2a4a'} />
                <path d="M30 90 C30 85 48 78 74 78 C100 78 118 85 118 90 L120 162 L28 162 Z" fill={selectedTop?.color || '#3B4A8A'} />
              </>
            )}
            
            {activeCategory === 'all_in_one' && (
              <>
                <path d="M30 90 C30 85 48 78 74 78 C100 78 118 85 118 90 L120 200 L28 200 Z" fill={selectedSingleItem?.color || '#FFDAB9'} />
              </>
            )}

            {activeCategory === 'glasses' && (
               <rect x="58" y="44" width="32" height="12" rx="4" fill={selectedSingleItem?.color || '#000'} opacity="0.8" />
            )}

            {activeCategory === 'jewellery' && (
               <path d="M60 85 Q74 100 88 85" stroke={selectedSingleItem?.color || '#FFD700'} strokeWidth="3" fill="none" />
            )}

            {activeCategory === 'watch' && (
               <rect x="25" y="130" width="10" height="16" rx="2" fill={selectedSingleItem?.color || '#8B4513'} />
            )}
          </svg>

          {/* Category Overlay Label */}
          <div className="absolute top-6 left-6 z-10 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2">
             <span className="text-[#60a5fa]">{CATEGORIES.find(c => c.id === activeCategory)?.icon}</span>
             <span className="text-[10px] font-bold text-white uppercase tracking-widest">{CATEGORIES.find(c => c.id === activeCategory)?.name}</span>
          </div>

          <div className="absolute bottom-6 left-0 right-0 text-center z-10 pointer-events-none">
            <span className="text-[12px] font-bold tracking-[0.2em] text-white/40 uppercase">{selectedModel.name}</span>
          </div>

          <AnimatePresence>
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-4"
              >
                <Loader2 size={32} className="text-[#60a5fa] animate-spin" />
                <span className="text-[10px] font-bold tracking-[0.1em] text-white uppercase animate-pulse">Processing...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <ZoomIn size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <RotateCcw size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: CONTROLS ── */}
      <div className="flex-1 h-full flex flex-col bg-[#0D0D0D]">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          
          {/* Categories Tab Bar */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-2 transition-all ${
                  activeCategory === cat.id ? 'bg-[#2F6BFF] text-white shadow-lg shadow-[#2F6BFF]/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80 border border-transparent hover:border-white/10'
                }`}
              >
                {cat.icon}
                {cat.name}
              </button>
            ))}
          </div>

          {/* Identity (Step 01 for all) */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-[#60a5fa]/10 text-[#60a5fa] text-[10px] font-bold rounded-md uppercase">Step 01</span>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/40">Select Identity</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              <button className="shrink-0 w-[100px] aspect-[4/5] rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-white/20 transition-all text-white/20 hover:text-white/60">
                <Plus size={20} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
              </button>
              {MODELS.map(m => (
                <button 
                  key={m.id}
                  onClick={() => setSelectedModel(m)}
                  className={`shrink-0 w-[100px] aspect-[4/5] rounded-2xl border overflow-hidden transition-all duration-300 relative group ${
                    selectedModel.id === m.id ? 'border-[#60a5fa] ring-4 ring-[#60a5fa]/10' : 'border-white/5'
                  }`}
                >
                  <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center overflow-hidden">
                    <img 
                      src={m.avatar} 
                      alt={m.name} 
                      className="w-[500%] max-w-none transition-transform duration-500 group-hover:scale-110" 
                      style={{ objectPosition: m.pos }} 
                    />
                  </div>
                  <div className={`absolute inset-x-0 bottom-0 py-2 text-center text-[10px] font-bold uppercase tracking-widest ${
                    selectedModel.id === m.id ? 'bg-[#60a5fa] text-black' : 'bg-black/60 text-white/60'
                  }`}>
                    {m.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Steps Based on Category */}
          {activeCategory === 'clothes' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Upper Body */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-[#60a5fa]/10 text-[#60a5fa] text-[10px] font-bold rounded-md uppercase">Step 02</span>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/40">Upper Piece</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {TOP_WEAR.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setSelectedTop(t)}
                      className={`shrink-0 w-[110px] rounded-2xl border p-3 flex flex-col gap-3 transition-all duration-300 ${
                        selectedTop?.id === t.id ? 'bg-[#60a5fa]/10 border-[#60a5fa]' : 'bg-[#151515] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="w-full aspect-square rounded-xl bg-black/20 flex items-center justify-center overflow-hidden">
                        {t.image ? (
                          <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: t.color }} />
                        )}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-widest text-center ${
                        selectedTop?.id === t.id ? 'text-[#60a5fa]' : 'text-white/40'
                      }`}>
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lower Body */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-[#60a5fa]/10 text-[#60a5fa] text-[10px] font-bold rounded-md uppercase">Step 03</span>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/40">Lower Piece</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {BOTTOM_WEAR.map(b => (
                    <button 
                      key={b.id}
                      onClick={() => setSelectedBottom(b)}
                      className={`shrink-0 w-[110px] py-4 rounded-2xl border flex flex-col items-center gap-3 transition-all duration-300 ${
                        selectedBottom?.id === b.id ? 'bg-[#60a5fa]/10 border-[#60a5fa]' : 'bg-[#151515] border-white/5'
                      }`}
                    >
                      <div 
                        className="w-10 h-10 rounded-full border border-white/10" 
                        style={{ background: b.color }}
                      />
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${
                        selectedBottom?.id === b.id ? 'text-[#60a5fa]' : 'text-white/40'
                      }`}>
                        {b.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'jewellery' && renderItemSelectionRow('Select Jewellery', JEWELLERY, '02')}
          {activeCategory === 'watch' && renderItemSelectionRow('Select Watch', WATCHES, '02')}
          {activeCategory === 'shoes' && renderItemSelectionRow('Select Shoes', SHOES, '02')}
          {activeCategory === 'glasses' && renderItemSelectionRow('Select Glasses', GLASSES, '02')}
          {activeCategory === 'all_in_one' && renderItemSelectionRow('Select Outfit', ALL_IN_ONE, '02')}

        </div>

        {/* Footer Action */}
        <div className="px-8 py-8 border-t border-white/5 bg-[#0A0A0A] flex items-center justify-end">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="h-12 px-8 rounded-lg bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white font-bold text-[15px] uppercase tracking-wider flex items-center gap-3 transition-all disabled:opacity-70 shadow-[0_4px_16px_rgba(47,107,255,0.45)] active:scale-[0.98]"
          >
            {isGenerating ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            {isGenerating ? 'Processing' : 'Generate Look'}
          </button>
        </div>
      </div>
    </div>
  );
}
