import React from 'react';
import { StyleFilterDropdown } from '@/components/ui/StyleFiltersBar';
import { STYLES } from '@/styles/creativeStyleCatalog';
import { X } from 'lucide-react';
import { NagaBodyClothVersion } from './types';

interface NagaBodyClothHeaderProps {currentVersion: NagaBodyClothVersion;
  onVersionChange: (version: NagaBodyClothVersion) => void;
  onClose: () => void;
  disabled?: boolean;
}

const STYLE_LABELS: Record<string, { badge: string }> = {
  v1: { badge: "AUTHENTIC" },
  v2: { badge: "ARTISAN" },
  v3: { badge: "CINEMATIC" },
};

const NagaBodyClothHeader: React.FC<NagaBodyClothHeaderProps> = ({
  currentVersion,
  onVersionChange,
  onClose,
}) => {
  const versions: NagaBodyClothVersion[] = ['v1', 'v2', 'v3'];
  const styleNameOptions = React.useMemo(() => STYLES.map((item) => ({ value: item.id, label: item.title })), []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0E0E12] px-5">
      <div className="flex items-center gap-3">
        {/* Style Title Pill */}
        <StyleFilterDropdown
          ariaLabel="Select style"
          value="nagabodycloth"
          options={styleNameOptions}
          onChange={(styleId) => {
            onClose();
            window.dispatchEvent(
              new CustomEvent("wm:style-navigate", { detail: { styleId } }),
            );
          }}
          className="w-[220px]"
          buttonClassName="flex h-[30px] w-full items-center justify-between gap-1.5 rounded-full border border-[#2F6BFF]/25 bg-[#2F6BFF]/[0.08] px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[#60a5fa] outline-none transition hover:border-[#2F6BFF]/40 hover:bg-[#2F6BFF]/[0.14]"
        />

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

export default NagaBodyClothHeader;
