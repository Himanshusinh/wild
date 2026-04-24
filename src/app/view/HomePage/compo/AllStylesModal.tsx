"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { STYLES } from "./CreativeStyle";

interface AllStylesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStyleSelect: (id: string) => void;
}

const StyleCard = ({ style, onClick }: { style: typeof STYLES[0]; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group flex flex-col text-left transition-all hover:-translate-y-1"
  >
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#18181f] transition-colors group-hover:border-white/20">
      <Image
        src={style.image}
        alt={style.title}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        style={{ filter: style.imageFilter as React.CSSProperties["filter"] }}
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
);

export default function AllStylesModal({ isOpen, onClose, onStyleSelect }: AllStylesModalProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem("recent_styles");
      if (stored) {
        try {
          setRecentIds(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse recent styles", e);
        }
      }
    }
  }, [isOpen]);

  const handleStyleSelect = (id: string) => {
    const updated = [id, ...recentIds.filter((x) => x !== id)].slice(0, 10);
    setRecentIds(updated);
    localStorage.setItem("recent_styles", JSON.stringify(updated));
    onStyleSelect(id);
  };

  const { groupedStyles, categories } = useMemo(() => {
    const groups: Record<string, typeof STYLES> = {};
    STYLES.forEach((style) => {
      const stateName = style.name.split(" (")[0];
      if (!groups[stateName]) {
        groups[stateName] = [];
      }
      groups[stateName].push(style);
    });
    
    const sortedStates = Object.keys(groups).sort();
    
    return {
      groupedStyles: sortedStates.map((state) => ({
        state,
        styles: groups[state],
      })),
      categories: ["All", "Recent", ...sortedStates],
    };
  }, []);

  const contentToRender = useMemo(() => {
    if (selectedCategory === "All") {
      return (
        <div className="flex flex-col gap-10">
          {groupedStyles.map((group) => (
            <div key={group.state} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl text-white tracking-wider uppercase" style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}>
                  {group.state}
                </h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {group.styles.map((style) => (
                  <StyleCard key={style.id} style={style} onClick={() => handleStyleSelect(style.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (selectedCategory === "Recent") {
      const recentStyles = recentIds
        .map((id) => STYLES.find((s) => s.id === id))
        .filter(Boolean) as typeof STYLES;
        
      if (recentStyles.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-white/40 pt-20">
            <p className="text-sm font-medium">No recent styles selected yet.</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {recentStyles.map((style) => (
            <StyleCard key={style.id} style={style} onClick={() => handleStyleSelect(style.id)} />
          ))}
        </div>
      );
    }

    const stateStyles = STYLES.filter((s) => s.name.split(" (")[0] === selectedCategory);
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {stateStyles.map((style) => (
          <StyleCard key={style.id} style={style} onClick={() => handleStyleSelect(style.id)} />
        ))}
      </div>
    );
  }, [selectedCategory, groupedStyles, recentIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xl p-3 sm:p-6" onClick={onClose}>
      <div
        className="relative w-full max-w-8xl h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E12] shadow-[0_32px_120px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 sm:px-7 shrink-0">
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

        {/* Categories Tabs Filter */}
        <div className="border-b border-white/5 bg-white/[0.02] px-5 py-4 sm:px-7 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex items-center gap-2 shrink-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-white text-black"
                  : "bg-white/[0.05] text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1.5">
          {contentToRender}
        </div>
      </div>
    </div>
  );
}
