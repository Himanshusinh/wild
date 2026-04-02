"use client";

import React from "react";

interface SceneInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SceneInput({ value, onChange }: SceneInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Describe your scene... e.g. a woman in a saree standing near a bench with a young girl holding a book, park setting with trees"
        className="w-full resize-none rounded-xl border border-white/10 bg-[#13131a] px-4 py-3 text-[13px] leading-relaxed text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/20 focus:bg-[#13131a]"
      />
      <p className="px-0.5 text-[11px] text-white/20">
        Claude will extract characters, objects, and setting automatically.
      </p>
    </div>
  );
}
