'use client';

import React from 'react';
import { Cpu } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedModel } from '@/store/slices/generationSlice';

const LiveChatModelsDropdown: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((s: any) => s.generation?.selectedModel || 'flux-kontext-pro');

  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const models = [
    { name: 'Flux Kontext Pro', value: 'flux-kontext-pro' },
    { name: 'Flux Kontext Max', value: 'flux-kontext-max' },
  ];

  const currentName = selectedModel === 'flux-kontext-max' ? 'Flux Kontext Max' : 'Flux Kontext Pro';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          selectedModel ? 'bg-white text-black' : 'bg-transparent text-white/90 hover:bg-white/5'
        }`}
      >
        <Cpu className="w-4 h-4 mr-1" />
        {currentName}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-50">
          {models.map((model) => (
            <button
              key={model.value}
              onClick={() => {
                dispatch(setSelectedModel(model.value));
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                selectedModel === model.value ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span>{model.name}</span>
              {selectedModel === model.value && <div className="w-2 h-2 bg-black rounded-full"></div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveChatModelsDropdown;


