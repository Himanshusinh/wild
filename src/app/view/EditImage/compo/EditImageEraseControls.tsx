"use client";

import React from "react";

interface EditImageEraseControlsProps {
  brushSize: number;
  setBrushSize: (size: number) => void;
  prompt: string;
  setPrompt: (t: string) => void;
  mode: "replace" | "erase";
  setMode: (m: "replace" | "erase") => void;
  model: string;
  setModel: (m: string) => void;
  isProcessing: boolean;
  onGenerate: () => void;
  onClearMask: () => void;
  onBrushAdjustStart?: () => void;
  onBrushAdjustEnd?: () => void;
}

export const EditImageEraseControls: React.FC<EditImageEraseControlsProps> = ({
  brushSize,
  setBrushSize,
  prompt,
  setPrompt,
  mode,
  setMode,
  model,
  setModel,
  isProcessing,
  onGenerate,
  onClearMask,
  onBrushAdjustStart,
  onBrushAdjustEnd,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Mode toggle */}
      <div className="flex bg-[#1c1c22] border border-[#2a2a34] rounded-[10px] p-1 w-full">
        <button
          onClick={() => setMode("replace")}
          className={`flex-1 px-3 py-2 text-[13px] font-semibold rounded-[8px] transition-colors ${mode === "replace" ? "bg-[#3B6BFF] text-white shadow-[0_4px_16px_rgba(59,107,255,0.28)]" : "text-white/60 hover:bg-white/5"}`}
        >
          Replace
        </button>
        <button
          onClick={() => setMode("erase")}
          className={`flex-1 px-3 py-2 text-[13px] font-semibold rounded-[8px] transition-colors ${mode === "erase" ? "bg-[#3B6BFF] text-white shadow-[0_4px_16px_rgba(59,107,255,0.28)]" : "text-white/60 hover:bg-white/5"}`}
        >
          Erase
        </button>
      </div>

      {/* Brush Size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
            Brush Size
          </span>
          <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
            {brushSize}px
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBrushSize(Math.max(5, brushSize - 5))}
            className="w-8 h-8 rounded-full bg-[#1c1c22] border border-[#2a2a34] hover:bg-white/5 flex items-center justify-center text-white/80 text-xs transition active:scale-95"
          >
            -
          </button>
          <input
            type="range"
            min="5"
            max="200"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            onMouseDown={onBrushAdjustStart}
            onMouseUp={onBrushAdjustEnd}
            onTouchStart={onBrushAdjustStart}
            onTouchEnd={onBrushAdjustEnd}
            className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#3B6BFF] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white cursor-pointer hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
          />
          <button
            onClick={() => setBrushSize(Math.min(200, brushSize + 5))}
            className="w-8 h-8 rounded-full bg-[#1c1c22] border border-[#2a2a34] hover:bg-white/5 flex items-center justify-center text-white/80 text-xs transition active:scale-95"
          >
            +
          </button>
        </div>
      </div>

      {/* Prompt Input */}
      {mode === "replace" && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1">
            Prompt (Optional)
          </span>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe change..."
            className="w-full h-[38px] bg-white/3 border border-white/12 rounded-xl px-3 text-[13px] text-white placeholder-white/40 focus:border-white/30 outline-none transition-colors"
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") onGenerate();
            }}
          />
        </div>
      )}
    </div>
  );
};
