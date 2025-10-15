'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';

type Size = 'sm' | 'md' | 'lg';

interface WildMindLogoGeneratingProps {
  running?: boolean;
  progress?: number; // 0..1; if 1 -> finalize
  size?: Size;
  className?: string;
  logoSrc?: string;
  /** Duration (ms) for one pass (L→R or R→L). */
  speedMs?: number;
}

const SIZE_MAP: Record<Size, number> = { sm: 24, md: 48, lg: 64 };

const DEFAULT_SRC =
  'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2FAsset%203wildmind%20logo%20text.svg?alt=media&token=16944401-2132-474c-9411-68e8afe550e6';

const WildMindLogoAnimation: React.FC<WildMindLogoGeneratingProps> = ({
  running = true,
  progress,
  size = 'md',
  className = '',
  logoSrc = DEFAULT_SRC,
  speedMs = 1800,
}) => {
  // If progress is supplied and is 1 or more, we treat as completed.
  const isComplete = (progress ?? 0) >= 1 || !running;
  const px = SIZE_MAP[size] ?? SIZE_MAP.md;

  // Build CSS variables for speed; allow dynamic tuning.
  const vars = useMemo(
    () => ({
      // One direction pass duration
      ['--wm-pass-ms' as any]: `${speedMs}ms`,
    }),
    [speedMs]
  );

  return (
    <div
      className={`wm-wrap inline-block ${className}`}
      style={vars as React.CSSProperties}
      role="status"
      aria-live="polite"
      aria-label={isComplete ? 'Generation complete' : 'Generating preview…'}
    >
      <div className={`wm-stage ${isComplete ? 'wm-complete' : 'wm-running'}`} style={{ width: px, height: px }}>
        {/* Masked reveal layer */}
        <div className="wm-mask-layer">
          <Image
            src={logoSrc}
            alt="WildMind AI"
            width={px}
            height={px}
            className="wm-logo"
            priority
          />
          {/* Shimmer sweep */}
          <div className="wm-shimmer" aria-hidden />
        </div>

        {/* Soft base logo for depth (very dim while running, full on complete) */}
        <div className="wm-base">
          <Image
            src={logoSrc}
            alt="WildMind AI base"
            width={px}
            height={px}
            className="wm-logo"
            aria-hidden
          />
        </div>
      </div>

      <style jsx>{`
        .wm-stage {
          position: relative;
          display: inline-grid;
          place-items: center;
          isolation: isolate;
        }

        .wm-logo { 
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        /* Base layer - sits underneath, gives subtle presence */
        .wm-base {
          position: absolute;
          inset: 0;
          opacity: 0.15;
          filter: blur(0.2px);
          transform: none;
          transition: opacity 220ms ease, filter 220ms ease;
        }

        /* Masked layer on top: does the left→right reveal */
        .wm-mask-layer {
          position: relative;
          inset: 0;
          display: grid;
          place-items: center;
          /* Mask setup: a rectangular band that slides horizontally to "reveal" */
          /* Use both standard and -webkit- prefix for Safari */
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 12%,
            black 88%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 12%,
            black 88%,
            transparent 100%
          );
          mask-repeat: no-repeat;
          -webkit-mask-repeat: no-repeat;
          /* We make the mask much wider than the element so the band can travel fully */
          mask-size: 300% 100%;
          -webkit-mask-size: 300% 100%;
          mask-position: 0% 50%;
          -webkit-mask-position: 0% 50%;
        }

        /* Shimmer line overlay (thin bright sweep) */
        .wm-shimmer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: 0.25;
          background-image: linear-gradient(
            to right,
            rgba(255,255,255,0) 35%,
            rgba(255,255,255,0.9) 50%,
            rgba(255,255,255,0) 65%
          );
          background-repeat: no-repeat;
          background-size: 300% 100%;
          background-position: 0% 50%;
          filter: blur(0.4px);
        }

        /* RUNNING STATE */
        .wm-running {
          animation: wmPulse 1600ms ease-in-out infinite;
        }
        .wm-running .wm-base {
          opacity: 0.12;
        }
        .wm-running .wm-mask-layer {
          animation: wmSweep var(--wm-pass-ms) linear infinite alternate;
        }
        .wm-running .wm-shimmer {
          animation: wmSweep var(--wm-pass-ms) linear infinite alternate;
        }

        /* COMPLETE STATE */
        .wm-complete {
          animation: wmSettle 360ms ease-out forwards;
        }
        .wm-complete .wm-base {
          opacity: 1;
          filter: none;
          transition: opacity 260ms ease, filter 260ms ease;
        }
        .wm-complete .wm-mask-layer,
        .wm-complete .wm-shimmer {
          animation: none;
          /* Lock the mask fully open on completion */
          mask-position: 100% 50%;
          -webkit-mask-position: 100% 50%;
          background-position: 100% 50%;
        }

        /* Keyframes */
        @keyframes wmSweep {
          0% {
            mask-position: 0% 50%;
            -webkit-mask-position: 0% 50%;
            background-position: 0% 50%;
          }
          100% {
            mask-position: 100% 50%;
            -webkit-mask-position: 100% 50%;
            background-position: 100% 50%;
          }
        }

        @keyframes wmPulse {
          0%   { transform: scale(0.985); opacity: 0.92; }
          50%  { transform: scale(1.015); opacity: 1.0; }
          100% { transform: scale(0.985); opacity: 0.92; }
        }

        @keyframes wmSettle {
          0%   { transform: scale(1.0); }
          50%  { transform: scale(1.03); }
          100% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
};

export default WildMindLogoAnimation;
