"use client";

import Link from "next/link";

type ModelPill = {
  label: string;
  active?: boolean;
  color?: string;
  background?: string;
  border?: string;
};

type VideoModel = {
  seed: string;
  name: string;
  brand: string;
  href: string;
  accent: string;
  brandColor: string;
  brandBorder: string;
  pills: ModelPill[];
  specs: string[];
};

const VIDEO_MODELS: VideoModel[] = [
  {
    seed: "veo31",
    name: "Veo 3.1",
    brand: "Google",
    href: "/text-to-video?model=veo3.1-t2v-8s",
    accent: "#3B82F6",
    brandColor: "#7bb8ff",
    brandBorder: "rgba(59,130,246,0.4)",
    pills: [
      {
        label: "3.1",
        active: true,
        color: "#7bb8ff",
        background: "rgba(59,130,246,0.08)",
        border: "rgba(59,130,246,0.3)",
      },
      { label: "Fast" },
    ],
    specs: ["4K", "60fps", "60s"],
  },
  {
    seed: "seed2",
    name: "Seedance 2",
    brand: "ByteDance",
    href: "/text-to-video?model=seedance-1.0-pro-fast-t2v",
    accent: "#3B82F6",
    brandColor: "#3B82F6",
    brandBorder: "rgba(59,130,246,0.4)",
    pills: [
      {
        label: "2 Pro",
        active: true,
        color: "#3B82F6",
        background: "rgba(59,130,246,0.07)",
        border: "rgba(59,130,246,0.3)",
      },
    ],
    specs: ["1080p", "30fps", "30s"],
  },
  {
    seed: "kling3",
    name: "Kling 3.0",
    brand: "Kuaishou",
    href: "/text-to-video?model=kling-2.6-pro",
    accent: "#c084fc",
    brandColor: "#c084fc",
    brandBorder: "rgba(192,132,252,0.4)",
    pills: [
      {
        label: "3.0",
        active: true,
        color: "#c084fc",
        background: "rgba(192,132,252,0.07)",
        border: "rgba(192,132,252,0.3)",
      },
    ],
    specs: ["4K", "30fps", "180s"],
  },
  {
    seed: "ltx23",
    name: "LTX 2.3",
    brand: "Lightricks",
    href: "/text-to-video?model=ltx-2.3-pro-t2v",
    accent: "#fbbf24",
    brandColor: "#fbbf24",
    brandBorder: "rgba(251,191,36,0.4)",
    pills: [
      {
        label: "2.3 Pro",
        active: true,
        color: "#fbbf24",
        background: "rgba(251,191,36,0.07)",
        border: "rgba(251,191,36,0.3)",
      },
      { label: "Fast" },
    ],
    specs: ["1080p", "24fps", "45s"],
  },
  {
    seed: "sora2",
    name: "Sora 2",
    brand: "OpenAI",
    href: "/text-to-video?model=sora2-pro-t2v",
    accent: "#34d399",
    brandColor: "#34d399",
    brandBorder: "rgba(52,211,153,0.4)",
    pills: [
      {
        label: "2",
        active: true,
        color: "#34d399",
        background: "rgba(52,211,153,0.07)",
        border: "rgba(52,211,153,0.3)",
      },
      { label: "2 Pro" },
    ],
    specs: ["4K", "60fps", "120s"],
  },
];

