"use client";
import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  AnimatePresence,
} from "motion/react";
import { useEffect, useState } from "react";

export const Navbar = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(true);
  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious();
    if (previous && current) {
      const direction = current - previous;
      if (scrollY.get() < 50) {
        setVisible(true);
      } else {
        setVisible(direction < 0);
      }
    }
  });
  return (
    <motion.div
      initial={{ y: -100, opacity: 1 }}
      animate={{ y: visible ? 0 : -100, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed left-0 right-0 top-10 z-50 mx-auto flex max-w-fit items-center space-x-4 rounded-full border border-black/10 bg-white/10 px-6 py-3 text-white shadow-lg backdrop-blur-lg dark:border-white/20",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const Menu = ({ className }: { className?: string }) => {
  return (
    <a
      href="#"
      className={cn(
        "relative inline-flex h-8 w-20 items-center justify-center rounded-full border border-black/10 bg-white text-black transition-all hover:scale-105 hover:bg-white/80 group dark:text-white dark:border-white/20",
        className,
      )}
    >
      <span className="absolute inset-0 z-0 overflow-hidden rounded-full">
        <span className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 opacity-20 blur transition-opacity duration-300 group-hover:opacity-30" />
      </span>
      <span className="relative z-10 flex items-center">
        <IconMenu2 className="h-4 w-4" />
        <span className="ml-2 text-xs font-semibold">Menu</span>
      </span>
    </a>
  );
};

export const NaviIcons = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const close = () => setIsOpen(false);
    window.addEventListener("scroll", close);
    return () => window.removeEventListener("scroll", close);
  }, []);

  return (
    <div className={cn("flex items-center space-x-4", className)}>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-full border border-white/20 p-2 hover:bg-white/10"
      >
        <IconMenu2 className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
              className="fixed right-0 top-0 h-full w-80 bg-black p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Menu</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-white/20 p-2 hover:bg-white/10"
                >
                  <IconX className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 space-y-4">
                <a href="#" className="block text-white/80 hover:text-white">
                  Home
                </a>
                <a href="#" className="block text-white/80 hover:text-white">
                  Features
                </a>
                <a href="#" className="block text-white/80 hover:text-white">
                  Pricing
                </a>
                <a href="#" className="block text-white/80 hover:text-white">
                  Contact
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};