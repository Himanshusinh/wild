"use client"
import React, { useEffect, useMemo, useRef, ReactNode, RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  containerClassName?: string;
  textClassName?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
}

const ScrollFloat: React.FC<ScrollFloatProps> = ({
  children,
  scrollContainerRef,
  containerClassName = "",
  textClassName = "",
  animationDuration = 1,
  ease = "back.inOut(5)",
  scrollStart = "top 85%",
  scrollEnd = "bottom 25%",
  stagger = 0.08
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === "string" ? children : "";
    // Split by actual line breaks and filter out empty lines
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    return lines.map((line, lineIndex) => (
      <React.Fragment key={lineIndex}>
        {lineIndex > 0 && <br />}
        {line.split("").map((char, charIndex) => (
          <span className="inline-block word" key={`${lineIndex}-${charIndex}`}>
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </React.Fragment>
    ));
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller =
      scrollContainerRef && scrollContainerRef.current
        ? scrollContainerRef.current
        : window;

    const charElements = el.querySelectorAll(".word");

    const tween = gsap.fromTo(
      charElements,
      {
        willChange: "opacity, transform",
        opacity: 0,
        yPercent: 50,
        scaleY: 1.2,
        scaleX: 0.95,
        transformOrigin: "50% 0%",
      },
      {
        duration: animationDuration,
        ease: ease,
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        stagger: stagger,
        paused: true,
      }
    );

    // Fixed viewport-based range so behavior is independent of page height
    const st = ScrollTrigger.create({
      trigger: el,
      scroller,
      start: "top 90%",
      end: "+=600",
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        tween.progress(self.progress).pause();
      },
    });

    const onResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);
    const ResizeObs = (window as any).ResizeObserver;
    const ro = ResizeObs ? new ResizeObs(() => ScrollTrigger.refresh()) : null;
    if (ro) {
      try {
        ro.observe(document.body);
      } catch {}
    }
    return () => {
      st?.kill();
      tween.kill();
      window.removeEventListener('resize', onResize);
      if (ro) {
        try {
          ro.disconnect();
        } catch {}
      }
    };
  }, [
    scrollContainerRef,
    animationDuration,
    ease,
    scrollStart,
    scrollEnd,
    stagger
  ]);

  return (
    <h2
      ref={containerRef}
      className={`my-5 overflow-hidden ${containerClassName}`}
    >
      <span
        className={`inline-block text-[clamp(1.2rem,3.5vw,2rem)] md:text-[clamp(1.2rem,3vw,2.5rem)] lg:text-[clamp(1.4rem,3.5vw,2.8rem)] leading-[1.5] ${textClassName}`}
      >
        {splitText}
      </span>
    </h2>
  );
};

export default ScrollFloat;
