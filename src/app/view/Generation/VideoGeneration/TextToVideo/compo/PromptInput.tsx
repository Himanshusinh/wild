
import React from "react";
import { Sparkles } from 'lucide-react';

interface PromptInputProps {
  prompt: string;
  onChange: (value: string) => void;
  onPasteFiles: (files: File[]) => void;
  isEnhancing: boolean;
  onEnhance: () => void;
  onClear: () => void;
  placeholder?: string;
  actions?: React.ReactNode;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}

const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  onChange,
  onPasteFiles,
  isEnhancing,
  onEnhance,
  onClear,
  placeholder,
  actions,
  inputRef
}) => {
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 96)}px`;
  };

  React.useEffect(() => {
    if (inputRef?.current) {
      adjustTextareaHeight(inputRef.current);
    }
  }, [prompt, inputRef]);

  return (
    <div className="flex items-start md:gap-3 gap-0 p-0 relative z-10">
      <div className="flex-1 flex items-start gap-2 bg-transparent md:rounded-lg rounded-md pr-0 md:p-0 p-0">
        <textarea
          ref={inputRef}
          placeholder={placeholder}
          value={prompt}
          onChange={(e) => {
            onChange(e.target.value);
            adjustTextareaHeight(e.target);
          }}
          spellCheck={true}
          lang="en"
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="on"
          className={`flex-1 bg-transparent text-white placeholder-white/50 outline-none md:text-[13px] font-thin text-[11px] leading-relaxed resize-none overflow-y-auto transition-all duration-200 ${prompt ? 'text-white' : 'text-white/70'} ${isEnhancing ? 'animate-text-shine' : ''}`}
          rows={1}
          style={{
            minHeight: '90px',
            maxHeight: '90px',
            lineHeight: '1.2',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}
          onPaste={(e) => {
            if (e.clipboardData.files && e.clipboardData.files.length > 0) {
              const files = Array.from(e.clipboardData.files);
              onPasteFiles(files);
              // We don't prevent default here for text, but if it's purely files maybe we should?
              // Original code didn't strictly prevent default for text unless it handled images.
              // Logic:
              const imageFiles = files.filter(f => f.type.startsWith('image/'));
              const videoFiles = files.filter(f => f.type.startsWith('video/'));
              if (imageFiles.length > 0 || videoFiles.length > 0) {
                e.preventDefault();
              }
            }
          }}
        />
        {/* Fixed position buttons container */}
        <div className="flex items-center md:gap-0 gap-0 flex-shrink-0 md:p-0 p-0">
          {prompt.trim() && (
            <div className="relative">
              <button
                onClick={onClear}
                className="p-1 rounded-lg bg-transparent hover:bg-white/10 transition cursor-pointer flex items-center justify-center peer"
                aria-label="Clear prompt"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white/80"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">Clear Prompt</div>
            </div>
          )}
          {/* Enhance Prompt Button */}
          {prompt.trim() && (
            <div className="relative ml-1">
              <button
                onClick={onEnhance}
                disabled={isEnhancing}
                className={`p-1 rounded-lg bg-transparent hover:bg-white/10 transition cursor-pointer flex items-center justify-center peer ${isEnhancing ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Enhance prompt"
              >
                {isEnhancing ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={14} className="text-white/90" />
                )}
              </button>
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">Enhance Prompt</div>
            </div>
          )}
          
          <div className="flex items-center gap-1 h-[20px]">
             {actions}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
