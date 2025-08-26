'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setTagLine } from '@/store/slices/generationSlice';

const TagLineButton = () => {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [draftText, setDraftText] = useState<string>('');
  
  const tagLine = useAppSelector((state: any) => state.generation?.tagLine || '');

  const open = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setDraftText(tagLine);
      setIsOpen(true);
    }
  };

  const closeWithoutSave = () => {
    setDraftText(tagLine);
    setIsOpen(false);
  };

  const saveAndClose = () => {
    dispatch(setTagLine(draftText));
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeWithoutSave();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [isOpen, draftText]);

  const displayLabel = tagLine ? (tagLine.length > 20 ? tagLine.slice(0, 17) + '...' : tagLine) : 'Tag Line';

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={open}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-1"
      >
        {displayLabel}
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 max-w-[80vw] z-[70]">
          <div className="rounded-xl bg-black/70 backdrop-blur-xl ring-1 ring-white/20 shadow-xl">
            <div className="flex items-start gap-2 p-3">
              <textarea
                ref={textareaRef}
                value={draftText}
                onChange={(e) => {
                  setDraftText(e.target.value);
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                  }
                }}
                placeholder={'Enter tag line...'}
                className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-relaxed resize-none w-full min-h-[44px] max-h-[240px]"
                rows={1}
              />
              <button
                className="p-2 rounded-lg hover:bg-white/10 transition"
                aria-label="Save"
                onClick={saveAndClose}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/90">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagLineButton;


