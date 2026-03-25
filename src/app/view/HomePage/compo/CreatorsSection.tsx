"use client";

import { useState } from "react";

const cards = [
  {
    label: "Designers",
    gradient: "linear-gradient(160deg,#1a3a8a,#2d5abf)",
    seedBg: "des11",
    seedRight: "des22",
    title: "Tools that work like you do",
    desc: "Streamline your design process with AI-powered tools and high-quality assets that help you work faster. Automate repetitive tasks, customize assets instantly, and keep every design consistent and on-brand.",
  },
  {
    label: "Marketers",
    gradient: "linear-gradient(160deg,#2d1060,#7c3aed)",
    seedBg: "mkt11",
    seedRight: "mkt22",
    title: "Create faster, explore new possibilities",
    desc: "Produce high-quality visuals in seconds. Adapt assets for every channel, automate repetitive tasks, and scale campaigns while keeping every piece consistent and on-brand.",
  },
  {
    label: "Filmmakers",
    gradient: "linear-gradient(160deg,#0a3d62,#0d7de8)",
    seedBg: "film11",
    seedRight: "film22",
    title: "Bring your vision to screen",
    desc: "From concept art to storyboards to final video - generate cinematic content at every stage of production with AI that understands your creative direction.",
  },
  {
    label: "Content creators",
    gradient: "linear-gradient(160deg,#5c1a4a,#c0347a)",
    seedBg: "cont11",
    seedRight: "cont22",
    title: "Create content that stands out",
    desc: "Generate thumbnails, reels, social visuals and branded content at scale. Stay consistent, stay viral - with AI tools built for the speed of social media.",
  },
];

export default function CreatorsSection() {
  const [active, setActive] = useState(0);
  const activeCard = cards[active];

  return (
    <section className="bg-[#0E0E12] px-4 pb-8 sm:px-8 sm:pb-[52px]">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2
          className="max-w-[260px] text-[24px] font-bold leading-[1.1] tracking-[-0.02em] text-white sm:max-w-[480px] sm:text-[26px] sm:leading-[1.2]"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          Everything creators need, in one place
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => setActive((active - 1 + cards.length) % cards.length)}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/10 bg-white/5 text-[14px] text-white transition-all duration-150 hover:bg-white/10"
            aria-label="Previous card"
          >
            &lt;
          </button>
          <button
            onClick={() => setActive((active + 1) % cards.length)}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/10 bg-white/5 text-[14px] text-white transition-all duration-150 hover:bg-white/10"
            aria-label="Next card"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Mobile: single active card */}
      <div className="relative h-[220px] overflow-hidden rounded-2xl border border-white/10 md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://picsum.photos/seed/${activeCard.seedBg}/900/700`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.34 }}
        />
        <div className="absolute inset-0" style={{ background: activeCard.gradient, opacity: 0.82 }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.44)_100%)]" />

        <div className="relative z-[2] flex h-full flex-col gap-1 p-2.5">
          <div className="text-[12px] font-bold text-white/95">{activeCard.label}</div>
          <h3 className="max-w-[220px] text-[17px] font-bold leading-[1.08] tracking-[-0.02em] text-white">
            {activeCard.title}
          </h3>
          <p className="max-w-[240px] text-[10.5px] leading-[1.42] text-white/80">
            {activeCard.desc}
          </p>
          <button
            className="mt-0.5 w-fit rounded-full bg-white px-3.5 py-1.5 text-[10.5px] font-bold text-[#111]"
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            View more
          </button>

        </div>
      </div>

      {/* Desktop/Tablet: accordion cards */}
      <div className="hidden h-[440px] gap-[10px] overflow-hidden md:flex" id="crCards">
        {cards.map((card, i) => {
          const isActive = i === active;

          return (
            <div
              key={card.label}
              onClick={() => setActive(i)}
              className="relative h-full cursor-pointer overflow-hidden rounded-2xl border border-white/8 transition-[flex,transform,border-color] duration-500 ease-out"
              style={{
                background: card.gradient,
                flex: isActive ? 5.4 : 1,
                borderColor: isActive ? "rgba(96, 165, 250, 0.55)" : "rgba(255,255,255,0.08)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="absolute inset-0 h-full w-full object-cover"
                src={`https://picsum.photos/seed/${card.seedBg}/900/700`}
                alt=""
                style={{
                  opacity: isActive ? 0.32 : 0.95,
                  transition: "opacity 280ms ease",
                }}
              />

              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                  background: card.gradient,
                  opacity: isActive ? 0.82 : 0.2,
                }}
              />

              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.42) 100%)",
                }}
              />

              <div
                className={`absolute left-4 top-4 z-[3] text-sm font-bold text-white transition-opacity duration-200 ${isActive ? "opacity-0" : "opacity-100"}`}
              >
                {card.label}
              </div>

              <div
                className={`absolute inset-0 z-[4] flex h-full flex-col gap-6 p-8 transition-opacity duration-300 md:flex-row md:items-center ${isActive ? "pointer-events-auto opacity-100 delay-150" : "pointer-events-none opacity-0"}`}
              >
                <div className="flex min-w-0 flex-col md:w-[280px] md:flex-[0_0_280px]">
                  <div className="mb-3 text-sm font-bold text-white/90">
                    {card.label}
                  </div>

                  <h3
                    className="mb-3 text-[20px] font-bold leading-[1.08] tracking-[-0.02em] text-white sm:text-[22px] md:text-[26px]"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    {card.title}
                  </h3>

                  <p className="mb-6 text-[11px] leading-[1.65] text-white/75">
                    {card.desc}
                  </p>

                  <button
                    className="mt-auto w-fit rounded-full bg-white px-6 py-2.5 text-[12px] font-bold text-[#111] transition-all duration-200 hover:bg-white/90"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    View more
                  </button>
                </div>

                <div className="min-h-0 flex-1 self-stretch overflow-hidden rounded-[16px] md:max-h-[340px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://picsum.photos/seed/${card.seedRight}/900/620`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
