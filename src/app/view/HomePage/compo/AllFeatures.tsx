"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type WheelEventHandler } from "react";
import { ChevronLeft, ChevronRight, Clapperboard, Crop, Eraser, ImageIcon, LayoutGrid, Music, PenTool, Scissors, Video } from "lucide-react";
import { ROUTES } from "@/routes/routes";

type CardConfig = {
  title: string;
  subtitle: string;
  href: string;
  featureType?: "image" | "video" | "both";
  badge: ReactNode;
  icon: ReactNode;
  iconClassName: string;
  glowClassName: string;
  hoverClassName: string;
  footerClassName: string;
  cta: string;
};

const CARD_WIDTH = "w-[190px] sm:w-[198px] md:w-[200px]";

const cards: CardConfig[] = [
  {
    title: "Image\nGeneration",
    subtitle: "Text to image - Any style",
    href: ROUTES.TEXT_TO_IMAGE,
    badge: "AI IMAGE",
    icon: <ImageIcon size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#1e3a8a,#3B82F6)] shadow-[0_8px_24px_rgba(59,130,246,0.45)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_68%)]",
    hoverClassName: "hover:border-[#3B82F6]/55 hover:shadow-[0_14px_34px_rgba(59,130,246,0.16)]",
    footerClassName: "bg-[rgba(59,130,246,0.06)] text-[#3B82F6]",
    cta: "Try Now ->",
  },
  {
    title: "Create\nVideo",
    subtitle: "Text or image to video",
    href: ROUTES.TEXT_TO_VIDEO,
    badge: "VIDEO",
    icon: <Video size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#9a3412,#ea580c)] shadow-[0_8px_24px_rgba(234,88,12,0.45)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(234,88,12,0.2),transparent_68%)]",
    hoverClassName: "hover:border-[#ea580c]/55 hover:shadow-[0_14px_34px_rgba(234,88,12,0.14)]",
    footerClassName: "bg-[rgba(234,88,12,0.06)] text-[#ea580c]",
    cta: "Try Now ->",
  },
  {
    title: "Upscale",
    subtitle: "Up to 4x HD resolution",
    href: "/text-to-image/edit-image?tool=expand&feature=upscale",
    badge: (
      <div className="flex items-center gap-1">
        <span className="rounded-[5px] border border-white/10 bg-white/5 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.06em] text-white/45">
          1x
        </span>
        <span className="rounded-[5px] bg-[#d97706] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.06em] text-white">
          4x
        </span>
      </div>
    ),
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 17l6-6M17 3l-6 6M13 3h4v4M3 13v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    iconClassName: "bg-[linear-gradient(135deg,#78350f,#d97706)] shadow-[0_8px_24px_rgba(217,119,6,0.45)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(217,119,6,0.2),transparent_68%)]",
    hoverClassName: "hover:border-[#d97706]/55 hover:shadow-[0_14px_34px_rgba(217,119,6,0.14)]",
    footerClassName: "bg-[rgba(217,119,6,0.06)] text-[#d97706]",
    cta: "Try Now ->",
  },
  {
    title: "Remove\nBG",
    subtitle: "One-click BG removal",
    href: "/text-to-image/edit-image?feature=remove-bg",
    badge: "REMOVE",
    icon: <Scissors size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#14532d,#16a34a)] shadow-[0_8px_24px_rgba(22,163,74,0.45)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(22,163,74,0.2),transparent_68%)]",
    hoverClassName: "hover:border-[#16a34a]/55 hover:shadow-[0_14px_34px_rgba(22,163,74,0.14)]",
    footerClassName: "bg-[rgba(22,163,74,0.06)] text-[#16a34a]",
    cta: "Try Now ->",
  },
  {
    title: "Erase /\nReplace",
    subtitle: "Precise area editing",
    href: "/text-to-image/edit-image?tool=erase-replace&feature=fill",
    badge: "FILL",
    icon: <Eraser size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#1d4ed8,#2563eb)] shadow-[0_8px_24px_rgba(37,99,235,0.42)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.2),transparent_68%)]",
    hoverClassName: "hover:border-[#2563eb]/55 hover:shadow-[0_14px_34px_rgba(37,99,235,0.14)]",
    footerClassName: "bg-[rgba(37,99,235,0.06)] text-[#2563eb]",
    cta: "Try Now ->",
  },
  {
    title: "Expand\nImage",
    subtitle: "Outpaint and resize frame",
    href: "/text-to-image/edit-image?tool=erase-replace&feature=resize",
    badge: "EXPAND",
    icon: <Crop size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#7c2d12,#ea580c)] shadow-[0_8px_24px_rgba(234,88,12,0.42)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(234,88,12,0.2),transparent_68%)]",
    hoverClassName: "hover:border-[#ea580c]/55 hover:shadow-[0_14px_34px_rgba(234,88,12,0.14)]",
    footerClassName: "bg-[rgba(234,88,12,0.06)] text-[#ea580c]",
    cta: "Try Now ->",
  },
  {
    title: "Vectorize",
    subtitle: "Convert image to SVG",
    href: "/text-to-image/edit-image?tool=erase-replace&feature=vectorize",
    featureType: "image",
    badge: "SVG",
    icon: <PenTool size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#581c87,#9333ea)] shadow-[0_8px_24px_rgba(147,51,234,0.42)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(147,51,234,0.2),transparent_68%)]",
    hoverClassName: "hover:border-[#9333ea]/55 hover:shadow-[0_14px_34px_rgba(147,51,234,0.14)]",
    footerClassName: "bg-[rgba(147,51,234,0.06)] text-[#9333ea]",
    cta: "Try Now ->",
  },
  {
    title: "Restore Old\nPhoto",
    subtitle: "Repair and enhance vintage images",
    href: "/view/workflows/general/restore-old-photo",
    featureType: "image",
    badge: "RESTORE",
    icon: <ImageIcon size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#7c2d12,#d97706)] shadow-[0_8px_24px_rgba(217,119,6,0.4)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(217,119,6,0.18),transparent_68%)]",
    hoverClassName: "hover:border-[#d97706]/55 hover:shadow-[0_14px_34px_rgba(217,119,6,0.14)]",
    footerClassName: "bg-[rgba(217,119,6,0.06)] text-[#d97706]",
    cta: "Try Now ->",
  },
  {
    title: "Photo To Line\nDrawing",
    subtitle: "Turn photos into sketch art",
    href: "/view/workflows/general/photo-to-line-drawing",
    featureType: "image",
    badge: "DRAW",
    icon: <PenTool size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#1d4ed8,#60a5fa)] shadow-[0_8px_24px_rgba(96,165,250,0.38)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.18),transparent_68%)]",
    hoverClassName: "hover:border-[#60a5fa]/55 hover:shadow-[0_14px_34px_rgba(96,165,250,0.14)]",
    footerClassName: "bg-[rgba(96,165,250,0.06)] text-[#60a5fa]",
    cta: "Try Now ->",
  },
  {
    title: "Line Drawing\nTo Photo",
    subtitle: "Convert sketches into detailed images",
    href: "/view/workflows/general/line-drawing-to-photo",
    featureType: "image",
    badge: "RENDER",
    icon: <ImageIcon size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#0f766e,#14b8a6)] shadow-[0_8px_24px_rgba(20,184,166,0.38)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_68%)]",
    hoverClassName: "hover:border-[#14b8a6]/55 hover:shadow-[0_14px_34px_rgba(20,184,166,0.14)]",
    footerClassName: "bg-[rgba(20,184,166,0.06)] text-[#14b8a6]",
    cta: "Try Now ->",
  },
  {
    title: "Remove\nElement",
    subtitle: "Erase unwanted objects naturally",
    href: "/view/workflows/general/remove-element",
    featureType: "image",
    badge: "ERASE",
    icon: <Eraser size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] shadow-[0_8px_24px_rgba(37,99,235,0.4)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_68%)]",
    hoverClassName: "hover:border-[#2563eb]/55 hover:shadow-[0_14px_34px_rgba(37,99,235,0.14)]",
    footerClassName: "bg-[rgba(37,99,235,0.06)] text-[#2563eb]",
    cta: "Try Now ->",
  },
  {
    title: "Replace\nElement",
    subtitle: "Swap objects with AI precision",
    href: "/view/workflows/general/replace-element",
    featureType: "image",
    badge: "REPLACE",
    icon: <Scissors size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#065f46,#10b981)] shadow-[0_8px_24px_rgba(16,185,129,0.4)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_68%)]",
    hoverClassName: "hover:border-[#10b981]/55 hover:shadow-[0_14px_34px_rgba(16,185,129,0.14)]",
    footerClassName: "bg-[rgba(16,185,129,0.06)] text-[#10b981]",
    cta: "Try Now ->",
  },

  {
    title: "Remove\nWatermark",
    subtitle: "Clear overlays from images",
    href: "/view/workflows/general/remove-watermark",
    featureType: "image",
    badge: "CLEANUP",
    icon: <Eraser size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#475569,#94a3b8)] shadow-[0_8px_24px_rgba(148,163,184,0.36)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.16),transparent_68%)]",
    hoverClassName: "hover:border-[#94a3b8]/55 hover:shadow-[0_14px_34px_rgba(148,163,184,0.14)]",
    footerClassName: "bg-[rgba(148,163,184,0.06)] text-[#cbd5e1]",
    cta: "Try Now ->",
  },
  {
    title: "Product\nPhotography",
    subtitle: "Generate polished product shots",
    href: "/view/workflows/photography/product-photography",
    featureType: "image",
    badge: "PRODUCT",
    icon: <LayoutGrid size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#0f766e,#2dd4bf)] shadow-[0_8px_24px_rgba(45,212,191,0.38)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_68%)]",
    hoverClassName: "hover:border-[#2dd4bf]/55 hover:shadow-[0_14px_34px_rgba(45,212,191,0.14)]",
    footerClassName: "bg-[rgba(45,212,191,0.06)] text-[#2dd4bf]",
    cta: "Try Now ->",
  },
  {
    title: "Relight\nPortrait",
    subtitle: "Rework scene lighting with AI",
    href: "/view/workflows/photography/relight",
    featureType: "image",
    badge: "RELIGHT",
    icon: <ImageIcon size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#312e81,#818cf8)] shadow-[0_8px_24px_rgba(129,140,248,0.38)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.18),transparent_68%)]",
    hoverClassName: "hover:border-[#818cf8]/55 hover:shadow-[0_14px_34px_rgba(129,140,248,0.14)]",
    footerClassName: "bg-[rgba(129,140,248,0.06)] text-[#a5b4fc]",
    cta: "Try Now ->",
  },
  {
    title: "Apps",
    subtitle: "Restore - Stylize - Animate",
    href: "/view/workflows",
    badge: "20+ APPS",
    icon: <LayoutGrid size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#374151,#6b7280)] shadow-[0_8px_24px_rgba(107,114,128,0.35)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(107,114,128,0.18),transparent_68%)]",
    hoverClassName: "hover:border-white/25 hover:shadow-[0_14px_34px_rgba(0,0,0,0.36)]",
    footerClassName: "bg-[rgba(107,114,128,0.06)] text-white/45",
    cta: "Explore ->",
  },
  {
    title: "Lipsync\nStudio",
    subtitle: "Speech sync - Talking avatars",
    href: `${ROUTES.TEXT_TO_VIDEO}?feature=lipsync`,
    badge: "LIPSYNC",
    icon: <Video size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#4c1d95,#7c3aed)] shadow-[0_8px_24px_rgba(124,58,237,0.42)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.2),transparent_68%)]",
    hoverClassName: "hover:border-[#7c3aed]/55 hover:shadow-[0_14px_34px_rgba(124,58,237,0.14)]",
    footerClassName: "bg-[rgba(124,58,237,0.06)] text-[#7c3aed]",
    cta: "Try Now ->",
  },
  {
    title: "Video\nUpscale",
    subtitle: "Enhance existing videos",
    href: "/text-to-video/edit-video?feature=upscale",
    badge: "UPSCALE",
    icon: <Clapperboard size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#92400e,#f59e0b)] shadow-[0_8px_24px_rgba(245,158,11,0.42)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_68%)]",
    hoverClassName: "hover:border-[#f59e0b]/55 hover:shadow-[0_14px_34px_rgba(245,158,11,0.14)]",
    footerClassName: "bg-[rgba(245,158,11,0.06)] text-[#f59e0b]",
    cta: "Try Now ->",
  },
  {
    title: "Text To\nMusic",
    subtitle: "Prompt to full music track",
    href: ROUTES.TEXT_TO_MUSIC,
    featureType: "video",
    badge: "MUSIC",
    icon: <Music size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#0f766e,#14b8a6)] shadow-[0_8px_24px_rgba(20,184,166,0.42)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.2),transparent_68%)]",
    hoverClassName: "hover:border-[#14b8a6]/55 hover:shadow-[0_14px_34px_rgba(20,184,166,0.14)]",
    footerClassName: "bg-[rgba(20,184,166,0.06)] text-[#14b8a6]",
    cta: "Try Now ->",
  },
  {
    title: "Remove\nVideo BG",
    subtitle: "Transparent video backgrounds",
    href: "/text-to-video/edit-video?feature=remove-bg",
    badge: "VIDEO BG",
    icon: <Scissors size={20} />,
    iconClassName: "bg-[linear-gradient(135deg,#065f46,#10b981)] shadow-[0_8px_24px_rgba(16,185,129,0.42)]",
    glowClassName: "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_68%)]",
    hoverClassName: "hover:border-[#10b981]/55 hover:shadow-[0_14px_34px_rgba(16,185,129,0.14)]",
    footerClassName: "bg-[rgba(16,185,129,0.06)] text-[#10b981]",
    cta: "Try Now ->",
  },
];

