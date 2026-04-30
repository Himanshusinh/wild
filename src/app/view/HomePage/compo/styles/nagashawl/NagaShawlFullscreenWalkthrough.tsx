"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Play, Info, Sparkles, Wand2, Boxes, Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { nagashawlPromptCatalog } from "./nagashawlPromptCatalog";

interface FullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const NagashawlFullscreenWalkthrough: React.FC<FullscreenWalkthroughProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [activeVersion, setActiveVersion] = useState<"V1" | "V2" | "V3">("V1");

  if (!isOpen) return null;

  const handleTryIt = () => {
    const promptData = nagashawlPromptCatalog.prompts[activeVersion];
    // Store in localStorage for the generation page
    localStorage.setItem("selectedPrompt", JSON.stringify(promptData));
    localStorage.setItem("selectedStyleID", "nagashawl");
    localStorage.setItem("selectedStyleName", "Naga Shawl");
    localStorage.setItem("selectedVersion", activeVersion);
    router.push("/text-to-image");
    onClose();
  };

  const versions = [
    {
      id: "V1",
      title: "V1 — Authentic",
      desc: "Pure source-faithful visual grammar",
      icon: <Boxes className="w-4 h-4" />,
      color: "from-blue-500/20 to-indigo-500/20",
      borderColor: "border-blue-500/30",
    },
    {
      id: "V2",
      title: "V2 — Artisan",
      desc: "Creative 2D + 3D translation",
      icon: <Palette className="w-4 h-4" />,
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
    },
    {
      id: "V3",
      title: "V3 — Cinematic",
      desc: "Realistic 3D dimensional world",
      icon: <Sparkles className="w-4 h-4" />,
      color: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0E0E12] lg:bg-black/90 backdrop-blur-xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col lg:flex-row overflow-hidden shadow-2xl lg:h-[85vh] lg:rounded-3xl border border-white/10 bg-[#0E0E12]">
        <div className="relative w-full lg:w-1/2 h-[35vh] lg:h-full">
          <img
            src="/HomePage/creativeStyle/Next Styles Images/NAGA SHAWL.png"
            alt="Naga Shawl"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0E0E12]/90" />
          
          <button
            onClick={onClose}
            className="absolute top-6 left-6 p-2.5 rounded-full bg-black/40 border border-white/20 text-white/90 hover:bg-black/60 transition-all hover:scale-110 lg:hidden"
          >
            <X size={20} />
          </button>

          <div className="absolute bottom-8 left-8 right-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                Nagaland
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-white mb-2 tracking-tight uppercase leading-none">
              Naga Shawl
            </h1>
            <p className="text-white/60 text-sm lg:text-lg max-w-md leading-relaxed font-medium">
              A traditional handloom textile defined by distinct color-blocks, symbolic woven motifs, and social hierarchy within the cloth.
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto custom-scrollbar">
          <div className="hidden lg:flex justify-end mb-8">
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all hover:scale-110"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-[1px] bg-blue-500" />
              <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">
                Generation Logic
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVersion(v.id as any)}
                  className={`relative flex flex-col p-4 rounded-2xl border transition-all duration-300 text-left ${
                    activeVersion === v.id
                      ? `bg-gradient-to-br ${v.color} ${v.borderColor} shadow-lg shadow-black/20`
                      : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]"
                  }`}
                >
                  <div className={`p-2 rounded-lg w-fit mb-3 ${
                    activeVersion === v.id ? "bg-white/20" : "bg-white/5"
                  }`}>
                    {v.icon}
                  </div>
                  <div className="text-xs font-bold text-white mb-1">{v.title}</div>
                  <div className="text-[10px] text-white/40 leading-tight">
                    {v.desc}
                  </div>
                  {activeVersion === v.id && (
                    <div className="absolute top-3 right-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-white/10 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Wand2 size={16} />
                  </div>
                  <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
                    Core System
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed italic pr-4">
                  "{nagashawlPromptCatalog.prompts[activeVersion].promptHard.substring(0, 300)}..."
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-white/10 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Sparkles size={16} />
                  </div>
                  <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
                    Translation Rules
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["Structural Order", "Symbolic Unity", "Woven Logic", "System Integrity"].map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] text-white/40">
                      <div className="w-1 h-1 rounded-full bg-purple-500/50" />
                      {rule}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleTryIt}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95 group"
            >
              <Play size={18} fill="currentColor" />
              Try it with {activeVersion.toUpperCase()}
            </button>
            
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-bold text-sm transition-all active:scale-95"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  , document.body
  );
};

export default NagashawlFullscreenWalkthrough;
