"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";
import { STYLES } from "./CreativeStyle";
import StyleFiltersBar from "@/components/ui/StyleFiltersBar";

interface AllStylesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStyleSelect: (id: string) => void;
}

const StyleCard = ({
  style,
  onClick,
}: {
  style: (typeof STYLES)[0];
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex flex-col text-left transition-all hover:-translate-y-1"
  >
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#18181f] transition-colors group-hover:border-white/20">
      <Image
        src={style.image}
        alt={style.title}
        fill
        unoptimized
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        style={{ filter: style.imageFilter as React.CSSProperties["filter"] }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

      <div className="absolute bottom-4 left-4 right-4">
        <div
          className="text-[18px] font-bold uppercase tracking-wider text-white sm:text-[22px]"
          style={{
            fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif",
          }}
        >
          {style.title}
        </div>
        <div className="mt-1 text-[11px] font-semibold tracking-wide text-white/85">
          {style.name}
        </div>
        <div className="mt-1 line-clamp-2 text-[10px] leading-snug text-white/55">
          {style.desc}
        </div>
      </div>

      {style.tag && (
        <div className="absolute left-4 top-4">
          <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/80 backdrop-blur-md">
            {style.tag}
          </span>
        </div>
      )}
    </div>

    <div className="sr-only">
      <div>{style.name}</div>
      <p>{style.desc}</p>
    </div>
  </button>
);

export default function AllStylesModal({
  isOpen,
  onClose,
  onStyleSelect,
}: AllStylesModalProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTypeId, setSelectedTypeId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollMetrics, setScrollMetrics] = useState({
    clientHeight: 1,
    scrollHeight: 1,
  });
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ startY: number; startTop: number } | null>(
    null,
  );

  useEffect(() => {
    if (!isOpen) return;
    const stored = localStorage.getItem("recent_styles");
    if (stored) {
      try {
        setRecentIds(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent styles", e);
      }
    }
    if (listRef.current) {
      listRef.current.scrollTop = 0;
      setScrollTop(0);
      setScrollMetrics({
        clientHeight: listRef.current.clientHeight || 1,
        scrollHeight: listRef.current.scrollHeight || 1,
      });
    }
  }, [isOpen, selectedCategory, selectedTypeId, searchQuery]);

  const handleGridScroll = () => {
    const el = listRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    setScrollMetrics({
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    });
  };

  const handleStyleSelect = (id: string) => {
    const updated = [id, ...recentIds.filter((x) => x !== id)].slice(0, 10);
    setRecentIds(updated);
    localStorage.setItem("recent_styles", JSON.stringify(updated));
    onStyleSelect(id);
  };

  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current = { startY: e.clientY, startTop: scrollTop };
    setIsDraggingThumb(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handleThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb || !dragStateRef.current || !listRef.current) return;
    const { startY, startTop } = dragStateRef.current;
    const deltaY = e.clientY - startY;
    const trackHeight = scrollMetrics.clientHeight;
    const scrollable = Math.max(
      1,
      scrollMetrics.scrollHeight - scrollMetrics.clientHeight,
    );
    const scrollDelta = (deltaY / Math.max(1, trackHeight)) * scrollable;
    const next = Math.max(0, Math.min(scrollable, startTop + scrollDelta));
    listRef.current.scrollTop = next;
  };

  const handleThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragStateRef.current = null;
    setIsDraggingThumb(false);
  };

  const { groupedStyles, categories, typeCategories } = useMemo(() => {
    const groups: Record<string, typeof STYLES> = {};
    const typeLabels = new Map<string, string>();

    STYLES.forEach((style) => {
      const stateName = style.state;
      if (!groups[stateName]) groups[stateName] = [];
      groups[stateName].push(style);
      if (!typeLabels.has(style.typeId)) {
        typeLabels.set(style.typeId, style.tag);
      }
    });

    const sortedStates = Object.keys(groups).sort();
    const sortedTypes = Array.from(typeLabels.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) => left.label.localeCompare(right.label));

    return {
      groupedStyles: sortedStates.map((state) => ({
        state,
        styles: groups[state],
      })),
      categories: ["All", "Recent", ...sortedStates],
      typeCategories: [{ id: "all", label: "All Types" }, ...sortedTypes],
    };
  }, []);

  const stateOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category,
        label: category === "All" ? "All States" : category,
      })),
    [categories],
  );

  const typeOptions = useMemo(
    () =>
      typeCategories.map((typeCategory) => ({
        value: typeCategory.id,
        label: typeCategory.label,
      })),
    [typeCategories],
  );

  const contentToRender = useMemo(() => {
    const matchesSelectedType = (style: (typeof STYLES)[0]) =>
      selectedTypeId === "all" || style.typeId === selectedTypeId;
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesSearchQuery = (style: (typeof STYLES)[0]) => {
      if (!normalizedQuery) return true;
      return [style.title, style.name, style.state, style.tag, style.desc]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    };
    const matchesFilters = (style: (typeof STYLES)[0]) =>
      matchesSelectedType(style) && matchesSearchQuery(style);

    if (selectedCategory === "All") {
      const visibleGroups = groupedStyles
        .map((group) => ({
          ...group,
          styles: group.styles.filter(matchesFilters),
        }))
        .filter((group) => group.styles.length > 0);

      if (visibleGroups.length === 0) {
        return (
          <div className="flex h-full flex-col items-center justify-center pt-20 text-white/40">
            <p className="text-sm font-medium">
              No styles match the current filters.
            </p>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-10">
          {visibleGroups.map((group) => (
            <div key={group.state} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <h3
                  className="text-2xl uppercase tracking-wider text-white"
                  style={{
                    fontFamily:
                      "var(--font-bebas-neue), 'Bebas Neue', sans-serif",
                  }}
                >
                  {group.state}
                </h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {group.styles.map((style) => (
                  <StyleCard
                    key={style.id}
                    style={style}
                    onClick={() => handleStyleSelect(style.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (selectedCategory === "Recent") {
      const recentStyles = recentIds
        .map((id) => STYLES.find((s) => s.id === id))
        .filter((style): style is (typeof STYLES)[0] => Boolean(style))
        .filter(matchesFilters);
      if (recentStyles.length === 0) {
        return (
          <div className="flex h-full flex-col items-center justify-center pt-20 text-white/40">
            <p className="text-sm font-medium">
              {!searchQuery.trim() && selectedTypeId === "all"
                ? "No recent styles selected yet."
                : "No recent styles match the current filters."}
            </p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {recentStyles.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              onClick={() => handleStyleSelect(style.id)}
            />
          ))}
        </div>
      );
    }

    const stateStyles = STYLES.filter(
      (s) => s.state === selectedCategory && matchesFilters(s),
    );

    if (stateStyles.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center pt-20 text-white/40">
          <p className="text-sm font-medium">
            No styles match the current filters.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {stateStyles.map((style) => (
          <StyleCard
            key={style.id}
            style={style}
            onClick={() => handleStyleSelect(style.id)}
          />
        ))}
      </div>
    );
  }, [selectedCategory, groupedStyles, recentIds, searchQuery, selectedTypeId]);

  if (!isOpen) return null;

  const maxScroll = Math.max(
    1,
    scrollMetrics.scrollHeight - scrollMetrics.clientHeight,
  );
  const thumbHeight = Math.max(
    36,
    (scrollMetrics.clientHeight / scrollMetrics.scrollHeight) * 100,
  );
  const thumbTop = (scrollTop / maxScroll) * (100 - thumbHeight);

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xl sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-8xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E12] shadow-[0_32px_120px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-white/5 px-5 py-4 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2
                className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                style={{
                  fontFamily:
                    "var(--font-bebas-neue), 'Bebas Neue', sans-serif",
                }}
              >
                Explore All Styles
              </h2>
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-white/30">
                Select a style to begin generating
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:max-w-[70%] lg:flex-nowrap">
              <StyleFiltersBar
                className="w-full flex-col sm:w-auto sm:flex-row"
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchClassName="w-full sm:w-[240px] lg:w-[280px]"
                stateValue={selectedCategory}
                onStateChange={setSelectedCategory}
                stateOptions={stateOptions}
                stateClassName="w-full sm:w-[210px] lg:w-[230px]"
                typeValue={selectedTypeId}
                onTypeChange={setSelectedTypeId}
                typeOptions={typeOptions}
                typeClassName="w-full sm:w-[180px] lg:w-[200px]"
              />

              <button
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-full border border-white/10 bg-white/[0.03] text-white/40 transition hover:border-white/20 hover:bg-white/5 hover:text-white sm:self-auto"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={listRef}
          onScroll={handleGridScroll}
          className="min-h-0 flex-1 overflow-y-scroll p-4 pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:w-0 sm:p-6 sm:pr-5"
        >
          {contentToRender}
        </div>

        <div className="absolute bottom-3 right-1.5 top-[90px] w-1 rounded-full bg-white/10">
          <div
            role="scrollbar"
            aria-valuemin={0}
            aria-valuemax={Math.round(maxScroll)}
            aria-valuenow={Math.round(scrollTop)}
            onPointerDown={handleThumbPointerDown}
            onPointerMove={handleThumbPointerMove}
            onPointerUp={handleThumbPointerUp}
            onPointerCancel={handleThumbPointerUp}
            className={`absolute left-0 right-0 rounded-full bg-[#3B82F6]/90 shadow-[0_0_10px_rgba(59,130,246,0.35)] transition-colors ${
              isDraggingThumb
                ? "cursor-grabbing bg-[#60A5FA]"
                : "cursor-grab hover:bg-[#60A5FA]"
            }`}
            style={{ height: `${thumbHeight}%`, top: `${thumbTop}%` }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
