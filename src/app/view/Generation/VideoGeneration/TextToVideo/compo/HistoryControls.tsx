"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearHistory, setFilters } from "@/store/slices/historySlice";
import { loadHistory } from "@/store/slices/historySlice";

interface HistoryControlsProps {
  mode: "video" | "image" | "music" | "branding" | "all";
  className?: string;
  limit?: number; // Pagination limit (default: 20 for video, can be overridden for image)
  onSearchChange?: (search: string) => void;
  onSortChange?: (sortOrder: "asc" | "desc") => void;
  onDateChange?: (dateRange: { start: Date | null; end: Date | null }) => void;
  disableAutoFetch?: boolean;
}

export default function HistoryControls({
  mode = "image",
  className = "",
  limit,
  onSearchChange,
  onSortChange: onSortChangeCallback,
  onDateChange: onDateChangeCallback,
  disableAutoFetch = false,
}: HistoryControlsProps) {
  // Default limit: 20 for video/music, 60 for image (can be overridden)
  const paginationLimit = limit || (mode === "image" ? 60 : 20);
  const emphasizeDisabledDatesOnMobile = mode === "image" || mode === "video";
  const dispatch = useAppDispatch();
  const currentFilters = useAppSelector(
    (state: any) => state.history?.filters || {},
  );

  // Initialize from Redux state if available
  const initialSortOrder = currentFilters.sortOrder || "desc";
  const initialSearch = currentFilters.search || "";
  const initialDateRange = currentFilters.dateRange
    ? {
        start: currentFilters.dateRange.start
          ? new Date(currentFilters.dateRange.start)
          : null,
        end: currentFilters.dateRange.end
          ? new Date(currentFilters.dateRange.end)
          : null,
      }
    : { start: null, end: null };

  // Search state
  const [searchInput, setSearchInput] = useState<string>(initialSearch);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const searchDebounceRef = useRef<any>(null);
  const didInitSearchRef = useRef(false);

  // Sort state
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">(initialSortOrder);

  // Date state
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>(initialDateRange);
  const [dateInput, setDateInput] = useState<string>(
    initialDateRange.start
      ? initialDateRange.start.toISOString().slice(0, 10)
      : "",
  );
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isMobileFilterMenuOpen, setIsMobileFilterMenuOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<number>(
    initialDateRange.start
      ? initialDateRange.start.getMonth()
      : new Date().getMonth(),
  );
  const [calendarYear, setCalendarYear] = useState<number>(
    initialDateRange.start
      ? initialDateRange.start.getFullYear()
      : new Date().getFullYear(),
  );
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const calendarButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileFilterMenuRef = useRef<HTMLDivElement | null>(null);
  const [isMobileDateFiltering, setIsMobileDateFiltering] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const runMobileDateFilterRefresh = useCallback(
    async (action: () => Promise<void>) => {
      const isMobileViewport =
        typeof window !== "undefined" && window.innerWidth < 768;
      const startedAt = Date.now();
      if (isMobileViewport) setIsMobileDateFiltering(true);
      try {
        await action();
      } finally {
        if (!isMobileViewport) return;
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, 450 - elapsed);
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
        setIsMobileDateFiltering(false);
      }
    },
    [],
  );

  const didInitialLoadRef = useRef(false);
  const sortRequestInFlightRef = useRef(false);

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const calendarDaysInMonth = useMemo(
    () => new Date(calendarYear, calendarMonth + 1, 0).getDate(),
    [calendarYear, calendarMonth],
  );
  const calendarFirstWeekday = useMemo(
    () => new Date(calendarYear, calendarMonth, 1).getDay(),
    [calendarYear, calendarMonth],
  );

  // Calculate calendar position when it opens (for both mobile and desktop)
  useEffect(() => {
    if (showCalendar && calendarButtonRef.current) {
      const updatePosition = () => {
        if (calendarButtonRef.current) {
          const rect = calendarButtonRef.current.getBoundingClientRect();
          setCalendarPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
          });
        }
      };
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    } else {
      setCalendarPosition(null);
    }
  }, [showCalendar]);

  // Close calendar when clicking outside / pressing Escape
  useEffect(() => {
    if (!showCalendar) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't close if clicking on the calendar button (it will toggle itself)
      if (
        calendarButtonRef.current &&
        calendarButtonRef.current.contains(target)
      ) {
        return;
      }
      // Don't close if clicking inside the calendar popup
      if (calendarRef.current && calendarRef.current.contains(target)) {
        return;
      }
      // Close if clicking outside both button and calendar
      setShowCalendar(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowCalendar(false);
    };
    // Use a slight delay to ensure the button's onClick runs first
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", onDocClick);
    }, 0);
    document.addEventListener("keydown", onEsc);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showCalendar]);

  useEffect(() => {
    if (!isMobileFilterMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        mobileFilterMenuRef.current &&
        !mobileFilterMenuRef.current.contains(target)
      ) {
        setIsMobileFilterMenuOpen(false);
        setShowCalendar(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isMobileFilterMenuOpen]);

  // Search handler - use currentFilters.sortOrder from Redux to avoid dependency on local sortOrder state
  const applySearch = useCallback(
    async (nextSearch: string) => {
      const s = String(nextSearch || "").trim();
      setSearchQuery(s);

      // Use currentFilters.sortOrder from Redux to get the latest value, not local state
      // This prevents applySearch from being recreated when local sortOrder state changes
      const currentSortOrder = (currentFilters as any)?.sortOrder || "desc";

      didInitialLoadRef.current = true;
      dispatch(
        setFilters({
          ...currentFilters,
          mode,
          sortOrder: currentSortOrder,
          ...(s ? { search: s } : {}),
          ...(dateRange.start && dateRange.end
            ? {
                dateRange: {
                  start: dateRange.start.toISOString(),
                  end: dateRange.end.toISOString(),
                },
              }
            : {}),
        } as any),
      );

      if (onSearchChange) {
        onSearchChange(s);
      }

      // Silently return if auto-fetch is disabled
      if (disableAutoFetch) return;

      await (dispatch as any)(
        loadHistory({
          filters: {
            ...currentFilters,
            mode: mode === "all" ? undefined : mode,
            sortOrder: currentSortOrder,
            ...(s ? { search: s } : {}),
            ...(dateRange.start && dateRange.end
              ? {
                  dateRange: {
                    start: dateRange.start.toISOString(),
                    end: dateRange.end.toISOString(),
                  },
                }
              : {}),
          } as any,
          backendFilters: {
            ...currentFilters,
            mode: mode === "all" ? undefined : mode,
            sortOrder: currentSortOrder,
            ...(s ? { search: s } : {}),
            ...(dateRange.start && dateRange.end
              ? {
                  dateRange: {
                    start: dateRange.start.toISOString(),
                    end: dateRange.end.toISOString(),
                  },
                }
              : {}),
          } as any,
          paginationParams: { limit: paginationLimit },
          requestOrigin: "page",
          expectedType:
            mode === "video"
              ? "video"
              : mode === "music"
                ? "text-to-music"
                : mode === "branding"
                  ? "branding"
                  : mode === "all"
                    ? undefined
                    : "text-to-image",
          skipBackendGenerationFilter: mode === "image" || mode === "all", // Image and All modes use skipBackendGenerationFilter
          forceRefresh: true,
          debugTag: `HistoryControls:${mode}-search:${Date.now()}`,
        } as any),
      );
    },
    [
      dispatch,
      mode,
      currentFilters,
      dateRange,
      onSearchChange,
      paginationLimit,
      disableAutoFetch,
    ],
  );

  // Live prompt search (Freepik-style): as user types, debounce and query backend.
  useEffect(() => {
    // Skip first run (initial mount) to avoid an extra fetch.
    if (!didInitSearchRef.current) {
      didInitSearchRef.current = true;
      return;
    }

    const next = String(searchInput || "").trim();
    const applied = String(searchQuery || "").trim();
    if (next === applied) return;

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      applySearch(next);
    }, 350);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput, searchQuery, applySearch]);

  // Sort handler
  const onSortChange = useCallback(
    async (order: "asc" | "desc") => {
      // Prevent duplicate requests: check if already set to this order or request in flight
      if (sortOrder === order || sortRequestInFlightRef.current) {
        return;
      }

      // Set loading guard
      sortRequestInFlightRef.current = true;

      try {
        // Update state AFTER API call to prevent triggering other effects
        // Use the order parameter directly in API calls, not state
        if (onSortChangeCallback) {
          onSortChangeCallback(order);
        }

        // If auto-fetch is disabled, we stop here (parent handles fetch)
        if (disableAutoFetch) {
          setSortOrder(order);
          return;
        }

        didInitialLoadRef.current = true;
        dispatch(
          setFilters({
            ...currentFilters,
            mode,
            sortOrder: order,
            ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
            ...(dateRange.start && dateRange.end
              ? {
                  dateRange: {
                    start: dateRange.start.toISOString(),
                    end: dateRange.end.toISOString(),
                  },
                }
              : {}),
          } as any),
        );
        await (dispatch as any)(
          loadHistory({
            filters: {
              ...currentFilters,
              mode: mode === "all" ? undefined : mode,
              sortOrder: order,
              ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
              ...(dateRange.start && dateRange.end
                ? {
                    dateRange: {
                      start: dateRange.start.toISOString(),
                      end: dateRange.end.toISOString(),
                    },
                  }
                : {}),
            } as any,
            backendFilters: {
              ...currentFilters,
              mode: mode === "all" ? undefined : mode,
              sortOrder: order,
              ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
              ...(dateRange.start && dateRange.end
                ? {
                    dateRange: {
                      start: dateRange.start.toISOString(),
                      end: dateRange.end.toISOString(),
                    },
                  }
                : {}),
            } as any,
            paginationParams: { limit: paginationLimit },
            requestOrigin: "page",
            expectedType:
              mode === "video"
                ? "video"
                : mode === "music"
                  ? "text-to-music"
                  : mode === "branding"
                    ? "branding"
                    : mode === "all"
                      ? undefined
                      : "text-to-image",
            skipBackendGenerationFilter: mode === "image" || mode === "all", // Image and All modes use skipBackendGenerationFilter
            forceRefresh: true,
            debugTag: `HistoryControls:${mode}-sort:${order}:${Date.now()}`,
          } as any),
        );

        // Update local state AFTER successful API call to prevent triggering applySearch recreation
        setSortOrder(order);
      } finally {
        // Release loading guard after a short delay to prevent rapid clicks
        setTimeout(() => {
          sortRequestInFlightRef.current = false;
        }, 500);
      }
    },
    [
      dispatch,
      mode,
      dateRange,
      searchQuery,
      sortOrder,
      onSortChangeCallback,
      paginationLimit,
    ],
  );

  // Date change handler
  const onDateChange = useCallback(
    async (
      next: { start: Date | null; end: Date | null },
      nextInput?: string,
    ) => {
      setDateRange(next);
      if (typeof nextInput === "string") setDateInput(nextInput);
      if (onDateChangeCallback) {
        onDateChangeCallback(next);
      }

      // If auto-fetch is disabled, we stop here (parent handles fetch)
      if (disableAutoFetch) return;

      didInitialLoadRef.current = true;
      dispatch(
        setFilters({
          ...currentFilters,
          mode,
          sortOrder,
          ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
          ...(next.start && next.end
            ? {
                dateRange: {
                  start: next.start.toISOString(),
                  end: next.end.toISOString(),
                },
              }
            : {}),
        } as any),
      );
      await (dispatch as any)(
        loadHistory({
          filters: {
            ...currentFilters,
            mode: mode === "all" ? undefined : mode,
            sortOrder,
            ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
            ...(next.start && next.end
              ? {
                  dateRange: {
                    start: next.start.toISOString(),
                    end: next.end.toISOString(),
                  },
                }
              : {}),
          } as any,
          backendFilters: {
            ...currentFilters,
            mode: mode === "all" ? undefined : mode,
            sortOrder,
            ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
            ...(next.start && next.end
              ? {
                  dateRange: {
                    start: next.start.toISOString(),
                    end: next.end.toISOString(),
                  },
                }
              : {}),
          } as any,
          paginationParams: { limit: paginationLimit },
          requestOrigin: "page",
          expectedType:
            mode === "video"
              ? "video"
              : mode === "music"
                ? "text-to-music"
                : mode === "branding"
                  ? "branding"
                  : mode === "all"
                    ? undefined
                    : "text-to-image",
          skipBackendGenerationFilter: mode === "image" || mode === "all", // Image and All modes use skipBackendGenerationFilter
          forceRefresh: true,
          debugTag: `HistoryControls:${mode}-date:${Date.now()}`,
        } as any),
      );
    },
    [dispatch, mode, sortOrder, searchQuery, onDateChangeCallback],
  );

  return (
    <div
      className={[
        "flex items-center justify-between md:justify-end gap-2 px-0 md:px-0 mb-2 md:pt-2 w-full md:w-auto",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex w-full items-center gap-2 py-0.5 md:hidden">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/35" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search prompt..."
            className="h-7 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-8.5 pr-8 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:bg-white/[0.06]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                applySearch("");
              }}
              className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white/80"
              aria-label="Clear search input"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div ref={mobileFilterMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsMobileFilterMenuOpen((prev) => !prev);
              setShowCalendar(false);
            }}
            className={`relative flex h-7 w-7 items-center justify-center rounded-lg border transition ${isMobileFilterMenuOpen || sortOrder === "asc" || !!dateRange.start ? "border-white/20 bg-white text-black" : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"}`}
            aria-label="Open filters"
            aria-expanded={isMobileFilterMenuOpen}
          >
            <SlidersHorizontal size={15} />
            {(sortOrder === "asc" || !!dateRange.start) && (
              <span className="absolute right-[5px] top-[5px] h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
            )}
          </button>

          {isMobileFilterMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-white/10 bg-[#111117]/95 p-2 shadow-2xl backdrop-blur-xl">
              <button
                type="button"
                onClick={async () => {
                  setIsMobileFilterMenuOpen(false);
                  setShowCalendar(false);
                  await onSortChange("desc");
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${sortOrder === "desc" ? "bg-white text-black" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
              >
                <span>Newest</span>
                <img
                  src="/icons/upload-square-2 (1).svg"
                  alt="Newest"
                  className={`h-4 w-4 ${sortOrder === "desc" ? "" : "invert opacity-80"}`}
                />
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIsMobileFilterMenuOpen(false);
                  setShowCalendar(false);
                  await onSortChange("asc");
                }}
                className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${sortOrder === "asc" ? "bg-white text-black" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
              >
                <span>Oldest</span>
                <img
                  src="/icons/download-square-2.svg"
                  alt="Oldest"
                  className={`h-4 w-4 ${sortOrder === "asc" ? "" : "invert opacity-80"}`}
                />
              </button>

              <button
                type="button"
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
                <span>{dateRange.start ? "Change date" : "Pick date"}</span>
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
                      {new Date(calendarYear, calendarMonth, 1).toLocaleString(
                        undefined,
                        { month: "long", year: "numeric" },
                      )}
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
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <div key={day} className="py-1 text-center">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: calendarFirstWeekday }).map(
                      (_, i) => (
                        <div key={`mobile-pad-${i}`} className="h-8" />
                      ),
                    )}
                    {Array.from({ length: calendarDaysInMonth }).map((_, i) => {
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
                        thisDate.getTime() >
                        new Date().setHours(23, 59, 59, 999);
                      const futureDateClass = emphasizeDisabledDatesOnMobile
                        ? "cursor-not-allowed bg-white/[0.03] text-white/10 opacity-35 ring-1 ring-white/[0.04] md:bg-white/5 md:text-white/20 md:opacity-100 md:ring-0"
                        : "text-white/20 cursor-not-allowed";
                      const activeDateClass = isSelected
                        ? "bg-white/25 ring-1 ring-white/40"
                        : "bg-white/5";

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isFuture}
                          aria-disabled={isFuture}
                          className={`h-8 rounded text-sm text-center ${isFuture ? futureDateClass : `text-white hover:bg-white/15 ${activeDateClass}`}`}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={async (e) => {
                            if (isFuture) return;
                            e.stopPropagation();
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
                            const iso = thisDate.toISOString().slice(0, 10);
                            setDateInput(iso);
                            await runMobileDateFilterRefresh(async () => {
                              await onDateChange({ start, end }, iso);
                            });
                            setShowCalendar(false);
                            setIsMobileFilterMenuOpen(false);
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-sm text-white/80 hover:bg-white/10"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setDateInput("");
                        await runMobileDateFilterRefresh(async () => {
                          await onDateChange({ start: null, end: null }, "");
                        });
                        setShowCalendar(false);
                        setIsMobileFilterMenuOpen(false);
                      }}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-sm text-white/90 hover:bg-white/10"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const now = new Date();
                        setCalendarMonth(now.getMonth());
                        setCalendarYear(now.getFullYear());
                        const start = new Date(
                          now.getFullYear(),
                          now.getMonth(),
                          now.getDate(),
                          0,
                          0,
                          0,
                        );
                        const end = new Date(
                          now.getFullYear(),
                          now.getMonth(),
                          now.getDate(),
                          23,
                          59,
                          59,
                          999,
                        );
                        const iso = now.toISOString().slice(0, 10);
                        setDateInput(iso);
                        await runMobileDateFilterRefresh(async () => {
                          await onDateChange({ start, end }, iso);
                        });
                        setShowCalendar(false);
                        setIsMobileFilterMenuOpen(false);
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

      <div className="hidden md:flex items-center gap-2">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search..."
            className={`pl-8 pr-2 h-[28px] rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 border border-white/10 bg-white/5 text-white placeholder-white/40 w-64 transition-all ${searchInput ? "pr-8" : ""}`}
          />
          <div className="pointer-events-none absolute left-2.5 text-white/40">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                applySearch("");
              }}
              className="absolute right-1 rounded bg-white/5 p-1 text-white/80 hover:bg-white/10"
              aria-label="Clear search input"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={() => onSortChange("desc")}
          className={`flex items-center justify-center gap-1.5 px-3 h-[28px] min-w-0 rounded-lg text-[12px] transition-all whitespace-nowrap ${sortOrder === "desc" ? "bg-white text-black font-semibold shadow-lg" : "text-white/70 hover:bg-white/10 border border-white/10"}`}
          aria-label="Recent"
        >
          <img
            src="/icons/upload-square-2 (1).svg"
            alt="Recent"
            className={`${sortOrder === "desc" ? "" : "invert opacity-100"} w-4 h-4`}
          />
          <span>Recent</span>
        </button>
        <button
          onClick={() => onSortChange("asc")}
          className={`flex items-center justify-center gap-1.5 px-3 h-[28px] min-w-0 rounded-lg text-[12px] transition-all whitespace-nowrap ${sortOrder === "asc" ? "bg-white text-black font-semibold shadow-lg" : "text-white/70 hover:bg-white/10 border border-white/10"}`}
          aria-label="Oldest"
        >
          <img
            src="/icons/download-square-2.svg"
            alt="Oldest"
            className={`${sortOrder === "asc" ? "" : "invert opacity-100"} w-4 h-4`}
          />
          <span>Oldest</span>
        </button>

        <div className="relative flex items-center gap-1">
          <input
            ref={dateInputRef}
            type="date"
            value={dateInput}
            onChange={async (e) => {
              const value = e.target.value;
              setDateInput(value);
              await runMobileDateFilterRefresh(async () => {
                if (!value) {
                  await onDateChange({ start: null, end: null }, "");
                  return;
                }
                const d = new Date(value + "T00:00:00");
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
                await onDateChange({ start, end }, value);
              });
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1,
              height: 1,
              opacity: 0,
            }}
          />
          <button
            ref={calendarButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              const base = dateRange.start
                ? new Date(dateRange.start)
                : new Date();
              setCalendarMonth(base.getMonth());
              setCalendarYear(base.getFullYear());
              setShowCalendar((v) => !v);
            }}
            className={`relative group h-[34px] md:h-[26px] w-[34px] md:w-[28px] flex items-center justify-center rounded-xl md:rounded-lg text-[13px] transition-all ${showCalendar || dateRange.start ? "bg-white text-black font-semibold shadow-lg" : "bg-white/5 border border-white/10 hover:bg-white/10 text-white/70"}`}
            aria-label="Date"
          >
            <img
              src="/icons/calendar-days.svg"
              alt="Date"
              className={`${showCalendar || dateRange.start ? "" : "invert md:opacity-100 opacity-70"} w-4 h-4`}
            />
          </button>
          {showCalendar &&
            mounted &&
            typeof document !== "undefined" &&
            calendarPosition &&
            createPortal(
              <div
                ref={calendarRef}
                data-calendar-popup="true"
                className="fixed w-[280px] max-w-[calc(100vw-1rem)] select-none bg-black/90 backdrop-blur-3xl rounded-xl ring-1 ring-white/20 shadow-2xl p-3"
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  top: `${calendarPosition.top}px`,
                  right: `${calendarPosition.right}px`,
                  zIndex: 99999,
                }}
              >
                <div className="flex items-center justify-between mb-2 text-white">
                  <button
                    className="px-2 py-1 rounded hover:bg-white/10"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const prev = new Date(calendarYear, calendarMonth - 1, 1);
                      setCalendarYear(prev.getFullYear());
                      setCalendarMonth(prev.getMonth());
                    }}
                  >
                    ‹
                  </button>
                  <div className="text-sm font-semibold">
                    {new Date(calendarYear, calendarMonth, 1).toLocaleString(
                      undefined,
                      { month: "long", year: "numeric" },
                    )}
                  </div>
                  <button
                    className="px-2 py-1 rounded hover:bg-white/10"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const next = new Date(calendarYear, calendarMonth + 1, 1);
                      setCalendarYear(next.getFullYear());
                      setCalendarMonth(next.getMonth());
                    }}
                  >
                    ›
                  </button>
                </div>
                <div className="grid grid-cols-7 text-[11px] text-white/70 mb-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="text-center py-1">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: calendarFirstWeekday }).map((_, i) => (
                    <div key={`pad-${i}`} className="h-8" />
                  ))}
                  {Array.from({ length: calendarDaysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const thisDate = new Date(calendarYear, calendarMonth, day);
                    const isSelected =
                      !!dateRange.start &&
                      new Date(dateRange.start).toDateString() ===
                        thisDate.toDateString();
                    const isFuture =
                      thisDate.getTime() > new Date().setHours(23, 59, 59, 999);
                    const futureDateClass = emphasizeDisabledDatesOnMobile
                      ? "cursor-not-allowed bg-white/[0.03] text-white/10 opacity-35 ring-1 ring-white/[0.04] md:bg-white/5 md:text-white/20 md:opacity-100 md:ring-0"
                      : "text-white/20 cursor-not-allowed";
                    const activeDateClass = isSelected
                      ? "bg-white/25 ring-1 ring-white/40"
                      : "bg-white/5";
                    return (
                      <button
                        key={day}
                        disabled={isFuture}
                        aria-disabled={isFuture}
                        className={`h-8 rounded text-sm text-center ${isFuture ? futureDateClass : `text-white hover:bg-white/15 ${activeDateClass}`}`}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={async (e) => {
                          if (isFuture) return;
                          e.stopPropagation();
                          e.preventDefault();
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
                          const iso = thisDate.toISOString().slice(0, 10);
                          setDateInput(iso);
                          await runMobileDateFilterRefresh(async () => {
                            await onDateChange({ start, end }, iso);
                          });
                          setShowCalendar(false);
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <button
                    className="text-white/80 text-sm px-2 py-1 rounded hover:bg-white/10"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDateInput("");
                      await runMobileDateFilterRefresh(async () => {
                        await onDateChange({ start: null, end: null }, "");
                      });
                      setShowCalendar(false);
                    }}
                  >
                    Clear
                  </button>
                  <button
                    className="text-white/90 text-sm px-2 py-1 rounded hover:bg-white/10"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const now = new Date();
                      setCalendarMonth(now.getMonth());
                      setCalendarYear(now.getFullYear());

                      // Bug 60 fix: Selecting 'Today' should apply the filter
                      const start = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                        0,
                        0,
                        0,
                      );
                      const end = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                        23,
                        59,
                        59,
                        999,
                      );
                      const iso = now.toISOString().slice(0, 10);
                      setDateInput(iso);
                      await runMobileDateFilterRefresh(async () => {
                        await onDateChange({ start, end }, iso);
                      });
                      setShowCalendar(false);
                    }}
                  >
                    Today
                  </button>
                </div>
              </div>,
              document.body,
            )}
          {dateRange.start && (
            <button
              className="px-1 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-md"
              onClick={async () => {
                setDateInput("");
                await runMobileDateFilterRefresh(async () => {
                  await onDateChange({ start: null, end: null }, "");
                });
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
          {mounted &&
            typeof document !== "undefined" &&
            isMobileDateFiltering &&
            createPortal(
              <div className="fixed top-[64px] left-0 right-0 bottom-0 z-[99990] flex items-center justify-center bg-black/55 backdrop-blur-sm pointer-events-none md:hidden">
                <div className="flex flex-col items-center gap-4 px-4">
                  <Image
                    src="/styles/Logo.gif"
                    alt="Filtering by date"
                    width={72}
                    height={72}
                    className="object-contain"
                    unoptimized
                  />
                  <div className="text-white text-lg text-center">
                    Filtering generations...
                  </div>
                </div>
              </div>,
              document.body,
            )}
        </div>
      </div>
    </div>
  );
}
