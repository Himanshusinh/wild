import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { shallowEqual } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadHistory, setFilters } from "@/store/slices/historySlice";
import useHistoryLoader from "@/hooks/useHistoryLoader";

export function useInputBoxHistory(userData: unknown) {
  const dispatch = useAppDispatch();

  const [showSwitchLoader, setShowSwitchLoader] = useState(false);
  const switchLoadInFlightRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [dateInput, setDateInput] = useState<string>("");
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isMobileFilterMenuOpen, setIsMobileFilterMenuOpen] = useState(false);
  const [isInputBoxHovered, setIsInputBoxHovered] = useState(false);
  const [isMobileDateFiltering, setIsMobileDateFiltering] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<number>(
    new Date().getMonth(),
  );
  const [calendarYear, setCalendarYear] = useState<number>(
    new Date().getFullYear(),
  );
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const mobileFilterMenuRef = useRef<HTMLDivElement | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const calendarDaysInMonth = useMemo(
    () => new Date(calendarYear, calendarMonth + 1, 0).getDate(),
    [calendarYear, calendarMonth],
  );
  const calendarFirstWeekday = useMemo(
    () => new Date(calendarYear, calendarMonth, 1).getDay(),
    [calendarYear, calendarMonth],
  );
  const mobileDateInputMax = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);
  const isFutureMobileCalendarDate = useCallback((date: Date) => {
    const now = new Date();
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    return date.getTime() > endOfToday.getTime();
  }, []);
  const runMobileDateFilterRefresh = useCallback(
    async (action: () => Promise<void>) => {
      const startedAt = Date.now();
      setIsMobileDateFiltering(true);
      try {
        await action();
      } finally {
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

  useEffect(() => {
    if (!showCalendar) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (calendarRef.current && !calendarRef.current.contains(t))
        setShowCalendar(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowCalendar(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showCalendar]);

  useEffect(() => {
    if (!isMobileFilterMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        mobileFilterMenuRef.current &&
        !mobileFilterMenuRef.current.contains(t)
      ) {
        setIsMobileFilterMenuOpen(false);
        setShowCalendar(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileFilterMenuOpen(false);
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [isMobileFilterMenuOpen]);

  useEffect(() => {
    if (searchQuery.trim() || dateRange.start) {
      setIsFiltering(true);
      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsFiltering(false);
    }
  }, [searchQuery, dateRange]);

  const [isSorting, setIsSorting] = useState(false);
  const prevSortOrderRef = useRef<"desc" | "asc" | null>(null);
  useEffect(() => {
    if (
      prevSortOrderRef.current !== null &&
      prevSortOrderRef.current !== sortOrder
    ) {
      setIsSorting(true);
      const timer = setTimeout(() => {
        setIsSorting(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    prevSortOrderRef.current = sortOrder;
  }, [sortOrder]);

  const [page, setPage] = useState(1);

  const refreshHistoryFromBackend = useCallback(
    async (next?: {
      sortOrder?: "asc" | "desc";
      dateRange?: { start: Date | null; end: Date | null };
      search?: string;
    }) => {
      if (!userData) return;
      const order = next?.sortOrder || sortOrder;
      const dr = next?.dateRange || dateRange;
      const s = typeof next?.search === "string" ? next.search : searchQuery;

      if (next?.sortOrder) setSortOrder(next.sortOrder);
      if (next?.dateRange) setDateRange(next.dateRange);
      if (typeof next?.search === "string") setSearchQuery(next.search);

      setPage(1);

      const filters: any = { mode: "image", sortOrder: order };
      if (s.trim()) filters.search = s.trim();
      if (dr.start && dr.end)
        filters.dateRange = {
          start: dr.start.toISOString(),
          end: dr.end.toISOString(),
        };
      dispatch(setFilters(filters));

      await (dispatch as any)(
        loadHistory({
          filters,
          backendFilters: {
            mode: "image",
            sortOrder: order,
            ...(dr.start && dr.end
              ? {
                  dateRange: {
                    start: dr.start.toISOString(),
                    end: dr.end.toISOString(),
                  },
                }
              : {}),
            ...(s.trim() ? { search: s.trim() } : {}),
          } as any,
          // Keep initial payload small to avoid UI freezes / Chrome OOM on large accounts.
          paginationParams: { limit: 20 },
          requestOrigin: "page",
          expectedType: "text-to-image",
          skipBackendGenerationFilter: true,
          forceRefresh: true,
        }),
      );
    },
    [dispatch, userData, searchQuery, sortOrder, dateRange],
  );

  const onSortChange = useCallback(
    async (order: "asc" | "desc") => {
      await refreshHistoryFromBackend({ sortOrder: order });
    },
    [refreshHistoryFromBackend],
  );

  const loading = useAppSelector(
    (state: any) => state.history?.loading || false,
  );
  const hasMore = useAppSelector(
    (state: any) => state.history?.hasMore || false,
  );

  const currentFilters = useAppSelector(
    (state: any) => state.history?.filters || {},
  );
  const reduxSortOrder = (currentFilters as any)?.sortOrder || "desc";
  const reduxSearchQuery = (currentFilters as any)?.search || "";
  const reduxDateRange = (currentFilters as any)?.dateRange
    ? {
        start: (currentFilters as any).dateRange.start
          ? new Date((currentFilters as any).dateRange.start)
          : null,
        end: (currentFilters as any).dateRange.end
          ? new Date((currentFilters as any).dateRange.end)
          : null,
      }
    : { start: null, end: null };
  const reduxDateStartMs = reduxDateRange.start
    ? reduxDateRange.start.getTime()
    : null;
  const reduxDateEndMs = reduxDateRange.end
    ? reduxDateRange.end.getTime()
    : null;

  useEffect(() => {
    if (sortOrder !== reduxSortOrder) {
      setSortOrder(reduxSortOrder);
    }
    if (searchQuery !== reduxSearchQuery) {
      setSearchQuery(reduxSearchQuery);
    }

    const localStart = dateRange.start ? dateRange.start.getTime() : null;
    const localEnd = dateRange.end ? dateRange.end.getTime() : null;
    if (localStart !== reduxDateStartMs || localEnd !== reduxDateEndMs) {
      setDateRange(reduxDateRange);
      setDateInput(
        reduxDateRange.start
          ? reduxDateRange.start.toISOString().slice(0, 10)
          : "",
      );
    }
  }, [reduxSortOrder, reduxSearchQuery, reduxDateStartMs, reduxDateEndMs]);

  const currentUIGenerationType = useAppSelector(
    (s: any) => s.ui?.currentGenerationType || "text-to-image",
  );
  const lastUIGenerationTypeRef = useRef<string>(currentUIGenerationType);

  const historyEntries = useAppSelector((state: any) => {
    const allEntries = state.history?.entries || [];

    if (allEntries.length === 0) {
      return [];
    }

    const normalize = (t?: string) =>
      t ? String(t).replace(/[_-]/g, "-").toLowerCase() : "";

    const filtered = allEntries.filter((entry: any) => {
      const normalizedType = normalize(entry.generationType);
      const normalizedModel = normalize(entry.model);
      const isUploadFileEntry = normalizedModel === "upload-file";
      const isSeedream = normalizedModel.includes("seedream");
      const isTextToImage = normalizedType === "text-to-image";
      const isImageToImage = normalizedType === "image-to-image";

      if (isUploadFileEntry) {
        return false;
      }

      const isVideoType =
        normalizedType === "text-to-video" ||
        normalizedType === "image-to-video" ||
        normalizedType === "video-to-video";

      if (isVideoType) {
        return false;
      }

      const isVideoUrl = (url: string | undefined): boolean => {
        return (
          !!url &&
          (url.startsWith("data:video") ||
            /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url))
        );
      };
      const hasVideoInImages =
        Array.isArray(entry.images) &&
        entry.images.some((m: any) => isVideoUrl(m?.firebaseUrl || m?.url));
      const hasVideoInVideos =
        entry.videos &&
        Array.isArray(entry.videos) &&
        entry.videos.some((v: any) =>
          isVideoUrl(v?.firebaseUrl || v?.url || v?.originalUrl),
        );
      if (hasVideoInImages || hasVideoInVideos) {
        return false;
      }

      if (isSeedream && isTextToImage) {
        return true;
      }

      if (isSeedream && !isTextToImage) {
        return false;
      }

      const isVectorize =
        normalizedType === "vectorize" ||
        normalizedType === "image-vectorize" ||
        normalizedType.includes("vector");

      return (
        normalizedType === "text-to-image" ||
        isImageToImage ||
        normalizedType === "image-upscale" ||
        normalizedType === "image-to-svg" ||
        normalizedType === "image-edit" ||
        isVectorize
      );
    });

    if (filtered.length === 0) {
      return [];
    }

    // IMPORTANT: do NOT re-sort client-side here.
    // The backend already returns entries in the desired order (Recent/Oldest),
    // and re-sorting by timestamp causes items within the same date bucket to
    // reshuffle as pagination loads (making masonry feel "time-priority").
    return filtered;
  }, shallowEqual);

  useEffect(() => {
    const norm = (t?: string) => (t || "").replace(/[_-]/g, "-").toLowerCase();
    const normalizedCurrent = norm(
      currentUIGenerationType === "image-to-image"
        ? "text-to-image"
        : currentUIGenerationType,
    );
    const normalizedLast = norm(
      lastUIGenerationTypeRef.current === "image-to-image"
        ? "text-to-image"
        : lastUIGenerationTypeRef.current,
    );
    const isImagePage = normalizedCurrent === "text-to-image";
    const switchedToImage = isImagePage && normalizedLast !== normalizedCurrent;
    const currentFilterMode = (currentFilters as any)?.mode;
    const currentFilterSort = (currentFilters as any)?.sortOrder;
    const currentFilterSearch = (currentFilters as any)?.search || "";
    const currentFilterDateRange = (currentFilters as any)?.dateRange;
    const filtersAreForImage =
      !currentFilterMode || currentFilterMode === "image";
    const sortMismatch = currentFilterSort && currentFilterSort !== sortOrder;
    const searchMismatch = currentFilterSearch !== (searchQuery || "");
    const currentFilterStart = currentFilterDateRange?.start
      ? new Date(currentFilterDateRange.start).getTime()
      : null;
    const currentFilterEnd = currentFilterDateRange?.end
      ? new Date(currentFilterDateRange.end).getTime()
      : null;
    const localDateStart = dateRange.start ? dateRange.start.getTime() : null;
    const localDateEnd = dateRange.end ? dateRange.end.getTime() : null;
    const dateMismatch =
      currentFilterStart !== localDateStart ||
      currentFilterEnd !== localDateEnd;
    const hasEntries = historyEntries && historyEntries.length > 0;

    if (
      !switchedToImage &&
      filtersAreForImage &&
      (sortMismatch || searchMismatch || dateMismatch)
    ) {
      if (currentFilterSort) setSortOrder(currentFilterSort);
      setSearchQuery(currentFilterSearch);
      setDateRange({
        start: currentFilterDateRange?.start
          ? new Date(currentFilterDateRange.start)
          : null,
        end: currentFilterDateRange?.end
          ? new Date(currentFilterDateRange.end)
          : null,
      });
      setDateInput(
        currentFilterDateRange?.start
          ? new Date(currentFilterDateRange.start).toISOString().slice(0, 10)
          : "",
      );
      lastUIGenerationTypeRef.current = currentUIGenerationType;
      return;
    }

    const shouldReload =
      (switchedToImage || !filtersAreForImage) &&
      !switchLoadInFlightRef.current;

    if (shouldReload && !loading) {
      if (
        switchedToImage &&
        filtersAreForImage &&
        !sortMismatch &&
        hasEntries
      ) {
        lastUIGenerationTypeRef.current = currentUIGenerationType;
        return;
      }

      switchLoadInFlightRef.current = true;
      setShowSwitchLoader(true);

      setPage(1);
      const filters: any = { mode: "image", sortOrder };
      if (searchQuery.trim()) filters.search = searchQuery.trim();
      if (dateRange.start && dateRange.end)
        filters.dateRange = {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        };

      dispatch(setFilters(filters));
      (dispatch as any)(
        loadHistory({
          filters,
          backendFilters: { ...filters } as any,
          paginationParams: { limit: 20 },
          requestOrigin: "page",
          expectedType: "text-to-image",
          skipBackendGenerationFilter: true,
          forceRefresh: true,
        } as any),
      ).finally(() => {
        switchLoadInFlightRef.current = false;
        setShowSwitchLoader(false);
      });
    }

    lastUIGenerationTypeRef.current = currentUIGenerationType;
  }, [
    currentUIGenerationType,
    currentFilters,
    sortOrder,
    dateRange,
    searchQuery,
    dispatch,
    loading,
    historyEntries,
  ]);

  useEffect(() => {
    if (!loading && historyEntries.length > 0) {
      setShowSwitchLoader(false);
    }
  }, [loading, historyEntries.length]);

  const fallbackGenerationTypes = useMemo(
    () => ["text-to-image", "image-to-image"],
    [],
  );
  const {
    refresh: refreshHistoryDebounced,
    refreshImmediate: refreshHistoryImmediate,
  } = useHistoryLoader({
    generationType: "text-to-image",
    generationTypes: fallbackGenerationTypes,
    initialLimit: 60,
    mode: "image",
    skipBackendGenerationFilter: true,
    sortOrder,
  });

  return {
    showSwitchLoader,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    dateRange,
    setDateRange,
    dateInput,
    setDateInput,
    dateInputRef,
    showCalendar,
    setShowCalendar,
    isMobileFilterMenuOpen,
    setIsMobileFilterMenuOpen,
    isInputBoxHovered,
    setIsInputBoxHovered,
    isMobileDateFiltering,
    calendarMonth,
    setCalendarMonth,
    calendarYear,
    setCalendarYear,
    calendarRef,
    mobileFilterMenuRef,
    isFiltering,
    calendarDaysInMonth,
    calendarFirstWeekday,
    mobileDateInputMax,
    isFutureMobileCalendarDate,
    runMobileDateFilterRefresh,
    isSorting,
    refreshHistoryFromBackend,
    onSortChange,
    page,
    setPage,
    currentFilters,
    loading,
    hasMore,
    historyEntries,
    refreshHistoryDebounced,
    refreshHistoryImmediate,
  };
}
