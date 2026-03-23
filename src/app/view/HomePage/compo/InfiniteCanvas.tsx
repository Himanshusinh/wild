"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

const BOARD_WIDTH = 820;
const BOARD_HEIGHT = 360;
const NODE_WIDTH = 190;
const NODE_HEIGHT = 146;
const DOT_OFFSET = 6;

type NodeId = "input" | "generate" | "motion" | "voice";
type NodePosition = { left: number; top: number };
type NodePositions = Record<NodeId, NodePosition>;

const INITIAL_POSITIONS: NodePositions = {
  input: { left: 40, top: 98 },
  generate: { left: 315, top: 42 },
  motion: { left: 590, top: 62 },
  voice: { left: 315, top: 230 },
};

export default function InfiniteCanvas() {
  const vpRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [positions, setPositions] = useState<NodePositions>(INITIAL_POSITIONS);
  const dragStateRef = useRef<{
    nodeId: NodeId;
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  function getDotPoint(dotId: string): { x: number; y: number } | null {
    switch (dotId) {
      case "dotA":
        return {
          x: positions.input.left + NODE_WIDTH + DOT_OFFSET,
          y: positions.input.top + NODE_HEIGHT / 2,
        };
      case "dotBl":
        return {
          x: positions.generate.left - DOT_OFFSET,
          y: positions.generate.top + NODE_HEIGHT / 2,
        };
      case "dotBr":
        return {
          x: positions.generate.left + NODE_WIDTH + DOT_OFFSET,
          y: positions.generate.top + NODE_HEIGHT / 2,
        };
      case "dotBb":
        return {
          x: positions.generate.left + NODE_WIDTH / 2,
          y: positions.generate.top + NODE_HEIGHT + DOT_OFFSET,
        };
      case "dotCl":
        return {
          x: positions.motion.left - DOT_OFFSET,
          y: positions.motion.top + NODE_HEIGHT / 2,
        };
      case "dotDl":
        return {
          x: positions.voice.left - DOT_OFFSET,
          y: positions.voice.top + NODE_HEIGHT / 2,
        };
      default:
        return null;
    }
  }

  function getPathD(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) {
    const cx = (x1 + x2) / 2;
    return `M${x1} ${y1} C${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`;
  }

  function clampPosition(left: number, top: number): NodePosition {
    return {
      left: Math.max(16, Math.min(left, BOARD_WIDTH - NODE_WIDTH - 16)),
      top: Math.max(16, Math.min(top, BOARD_HEIGHT - NODE_HEIGHT - 16)),
    };
  }

  function updateNodePosition(nodeId: NodeId, left: number, top: number) {
    setPositions((prev) => ({
      ...prev,
      [nodeId]: clampPosition(left, top),
    }));
  }

  function updateLayout() {
    const vp = vpRef.current;
    if (!vp) return;
    const isMobile = window.innerWidth < 640;
    const padding = isMobile ? 10 : 32;
    const widthScale = (vp.clientWidth - padding * 2) / BOARD_WIDTH;
    const heightScale = (vp.clientHeight - padding * 2) / BOARD_HEIGHT;
    const baseScale = Math.min(widthScale, heightScale, 1);
    const mobileBoostedScale = isMobile ? Math.min(baseScale * 1.2, 1) : baseScale;
    setScale(mobileBoostedScale);
  }

  useEffect(() => {
    const timer = window.setTimeout(updateLayout, 150);
    window.addEventListener("resize", updateLayout);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const drag = dragStateRef.current;
      const board = boardRef.current;
      if (!drag || !board) return;
      const boardRect = board.getBoundingClientRect();
      const nextLeft = (event.clientX - boardRect.left) / scale - drag.offsetX;
      const nextTop = (event.clientY - boardRect.top) / scale - drag.offsetY;
      updateNodePosition(drag.nodeId, nextLeft, nextTop);
    }

    function endDrag() {
      dragStateRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [scale]);

  function startDrag(nodeId: NodeId, event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const board = boardRef.current;
    const position = positions[nodeId];
    if (!board) return;
    const boardRect = board.getBoundingClientRect();
    dragStateRef.current = {
      nodeId,
      pointerId: event.pointerId,
      offsetX: (event.clientX - boardRect.left) / scale - position.left,
      offsetY: (event.clientY - boardRect.top) / scale - position.top,
    };
    target.setPointerCapture(event.pointerId);
  }

  const connections = [
    { from: getDotPoint("dotA"), to: getDotPoint("dotBl"), color: "#f59e0b", dashed: false },
    { from: getDotPoint("dotBr"), to: getDotPoint("dotCl"), color: "#3B82F6", dashed: true },
    { from: getDotPoint("dotBb"), to: getDotPoint("dotDl"), color: "#6EE66E", dashed: false },
  ].filter((connection) => connection.from && connection.to);

  return (
    <section className="bg-[#0E0E12] px-4 sm:px-4 md:px-6 lg:px-8">
      <style>{`
        .dash-anim {
          animation: dashmove 1.4s linear infinite;
        }
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
        .nd-blink {
          display: inline-block;
          width: 7px;
          height: 13px;
          margin-left: 3px;
          background: rgba(240,239,233,.5);
          animation: blink 1s steps(2, start) infinite;
          vertical-align: -2px;
        }
        @keyframes blink {
          to { opacity: 0; }
        }
        @keyframes waveform {
          0%, 100% { transform: scaleY(0.75); opacity: 0.8; }
          50% { transform: scaleY(1.15); opacity: 1; }
        }
        @keyframes dashmove {
          to { stroke-dashoffset: -20; }
        }
        .canvas-node {
          touch-action: none;
          user-select: none;
          cursor: grab;
          transition: box-shadow 180ms ease, border-color 180ms ease;
          will-change: transform;
        }
        .canvas-node:active {
          cursor: grabbing;
        }
      `}</style>

      <div className="mb-3 flex flex-col gap-2 sm:mb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div
            className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] sm:text-[10px]"
            style={{ color: "#3B82F6" }}
          >
            <span className="inline-block h-[1.5px] w-3.5 sm:w-4" style={{ background: "#3B82F6" }} />
            Infinite Canvas
          </div>
          <h2
            className="text-[24px] leading-none tracking-[0.02em] text-white sm:text-[20px] md:text-[28px] lg:text-[36px]"
            style={{ fontFamily: "var(--font-bebas-neue), sans-serif" }}
          >
            Build Visual Workflows
          </h2>
        </div>
        <button
          className="w-fit rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white/45 transition-all duration-200 hover:border-white/20 hover:text-[#F0EFE9] sm:px-[18px] sm:py-2 sm:text-xs"
        >
          Open Canvas 
        </button>
      </div>

      <div
        ref={vpRef}
        className="relative w-full overflow-hidden rounded-2xl border border-white/7 bg-[#1C1C20] sm:rounded-3xl"
        style={{
          height: "clamp(340px, 48vw, 430px)",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      >
        <div
          ref={boardRef}
          className="absolute left-1/2 top-1/2 z-[2] origin-center"
          style={{
            width: BOARD_WIDTH,
            height: BOARD_HEIGHT,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
            viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
            preserveAspectRatio="none"
          >
            {connections.map((connection, index) => (
              <path
                key={`${index}-${connection.color}`}
                d={getPathD(
                  connection.from!.x,
                  connection.from!.y,
                  connection.to!.x,
                  connection.to!.y
                )}
                fill="none"
                stroke={connection.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.85"
                strokeDasharray={connection.dashed ? "5 5" : undefined}
                className={connection.dashed ? "dash-anim" : undefined}
              />
            ))}
          </svg>

          <div
            id="ndA"
            onPointerDown={(event) => startDrag("input", event)}
            className="canvas-node absolute z-[2] w-[190px] rounded-[11px] border border-white/[0.09] bg-[rgba(28,28,32,0.96)] shadow-[0_6px_28px_rgba(0,0,0,0.5)] hover:border-white/[0.18]"
            style={{ left: positions.input.left, top: positions.input.top }}
          >
            <div className="flex items-center gap-1.5 border-b border-white/[0.05] px-2.5 pb-[6px] pt-[7px] sm:px-3 sm:pb-[7px] sm:pt-[9px]">
              <span className="flex h-3.5 w-3.5 items-center justify-center text-[#f59e0b]">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M3 4.5h7M3 6.5h4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#f59e0b]">Input</span>
              <span className="ml-auto text-xs tracking-[2px] opacity-20">:::</span>
            </div>
            <div className="p-2.5 pb-0 sm:p-3 sm:pb-0">
              <div
                className="rounded-[7px] border border-white/[0.06] bg-[rgba(6,8,12,.85)] p-3 font-mono text-[11px] leading-relaxed text-[rgba(240,239,233,.4)]"
              >
                "Neon city at dusk..."<span className="nd-blink" />
              </div>
            </div>
            <div className="mt-1.5 px-2.5 pb-2 text-xs font-bold text-white sm:mt-2 sm:px-3 sm:pb-2.5">Text Prompt</div>
            <div id="dotA" className="absolute right-[-6px] top-1/2 z-[5] h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[rgba(28,28,32,0.96)] bg-[#f59e0b]" />
          </div>

          <div
            onPointerDown={(event) => startDrag("generate", event)}
            className="canvas-node absolute z-[2] w-[190px] rounded-[11px] border border-white/[0.09] bg-[rgba(28,28,32,0.96)] shadow-[0_6px_28px_rgba(0,0,0,0.5)] hover:border-white/[0.18]"
            style={{ left: positions.generate.left, top: positions.generate.top }}
          >
            <div className="flex items-center gap-1.5 border-b border-white/[0.05] px-2.5 pb-[6px] pt-[7px] sm:px-3 sm:pb-[7px] sm:pt-[9px]">
              <span className="flex h-3.5 w-3.5 items-center justify-center text-[#3B82F6]">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1L12 6.5 6.5 12M1 6.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#3B82F6]">Generate</span>
              <span className="ml-auto text-xs tracking-[2px] opacity-20">:::</span>
            </div>
            <div className="p-2.5 pb-0 sm:p-3 sm:pb-0">
              <div className="h-24 overflow-hidden rounded-[7px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://picsum.photos/seed/ndimg1/190/96" alt="" className="h-full w-full object-cover" style={{ filter: "brightness(.85) saturate(.9)" }} />
              </div>
            </div>
            <div className="mt-1.5 px-2.5 pb-2 text-xs font-bold text-white sm:mt-2 sm:px-3 sm:pb-2.5">Flux Pro 1.1</div>
            <div id="dotBl" className="absolute left-[-6px] top-1/2 z-[5] h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[rgba(28,28,32,0.96)] bg-[#3B82F6]" />
            <div id="dotBr" className="absolute right-[-6px] top-1/2 z-[5] h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[rgba(28,28,32,0.96)] bg-[#3B82F6]" />
            <div id="dotBb" className="absolute bottom-[-6px] left-1/2 z-[5] h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-[rgba(28,28,32,0.96)] bg-[#3B82F6]" />
          </div>

          <div
            onPointerDown={(event) => startDrag("motion", event)}
            className="canvas-node absolute z-[2] w-[190px] rounded-[11px] border border-white/[0.09] bg-[rgba(28,28,32,0.96)] shadow-[0_6px_28px_rgba(0,0,0,0.5)] hover:border-white/[0.18]"
            style={{ left: positions.motion.left, top: positions.motion.top }}
          >
            <div className="flex items-center gap-1.5 border-b border-white/[0.05] px-2.5 pb-[6px] pt-[7px] sm:px-3 sm:pb-[7px] sm:pt-[9px]">
              <span className="flex h-3.5 w-3.5 items-center justify-center text-[#a78bfa]">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="3" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10 5.5l2.5-1.5v5L10 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#a78bfa]">Motion</span>
              <span className="ml-auto text-xs tracking-[2px] opacity-20">:::</span>
            </div>
            <div className="p-2.5 pb-0 sm:p-3 sm:pb-0">
              <div className="flex h-24 items-center justify-center rounded-[7px] bg-[linear-gradient(135deg,#1e1028,#181a2e)]">
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-white/20 bg-white/[0.12]">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="ml-0.5"><path d="M2.5 1.5L9 5.5L2.5 9.5V1.5Z" fill="rgba(196,181,253,.9)"/></svg>
                </div>
              </div>
            </div>
            <div className="mt-1.5 px-2.5 pb-2 text-xs font-bold text-white sm:mt-2 sm:px-3 sm:pb-2.5">Runway Gen-3</div>
            <div id="dotCl" className="absolute left-[-6px] top-1/2 z-[5] h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[rgba(28,28,32,0.96)] bg-[#a78bfa]" />
          </div>

          <div
            onPointerDown={(event) => startDrag("voice", event)}
            className="canvas-node absolute z-[2] w-[190px] rounded-[11px] border border-white/[0.09] bg-[rgba(28,28,32,0.96)] shadow-[0_6px_28px_rgba(0,0,0,0.5)] hover:border-white/[0.18]"
            style={{ left: positions.voice.left, top: positions.voice.top }}
          >
            <div className="flex items-center gap-1.5 border-b border-white/[0.05] px-2.5 pb-[6px] pt-[7px] sm:px-3 sm:pb-[7px] sm:pt-[9px]">
              <span className="flex h-3.5 w-3.5 items-center justify-center text-[#6EE66E]">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v6M4.5 3v4M8.5 3v4M2.5 5.5v2M10.5 5.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2 10.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6EE66E]">Voice</span>
              <span className="ml-auto text-xs tracking-[2px] opacity-20">:::</span>
            </div>
            <div className="p-2.5 pb-0 sm:p-3 sm:pb-0">
              <div className="flex h-[54px] items-center justify-center gap-[3px]">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="wb" />
                ))}
              </div>
            </div>
            <div className="mt-1.5 px-2.5 pb-2 text-xs font-bold text-white sm:mt-2 sm:px-3 sm:pb-2.5">ElevenLabs</div>
            <div id="dotDl" className="absolute left-[-6px] top-1/2 z-[5] h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[rgba(28,28,32,0.96)] bg-[#6EE66E]" />
          </div>
        </div>
      </div>
    </section>
  );
}
