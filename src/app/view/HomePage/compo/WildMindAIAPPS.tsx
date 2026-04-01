"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WORKFLOWS_DATA } from "../../workflows/components/data";
import ImageComparisonSlider from "../../workflows/components/ImageComparisonSlider";

const FEATURE_IDS = [
  "creatively-upscale",
  "remove-background",
  "restore-old-photo",
  "photo-to-line-drawing",
  "line-drawing-to-photo",
  "vintage-teleport",
  "polaroid-style",
  "remove-element",
  "replace-element",
  "remove-watermark",
  
];

const WildMindAIAPPS = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const filteredApps = WORKFLOWS_DATA.filter((app: any) => FEATURE_IDS.includes(app.id));
  const sortedApps = FEATURE_IDS.map((id) => filteredApps.find((app: any) => app.id === id)).filter(Boolean);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 2);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 2);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", checkScroll);
    checkScroll();
    const timer = window.setTimeout(checkScroll, 100);
    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.clearTimeout(timer);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const getRedirectionPath = (app: any) => {
    if (app.id === "remove-background") return "/view/workflows/general/remove-background";
    if (app.id === "restore-old-photo") return "/view/workflows/general/restore-old-photo";
    if (app.id === "remove-element") return "/view/workflows/general/remove-element";
    if (app.id === "remove-watermark") return "/view/workflows/general/remove-watermark";
    if (app.id === "creatively-upscale") return "/view/workflows/general/creatively-upscale";
    if (app.id === "replace-element") return "/view/workflows/general/replace-element";

    return `/view/workflows/${app.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${app.id}`;
  };

  return (
    <section className="relative w-full bg-[#0E0E12] px-5 py-8 sm:px-4 sm:py-10 md:px-6 md:py-12 lg:px-8">
      <div className="mb-1 flex flex-col gap-3 sm:mb-0 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div
            className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] sm:text-[10px]"
            style={{ color: "#3B82F6" }}
          >
            <span className="inline-block h-[1.5px] w-3.5 sm:w-4" style={{ background: "#3B82F6" }} />
            WildMind AI Apps
          </div>
          <h2
            className="text-[30px] leading-none tracking-[0.02em] text-white sm:text-[32px] lg:text-[36px]"
            style={{ fontFamily: "var(--font-bebas-neue), sans-serif" }}
          >
            Image Editing <span className="text-[24px] text-white/35 sm:text-[28px]">-</span>
          </h2>
        </div>

        <Link
          href="/view/workflows"
          className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-white/10 sm:px-[18px]"
        >
          View all
        </Link>
      </div>

      <div className="relative group/carousel">
        <style>{`
          .apps-section-compact [class*="top-3 left-3"],
          .apps-section-compact [class*="top-3 right-3"] {
            top: 0.45rem !important;
          }
          .apps-section-compact [class*="top-3 left-3"] {
            left: 0.45rem !important;
          }
          .apps-section-compact [class*="top-3 right-3"] {
            right: 0.45rem !important;
          }
          .apps-section-compact [class*="px-3 py-1 rounded-full"] {
            padding: 0.2rem 0.55rem !important;
            font-size: 0.55rem !important;
            line-height: 1 !important;
          }
          @media (min-width: 640px) {
            .apps-section-compact [class*="top-3 left-3"],
            .apps-section-compact [class*="top-3 right-3"] {
              top: 0.55rem !important;
            }
            .apps-section-compact [class*="top-3 left-3"] {
              left: 0.55rem !important;
            }
            .apps-section-compact [class*="top-3 right-3"] {
              right: 0.55rem !important;
            }
            .apps-section-compact [class*="px-3 py-1 rounded-full"] {
              padding: 0.22rem 0.6rem !important;
              font-size: 0.58rem !important;
            }
          }
        `}</style>
        <button
          onClick={() => scroll("left")}
          className={`absolute left-0 top-[42%] z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 md:flex ${showLeftArrow ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={() => scroll("right")}
          className={`absolute right-0 top-[42%] z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 md:flex ${showRightArrow ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          ref={scrollContainerRef}
          className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible px-1 pb-4 pt-2 sm:mx-0 sm:gap-4 sm:px-0"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x",
            overscrollBehaviorX: "contain",
          }}
        >
          {sortedApps.map((app: any) => (
            <div
              key={app.id}
              className="w-[220px] shrink-0 sm:w-[236px] md:w-[248px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <Link href={getRedirectionPath(app)} className="group block">
                <div className="mb-2.5 overflow-hidden rounded-[14px] border border-white/8 transition-all duration-200 group-hover:-translate-y-[3px] group-hover:border-white/20 group-hover:shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
                  <div className="apps-section-compact relative h-[248px] sm:h-[272px] md:h-[290px]">
                    <ImageComparisonSlider
                      beforeImage={app.sampleBefore}
                      afterImage={app.sampleAfter}
                      beforeLabel="Before"
                      afterLabel="After"
                      imageFit={app.imageFit || "object-cover"}
                      imagePosition={app.imagePosition || "object-center"}
                      autoSlide={false}
                      hoverToSlide={true}
                    />
                  </div>
                </div>

                <div className="px-1 text-center text-[10px] font-bold uppercase leading-snug tracking-[0.06em] text-white/75 sm:text-[11px]">
                  {app.title}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WildMindAIAPPS;
