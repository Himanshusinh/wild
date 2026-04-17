"use client";

import React from "react";

export function FullscreenImageViewer({
  isOpen,
  src,
  alt = "",
  onClose,
}: {
  isOpen: boolean;
  src: string;
  alt?: string;
  onClose: () => void;
}) {
  const [scale, setScale] = React.useState(1);
  const [fitScale, setFitScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [lastPoint, setLastPoint] = React.useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = React.useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mouseDownTimeRef = React.useRef(0);
  const mouseDownPosRef = React.useRef({ x: 0, y: 0 });

  const clampOffset = React.useCallback(
    (next: { x: number; y: number }, nextScale: number) => {
      if (!containerRef.current) return next;
      const rect = containerRef.current.getBoundingClientRect();
      const imgW = naturalSize.width * nextScale;
      const imgH = naturalSize.height * nextScale;
      const maxX = Math.max(0, (imgW - rect.width) / 2);
      const maxY = Math.max(0, (imgH - rect.height) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, next.x)),
        y: Math.max(-maxY, Math.min(maxY, next.y)),
      };
    },
    [naturalSize],
  );

  const zoomToPoint = React.useCallback(
    (cursorPos: { x: number; y: number }, nextScale: number) => {
      if (!containerRef.current) return;
      const currentScale = scale;
      const currentOffset = offset;

      const imageX = (cursorPos.x - currentOffset.x) / currentScale;
      const imageY = (cursorPos.y - currentOffset.y) / currentScale;

      const nextOffsetX = cursorPos.x - imageX * nextScale;
      const nextOffsetY = cursorPos.y - imageY * nextScale;

      const clamped = clampOffset({ x: nextOffsetX, y: nextOffsetY }, nextScale);
      setScale(nextScale);
      setOffset(clamped);
    },
    [scale, offset, clampOffset],
  );

  const close = React.useCallback(() => {
    setIsPanning(false);
    onClose();
  }, [onClose]);

  // Reset view when opening / switching image
  React.useEffect(() => {
    if (!isOpen) return;
    setOffset({ x: 0, y: 0 });
    setScale(1);
    setFitScale(1);
    setIsPanning(false);
  }, [isOpen, src]);

  // Fit-to-height on open/resize (upscaling allowed)
  React.useEffect(() => {
    if (!isOpen) return;
    const computeFit = () => {
      if (!containerRef.current || !naturalSize.width || !naturalSize.height) return;
      const rect = containerRef.current.getBoundingClientRect();
      const heightFit = rect.height / naturalSize.height;
      const base = heightFit || 1;
      setFitScale(base);
      setScale(base);
      setOffset({ x: 0, y: 0 });
    };
    computeFit();
    window.addEventListener("resize", computeFit);
    return () => window.removeEventListener("resize", computeFit);
  }, [isOpen, naturalSize]);

  // Lock background scroll while open
  React.useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // ESC closes
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const onWheel = React.useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const zoomFactor = e.deltaY > 0 ? 1 / 1.15 : 1.15;
      const next = Math.max(0.4, Math.min(6, scale * zoomFactor));
      if (Math.abs(next - scale) < 0.001) return;
      zoomToPoint({ x: mx, y: my }, next);
    },
    [scale, zoomToPoint],
  );

  // Non-passive wheel listener
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || !isOpen) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel, isOpen]);

  const onMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      mouseDownTimeRef.current = Date.now();
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const atFit = scale <= fitScale + 0.001;

        if (e.button === 0) {
          if (!atFit) {
            setIsPanning(true);
            setLastPoint({ x: e.clientX, y: e.clientY });
            return;
          }
          const next = Math.min(6, scale * 1.2);
          if (next !== scale) {
            zoomToPoint({ x: mx, y: my }, next);
            return;
          }
        }

        if (e.button === 1) {
          setIsPanning(true);
          setLastPoint({ x: e.clientX, y: e.clientY });
          return;
        }

        if (e.button === 2) {
          const next = Math.max(0.5, scale / 1.2);
          if (next !== scale) {
            zoomToPoint({ x: mx, y: my }, next);
            return;
          }
        }
      }

      setIsPanning(true);
      setLastPoint({ x: e.clientX, y: e.clientY });
    },
    [scale, fitScale, zoomToPoint],
  );

  const onMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPanning) return;
      e.preventDefault();
      const dx = e.clientX - lastPoint.x;
      const dy = e.clientY - lastPoint.y;
      const next = clampOffset({ x: offset.x + dx, y: offset.y + dy }, scale);
      setOffset(next);
      setLastPoint({ x: e.clientX, y: e.clientY });
    },
    [isPanning, lastPoint, offset, clampOffset, scale],
  );

  const onMouseUp = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsPanning(false);
      const dt = Date.now() - mouseDownTimeRef.current;
      const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
      const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);

      if (dt < 300 && dx < 8 && dy < 8) {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (scale > fitScale + 0.01) {
          setScale(fitScale);
          setOffset({ x: 0, y: 0 });
        } else {
          const next = Math.min(6, fitScale * 2);
          zoomToPoint({ x: mx, y: my }, next);
        }
      }
    },
    [scale, fitScale, zoomToPoint],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <button
        type="button"
        aria-label="Close fullscreen"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        className="absolute right-4 top-4 z-[1000] rounded-lg border border-white/15 bg-black/55 px-3 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:bg-black/75 hover:text-white"
      >
        ✕
      </button>

      <div
        ref={containerRef}
        className="absolute inset-0 cursor-zoom-in"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: scale > fitScale ? (isPanning ? "grabbing" : "grab") : "zoom-in" }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.15s ease-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            decoding="async"
            fetchPriority="high"
            draggable={false}
            className="select-none object-contain"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
              }
            }}
            style={{
              width: naturalSize.width ? `${naturalSize.width}px` : undefined,
              height: naturalSize.height ? `${naturalSize.height}px` : undefined,
              display: naturalSize.width ? "block" : "none",
            }}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-lg bg-black/75 px-4 py-2 text-center text-sm text-white/70 backdrop-blur-sm">
        Scroll to zoom • Drag to pan • Click to zoom/reset • ESC to exit
      </div>
    </div>
  );
}

