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

const WildMindLogoGenerating: React.FC<WildMindLogoGeneratingProps> = ({
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
      className={`wm-wrap flex items-center justify-center ${className}`}
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
          display: grid;
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

        /* Main logo layer - no masking for heartbeat */
        .wm-mask-layer {
          position: relative;
          inset: 0;
          display: grid;
          place-items: center;
        }

        /* Shimmer effect - subtle for heartbeat */
        .wm-shimmer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: 0.2;
          background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
          filter: blur(1px);
        }

        /* RUNNING STATE - Heartbeat animation */
        .wm-running {
          animation: wmHeartbeat 1200ms ease-in-out infinite;
        }
        .wm-running .wm-base {
          opacity: 0.15;
        }
        .wm-running .wm-mask-layer {
          animation: none;
        }
        .wm-running .wm-shimmer {
          animation: none;
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

        /* Keyframes - Stroke reveal animation following W→M path */
        @keyframes wmSweep {
          0% {
            mask-position: -100% -100%;
            -webkit-mask-position: -100% -100%;
            background-position: -100% -100%;
          }
          25% {
            mask-position: -50% -50%;
            -webkit-mask-position: -50% -50%;
            background-position: -50% -50%;
          }
          50% {
            mask-position: 0% 0%;
            -webkit-mask-position: 0% 0%;
            background-position: 0% 0%;
          }
          75% {
            mask-position: 50% 50%;
            -webkit-mask-position: 50% 50%;
            background-position: 50% 50%;
          }
          100% {
            mask-position: 100% 100%;
            -webkit-mask-position: 100% 100%;
            background-position: 100% 100%;
          }
        }

        @keyframes wmHeartbeat {
          0%   { 
            transform: scale(1.0); 
            opacity: 0.8; 
          }
          15%  { 
            transform: scale(1.08); 
            opacity: 1.0; 
          }
          30%  { 
            transform: scale(0.95); 
            opacity: 0.9; 
          }
          45%  { 
            transform: scale(1.05); 
            opacity: 1.0; 
          }
          60%  { 
            transform: scale(1.0); 
            opacity: 0.8; 
          }
          100% { 
            transform: scale(1.0); 
            opacity: 0.8; 
          }
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

export default WildMindLogoGenerating;
