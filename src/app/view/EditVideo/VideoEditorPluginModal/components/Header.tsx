import React, { useState, useRef, useEffect } from 'react';
import {
    Menu, Undo2, Redo2, Cloud, Share2,
    ChevronDown, FileText, Download, Trash2,
    Copy, FolderOpen, Plus, Play, Minus, ChevronRight, ArrowLeft
} from 'lucide-react';
import { CanvasDimension, RESIZE_OPTIONS } from '../types';

interface HeaderProps {
    projectName: string;
    setProjectName: (name: string) => void;
    onToggleProjectMenu: () => void;
    currentDimension: CanvasDimension;
    onResize: (dim: CanvasDimension) => void;
    scalePercent: number;
    setScalePercent: (scale: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onCreateNew: (dim: CanvasDimension) => void;
    onOpenProject: () => void; // This opens the drawer (Open Recent)
    onSaveProject: () => void;
    onLoadProject: () => void;
    onMakeCopy: () => void;
    onMoveToTrash: () => void;
    onPreview: () => void;
    onClose?: () => void;
}

const NEW_PROJECT_OPTIONS: CanvasDimension[] = [
    { name: '16:9 (Widescreen)', width: 1920, height: 1080 },
    { name: '9:16 (Portrait)', width: 1080, height: 1920 },
    { name: '1:1 (Instagram)', width: 1080, height: 1080 },
    { name: '4:3 (Standard)', width: 1440, height: 1080 },
    { name: '4:5 (Vertical)', width: 1080, height: 1350 },
    { name: '21:9 (Cinema)', width: 2560, height: 1080 },
    { name: '3:4 (Business)', width: 1080, height: 1440 },
];

const Header: React.FC<HeaderProps> = ({
    projectName,
    setProjectName,
    onToggleProjectMenu,
    currentDimension,
    onResize,
    scalePercent,
    setScalePercent,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onCreateNew,
    onOpenProject,
    onSaveProject,
    onLoadProject,
    onMakeCopy,
    onMoveToTrash,
    onPreview,
    onClose
}) => {
    const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
    const [isResizeMenuOpen, setIsResizeMenuOpen] = useState(false);
    const [isNewProjectSubmenuOpen, setIsNewProjectSubmenuOpen] = useState(false);
    const fileMenuRef = useRef<HTMLDivElement>(null);
    const resizeMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
                setIsFileMenuOpen(false);
                setIsNewProjectSubmenuOpen(false);
            }
            if (resizeMenuRef.current && !resizeMenuRef.current.contains(event.target as Node)) {
                setIsResizeMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="md:h-14 h-10 bg-black text-gray-200 flex items-center justify-between px-4 select-none z-[60] relative border-b border-gray-800">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="md:p-2 p-1 hover:bg-white/10 rounded-lg transition-colors text-white hover:text-white"
                        title="Back to Edit Video"
                    >
                        <ArrowLeft className="md:size-6 size-5" size={24} />
                    </button>
                )}
                <button
                    onClick={onToggleProjectMenu}
                    className="md:p-2 p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-200 hover:text-white"
                >
                    <Menu className="md:size-6 size-5" size={24} />
                </button>

                <div className="relative" ref={fileMenuRef}>
                    <button
                        className="md:px-3 px-2 md:py-1.5 py-1 hover:bg-white/10 rounded-lg font-medium md:text-lg text-sm flex items-center gap-1 text-gray-200 hover:text-white transition-colors"
                        onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                    >
                        File <ChevronDown className="md:size-4 size-3" size={14} />
                    </button>

                    {isFileMenuOpen && (
                        <div className="absolute top-full left-0 max-h-72 overflow-y-auto md:max-h-100 md:mt-1.5 mt-1 md:w-72 w-48 bg-black text-gray-200 rounded-lg shadow-xl border border-gray-900 py-2 z-[70]">
                            <div className="md:px-4 px-3 md:py-2 py-1 border-b border-gray-700 mb-2">
                                <p className="font-semibold md:text-sm text-[10px] truncate text-white">{projectName}</p>
                                <p className="md:text-sm text-[10px] text-gray-400">{currentDimension.width} x {currentDimension.height} px</p>
                            </div>
                            <div className="flex flex-col relative">
                                <div
                                    className="relative"
                                    onMouseEnter={() => setIsNewProjectSubmenuOpen(true)}
                                    onMouseLeave={() => setIsNewProjectSubmenuOpen(false)}
                                >
                                    <button
                                        className="w-full md:px-4 px-3 md:py-2 py-1 md:text-sm text-[10px] hover:bg-white/5 flex items-center justify-between text-left"
                                        onClick={() => setIsNewProjectSubmenuOpen(!isNewProjectSubmenuOpen)}
                                    >
                                        <div className="flex items-center gap-3 " ><Plus className="md:size-4 size-3" size={16} /> Create new project</div>
                                        <ChevronRight className="md:size-4 size-3" size={14} />
                                    </button>

                                    {isNewProjectSubmenuOpen && (
                                        <div className="absolute top-0 left-full ml-1 w-56 bg-black text-gray-200 rounded-lg shadow-xl border border-gray-900 py-2 z-[80] max-h-96 overflow-y-auto">
                                            {NEW_PROJECT_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.name}
                                                    className="w-full md:px-4 px-3 md:py-2 py-1 md:text-sm text-[10px] hover:bg-white/5 text-left flex justify-between items-center"
                                                    onClick={() => {
                                                        onCreateNew(opt);
                                                        setIsFileMenuOpen(false);
                                                        setIsNewProjectSubmenuOpen(false);
                                                    }}
                                                >
                                                    <span>{opt.name}</span>
                                                    <span className="md:text-xs text-[10px] text-gray-400 ml-2">{opt.width}x{opt.height}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="md:px-4 px-3 md:py-2 py-1 md:text-sm text-[10px] hover:bg-white/5 flex items-center gap-3 text-left"
                                    onClick={() => { onLoadProject(); setIsFileMenuOpen(false); }}
                                >
                                    <FolderOpen className="md:size-4 size-3" size={16} /> Open project
                                </button>
                                <button
                                    className="md:px-4 px-3 md:py-2 py-1 md:text-sm text-[10px] hover:bg-white/5 flex items-center gap-3 text-left"
                                    onClick={() => { onOpenProject(); setIsFileMenuOpen(false); }}
                                >
                                    <FolderOpen className="md:size-4 size-3" size={16} /> Open Recent
                                </button>
                                <button className="md:px-4 px-3 md:py-2 py-1 md:text-sm text-[10px] hover:bg-white/5 flex items-center gap-3 text-left">
                                    <FolderOpen className="md:size-4 size-3"    size={16} /> Import files
                                </button>
                                <div className="h-px bg-gray-700 my-1"></div>
                                <button
                                    className="md:px-4 px-3 md:py-2 py-1 md:text-sm text-[10px] hover:bg-white/5 flex items-center gap-3 text-left"
                                    onClick={() => { onSaveProject(); setIsFileMenuOpen(false); }}
                                >
                                    <Cloud className="md:size-4 size-3" size={16} /> Save
                                </button>
                                <button
                                    className="md:px-4 px-3 md:py-2 py-1 md:text-sm text-[10px] hover:bg-white/5 flex items-center gap-3 text-left"
                                    onClick={() => { onMakeCopy(); setIsFileMenuOpen(false); }}
                                >
                                    <Copy className="md:size-4 size-3"  size={16} /> Make a copy
                                </button>
                                <div className="h-px bg-gray-700 my-1"></div>
                                <button
                                    className="md:px-4 px-3 md:py-2 py-1 md:text-sm text-[10px] hover:bg-red-900/20 text-red-400 flex items-center gap-3 text-left"
                                    onClick={() => { onMoveToTrash(); setIsFileMenuOpen(false); }}
                                >
                                    <Trash2 className="md:size-4 size-3" size={16} /> Move to trash
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={resizeMenuRef}>
                    <button
                        onClick={() => setIsResizeMenuOpen(!isResizeMenuOpen)}
                        className="md:px-3 px-2 md:py-1.5 py-1 hover:bg-white/10 rounded-lg font-medium md:text-lg text-sm flex items-center gap-2 text-gray-200 hover:text-white transition-colors"
                    >
                        Resize
                    </button>

                    {isResizeMenuOpen && (
                        <div className="absolute top-full left-0 md:mt-1 mt-1 md:w-72 w-48 bg-black text-gray-200 rounded-lg shadow-xl border border-gray-900 py-2 z-[70] max-h-96 overflow-y-auto">
                            <div className="md:px-4 px-3 md:py-2 py-1 md:text-sm text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                Suggested
                            </div>
                            {RESIZE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.name}
                                    onClick={() => {
                                        onResize(opt);
                                        setIsResizeMenuOpen(false);
                                    }}
                                    className={`w-full md:px-4 px-3 md:py-2 py-1 md:text-sm text-[10px] hover:bg-white/5 flex justify-between items-center ${opt.name === currentDimension.name ? 'bg-[#2F6BFF]/10 text-blue-400' : ''}`}
                                >
                                    <span>{opt.name}</span>
                                    <span className="md:text-xs text-[10px] text-gray-400">{opt.width} x {opt.height}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="md:h-6 h-4 w-px bg-gray-200 mx-2 hidden md:block"></div>

                <div className="md:flex items-center gap-1 hidden ">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="md:p-2 p-1 hover:bg-white/10 rounded-lg text-white hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <Undo2 className="md:size-4 size-3" size={18} />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="p-2 hover:bg-white/10 rounded-lg text-white hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <Redo2 className="md:size-4 size-3" size={18} />
                    </button>
                </div>
            </div>

            {/* Center Section - Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2 md:max-w-xs max-w-32">
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="bg-transparent border border-transparent hover:border-gray-700 focus:border-[#2F6BFF] rounded md:px-3 px-1.5 md:py-1.5 py-0.5 text-center md:text-sm text-[9px] font-medium focus:outline-none md:w-64 w-32 transition-all text-gray-300 placeholder-gray-600"
                />
            </div>

            {/* Right Section - Simplified */}
            <div className="flex items-center md:gap-3 gap-1">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2 bg-black rounded-lg md:p-1 p-0.5 border border-white/30 mr-2">
                    <button
                        onClick={() => setScalePercent(Math.max(10, (scalePercent || 100) - 10))}
                        className="md:p-1 p-0.5 hover:bg-white/10 rounded text-gray-200 hover:text-white transition-colors"
                    >
                        <Minus className="md:size-4 size-3" size={14} />
                    </button>

                    <span className="md:text-sm text-[10px] font-medium md:w-12 w-8 text-center text-gray-200">
                        {scalePercent === 0 ? 'Fit' : `${scalePercent}%`}
                    </span>

                    <button
                        onClick={() => setScalePercent(Math.min(200, (scalePercent || 100) + 10))}
                        className="md:p-1 p-0.5 hover:bg-white/10 rounded text-gray-200 hover:text-white transition-colors"
                    >
                        <Plus className="md:size-4 size-3" size={14} />
                    </button>

                    <div className="md:w-px w-0.5 h-3 md:h-4 bg-gray-700 mx-1"></div>

                    <button
                        onClick={() => setScalePercent(0)}
                        className={`md:text-[10px] text-[8px] font-medium md:px-2 px-1 md:py-0.5 py-0.25 rounded transition-colors ${scalePercent === 0 ? 'bg-[#2F6BFF]/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        Fit
                    </button>
                </div>

                <button
                    onClick={onPreview}
                    className="md:px-4 px-3 md:py-1.5 py-1 bg-black hover:bg-white/10 text-gray-200 md:text-sm text-[10px] font-medium rounded-lg transition-colors border border-white/30 flex items-center gap-2"
                >
                    <Play size={14} fill="currentColor" /> Preview
                </button>

                <button className="md:px-4 px-3 md:py-1.5 py-1 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white md:text-sm text-[10px] font-medium rounded-lg transition-colors shadow-sm">
                    Export
                </button>
            </div>
        </header>
    );
};

export default Header;
