"use client";

import React from "react";
import {
  Menu,
  Search,
  X,
  SlidersHorizontal,
  CalendarDays,
  ImageIcon,
  SquarePen,
  Edit3,
} from "lucide-react";
import HistoryControls from "@/app/view/Generation/VideoGeneration/TextToVideo/compo/HistoryControls";

export type InputBoxHistoryChromeProps = {
  pathname: string | null;
  userData: unknown;
  /** Same condition as before: historyEntries.length > 0 && sortedDatesWithVisibleTiles.length > 0 */
  showGuideInfoButton: boolean;
  onOpenSidebar: () => void;
  onOpenGuide: () => void;
  onNavigateImageTab: () => void;
  onNavigateEditTab: () => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  refreshHistoryFromBackend: (next?: {
    sortOrder?: "asc" | "desc";
    dateRange?: { start: Date | null; end: Date | null };
    search?: string;
  }) => Promise<void>;
  dateInputRef: React.RefObject<HTMLInputElement | null>;
  dateInput: string;
  setDateInput: (v: string) => void;
  mobileDateInputMax: string;
  runMobileDateFilterRefresh: (action: () => Promise<void>) => Promise<void>;
  isFutureMobileCalendarDate: (d: Date) => boolean;
  mobileFilterMenuRef: React.RefObject<HTMLDivElement | null>;
  isMobileFilterMenuOpen: boolean;
  setIsMobileFilterMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showCalendar: boolean;
  setShowCalendar: React.Dispatch<React.SetStateAction<boolean>>;
  sortOrder: "asc" | "desc";
  onSortChange: (order: "asc" | "desc") => Promise<void>;
  dateRange: { start: Date | null; end: Date | null };
  calendarRef: React.RefObject<HTMLDivElement | null>;
  calendarYear: number;
  calendarMonth: number;
  setCalendarYear: (y: number) => void;
  setCalendarMonth: (m: number) => void;
  calendarFirstWeekday: number;
  calendarDaysInMonth: number;
};

