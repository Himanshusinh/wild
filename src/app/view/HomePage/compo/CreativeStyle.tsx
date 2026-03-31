"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";

type StyleItem = {
  id: string;
  name: string;
  title: string;
  desc: string;
  image: string;
  tag: string;
  titleColor: string;
  href: string;
  imageFilter?: string;
};

const STYLES: StyleItem[] = [
  {
    id: "Maharashtra",
    name: "Maharashtra",
    title: "Warli",
    desc: "Warli art is a traditional folk style from India that uses basic geometric shapes, like triangles, circles, and lines, to create stick-figure depictions of daily social life and nature",
    image: "/HomePage/creativeStyle/warli.jpeg",
    tag: "Film",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
  {
    id: "Maharashtra",
    name: "Maharashtra",
    title: "Warli",
    desc: "Warli art is a traditional folk style from India that uses basic geometric shapes, like triangles, circles, and lines, to create stick-figure depictions of daily social life and nature",
    image: "/HomePage/creativeStyle/warli.jpeg",
    tag: "Film",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
  {
    id: "Maharashtra",
    name: "Maharashtra",
    title: "Warli",
    desc: "Warli art is a traditional folk style from India that uses basic geometric shapes, like triangles, circles, and lines, to create stick-figure depictions of daily social life and nature",
    image: "/HomePage/creativeStyle/warli.jpeg",
    tag: "Film",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
  {
    id: "Maharashtra",
    name: "Maharashtra",
    title: "Warli",
    desc: "Warli art is a traditional folk style from India that uses basic geometric shapes, like triangles, circles, and lines, to create stick-figure depictions of daily social life and nature",
    image: "/HomePage/creativeStyle/warli.jpeg",
    tag: "Film",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
 {
    id: "Maharashtra",
    name: "Maharashtra",
    title: "Warli",
    desc: "Warli art is a traditional folk style from India that uses basic geometric shapes, like triangles, circles, and lines, to create stick-figure depictions of daily social life and nature",
    image: "/HomePage/creativeStyle/warli.jpeg",
    tag: "Film",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
  {
    id: "Maharashtra",
    name: "Maharashtra",
    title: "Warli",
    desc: "Warli art is a traditional folk style from India that uses basic geometric shapes, like triangles, circles, and lines, to create stick-figure depictions of daily social life and nature",
    image: "/HomePage/creativeStyle/warli.jpeg",
    tag: "Film",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
];

type CreativeStyleProps = {
  onWarliOpen?: () => void;
};

export default function CreativeStyle({ onWarliOpen }: CreativeStyleProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleStyleClick = (event: MouseEvent<HTMLAnchorElement>, style: StyleItem) => {
    if (style.title.toLowerCase() !== "warli" || !onWarliOpen) {
      return;
    }

    event.preventDefault();
    onWarliOpen();
  };

  const scrollRight = () => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: Math.max(260, el.clientWidth * 0.8), behavior: "smooth" });
  };

  const scrollLeft = () => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: -Math.max(260, el.clientWidth * 0.8), behavior: "smooth" });
  };

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const updateArrows = () => {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      setShowLeftArrow(el.scrollLeft > 2);
      setShowRightArrow(el.scrollLeft < maxScroll - 2);
    };

    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);

    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  return (
    <section className="bg-[#0E0E12] pb-4 pt-8 sm:pb-8 sm:pt-18 px-4 sm:px-6 lg:px-8">
      <div className="mb-0 flex items-end justify-between ">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#3B82F6]">
            <span className="inline-block h-[1.5px] w-4 bg-[#3B82F6]" />
            Styles
          </p>
          <h2
            className="text-[30px] uppercase leading-none tracking-[0.03em] text-white sm:text-[38px]"
            style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}
          >
            Explore Creative Styles
          </h2>
        </div>

        <Link
          href="/text-to-image"
          className="hidden items-center gap-1 rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold text-white/55 transition-colors hover:border-[#3B82F6]/40 hover:text-[#3B82F6] md:inline-flex"
        >
          <span>All styles</span>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 6h7M6 2.5L9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="relative">
        <div
          ref={railRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-4 sm:px-6 lg:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {STYLES.map((style, index) => (
            <Link
              key={`${style.id}-${index}`}
              href={style.href}
              onClick={(event) => handleStyleClick(event, style)}
              className="w-full md:w-[340px] shrink-0 snap-start"
            >
              <div className="mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#18181f] sm:mb-3">
                <div className="group relative h-[190px] sm:h-[220px]">
                  <img
                    src={style.image}
                    alt={style.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    style={{ filter: style.imageFilter }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(0,0,0,0.72)_100%)]" />
                  <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-white/80 backdrop-blur-[6px] sm:left-4 sm:top-4 sm:px-3 sm:text-[9px]">
                    {style.tag}
                  </div>
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <div
                      className="text-[30px] uppercase leading-none tracking-[0.06em] sm:text-[34px]"
                      style={{
                        color: style.titleColor,
                        fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif",
                        textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                      }}
                    >
                      {style.title}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-0.5 pb-1">
                <div className="mb-1 text-[12.5px] font-bold tracking-[-0.01em] text-white sm:text-[13px]">{style.name}</div>
                <p className="line-clamp-2 text-[11px] leading-[1.45] text-white/45 sm:text-[11.5px] sm:leading-[1.5]">{style.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollLeft}
          disabled={!showLeftArrow}
          aria-label="Scroll styles left"
          className={`absolute left-1 top-[40%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:flex lg:left-10 ${showLeftArrow ? "opacity-100" : "opacity-35"}`}
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M8 2.5L4.5 6L8 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={scrollRight}
          disabled={!showRightArrow}
          aria-label="Scroll styles right"
          className={`absolute right-1 top-[40%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:flex lg:right-10 ${showRightArrow ? "opacity-100" : "opacity-35"}`}
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
