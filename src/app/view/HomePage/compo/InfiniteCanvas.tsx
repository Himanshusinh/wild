"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Visual tokens aligned with wildmindcanvas (ImageModalFrame, TextModalFrame, VideoModalFrame).
 * @see wildmindcanvas/core/canvas/canvasHelpers.ts — SELECTED_FRAME_BORDER_COLOR, etc.
 */
const STUDIO = {
  frameBg: "#1A1A1A",
  frameBorder: "#2e2e2e",
  frameBorderW: 4,
  selectionBlue: "#3B7FDB",
  connector: "#4C83FF",
  font: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

/** World size (CSS px) */
const BOARD_WIDTH = 1040;
const BOARD_HEIGHT = 560;
const DOT_OFFSET = 6;

const MIN_ZOOM = 0.65;
const MAX_ZOOM = 2.4;
const ZOOM_STEP = 1.12;

const PRESET_PROMPT =
  "Neon city at dusk, rain on wet streets, cinematic lighting, ultra detailed, 8k";

type NodeId = "input" | "generate" | "motion" | "voice";

/** Per-node size for clamping & ports (matches composed studio-style chrome). */
const NODE_LAYOUT: Record<NodeId, { w: number; h: number }> = {
  input: { w: 212, h: 136 },
  generate: { w: 212, h: 304 },
  motion: { w: 212, h: 192 },
  voice: { w: 212, h: 128 },
};

/** Image preview height inside generate node (below top border). */
const GENERATE_PREVIEW_H = 118;

type NodePosition = { left: number; top: number };
type NodePositions = Record<NodeId, NodePosition>;

const INITIAL_POSITIONS: NodePositions = {
  input: { left: 36, top: 180 },
  generate: { left: 300, top: 100 },
  motion: { left: 600, top: 120 },
  voice: { left: 300, top: 380 },
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function studioDotStyle(accent: string): CSSProperties {
  return {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 999,
    border: `2px solid ${STUDIO.frameBg}`,
    background: accent,
    zIndex: 5,
  };
}

export default function InfiniteCanvas() {
  const vpRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const [baseFit, setBaseFit] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [positions, setPositions] = useState<NodePositions>(INITIAL_POSITIONS);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generateNonceRef = useRef(0);

  const dragStateRef = useRef<{
    nodeId: NodeId;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const panStateRef = useRef<{
    startX: number;
    startY: number;
    originPanX: number;
    originPanY: number;
    pointerId: number;
  } | null>(null);

  const [isPanning, setIsPanning] = useState(false);

  const effectiveScale = baseFit * userZoom;

  const updateBaseFit = useCallback(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const isMobile = window.innerWidth < 640;
    const padding = isMobile ? 10 : 32;
    const widthScale = (vp.clientWidth - padding * 2) / BOARD_WIDTH;
    const heightScale = (vp.clientHeight - padding * 2) / BOARD_HEIGHT;
    const fit = Math.min(widthScale, heightScale, 1);
    const boosted = isMobile ? Math.min(fit * 1.12, 1) : fit;
    setBaseFit(boosted);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(updateBaseFit, 150);
    window.addEventListener("resize", updateBaseFit);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", updateBaseFit);
    };
  }, [updateBaseFit]);

  const clientToWorld = useCallback((clientX: number, clientY: number) => {
    const board = boardRef.current;
    if (!board) return { x: 0, y: 0 };
    const r = board.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * BOARD_WIDTH;
    const y = ((clientY - r.top) / r.height) * BOARD_HEIGHT;
    return { x, y };
  }, []);

  function clampPosition(nodeId: NodeId, left: number, top: number): NodePosition {
    const { w, h } = NODE_LAYOUT[nodeId];
    return {
      left: clamp(left, 12, BOARD_WIDTH - w - 12),
      top: clamp(top, 12, BOARD_HEIGHT - h - 12),
    };
  }

  function updateNodePosition(nodeId: NodeId, left: number, top: number) {
    setPositions((prev) => ({
      ...prev,
      [nodeId]: clampPosition(nodeId, left, top),
    }));
  }

  const getDotPoint = useCallback(
    (dotId: string): { x: number; y: number } | null => {
      const p = positions;
      const Li = NODE_LAYOUT.input;
      const Lg = NODE_LAYOUT.generate;
      const Lm = NODE_LAYOUT.motion;
      const Lv = NODE_LAYOUT.voice;
      const bw = STUDIO.frameBorderW;

      switch (dotId) {
        case "dotA":
          return {
            x: p.input.left + Li.w + DOT_OFFSET,
            y: p.input.top + Li.h / 2,
          };
        case "dotBl": {
          const imgMidY = p.generate.top + bw + GENERATE_PREVIEW_H / 2;
          return { x: p.generate.left - DOT_OFFSET, y: imgMidY };
        }
        case "dotBr":
          return {
            x: p.generate.left + Lg.w + DOT_OFFSET,
            y: p.generate.top + bw + GENERATE_PREVIEW_H / 2,
          };
        case "dotBb":
          return {
            x: p.generate.left + Lg.w / 2,
            y: p.generate.top + bw + GENERATE_PREVIEW_H + bw + DOT_OFFSET,
          };
        case "dotCl":
          return {
            x: p.motion.left - DOT_OFFSET,
            y: p.motion.top + Lm.h / 2,
          };
        case "dotDl":
          return {
            x: p.voice.left - DOT_OFFSET,
            y: p.voice.top + Lv.h / 2,
          };
        default:
          return null;
      }
    },
    [positions]
  );

  function getPathD(x1: number, y1: number, x2: number, y2: number) {
    const cx = (x1 + x2) / 2;
    return `M${x1} ${y1} C${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`;
  }

  useEffect(() => {
    function onMove(ev: PointerEvent) {
      const nodeDrag = dragStateRef.current;
      if (nodeDrag) {
        const { x, y } = clientToWorld(ev.clientX, ev.clientY);
        updateNodePosition(nodeDrag.nodeId, x - nodeDrag.offsetX, y - nodeDrag.offsetY);
        return;
      }
      const panDrag = panStateRef.current;
      if (panDrag && ev.pointerId === panDrag.pointerId) {
        setPan({
          x: panDrag.originPanX + (ev.clientX - panDrag.startX),
          y: panDrag.originPanY + (ev.clientY - panDrag.startY),
        });
      }
    }

    function endAll() {
      dragStateRef.current = null;
      if (panStateRef.current) setIsPanning(false);
      panStateRef.current = null;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endAll);
    window.addEventListener("pointercancel", endAll);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endAll);
      window.removeEventListener("pointercancel", endAll);
    };
  }, [clientToWorld]);

  function startDragNode(nodeId: NodeId, event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const pos = positions[nodeId];
    const { x, y } = clientToWorld(event.clientX, event.clientY);
    dragStateRef.current = {
      nodeId,
      offsetX: x - pos.left,
      offsetY: y - pos.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function onBackdropPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    setIsPanning(true);
    panStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originPanX: pan.x,
      originPanY: pan.y,
      pointerId: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
    setUserZoom((z) => clamp(z * delta, MIN_ZOOM, MAX_ZOOM));
  }

  async function runDemoGenerate() {
    if (isGenerating) return;
    setIsGenerating(true);
    generateNonceRef.current += 1;
    const n = generateNonceRef.current;
    await new Promise((r) => window.setTimeout(r, 900 + Math.random() * 400));
    if (n !== generateNonceRef.current) return;
    const seed = `hero-${Date.now()}-${n}`;
    setGeneratedImageUrl(`https://picsum.photos/seed/${encodeURIComponent(seed)}/400/220`);
    setIsGenerating(false);
  }

  const connections = [
    { from: getDotPoint("dotA"), to: getDotPoint("dotBl"), dashed: false },
    { from: getDotPoint("dotBr"), to: getDotPoint("dotCl"), dashed: true },
    { from: getDotPoint("dotBb"), to: getDotPoint("dotDl"), dashed: false },
  ].filter((c) => c.from && c.to);

  const { w: iw, h: ih } = NODE_LAYOUT.input;
  const { w: gw, h: gh } = NODE_LAYOUT.generate;
  const { w: mw, h: mh } = NODE_LAYOUT.motion;
  const { w: vw, h: vh } = NODE_LAYOUT.voice;
  const bw = STUDIO.frameBorderW;

  return (
    <section
      className="bg-[#0E0E12] px-4 sm:px-4 md:px-6 lg:px-8"
      style={{ fontFamily: STUDIO.font }}
    >
      <style>{`
        .dash-anim { animation: dashmove 1.4s linear infinite; }
        .wb {
          width: 3px;
          border-radius: 999px;
          background: #6EE66E;
          animation: waveform 1s ease-in-out infinite;
        }
        .wb:nth-child(1) { height: 9px; animation-delay: -0.6s; }
        .wb:nth-child(2) { height: 14px; animation-delay: -0.2s; }
        .wb:nth-child(3) { height: 20px; animation-delay: -0.45s; }
        .wb:nth-child(4) { height: 12px; animation-delay: -0.1s; }
        .wb:nth-child(5) { height: 18px; animation-delay: -0.5s; }
        .wb:nth-child(6) { height: 14px; animation-delay: -0.25s; }
        .wb:nth-child(7) { height: 10px; animation-delay: -0.55s; }
        @keyframes waveform {
          0%, 100% { transform: scaleY(0.75); opacity: 0.8; }
          50% { transform: scaleY(1.15); opacity: 1; }
        }
        @keyframes dashmove { to { stroke-dashoffset: -20; } }
        .studio-node {
          touch-action: none;
          user-select: none;
          cursor: grab;
          box-sizing: border-box;
        }
        .studio-node:active { cursor: grabbing; }
      `}</style>

      <div className="mb-3 flex flex-col gap-2 sm:mb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div
            className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] sm:text-[10px]"
            style={{ color: STUDIO.selectionBlue }}
          >
            <span className="inline-block h-[1.5px] w-3.5 sm:w-4" style={{ background: STUDIO.selectionBlue }} />
            Infinite Canvas
          </div>
          <h2
            className="text-[24px] leading-none tracking-[0.02em] text-white sm:text-[20px] md:text-[28px] lg:text-[36px]"
            style={{ fontFamily: "var(--font-bebas-neue), sans-serif" }}
          >
            Build Visual Workflows
          </h2>
          <p className="mt-1.5 max-w-xl text-[11px] leading-snug text-white/40 sm:text-xs">
            Studio-style text, image, and video frames (Wildmind canvas look). Pan, zoom, drag nodes, then{" "}
            <span className="text-white/70">Generate image</span> for a quick demo.
          </p>
        </div>
        <a
          href="https://wildmindai.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white/45 transition-all duration-200 hover:border-white/20 hover:text-[#F0EFE9] sm:px-[18px] sm:py-2 sm:text-xs"
        >
          Open Canvas
        </a>
      </div>

      <div
        ref={vpRef}
        className="relative w-full overflow-hidden rounded-2xl border border-white/7 bg-[#1C1C20] sm:rounded-3xl"
        style={{
          height: "clamp(360px, 50vw, 460px)",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          touchAction: "none",
        }}
        onWheel={onWheel}
      >
        <div className="pointer-events-none absolute right-2 top-2 z-30 flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-1 py-0.5 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Zoom out"
            className="pointer-events-auto rounded px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
            onClick={() => setUserZoom((z) => clamp(z / ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
          >
            −
          </button>
          <span className="min-w-[2.5rem] text-center text-[10px] tabular-nums text-white/50">
            {Math.round(userZoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            className="pointer-events-auto rounded px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
            onClick={() => setUserZoom((z) => clamp(z * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
          >
            +
          </button>
          <button
            type="button"
            className="pointer-events-auto ml-0.5 rounded border-l border-white/10 pl-1.5 text-[10px] text-white/45 hover:text-white/70"
            onClick={() => {
              setPan({ x: 0, y: 0 });
              setUserZoom(1);
            }}
          >
            Reset
          </button>
        </div>

        <div
          className={`absolute inset-0 z-[1] ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
          onPointerDown={onBackdropPointerDown}
          style={{ touchAction: "none" }}
        />

        <div
          ref={boardRef}
          className="pointer-events-none absolute left-1/2 top-1/2 z-[2]"
          style={{
            width: BOARD_WIDTH,
            height: BOARD_HEIGHT,
            marginLeft: -BOARD_WIDTH / 2,
            marginTop: -BOARD_HEIGHT / 2,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${effectiveScale})`,
            transformOrigin: "center center",
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
            viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
            preserveAspectRatio="none"
          >
            {connections.map((connection, index) => (
              <path
                key={index}
                d={getPathD(
                  connection.from!.x,
                  connection.from!.y,
                  connection.to!.x,
                  connection.to!.y
                )}
                fill="none"
                stroke={STUDIO.connector}
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.9"
                strokeDasharray={connection.dashed ? "5 5" : undefined}
                className={connection.dashed ? "dash-anim" : undefined}
              />
            ))}
          </svg>

          {/* === Text frame (TextModalFrame-style) === */}
          <div
            className="studio-node pointer-events-auto absolute z-[2]"
            style={{ left: positions.input.left, top: positions.input.top, width: iw, height: ih }}
            onPointerDown={(e) => startDragNode("input", e)}
          >
            <div
              className="w-full flex-shrink-0 bg-black"
              style={{ height: 10, borderRadius: "16px 16px 0 0" }}
            />
            <div
              style={{
                border: `${bw}px solid ${STUDIO.frameBorder}`,
                borderTop: "none",
                borderRadius: "0 0 16px 16px",
                background: STUDIO.frameBg,
                height: ih - 10,
                overflow: "hidden",
              }}
            >
              <textarea
                readOnly
                value={PRESET_PROMPT}
                className="h-full w-full resize-none border-0 bg-transparent p-3 text-[11px] leading-relaxed text-white/90 outline-none"
                style={{ fontFamily: STUDIO.font }}
              />
            </div>
            <div
              style={{
                ...studioDotStyle("#f59e0b"),
                right: -DOT_OFFSET - 5,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
          </div>

          {/* === Image generation: ImageModalFrame + ImageModalControls-style === */}
          <div
            className="pointer-events-auto absolute z-[2]"
            style={{ left: positions.generate.left, top: positions.generate.top, width: gw, height: gh }}
          >
            <div
              onPointerDown={(e) => startDragNode("generate", e)}
              className="studio-node"
              style={{
                width: gw,
                height: GENERATE_PREVIEW_H + bw,
                boxSizing: "border-box",
                background: STUDIO.frameBg,
                borderTop: `${bw}px solid ${STUDIO.frameBorder}`,
                borderLeft: `${bw}px solid ${STUDIO.frameBorder}`,
                borderRight: `${bw}px solid ${STUDIO.frameBorder}`,
                borderBottom: "none",
                borderRadius: "20px 20px 0 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2 text-[11px] text-white/45">
                  <span
                    className="inline-block h-7 w-7 animate-spin rounded-full"
                    style={{
                      border: "2px solid rgba(255,255,255,0.15)",
                      borderTopColor: STUDIO.selectionBlue,
                    }}
                  />
                  Generating image…
                </div>
              ) : generatedImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={generatedImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{
                    borderRadius: 17,
                    filter: "brightness(0.92) saturate(0.95)",
                  }}
                />
              ) : (
                <div className="text-center" style={{ color: "#666" }}>
                  <svg
                    width={48}
                    height={48}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="mx-auto mb-2 opacity-30"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="text-[10px] text-white/35">Image generation</span>
                </div>
              )}
            </div>

            <div
              style={{
                width: gw,
                background: STUDIO.frameBg,
                border: `${bw}px solid ${STUDIO.frameBorder}`,
                borderTop: `1px solid rgba(255,255,255,0.06)`,
                borderRadius: "0 0 16px 16px",
                marginTop: -bw,
                padding: "10px 12px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div className="flex gap-2">
                <textarea
                  readOnly
                  value={PRESET_PROMPT}
                  className="min-h-[44px] flex-1 resize-none rounded-[10px] border-0 p-3 text-[12px] font-semibold leading-snug text-white outline-none"
                  style={{
                    background: STUDIO.frameBg,
                    fontFamily: STUDIO.font,
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  title="Generate"
                  disabled={isGenerating}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    void runDemoGenerate();
                  }}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] text-white transition hover:opacity-90 disabled:opacity-40"
                  style={{ background: STUDIO.selectionBlue }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="text-[10px] font-semibold text-white/55">Google nano banana pro · 2K</div>
            </div>

            <div
              style={{
                ...studioDotStyle(STUDIO.selectionBlue),
                left: -DOT_OFFSET - 5,
                top: bw + GENERATE_PREVIEW_H / 2,
                transform: "translateY(-50%)",
              }}
            />
            <div
              style={{
                ...studioDotStyle(STUDIO.selectionBlue),
                right: -DOT_OFFSET - 5,
                top: bw + GENERATE_PREVIEW_H / 2,
                transform: "translateY(-50%)",
              }}
            />
            <div
              style={{
                ...studioDotStyle(STUDIO.selectionBlue),
                left: "50%",
                top: bw + GENERATE_PREVIEW_H + bw + DOT_OFFSET,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          {/* === Video frame (VideoModalFrame-style) === */}
          <div
            className="studio-node pointer-events-auto absolute z-[2]"
            style={{ left: positions.motion.left, top: positions.motion.top, width: mw, height: mh }}
            onPointerDown={(e) => startDragNode("motion", e)}
          >
            <div
              style={{
                width: mw,
                height: mh - 28,
                background: STUDIO.frameBg,
                border: `${bw}px solid ${STUDIO.frameBorder}`,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              <div className="text-center" style={{ color: "#666" }}>
                <svg
                  width={52}
                  height={52}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mx-auto mb-1 opacity-30"
                >
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <button
                  type="button"
                  className="mt-1 rounded-full px-3 py-1 text-[10px] font-medium text-white/80"
                  style={{ background: "rgba(0,0,0,0.55)" }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  Preview
                </button>
              </div>
            </div>
            <div className="mt-1 px-1 text-[11px] font-bold text-white/90">Kling 1.6</div>
            <div
              style={{
                ...studioDotStyle("#a78bfa"),
                left: -DOT_OFFSET - 5,
                top: (mh - 28) / 2 + bw,
                transform: "translateY(-50%)",
              }}
            />
          </div>

          {/* === Voice / audio strip (studio border + waveform) === */}
          <div
            className="studio-node pointer-events-auto absolute z-[2]"
            style={{ left: positions.voice.left, top: positions.voice.top, width: vw, height: vh }}
            onPointerDown={(e) => startDragNode("voice", e)}
          >
            <div
              style={{
                width: vw,
                height: vh,
                background: STUDIO.frameBg,
                border: `${bw}px solid ${STUDIO.frameBorder}`,
                borderRadius: 16,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                className="flex items-center gap-2 border-b px-3 py-2"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <span className="text-[#6EE66E]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2v10M8 6v6M16 6v6M5 10v4M19 10v4" strokeLinecap="round" />
                    <path d="M4 20h16" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6EE66E]">Music</span>
                <span className="ml-auto text-[10px] tracking-widest text-white/20">···</span>
              </div>
              <div className="flex flex-1 items-center justify-center gap-0.5 px-3">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="wb" />
                ))}
              </div>
              <div className="px-3 pb-2 text-[10px] font-semibold text-white/55">Suno v4</div>
            </div>
            <div
              style={{
                ...studioDotStyle("#6EE66E"),
                left: -DOT_OFFSET - 5,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
