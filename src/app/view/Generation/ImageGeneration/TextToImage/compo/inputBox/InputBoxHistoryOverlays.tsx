"use client";

import React from "react";
import { GifLoader } from "./GifLoader";

export type InputBoxHistoryOverlaysProps = {
  userData: unknown;
  isInlineEditImagePage: boolean;
  loading: boolean;
  hasAttemptedInitialLoadRef: React.MutableRefObject<boolean>;
  historyEntriesLength: number;
  activeGenerationsLength: number;
  isMobileDateFiltering: boolean;
  isFiltering: boolean;
  isSorting: boolean;
  sortOrder: "asc" | "desc";
};

export function InputBoxHistoryOverlays({
  userData,
  isInlineEditImagePage,
  loading,
  hasAttemptedInitialLoadRef,
  historyEntriesLength,
  activeGenerationsLength,
  isMobileDateFiltering,
  isFiltering,
  isSorting,
  sortOrder,
}: InputBoxHistoryOverlaysProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Spacer to keep content below fixed header */}

      {/* Initial loading overlay - show when loading OR before initial load attempt */}
      {/* CRITICAL FIX: Don't show full screen loader if we have active generations to show */}
      {userData &&
        !isInlineEditImagePage &&
        (loading || !hasAttemptedInitialLoadRef.current) &&
        historyEntriesLength === 0 &&
        activeGenerationsLength === 0 && (
          <div className="fixed top-[64px] md:top-[64px]  left-0 right-0 md:left-[4.5rem] bottom-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 px-4">
              <GifLoader size={72} alt="Loading" />
              <div className="text-white text-lg text-center">
                Loading generations...
              </div>
            </div>
          </div>
        )}

      {!isInlineEditImagePage && isMobileDateFiltering && (
        <div className="fixed top-[64px] left-0 right-0 bottom-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-sm pointer-events-none md:hidden">
          <div className="flex flex-col items-center gap-4 px-4">
            <GifLoader size={72} alt="Filtering by date" />
            <div className="text-white text-lg text-center">
              Filtering generations...
            </div>
          </div>
        </div>
      )}

      {/* Filtering overlay - show when filtering/searching */}
      {!isInlineEditImagePage && isFiltering && (
        <div className="fixed top-[64px] left-0 right-0 md:left-[4.5rem] bottom-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-4">
            <GifLoader size={72} alt="Filtering" />
            <div className="text-white text-lg text-center">
              Filtering generations...
            </div>
          </div>
        </div>
      )}

      {/* Sorting overlay - show when sorting changes */}
      {!isInlineEditImagePage && isSorting && (
        <div className="fixed top-[64px] left-0 right-0 md:left-[4.5rem] bottom-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-4">
            <GifLoader size={72} alt="Sorting" />
            <div className="text-white text-lg text-center">
              Loading {sortOrder === "asc" ? "oldest" : "recent"}{" "}
              generations...
            </div>
          </div>
        </div>
      )}
    </>
  );
}
