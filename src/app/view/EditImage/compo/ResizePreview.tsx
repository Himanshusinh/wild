"use client";

import React from 'react'

type ResizePreviewProps = {
  imageUrl: string
  aspectLabel?: string
  className?: string
  showToolbar?: boolean
  presetSizes?: string[]
}

// Minimal, dependency-free crop/resize UI with 8 draggable handles and shaded outside regions
export default function ResizePreview({ imageUrl, aspectLabel = 'Square', className, showToolbar = false, presetSizes }: ResizePreviewProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const [imgNatural, setImgNatural] = React.useState({ width: 0, height: 0 })
  const [crop, setCrop] = React.useState<{ x: number; y: number; w: number; h: number }>({ x: 0.05, y: 0.15, w: 0.9, h: 0.7 })
  const [imgTransform, setImgTransform] = React.useState<{ tx: number; ty: number; scale: number }>({ tx: 0, ty: 0, scale: 1 })
  const dragRef = React.useRef<{ type: 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | 'img-nw' | 'img-ne' | 'img-se' | 'img-sw' | null; startX: number; startY: number; startCrop: typeof crop; startTransform: { tx: number; ty: number; scale: number }; anchor?: { ax: number; ay: number }; initialLen?: number } | null>(null)
  const imageElRef = React.useRef<HTMLImageElement | null>(null)

  const getBounds = React.useCallback(() => {
    const el = containerRef.current
    if (!el) return { left: 0, top: 0, width: 0, height: 0 }
    const rect = el.getBoundingClientRect()
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
  }, [])

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

  // Map aspect label to numeric ratio (w / h)
  const targetRatio = React.useMemo(() => {
    if (aspectLabel?.toLowerCase() === 'landscape') return 16 / 9
    if (aspectLabel?.toLowerCase() === 'portrait') return 9 / 16
    if (aspectLabel?.toLowerCase() === 'square') return 1
    return 0 // custom/unlocked
  }, [aspectLabel])

  // Center and fit the crop to the requested aspect when aspect or container changes
  const fitCropToAspect = React.useCallback(() => {
    const b = getBounds()
    if (!b.width || !b.height) return
    if (!targetRatio) return // custom -> keep previous
    const containerRatio = b.width / b.height
    // Target crop size in percentages of container
    let wPct = 0.9
    let hPct = 0.9
    if (containerRatio >= targetRatio) {
      // Container is wider; limit by height
      hPct = 0.9
      wPct = hPct * (b.height / b.width) * targetRatio
    } else {
      // Container is taller; limit by width
      wPct = 0.9
      hPct = wPct * (b.width / b.height) / targetRatio
    }
    wPct = clamp(wPct, 0.05, 1)
    hPct = clamp(hPct, 0.05, 1)
    const x = (1 - wPct) / 2
    const y = (1 - hPct) / 2
    setCrop({ x, y, w: wPct, h: hPct })
  }, [getBounds, targetRatio])

  React.useEffect(() => {
    // Re-fit on aspect change or initial load/resize
    fitCropToAspect()
  }, [fitCropToAspect, aspectLabel, imgNatural.width, imgNatural.height])

  // Load the image and keep an element reference for canvas drawing
  React.useEffect(() => {
    if (!imageUrl) return
    const img = new Image()
    imageElRef.current = img
    img.onload = () => {
      setImgNatural({ width: img.naturalWidth, height: img.naturalHeight })
      // draw once on load
      drawToCanvas()
    }
    img.src = imageUrl
    return () => {
      imageElRef.current = null
    }
  }, [imageUrl])

  // On new image or aspect change, reset pan/zoom so it starts fitted in frame
  React.useEffect(() => {
    setImgTransform({ tx: 0, ty: 0, scale: 1 })
  }, [imageUrl, aspectLabel])

  const drawToCanvas = React.useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const img = imageElRef.current
    if (!canvas || !container || !img || !imgNatural.width || !imgNatural.height) return

    const rect = container.getBoundingClientRect()
    // Match canvas to displayed size for crisp rendering
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Fit the image INSIDE the frame rect first (no stretch), then apply user transform
    const frameW = crop.w * rect.width
    const frameH = crop.h * rect.height
    const frameX = crop.x * rect.width
    const frameY = crop.y * rect.height
    const baseScale = Math.min(frameW / imgNatural.width, frameH / imgNatural.height)
    const drawW = imgNatural.width * baseScale * imgTransform.scale
    const drawH = imgNatural.height * baseScale * imgTransform.scale
    const baseOffsetX = frameX + (frameW - imgNatural.width * baseScale) / 2
    const baseOffsetY = frameY + (frameH - imgNatural.height * baseScale) / 2
    const offsetX = baseOffsetX + imgTransform.tx
    const offsetY = baseOffsetY + imgTransform.ty

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Draw the full image; outside-crop shading layers visually create the frame
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
  }, [imgNatural.width, imgNatural.height, crop, imgTransform])

  // Redraw on size changes
  React.useEffect(() => {
    drawToCanvas()
  }, [drawToCanvas])

  React.useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => drawToCanvas())
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [drawToCanvas])

  const onPointerDown = (e: React.PointerEvent, type: NonNullable<typeof dragRef.current>['type']) => {
    const b = getBounds()
    const startX = e.clientX - b.left
    const startY = e.clientY - b.top
    let anchor: { ax: number; ay: number } | undefined
    let initialLen: number | undefined
    if (type && type !== 'move') {
      const cx = crop.x * b.width
      const cy = crop.y * b.height
      const cw = crop.w * b.width
      const ch = crop.h * b.height

      if (type.startsWith('img-')) {
        // Image vertex scaling anchors are the opposite image corner
        const rect = getCurrentImageRect(b)
        if (rect) {
          if (type === 'img-nw') anchor = { ax: rect.x + rect.w, ay: rect.y + rect.h }
          if (type === 'img-ne') anchor = { ax: rect.x, ay: rect.y + rect.h }
          if (type === 'img-se') anchor = { ax: rect.x, ay: rect.y }
          if (type === 'img-sw') anchor = { ax: rect.x + rect.w, ay: rect.y }
          if (anchor) initialLen = Math.hypot(startX - anchor.ax, startY - anchor.ay)
        }
      } else {
        if (type === 'ne') anchor = { ax: cx + cw, ay: cy }
        if (type === 'nw') anchor = { ax: cx, ay: cy }
        if (type === 'se') anchor = { ax: cx + cw, ay: cy + ch }
        if (type === 'sw') anchor = { ax: cx, ay: cy + ch }
        if (type === 'n') anchor = { ax: cx + cw / 2, ay: cy }
        if (type === 's') anchor = { ax: cx + cw / 2, ay: cy + ch }
        if (type === 'e') anchor = { ax: cx + cw, ay: cy + ch / 2 }
        if (type === 'w') anchor = { ax: cx, ay: cy + ch / 2 }
      }
    }
    dragRef.current = { type, startX, startY, startCrop: { ...crop }, startTransform: { ...imgTransform }, anchor, initialLen }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const b = getBounds()
    const x = e.clientX - b.left
    const y = e.clientY - b.top
    const dx = (x - dragRef.current.startX) / b.width
    const dy = (y - dragRef.current.startY) / b.height
    const start = dragRef.current.startCrop
    let { x: cx, y: cy, w: cw, h: ch } = start

    const keepAspect = !!targetRatio
    const containerRatio = b.width / b.height

    switch (dragRef.current.type) {
      case 'move':
        // Pan image inside fixed frame (translate by pixel delta)
        setImgTransform({ ...dragRef.current.startTransform, tx: dragRef.current.startTransform.tx + (x - dragRef.current.startX), ty: dragRef.current.startTransform.ty + (y - dragRef.current.startY) })
        break
      case 'n':
        if (dragRef.current.anchor) applyScaleAboutAnchor(1 + (dragRef.current.startY - y) / b.height, dragRef.current.anchor, b)
        break
      case 's':
        if (dragRef.current.anchor) applyScaleAboutAnchor(1 + (y - dragRef.current.startY) / b.height, dragRef.current.anchor, b)
        break
      case 'w':
        if (dragRef.current.anchor) applyScaleAboutAnchor(1 + (dragRef.current.startX - x) / b.width, dragRef.current.anchor, b)
        break
      case 'e':
        if (dragRef.current.anchor) applyScaleAboutAnchor(1 + (x - dragRef.current.startX) / b.width, dragRef.current.anchor, b)
        break
      case 'ne':
        if (dragRef.current.anchor) applyScaleAboutAnchor(1 + ((x - dragRef.current.startX) + (dragRef.current.startY - y)) / Math.max(b.width, b.height), dragRef.current.anchor, b)
        break
      case 'nw':
        if (dragRef.current.anchor) applyScaleAboutAnchor(1 + ((dragRef.current.startX - x) + (dragRef.current.startY - y)) / Math.max(b.width, b.height), dragRef.current.anchor, b)
        break
      case 'se':
        if (dragRef.current.anchor) applyScaleAboutAnchor(1 + ((x - dragRef.current.startX) + (y - dragRef.current.startY)) / Math.max(b.width, b.height), dragRef.current.anchor, b)
        break
      case 'sw':
        if (dragRef.current.anchor) applyScaleAboutAnchor(1 + ((dragRef.current.startX - x) + (y - dragRef.current.startY)) / Math.max(b.width, b.height), dragRef.current.anchor, b)
        break
      case 'img-nw':
      case 'img-ne':
      case 'img-se':
      case 'img-sw':
        if (dragRef.current.anchor && dragRef.current.initialLen && dragRef.current.initialLen > 0) {
          const newLen = Math.hypot(x - dragRef.current.anchor.ax, y - dragRef.current.anchor.ay)
          const factor = newLen / dragRef.current.initialLen
          applyScaleAboutAnchor(factor, dragRef.current.anchor, b)
        }
        break
    }
    // Keep frame fixed, do not mutate crop during interactions.
  }

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  const cropStyle = React.useMemo(() => ({
    left: `${crop.x * 100}%`,
    top: `${crop.y * 100}%`,
    width: `${crop.w * 100}%`,
    height: `${crop.h * 100}%`
  }), [crop])

  // Compute current on-screen image rect after base fit-to-frame and user transform
  const getCurrentImageRect = (b?: { left: number; top: number; width: number; height: number }) => {
    const bounds = b || getBounds()
    if (!bounds.width || !bounds.height || !imgNatural.width || !imgNatural.height) return null as any
    const rect = bounds
    const frameW = crop.w * rect.width
    const frameH = crop.h * rect.height
    const frameX = crop.x * rect.width
    const frameY = crop.y * rect.height
    const baseScale = Math.min(frameW / imgNatural.width, frameH / imgNatural.height)
    const baseOffsetX = frameX + (frameW - imgNatural.width * baseScale) / 2
    const baseOffsetY = frameY + (frameH - imgNatural.height * baseScale) / 2
    const drawW = imgNatural.width * baseScale * imgTransform.scale
    const drawH = imgNatural.height * baseScale * imgTransform.scale
    const x = baseOffsetX + imgTransform.tx
    const y = baseOffsetY + imgTransform.ty
    return { x, y, w: drawW, h: drawH }
  }

  // Wheel zoom: scale image around mouse position
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const b = getBounds()
    const mx = e.clientX - b.left
    const my = e.clientY - b.top
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const factor = 1 + delta
    applyScaleAboutAnchor(factor, { ax: mx, ay: my }, b)
  }

  // Scale about a specific anchor point (container coordinates)
  const applyScaleAboutAnchor = (rawFactor: number, anchor: { ax: number; ay: number }, b: { left: number; top: number; width: number; height: number }) => {
    const factor = clamp(rawFactor, 0.2, 10)
    setImgTransform((t) => {
      const newScale = clamp(t.scale * factor, 0.2, 10)
      const k = newScale / t.scale
      // Compute absolute offsets including base centering at current container size
      const baseScale = Math.min(b.width / Math.max(1, imgNatural.width), b.height / Math.max(1, imgNatural.height))
      const baseOffsetX = (b.width - Math.max(1, imgNatural.width) * baseScale) / 2
      const baseOffsetY = (b.height - Math.max(1, imgNatural.height) * baseScale) / 2
      const ox = baseOffsetX + t.tx
      const oy = baseOffsetY + t.ty
      const oxPrime = k * ox + (1 - k) * anchor.ax
      const oyPrime = k * oy + (1 - k) * anchor.ay
      return { tx: oxPrime - baseOffsetX, ty: oyPrime - baseOffsetY, scale: newScale }
    })
  }

  return (
    <div className={`w-full h-full relative min-h-[24rem] md:min-h-[28rem] lg:min-h-[36rem] 2xl:min-h-[40rem] ${className || ''}`} ref={containerRef}
      onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-label="Resize preview canvas" />

      {/* Shaded regions outside crop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 top-0 h-full" style={{ width: `${crop.x * 100}%` }} />
        <div className="absolute top-0 right-0 h-full" style={{ width: `${(1 - crop.x - crop.w) * 100}%` }} />
        <div className="absolute left-0 top-0 w-full" style={{ height: `${crop.y * 100}%` }} />
        <div className="absolute left-0 bottom-0 w-full" style={{ height: `${(1 - crop.y - crop.h) * 100}%` }} />
      </div>

      {/* Image corner handles positioned at the current image rectangle */}
      {(() => {
        const r = getCurrentImageRect()
        if (!r) return null as any
        const size = 10
        const half = size / 2
        return (
          <>
            <div onPointerDown={(e)=>onPointerDown(e,'img-nw')} className="absolute bg-white rounded-sm border border-black/40 cursor-nw-resize" style={{ left: r.x - half, top: r.y - half, width: size, height: size }} />
            <div onPointerDown={(e)=>onPointerDown(e,'img-ne')} className="absolute bg-white rounded-sm border border-black/40 cursor-ne-resize" style={{ left: r.x + r.w - half, top: r.y - half, width: size, height: size }} />
            <div onPointerDown={(e)=>onPointerDown(e,'img-se')} className="absolute bg-white rounded-sm border border-black/40 cursor-se-resize" style={{ left: r.x + r.w - half, top: r.y + r.h - half, width: size, height: size }} />
            <div onPointerDown={(e)=>onPointerDown(e,'img-sw')} className="absolute bg-white rounded-sm border border-black/40 cursor-sw-resize" style={{ left: r.x - half, top: r.y + r.h - half, width: size, height: size }} />
          </>
        )
      })()}

      {/* Visual shading using green tint like reference */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 top-0 h-full bg-emerald-900/80" style={{ width: `${crop.x * 100}%` }} />
        <div className="absolute top-0 right-0 h-full bg-emerald-900/80" style={{ width: `${(1 - crop.x - crop.w) * 100}%` }} />
        <div className="absolute left-0 top-0 w-full bg-emerald-900/80" style={{ height: `${crop.y * 100}%` }} />
        <div className="absolute left-0 bottom-0 w-full bg-emerald-900/80" style={{ height: `${(1 - crop.y - crop.h) * 100}%` }} />
      </div>

      {/* Crop box */}
      <div
        className="absolute border-2 border-emerald-700/90 rounded-sm"
        style={cropStyle}
        onPointerDown={(e) => onPointerDown(e, 'move')}
      >
        {/* Handles */}
        {([
          { k: 'n', c: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize' },
          { k: 's', c: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize' },
          { k: 'e', c: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-e-resize' },
          { k: 'w', c: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-w-resize' },
          { k: 'ne', c: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize' },
          { k: 'nw', c: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize' },
          { k: 'se', c: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-se-resize' },
          { k: 'sw', c: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize' },
        ] as const).map(h => (
          <div
            key={h.k}
            onPointerDown={(e) => onPointerDown(e, h.k)}
            className={`absolute bg-emerald-500 rounded-sm shadow-sm ${h.c}`}
            style={{ width: 12, height: 6 }}
          />
        ))}
      </div>

      {/* Optional bottom toolbar (disabled by default; we place controls in left panel) */}
      {showToolbar && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-2 text-white">
          <span className="hidden md:inline text-xs px-2 py-1 rounded bg-white/10">{aspectLabel}</span>
          {(presetSizes && presetSizes.length ? presetSizes : ['1280 × 1280','1024 × 1024','768 × 1024']).map((s) => (
            <button key={s} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20">{s}</button>
          ))}
          <button className="ml-1 bg-white text-black rounded-full p-1" aria-label="Apply">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}


