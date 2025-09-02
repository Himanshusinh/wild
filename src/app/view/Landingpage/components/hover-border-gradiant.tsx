"use client";
import React, { useState, useEffect, useCallback } from "react";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  innerFillClassName = "bg-[#1C303D]",
  borderColor = "hsl(0, 0%, 100%)",
  highlightColor = "#3275F8",
  glowBlurPx = 2,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
    innerFillClassName?: string;
    borderColor?: string;
    highlightColor?: string;
    glowBlurPx?: number;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [direction, setDirection] = useState<Direction>("TOP");

  const rotateDirection = useCallback((currentDirection: Direction): Direction => {
    const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
    const currentIndex = directions.indexOf(currentDirection);
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length;
    return directions[nextIndex];
  }, [clockwise]);

  const movingMap: Record<Direction, string> = React.useMemo(() => ({
    TOP: `radial-gradient(20.7% 50% at 50% 0%, ${borderColor} 0%, transparent 100%)`,
    LEFT: `radial-gradient(16.6% 43.1% at 0% 50%, ${borderColor} 0%, transparent 100%)`,
    BOTTOM: `radial-gradient(20.7% 50% at 50% 100%, ${borderColor} 0%, transparent 100%)`,
    RIGHT: `radial-gradient(16.2% 41.2% at 100% 50%, ${borderColor} 0%, transparent 100%)`,
  }), [borderColor]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection((prevState) => rotateDirection(prevState));
    }, duration * 1000);
    return () => clearInterval(interval);
  }, [duration, clockwise, rotateDirection]);
  return (
    <Tag
      onMouseEnter={() => {
        // No hover effect needed
      }}
      onMouseLeave={() => {
        // No hover effect needed
      }}
      className={cn(
        "relative flex rounded-full border content-center bg-black/20 transition duration-500 dark:bg-white/20 items-center flex-col flex-nowrap gap-10 h-min justify-center overflow-visible p-px decoration-clone w-fit",
        containerClassName
      )}
      type={Tag === "button" ? (props as any).type ?? "button" : undefined}
      {...props}
    >
      <div
        className={cn(
          "w-auto text-white z-10 px-4 py-2 rounded-[inherit]",
          className
        )}
      >
        {children}
      </div>
      <motion.div
        className={cn(
          "flex-none inset-0 overflow-hidden absolute z-0 rounded-full"
        )}
        style={{
          filter: `blur(${glowBlurPx}px)`,
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
        initial={{ background: movingMap[direction] }}
        animate={{ background: movingMap[direction] }}
        transition={{ ease: "linear", duration: duration ?? 1 }}
      />
      <div className={cn(innerFillClassName, "absolute z-[1] flex-none inset-[2px] rounded-full")} />
      {/* Hover aura above fill, below text */}
      <motion.div
        className="absolute inset-[2px] z-[2] rounded-full pointer-events-none"
        style={{ filter: "blur(10px)" }}
        initial={{ opacity: 0, background: `radial-gradient(80% 180% at 50% 50%, ${highlightColor} 0%, transparent 70%)` }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
    </Tag>
  );
}
