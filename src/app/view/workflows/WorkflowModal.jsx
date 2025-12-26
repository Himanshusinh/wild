'use client';

import { useState, useEffect } from 'react';
import { X, UploadCloud, Zap, Sparkles, Wand2, Layers, ChevronRight } from 'lucide-react';

export default function WorkflowModal({ isOpen, onClose, workflowData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [promptText, setPromptText] = useState("");

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setIsGenerating(false);
      setPromptText("");
    }
  }, [isOpen, workflowData]);

  if (!workflowData) return null;

  const handleRunWorkflow = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      setResult(workflowData.sampleAfter);
    }, 3000);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className={`relative w-full max-w-6xl h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
        <button onClick={onClose} className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X size={20} /></button>

        {/* Left Column: Controls */}
        <div className="w-full md:w-[45%] p-8 lg:p-12 flex flex-col border-b md:border-b-0 md:border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
            <p className="text-slate-400 text-lg mb-4 leading-relaxed">{workflowData.description}</p>
            {workflowData.model && <p className="text-xs font-mono text-slate-500 mb-8">Model: {workflowData.model}</p>}

            {/* Upload Area */}
            <div className="border-2 border-dashed border-white/15 rounded-2xl bg-black/20 h-48 flex flex-col items-center justify-center text-center p-6 group hover:border-[#60a5fa]/50 hover:bg-[#60a5fa]/5 transition-all cursor-pointer relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-[#60a5fa]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 mb-3 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-[#60a5fa] group-hover:scale-110 transition-all relative z-10"><UploadCloud size={20} /></div>
              <p className="text-white font-medium mb-1 relative z-10">Upload Image</p>
              <p className="text-xs text-slate-500 relative z-10">JPG, PNG, WebP up to 25MB</p>
            </div>

            {/* Optional Text Box */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Additional Details (Optional)</label>
              <textarea
                className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-colors resize-none"
                rows={4}
                placeholder="Add extra data or specific instructions here..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center justify-between text-sm text-slate-500 mb-4 font-mono"><span>Cost estimated:</span><span className="text-white flex items-center gap-1"><Zap size={12} className="text-[#60a5fa] fill-[#60a5fa]" /> 2 Credits</span></div>
            <button onClick={handleRunWorkflow} disabled={isGenerating} className={`w-full py-4 font-bold rounded-xl text-base transition-all flex items-center justify-center gap-2 relative overflow-hidden group ${isGenerating ? 'bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-[#60a5fa] hover:bg-[#4f8edb] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(96,165,250,0.4)]'}`}>
              {isGenerating ? <><span className="animate-spin"><Sparkles size={18} /></span> Generating...</> : <><span className="relative z-10 flex items-center gap-2"><Wand2 size={18} /> Run Workflow</span><div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div></>}
            </button>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="w-full md:w-[55%] bg-[#020202] relative flex flex-col p-8">
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none flex items-center px-8">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2"><Layers size={14} /> Result Preview</span>
          </div>

          <div className="flex-1 flex flex-col gap-4 justify-center h-full overflow-y-auto">
            {/* Input Image */}
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-[#111] group">
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-white/5 z-10">
                {result ? "Your Input" : "Sample Input"}
              </div>
              <img
                src={result ? "https://images.unsplash.com/photo-1542291026-6610b8445771?q=80&w=800&auto=format&fit=crop" : workflowData.sampleBefore}
                className="w-full h-full object-contain"
                alt="Input"
              />
            </div>

            <div className="flex justify-center text-slate-600">
              <div className="bg-[#111] p-2 rounded-full border border-white/10">
                <ChevronRight className="rotate-90 md:rotate-90" size={20} />
              </div>
            </div>

            {/* Output Image */}
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-[#111] group">
              <div className={`absolute top-3 left-3 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border z-10 ${result ? 'bg-[#60a5fa]/20 text-[#60a5fa] border-[#60a5fa]/30' : 'bg-black/60 text-slate-300 border-white/5'}`}>
                {result ? "Generated Result" : "Sample Output"}
              </div>

              {isGenerating && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-in fade-in">
                  <div className="w-12 h-12 border-4 border-[#60a5fa] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-[#60a5fa] font-mono text-xs animate-pulse">Processing...</span>
                </div>
              )}

              <img
                src={result || workflowData.sampleAfter}
                className={`w-full h-full object-contain transition-all duration-700 ${isGenerating ? 'scale-105 blur-sm grayscale' : 'scale-100 blur-0 grayscale-0'}`}
                alt="Output"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
