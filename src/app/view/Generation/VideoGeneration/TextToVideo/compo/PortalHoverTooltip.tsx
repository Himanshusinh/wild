"use client";

import React, {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export interface PortalHoverTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  /** Classes on the inline wrapper that receives the ref (layout / flex). */
  wrapperClassName?: string;
}

/**
 * Hover tooltip rendered via portal + fixed positioning so it is not clipped
 * by overflow-y-auto / overflow-x-auto ancestors (e.g. video input dock).
 */
const PortalHoverTooltip: React.FC<PortalHoverTooltipProps> = ({
  children,
  content,
  wrapperClassName = "",
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    left: number;
    top: number;
    transform: string;
  } | null>(null);

  const measure = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const approxH = 56;
    const maxW = Math.min(260, vw - 32);
    const spaceAbove = r.top;
    const spaceBelow = vh - r.bottom;
    const placeAbove =
      spaceAbove >= approxH + gap || spaceAbove >= spaceBelow;
    const top = placeAbove ? r.top - gap : r.bottom + gap;
    const transform = placeAbove
      ? "translate(-50%, -100%)"
      : "translate(-50%, 0)";
    let left = r.left + r.width / 2;
    const half = maxW / 2 + 12;
    left = Math.max(half, Math.min(vw - half, left));
    setCoords({ left, top, transform });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
  }, [open, measure]);

  useLayoutEffect(() => {
    if (!open) return;
    const onScroll = () => measure();
    const onResize = () => measure();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, measure]);

  return (
    <div
      ref={wrapRef}
      className={`inline-flex max-w-full ${wrapperClassName}`.trim()}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setCoords(null);
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => {
        setOpen(false);
        setCoords(null);
      }}
    >
      {children}
      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[10060] max-w-[min(260px,calc(100vw-32px))] whitespace-normal rounded-md bg-white/5 backdrop-blur-3xl px-1 py-1 text-center text-[10px] leading-snug text-white shadow-lg"
            style={{
              left: coords.left,
              top: coords.top,
              transform: coords.transform,
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default PortalHoverTooltip;