const IMAGE_MODELS: VideoModel[] = [
  {
    seed: "seedream5lite",
    name: "Seedream 5 Lite",
    brand: "ByteDance",
    href: "/text-to-image?model=seedream-5-lite",
    accent: "#3B82F6",
    brandColor: "#3B82F6",
    brandBorder: "rgba(59,130,246,0.4)",
    pills: [{ label: "5 Lite", active: true, color: "#3B82F6", background: "rgba(59,130,246,0.07)", border: "rgba(59,130,246,0.3)" }],
    specs: ["2K", "3K", "Fast"],
  },
  {
    seed: "seedream45",
    name: "Seedream 4.5",
    brand: "ByteDance",
    href: "/text-to-image?model=seedream-4.5",
    accent: "#60a5fa",
    brandColor: "#60a5fa",
    brandBorder: "rgba(96,165,250,0.4)",
    pills: [{ label: "4.5", active: true, color: "#60a5fa", background: "rgba(96,165,250,0.07)", border: "rgba(96,165,250,0.3)" }],
    specs: ["2K", "4K", "Pro"],
  },
  {
    seed: "nanobanana",
    name: "Nano Banana Pro",
    brand: "Google",
    href: "/text-to-image?model=google/nano-banana-pro",
    accent: "#34d399",
    brandColor: "#34d399",
    brandBorder: "rgba(52,211,153,0.4)",
    pills: [{ label: "Pro", active: true, color: "#34d399", background: "rgba(52,211,153,0.07)", border: "rgba(52,211,153,0.3)" }],
    specs: ["2K", "4K", "Accurate"],
  },
  {
    seed: "gptimage15",
    name: "GPT Image 1.5",
    brand: "OpenAI",
    href: "/text-to-image?model=openai/gpt-image-1.5",
    accent: "#c084fc",
    brandColor: "#c084fc",
    brandBorder: "rgba(192,132,252,0.4)",
    pills: [{ label: "1.5", active: true, color: "#c084fc", background: "rgba(192,132,252,0.07)", border: "rgba(192,132,252,0.3)" }],
    specs: ["HD", "Prompt+", "Creative"],
  },
  {
    seed: "flux2pro",
    name: "Flux 2 Pro",
    brand: "BFL",
    href: "/text-to-image?model=flux-2-pro",
    accent: "#fbbf24",
    brandColor: "#fbbf24",
    brandBorder: "rgba(251,191,36,0.4)",
    pills: [{ label: "2 Pro", active: true, color: "#fbbf24", background: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.3)" }],
    specs: ["2K", "Fast", "Detail"],
  },
];

export default function VideoModelCards({ mode = "video" }: { mode?: "image" | "video" }) {
  const models = mode === "video" ? VIDEO_MODELS : IMAGE_MODELS;
  const heading = mode === "video" ? "Video Models" : "Image Models";

  return (
    <section className="pt-8 mx-4 md:mx-[34px] mb-[36px] bg-[#0E0E12]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#3B82F6]">
            <span className="inline-block h-[1.5px] w-3 bg-[#3B82F6]" />
            {heading}
          </div>
          <span className="rounded-full border border-white/10 bg-[#0E0E12] px-2 py-[2px] text-[10px] text-white/45">
            {models.length} models
          </span>
        </div>
        {/* <span className="text-[10px] text-white/40">Updated weekly</span> */}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        {models.map((model) => (
          <Link
            key={model.name}
            href={model.href}
            className="group relative overflow-hidden rounded-[14px] border border-white/10 bg-[#18181f] transition-all duration-200 hover:-translate-y-[3px] hover:border-[#3B82F6]/35 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
          >
            <div className="absolute inset-x-0 top-0 z-[2] h-[2.5px]" style={{ background: model.accent }} />

            <div className="relative h-[110px] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/${model.seed}/300/220`}
                alt={model.name}
                className="h-full w-full object-cover brightness-[0.88] saturate-[0.8] transition-transform duration-500 group-hover:scale-[1.06]"
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(to_top,#18181f,transparent)]" />

              <div
                className="absolute right-2 top-2 rounded-full border bg-black/45 px-2 py-[2px] text-[8px] font-bold uppercase tracking-[0.08em] backdrop-blur-[6px]"
                style={{ borderColor: model.brandBorder, color: model.brandColor }}
              >
                {model.brand}
              </div>

              <div className="absolute left-2 top-2 translate-y-[-3px] rounded-full border border-white/25 bg-black/45 px-2.5 py-1 text-[9px] font-bold text-white/85 opacity-0 backdrop-blur-[6px] transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                Try -&gt;
              </div>
            </div>

            <div className="flex flex-col gap-1.5 px-3 py-2.5 pb-3">
              <div className="text-[13px] font-bold tracking-[-0.01em] text-white">{model.name}</div>

              <div className="flex flex-wrap gap-1">
                {model.pills.map((pill) => (
                  <span
                    key={`${model.name}-${pill.label}`}
                    className="rounded-full border px-2 py-[1px] text-[8.5px] font-semibold tracking-[0.04em]"
                    style={
                      pill.active
                        ? {
                            color: pill.color || "#fff",
                            background: pill.background || "rgba(255,255,255,0.1)",
                            borderColor: pill.border || "rgba(255,255,255,0.3)",
                          }
                        : {
                            color: "rgba(255,255,255,0.45)",
                            borderColor: "rgba(255,255,255,0.1)",
                            background: "transparent",
                          }
                    }
                  >
                    {pill.label}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-1">
                {model.specs.map((spec) => (
                  <span
                    key={`${model.name}-${spec}`}
                    className="rounded-[5px] border border-white/10 bg-[#0E0E12] px-[7px] py-[2px] text-[8.5px] font-semibold tracking-[0.03em] text-white/40"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