export default function AllFeatures({ mode = "image" }: { mode?: "image" | "video" }) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const pendingDotRef = useRef<number | null>(null);
  const [activeDot, setActiveDot] = useState(0);
  const [dotCount, setDotCount] = useState(1);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const updatePagination = () => {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const step = Math.max(1, el.clientWidth * 0.82);
      const pages = Math.max(1, Math.ceil(maxScroll / step) + 1);
      const index = Math.min(pages - 1, Math.max(0, Math.round(el.scrollLeft / step)));
      const pendingDot = pendingDotRef.current;

      if (pendingDot !== null) {
        const targetLeft = pendingDot * step;
        const reachedTarget = Math.abs(el.scrollLeft - targetLeft) < 8;
        if (reachedTarget) {
          pendingDotRef.current = null;
          setActiveDot(index);
        } else {
          setActiveDot(pendingDot);
        }
      } else {
        setActiveDot(index);
      }

      setDotCount(pages);
      setShowLeftArrow(el.scrollLeft > 2);
      setShowRightArrow(el.scrollLeft < maxScroll - 2);
      setIsOverflowing(maxScroll > 2);
    };

    updatePagination();
    el.addEventListener("scroll", updatePagination, { passive: true });
    window.addEventListener("resize", updatePagination);

    return () => {
      el.removeEventListener("scroll", updatePagination);
      window.removeEventListener("resize", updatePagination);
    };
  }, []);

  const getStep = () => {
    const el = railRef.current;
    if (!el) return 0;
    return el.clientWidth * 0.82;
  };

  const scrollByDirection = (direction: "left" | "right") => {
    const nextIndex =
      direction === "right"
        ? Math.min(dotCount - 1, activeDot + 1)
        : Math.max(0, activeDot - 1);

    pendingDotRef.current = nextIndex;
    setActiveDot(nextIndex);
    scrollToPage(nextIndex);
  };

  const scrollToPage = (index: number) => {
    const el = railRef.current;
    if (!el) return;
    const step = getStep();
    el.scrollTo({
      left: index * step,
      behavior: "smooth",
    });
  };

  const handleRailWheel: WheelEventHandler<HTMLDivElement> = (event) => {
    const el = railRef.current;
    if (!el) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    el.scrollLeft += event.deltaY;
  };

  const isVideoFeature = (card: CardConfig) => {
    if (card.featureType) return card.featureType === "video";
    return (
      card.href.includes("/text-to-video") ||
      card.title.toLowerCase().includes("video") ||
      card.title.toLowerCase().includes("lipsync")
    );
  };

  const visibleCards = cards.filter((card) => {
    if (card.featureType === "both") return true;
    if (mode === "video") return isVideoFeature(card);
    return !isVideoFeature(card);
  });

  return (
    <section className="bg-[#0E0E12] pb-12 pt-0">
      <div className="mx-auto w-full max-w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#3B82F6] sm:text-[10px]">
          <span className="inline-block h-[1.5px] w-3.5 bg-[#3B82F6] sm:w-4" />
          All Features
        </div>

        <div className="relative">
          {isOverflowing && showLeftArrow && (
            <button
              onClick={() => scrollByDirection("left")}
              className="absolute left-1 top-1/2 z-30 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95 active:border-[#3b82f6]/60 md:flex"
              aria-label="Scroll left"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {isOverflowing && showRightArrow && (
            <button
              onClick={() => scrollByDirection("right")}
              className="absolute right-1 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95 active:border-[#3b82f6]/60"
              aria-label="Scroll right"
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          <div
            ref={railRef}
            onWheel={handleRailWheel}
            className={`scrollbar-hide no-scrollbar flex snap-x snap-proximity gap-3 overflow-x-auto overflow-y-visible pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${mode === "video" && !isOverflowing ? "justify-start pr-0" : "pr-12"}`}
            style={{ touchAction: "auto", WebkitOverflowScrolling: "touch" }}
          >
            {visibleCards.map((card) => {
              const imageMap: Record<string, string> = {
                "Image\nGeneration": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/image-generation-bg.avif",
                "Create\nVideo": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80",
                "Edit\nImage": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/edit-image.avif",
                "Upscale": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/upscale-bg.avif",
                "Remove\nBG": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/remove-bg.avif",
                "Erase /\nReplace": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/Erase-replace.avif",
                "Expand\nImage": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/expand-image.avif",
                "Vectorize": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/vectorize-bg.avif",
                "Restore Old\nPhoto": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/Restore%20Old%20Photos.avif",
                "Photo To Line\nDrawing": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/photo-to-line-drawing-bg.avif",
                "Line Drawing\nTo Photo": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/line-drawing-to-photo-bg.avif",
                "Remove\nElement": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/RemoveElement.avif",
                "Replace\nElement": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/ReplaceElement.avif",

                "Remove\nWatermark": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/removewatermark.avif",
                "Product\nPhotography": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/productphotography.avif",
                "Relight\nPortrait": "https://idr01.zata.ai/devstoragev1/public/HomePage/Allfeatures/RelightPortrait.avif",
                "Apps": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
                "Lipsync\nStudio": "https://images.unsplash.com/photo-1588825829910-619cd00e8b2b?w=400&q=80",
                "Video\nUpscale": "https://images.unsplash.com/photo-1588698711463-548d1e0281b9?w=400&q=80",
                "Text To\nMusic": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80",
                "Remove\nVideo BG": "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=400&q=80"
              };
              const cardImage = imageMap[card.title] || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80";

              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group flex w-[210px] shrink-0 snap-start flex-col p-[10px] pb-4 bg-[#16161C] border-[0.5px] border-white/10 rounded-[20px] transition-all duration-300 hover:-translate-y-[3px] hover:border-blue-400/30"
                >
                  <div className="relative aspect-[16/11] rounded-[14px] overflow-hidden mb-3 bg-[#1E1E26]">
                    <img
                      className="absolute inset-0 block h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-[1.03]"
                      src={cardImage}
                      alt={card.title.replace('\n', ' ')}
                      onError={(e) => {
                        (e.target as HTMLElement).parentElement!.style.background = '#1a1a24';
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute left-2 top-2 rounded-full border-[0.5px] border-white/10 bg-black/40 px-[9px] py-[3px] text-[10px] font-semibold uppercase tracking-[0.05em] text-white/70 backdrop-blur-[4px] z-10">
                      {card.badge}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 px-1 mb-4">
                    <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-[8px] ${card.iconClassName} text-white`}>
                      {card.icon}
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-[14px] font-semibold tracking-tight text-[#FAFAFA] group-hover:text-white transition-colors line-clamp-1">
                        {card.title.replace('\n', ' ')}
                      </h3>
                      <p className="text-[11px] leading-[1.3] text-[#87878C] mt-0.5 line-clamp-2">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto px-1 flex items-center gap-1.5 text-[12px] font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                    Try Now
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-[6px]">
          {Array.from({ length: dotCount }).map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              onClick={() => {
                pendingDotRef.current = index;
                setActiveDot(index);
                scrollToPage(index);
              }}
              aria-current={index === activeDot ? "true" : "false"}
              aria-label={`Go to feature page ${index + 1}`}
              className={
                index === activeDot && isOverflowing
                  ? "h-[3px] w-6 rounded-full bg-[#3b82f6]"
                  : "h-[3px] w-[6px] rounded-full bg-white/20 transition-colors hover:bg-white/35 active:bg-white/50"
              }
              disabled={!isOverflowing}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
