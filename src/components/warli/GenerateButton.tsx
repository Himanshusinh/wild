"use client";

import React from "react";
import { Play } from "lucide-react";
import { ImageCount } from "./types";

interface GenerateButtonProps {
  imageCount: ImageCount;
  loading: boolean;
  onClick: () => void;
}

export function GenerateButton({ imageCount, loading, onClick }: GenerateButtonProps) {
  return (
    <div className="border-t border-white/[0.06] bg-[#0a0a0f] px-5 py-4">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F6BFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(47,107,255,0.35)] transition-all hover:-translate-y-px hover:bg-[#2a5fe3] hover:shadow-[0_6px_24px_rgba(47,107,255,0.5)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="flex gap-1">
              <span className="h-[5px] w-[5px] animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-white/80" />
              <span className="h-[5px] w-[5px] animate-[pulse_1.2s_ease-in-out_0.2s_infinite] rounded-full bg-white/80" />
              <span className="h-[5px] w-[5px] animate-[pulse_1.2s_ease-in-out_0.4s_infinite] rounded-full bg-white/80" />
            </span>
            Generating...
          </>
        ) : (
          <>
            <Play className="h-[14px] w-[14px] fill-white" />
            Generate Warli Art
          </>
        )}
      </button>
    </div>
  );
}
