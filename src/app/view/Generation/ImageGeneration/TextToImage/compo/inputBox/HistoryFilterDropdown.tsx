"use client";

import React from "react";
import {
  Search,
  CalendarDays,
  Download,
  HeartOff,
  ArrowRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearHistory, setFilters, loadHistory } from "@/store/slices/historySlice";
import {
  FILTER_POPUP_MODEL_LABELS,
  FILTER_POPUP_QUICK_MODEL_LABELS,
  mapHistoryFilterModelChipToStoredModel,
  mapHistoryFilterModelChipsToStoredModels,
} from "@/lib/historyFilterModelChipMap";

interface HistoryFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  sortOrder: "asc" | "desc";
  onSortChange: (order: "asc" | "desc") => Promise<void>;
  dateRange: { start: Date | null; end: Date | null };
  onDateRangeChange: (range: { start: Date | null; end: Date | null }) => Promise<void>;
  isFutureMobileCalendarDate: (d: Date) => boolean;
}

type CalendarAnchor = "side" | "start" | "end";

export default function HistoryFilterDropdown({
  isOpen,
  onClose,
  sortOrder,
  onSortChange,
  dateRange,
  onDateRangeChange,
  isFutureMobileCalendarDate,
}: HistoryFilterDropdownProps) {
  const dispatch = useAppDispatch();
  const currentHistoryFilters = useAppSelector((s: any) => s?.history?.filters || {});

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const calendarPanelRef = React.useRef<HTMLDivElement | null>(null);
  const startBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const endBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const sideBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const toolBoxRef = React.useRef<HTMLDivElement | null>(null);
  const styleBoxRef = React.useRef<HTMLDivElement | null>(null);
  const modelBoxRef = React.useRef<HTMLDivElement | null>(null);
  const aspectBoxRef = React.useRef<HTMLDivElement | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [calendarAnchor, setCalendarAnchor] = React.useState<CalendarAnchor>("side");
  const [rangePicking, setRangePicking] = React.useState<"start" | "end">("start");
  const [selectedTool, setSelectedTool] = React.useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = React.useState<string | null>(null);
  const [selectedAspect, setSelectedAspect] = React.useState<string>("Any");
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null);

  const [toolQuery, setToolQuery] = React.useState("");
  const [styleQuery, setStyleQuery] = React.useState("");
  const [modelQuery, setModelQuery] = React.useState("");
  const [isToolOpen, setIsToolOpen] = React.useState(false);
  const [isStyleOpen, setIsStyleOpen] = React.useState(false);
  const [isModelOpen, setIsModelOpen] = React.useState(false);
  const [isAspectOpen, setIsAspectOpen] = React.useState(false);

  const QUICK_TOOLS = ["Upscale", "Remove BG", "Erase / Replace"];
  const ALL_TOOLS = [
    "Upscale",
    "Remove BG",
    "Erase / Replace",
    "Expand",
    "Vectorize",
  ];
  const QUICK_STYLES = ["Photo", "Anime", "3D"];
  const ALL_STYLES = ["Photo", "Anime", "3D", "Cinematic", "Illustration"];
  const QUICK_MODELS = [...FILTER_POPUP_QUICK_MODEL_LABELS];
  const ALL_MODELS = [...FILTER_POPUP_MODEL_LABELS];

  const TOOL_MODELS_MAP: Record<string, string[]> = {
    Upscale: [
      "Clarity Upscaler",
      "Real-ESRGAN",
      "Crystal Upscaler",
      "Topaz Upscaler",
      "SeedVR Upscaler",
    ],
    "Remove BG": ["851 Labs Remove BG", "Lucataco Remove BG"],
    "Erase / Replace": ["Bria GenFill", "Seedream 5 Lite"],
    Expand: ["Bria Expand"],
    Vectorize: ["Recraft Vectorize", "Image2SVG"],
  };

  const runBackendRefreshWithAdvancedFilters = React.useCallback(
    async (next: {
      tool?: string | null;
      style?: string | null;
      aspect?: string;
      model?: string | null;
    }) => {
      // IMPORTANT: Tool filters should be backend-friendly.
      // For Upscale, we filter by actual model IDs (not generationType), because older history rows
      // may not have consistent generationType tagging.
      const UPSCALE_BACKEND_MODELS: string[] = [
        // Replicate upscalers/refiner
        "philz1337x/clarity-upscaler",
        "nightmareai/real-esrgan",
        "philz1337x/crystal-upscaler",
        "mv-lab/swin2sr",
        "fermatresearch/magic-image-refiner",
        // FAL upscalers
        "fal-ai/topaz/upscale/image",
        "fal-ai/seedvr/upscale/image",
        "fal-ai/seedvr/upscale/video",
      ];

      const resolvedChipModel = mapHistoryFilterModelChipToStoredModel(
        next.model ?? undefined,
      );
      const toolDefaultStored =
        next.tool && TOOL_MODELS_MAP[next.tool]
          ? mapHistoryFilterModelChipsToStoredModels(TOOL_MODELS_MAP[next.tool])
          : [];

      const modelToUse =
        next.tool === "Upscale"
          ? UPSCALE_BACKEND_MODELS
          : resolvedChipModel != null
            ? resolvedChipModel
            : toolDefaultStored.length > 0
              ? toolDefaultStored.length === 1
                ? toolDefaultStored[0]
                : toolDefaultStored
              : null;

      const nextFilters: any = {
        ...(currentHistoryFilters || {}),
        mode: "image",
        sortOrder,
        ...(dateRange.start && dateRange.end ? { dateRange } : {}),
        ...(modelToUse ? { model: modelToUse } : {}),
        ...(next.style ? { style: next.style } : {}),
        ...(next.aspect && next.aspect !== "Any" ? { frameSize: next.aspect } : {}),
      };

      // Tool → generationType filter (backend-friendly). Keep it conservative.
      // Remove BG: history rows use `text-to-image` (see replicate removeBackground) — filter by model[] only.
      const toolToGenerationType: Record<string, string> = {
        Vectorize: "image-to-svg",
        "Erase / Replace": "image-edit",
        Expand: "image-edit",
      };
      
      const mappedGenType = next.tool ? toolToGenerationType[next.tool] : undefined;
      if (mappedGenType) {
        nextFilters.generationType = mappedGenType;
      } else {
        // If tool cleared, remove generationType only if it was one of our tool-mapped values.
        const existing = String(nextFilters.generationType || "");
        if (
          [
            "image-upscale",
            "image-to-svg",
            "image-edit",
          ].includes(existing)
        ) {
          delete nextFilters.generationType;
        }
      }

      dispatch(setFilters(nextFilters));
      // Clear cached entries so UI doesn't show stale mixes during filter switches
      dispatch(clearHistory());
      await (dispatch as any)(
        loadHistory({
          filters: nextFilters,
          backendFilters: nextFilters,
          paginationParams: { limit: 60 },
          requestOrigin: "page",
          expectedType: "text-to-image",
          forceRefresh: true,
          // When tool maps to generationType, allow sending generationType to backend.
          skipBackendGenerationFilter: false,
          debugTag: `HistoryFilterDropdown:advanced:${Date.now()}`,
        }),
      );
    },
    [dispatch, currentHistoryFilters, sortOrder, dateRange],
  );
  const [calendarMonth, setCalendarMonth] = React.useState<number>(
    dateRange.start ? dateRange.start.getMonth() : new Date().getMonth(),
  );
  const [calendarYear, setCalendarYear] = React.useState<number>(
    dateRange.start ? dateRange.start.getFullYear() : new Date().getFullYear(),
  );

  const calendarDaysInMonth = React.useMemo(
    () => new Date(calendarYear, calendarMonth + 1, 0).getDate(),
    [calendarYear, calendarMonth],
  );
  const calendarFirstWeekday = React.useMemo(
    () => new Date(calendarYear, calendarMonth, 1).getDay(),
    [calendarYear, calendarMonth],
  );

  const prevIsOpenRef = React.useRef(false);
  React.useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (currentHistoryFilters?.frameSize) {
        setSelectedAspect(currentHistoryFilters.frameSize);
      }
      if (currentHistoryFilters?.style) {
        setSelectedStyle(currentHistoryFilters.style);
      }
      if (currentHistoryFilters?.model) {
        const stored = Array.isArray(currentHistoryFilters.model)
          ? currentHistoryFilters.model[0]
          : currentHistoryFilters.model;
        const foundLabel = ALL_MODELS.find((lbl) => {
          const mapped = mapHistoryFilterModelChipToStoredModel(lbl);
          if (Array.isArray(mapped)) return mapped.includes(stored);
          return mapped === stored;
        });
        if (foundLabel) {
          setSelectedModel(foundLabel);
        } else if (typeof stored === "string") {
          setSelectedModel(stored);
        }
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentHistoryFilters]);

  React.useEffect(() => {
    if (!isCalendarOpen) return;
    const onDocDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // Close the calendar if clicking outside the calendar panel (even if still inside the popup)
      const clickedInsideWrapper = !!wrapperRef.current?.contains(target);
      const clickedInsideCalendar = !!calendarPanelRef.current?.contains(target);
      const clickedTrigger =
        !!startBtnRef.current?.contains(target) ||
        !!endBtnRef.current?.contains(target) ||
        !!sideBtnRef.current?.contains(target);

      if (!clickedInsideWrapper) {
        setIsCalendarOpen(false);
        return;
      }
      if (clickedInsideWrapper && isCalendarOpen && !clickedInsideCalendar && !clickedTrigger) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [isCalendarOpen]);

  React.useEffect(() => {
    if (!isToolOpen && !isStyleOpen && !isModelOpen && !isAspectOpen) return;
    const onDocDown = (e: MouseEvent) => {
      const target = e.target as Node;

      if (isToolOpen && toolBoxRef.current && !toolBoxRef.current.contains(target)) {
        setIsToolOpen(false);
      }
      if (isStyleOpen && styleBoxRef.current && !styleBoxRef.current.contains(target)) {
        setIsStyleOpen(false);
      }
      if (isModelOpen && modelBoxRef.current && !modelBoxRef.current.contains(target)) {
        setIsModelOpen(false);
      }
      if (isAspectOpen && aspectBoxRef.current && !aspectBoxRef.current.contains(target)) {
        setIsAspectOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [isToolOpen, isStyleOpen, isModelOpen, isAspectOpen]);

  const formatChipDate = (d: Date | null) => {
    if (!d) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const openCalendar = (anchor: CalendarAnchor, pick: "start" | "end") => {
    const base = dateRange.start ? new Date(dateRange.start) : new Date();
    setCalendarMonth(base.getMonth());
    setCalendarYear(base.getFullYear());
    setCalendarAnchor(anchor);
    setRangePicking(pick);
    setIsCalendarOpen(true);
  };

  const applyCalendarClick = async (thisDate: Date) => {
    const isFuture = isFutureMobileCalendarDate(thisDate);
    if (isFuture) return;

    const startOfDay = new Date(
      thisDate.getFullYear(),
      thisDate.getMonth(),
      thisDate.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      thisDate.getFullYear(),
      thisDate.getMonth(),
      thisDate.getDate(),
      23,
      59,
      59,
      999,
    );

    if (rangePicking === "start") {
      await onDateRangeChange({
        start: startOfDay,
        end: dateRange.end ?? endOfDay,
      });
      setRangePicking("end");
      return;
    }

    const start = dateRange.start ?? startOfDay;
    const end = endOfDay;
    // Prevent selecting an end date before the chosen start date.
    if (end.getTime() < start.getTime()) return;
    await onDateRangeChange({ start, end });
    setIsCalendarOpen(false);
  };

  const CalendarPanel = ({ className }: { className: string }) => (
    <div className={className}>
      <div className="flex items-center justify-between mb-2 text-white">
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-white/10"
          onClick={() => {
            const prev = new Date(calendarYear, calendarMonth - 1, 1);
            setCalendarYear(prev.getFullYear());
            setCalendarMonth(prev.getMonth());
          }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="text-sm font-semibold">
          {new Date(calendarYear, calendarMonth, 1).toLocaleString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </div>
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-white/10"
          onClick={() => {
            const next = new Date(calendarYear, calendarMonth + 1, 1);
            setCalendarYear(next.getFullYear());
            setCalendarMonth(next.getMonth());
          }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 text-[9px] text-white/60 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center py-0.5">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: calendarFirstWeekday }).map((_, i) => (
          <div key={`pad-${i}`} className="h-6" />
        ))}
        {Array.from({ length: calendarDaysInMonth }).map((_, i) => {
          const day = i + 1;
          const thisDate = new Date(calendarYear, calendarMonth, day);
          const isFuture = isFutureMobileCalendarDate(thisDate);
          const startDateOnly =
            dateRange.start
              ? new Date(
                  dateRange.start.getFullYear(),
                  dateRange.start.getMonth(),
                  dateRange.start.getDate(),
                  0,
                  0,
                  0,
                  0,
                )
              : null;
          const endPickingDisallowBeforeStart =
            rangePicking === "end" &&
            !!startDateOnly &&
            thisDate.getTime() < startDateOnly.getTime();
          const isDisabled = isFuture || endPickingDisallowBeforeStart;
          const isSelected =
            !!dateRange.start &&
            new Date(dateRange.start).toDateString() === thisDate.toDateString();

          const baseCls = "h-6 rounded text-[11px] text-center transition";
          const futureCls =
            "cursor-not-allowed bg-white/[0.03] text-white/15 opacity-40 ring-1 ring-white/[0.04]";
          const selectedCls = "bg-white text-black font-semibold";
          const activeCls = "bg-white/[0.05] text-white hover:bg-white/[0.10]";

          return (
            <button
              key={day}
              type="button"
              disabled={isDisabled}
              aria-disabled={isDisabled}
              className={`${baseCls} ${isDisabled ? futureCls : isSelected ? selectedCls : activeCls}`}
              onClick={async () => {
                await applyCalendarClick(thisDate);
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          className="text-white/80 text-[11px] px-2 py-1 rounded hover:bg-white/10"
          onClick={async () => {
            await onDateRangeChange({ start: null, end: null });
            setRangePicking("start");
          }}
        >
          Clear
        </button>
        <button
          type="button"
          className="text-white/90 text-[11px] px-2 py-1 rounded hover:bg-white/10"
          onClick={async () => {
            const now = new Date();
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
            await onDateRangeChange({ start, end });
            setIsCalendarOpen(false);
          }}
        >
          Today
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div ref={wrapperRef} className="absolute top-full right-0 mt-1.5 z-[100]">
      <div className="w-[calc(100vw-32px)] md:w-[420px] bg-[#0E0E11] border border-white/10 rounded-xl shadow-2xl p-3.5 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[80vh] overflow-y-auto">
      {/* Sort Section */}
      <div className="space-y-1.5 mb-3.5">
        <h3 className="text-[9px] font-bold text-white/30 tracking-wider uppercase">
          Sort Order
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => onSortChange("desc")}
            className={`flex-1 h-7 font-medium rounded-lg text-[10px] flex items-center justify-center gap-1.5 transition-all ${sortOrder === "desc" ? "bg-white text-black" : "bg-white/[0.03] border border-white/5 text-white/60 hover:bg-white/10"}`}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={async () => onSortChange("asc")}
            className={`flex-1 h-7 font-medium rounded-lg text-[10px] flex items-center justify-center gap-1.5 transition-all ${sortOrder === "asc" ? "bg-white text-black" : "bg-white/[0.03] border border-white/5 text-white/60 hover:bg-white/10"}`}
          >
            Oldest
          </button>
          <button
            type="button"
            onClick={() => {
              // Keep this icon's UI unchanged; only toggle the side calendar panel.
              if (isCalendarOpen && calendarAnchor === "side") {
                setIsCalendarOpen(false);
                return;
              }
              openCalendar("side", "start");
            }}
            ref={sideBtnRef}
            className="h-7 w-7 shrink-0 bg-white/[0.03] border border-white/5 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-all"
            aria-label="Calendar"
          >
            <CalendarDays size={12} />
          </button>
        </div>
      </div>

      {/* Row 1: Date Range */}
      <div className="space-y-1.5 mb-3.5">
        <h3 className="text-[9px] font-bold text-white/30 tracking-wider uppercase">
          Date Range
        </h3>
        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isCalendarOpen && calendarAnchor === "start") {
                  setIsCalendarOpen(false);
                  return;
                }
                openCalendar("start", "start");
              }}
              ref={startBtnRef}
              className="relative flex-1 w-full h-7 bg-white/[0.03] border border-white/5 rounded-lg px-2.5 pr-7 text-[10px] text-white/90 text-left outline-none hover:bg-white/[0.06] focus:border-white/10 transition-colors"
              aria-label="Start date"
            >
              {dateRange.start ? formatChipDate(dateRange.start) : "Start"}
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30">
                <CalendarDays size={10} />
              </span>
            </button>
            <ArrowRight size={10} className="text-white/20" />
            <button
              type="button"
              onClick={() => {
                if (isCalendarOpen && calendarAnchor === "end") {
                  setIsCalendarOpen(false);
                  return;
                }
                openCalendar("end", "end");
              }}
              ref={endBtnRef}
              className="relative flex-1 w-full h-7 bg-white/[0.03] border border-white/5 rounded-lg px-2.5 pr-7 text-[10px] text-white/90 text-left outline-none hover:bg-white/[0.06] focus:border-white/10 transition-colors"
              aria-label="End date"
            >
              {dateRange.end ? formatChipDate(dateRange.end) : "End"}
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30">
                <CalendarDays size={10} />
              </span>
            </button>
          </div>

          {/* Date-range calendar (opens below Date Range row) */}
          {isCalendarOpen && (calendarAnchor === "start" || calendarAnchor === "end") && (
            <div ref={calendarPanelRef}>
              <CalendarPanel className="absolute left-0 top-full mt-2 w-[210px] max-w-[calc(100vw-32px)] select-none bg-[#0E0E11] border border-white/10 rounded-xl shadow-2xl p-2 z-[120]" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 mb-3.5">
        {/* Tool */}
        <div className="space-y-1.5">
          <h3 className="text-[9px] font-bold text-white/30 tracking-wider uppercase">Tool</h3>
          <div className="flex flex-wrap gap-1">
            <div className="relative w-full mb-1" ref={toolBoxRef}>
              <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={toolQuery}
                onChange={(e) => {
                  setToolQuery(e.target.value);
                  setIsToolOpen(true);
                }}
                onFocus={() => setIsToolOpen(true)}
                onMouseDown={(e) => {
                  if (!isToolOpen) return;
                  e.preventDefault();
                  setIsToolOpen(false);
                }}
                placeholder="Tools..."
                className="w-full h-6.5 bg-white/[0.03] border border-white/5 rounded-lg pl-6 pr-2 text-[10px] text-white outline-none focus:border-white/10 transition-colors"
              />

              {isToolOpen && (toolQuery.trim().length > 0 || true) && (
                <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-white/10 bg-[#0E0E11] shadow-2xl p-1 z-[140] max-h-40 overflow-y-auto">
                  {ALL_TOOLS.filter((t) =>
                    t.toLowerCase().includes(toolQuery.trim().toLowerCase()),
                  ).slice(0, 20).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={async () => {
                        setSelectedTool(t);
                        setToolQuery("");
                        setIsToolOpen(false);

                        // If selected model is not supported by the new tool, clear it
                        let nextModel = selectedModel;
                        if (t && TOOL_MODELS_MAP[t] && selectedModel && !TOOL_MODELS_MAP[t].includes(selectedModel)) {
                          nextModel = null;
                          setSelectedModel(null);
                        }

                        await runBackendRefreshWithAdvancedFilters({
                          tool: t,
                          style: selectedStyle,
                          aspect: selectedAspect,
                          model: nextModel,
                        });
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-white/80 hover:bg-white/5"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {QUICK_TOOLS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={async () => {
                  const nextTool = selectedTool === t ? null : t;
                  setSelectedTool(nextTool);

                  // If selected model is not supported by the new tool, clear it
                  let nextModel = selectedModel;
                  if (nextTool && TOOL_MODELS_MAP[nextTool] && selectedModel && !TOOL_MODELS_MAP[nextTool].includes(selectedModel)) {
                    nextModel = null;
                    setSelectedModel(null);
                  }

                  await runBackendRefreshWithAdvancedFilters({
                    tool: nextTool,
                    style: selectedStyle,
                    aspect: selectedAspect,
                    model: nextModel,
                  });
                }}
                className={`h-6 px-1.5 rounded-lg text-[9px] transition-all ${
                  selectedTool === t
                    ? "bg-white text-black font-medium"
                    : "bg-white/[0.03] border border-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div className="space-y-1.5">
          <h3 className="text-[9px] font-bold text-white/30 tracking-wider uppercase">Style</h3>
          <div className="flex flex-wrap gap-1">
            <div className="relative w-full mb-1" ref={styleBoxRef}>
              <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={styleQuery}
                onChange={(e) => {
                  setStyleQuery(e.target.value);
                  setIsStyleOpen(true);
                }}
                onFocus={() => setIsStyleOpen(true)}
                onMouseDown={(e) => {
                  if (!isStyleOpen) return;
                  e.preventDefault();
                  setIsStyleOpen(false);
                }}
                placeholder="Styles..."
                className="w-full h-6.5 bg-white/[0.03] border border-white/5 rounded-lg pl-6 pr-2 text-[10px] text-white outline-none focus:border-white/10 transition-colors"
              />
              {isStyleOpen && (styleQuery.trim().length > 0 || true) && (
                <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-white/10 bg-[#0E0E11] shadow-2xl p-1 z-[140] max-h-40 overflow-y-auto">
                  {ALL_STYLES.filter((s) =>
                    s.toLowerCase().includes(styleQuery.trim().toLowerCase()),
                  ).slice(0, 25).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={async () => {
                        setSelectedStyle(s);
                        setStyleQuery("");
                        setIsStyleOpen(false);
                        await runBackendRefreshWithAdvancedFilters({
                          tool: selectedTool,
                          style: s,
                          aspect: selectedAspect,
                          model: selectedModel,
                        });
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-white/80 hover:bg-white/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {QUICK_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={async () => {
                  const nextStyle = selectedStyle === s ? null : s;
                  setSelectedStyle(nextStyle);
                  await runBackendRefreshWithAdvancedFilters({
                    tool: selectedTool,
                    style: nextStyle,
                    aspect: selectedAspect,
                    model: selectedModel,
                  });
                }}
                className={`h-6 px-1.5 rounded-lg text-[9px] transition-all ${
                  selectedStyle === s
                    ? "bg-white text-black font-medium"
                    : "bg-white/[0.03] border border-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-1.5 col-span-2">
          <h3 className="text-[9px] font-bold text-white/30 tracking-wider uppercase">Aspect Ratio</h3>
          <div className="flex flex-wrap gap-1">
            {["1:1", "4:3", "3:2", "16:9"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={async () => {
                  const nextAspect = selectedAspect === r ? "Any" : r;
                  setSelectedAspect(nextAspect);
                  await runBackendRefreshWithAdvancedFilters({
                    tool: selectedTool,
                    style: selectedStyle,
                    aspect: nextAspect,
                    model: selectedModel,
                  });
                }}
                className={`h-6 px-2 rounded-lg text-[9px] transition-all ${
                  selectedAspect === r
                    ? "bg-white text-black font-medium"
                    : "bg-white/[0.03] border border-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {r}
              </button>
            ))}

            <div className="relative" ref={aspectBoxRef}>
              <button
                type="button"
                onClick={() => setIsAspectOpen(!isAspectOpen)}
                className={`h-6 px-2 rounded-lg text-[9px] transition-all flex items-center gap-1 ${
                  ["9:16", "3:4", "2:3", "21:9"].includes(selectedAspect)
                    ? "bg-white text-black font-medium"
                    : "bg-white/[0.03] border border-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {["9:16", "3:4", "2:3", "21:9"].includes(selectedAspect) ? selectedAspect : "More"}
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${isAspectOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isAspectOpen && (
                <div className="absolute left-0 bottom-full mb-1 w-20 rounded-xl border border-white/10 bg-[#0E0E11] shadow-2xl p-1 z-[150]">
                  {["9:16", "3:4", "2:3", "21:9"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={async () => {
                        const nextAspect = selectedAspect === r ? "Any" : r;
                        setSelectedAspect(nextAspect);
                        setIsAspectOpen(false);
                        await runBackendRefreshWithAdvancedFilters({
                          tool: selectedTool,
                          style: selectedStyle,
                          aspect: nextAspect,
                          model: selectedModel,
                        });
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-[9px] transition-colors ${
                        selectedAspect === r ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/90"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Model Section */}
      <div className="space-y-1.5 mb-4.5">
        <h3 className="text-[9px] font-bold text-white/30 tracking-wider uppercase">Model</h3>
        <div className="flex flex-wrap gap-1">
          <div className="relative w-28 h-6.5" ref={modelBoxRef}>
            <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={modelQuery}
              onChange={(e) => {
                setModelQuery(e.target.value);
                setIsModelOpen(true);
              }}
              onFocus={() => setIsModelOpen(true)}
              onMouseDown={(e) => {
                if (!isModelOpen) return;
                e.preventDefault();
                setIsModelOpen(false);
              }}
              placeholder="Models..."
              className="w-full h-full bg-white/[0.03] border border-white/5 rounded-lg pl-6 pr-2 text-[10px] text-white outline-none focus:border-white/10 transition-colors"
            />
            {isModelOpen && (modelQuery.trim().length > 0 || true) && (
              <div className="absolute left-0 top-full mt-1 w-[220px] rounded-xl border border-white/10 bg-[#0E0E11] shadow-2xl p-1 z-[140] max-h-16 overflow-y-auto">
                {ALL_MODELS.filter((m) => {
                  const matchesQuery = m.toLowerCase().includes(modelQuery.trim().toLowerCase());
                  if (!selectedTool || !TOOL_MODELS_MAP[selectedTool]) return matchesQuery;
                  return matchesQuery && TOOL_MODELS_MAP[selectedTool].includes(m);
                }).slice(0, 30).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={async () => {
                      setSelectedModel(m);
                      setModelQuery("");
                      setIsModelOpen(false);
                      await runBackendRefreshWithAdvancedFilters({
                        tool: selectedTool,
                        style: selectedStyle,
                        aspect: selectedAspect,
                        model: m,
                      });
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-white/80 hover:bg-white/5"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(() => {
            const baseQuick = QUICK_MODELS.filter((m) => {
              if (!selectedTool || !TOOL_MODELS_MAP[selectedTool]) return true;
              return TOOL_MODELS_MAP[selectedTool].includes(m);
            });
            const res: string[] = [...baseQuick];
            if (selectedModel && !res.includes(selectedModel)) {
              res.push(selectedModel);
            }
            return res;
          })().map((m) => (
            <button
              key={m}
              type="button"
              onClick={async () => {
                const nextModel = selectedModel === m ? null : m;
                setSelectedModel(nextModel);
                await runBackendRefreshWithAdvancedFilters({
                  tool: selectedTool,
                  style: selectedStyle,
                  aspect: selectedAspect,
                  model: nextModel,
                });
              }}
              className={`h-6.5 px-2 rounded-lg text-[9px] transition-all ${
                selectedModel === m
                  ? "bg-white text-black font-medium"
                  : "bg-white/[0.03] border border-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex pt-3 border-t border-white/5">
        <button
          type="button"
          onClick={async () => {
            setSelectedTool(null);
            setSelectedStyle(null);
            setSelectedAspect("Any");
            setSelectedModel(null);
            setToolQuery("");
            setStyleQuery("");
            setModelQuery("");
            setIsToolOpen(false);
            setIsStyleOpen(false);
            setIsModelOpen(false);
            dispatch(setFilters({ mode: "image", sortOrder: "desc" } as any));
            dispatch(clearHistory());
            await (dispatch as any)(
              loadHistory({
                filters: { mode: "image", sortOrder: "desc" } as any,
                backendFilters: { mode: "image", sortOrder: "desc" } as any,
                paginationParams: { limit: 60 },
                requestOrigin: "page",
                expectedType: "text-to-image",
                forceRefresh: true,
                skipBackendGenerationFilter: true,
                debugTag: `HistoryFilterDropdown:clear:${Date.now()}`,
              }),
            );
          }}
          className="px-2.5 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg text-[10px] text-white/80 font-medium hover:bg-white/10 transition-all"
        >
          Clear all
        </button>
      </div>
      </div>

      {/* Side calendar (opens to the right of popup) */}
      {isCalendarOpen && calendarAnchor === "side" && (
        <div ref={calendarPanelRef}>
          <CalendarPanel className="hidden md:block absolute left-full top-0 ml-2 w-[210px] select-none bg-[#0E0E11] border border-white/10 rounded-xl shadow-2xl p-2" />
        </div>
      )}
    </div>
  );
}
