"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAutoResumeIntent } from "@/lib/autoResume";
import { enhancePromptAPI } from "@/lib/api/geminiApi";
import toast from "react-hot-toast";

type GenerationMode = "image" | "video";

interface MasonrySectionProps {
  mode?: GenerationMode;
  onModeChange?: (mode: GenerationMode) => void;
}

const IMAGE_SUGGESTED_PROMPTS = [
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

const VIDEO_SUGGESTED_PROMPTS = [
  {
    label: "Cinematic pan",
    value: "Cinematic pan shot of a neon city street at night, smooth camera movement",
  },
  {
    label: "Drone flyover",
    value: "Drone flyover above snowy mountains at sunrise, ultra realistic",
  },
  {
    label: "Anime action",
    value: "Anime-style action sequence with dynamic motion and dramatic lighting",
  },
  {
    label: "Product ad",
    value: "Luxury perfume product ad video with soft light and slow motion splashes",
  },
  {
    label: "Nature timelapse",
    value: "Time-lapse of blooming flowers in a dreamy garden with gentle camera push",
  },
];

export default function MasonrySection({ mode = "image", onModeChange }: MasonrySectionProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const generateMenuRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedGenerateType, setSelectedGenerateType] = useState<GenerationMode>(mode);
  const [showGenerateMenu, setShowGenerateMenu] = useState(false);

  const fillPrompt = (value: string) => {
    setPrompt(value);
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(value.length, value.length);
    });
  };

  const handleGenerateByType = (targetType: "image" | "video") => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isGenerating) return;

    setIsGenerating(true);
    if (targetType === "video") {
      // Video InputBox restores `selectedModel` from auto-resume intent
      saveAutoResumeIntent("video", {
        prompt: trimmedPrompt,
        selectedModel: "seedance-1.0-lite-t2v",
      });
      router.push("/text-to-video");
      return;
    }

    // Image InputBox restores `model` from auto-resume intent
    saveAutoResumeIntent("image", {
      prompt: trimmedPrompt,
      model: "seedream-5-lite",
    });
    router.push("/text-to-image");
  };

  const handleGenerate = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isGenerating) return;
    handleGenerateByType(selectedGenerateType);
  };

  useEffect(() => {
    setSelectedGenerateType(mode);
  }, [mode]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!generateMenuRef.current) return;
      if (!generateMenuRef.current.contains(event.target as Node)) {
        setShowGenerateMenu(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleModeToggle = (nextMode: GenerationMode) => {
    setSelectedGenerateType(nextMode);
    setShowGenerateMenu(false);
    onModeChange?.(nextMode);
  };

  const suggestedPrompts =
    selectedGenerateType === "video" ? VIDEO_SUGGESTED_PROMPTS : IMAGE_SUGGESTED_PROMPTS;

  const handleEnhancePrompt = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isEnhancing) return;

    try {
      setIsEnhancing(true);
      const mediaType = selectedGenerateType === "video" ? "video" : "image";
      const res = await enhancePromptAPI(trimmedPrompt, "openai/gpt-4o", mediaType);

      if (res.ok && res.enhancedPrompt) {
        setPrompt(res.enhancedPrompt);
        toast.success("Prompt enhanced");
        inputRef.current?.focus();
      } else {
        toast.error(res.error || "Failed to enhance prompt");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to enhance prompt");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <section className="relative overflow-visible bg-[#0E0E12] px-4 pt-12 sm:px-4 sm:pt-16 md:px-4 md:pt-20 lg:px-4 lg:pt-24 xl:px-16">
      <div className="relative z-30 mx-auto flex w-full max-w-auto flex-col items-center px-1 text-center sm:px-4">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-4 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.18)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] shadow-[0_0_8px_#3B82F6]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#555]">
            {selectedGenerateType === "video" ? "AI Video Studio" : "AI Image Studio"}
          </span>
        </div>

        <h1
          className="mb-5 text-[42px] font-extrabold uppercase leading-[0.9] tracking-[0.02em] text-[#EAF1FF] [text-shadow:0_8px_20px_rgba(0,0,0,0.35)] sm:text-[78px] md:text-[80px] lg:text-[80px] xl:text-[80px] 2xl:text-[120px]"
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

        <div className="mb-4 flex w-full max-w-[920px] items-center gap-1 rounded-full border border-[#E5E4E0] bg-white p-1 pl-2.5 pr-1 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:p-1.5 sm:pl-5">
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
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Describe what you want to create..."
            className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-[13px] text-[#111] outline-none placeholder:text-[#9da2ae] selection:bg-transparent sm:py-2 sm:text-[15px]"
            style={{
              backgroundColor: "transparent",
              WebkitBoxShadow: "0 0 0 1000px transparent inset",
              WebkitTextFillColor: "#111",
            }}
          />

          <button
            type="button"
            onClick={handleEnhancePrompt}
            disabled={!prompt.trim() || isEnhancing}
            className="group relative mr-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5E4E0] bg-[#f5f4f2] text-[#999] transition-colors hover:bg-[#e8e7e3] hover:text-[#333] sm:mr-1 sm:h-10 sm:w-10"
            aria-label="Enhance prompt"
          >
            {isEnhancing ? (
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
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
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4L8 10.6l-3.7 1.8.7-4-3-2.9 4.2-.9L8 1z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#3B82F6] px-2 py-1 text-[10px] font-thin text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              Prompt enhancer
            </span>
          </button>

          <div ref={generateMenuRef} className="relative mr-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowGenerateMenu((prev) => !prev)}
              disabled={isGenerating}
              aria-label="Choose generation type"
              className="inline-flex h-8 items-center gap-1 rounded-full border border-[#E5E4E0] bg-[#f5f4f2] px-2.5 text-[12px] font-medium text-[#555] transition-colors hover:bg-[#e8e7e3] hover:text-[#222] disabled:cursor-default disabled:opacity-75 sm:h-10 sm:px-3 sm:text-[13px]"
            >
              <span className="capitalize">{selectedGenerateType}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`transition-transform ${showGenerateMenu ? "rotate-180" : ""}`}
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showGenerateMenu && (
              <div className="absolute right-0 top-[calc(100%+4px)] z-[140] min-w-[110px] overflow-hidden rounded-xl border border-[#E5E4E0] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                <button
                  type="button"
                  onClick={() => handleModeToggle("image")}
                  disabled={isGenerating}
                  className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[#111] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => handleModeToggle("video")}
                  disabled={isGenerating}
                  className="flex w-full items-center border-t border-[#E5E7EB] px-3 py-2 text-left text-[13px] text-[#111] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Video
                </button>
              </div>
            )}
          </div>

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

        <div className="w-full max-w-[920px] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex w-max min-w-full flex-nowrap justify-center gap-1.5 sm:gap-2">
            {suggestedPrompts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => fillPrompt(item.value)}
                className="shrink-0 rounded-full border border-[#E5E4E0] bg-white px-3.5 py-1.5 text-[11px] text-[#777] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[rgba(59,130,246,0.34)] hover:bg-[rgba(59,130,246,0.09)] hover:text-[#3B82F6] sm:px-4 sm:text-[12px]"
              >
                + {item.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
