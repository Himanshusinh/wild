"use client";
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react";
import {
  IconArrowNarrowLeft,
  IconArrowNarrowRight,
  IconX,
} from "@tabler/icons-react";
import { cn } from "../../../../lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { ImageProps } from "next/image";
// Note: We render a native <img/> for flexibility; no Next Image import needed here.
import { useOutsideClick } from "../../../hooks/use-outside-click";

interface CarouselProps {
  items: React.ReactNode[];
  initialScroll?: number;
}

type Card = {
  src: string;
  title: string;
  description: string;
};

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
}>({
  onCardClose: () => {},
  currentIndex: 0,
});

export const Carousel = ({ items, initialScroll = 0 }: CarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const rafIdRef = React.useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const smoothScrollTo = (container: HTMLDivElement, targetLeft: number, duration = 380) => {
    // Cancel any in-flight animation to avoid stutter
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsAnimating(true);
    const startLeft = container.scrollLeft;
    const maxLeft = container.scrollWidth - container.clientWidth;
    const clampedTarget = Math.max(0, Math.min(targetLeft, maxLeft));
    const change = clampedTarget - startLeft;
    const startTime = performance.now();
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      container.scrollLeft = startLeft + change * easeOutQuart(progress);
      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(step);
      } else {
        rafIdRef.current = null;
        setIsAnimating(false);
        checkScrollability();
      }
    }
    rafIdRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const scrollLeft = () => {
    if (isAnimating) return;
    if (carouselRef.current) {
      const container = carouselRef.current;
      const cardWidth = isMobile() ? 260 : 384;
      const gap = isMobile() ? 8 : 8;
      const delta = cardWidth + gap;
      const target = container.scrollLeft - delta;
      smoothScrollTo(container, target, 380);
    }
  };

  const scrollRight = () => {
    if (isAnimating) return;
    if (carouselRef.current) {
      const container = carouselRef.current;
      const cardWidth = isMobile() ? 260 : 384;
      const gap = isMobile() ? 8 : 8;
      const delta = cardWidth + gap;
      const target = container.scrollLeft + delta;
      smoothScrollTo(container, target, 380);
    }
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const cardWidth = isMobile() ? 260 : 384; // (md:w-96)
      const gap = isMobile() ? 8 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      smoothScrollTo(container, scrollPosition, 400);
      setCurrentIndex(index);
    }
  };

  const isMobile = () => {
    return typeof window !== "undefined" && window.innerWidth < 768;
  };

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className="relative w-full">
        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto py-10 md:py-8 lg:py-10 [scrollbar-width:none] overflow-x-hidden"
          ref={carouselRef}
          onScroll={checkScrollability}
        >
          <div
            className={cn(
              "absolute right-0 z-[1000] h-auto w-[5%] overflow-hidden bg-gradient-to-l",
            )}
          ></div>

          <div
            className={cn(
              "flex flex-row justify-start gap-4 md:gap-3 lg:gap-4 pl-4 md:pl-3 lg:pl-4",
              "mx-auto max-w-7xl", // remove max-w-4xl if you want the carousel to span the full width of its container
            )}
          >
            {items.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.2 * index, ease: "easeOut" }}
                key={"card" + index}
                className="rounded-3xl last:pr-[33%] md:last:pr-[25%] lg:last:pr-[30%]"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mr-10 md:mr-6 lg:mr-8">
          <button
            className="relative z-40 flex h-10 w-10 md:h-9 md:w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
            onClick={scrollLeft}
            disabled={!canScrollLeft || isAnimating}
          >
            <IconArrowNarrowLeft className="h-6 w-6 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-500" />
          </button>
          <button
            className="relative z-40 flex h-10 w-10 md:h-9 md:w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
            onClick={scrollRight}
            disabled={!canScrollRight || isAnimating}
          >
            <IconArrowNarrowRight className="h-6 w-6 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-500" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  );
};

