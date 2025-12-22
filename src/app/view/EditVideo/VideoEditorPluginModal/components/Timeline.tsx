
import React, { useRef, useState, useEffect } from 'react';
import { Track, TimelineItem, TransitionType, ANIMATIONS } from '../types';
import {
    Play, Pause, ZoomIn, ZoomOut, Scissors,
    Trash2, Plus, Video, Music, Type, Settings,
    GripVertical, Sparkles, ChevronRight, Zap,
    MoreHorizontal, Copy, Clipboard, CopyPlus, Lock, Unlock,
    ImageMinus, MessageSquare, Image, Film
} from 'lucide-react';

interface TimelineProps {
    tracks: Track[];
    currentTime: number;
    totalDuration: number;
    isPlaying: boolean;
    selectedItemId: string | null;
    onPlayPause: () => void;
    onSeek: (time: number) => void;
    onUpdateClip: (trackId: string, item: TimelineItem) => void;
    onDeleteClip: (trackId: string, itemId: string) => void;
    onSplitClip: () => void;
    onAddTrackItem: (type: 'video' | 'image' | 'color') => void;
    onSelectTransition: (trackId: string, itemId: string) => void;
    onSelectClip: (trackId: string, itemId: string | null) => void;

    // New Actions
    onCopy: (item: TimelineItem) => void;
    onPaste: (trackId: string) => void;
    onDuplicate: (trackId: string, itemId: string) => void;
    onLock: (trackId: string, itemId: string) => void;
    onDetach: (trackId: string, itemId: string) => void;
    onMoveClip?: (itemId: string, sourceTrackId: string, targetTrackId: string, newStart: number) => void;
    onDropClip: (trackId: string, time: number, item: any) => void;
    onClipDragEnd?: (trackId: string) => void;
}

const MIN_ZOOM = 10;
const MAX_ZOOM = 200;

