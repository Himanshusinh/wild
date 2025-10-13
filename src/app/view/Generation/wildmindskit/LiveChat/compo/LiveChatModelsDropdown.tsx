'use client';

import React, { useRef, useEffect } from 'react';
import { Cpu, ChevronUp } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedModel } from '@/store/slices/generationSlice';
import { getModelCreditInfo } from '@/utils/modelCredits';

const LiveChatModelsDropdown: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((s: any) => s.generation?.selectedModel || 'flux-kontext-pro');

  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // 5-second auto-close timer
  useEffect(() => {
    if (open) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 20000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open]);

  const models = [
    { 
      name: 'Flux Kontext Pro', 
      value: 'flux-kontext-pro',
      // description: 'High-quality image generation'
    },
    { 
      name: 'Flux Kontext Max', 
      value: 'flux-kontext-max',
      // description: 'Maximum quality generation'
    },
    { 
      name: 'Google Nano Banana', 
      value: 'gemini-25-flash-image',
      // description: 'Fast Google model'
    },
  ];

  // Add credits information to models using the same utility as image generation
  const modelsWithCredits = models.map(model => {
    const creditInfo = getModelCreditInfo(model.value);
    return {
      ...model,
      credits: creditInfo.credits,
      displayName: creditInfo.hasCredits ? `${model.name} (${creditInfo.displayText})` : model.name
    };
  });

  const currentModel = modelsWithCredits.find(m => m.value === selectedModel);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          selectedModel !== 'flux-kontext-pro'
            ? 'bg-white text-black'
            : 'bg-transparent text-white/90 hover:bg-white/5'
        }`}
      >
        <Cpu className="w-4 h-4 mr-1" />
        {currentModel?.name || 'Models'}
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-black/90 backdrop-blur-3xl shadow-2xl z-50 rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
          {modelsWithCredits.map((model) => (
            <button
              key={model.value}
              onClick={() => {
                dispatch(setSelectedModel(model.value));
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${selectedModel === model.value
                ? 'bg-white text-black'
                : 'text-white/90 hover:bg-white/10'
                }`}
            >
              <div className="flex flex-col mb-1">
                <span>{model.name}</span>
                {model.credits && (
                  <span className="text-[11px] opacity-80 -mt-0.5 font-normal">{model.credits} credits</span>
                )}
              </div>
              {selectedModel === model.value && (
                <div className="w-2 h-2 bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveChatModelsDropdown;


