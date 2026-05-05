"use client";

import React from "react";

export type InputBoxShellProps = {
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  isAssistantOpen: boolean;
  children: React.ReactNode;
};

/** Scroll root wrapper for the image history + chrome layout (extracted from InputBox). */
export function InputBoxShell({
  scrollRootRef,
  isAssistantOpen,
  children,
}: InputBoxShellProps) {
  return (
    <div
      ref={scrollRootRef}
      className={`inset-0 pl-0 md:pr-6 overflow-y-auto no-scrollbar z-0 transition-all duration-500 ${
        isAssistantOpen ? "assistant-open" : ""
      }`}
    >
      {children}
    </div>
  );
}
