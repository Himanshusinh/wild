'use client';

import React from 'react';

interface EditImageEraseControlsProps {
    brushSize: number;
    setBrushSize: (size: number) => void;
    prompt: string;
    setPrompt: (t: string) => void;
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
            {/* Brush Size */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Brush Size</span>
                    <span className="text-white/60 text-xs">{brushSize}px</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setBrushSize(Math.max(5, brushSize - 5))}
                        className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 text-xs transition active:scale-95"
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
                        className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white cursor-pointer hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                    />
                    <button
                        onClick={() => setBrushSize(Math.min(200, brushSize + 5))}
                        className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 text-xs transition active:scale-95"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Prompt Input */}
            <div className="flex flex-col gap-1.5">
                <span className="text-white/60 text-xs">Prompt (Optional)</span>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe change..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/40 focus:border-white/30 outline-none transition-colors"
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') onGenerate();
                    }}
                />
            </div>
        </div>
    );
};
