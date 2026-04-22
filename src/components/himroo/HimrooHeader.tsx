import React from 'react';
import { HimrooVersion } from './types';

interface HimrooHeaderProps {
  currentVersion: HimrooVersion;
  onVersionChange: (version: HimrooVersion) => void;
}

const HimrooHeader: React.FC<HimrooHeaderProps> = ({
  currentVersion,
  onVersionChange,
}) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Himroo Generator</h2>
        <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
          {(['v1', 'v2', 'v3'] as HimrooVersion[]).map((v) => (
            <button
              key={v}
              onClick={() => onVersionChange(v)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentVersion === v
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-white/40 leading-relaxed">
        {currentVersion === 'v1' && 'AUTHENTIC: Source-faithful Himroo world from Maharashtra.'}
        {currentVersion === 'v2' && 'ARTISAN: Creative expansion of Himroo field logic.'}
        {currentVersion === 'v3' && 'CINEMATIC: 3D realistic Himroo world.'}
      </p>
    </div>
  );
};

export default HimrooHeader;
