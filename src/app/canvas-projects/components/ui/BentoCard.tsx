import React from 'react';

interface BentoCardProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    bg: string;
}

export function BentoCard({ title, subtitle, icon, bg }: BentoCardProps) {
    return (
        <div className={`p-8 rounded-3xl border border-white/5 ${bg} hover:border-white/10 transition-colors group`}>
            <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:bg-[#60a5fa] group-hover:text-black transition-all">{icon}</div>
            <h3 className="text-xl font-medium text-white mb-1">{title}</h3>
            <p className="text-slate-500">{subtitle}</p>
        </div>
    );
}
