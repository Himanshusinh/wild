"use client";

import { useRef, useState } from "react";

const SUGGESTED_PROMPTS = [
  {
    label: "Cinematic portrait",
    value: "Cinematic portrait, dramatic lighting",
  },
  {
    label: "Neon cityscape",
    value: "Neon cityscape at midnight, rain reflections",
  },
  {
    label: "Abstract art",
    value: "Abstract neon geometric art",
  },
  {
    label: "Vintage film",
    value: "Vintage film photo, 35mm grain, warm tones",
  },
  {
    label: "Dreamy landscape",
    value: "Dreamy misty landscape at sunrise",
  },
];

export default function MasonrySection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const fillPrompt = (value: string) => {
    setPrompt(value);
    inputRef.current?.focus();
  };

  const handleGenerate = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    window.setTimeout(() => setIsGenerating(false), 2200);
  };

  return (
    <section className="relative overflow-hidden bg-[#0E0E12] px-4 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-16 lg:pt-24 xl:px-20">
      <div className="relative mx-auto flex w-full max-w-[980px] flex-col items-center px-1 text-center sm:px-4">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-4 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.18)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] shadow-[0_0_8px_#3B82F6]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#555]">
            AI Image Studio
          </span>
        </div>

        <h1
          className="mb-5 text-[42px] font-extrabold uppercase leading-[0.9] tracking-[0.02em] text-[#EAF1FF] [text-shadow:0_8px_20px_rgba(0,0,0,0.35)] sm:text-[78px] lg:text-[120px]"
          style={{
            fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif",
          }}
        >
          Your imagination our creation
        </h1>

        <p className="mb-8 max-w-[560px] text-[13px] leading-[1.55] text-white/90 sm:text-[16px] sm:leading-[1.7]">
          Turn your imagination into stunning visuals.
          <br />
          One prompt away from something extraordinary.
        </p>

        <div className="mb-4 flex w-full max-w-[760px] items-center gap-1 rounded-full border border-[#E5E4E0] bg-white p-1 pl-2.5 pr-1 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:p-1.5 sm:pl-5">
          <span className="mr-1 flex shrink-0 text-[#8f9199] sm:mr-1.5">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M2 13l4-4 3 3 2-2 5 5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <input
            ref={inputRef}
            type="text"
            id="promptInput"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe what you want to create..."
            className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-[13px] text-[#111] outline-none placeholder:text-[#9da2ae] sm:py-2 sm:text-[15px]"
          />

          <button
            type="button"
            className="mr-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5E4E0] bg-[#f5f4f2] text-[#999] transition-colors hover:bg-[#e8e7e3] hover:text-[#333] sm:mr-1 sm:h-10 sm:w-10"
            aria-label="Enhance prompt"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4L8 10.6l-3.7 1.8.7-4-3-2.9 4.2-.9L8 1z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            id="genBtn"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#3B82F6] px-4 py-2 text-[13px] font-bold text-white shadow-[0_4px_18px_rgba(59,130,246,0.42)] transition-all hover:bg-[#60a5fa] hover:shadow-[0_8px_26px_rgba(59,130,246,0.55)] disabled:cursor-default disabled:opacity-75 sm:px-7 sm:py-3 sm:text-[14px]"
          >
            {isGenerating ? (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle
                    cx="6"
                    cy="6"
                    r="4.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeDasharray="7 18"
                    strokeLinecap="round"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 6 6"
                      to="360 6 6"
                      dur="0.6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </button>
        </div>

        <div className="flex max-w-[700px] flex-wrap justify-center gap-1.5 sm:gap-2">
          {SUGGESTED_PROMPTS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => fillPrompt(item.value)}
              className="rounded-full border border-[#E5E4E0] bg-white px-3.5 py-1.5 text-[11px] text-[#777] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[rgba(59,130,246,0.34)] hover:bg-[rgba(59,130,246,0.09)] hover:text-[#3B82F6] sm:px-4 sm:text-[12px]"
            >
              + {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
