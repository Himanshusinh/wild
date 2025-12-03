import React from 'react';
import { Crown } from 'lucide-react';

interface ModelItemProps {
    title: string;
    desc?: string;
    pro?: boolean;
    small?: boolean;
}

export function ModelItem({ title, desc, pro, small }: ModelItemProps) {
    return (
        <div className="group/item">
            <div className={`font-bold text-white group-hover/item:text-[#60a5fa] transition-colors flex items-center gap-1.5 ${small ? 'text-sm' : 'text-lg'}`}>
                {title}
                {pro && <Crown size={12} className="text-[#60a5fa] fill-[#60a5fa]" />}
            </div>
            {!small && <div className="text-[10px] text-white/60">{desc}</div>}
        </div>
    );
}
