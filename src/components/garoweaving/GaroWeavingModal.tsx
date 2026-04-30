import React, { useState, useEffect } from 'react';
import { X, Wand2, RefreshCw, Layers, Sparkles, Image as ImageIcon, Type, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { GaroWeavingVersion, GaroWeavingState, INITIAL_GARO_WEAVING_STATE } from './types';
import GaroWeavingHeader from './GaroWeavingHeader';
import { garoweavingPromptCatalog } from '@/app/view/HomePage/compo/styles/garoweaving/garoweavingPromptCatalog';

interface GaroWeavingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: { prompt: string; version: GaroWeavingVersion; inputMode: 'text' | 'image' }) => void;
}

const GaroWeavingModal: React.FC<GaroWeavingModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [state, setState] = useState<GaroWeavingState>(INITIAL_GARO_WEAVING_STATE);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setState(INITIAL_GARO_WEAVING_STATE);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentVersionData = garoweavingPromptCatalog.versions.find(v => v.id === state.version);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      const finalPrompt = state.inputMode === 'image' 
        ? `${currentVersionData?.promptI2I} \n\nAdditional context: ${state.prompt}`
        : `${currentVersionData?.prompt} \n\nSubject: ${state.prompt}`;
      
      onGenerate({
        prompt: finalPrompt,
        version: state.version,
        inputMode: state.inputMode
      });
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-[#0A0A0B] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Section */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-white/[0.02] to-transparent">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"
          >
            <X size={20} />
          </button>
          
          <GaroWeavingHeader 
            currentVersion={state.version}
            onVersionChange={(v) => setState(prev => ({ ...prev, version: v }))}
          />

          {/* Mode Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setState(prev => ({ ...prev, inputMode: 'text' }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                state.inputMode === 'text' 
                  ? 'bg-white/10 text-white border border-white/20' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Type size={16} />
              Text to Image
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, inputMode: 'image' }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                state.inputMode === 'image' 
                  ? 'bg-white/10 text-white border border-white/20' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <ImageIcon size={16} />
              Image to Image
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Input Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
                <Wand2 size={12} />
                {state.inputMode === 'text' ? 'Generation Prompt' : 'Style Context'}
              </label>
              <span className="text-[10px] text-white/20">Refined by Garo Weaving Intelligence</span>
            </div>
            
            <div className="relative group">
              <textarea
                value={state.prompt}
                onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder={state.inputMode === 'text' 
                  ? "Describe the scene you want to generate in Garo Weaving style..." 
                  : "How should the style interact with your source image?"}
                className="w-full h-32 bg-white/[0.02] border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all resize-none text-sm leading-relaxed"
              />
              <div className="absolute top-4 right-4 pointer-events-none opacity-20 group-focus-within:opacity-40 transition-opacity">
                <Sparkles size={20} className="text-white" />
              </div>
            </div>
          </div>

          {/* Chips section */}
          <div className="space-y-4">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
              <Layers size={12} />
              Style Components
            </label>
            <div className="flex flex-wrap gap-2">
              {garoweavingPromptCatalog.chips.map((chip, index) => (
                <div 
                  key={index}
                  className="px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/5 text-[11px] text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-default"
                >
                  {chip}
                </div>
              ))}
            </div>
          </div>

          {/* Prompt Preview */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Zap size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Active System Logic</span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed italic">
              {state.inputMode === 'text' ? currentVersionData?.prompt.slice(0, 200) : currentVersionData?.promptI2I.slice(0, 200)}...
            </p>
          </div>
        </div>

        {/* Footer Section */}
        <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-white/40">
                <ShieldCheck size={12} />
                <span className="text-[10px]">Verified Garo Weaving Pattern System</span>
              </div>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !state.prompt}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl font-semibold transition-all shadow-xl group ${
                isGenerating || !state.prompt
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-blue-50 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Masterpiece
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GaroWeavingModal;