export const Card = ({
  card,
  index,
  layout = false,
}: {
  card: Card;
  index: number;
  layout?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { onCardClose } = useContext(CarouselContext);

  const handleClose = useCallback(() => {
    setOpen(false);
    onCardClose(index);
  }, [onCardClose, index]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    if (open) {
      // Prevent layout shift when hiding the scrollbar
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      // Cleanup in case component unmounts while modal open
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "";
    };
  }, [open, handleClose]);

  useOutsideClick(containerRef, handleClose);

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 h-screen overflow-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-lg"
            />
                         <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               ref={containerRef}
               layoutId={layout ? `card-${card.title}` : undefined}
               className="relative z-[60] w-full h-fit max-w-5xl rounded-3xl overflow-hidden font-sans bg-cover bg-center bg-no-repeat"
               style={{ backgroundImage: `url(${card.src})` }}
             >
               <div className="absolute inset-0 z-0 bg-black/70" />
                               <div className="relative z-10 p-4 md:p-10">
                 <button
                   className="sticky top-4 right-0 ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/90 hover:bg-white text-black"
                   onClick={handleClose}
                 >
                   <IconX className="h-6 w-6 text-black" />
                 </button>
                 
                 <motion.p
                   layoutId={layout ? `title-${card.title}` : undefined}
                   className="mt-4 text-2xl font-semibold text-white md:text-5xl"
                 >
                   {card.title}
                 </motion.p>
                 
                 {/* Coming Soon text in popup for Filming Tools */}
                 {card.title === 'Filming Tools' && (
                   <div className="mt-2 text-white text-lg opacity-80 ml-1">
                     Coming Soon
                   </div>
                 )}
                 
                 {/* Coming Soon text in popup for 3D Generation */}
                 {card.title === '3D Generation' && (
                   <div className="mt-2 text-white text-lg opacity-80 ml-1">
                     Coming Soon
                   </div>
                 )}
                 
                 <div className="py-10 text-white text-lg">{card.description}</div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        className="relative z-10 flex h-80 w-56 flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-100 md:h-[40rem] md:w-96 dark:bg-neutral-900"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-full bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        <div className="relative z-40 p-8">

          {/* Removed overlay per request */}

          
          <motion.p
            layoutId={layout ? `title-${card.title}` : undefined}
            className="mt-2 max-w-xs text-left font-sans text-xl font-semibold [text-wrap:balance] text-white md:text-3xl"
          >
            {card.title}
          </motion.p>
          
          {/* Coming Soon text for Filming Tools */}
          {card.title === 'Filming Tools' && (
            <div className="mt-2 text-white text-sm mr-20">
              Coming Soon
            </div>
          )}
          
          {/* Coming Soon text for 3D Generation */}
          {card.title === '3D Generation' && (
            <div className="mt-2 text-white text-sm mr-24">
              Coming Soon
            </div>
          )}
        </div>
        {card.src ? (
          <BlurImage
            src={card.src}
            alt={card.title}
            className="absolute inset-0 z-10 object-cover"
          />
        ) : (
          <div className="absolute inset-0 z-10 bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400">Image not available</span>
          </div>
        )}
      </motion.button>
    </>
  );
};

export const BlurImage = ({
  height,
  width,
  src,
  className,
  alt,
  ...rest
}: ImageProps) => {
  if (!src) {
    return (
      <div className={cn(
        "h-full w-full bg-gray-800 flex items-center justify-center",
        className,
      )}>
        <span className="text-gray-400">Image not available</span>
      </div>
    );
  }
  
  return (
    <Image
      className={cn(
        "h-full w-full object-cover transition duration-300",
        className,
      )}
      src={src as string}
      width={typeof width === 'number' ? width : 500}
      height={typeof height === 'number' ? height : 300}
      alt={alt ? alt : "Background of a beautiful view"}
      {...rest}
    />
  );
};
