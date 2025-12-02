
import React, { useState, useRef } from 'react';
import { Tab, MOCK_UPLOADS, MOCK_PROJECTS, MOCK_IMAGES, MOCK_VIDEOS, MOCK_AUDIO, FONT_COMBINATIONS, TimelineItem, getTextEffectStyle } from '../types';
import { Search, X, MousePointer, PenTool, Square, Circle, Minus, Type, Hand, Triangle, Hexagon, UploadCloud, Music, Play, Pause, AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignVerticalJustifyCenter, AlignEndVertical, Plus } from 'lucide-react';

interface ResourcePanelProps {
    activeTab: Tab;
    isOpen: boolean;
    onClose: () => void;
    onAddClip: (src: string, type: 'video' | 'image' | 'color' | 'text' | 'audio', overrides?: Partial<TimelineItem>) => void;
    selectedItem: TimelineItem | null;
    onAlign: (align: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
    uploads: Array<{ id: string, type: 'image' | 'video' | 'audio', src: string, name: string, thumbnail?: string, duration?: string }>;
    onUpload: () => void;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ activeTab, isOpen, onClose, onAddClip, selectedItem, onAlign, uploads, onUpload }) => {
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const audioPlayer = useRef<HTMLAudioElement | null>(null);

    const handlePlayPreview = (src: string, id: string) => {
        if (playingAudioId === id) {
            audioPlayer.current?.pause();
            setPlayingAudioId(null);
        } else {
            if (audioPlayer.current) {
                audioPlayer.current.pause();
            }
            audioPlayer.current = new Audio(src);
            audioPlayer.current.onended = () => setPlayingAudioId(null);
            audioPlayer.current.play();
            setPlayingAudioId(id);
        }
    };

    const parseDurationString = (durationStr?: string): number => {
        if (!durationStr) return 0;
        const parts = durationStr.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return parseFloat(durationStr) || 0;
    };

    const renderTools = () => (
        <div className="p-4 space-y-6 pb-24 w-full h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <MousePointer size={32} className="text-[#2F6BFF]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Tools</h3>
            <p className="text-sm text-gray-500 max-w-[200px]">
                Advanced editing tools are coming soon! Stay tuned for updates.
            </p>
        </div>
    );

    const renderText = () => (
        <div className="md:p-4 p-2 md:space-y-6 space-y-3 pb-24">
            <div className="grid md:grid-cols-6 grid-cols-3 gap-1.5">
                <button
                    draggable={true}
                    onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', src: 'Heading', name: 'Heading', fontSize: 64, fontWeight: 'bold' }));
                    }}
                    onClick={() => onAddClip('Heading', 'text')}
                    className="md:p-2 p-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-300 hover:text-[#2F6BFF] text-gray-600 transition-all font-bold text-sm cursor-grab active:cursor-grabbing"
                    title="Drag to add Heading"
                >
                    H1
                </button>
                <button
                    draggable={true}
                    onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', src: 'Subheading', name: 'Subheading', fontSize: 40, fontWeight: 'bold' }));
                    }}
                    onClick={() => onAddClip('Subheading', 'text')}
                    className="md:p-2 p-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-300 hover:text-[#2F6BFF] text-gray-600 transition-all font-semibold text-xs cursor-grab active:cursor-grabbing"
                    title="Drag to add Subheading"
                >
                    H2
                </button>
                <button
                    draggable={true}
                    onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', src: 'Body Text', name: 'Body Text', fontSize: 24 }));
                    }}
                    onClick={() => onAddClip('Body Text', 'text')}
                    className="md:p-2 p-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-300 hover:text-[#2F6BFF] text-gray-600 transition-all text-xs font-medium cursor-grab active:cursor-grabbing"
                    title="Drag to add Body Text"
                >
                    Aa
                </button>
            </div>

            <div className="md:pt-4 pt-2 border-t border-gray-100">
                <h4 className="font-bold md:text-sm text-[10px] text-gray-700 md:mb-3 mb-1">Alignment</h4>
                <div className={`grid md:grid-cols-6 grid-cols-3 gap-1.5 ${!selectedItem ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <button onClick={() => onAlign('left')} className="md:p-2 p-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-300 hover:text-[#2F6BFF] text-gray-600 transition-all" title="Align Left">
                        <AlignLeft size={16} />
                    </button>
                    <button onClick={() => onAlign('center')} className="md:p-2 p-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-300 hover:text-[#2F6BFF] text-gray-600 transition-all" title="Align Center">
                        <AlignCenter size={16} />
                    </button>
                    <button onClick={() => onAlign('right')} className="md:p-2 p-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-300 hover:text-[#2F6BFF] text-gray-600 transition-all" title="Align Right">
                        <AlignRight size={16} />
                    </button>
                    <button onClick={() => onAlign('top')} className="md:p-2 p-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-300 hover:text-[#2F6BFF] text-gray-600 transition-all" title="Align Top">
                        <AlignStartVertical size={16} />
                    </button>
                    <button onClick={() => onAlign('middle')} className="md:p-2 p-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-300 hover:text-[#2F6BFF] text-gray-600 transition-all" title="Align Middle">
                        <AlignVerticalJustifyCenter size={16} />
                    </button>
                    <button onClick={() => onAlign('bottom')} className="md:p-2 p-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-300 hover:text-[#2F6BFF] text-gray-600 transition-all" title="Align Bottom">
                        <AlignEndVertical size={16} />
                    </button>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
                <h4 className="font-bold md:text-sm text-[10px] text-gray-700 md:mb-4 mb-2">Font Combinations</h4>
                <div className="grid md:grid-cols-2 grid-cols-2 md:gap-3 gap-1">
                    {FONT_COMBINATIONS.map((combo) => (
                        <div
                            key={combo.id}
                            draggable={true}
                            onDragStart={(e) => {
                                e.dataTransfer.setData('application/json', JSON.stringify({
                                    type: 'text',
                                    src: combo.label,
                                    name: combo.label,
                                    ...combo.style
                                }));
                            }}
                            onClick={() => onAddClip(combo.label, 'text', combo.style)}
                            className="bg-gray-50 md:p-4 p-2 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-all border border-gray-200 hover:border-blue-200 hover:bg-white flex flex-col items-center justify-center text-center aspect-square group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h5
                                className="md:text-xl text-[12px] leading-tight z-10 w-full break-words"
                                style={{
                                    fontFamily: combo.style.fontFamily,
                                    color: combo.style.color,
                                    ...getTextEffectStyle(combo.style.textEffect!, combo.style.color),
                                    fontStyle: combo.style.fontStyle
                                }}
                            >
                                {combo.label}
                            </h5>
                            <p className="md:text-[10px] text-[8px] text-gray-400 md:mt-2 mt-1 font-sans">{combo.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderUploads = () => (
        <div className="md:p-4 p-2 h-full flex flex-col pb-24">
            <button
                onClick={onUpload}
                className="w-full md:py-3 py-2 bg-[#2F6BFF] text-white rounded-lg font-bold md:text-sm text-[10px] mb-6 hover:bg-[#2a5fe3] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
            >
                <UploadCloud className="md:size-4 size-3" size={18} /> Upload files
            </button>

            <div className="md:flex-1 flex-auto md:overflow-y-auto overflow-y-scroll custom-scrollbar">
                <h4 className="md:text-xs text-[10px] font-bold text-gray-500 uppercase tracking-wider md:mb-3 mb-1">Recent Uploads</h4>
                {uploads.length > 0 ? (
                    <div className="grid md:grid-cols-2 grid-cols-2 md:gap-3 gap-1">
                        {uploads.map((item) => (
                            <div
                                key={item.id}
                                draggable={true}
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                        type: item.type,
                                        src: item.src,
                                        name: item.name,
                                        thumbnail: item.thumbnail,
                                        duration: parseDurationString(item.duration)
                                    }));
                                }}
                                className="md:aspect-square aspect-video rounded-lg overflow-hidden cursor-grab active:cursor-grabbing relative group bg-gray-100 border border-gray-100"
                                onClick={() => onAddClip(item.src, item.type as any, { thumbnail: item.thumbnail })}
                            >
                                {item.type === 'image' && (
                                    <img src={item.src} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                )}
                                {item.type === 'video' && (
                                    <>
                                        <video src={item.src} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                            <Play className="md:size-4 size-3 text-white fill-current" size={20} />
                                        </div>
                                        {item.duration && (
                                            <div className="absolute top-1 right-1 bg-black/70 text-white md:text-[10px] text-[8px] font-medium md:px-1.5 px-1 md:py-0.5 py-0.25 rounded-md backdrop-blur-sm">
                                                {item.duration}
                                            </div>
                                        )}
                                    </>
                                )}
                                {item.type === 'audio' && (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 text-[#2F6BFF] md:p-2 p-1 text-center">
                                        <Music className="md:size-4 size-3 mb-2" size={24} />
                                        <span className="md:text-xs text-[10px] font-medium truncate w-full">{item.name}</span>
                                        {item.duration && <span className="md:text-[10px] text-[8px] text-gray-400 md:mt-1 mt-0.5">{item.duration}</span>}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center md:py-10 py-6 text-gray-400 md:text-sm text-[10px] border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                        <p>No uploads yet</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderAudio = () => {
        const userAudio = uploads.filter(u => u.type === 'audio');

        return (
            <div className="md:p-4 p-2 pb-24">
                <div className="md:mb-4 mb-2 flex items-center bg-gray-100 rounded-lg md:px-3 px-2 border border-transparent focus-within:border-[#2F6BFF] focus-within:bg-white transition-all">
                    <Search className="md:size-4 size-3 text-gray-500" size={16} />
                    <input type="text" placeholder="Search audio" className="w-full bg-transparent md:p-2.5 p-1.5 text-sm outline-none" />
                </div>

                <div className="flex items-center justify-between md:mb-3 mb-1">
                    <h3 className="font-bold text-gray-800 md:text-sm text-[10px]">Your Audio</h3>
                    <button
                        onClick={onUpload}
                        className="md:text-[10px] text-[8px] font-bold bg-blue-100 text-[#2F6BFF] md:px-2 px-1 md:py-1 py-0.5 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                    >
                        <Plus size={10} /> Import
                    </button>
                </div>

                {userAudio.length > 0 ? (
                    <div className="md:space-y-2 space-y-1 md:mb-6 mb-3">
                        {userAudio.map((audio) => (
                            <div
                                key={audio.id}
                                draggable={true}
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                        type: 'audio',
                                        src: audio.src,
                                        name: audio.name,
                                        duration: parseDurationString(audio.duration)
                                    }));
                                }}
                                className="flex items-center gap-3 md:p-3 p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-100 group relative cursor-grab active:cursor-grabbing"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayPreview(audio.src, audio.id);
                                    }}
                                    className="md:w-8 md:h-8 w-6 h-6 rounded-full bg-blue-100 text-[#2F6BFF] flex items-center justify-center hover:bg-[#2F6BFF] hover:text-white transition-colors shrink-0"
                                >
                                    {playingAudioId === audio.id ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                </button>
                                <div
                                    className="flex-1 min-w-0"
                                    onClick={() => onAddClip(audio.src, 'audio', { name: audio.name, duration: parseDurationString(audio.duration) })}
                                >
                                    <p className="md:text-xs text-[10px] font-bold text-gray-700 truncate">{audio.name}</p>
                                    <p className="md:text-[10px] text-[8px] text-gray-400">Imported • {audio.duration || '0:00'}</p>
                                </div>
                                <button
                                    onClick={() => onAddClip(audio.src, 'audio', { name: audio.name })}
                                    className="opacity-0 group-hover:opacity-100 md:p-1.5 p-1 hover:bg-gray-200 rounded text-gray-500 transition-all"
                                    title="Add to timeline"
                                >
                                    <Plus className="md:size-4 size-3" size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center md:py-6 py-3 text-gray-400 md:text-xs text-[10px] border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 md:mb-6 mb-3">
                        <p>No audio imported</p>
                    </div>
                )}

                <h3 className="font-bold text-gray-800 md:mb-3 mb-1 md:text-sm text-[10px]">Stock Audio</h3>
                <div className="md:space-y-2 space-y-1 md:mb-6 mb-3">
                    {MOCK_AUDIO.map((audio) => (
                        <div
                            key={audio.id}
                            draggable={true}
                            onDragStart={(e) => {
                                e.dataTransfer.setData('application/json', JSON.stringify({
                                    type: 'audio',
                                    src: audio.src,
                                    name: audio.name,
                                    duration: parseDurationString(audio.duration)
                                }));
                            }}
                            className="flex items-center gap-3 md:p-3 p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-100 group relative cursor-grab active:cursor-grabbing"
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayPreview(audio.src, audio.id);
                                }}
                                className="md:w-8 md:h-8 w-6 h-6 rounded-full bg-blue-100 text-[#2F6BFF] flex items-center justify-center hover:bg-[#2F6BFF] hover:text-white transition-colors shrink-0"
                            >
                                {playingAudioId === audio.id ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                            </button>
                            <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => onAddClip(audio.name, 'audio')}
                            >
                                <p className="md:text-xs text-[10px] font-bold text-gray-700 truncate">{audio.name}</p>
                                <p className="md:text-[10px] text-[8px] text-gray-400">{audio.category} • {audio.duration}</p>
                            </div>
                            <button
                                onClick={() => onAddClip(audio.name, 'audio')}
                                className="opacity-0 group-hover:opacity-100 md:p-1.5 p-1 hover:bg-gray-200 rounded text-gray-500 transition-all"
                                title="Add to timeline"
                            >
                                <Plus className="md:size-4 size-3" size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            // case 'tools': return renderTools();
            case 'text': return renderText();
            case 'uploads': return renderUploads();
            case 'audio': return renderAudio();
            case 'images':
                return (
                    <div className="md:p-4 p-2 pb-24">
                        <div className="md:mb-4 mb-2 flex items-center bg-gray-100 rounded-lg md:px-3 px-2 border border-transparent focus-within:border-[#2F6BFF] focus-within:bg-white transition-all">
                            <Search className="md:size-4 size-3 text-gray-500" size={16} />
                            <input type="text" placeholder="Search photos" className="w-full bg-transparent md:p-2.5 p-1.5 text-sm outline-none" />
                        </div>
                        <h3 className="font-bold text-gray-800 md:mb-3 mb-1 md:text-sm text-[10px]">Trending Photos</h3>
                        <div className="grid md:grid-cols-2 grid-cols-2 md:gap-3 gap-1">
                            {MOCK_IMAGES.map((img) => (
                                <div key={img.id} draggable={true} onDragStart={(e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'image', src: img.src, name: img.name }));
                                }} className="md:aspect-[4/3] aspect-video rounded-lg overflow-hidden cursor-grab active:cursor-grabbing relative group" onClick={() => onAddClip(img.src, 'image')}>
                                    <img src={img.src} alt={img.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] p-2 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {img.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'videos':
                return (
                    <div className="p-4 pb-24">
                        <div className="md:mb-4 mb-2 flex items-center bg-gray-100 rounded-lg md:px-3 px-2 border border-transparent focus-within:border-[#2F6BFF] focus-within:bg-white transition-all">
                            <Search className="md:size-4 size-3 text-gray-500" size={16} />
                            <input type="text" placeholder="Search videos" className="w-full bg-transparent p-2.5 text-sm outline-none" />
                        </div>
                        <h3 className="font-bold text-gray-800 md:mb-3 mb-1 md:text-sm text-[10px]">Stock Videos</h3>
                        <div className="grid md:grid-cols-1 grid-cols-2 md:gap-3 gap-1">
                            {MOCK_VIDEOS.map((vid) => (
                                <div key={vid.id} draggable={true} onDragStart={(e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'video', src: vid.src, name: vid.name, thumbnail: vid.thumbnail, duration: parseDurationString(vid.duration) }));
                                }} className="md:aspect-video aspect-square rounded-lg overflow-hidden cursor-grab active:cursor-grabbing relative group bg-black shadow-sm hover:shadow-md transition-all" onClick={() => onAddClip(vid.src, 'video')}>
                                    <img src={vid.thumbnail} alt={vid.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="md:w-10 md:h-10 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/60 transition-colors scale-90 group-hover:scale-100">
                                            <div className="w-0 h-0 border-l-[10px] border-l-white border-y-[6px] border-y-transparent ml-1"></div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 left-2 text-white md:text-xs text-[8px] font-medium drop-shadow-md">
                                        {vid.name}
                                    </div>
                                    {vid.duration && (
                                        <div className="absolute top-1 right-1 bg-black/70 text-white md:text-[10px] text-[8px] font-medium md:px-1.5 px-1 md:py-0.5 py-0.25 rounded-md backdrop-blur-sm">
                                            {vid.duration}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'projects':
                return (
                    <div className="md:p-4 p-2 pb-24">
                        <div className="md:mb-4 mb-2 flex items-center bg-gray-100 rounded-lg md:px-3 px-2 border border-transparent focus-within:border-[#2F6BFF] focus-within:bg-white transition-all">
                            <Search className="md:size-4 size-3 text-gray-500" size={16} />
                            <input type="text" placeholder="Search content" className="w-full bg-transparent md:p-2.5 p-1.5 text-sm outline-none" />
                        </div>
                        <div className="grid md:grid-cols-2 grid-cols-2 md:gap-4 gap-1">
                            {MOCK_PROJECTS.map((p) => (
                                <div key={p.id} className="group cursor-pointer">
                                    <div className="md:aspect-video aspect-square bg-gray-200 rounded-lg overflow-hidden mb-2 shadow-sm group-hover:shadow-md transition-all border border-gray-200">
                                        <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <p className="md:text-xs text-[10px] font-bold text-gray-700 truncate group-hover:text-[#2F6BFF]">{p.name}</p>
                                    <p className="md:text-[10px] text-[8px] text-gray-400">{p.lastModified}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return <div className="md:p-4 p-2 text-gray-500 md:text-sm text-[10px]">Select a category to see items.</div>;
        }
    };

    return (
        <div className={`bg-white h-full border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative z-20 ${isOpen ? 'md:w-80 w-36' : 'w-0 opacity-0'}`}>
            {/* 
        Using a fixed width inner container (w-80) ensures that the content doesn't reflow 
        awkwardly while the parent container animates from 0px to 320px.
        overflow-x-hidden handles cases where scrollbars might slightly reduce available width.
      */}
            <div className="md:w-80 w-36 h-full flex flex-col overflow-x-hidden">
                <div className="md:h-16 h-10 flex items-center justify-between md:px-5 px-3 border-b border-gray-100 shrink-0 bg-white z-10">
                    <span className="font-bold text-gray-800 capitalize md:text-lg text-[10px] tracking-tight">{activeTab === 'images' ? 'Photos' : activeTab}</span>
                    <button onClick={onClose} className="md:p-2 p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <X className="md:size-4 size-3" size={18} />
                    </button>
                </div>
                <div className="md:flex-1 flex-auto overflow-y-auto custom-scrollbar bg-white">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ResourcePanel;
