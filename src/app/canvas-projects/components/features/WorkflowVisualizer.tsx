import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Image as ImageIcon, Film, Mic, GripHorizontal, Play } from 'lucide-react';

interface NodePosition {
    x: number;
    y: number;
}

interface NodePositions {
    [key: number]: NodePosition;
}

interface DragState {
    isDragging: boolean;
    nodeId: number | null;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
}

export function WorkflowVisualizer() {
    const [activeNode, setActiveNode] = useState(1);

    // DRAG STATE for Workflow
    const [nodePositions, setNodePositions] = useState<NodePositions>({
        1: { x: 50, y: 100 },
        2: { x: 400, y: 50 },
        3: { x: 750, y: 100 },
        4: { x: 400, y: 300 } // Disconnected Voice Node
    });

    const [dragState, setDragState] = useState<DragState>({ isDragging: false, nodeId: null, startX: 0, startY: 0, originalX: 0, originalY: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Nodes Metadata
    const nodesData = [
        { id: 1, type: 'Input', title: 'Text Prompt', content: '"Neon city..."', icon: <MessageSquare size={16} />, image: '' },
        { id: 2, type: 'Gen', title: 'Flux Pro', content: 'Image', icon: <ImageIcon size={16} />, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop' },
        { id: 3, type: 'Motion', title: 'Runway Gen-3', content: 'Video', icon: <Film size={16} />, image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop' },
        { id: 4, type: 'Voice', title: 'ElevenLabs', content: 'sample script', icon: <Mic size={16} />, image: '' }
    ];

    // Constants
    const NODE_WIDTH = 192;
    const NODE_HEIGHT = 192;
    const HALF_HEIGHT = NODE_HEIGHT / 2;

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent, nodeId: number) => {
        e.stopPropagation();
        setDragState({
            isDragging: true,
            nodeId: nodeId,
            startX: e.clientX,
            startY: e.clientY,
            originalX: nodePositions[nodeId].x,
            originalY: nodePositions[nodeId].y,
        });
        setActiveNode(nodeId);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragState.isDragging || dragState.nodeId === null || !containerRef.current) return;

            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;

            let newX = dragState.originalX + dx;
            let newY = dragState.originalY + dy;

            // Constrain to container bounds
            const containerWidth = containerRef.current.offsetWidth;
            const containerHeight = containerRef.current.offsetHeight;

            // Clamp X
            if (newX < 0) newX = 0;
            if (newX > containerWidth - NODE_WIDTH) newX = containerWidth - NODE_WIDTH;

            // Clamp Y
            if (newY < 0) newY = 0;
            if (newY > containerHeight - NODE_HEIGHT) newY = containerHeight - NODE_HEIGHT;

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

    // Helper to generate S-Curve path
    const getPath = (startId: number, endId: number) => {
        const startPos = nodePositions[startId];
        const endPos = nodePositions[endId];

        const startX = startPos.x + NODE_WIDTH; // Right edge
        const startY = startPos.y + HALF_HEIGHT; // Center Y
        const endX = endPos.x; // Left edge
        const endY = endPos.y + HALF_HEIGHT; // Center Y

        // Control points for bezier curve
        const cp1X = startX + (endX - startX) / 2;
        const cp1Y = startY;
        const cp2X = startX + (endX - startX) / 2;
        const cp2Y = endY;

        return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
    };

    return (
        <div className="w-full py-32 flex flex-col items-center relative overflow-hidden select-none">
            {/* Section Header */}
            <div className="text-center mb-16 relative z-10">
                <h2 className="text-5xl font-medium tracking-tight text-white mb-6">Visual Workflows. <br /> <span className="text-slate-500">Connect the dots, literally.</span></h2>
                <p className="text-slate-400">Node-based pipelines for total creative control.</p>
            </div>

            {/* Node Graph Container */}
            <div ref={containerRef} className="relative w-full max-w-5xl h-[550px] bg-[#050505] rounded-3xl border-4 border-white/10 shadow-2xl overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                {/* SVG Layer for Curvy Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                    {/* Defs for gradients */}
                    <defs>
                        <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                            <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>

                    {/* Connection 1: Text -> Image */}
                    <path d={getPath(1, 2)} fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="8 8" />
                    <path d={getPath(1, 2)} fill="none" stroke="url(#activeGradient)" strokeWidth="3" strokeDasharray="200" strokeDashoffset="200" className="animate-[dash_3s_linear_infinite]" />

                    {/* Connection 2: Image -> Video */}
                    <path d={getPath(2, 3)} fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="8 8" />
                    <path d={getPath(2, 3)} fill="none" stroke="url(#activeGradient)" strokeWidth="3" strokeDasharray="200" strokeDashoffset="200" className="animate-[dash_3s_linear_infinite_1.5s]" />
                </svg>

                {/* Nodes Layer */}
                {nodesData.map((node, i) => {
                    const pos = nodePositions[node.id];
                    return (
                        <div
                            key={node.id}
                            className="absolute z-10 transition-shadow duration-300 hover:scale-105 cursor-grab active:cursor-grabbing"
                            style={{ left: pos.x, top: pos.y }}
                            onMouseDown={(e) => handleMouseDown(e, node.id)}
                            onMouseEnter={() => !dragState.isDragging && setActiveNode(node.id)}
                        >
                            {/* Node Card */}
                            <div className={`
                  w-48 h-48 bg-[#0A0A0A] rounded-xl border p-4 shadow-xl flex flex-col gap-3 relative justify-between
                  ${activeNode === node.id ? 'border-[#60a5fa] shadow-[0_0_20px_rgba(96,165,250,0.2)]' : 'border-[#333]'}
               `}>
                                {/* Input Handle (Left) */}
                                {(i > 0 && node.type !== 'Voice') && (
                                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#0A0A0A] border-2 border-[#60a5fa] shadow-[0_0_8px_#60a5fa] z-20">
                                        <div className="w-full h-full rounded-full bg-[#60a5fa] opacity-50 animate-pulse"></div>
                                    </div>
                                )}

                                {/* Output Handle (Right) */}
                                {(i < nodesData.length - 1 && node.type !== 'Voice') && (
                                    <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#60a5fa] shadow-[0_0_10px_#60a5fa] z-20"></div>
                                )}

                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                                        {node.icon} {node.type}
                                    </span>
                                    <GripHorizontal size={14} className="text-slate-600" />
                                </div>

                                {/* Node Content Preview */}
                                {node.type === 'Input' || node.type === 'Voice' ? (
                                    <div className="bg-[#111] p-3 rounded text-xs text-slate-300 font-mono border border-white/5 flex-1 flex items-center justify-center text-center">
                                        {node.content}
                                    </div>
                                ) : (
                                    <div className="w-full flex-1 bg-[#111] rounded overflow-hidden relative border border-white/5 group">
                                        <img src={node.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                                        {node.id === 3 && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><Play size={32} className="text-white fill-white/50 backdrop-blur-sm rounded-full p-1" /></div>}
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-xs font-bold text-white">{node.title}</span>
                                    <span className="w-2 h-2 rounded-full bg-[#60a5fa] shadow-[0_0_5px_#60a5fa]"></span>
                                </div>
                            </div>
                        </div>
                    )
                })}

            </div>

            {/* CSS Animation for Flow Lines */}
            <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
        </div>
    );
}
