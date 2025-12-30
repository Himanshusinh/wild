import React from 'react';
import {
  Workflow,
  Image as ImageIcon,
  Video,
  Music,
  Wand2,
  Maximize,
  Mic,
  Zap,
  Layers,
  Crop,
  Type,
  Scissors,
  Aperture,
  MessageSquare,
  Move3d,
  Fingerprint
} from 'lucide-react';

/**
 * WILDMIND AI - COMPACT FEATURE STRIP
 * Place this Component exactly between "Recent Creations" and "All Your AI Tools".
 */

export default function CompactFeatureStrip() {
  return (
    
      <div className="max-w-[1600px] m-8 mx-auto">
       
        {/* The Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/10">

          {/* 1. WILD STUDIO (The Core) - Highlighted */}
          <div className="relative group p-6 lg:p-8 overflow-hidden bg-[#050505] hover:bg-[#0A0A0A] transition-colors">
            {/* Blue Ambient Glow on Hover */}
            <div className="absolute top-0 left-0 w-1 h-full bg-[#60a5fa]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#60a5fa]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
           
            <div className="relative z-10 h-full flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#60a5fa] rounded-lg text-black shadow-[0_0_15px_rgba(96,165,250,0.4)]">
                  <Workflow size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Wild Studio</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                The infinite node-based canvas. Connect models, build logic, and create without limits.
              </p>
              <button className="text-xs font-bold uppercase tracking-widest text-[#60a5fa] flex items-center gap-2 group-hover:gap-3 transition-all">
                Enter Studio <span className="text-lg">→</span>
              </button>
            </div>
          </div>

          {/* 2. IMAGE SECTOR */}
          <div className="p-6 lg:p-8 bg-black hover:bg-[#080808] transition-colors group">
            <CategoryHeader icon={<ImageIcon size={16}/>} title="Image" color="text-emerald-400" />
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-4">
               <FeatureItem label="Generation" icon={<Wand2 size={12}/>} />
               <FeatureItem label="Editor" icon={<Crop size={12}/>} />
               <FeatureItem label="Upscale" icon={<Maximize size={12}/>} />
               <FeatureItem label="Remove BG" icon={<Scissors size={12}/>} />
               <FeatureItem label="Erase/Replace" icon={<Zap size={12}/>} />
               <FeatureItem label="Expand" icon={<Move3d size={12}/>} />
               <FeatureItem label="Vectorize" icon={<Aperture size={12}/>} />
               <FeatureItem label="Chat Edit" icon={<MessageSquare size={12}/>} />
            </div>
          </div>

          {/* 3. VIDEO SECTOR */}
          <div className="p-6 lg:p-8 bg-black hover:bg-[#080808] transition-colors group">
            <CategoryHeader icon={<Video size={16}/>} title="Video" color="text-purple-400" />
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-4">
               <FeatureItem label="Video Gen" icon={<Video size={12}/>} />
               <FeatureItem label="Lipsync" icon={<Mic size={12}/>} />
               <FeatureItem label="Animate" icon={<Move3d size={12}/>} />
               <FeatureItem label="Upscale" icon={<Maximize size={12}/>} />
               <FeatureItem label="Remove BG" icon={<Scissors size={12}/>} />
               <FeatureItem label="WildCut" icon={<Layers size={12}/>} highlight={true} />
            </div>
          </div>

          {/* 4. AUDIO SECTOR */}
          <div className="p-6 lg:p-8 bg-black hover:bg-[#080808] transition-colors group">
            <CategoryHeader icon={<Music size={16}/>} title="Audio" color="text-orange-400" />
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-4">
               <FeatureItem label="Music Gen" icon={<Music size={12}/>} />
               <FeatureItem label="Voice (TTS)" icon={<Mic size={12}/>} />
               <FeatureItem label="Dialogue" icon={<MessageSquare size={12}/>} />
               <FeatureItem label="SFX" icon={<Zap size={12}/>} />
               <FeatureItem label="Voice Clone" icon={<Fingerprint size={12}/>} />
            </div>
          </div>

        </div>
      </div>

  );
}

// --- SUB-COMPONENTS FOR CLEANER CODE ---

const CategoryHeader = ({ icon, title, color }: { icon: React.ReactNode, title: string, color: string }) => (
  <div className="flex items-center gap-2 mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
    <span className={`${color}`}>{icon}</span>
    <span className="text-sm font-bold uppercase tracking-wider text-slate-300">{title}</span>
  </div>
);

const FeatureItem = ({ label, icon, highlight }: { label: string, icon: React.ReactNode, highlight?: boolean }) => (
  <div className={`
    flex items-center gap-2 text-xs font-medium cursor-pointer transition-all hover:translate-x-1
    ${highlight ? 'text-white' : 'text-slate-500 hover:text-white'}
  `}>
    <span className="opacity-50">{icon}</span>
    <span>{label}</span>
  </div>
);