const Timeline: React.FC<TimelineProps> = ({
    tracks, currentTime, totalDuration, isPlaying, selectedItemId,
    onPlayPause, onSeek, onUpdateClip, onDeleteClip, onSplitClip,
    onAddTrackItem, onSelectTransition, onSelectClip,
    onCopy, onPaste, onDuplicate, onLock, onDetach, onMoveClip, onDropClip, onClipDragEnd
}) => {
    const [zoom, setZoom] = useState(40); // pixels per second
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);

    // Context Menu State
    const [activeClipMenu, setActiveClipMenu] = useState<{ trackId: string, itemId: string, x: number, y: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const rulerRef = useRef<HTMLDivElement>(null);

    // Interaction State
    const [dragState, setDragState] = useState<{
        type: 'move' | 'resize-left' | 'resize-right' | 'scrub';
        itemId?: string;
        trackId?: string;
        startX: number;
        originalStart?: number;
        originalDuration?: number;
        originalOffset?: number;
        minStart?: number;
        maxStart?: number;
    } | null>(null);

    // --- Close Menu on Outside Click ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveClipMenu(null);
            }
        };
        if (activeClipMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeClipMenu]);

    // --- Event Handlers ---

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom - e.deltaY * 0.1));
            setZoom(newZoom);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Ruler & Scrubbing ---

    const handleTimelineMouseMove = (clientX: number) => {
        if (scrollContainerRef.current && rulerRef.current) {
            const rect = scrollContainerRef.current.getBoundingClientRect();
            const offsetX = clientX - rect.left + scrollContainerRef.current.scrollLeft;
            const newTime = Math.max(0, offsetX / zoom);
            onSeek(newTime);
        }
    };

    const handleRulerMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDragState({ type: 'scrub', startX: e.clientX });
        handleTimelineMouseMove(e.clientX);
    };

    // --- Item Interactions ---

    const handleItemMouseDown = (e: React.MouseEvent, trackId: string, item: TimelineItem) => {
        e.stopPropagation(); // Prevent track container click (deselection)

        // Seek to clicked position
        handleTimelineMouseMove(e.clientX);

        onSelectClip(trackId, item.id);

        if (item.isLocked) return; // No dragging if locked

        // Removed neighbor constraints to allow reordering
        setDragState({
            type: 'move',
            itemId: item.id,
            trackId: trackId,
            startX: e.clientX,
            originalStart: item.start,
            minStart: 0, // Only constrain to start of timeline
            maxStart: undefined
        });
    };

    const handleResizeMouseDown = (e: React.MouseEvent, trackId: string, item: TimelineItem, direction: 'left' | 'right') => {
        e.stopPropagation(); // Prevent track container click (deselection)
        if (item.isLocked) return;

        setDragState({
            type: direction === 'left' ? 'resize-left' : 'resize-right',
            itemId: item.id,
            trackId: trackId,
            startX: e.clientX,
            originalStart: item.start,
            originalDuration: item.duration,
            originalOffset: item.offset
        });
    };

    const handleMenuClick = (e: React.MouseEvent, trackId: string, itemId: string) => {
        e.stopPropagation();
        // Calculate position
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setActiveClipMenu({
            trackId,
            itemId,
            x: rect.right + 5,
            y: rect.top
        });
        onSelectClip(trackId, itemId);
    };

    // --- Global Mouse Events for Dragging ---

    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => {
            if (!dragState) return;

            if (dragState.type === 'scrub') {
                handleTimelineMouseMove(e.clientX);
                return;
            }

            const deltaX = e.clientX - dragState.startX;
            const deltaTime = deltaX / zoom;

            const track = tracks.find(t => t.id === dragState.trackId);
            const item = track?.items.find(i => i.id === dragState.itemId);

            if (!track || !item || !dragState.trackId) return;

            let newItem = { ...item };

            if (dragState.type === 'move') {
                // Calculate raw new start
                let newStart = Math.max(0, (dragState.originalStart || 0) + deltaTime);

                // Clamp to bounds (Prevent Overlap)
                if (dragState.minStart !== undefined) newStart = Math.max(newStart, dragState.minStart);
                if (dragState.maxStart !== undefined) newStart = Math.min(newStart, dragState.maxStart);

                newItem.start = newStart;

                // Snap to adjacent items (simple magnetic snap) - Only if within bounds
                const snapThreshold = 10 / zoom; // 10px snap

                // We only snap if we are close to the bounds we just calculated, 
                // effectively snapping to the neighbor we are colliding with.
                if (Math.abs(newItem.start - (dragState.minStart || 0)) < snapThreshold) {
                    newItem.start = dragState.minStart || 0;
                }
                if (dragState.maxStart !== undefined && Math.abs(newItem.start - dragState.maxStart) < snapThreshold) {
                    newItem.start = dragState.maxStart;
                }

            } else if (dragState.type === 'resize-right') {
                newItem.duration = Math.max(0.5, (dragState.originalDuration || 0) + deltaTime);
            } else if (dragState.type === 'resize-left') {
                const maxShift = dragState.originalDuration! - 0.5;
                const shift = Math.min(maxShift, Math.max(-(dragState.originalStart!), deltaTime));
                newItem.start = dragState.originalStart! + shift;
                newItem.duration = dragState.originalDuration! - shift;
                newItem.offset = dragState.originalOffset! + shift;
            }

            onUpdateClip(dragState.trackId, newItem);
        };

        const handleWindowMouseUp = (e: MouseEvent) => {
            if (dragState && dragState.type === 'move') {
                if (hoveredTrackId && hoveredTrackId !== dragState.trackId && onMoveClip) {
                    const deltaX = e.clientX - dragState.startX;
                    const deltaTime = deltaX / zoom;
                    const newStart = Math.max(0, (dragState.originalStart || 0) + deltaTime);
                    onMoveClip(dragState.itemId!, dragState.trackId!, hoveredTrackId, newStart);
                } else if (onClipDragEnd && dragState.trackId) {
                    // Trigger reorder/cleanup on same track drop
                    onClipDragEnd(dragState.trackId);
                }
            }
            setDragState(null);
        };

        if (dragState) {
            window.addEventListener('mousemove', handleWindowMouseMove);
            window.addEventListener('mouseup', handleWindowMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [dragState, zoom, tracks, onUpdateClip, hoveredTrackId, onMoveClip]);

    // --- Render Helpers ---

    const renderRulerMarks = () => {
        const width = Math.max(totalDuration + 10, 300) * zoom;
        const marks = [];
        const step = zoom > 60 ? 1 : zoom > 30 ? 5 : 10;

        for (let i = 0; i < width / zoom; i += step) {
            marks.push(
                <div key={i} className="absolute bottom-0 border-l border-gray-400 h-2 text-[10px] pl-1 text-gray-500 select-none" style={{ left: i * zoom }}>
                    {i}s
                </div>
            );
        }
        return marks;
    };

    const getIconForTrack = (type: string) => {
        switch (type) {
            case 'video': return <Video size={14} />;
            case 'audio': return <Music size={14} />;
            default: return <Type size={14} />;
        }
    };

    const getTrackHeightClass = (type: string) => {
        if (type === 'video') return 'h-16'; // Main Video - Large (was h-20)
        if (type === 'audio') return 'h-10'; // Audio - Medium (was h-12)
        return 'h-8'; // Overlays/Text - Small (was h-10)
    };

    const renderTransitions = (track: Track) => {
        if (track.type !== 'video') return null;

        const transitions = [];
        const sortedItems = [...track.items].sort((a, b) => a.start - b.start);

        for (let i = 0; i < sortedItems.length - 1; i++) {
            const current = sortedItems[i];
            const next = sortedItems[i + 1];

            const gap = next.start - (current.start + current.duration);

            if (Math.abs(gap) < 0.1) {
                const transitionType = next.transition?.type || 'none';
                const isActive = transitionType !== 'none';

                transitions.push(
                    <button
                        key={`trans-${current.id}-${next.id}`}
                        className={`absolute top-1/2 -translate-y-1/2 z-40 w-6 h-6 rounded-full flex items-center justify-center shadow-sm border hover:scale-110 transition-all ${isActive
                            ? 'bg-blue-100 border-blue-300 text-[#2F6BFF]'
                            : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 hover:opacity-100'
                            }`}
                        style={{ left: next.start * zoom - 12 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransition(track.id, next.id);
                        }}
                        title={isActive ? `Transition: ${transitionType}` : "Add Transition"}
                    >
                        {isActive ? <Zap size={12} fill="currentColor" /> : <Plus size={14} />}
                    </button>
                );
            }
        }
        return transitions;
    };

    return (
        <div className="md:h-full h-auto md:overflow-y-auto overflow-y-scroll custom-scrollbar bg-white flex flex-col select-none relative z-30">

            {/* 1. Toolbar */}
            <div className="md:h-14 h-auto  px-4  border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-20 relative">

                {/* Left: Editing Tools */}
                <div className="flex items-center gap-2 md:w-1/3 w-full">
                    <button
                        onClick={onSplitClip}
                        className="flex items-center gap-2 md:px-3 px-2 md:py-1.5 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                        disabled={!selectedItemId}
                        title="Split at playhead"
                    >
                        <Scissors size={18} />
                        <span className="hidden sm:inline">Split</span>
                    </button>

                    {selectedItemId && (
                        <button
                            onClick={() => {
                                const track = tracks.find(t => t.items.some(i => i.id === selectedItemId));
                                if (track) onDeleteClip(track.id, selectedItemId);
                            }}
                            className="flex items-center md:gap-2 gap-1 md:px-3 px-2 md:py-1.5 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete selected"
                        >
                            <Trash2 size={18} />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    )}
                </div>

                {/* Center: Playback Controls */}
                <div className="absolute md:left-1/2 left-1/2 top-1/2 top-0 md:transform -translate-x-1/2 -translate-y-1/2 flex items-center md:gap-4 gap-2">
                    <span className="text-lg font-semibold text-gray-800 md:w-[50px] w-auto text-right tabular-nums tracking-tight">
                        {formatTime(currentTime)}
                    </span>

                    <button
                        onClick={onPlayPause}
                        className="md:w-12 w-5 md:h-12 h-6 flex items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all border border-gray-100 z-10"
                    >
                        {isPlaying ? (
                            <Pause size={20} className=" text-gray-900 fill-gray-900" />
                        ) : (
                            <Play size={20} className=" text-gray-900 fill-gray-900 ml-1" />
                        )}
                    </button>

                    <span className="text-lg font-medium text-gray-400 w-[50px] tabular-nums tracking-tight">
                        {formatTime(totalDuration)}
                    </span>
                </div>

                {/* Right: Zoom & Add */}
                <div className="flex items-center md:gap-3 gap-2 md:w-1/3 w-full justify-end">
                    <div className="flex items-center md:gap-2 gap-1 mr-2 bg-gray-50 rounded-full md:px-3 px-2 md:py-1 py-0.5 border border-gray-100">
                        <ZoomOut size={14} className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setZoom(Math.max(MIN_ZOOM, zoom - 10))} />
                        <input
                            type="range"
                            min={MIN_ZOOM}
                            max={MAX_ZOOM}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="md:w-20 w-16 accent-violet-600 md:h-1 h-0.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <ZoomIn size={14} className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setZoom(Math.min(MAX_ZOOM, zoom + 10))} />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                            className="md:w-9 w-7 md:h-9 h-7 flex items-center justify-center bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                            title="Add track"
                        >
                            <Plus size={18} />
                        </button>
                        {isAddMenuOpen && (
                            <div className="absolute md:bottom-full bottom-0 right-0 mb-2 md:w-40 w-32 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 py-1">
                                <button onClick={() => { onAddTrackItem('video'); setIsAddMenuOpen(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                                    <Video size={14} /> Video Track
                                </button>
                                <button onClick={() => { onAddTrackItem('image'); setIsAddMenuOpen(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                                    <Sparkles size={14} /> Overlay
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Timeline Area */}
            <div className="md:flex-1 flex-none flex md:overflow-hidden overflow-y-auto custom-scrollbar">

                {/* Track Headers */}
                <div className="md:w-40 max-w-[10rem] bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-[4px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="md:h-8 h-0 border-b border-gray-100 bg-gray-50 shrink-0"></div>
                    <div className="md:flex-1 flex-none overflow-y-auto custom-scrollbar">
                        {tracks.map(track => (
                            <div
                                key={track.id}
                                className={`${getTrackHeightClass(track.type)} border-b border-gray-100 flex items-center md:px-3 px-2 gap-2 hover:bg-gray-50 group transition-colors`}
                            >
                                <div className="md:w-6 w-5 md:h-6 h-5 rounded bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    {getIconForTrack(track.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="md:text-[10px] text-[8px] font-bold text-gray-700 truncate">{track.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scrollable Tracks */}
                <div
                    className="md:flex-1 flex-none md:overflow-scroll overflow-y-auto overflow-x-scroll custom-scrollbar relative bg-[#f4f4f5]"
                    ref={scrollContainerRef}
                    onWheel={handleWheel}
                    onMouseDown={(e) => {
                        if (e.button !== 0) return;
                        handleTimelineMouseMove(e.clientX);
                        onSelectClip("", null);
                        setDragState({ type: 'scrub', startX: e.clientX });
                    }}
                >
                    <div style={{ width: totalDuration * zoom + 400, minWidth: '100%', minHeight: '100%' }} className="relative">

                        {/* Ruler */}
                        <div
                            ref={rulerRef}
                            className="md:h-8 h-6 bg-gray-50 border-b border-gray-200 sticky top-0 z-10 cursor-pointer relative"
                            onMouseDown={handleRulerMouseDown}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {renderRulerMarks()}
                            <div
                                className="absolute top-0 w-0 h-0 md:border-l-[6px] border-l-[4px] border-l-transparent md:border-r-[6px] border-r-[4px] border-r-transparent md:border-t-[8px] border-t-[6px] border-t-violet-600 transform -translate-x-1/2 z-20 transition-transform duration-75"
                                style={{ left: currentTime * zoom }}
                            ></div>
                        </div>

                        {/* Tracks */}
                        <div className="relative md:pt-2 pt-1 pb-10">
                            {/* Playhead Line */}
                            <div
                                className="absolute top-0 bottom-0 md:w-px w-0.5 bg-[#2F6BFF] z-30 pointer-events-none"
                                style={{ left: currentTime * zoom }}
                            ></div>

                            {tracks.map(track => (
                                <div
                                    key={track.id}
                                    className={`${getTrackHeightClass(track.type)} border-b border-gray-200/50 relative md:mb-0.5 mb-0.25 group ${hoveredTrackId === track.id && dragState?.type === 'move' ? 'bg-blue-50/50' : ''}`}
                                    onMouseEnter={() => setHoveredTrackId(track.id)}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'copy';
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const data = e.dataTransfer.getData('application/json');
                                        if (data) {
                                            try {
                                                const itemData = JSON.parse(data);
                                                if (scrollContainerRef.current) {
                                                    const rect = scrollContainerRef.current.getBoundingClientRect();
                                                    const offsetX = e.clientX - rect.left + scrollContainerRef.current.scrollLeft;
                                                    const dropTime = Math.max(0, offsetX / zoom);
                                                    onDropClip(track.id, dropTime, itemData);
                                                }
                                            } catch (err) {
                                                console.error('Failed to parse drop data', err);
                                            }
                                        }
                                    }}
                                >
                                    <div className="absolute inset-0 md:bg-white/50 bg-gray-100 group-hover:bg-white/80 transition-colors"></div>

                                    {/* Items */}
                                    {track.items.map(item => (
                                        <div
                                            key={item.id}
                                            className={`absolute top-0.5 bottom-0.5 rounded-md overflow-hidden cursor-pointer border group/item touch-none shadow-sm ${selectedItemId === item.id
                                                ? 'md:border-[#2F6BFF] border-blue-300 ring-1 ring-blue-200 z-10'
                                                : item.isLocked
                                                    ? 'md:border-gray-300 border-gray-200 bg-gray-100 opacity-80'
                                                    : 'md:border-blue-300 border-blue-200 bg-blue-100 hover:border-blue-400'
                                                }`}
                                            style={{
                                                left: item.start * zoom,
                                                width: item.duration * zoom
                                            }}
                                            onMouseDown={(e) => handleItemMouseDown(e, track.id, item)}
                                            onClick={(e) => e.stopPropagation()}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                handleMenuClick(e, track.id, item.id);
                                            }}
                                        >
                                            {/* Clip Content */}
                                            <div className="md:w-full w-auto md:h-full h-full relative overflow-hidden">
                                                {/* Background Indicator */}
                                                {item.isBackground && (
                                                    <div className="absolute md:top-1 top-0.5 md:right-8 right-4 z-30 bg-black/50 rounded p-0.5">
                                                        <Image size={10} className="text-white" />
                                                    </div>
                                                )}

                                                {/* Animation Indicator */}
                                                {item.animation && (
                                                    <div className="absolute md:top-1 top-0.5 md:right-5 right-3 z-30 bg-[#2F6BFF]/80 rounded p-0.5" title={`Animation: ${ANIMATIONS.find(a => a.id === item.animation?.type)?.name || item.animation.type}`}>
                                                        <Film size={10} className="text-white" />
                                                    </div>
                                                )}

                                                {(item.type === 'video' || item.type === 'image') && track.type === 'video' ? (
                                                    <div className="flex md:w-full w-auto md:h-full h-full">
                                                        {Array.from({ length: Math.max(1, Math.ceil((item.duration * zoom) / 80)) }).map((_, i) => (
                                                            <img
                                                                key={i}
                                                                src={item.thumbnail || item.src}
                                                                className="md:h-full h-full md:w-[80px] w-auto max-w-none object-cover opacity-90"
                                                                draggable={false}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : item.type === 'color' ? (
                                                    <div className="md:w-full w-auto md:h-full h-full" style={{ background: item.src }}></div>
                                                ) : (
                                                    <div className={`md:w-full w-auto md:h-full h-full flex items-center px-2 md:text-[9px] text-[8px] font-medium whitespace-nowrap overflow-hidden ${item.type === 'audio' ? 'bg-orange-100 text-orange-800' : 'bg-blue-50 text-blue-800'}`}>
                                                        {track.type === 'overlay' && (
                                                            <div className="md:w-4 w-3 md:h-4 h-3 rounded-sm bg-black/10 mr-1 shrink-0 overflow-hidden">
                                                                {(item.type === 'image' || item.type === 'video') && <img src={item.thumbnail || item.src} className="w-full h-full object-cover" />}
                                                            </div>
                                                        )}
                                                        {item.name}
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 md:bg-black/0 bg-gray-800/0 group-hover/item:bg-black/5 pointer-events-none transition-colors"></div>

                                                {/* Lock Indicator */}
                                                {item.isLocked && (
                                                    <div className="absolute inset-0 flex items-center justify-center z-20 md:bg-black/10 bg-gray-800/10 pointer-events-none">
                                                        <Lock size={12} className="md:text-white text-gray-800 drop-shadow-md" />
                                                    </div>
                                                )}

                                                {track.type === 'video' && (
                                                    <div className="absolute bottom-0.5 left-1 right-1 flex justify-between items-end pointer-events-none">
                                                        <div className="md:text-[9px] text-[8px] font-bold md:text-white text-gray-800 drop-shadow-md truncate max-w-[70%]">
                                                            {item.name}
                                                        </div>
                                                        <div className="text-[8px] font-medium text-white/90 drop-shadow-md bg-black/40 px-1 rounded">
                                                            {item.duration.toFixed(1)}s
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Transition Indicators */}
                                                {(() => {
                                                    // Find next item for outgoing transition logic
                                                    const nextItem = track.items.find(i => Math.abs(i.start - (item.start + item.duration)) < 0.05);

                                                    return (
                                                        <>
                                                            {/* Incoming Transition (Left) */}
                                                            {item.transition && item.transition.type !== 'none' && (
                                                                (item.transition.timing === 'postfix' || !item.transition.timing) ? (
                                                                    <div className="absolute top-0 left-0 bottom-0 md:bg-[#2F6BFF]/50 bg-blue-50/50 border-r border-blue-400/50 z-20 pointer-events-none flex items-center justify-center" style={{ width: item.transition.duration * zoom }}>
                                                                        <Zap size={10} className="text-white drop-shadow" fill="currentColor" />
                                                                    </div>
                                                                ) : item.transition.timing === 'overlap' ? (
                                                                    <div className="absolute top-0 left-0 bottom-0 md:bg-[#2F6BFF]/50 bg-blue-50/50 border-r border-blue-400/50 z-20 pointer-events-none flex items-center justify-center" style={{ width: (item.transition.duration / 2) * zoom }}>
                                                                        <div className="absolute right-0 translate-x-1/2">
                                                                            <Zap size={10} className="text-white drop-shadow" fill="currentColor" />
                                                                        </div>
                                                                    </div>
                                                                ) : null
                                                            )}

                                                            {/* Outgoing Transition (Right) */}
                                                            {nextItem && nextItem.transition && nextItem.transition.type !== 'none' && (
                                                                nextItem.transition.timing === 'prefix' ? (
                                                                    <div className="absolute top-0 right-0 bottom-0 md:bg-[#2F6BFF]/50 bg-blue-50/50 border-l border-blue-400/50 z-20 pointer-events-none flex items-center justify-center" style={{ width: nextItem.transition.duration * zoom }}>
                                                                        <Zap size={10} className="text-white drop-shadow" fill="currentColor" />
                                                                    </div>
                                                                ) : nextItem.transition.timing === 'overlap' ? (
                                                                    <div className="absolute top-0 right-0 bottom-0 md:bg-[#2F6BFF]/50 bg-blue-50/50 border-l border-blue-400/50 z-20 pointer-events-none flex items-center justify-center" style={{ width: (nextItem.transition.duration / 2) * zoom }}>
                                                                        {/* Icon handled by incoming overlap part or just hidden here to avoid duplicate */}
                                                                    </div>
                                                                ) : null
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            {/* Menu Button */}
                                            <button
                                                className={`absolute top-0.5 right-0.5 md:w-5 w-4 md:h-5 h-4 md:bg-white/90 bg-gray-100 hover:bg-white rounded text-gray-700 items-center justify-center shadow-sm z-50 transition-opacity ${selectedItemId === item.id ? 'flex' : 'hidden group-hover/item:flex'}`}
                                                onClick={(e) => handleMenuClick(e, track.id, item.id)}
                                            >
                                                <MoreHorizontal size={12} className="md:text-12 text-10 text-gray-700" />
                                            </button>

                                            {/* Resize Handles */}
                                            {!item.isLocked && (
                                                <>
                                                    <div
                                                        className="absolute left-0 top-0 bottom-0 md:w-2 w-1.5 cursor-w-resize opacity-0 group-hover/item:opacity-100 md:bg-black/20 bg-gray-800/20 hover:bg-[#2F6BFF] flex items-center justify-center z-30"
                                                        onMouseDown={(e) => handleResizeMouseDown(e, track.id, item, 'left')}
                                                    >
                                                        <div className="md:w-px w-0.5 md:h-2 h-1.5 bg-white/50"></div>
                                                    </div>
                                                    <div
                                                        className="absolute right-0 top-0 bottom-0 md:w-2 w-1.5 cursor-e-resize opacity-0 group-hover/item:opacity-100 md:bg-black/20 bg-gray-800/20 hover:bg-[#2F6BFF] flex items-center justify-center z-30"
                                                        onMouseDown={(e) => handleResizeMouseDown(e, track.id, item, 'right')}
                                                    >
                                                        <div className="md:w-px w-0.5 md:h-2 h-1.5 bg-white/50"></div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}

                                    {/* Transition Buttons */}
                                    {renderTransitions(track)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Context Menu Popup */}
                {activeClipMenu && (
                    <div
                        ref={menuRef}
                        className="fixed z-[100] md:bg-white bg-gray-100 rounded-lg shadow-xl border border-gray-200 md:w-56 w-48 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            top: Math.min(window.innerHeight - 300, activeClipMenu.y),
                            left: Math.min(window.innerWidth - 230, activeClipMenu.x),
                        }}
                    >
                        {(() => {
                            const track = tracks.find(t => t.id === activeClipMenu.trackId);
                            const item = track?.items.find(i => i.id === activeClipMenu.itemId);
                            if (!track || !item) return null;

                            return (
                                <>
                                    <div className="flex items-center justify-between md:px-2 px-1 md:py-2 py-1 md:border-b border-gray-100 mb-1">
                                        <button onClick={() => { onCopy(item); setActiveClipMenu(null); }} className="md:p-1.5 p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Copy">
                                            <Copy size={16} />
                                        </button>
                                        <button onClick={() => { onPaste(track.id); setActiveClipMenu(null); }} className="md:p-1.5 p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Paste">
                                            <Clipboard size={16} />
                                        </button>
                                        <button onClick={() => { onDuplicate(track.id, item.id); setActiveClipMenu(null); }} className="md:p-1.5 p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Duplicate">
                                            <CopyPlus size={16} />
                                        </button>
                                        <button onClick={() => { onDeleteClip(track.id, item.id); setActiveClipMenu(null); }} className="md:p-1.5 p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-600 transition-colors" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <button onClick={() => { onLock(track.id, item.id); setActiveClipMenu(null); }} className="w-full md:px-4 px-3 md:py-2 py-1 text-sm text-left hover:bg-gray-100 flex items-center gap-3 text-gray-700">
                                        {item.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                                        {item.isLocked ? 'Unlock' : 'Lock'}
                                    </button>
                                    <button onClick={() => { onDetach(track.id, item.id); setActiveClipMenu(null); }} className="w-full md:px-4 px-3 md:py-2 py-1 text-sm text-left hover:bg-gray-100 flex items-center gap-3 text-gray-700">
                                        {item.isBackground ? <ImageMinus size={16} /> : <Image size={16} />}
                                        {item.isBackground ? 'Detach image from background' : 'Set as background'}
                                    </button>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <button onClick={() => { onSelectTransition(track.id, item.id); setActiveClipMenu(null); }} className="w-full md:px-4 px-3 md:py-2 py-1 text-sm text-left hover:bg-gray-100 flex items-center gap-3 text-gray-700">
                                        <Zap size={16} /> Add Transition
                                    </button>
                                    <button onClick={() => alert('Comments feature coming soon!')} className="w-full md:px-4 px-3 md:py-2 py-1 text-sm text-left hover:bg-gray-100 flex items-center gap-3 text-gray-700">
                                        <MessageSquare size={16} /> Comment
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Timeline;
