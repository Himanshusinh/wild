"use client";

import React from "react";
import { X } from "lucide-react";
import { STYLES } from "./CreativeStyle";

interface AllStylesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStyle: (id: string) => void;
}

export default function AllStylesModal({ isOpen, onClose, onSelectStyle }: AllStylesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 sm:p-6" onClick={onClose}>
      <div 
        className="relative w-full max-w-8xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E12] shadow-[0_32px_120px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}>
              Explore All Styles
            </h2>
            <p className="text-xs text-white/30 font-medium uppercase tracking-widest mt-1">Select a style to begin generating</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/40 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Grid Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1.5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => onSelectStyle(style.id)}
                className="group flex flex-col text-left transition-all hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#18181f]">
                  <img
                    src={style.image}
                    alt={style.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: style.imageFilter }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-[18px] font-bold uppercase tracking-wider text-white sm:text-[22px]" style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}>
                      {style.title}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold tracking-wide text-white/85">
                      {style.name}
                    </div>
                    <div className="mt-1 text-[10px] leading-snug text-white/55 line-clamp-2">
                      {style.desc}
                    </div>
                  </div>

                  <div className="absolute left-4 top-4">
                    <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/80 backdrop-blur-md">
                      {style.tag}
                    </span>
                  </div>
                </div>
                
                <div className="sr-only">
                  <div>{style.name}</div>
                  <p>{style.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
