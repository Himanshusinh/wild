"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface PromptPreviewProps {
  prompt: string;
}

export function PromptPreview({ prompt }: PromptPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="">
      <div className="flex items-center justify-start gap-3 px-4 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition hover:text-white"
        >
          Prompt
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition hover:text-white hover:scale-110"
            title="Copy Prompt"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      {open ? (
        <div className="max-h-[160px] overflow-y-auto px-4 py-3 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1">
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-[1.7] text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {prompt}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
