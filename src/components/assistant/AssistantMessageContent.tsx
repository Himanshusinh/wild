"use client";

import React from "react";

/** Renders assistant message with **bold** and newlines for a clean, readable UI. */
export default function AssistantMessageContent({ content }: { content: string }) {
  const lines = String(content ?? "").split(/\n/);
  const renderInline = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
      seg.startsWith("**") && seg.endsWith("**") ? (
        <strong key={j} className="font-semibold text-white">
          {seg.slice(2, -2)}
        </strong>
      ) : (
        seg
      ),
    );

  return (
    <div className="leading-[1.55]">
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {renderInline(line)}
        </React.Fragment>
      ))}
    </div>
  );
}

