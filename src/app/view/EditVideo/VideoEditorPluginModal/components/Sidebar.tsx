
import React from 'react';
import {
    Type, UploadCloud, FolderKanban,
    Image, Video, Sparkles, Music
} from 'lucide-react';
import { Tab } from '../types';

interface SidebarProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    const tools = [
        { id: 'text', icon: Type, label: 'Text' },
        { id: 'uploads', icon: UploadCloud, label: 'Uploads' },
        { id: 'images', icon: Image, label: 'Photos' },
        { id: 'videos', icon: Video, label: 'Videos' },
        { id: 'audio', icon: Music, label: 'Audio' },
        { id: 'projects', icon: FolderKanban, label: 'Projects' },
    ];

    return (
        <div className="md:w-[72px] w-16 bg-black text-gray-400 flex flex-col h-full z-30 shrink-0 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col py-2">
                {tools.map((tool) => {
                    const isActive = activeTab === tool.id;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTab(tool.id as Tab)}
                            className={`flex flex-col items-center justify-center md:py-4 py-2 w-full transition-all relative shrink-0 ${isActive ? 'bg-[#252627] text-white' : 'hover:text-gray-100 hover:bg-[#1f2021]'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r"></div>
                            )}
                            <tool.icon className="md:size-4 size-3 " size={24} strokeWidth={1.5} />
                            <span className="md:text-sm text-[10px] font-medium md:mb-1.5 mb-0.5">{tool.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 min-h-[20px]"></div>

        </div>
    );
};

export default Sidebar;
