"use client";

import React from "react";
import { Loader2, Wrench, Sparkles } from "lucide-react";

export type ToolPill = {
  tool: string;
  label: string;
  status?: string;
};

export function AgentStateDisplay(props: {
  isThinking: boolean;
  thinkingText?: string | null;
  toolPills?: ToolPill[];
}) {
  const pills = props.toolPills ?? [];
  return (
    <div className="flex flex-col gap-2">
      {props.isThinking ? (
        <div className="inline-flex items-center gap-2 text-xs text-zinc-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{props.thinkingText ?? "Thinking…"}</span>
        </div>
      ) : null}

      {pills.length ? (
        <div className="flex flex-wrap gap-2">
          {pills.slice(-6).map((p) => (
            <span
              key={`${p.tool}-${p.label}-${p.status ?? "called"}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/40 px-2.5 py-1 text-[11px] text-zinc-200"
              title={p.tool}
            >
              {p.tool.includes("plan") ? (
                <Sparkles className="h-3 w-3 text-amber-300" />
              ) : (
                <Wrench className="h-3 w-3 text-sky-300" />
              )}
              <span className="truncate max-w-[220px]">{p.label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

