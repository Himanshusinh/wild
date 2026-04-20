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

export const STYLES: StyleItem[] = [
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
    id: "ajrakh",
    name: "Gujarat",
    title: "AJRAKH",
    desc: "A resist block-print textile tradition known for its geometric symmetry, deep indigo tones, and structured border-field composition.",
    image: "/HomePage/creativeStyle/AJRAKH.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.88) saturate(0.95)",
  },
  {
    id: "madhubani",
    name: "Bihar",
    title: "MADHUBANI",
    desc: "A traditional Mithila painting style known for its bold outlines, symbolic motifs, and richly filled compositions with no empty space.",
    image: "/HomePage/creativeStyle/MADHUBANI.png",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.98)",
  },
  {
    id: "kyilkhor",
    name: "Arunachal Pradesh",
    title: "KYIL-KHOR",
    desc: "A sacred Buddhist mandala system representing a structured cosmic diagram with central hierarchy, symbolic geometry, and ritual significance.",
    image: "/HomePage/creativeStyle/KYIL-KHOR.png",
    tag: "Sacred",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sherdukpen",
    name: "Arunachal Pradesh",
    title: "SHERDUKPEN TEXTILE",
    desc: "A handwoven textile tradition known for its centered motifs, white-ground structure, and functional woven forms used as carrying cloths.",
    image: "/HomePage/creativeStyle/SHERDUKPEN TEXTILE.png",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "idumishmi",
    name: "Arunachal Pradesh",
    title: "IDU MISHMI TEXTILE",
    desc: "A handwoven textile tradition known for its bold geometric patterns, diamond motifs, and dense loom-based craftsmanship.",
    image: "/HomePage/creativeStyle/IDU MISHMI TEXTILE.png",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "etikoppaka",
    name: "Andhra Pradesh",
    title: "ETIKOPPAKA TOYS",
    desc: "A traditional lacquered wood craft known for its smooth turned forms, vibrant natural colors, and refined handcrafted finish",
    image: "/HomePage/creativeStyle/ETIKOPPAKA TOYS.png",
    tag: "Toy",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.98)",
  },
  {
    id: "kondapalli",
    name: "Andhra Pradesh",
    title: "KONDAPALLI TOYS",
    desc: "A traditional wooden toy craft known for its hand-carved forms, vibrant painted surfaces, and charming miniature storytelling scenes.",
    image: "/HomePage/creativeStyle/KONDAPALLI TOYS.png",
    tag: "Toy",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.98)",
  },
  {
    id: "monpamask",
    name: "Arunachal Pradesh",
    title: "MONPA MASK",
    desc: "A ritual woodcraft tradition known for its symbolic carved masks, bold expressions, and ceremonial significance in cultural performances.",
    image: "/HomePage/creativeStyle/MONPA MASK.png",
    tag: "Ritual",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "handmadepaper",
    name: "Arunachal Pradesh",
    title: "HANDMADE PAPER",
    desc: "A traditional bark-fiber paper craft known for its natural texture, matte finish, and quiet material elegance rooted in handmade processes.",
    image: "/HomePage/creativeStyle/HANDMADE PAPER.png",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "monpa",
    name: "Arunachal Pradesh",
    title: "MONPA TEXTILE",
    desc: "A handwoven textile tradition defined by rhythmic patterns, banded structures, and deeply rooted loom-based craftsmanship.",
    image: "/HomePage/creativeStyle/MONPA TEXTILE.png",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "wancho",
    name: "Arunachal Pradesh",
    title: "WANCHO CARVING",
    desc: "A traditional wood carving practice known for its bold, head-centric forms, symbolic expressions, and deeply carved handcrafted textures.",
    image: "/HomePage/creativeStyle/WANCHO CARVING.png",
    tag: "Sculpture",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "thangka",
    name: "Arunachal Pradesh",
    title: "THANGKA",
    desc: "A sacred Buddhist scroll painting tradition known for its precise iconography, spiritual symbolism, and intricate hand-painted detailing on cloth.",
    image: "/HomePage/creativeStyle/SACRED THANGKA ART.png",
    tag: "Sacred",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "tholu",
    name: "Andhra Pradesh",
    title: "LEATHER PUPPETRY",
    desc: "A traditional shadow theatre art crafted from translucent leather, known for its intricate perforations, vibrant colors, and dramatic backlit storytelling.",
    image: "/HomePage/creativeStyle/ANDRA LEATHER.png",
    tag: "Theatre",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "uppadajamdani",
    name: "Andhra Pradesh",
    title: "UPPADA JAMDANI",
    desc: "A delicate handwoven textile known for its extra-weft motif seamlessly integrated into the fabric, creating lightweight and elegant designs.",
    image: "/HomePage/creativeStyle/UPPADA JAMDANI.jpeg",
    tag: "Fabric",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
  {
    id: "srikalahasti",
    name: "Andhra Pradesh",
    title: "SRIKALAHASTI",
    desc: "A sacred hand-painted Kalamkari tradition known for its expressive freehand drawings, mythological storytelling, and natural dye detailing on cotton cloth.",
    image: "/HomePage/creativeStyle/Srikalahasti Kalamkari.jpeg",
    tag: "Fabric",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
  {
    id: "machilipatnam",
    name: "Andhra Pradesh",
    title: "MACHILIPATNAM",
    desc: "A block-printed Kalamkari style featuring intricate Persian-inspired floral patterns, repeat motifs, and natural dyes crafted for textile design.",
    image: "/HomePage/creativeStyle/Machilipatnam Kalamkari.jpeg",
    tag: "Fabric",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
];

type CreativeStyleProps = {
  onWarliOpen?: () => void;
  onAjrakhOpen?: () => void;
  onMadhubaniOpen?: () => void;
  onKyilKhorOpen?: () => void;
  onSherdukpenOpen?: () => void;
  onEtikoppakaOpen?: () => void;
  onKondapalliOpen?: () => void;
  onKalamkariOpen?: () => void;
  onSrikalahastiOpen?: () => void;
  onUppadaOpen?: () => void;
  onTholuOpen?: () => void;
  onThangkaOpen?: () => void;
  onWanchoOpen?: () => void;
  onMonpaOpen?: () => void;
  onHandmadePaperOpen?: () => void;
  onMonpaMaskOpen?: () => void;
  onIduMishmiOpen?: () => void;
  onAllStylesOpen?: () => void;
};

export default function CreativeStyle({
  onWarliOpen,
  onAjrakhOpen,
  onMadhubaniOpen,
  onKyilKhorOpen,
  onSherdukpenOpen,
  onEtikoppakaOpen,
  onKondapalliOpen,
  onKalamkariOpen,
  onSrikalahastiOpen,
  onUppadaOpen,
  onTholuOpen,
  onThangkaOpen,
  onWanchoOpen,
  onMonpaOpen,
  onHandmadePaperOpen,
  onMonpaMaskOpen,
  onIduMishmiOpen,
  onAllStylesOpen,
}: CreativeStyleProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleStyleClick = (event: MouseEvent<HTMLAnchorElement>, style: StyleItem) => {
    const t = style.title.toLowerCase();
    if (t === "warli" && onWarliOpen) {
      event.preventDefault();
      onWarliOpen();
      return;
    }
    if (style.id === "ajrakh" && onAjrakhOpen) {
      event.preventDefault();
      onAjrakhOpen();
      return;
    }
    if (style.id === "madhubani" && onMadhubaniOpen) {
      event.preventDefault();
      onMadhubaniOpen();
      return;
    }
    if (style.id === "kyilkhor" && onKyilKhorOpen) {
      event.preventDefault();
      onKyilKhorOpen();
      return;
    }
    if (style.id === "sherdukpen" && onSherdukpenOpen) {
      event.preventDefault();
      onSherdukpenOpen();
      return;
    }
    if (style.id === "etikoppaka" && onEtikoppakaOpen) {
      event.preventDefault();
      onEtikoppakaOpen();
      return;
    }
    if (style.id === "kondapalli" && onKondapalliOpen) {
      event.preventDefault();
      onKondapalliOpen();
      return;
    }
    if (style.id === "monpamask" && onMonpaMaskOpen) {
      event.preventDefault();
      onMonpaMaskOpen();
      return;
    }
    if (style.id === "handmadepaper" && onHandmadePaperOpen) {
      event.preventDefault();
      onHandmadePaperOpen();
      return;
    }
    if (style.id === "monpa" && onMonpaOpen) {
      event.preventDefault();
      onMonpaOpen();
      return;
    }
    if (style.id === "wancho" && onWanchoOpen) {
      event.preventDefault();
      onWanchoOpen();
      return;
    }
    if (style.id === "thangka" && onThangkaOpen) {
      event.preventDefault();
      onThangkaOpen();
      return;
    }
    if (style.id === "tholu" && onTholuOpen) {
      event.preventDefault();
      onTholuOpen();
      return;
    }
    if (style.id === "uppadajamdani" && onUppadaOpen) {
      event.preventDefault();
      onUppadaOpen();
      return;
    }
    if (style.id === "machilipatnam" && onKalamkariOpen) {
      event.preventDefault();
      onKalamkariOpen();
      return;
    }
    if (style.id === "srikalahasti" && onSrikalahastiOpen) {
      event.preventDefault();
      onSrikalahastiOpen();
      return;
    }
    if (style.id === "idumishmi" && onIduMishmiOpen) {
      event.preventDefault();
      onIduMishmiOpen();
    }
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
      <div className="mb-4 flex items-end justify-between ">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#3B82F6]">
            <span className="inline-block h-[1.5px] w-4 bg-[#3B82F6]" />
            Styles
          </p>
          <h2
            className="text-[30px] uppercase leading-none tracking-[0.03em] text-white sm:text-[38px]"
            style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}
          >
            Explore Indian Styles
          </h2>
        </div>

        <button
          type="button"
          onClick={onAllStylesOpen}
          className="hidden items-center gap-1 rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold text-white/55 transition-colors hover:border-[#3B82F6]/40 hover:text-[#3B82F6] md:inline-flex"
        >
          <span>All styles</span>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 6h7M6 2.5L9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
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
                    <div className="mt-1 text-[11px] font-semibold tracking-wide text-white/85 sm:text-[12px]">
                      {style.name}
                    </div>
                    <div className="mt-1 max-w-[280px] text-[10px] leading-snug text-white/60 line-clamp-2 sm:max-w-[300px]">
                      {style.desc}
                    </div>
                  </div>
                </div>
              </div>
              <div className="sr-only">
                <div>{style.name}</div>
                <p>{style.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollLeft}
          disabled={!showLeftArrow}
          aria-label="Scroll styles left"
          className={`absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/85 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/75 active:scale-95 disabled:cursor-not-allowed md:flex lg:left-8 ${
            showLeftArrow ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
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
          className={`absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/85 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/75 active:scale-95 disabled:cursor-not-allowed md:flex lg:right-8 ${
            showRightArrow ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