export function InputBoxHistoryChrome({
  pathname,
  userData,
  showGuideInfoButton,
  onOpenSidebar,
  onOpenGuide,
  onNavigateImageTab,
  onNavigateEditTab,
  searchQuery,
  setSearchQuery,
  refreshHistoryFromBackend,
  dateInputRef,
  dateInput,
  setDateInput,
  mobileDateInputMax,
  runMobileDateFilterRefresh,
  isFutureMobileCalendarDate,
  mobileFilterMenuRef,
  isMobileFilterMenuOpen,
  setIsMobileFilterMenuOpen,
  showCalendar,
  setShowCalendar,
  sortOrder,
  onSortChange,
  dateRange,
  calendarRef,
  calendarYear,
  calendarMonth,
  setCalendarYear,
  setCalendarMonth,
  calendarFirstWeekday,
  calendarDaysInMonth,
}: InputBoxHistoryChromeProps) {
  const hasUserData = Boolean(userData);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#0E0E12]/80 backdrop-blur-xl border-b border-white/5 shadow-xl transition-all duration-300 md:py-0 md:pl-20">
        <div className="mb-0 flex min-h-10 md:min-h-12 items-center justify-between pl-2 pr-2 md:h-auto md:pl-0">
          <div className="flex w-full min-w-0 items-center gap-1.5 pl-11 md:mt-3 md:w-auto md:gap-2 md:pl-0">
            <button
              onClick={onOpenSidebar}
              className="md:hidden fixed top-0 left-0 z-[60] flex h-10 w-10 items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h2 className="min-w-0 flex-1 truncate whitespace-nowrap pr-1 pb-[1px] text-base font-bold leading-tight tracking-tight text-white md:flex-none md:pr-0 md:text-2xl">
              Image Generation
            </h2>

            {/* Edit Button - Styled like Recent/Oldest */}

            {/* Info button - only show when there are generations */}
            {showGuideInfoButton && (
              <button
                onClick={onOpenGuide}
                className="relative group flex h-4.5 w-4.5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 md:h-6 md:w-6"
                aria-label="Show guide"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="md:h-4 md:w-4"
                >
                  <path
                    d="M10.9199 10.4384C10.9199 9.84191 11.4034 9.3584 11.9999 9.3584C12.5963 9.3584 13.0798 9.84191 13.0798 10.4384C13.0798 10.804 12.8988 11.1275 12.6181 11.3241C12.3474 11.5136 12.0203 11.7667 11.757 12.0846C11.4909 12.406 11.2499 12.8431 11.2499 13.3846C11.2499 13.7988 11.5857 14.1346 11.9999 14.1346C12.4141 14.1346 12.7499 13.7988 12.7499 13.3846C12.7499 13.3096 12.7806 13.2004 12.9123 13.0413C13.047 12.8786 13.2441 12.7169 13.4784 12.5528C14.1428 12.0876 14.5798 11.3141 14.5798 10.4384C14.5798 9.01348 13.4247 7.8584 11.9999 7.8584C10.575 7.8584 9.41992 9.01348 9.41992 10.4384C9.41992 10.8526 9.75571 11.1884 10.1699 11.1884C10.5841 11.1884 10.9199 10.8526 10.9199 10.4384Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M11.9991 14.6426C11.5849 14.6426 11.2491 14.9783 11.2491 15.3926C11.2491 15.8068 11.5849 16.1426 11.9991 16.1426C12.4134 16.1426 12.7499 15.8068 12.7499 15.3926C12.7499 14.9783 12.4134 14.6426 11.9991 14.6426Z"
                    fill="#ffffff"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 4C7.58172 4 4 7.58172 4 12V20H12C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12C21.5 17.2467 17.2467 21.5 12 21.5H3.25C2.83579 21.5 2.5 21.1642 2.5 20.75V12Z"
                    fill="#ffffff"
                  />
                </svg>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-50">
                  How To Use
                </div>
              </button>
            )}

            <button
              onClick={onNavigateImageTab}
              className={`flex h-6 w-6 shrink-0 items-center justify-center gap-1 px-0 py-0 text-[11px] transition-all whitespace-nowrap rounded-md md:h-auto md:w-auto md:gap-1.5 md:px-2 md:py-1 md:text-xs ${pathname?.startsWith("/text-to-image") && !pathname?.startsWith("/text-to-image/edit-image") ? "border border-transparent bg-white font-medium text-black" : "border border-white/20 text-white/100 hover:bg-white/5"}`}
              aria-label="Image"
            >
              <ImageIcon
                size={14}
                className={`${pathname?.startsWith("/text-to-image") && !pathname?.startsWith("/text-to-image/edit-image") ? "text-black " : "text-white "}`}
              />
              <span className="hidden md:block">Image</span>
            </button>

            <button
              onClick={() => {
                console.log(
                  "[Edit Button] Clicked! Navigating to /text-to-image/edit-image",
                );
                onNavigateEditTab();
              }}
              className={`flex h-6 w-6 shrink-0 items-center justify-center gap-1 px-0 py-0 text-[11px] transition-all whitespace-nowrap rounded-md md:h-auto md:w-auto md:gap-1.5 md:px-2 md:py-1 md:text-xs ${pathname?.startsWith("/text-to-image/edit-image") ? "border border-transparent bg-white font-medium text-black" : "border border-white/20 text-white/100 hover:bg-white/5"}`}
              aria-label="Edit Image"
            >
              <SquarePen
                size={14}
                className={`${pathname?.startsWith("/text-to-image/edit-image") ? "text-black " : "text-white "}`}
              />
              <span className="hidden md:block">Edit</span>
            </button>

            <button
              onClick={() => {
                const isLocal =
                  window.location.hostname === "localhost" ||
                  window.location.hostname === "127.0.0.1";
                const url = isLocal
                  ? "http://localhost:3002"
                  : "https://editor-image.wildmindai.com/";
                window.open(url, "_blank");
              }}
              className="hidden h-6 w-6 shrink-0 items-center justify-center gap-1 rounded-md border border-white/20 px-0 py-0 text-[11px] text-white/100 transition-all whitespace-nowrap hover:bg-white/5 md:flex md:h-auto md:w-auto md:gap-1.5 md:px-2 md:py-1 md:text-xs"
              aria-label="Image Editor"
            >
              <Edit3 size={14} className="text-white" />
              <span className="hidden md:block">Image editor</span>
            </button>
          </div>

          {/* Desktop: Search, Sort, and Date controls - positioned at right end of Image Generation text */}
          {hasUserData && !pathname?.startsWith("/text-to-image/edit-image") && (
            <div className="hidden md:flex items-center pr-4">
              <HistoryControls mode="image" className="mb-0 pt-0" />
            </div>
          )}
        </div>

        {hasUserData && !pathname?.startsWith("/text-to-image/edit-image") && (
          <div className="px-3 pb-1 md:hidden">
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/35" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      await refreshHistoryFromBackend({
                        search: searchQuery,
                      });
                    }
                  }}
                  placeholder="Search prompt..."
                  className="h-6 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-8.5 pr-8 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:bg-white/[0.06]"
                />
                {searchQuery && (
                  <button
                    onClick={async () => {
                      setSearchQuery("");
                      await refreshHistoryFromBackend({ search: "" });
                    }}
                    className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white/80"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div ref={mobileFilterMenuRef} className="relative shrink-0">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dateInput}
                  max={mobileDateInputMax}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setDateInput(value);
                    await runMobileDateFilterRefresh(async () => {
                      if (!value) {
                        await refreshHistoryFromBackend({
                          dateRange: { start: null, end: null },
                        });
                        return;
                      }
                      const d = new Date(value + "T00:00:00");
                      if (isFutureMobileCalendarDate(d)) {
                        setDateInput("");
                        return;
                      }
                      const start = new Date(
                        d.getFullYear(),
                        d.getMonth(),
                        d.getDate(),
                        0,
                        0,
                        0,
                      );
                      const end = new Date(
                        d.getFullYear(),
                        d.getMonth(),
                        d.getDate(),
                        23,
                        59,
                        59,
                        999,
                      );
                      await refreshHistoryFromBackend({
                        dateRange: { start, end },
                      });
                    });
                  }}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                />

                <button
                  onClick={() => {
                    setIsMobileFilterMenuOpen((prev) => !prev);
                    setShowCalendar(false);
                  }}
                  className={`relative flex h-6 w-6 items-center justify-center rounded-lg border transition ${isMobileFilterMenuOpen || sortOrder === "asc" || !!dateRange.start ? "border-white/20 bg-white text-black" : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"}`}
                  aria-label="Open filters"
                  aria-expanded={isMobileFilterMenuOpen}
                >
                  <SlidersHorizontal size={15} />
                  {(sortOrder === "asc" || !!dateRange.start) && (
                    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
                  )}
                </button>

                {isMobileFilterMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-white/10 bg-[#111117]/95 p-2 shadow-2xl backdrop-blur-xl">
                    <button
                      onClick={async () => {
                        setIsMobileFilterMenuOpen(false);
                        setShowCalendar(false);
                        await onSortChange("desc");
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${sortOrder === "desc" ? "bg-white text-black" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
                    >
                      <span>Newest</span>
                      <img
                        src="https://idr01.zata.ai/devstoragev1/public/icons/upload-square-2%20(1).svg"
                        alt="Newest"
                        className={`h-4 w-4 ${sortOrder === "desc" ? "" : "invert opacity-80"}`}
                      />
                    </button>

                    <button
                      onClick={async () => {
                        setIsMobileFilterMenuOpen(false);
                        setShowCalendar(false);
                        await onSortChange("asc");
                      }}
                      className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${sortOrder === "asc" ? "bg-white text-black" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
                    >
                      <span>Oldest</span>
                      <img
                        src="https://idr01.zata.ai/devstoragev1/public/icons/download-square-2.svg"
                        alt="Oldest"
                        className={`h-4 w-4 ${sortOrder === "asc" ? "" : "invert opacity-80"}`}
                      />
                    </button>

                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        const base = dateRange.start
                          ? new Date(dateRange.start)
                          : new Date();
                        setCalendarMonth(base.getMonth());
                        setCalendarYear(base.getFullYear());
                        setShowCalendar((prev) => !prev);
                      }}
                      className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${showCalendar || !!dateRange.start ? "bg-white text-black" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
                    >
                      <span>
                        {dateRange.start ? "Change date" : "Pick date"}
                      </span>
                      <CalendarDays size={16} />
                    </button>

                    {showCalendar && (
                      <div
                        ref={calendarRef}
                        className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between text-white">
                          <button
                            className="rounded-lg px-2 py-1 hover:bg-white/10"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              const prev = new Date(
                                calendarYear,
                                calendarMonth - 1,
                                1,
                              );
                              setCalendarYear(prev.getFullYear());
                              setCalendarMonth(prev.getMonth());
                            }}
                          >
                            ‹
                          </button>
                          <div className="text-sm font-semibold">
                            {new Date(
                              calendarYear,
                              calendarMonth,
                              1,
                            ).toLocaleString(undefined, {
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                          <button
                            className="rounded-lg px-2 py-1 hover:bg-white/10"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = new Date(
                                calendarYear,
                                calendarMonth + 1,
                                1,
                              );
                              setCalendarYear(next.getFullYear());
                              setCalendarMonth(next.getMonth());
                            }}
                          >
                            ›
                          </button>
                        </div>
                        <div className="mb-1 grid grid-cols-7 text-[10px] text-white/45">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                            (day) => (
                              <div key={day} className="py-1 text-center">
                                {day}
                              </div>
                            ),
                          )}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: calendarFirstWeekday }).map(
                            (_, i) => (
                              <div
                                key={`mobile-pad-${i}`}
                                className="h-8"
                              />
                            ),
                          )}
                          {Array.from({ length: calendarDaysInMonth }).map(
                            (_, i) => {
                              const day = i + 1;
                              const thisDate = new Date(
                                calendarYear,
                                calendarMonth,
                                day,
                              );
                              const isSelected =
                                !!dateRange.start &&
                                new Date(dateRange.start).toDateString() ===
                                  thisDate.toDateString();
                              const isFuture =
                                isFutureMobileCalendarDate(thisDate);
                              return (
                                <button
                                  key={day}
                                  disabled={isFuture}
                                  aria-disabled={isFuture}
                                  className={`h-6 rounded-lg text-center text-xs transition ${
                                    isFuture
                                      ? "cursor-not-allowed bg-white/[0.03] text-white/10 opacity-35 ring-1 ring-white/[0.04]"
                                      : isSelected
                                        ? "bg-white text-black"
                                        : "bg-white/5 text-white hover:bg-white/15"
                                  }`}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={async (e) => {
                                    if (isFuture) return;
                                    e.stopPropagation();
                                    await runMobileDateFilterRefresh(
                                      async () => {
                                        const start = new Date(
                                          thisDate.getFullYear(),
                                          thisDate.getMonth(),
                                          thisDate.getDate(),
                                          0,
                                          0,
                                          0,
                                        );
                                        const end = new Date(
                                          thisDate.getFullYear(),
                                          thisDate.getMonth(),
                                          thisDate.getDate(),
                                          23,
                                          59,
                                          59,
                                          999,
                                        );
                                        setDateInput(
                                          thisDate
                                            .toISOString()
                                            .slice(0, 10),
                                        );
                                        await refreshHistoryFromBackend({
                                          dateRange: { start, end },
                                        });
                                      },
                                    );
                                    setShowCalendar(false);
                                    setIsMobileFilterMenuOpen(false);
                                  }}
                                >
                                  {day}
                                </button>
                              );
                            },
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <button
                            className="rounded-lg px-2 py-1 text-xs text-white/75 hover:bg-white/10 hover:text-white"
                            onClick={async () => {
                              await runMobileDateFilterRefresh(async () => {
                                setDateInput("");
                                await refreshHistoryFromBackend({
                                  dateRange: {
                                    start: null,
                                    end: null,
                                  },
                                });
                              });
                              setShowCalendar(false);
                              setIsMobileFilterMenuOpen(false);
                            }}
                          >
                            Clear
                          </button>
                          <button
                            className="rounded-lg px-2 py-1 text-xs text-white/75 hover:bg-white/10 hover:text-white"
                            onClick={() => {
                              const now = new Date();
                              setCalendarMonth(now.getMonth());
                              setCalendarYear(now.getFullYear());
                            }}
                          >
                            Today
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
