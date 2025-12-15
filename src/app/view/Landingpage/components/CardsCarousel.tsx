"use client";
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react";
import { IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { ImageProps } from "next/image";
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

export const Carousel = ({ items }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleCardClose = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className="relative w-full px-4 md:px-8">
        {/* Modern Bento Grid Layout */}
        <div className="mx-auto max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            {items.map((item, index) => (
              <motion.div
                key={"card" + index}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.6,
                  delay: 0.1 * index,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn(
                  "relative",
                  // Make first card span 2 columns on larger screens for spotlight effect
                  index === 0 && "md:col-span-2 lg:col-span-2"
                )}
              >
                {item}
              </motion.div>
            ))}
          </motion.div>
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
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const { onCardClose } = useContext(CarouselContext);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "";
    };
  }, [open, handleClose]);

  useOutsideClick(containerRef, handleClose);

  const handleOpen = () => {
    setOpen(true);
  };

  // Magnetic effect on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePosition({ x: x * 0.1, y: y * 0.1 });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // First card (spotlight) gets different height
  const isSpotlight = index === 0;

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 h-screen overflow-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              ref={containerRef}
              layoutId={layout ? `card-${card.title}` : undefined}
              className="relative z-[60] w-full h-fit max-w-5xl rounded-3xl overflow-hidden font-sans bg-cover bg-center bg-no-repeat shadow-2xl shadow-purple-500/20"
              style={{ backgroundImage: `url(${card.src})` }}
            >
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-black/80 via-black/70 to-purple-900/30 backdrop-blur-xl" />
              
              <div className="relative z-10 p-6 md:p-12">
                <button
                  className="sticky top-4 right-0 ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-110"
                  onClick={handleClose}
                >
                  <IconX className="h-5 w-5 text-white" />
                </button>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.p
                    layoutId={layout ? `title-${card.title}` : undefined}
                    className="mt-4 text-3xl md:text-6xl font-bold text-white bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent"
                  >
                    {card.title}
                  </motion.p>
                  
                  {(card.title === 'Filming Tools' || card.title === '3D Generation') && (
                    <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 backdrop-blur-sm">
                      <span className="text-purple-200 text-sm font-medium">Coming Soon</span>
                    </div>
                  )}
                  
                  <div className="py-8 text-white/90 text-lg leading-relaxed max-w-3xl">
                    {card.description}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        ref={cardRef}
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
        className={cn(
          "group relative z-10 flex flex-col items-start justify-end overflow-hidden rounded-3xl border border-white/5",
          "bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-black/50",
          "backdrop-blur-xl shadow-2xl",
          "transition-all duration-500 ease-out",
          "hover:shadow-purple-500/20 hover:shadow-2xl",
          "hover:border-purple-500/30",
          "w-full",
          isSpotlight ? "h-[500px] md:h-[600px]" : "h-[400px] md:h-[500px]"
        )}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Animated gradient overlay */}
        <div className={cn(
          "absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          "bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"
        )} />

        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 z-20"
          initial={false}
          animate={{
            background: isHovered
              ? `radial-gradient(600px circle at ${mousePosition.x + 50}% ${mousePosition.y + 50}%, rgba(255,255,255,0.05), transparent 40%)`
              : "none",
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Image with parallax effect */}
        {card.src ? (
          <div className="absolute inset-0 z-0">
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="w-full h-full"
            >
              <BlurImage
                src={card.src}
                alt={card.title}
                className="absolute inset-0 object-cover"
              />
            </motion.div>
            
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <span className="text-gray-600">Image not available</span>
          </div>
        )}

        {/* Content */}
        <div className="relative z-30 p-6 md:p-8 w-full">
          <motion.div
            animate={{
              y: isHovered ? -8 : 0,
            }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <motion.p
              layoutId={layout ? `title-${card.title}` : undefined}
              className={cn(
                "font-bold text-white drop-shadow-2xl",
                "bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text",
                isSpotlight ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
              )}
            >
              {card.title}
            </motion.p>
            
            {(card.title === 'Filming Tools' || card.title === '3D Generation') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3 inline-block px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 backdrop-blur-sm"
              >
                <span className="text-purple-200 text-xs md:text-sm font-medium">Coming Soon</span>
              </motion.div>
            )}

            {/* Show description on spotlight card */}
            {isSpotlight && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0.7 }}
                transition={{ duration: 0.3 }}
                className="mt-4 text-white/80 text-sm md:text-base max-w-md"
              >
                {card.description}
              </motion.p>
            )}
          </motion.div>

          {/* Hover indicator */}
          <motion.div
            className="mt-4 flex items-center gap-2 text-sm text-white/60"
            initial={{ opacity: 0, x: -10 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              x: isHovered ? 0 : -10,
            }}
            transition={{ duration: 0.3 }}
          >
            <span>Explore</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </motion.div>
        </div>
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
        "h-full w-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center",
        className,
      )}>
        <span className="text-gray-600">Image not available</span>
      </div>
    );
  }
  
  return (
    <Image
      className={cn(
        "h-full w-full object-cover transition-all duration-700",
        className,
      )}
      src={src as string}
      width={typeof width === 'number' ? width : 1200}
      height={typeof height === 'number' ? height : 800}
      alt={alt ? alt : "Feature showcase"}
      {...rest}
    />
  );
};
