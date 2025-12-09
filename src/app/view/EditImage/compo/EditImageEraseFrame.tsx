'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface EditImageEraseFrameProps {
    sourceImageUrl: string | null;
    erasedImageUrl?: string | null; // For comparison
    isErasedImage?: boolean;
    onMaskChange?: (maskDataUrl: string | null) => void;
    brushSize: number;
    isDrawing: boolean;
    setIsDrawing: (isDrawing: boolean) => void;
    onPreview?: () => void; // Toggle comparison
    isAdjustingBrush?: boolean;
}

export const EditImageEraseFrame: React.FC<EditImageEraseFrameProps> = ({
    sourceImageUrl,
    erasedImageUrl,
    onMaskChange,
    brushSize,
    isDrawing,
    setIsDrawing,
    onPreview,
    isAdjustingBrush = false,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const [brushPreview, setBrushPreview] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Helper to hide cursor if not active
    const checkHide = useCallback(() => {
        if (!isHovering && !isDrawing && !isAdjustingBrush) {
            setBrushPreview(prev => ({ ...prev, visible: false }));
        }
    }, [isHovering, isDrawing, isAdjustingBrush]);

    // Brush Cursor Effect for Adjusting & Size Change
    useEffect(() => {
        // Show cursor when adjusting or size changes
        setBrushPreview(prev => ({
            ...prev,
            visible: true,
            x: prev.x || (containerRef.current ? containerRef.current.clientWidth / 2 : 0),
            y: prev.y || (containerRef.current ? containerRef.current.clientHeight / 2 : 0)
        }));

        // Reset hide timeout
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

        // If not explicitly adjusting (e.g. button click), hide after delay if not hovering
        if (!isAdjustingBrush) {
            hideTimeoutRef.current = setTimeout(checkHide, 1000);
        }

        return () => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, [isAdjustingBrush, brushSize, checkHide]);

    // Check hide when state changes
    useEffect(() => {
        if (!isDrawing && !isAdjustingBrush) {
            // giving a small grace period or immediate check based on hover
            if (!isHovering) {
                // Determine if we should wait (e.g. just finished drawing) or hide immediately
                // For simplicity, check immediately if no size change involved
                checkHide();
            }
        }
    }, [isDrawing, isAdjustingBrush, isHovering, checkHide]);

    // Initialize canvas size when image loads
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });

        // Initialize masking canvas
        if (maskCanvasRef.current) {
            maskCanvasRef.current.width = img.naturalWidth;
            maskCanvasRef.current.height = img.naturalHeight;
            const ctx = maskCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'black'; // Start with black mask (no erase)
                ctx.fillRect(0, 0, img.naturalWidth, img.naturalHeight);
            }
        }

        // Initialize visual canvas (overlay)
        if (canvasRef.current && containerRef.current) {
            canvasRef.current.width = containerRef.current.clientWidth;
            canvasRef.current.height = containerRef.current.clientHeight;
        }
    };

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && containerRef.current) {
                canvasRef.current.width = containerRef.current.clientWidth;
                canvasRef.current.height = containerRef.current.clientHeight;
                // Note: resizing clears the visual canvas, might need to redraw if preserving history (simplified for now)
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate the rendered image rectangle within the container (object-contain)
    const getRenderedImgRect = useCallback(() => {
        if (!containerRef.current || !imageSize) return null;
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        const naturalW = imageSize.width;
        const naturalH = imageSize.height;

        const containerAspect = containerW / containerH;
        const imgAspect = naturalW / naturalH;
        let renderW, renderH, offsetX, offsetY;

        if (containerAspect > imgAspect) {
            // Container is wider -> Fit height
            renderH = containerH;
            renderW = renderH * imgAspect;
            offsetX = (containerW - renderW) / 2;
            offsetY = 0;
        } else {
            // Container is taller -> Fit width
            renderW = containerW;
            renderH = renderW / imgAspect;
            offsetX = 0;
            offsetY = (containerH - renderH) / 2;
        }
        return { x: offsetX, y: offsetY, width: renderW, height: renderH };
    }, [imageSize]);


    const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        // Use container rect because the visual canvas fills the container
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const draw = (x: number, y: number, isDown: boolean) => {
        if (!canvasRef.current || !maskCanvasRef.current || !imageSize) return;

        const ctx = canvasRef.current.getContext('2d');
        const maskCtx = maskCanvasRef.current.getContext('2d');
        if (!ctx || !maskCtx) return;

        // Visual Feedback (Overlay) - Draw on container coordinate space
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Semi-transparent white
        ctx.globalCompositeOperation = 'source-over';

        if (isDown && lastPointRef.current) {
            ctx.beginPath();
            ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Mask Logic (Hidden Canvas) - Map to Image Space
        const renderRect = getRenderedImgRect();
        if (renderRect) {
            const scaleX = imageSize.width / renderRect.width;
            const scaleY = imageSize.height / renderRect.height;

            // Map container coordinates to image coordinates
            // mx = (inputX - offsetX) * scaleX
            const mapX = (val: number) => (val - renderRect.x) * scaleX;
            const mapY = (val: number) => (val - renderRect.y) * scaleY;

            // Adjust brush size for scale (avg scaling)
            const avgScale = (scaleX + scaleY) / 2;

            maskCtx.lineCap = 'round';
            maskCtx.lineJoin = 'round';
            maskCtx.lineWidth = brushSize * avgScale;
            maskCtx.strokeStyle = 'white'; // White areas will be erased
            maskCtx.globalCompositeOperation = 'source-over';

            if (isDown && lastPointRef.current) {
                maskCtx.beginPath();
                maskCtx.moveTo(mapX(lastPointRef.current.x), mapY(lastPointRef.current.y));
                maskCtx.lineTo(mapX(x), mapY(y));
                maskCtx.stroke();
            }
        }

        lastPointRef.current = { x, y };

        // Notify parent of mask update
        if (onMaskChange) {
            onMaskChange(maskCanvasRef.current.toDataURL());
        }
    };


    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        const { x, y } = getPoint(e);
        lastPointRef.current = { x, y };
        draw(x, y, false); // Initialize point
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getPoint(e);
        setBrushPreview({ x, y, visible: true });

        if (isDrawing) {
            draw(x, y, true);
        }
    };

    const handleEnd = () => {
        setIsDrawing(false);
        lastPointRef.current = null;
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center bg-black/50 select-none"
            style={{ touchAction: 'none' }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
                setIsHovering(false);
                setBrushPreview(prev => ({ ...prev, visible: false }));
            }}
        >
            {/* Source Image */}
            {sourceImageUrl && (
                <img
                    ref={imageRef}
                    src={sourceImageUrl}
                    alt="Source"
                    className="max-w-full max-h-full object-contain pointer-events-none select-none"
                    onLoad={handleImageLoad}
                />
            )}

            {/* Drawing Overlay Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 cursor-none touch-none"
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
            />

            {/* Hidden Mask Canvas (Natural Size) */}
            <canvas
                ref={maskCanvasRef}
                style={{ display: 'none' }}
            />

            {/* Brush Preview Cursor */}
            {brushPreview.visible && (
                <div
                    className="pointer-events-none absolute rounded-full border border-white/80 bg-white/20 z-50"
                    style={{
                        left: brushPreview.x,
                        top: brushPreview.y,
                        width: brushSize,
                        height: brushSize,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            )}

            {/* Comparison Button (if erasedImageUrl exists) */}
            {erasedImageUrl && onPreview && (
                <div className="absolute bottom-4 right-4 z-20">
                    <button
                        onClick={onPreview}
                        className="w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/80 hover:scale-105 transition-all backdrop-blur-sm"
                    >
                        <ArrowLeftRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};
