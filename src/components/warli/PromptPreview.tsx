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
    <div className="overflow-hidden rounded-xl border border-white/10 bg-transparent">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/25 transition hover:text-white/45"
        >
          Prompt
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-white/30 transition hover:border-white/20 hover:text-white/60"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </button>
        </div>
      </div>
      {open ? (
        <div className="max-h-[160px] overflow-y-auto px-4 py-3 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1">
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-[1.7] text-white/25">
            {prompt}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
