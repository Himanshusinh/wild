import React from 'react';
import { X } from 'lucide-react';
import { HoysalaReliefVersion } from './types';

interface HoysalaReliefHeaderProps {
  currentVersion: HoysalaReliefVersion;
  onVersionChange: (version: HoysalaReliefVersion) => void;
  onClose: () => void;
}

const STYLE_LABELS: Record<string, { badge: string }> = {
  v1: { badge: "AUTHENTIC" },
  v2: { badge: "ARTISAN" },
  v3: { badge: "CINEMATIC" },
};

const HoysalaReliefHeader: React.FC<HoysalaReliefHeaderProps> = ({
  currentVersion,
  onVersionChange,
  onClose,
}) => {
  const versions: HoysalaReliefVersion[] = ['v1', 'v2', 'v3'];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0E0E12] px-5">
      <div className="flex items-center gap-3">
        {/* Style Title Pill */}
        <div className="flex items-center gap-1.5 rounded-full border border-[#2F6BFF]/25 bg-[#2F6BFF]/[0.08] px-2.5 py-[5px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2F6BFF] shadow-[0_0_5px_rgba(47,107,255,0.8)]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#60a5fa] whitespace-nowrap">
            Hoysala Relief
          </span>
        </div>

        {/* Version Selector */}
        <div className="ml-1 flex gap-0.5 rounded-xl border border-white/10 bg-[#13131a] p-[3px]">
          {versions.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onVersionChange(v)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-[5px] text-[11px] font-medium transition-all duration-150 ${
                currentVersion === v
                  ? "bg-[#1e1e28] text-white/85 shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
                  : "text-white/30 hover:text-white/55"
              }`}
            >
              <span>{v.toUpperCase()}</span>
              <span
                className={`rounded-[4px] px-[5px] py-px text-[9px] font-semibold tracking-[0.04em] ${
                  currentVersion === v
                    ? "bg-[#2F6BFF]/[0.12] text-[#60a5fa]"
                    : "bg-white/[0.04] text-white/20"
                }`}
              >
                {STYLE_LABELS[v].badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/30 transition hover:bg-white/[0.08] hover:text-white/70"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  );
};

export default HoysalaReliefHeader;
