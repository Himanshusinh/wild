"use client";

type GenerationMode = "image" | "video";

interface ImageVideoToggleProps {
  mode: GenerationMode;
  onChange: (mode: GenerationMode) => void;
  className?: string;
}

export default function ImageVideoToggle({ mode, onChange, className = "" }: ImageVideoToggleProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="inline-flex items-center gap-1 rounded-full border border-[#E5E4E0] bg-white p-1 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={() => onChange("image")}
          className={`rounded-full px-7 py-1.5 text-[12px] font-semibold transition-colors sm:text-[13px] ${mode === "image"
            ? "bg-[#3B82F6] text-white"
            : "bg-white text-[#556070] hover:bg-[#eef3ff]"
            }`}
        >
          Image
        </button>
        <button
          type="button"
          onClick={() => onChange("video")}
          className={`rounded-full px-7 py-1.5 text-[12px] font-semibold transition-colors sm:text-[13px] ${mode === "video"
            ? "bg-[#3B82F6] text-white"
            : "bg-white text-[#556070] hover:bg-[#eef3ff]"
            }`}
        >
          Video
        </button>
      </div>
    </div>
  );
}

