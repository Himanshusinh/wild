'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface LightDirectionSphereProps {
  value?: Vector3;
  onChange?: (value: Vector3) => void;
  size?: number;
  image?: string | null;
  color?: string;
}

export default function LightDirectionSphere({
  value = { x: 0, y: 0, z: 1 },
  onChange,
  size = 200,
  image,
  color = '#60a5fa' // Default blue-ish
}: LightDirectionSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // Load image when prop changes
  useEffect(() => {
    if (!image) {
      setLoadedImage(null);
      return;
    }
    const img = new Image();
    img.src = image;
    img.onload = () => setLoadedImage(img);
  }, [image]);

  // Constants
  const GLOBE_RADIUS = size * 0.35;
  const CENTER = size / 2;

  // Helper to convert hex to rgb
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 96, g: 165, b: 250 }; // default
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw Center Image (Subject)
    const iconSize = GLOBE_RADIUS * 0.8; // Reduced size for better fit
    const iconHalf = iconSize / 2;

    ctx.save();
    ctx.translate(CENTER, CENTER);

    // Initial clip path for the image square
    ctx.beginPath();
    const borderRadius = iconSize * 0.2; // rounded corners relative to size
    ctx.roundRect(-iconHalf, -iconHalf, iconSize, iconSize, borderRadius);
    ctx.clip();

    if (loadedImage) {
      // Draw the uploaded image
      // Calculate aspect ratio to cover (square crop)
      const scale = Math.max(iconSize / loadedImage.width, iconSize / loadedImage.height);
      const w = loadedImage.width * scale;
      const h = loadedImage.height * scale;
      ctx.drawImage(loadedImage, -w / 2, -h / 2, w, h);

      // Add gradients to simulate light direction

      // 1. Shadow Gradient (darkness opposite to light)
      // Calculate opposite point
      const gradX = -value.x * iconHalf;
      const gradY = value.y * iconHalf;

      const gradient = ctx.createRadialGradient(gradX, gradY, 0, gradX, gradY, iconSize);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)'); // Darkest point opposite light
      gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.globalCompositeOperation = 'multiply'; // Blend darken
      ctx.fillRect(-iconHalf, -iconHalf, iconSize, iconSize);

      // 2. Light Highlight (brightness at light source)
      const lightX = value.x * iconHalf;
      const lightY = -value.y * iconHalf;
      const lightGrad = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, iconSize * 0.8);

      const rgb = hexToRgb(color);
      lightGrad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`); // Tinted highlight
      lightGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

      ctx.fillStyle = lightGrad;
      ctx.globalCompositeOperation = 'overlay'; // Blend bright
      ctx.fillRect(-iconHalf, -iconHalf, iconSize, iconSize);

      ctx.globalCompositeOperation = 'source-over'; // Reset blending

    } else {
      // Default Mountain/Sun icon background if no image
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(-iconHalf, -iconHalf, iconSize, iconSize);

      // Draw icon
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      // Scale down the drawing operations for the icon relative to the new size
      const s = 1.0;

      ctx.beginPath();
      // Mountains
      ctx.moveTo(-10 * s, 4 * s);
      ctx.lineTo(-4 * s, -4 * s);
      ctx.lineTo(2 * s, 2 * s);
      ctx.lineTo(10 * s, -6 * s);
      ctx.lineTo(14 * s, 4 * s); // rough shape

      // Sun
      ctx.moveTo(10 * s, -10 * s);
      ctx.arc(6 * s, -10 * s, 3 * s, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Draw border around the subject image
    ctx.beginPath();
    ctx.roundRect(CENTER - iconHalf, CENTER - iconHalf, iconSize, iconSize, borderRadius);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();


    // ------------------------------------------------
    // Draw Wireframe Sphere
    // ------------------------------------------------

    // Helper to draw ellipsis
    const drawEllipse = (rx: number, ry: number, rotation: number = 0, dashed = false) => {
      ctx.beginPath();
      ctx.ellipse(CENTER, CENTER, rx, ry, rotation, 0, Math.PI * 2);
      if (dashed) {
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    ctx.lineWidth = 1;

    // Main Outline
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, GLOBE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.stroke();

    // Longitude Lines (Vertical-ish)
    // We draw them fixed for now to represent the "cage"
    const longs = [0.2, 0.5, 0.8]; // factors of radius
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    longs.forEach(factor => {
      drawEllipse(GLOBE_RADIUS * factor, GLOBE_RADIUS, 0, true);
    });

    // Latitude Lines (Horizontal-ish)
    // Equator
    drawEllipse(GLOBE_RADIUS, GLOBE_RADIUS * 0.2, 0, false); // Tilted equator appearance
    drawEllipse(GLOBE_RADIUS, GLOBE_RADIUS * 0.5, 0, false);
    drawEllipse(GLOBE_RADIUS, GLOBE_RADIUS * 0.8, 0, false);


    // ------------------------------------------------
    // Draw Active Light Position
    // ------------------------------------------------

    // Calculate point on 2D circle
    const px = CENTER + value.x * GLOBE_RADIUS;
    const py = CENTER - value.y * GLOBE_RADIUS;

    // Determine if point is "behind" the sphere (simplified visual logic)
    // In our simplified interaction, we treat the input as front-facing mostly, 
    // unless z is explicitly negative.
    const isBehind = value.z < -0.1;

    // Draw track line (arc) from pole to point?
    // Reference image shows a curve connecting poles through the point.
    // Let's approximate a longitude line passing through the point.
    // The point (x, y) relative to center defines a longitude.
    // We can draw an ellipse that passes through (px, py) and the poles (CENTER, CENTER +/- RADIUS).

    // Draw the "Meridian" for the active point
    ctx.save();
    ctx.beginPath();
    // Simplified: visual curve through the point
    ctx.moveTo(CENTER, CENTER - GLOBE_RADIUS); // Top pole
    ctx.quadraticCurveTo(px + (px - CENTER) * 0.5, py, CENTER, CENTER + GLOBE_RADIUS); // Bottom pole
    // This is a rough approx of a meridian
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();

    // Draw the "Parallel" (Latitude) for the active point
    // Ellipse through point
    ctx.save();
    ctx.beginPath();
    const latY = py;
    // Width at this latitude
    // x^2 + y^2 = r^2 -> x = sqrt(r^2 - y^2) - this is the width of the sphere at this Y
    const yRel = py - CENTER;
    const sphereWidthAtY = Math.sqrt(Math.max(0, GLOBE_RADIUS * GLOBE_RADIUS - yRel * yRel));

    ctx.ellipse(CENTER, py, sphereWidthAtY, sphereWidthAtY * 0.2, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
    ctx.stroke();
    ctx.restore();


    // Draw The Light Emitter
    const pointColor = color; // Blue-ish light color

    // Connection line from Surface to "Light Source" (hovering above surface)
    // The reference shows a point ON the surface.

    // Draw Point
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = isBehind ? 'rgba(80, 80, 80, 0.5)' : '#000';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = pointColor;
    ctx.stroke();

    // Inner glow dot
    if (!isBehind) {
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = pointColor;
      ctx.fill();

      // Outer Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = pointColor;
      ctx.strokeStyle = pointColor;
      ctx.stroke(); // re-stroke for glow
      ctx.shadowBlur = 0;
    }

  }, [value, size, GLOBE_RADIUS, CENTER, loadedImage, color]);

  // Interaction handlers
  const updateFromPointer = (e: React.PointerEvent) => {
    if (!canvasRef.current || !onChange) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize to -1 to 1 relative to center
    let dx = (x - CENTER) / GLOBE_RADIUS;
    let dy = -(y - CENTER) / GLOBE_RADIUS;

    // Clamp to circle
    const distSq = dx * dx + dy * dy;
    if (distSq > 1) {
      const dist = Math.sqrt(distSq);
      dx /= dist;
      dy /= dist;
    }

    const dz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));

    onChange({ x: dx, y: dy, z: dz });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      updateFromPointer(e);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm"
    >
      <div className="flex justify-between w-full mb-4 items-center">
        <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Light Direction</div>
        <div className="text-[10px] bg-white/10 px-2 py-1 rounded text-slate-300 font-mono">
          {Math.round((Math.atan2(value.x, value.y) * 180 / Math.PI + 360) % 360)}°
        </div>
      </div>

      <div className="relative group cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="touch-none"
          style={{ width: size, height: size }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* Instruction Tooltip */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-500 whitespace-nowrap pointer-events-none">
          Drag to move light source
        </div>
      </div>
    </div>
  );
}
