import React, { useState, useEffect, useRef } from 'react';
import { Crop, Eraser, Scaling, Sun, Scan, Layers, Type, Aperture, GripHorizontal } from 'lucide-react';

interface FeaturePosition {
    x: number;
    y: number;
}

interface FeaturePositions {
    [key: string]: FeaturePosition;
}

interface DragState {
    isDragging: boolean;
    nodeId: string | null;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
}

export function InteractiveFeatureNodeGraph() {
    const [activeFeature, setActiveFeature] = useState('Original');

    // DRAG STATE
    const [nodePositions, setNodePositions] = useState<FeaturePositions>({
        crop: { x: -350, y: -120 },
        inpaint: { x: -350, y: -40 },
        outpaint: { x: -350, y: 40 },
        upscale: { x: -350, y: 120 },
        relight: { x: 350, y: -120 },
        channels: { x: 350, y: -40 },
        describer: { x: 350, y: 40 },
        zdepth: { x: 350, y: 120 },
    });

    const [dragState, setDragState] = useState<DragState>({ isDragging: false, nodeId: null, startX: 0, startY: 0, originalX: 0, originalY: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Features Data (Metadata)
    const features = [
        // LEFT SIDE NODES
        { id: 'crop', label: 'Crop', side: 'left', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop&crop=bottom,right' },
        { id: 'inpaint', label: 'Inpaint', side: 'left', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop&blur=5' },
        { id: 'outpaint', label: 'Outpaint', side: 'left', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop&pad=50' },
        { id: 'upscale', label: 'Upscale', side: 'left', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1600&auto=format&fit=crop' },

        // RIGHT SIDE NODES
        { id: 'relight', label: 'Relight', side: 'right', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop&brightness=150' },
        { id: 'channels', label: 'Channels', side: 'right', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop&duotone=60a5fa,000000' },
        { id: 'describer', label: 'Image Describer', side: 'right', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop' },
        { id: 'zdepth', label: 'Z Depth Extractor', side: 'right', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop&grayscale' },
    ];

    // Canvas Dimensions
    const CANVAS_WIDTH = 1000;
    const CANVAS_HEIGHT = 500;
    const CENTER_X = CANVAS_WIDTH / 2;
    const CENTER_Y = CANVAS_HEIGHT / 2;
    const BOX_WIDTH = 280;
    const BOX_HEIGHT = 280;
    const BOX_HALF_W = BOX_WIDTH / 2;

    // --- DRAG HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation(); // Prevent text selection
        setDragState({
            isDragging: true,
            nodeId: nodeId,
            startX: e.clientX,
            startY: e.clientY,
            originalX: nodePositions[nodeId].x,
            originalY: nodePositions[nodeId].y,
        });
        setActiveFeature(nodeId); // Auto-activate on grab
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragState.isDragging || dragState.nodeId === null) return;

            let dx = e.clientX - dragState.startX;
            let dy = e.clientY - dragState.startY;

            let newX = dragState.originalX + dx;
            let newY = dragState.originalY + dy;

            // --- MAGNETIC SNAPPING ---
            const SNAP_THRESHOLD = 50; // Increased threshold for better UX
            const isLeft = features.find(f => f.id === dragState.nodeId)?.side === 'left';

            // Calculate target snap point (The "inner" connection point on the box edge)
            // Logic mirrors getPath's endX calculation
            const targetX = isLeft ? (CENTER_X - BOX_HALF_W) - CENTER_X : (CENTER_X + BOX_HALF_W) - CENTER_X; // Relative to CENTER_X
            // For Y, we want to snap to the center-ish or the "ideal" connection height
            // Let's snap to the generic 0 (vertical center) or allow sliding along edge?
            // User said "connect to that", implying a specific point. Let's snap to the box edge at the same Y level first, then clamp.

            // Let's define the ideal snap point as the specific anchor for that node if it were docked? 
            // Or just snap to the box edge?
            // "Automaticlly connect to that like magner" -> Snap to the box edge.

            const distToBoxEdge = Math.abs(newX - targetX);

            if (distToBoxEdge < SNAP_THRESHOLD) {
                // Snap X to the box edge (with slight padding for visual separation if needed, but "connect" implies touch)
                // getPath uses endX which is exactly on the box edge.
                // We'll snap to a point slightly off the edge so the node doesn't overlap the image content?
                // The node width is involved. The node position is its center.
                // If snap to `targetX`, the node center is at the box edge. This might overlap.
                // Let's assume we snap such that the node *connector* touches.
                // But `getPath` starts at `pos.x`.
                // Let's snap the X coordinate to `targetX` +/- some offset to sit nicely next to it.
                // Let's try snapping exactly to `targetX + (isLeft ? -80 : 80)` to sit outside.

                // Simpler approach: If close to the "default" docked x-pos for that side?
                // No, user wants it to connect when moved NEAR the receiver.

                // Let's snap X to be "attached" to the box.
                // Box edge is at +/- (BOX_HALF_W). Node center is newX.
                // We want to snap newX.

                const snapX = isLeft ? (-BOX_HALF_W - 80) : (BOX_HALF_W + 80);

                // Check distance to this snap point
                if (Math.abs(newX - snapX) < SNAP_THRESHOLD) {
                    newX = snapX;
                    // Optional: Snap Y to center if close to center?
                    if (Math.abs(newY) < 30) newY = 0;
                }
            }

            setNodePositions(prev => ({
                ...prev,
                [dragState.nodeId!]: {
                    x: newX,
                    y: newY
                }
            }));
        };

        const handleMouseUp = () => {
            if (dragState.isDragging) {
                setDragState(prev => ({ ...prev, isDragging: false, nodeId: null }));
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState]);


    // Helper to generate bezier path from current node position to center box
    const getPath = (featureId: string, side: string) => {
        const pos = nodePositions[featureId];
        const isLeft = side === 'left';

        // Start Point (Node Inner Edge approx)
        // Adjust start point based on side to connect to the "inner" side of the button
        const startX = CENTER_X + pos.x + (isLeft ? 60 : -60);
        const startY = CENTER_Y + pos.y;

        // End Point (Box Edge)
        const endX = isLeft ? (CENTER_X - BOX_HALF_W) : (CENTER_X + BOX_HALF_W);
        // Dynamic Anchor on Box: Map Y position of node to a point on the box edge to look cleaner
        // Clamp the Y connection to be within the box height
        let boxConnectY = CENTER_Y + (pos.y * 0.3);
        if (boxConnectY > CENTER_Y + 100) boxConnectY = CENTER_Y + 100;
        if (boxConnectY < CENTER_Y - 100) boxConnectY = CENTER_Y - 100;

        const endY = boxConnectY;

        // Control Points for S-Curve
        const cp1X = startX + (isLeft ? 50 : -50);
        const cp1Y = startY;
        const cp2X = endX + (isLeft ? -50 : 50);
        const cp2Y = endY;

        return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
    };

    // Vibrant Image (Cyberpunk/Neon style)
    const activeImage = features.find(f => f.id === activeFeature)?.image || 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=800&auto=format&fit=crop'; // Default vibrant

    return (
        <div className="w-full py-12 flex flex-col items-center bg-[#020205] relative overflow-hidden rounded-2xl select-none">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="text-center  relative z-10">
                <h2 className="text-5xl font-medium tracking-tight text-white mb-4">With all the professional <br /> tools you rely on.</h2>
                <p className="text-slate-400">In one seamless workflow.</p>
            </div>

            <div ref={containerRef} className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>

                {/* SVG Connections Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                    <defs>
                        <linearGradient id="lineGradBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.1" />
                            <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                    {features.map(feature => (
                        <g key={feature.id}>
                            {/* Background Passive Line */}
                            <path
                                d={getPath(feature.id, feature.side)}
                                fill="none"
                                stroke="#333"
                                strokeWidth="1"
                                className="transition-all duration-75" // Faster update for drag
                            />
                            {/* Active Animated Line */}
                            <path
                                d={getPath(feature.id, feature.side)}
                                fill="none"
                                stroke="url(#lineGradBlue)"
                                strokeWidth="2"
                                strokeDasharray="10 5"
                                className={`transition-opacity duration-300 ${activeFeature === feature.id ? 'opacity-100 animate-[dash_1s_linear_infinite]' : 'opacity-0'}`}
                            />
                        </g>
                    ))}
                </svg>

                {/* Central Image Canvas */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0A0A0A] rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.2)] z-10 transition-all duration-500"
                    style={{ width: BOX_WIDTH, height: BOX_HEIGHT }}
                >
                    <div className="w-full h-full relative group">
                        <img
                            src={activeImage}
                            alt="Feature Preview"
                            className={`w-full h-full object-cover transition-all duration-500 ${activeFeature === 'Original' ? 'scale-100 filter brightness-90' : 'scale-110 filter brightness-110'}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="text-xs font-mono text-[#60a5fa] bg-black/60 px-3 py-1.5 rounded-full border border-[#60a5fa]/30 backdrop-blur-md shadow-lg">
                                {activeFeature === 'Original' ? 'Original Source' : `Applied: ${features.find(f => f.id === activeFeature)?.label}`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Draggable Feature Nodes */}
                {features.map(feature => {
                    const pos = nodePositions[feature.id];

                    return (
                        <button
                            key={feature.id}
                            onMouseDown={(e) => handleMouseDown(e, feature.id)}
                            onMouseEnter={() => !dragState.isDragging && setActiveFeature(feature.id)}
                            // onMouseLeave handled by container or just stays active until next hover
                            className={`
                    absolute top-0 left-0 px-5 py-3 rounded-xl border text-sm font-medium transition-all duration-100 z-20 flex items-center gap-2 cursor-grab active:cursor-grabbing
                    ${activeFeature === feature.id
                                    ? 'bg-[#2563eb]/20 border-[#60a5fa] text-white shadow-[0_0_30px_rgba(96,165,250,0.4)] backdrop-blur-md'
                                    : 'bg-[#111]/80 border-white/10 text-slate-400 hover:border-white/30 hover:text-white backdrop-blur-sm'}
                  `}
                            style={{
                                transform: `translate(${CENTER_X + pos.x}px, ${CENTER_Y + pos.y}px) translate(-50%, -50%)`,
                                zIndex: dragState.nodeId === feature.id ? 50 : 20
                            }}
                        >
                            <div className={`${activeFeature === feature.id ? 'text-[#60a5fa]' : 'text-slate-500'}`}>
                                <GripHorizontal size={14} className="opacity-50 mr-1" />
                            </div>

                            {/* Icon logic just for flair */}
                            {feature.id === 'crop' && <Crop size={14} />}
                            {feature.id === 'inpaint' && <Eraser size={14} />}
                            {feature.id === 'upscale' && <Scaling size={14} />}
                            {feature.id === 'relight' && <Sun size={14} />}
                            {feature.id === 'outpaint' && <Scan size={14} />}
                            {feature.id === 'channels' && <Layers size={14} />}
                            {feature.id === 'describer' && <Type size={14} />}
                            {feature.id === 'zdepth' && <Aperture size={14} />}

                            {feature.label}
                        </button>
                    )
                })}

            </div>
        </div>
    );
}
