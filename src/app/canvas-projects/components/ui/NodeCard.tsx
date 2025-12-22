import React from 'react';

interface NodeCardProps {
    x: string;
    y: string;
    label: string;
    type: string;
    active?: boolean;
}

export function NodeCard({ x, y, label, type, active }: NodeCardProps) {
    return (
        <div className={`absolute ${x} ${y} z-10 p-4 bg-[#111] border ${active ? 'border-[#60a5fa] shadow-[0_0_30px_rgba(96,165,250,0.2)]' : 'border-[#333]'} rounded-xl w-48 transition-all`}>
            <div className="flex justify-between items-center mb-3">
                <span className={`text-[10px] font-mono uppercase ${active ? 'text-[#60a5fa]' : 'text-slate-500'}`}>{type}</span>
                <div className={`w-2 h-2 rounded-full ${active ? 'bg-[#60a5fa]' : 'bg-[#333]'}`}></div>
            </div>
            <div className="h-2 w-2/3 bg-[#333] rounded mb-2"></div>
            <div className="h-2 w-1/2 bg-[#333] rounded"></div>
            <div className="mt-3 text-xs text-slate-400 font-medium">{label}</div>
        </div>
    );
}
