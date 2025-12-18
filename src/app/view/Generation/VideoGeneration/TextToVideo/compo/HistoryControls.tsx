"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearHistory, setFilters } from '@/store/slices/historySlice';
import { loadHistory } from '@/store/slices/historySlice';

interface HistoryControlsProps {
  mode: 'video' | 'image';
  limit?: number; // Pagination limit (default: 10 for video, can be overridden for image)
  onSearchChange?: (search: string) => void;
  onSortChange?: (sortOrder: 'asc' | 'desc') => void;
  onDateChange?: (dateRange: { start: Date | null; end: Date | null }) => void;
}

const HistoryControls: React.FC<HistoryControlsProps> = ({ 
  mode = 'video',
  limit,
  onSearchChange,
  onSortChange: onSortChangeCallback,
  onDateChange: onDateChangeCallback,
}) => {
  // Default limit: 10 for video, 60 for image (can be overridden)
  const paginationLimit = limit || (mode === 'image' ? 60 : 10);
  const dispatch = useAppDispatch();
  const currentFilters = useAppSelector((state: any) => state.history?.filters || {});
  
  // Initialize from Redux state if available
  const initialSortOrder = currentFilters.sortOrder || 'desc';
  const initialSearch = currentFilters.search || '';
  const initialDateRange = currentFilters.dateRange ? {
    start: currentFilters.dateRange.start ? new Date(currentFilters.dateRange.start) : null,
    end: currentFilters.dateRange.end ? new Date(currentFilters.dateRange.end) : null,
  } : { start: null, end: null };
  
  // Search state
  const [searchInput, setSearchInput] = useState<string>(initialSearch);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const searchDebounceRef = useRef<any>(null);
  const didInitSearchRef = useRef(false);
  
  // Sort state
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>(initialSortOrder);
  
  // Date state
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>(initialDateRange);
  const [dateInput, setDateInput] = useState<string>(initialDateRange.start ? initialDateRange.start.toISOString().slice(0, 10) : "");
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<number>(initialDateRange.start ? initialDateRange.start.getMonth() : new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(initialDateRange.start ? initialDateRange.start.getFullYear() : new Date().getFullYear());
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const calendarButtonRef = useRef<HTMLButtonElement | null>(null);
  const [calendarPosition, setCalendarPosition] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const didInitialLoadRef = useRef(false);

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const calendarDaysInMonth = useMemo(() => new Date(calendarYear, calendarMonth + 1, 0).getDate(), [calendarYear, calendarMonth]);
  const calendarFirstWeekday = useMemo(() => new Date(calendarYear, calendarMonth, 1).getDay(), [calendarYear, calendarMonth]);

  // Calculate calendar position on mobile when it opens
  useEffect(() => {
    if (showCalendar && calendarButtonRef.current) {
      const updatePosition = () => {
        if (calendarButtonRef.current) {
          const rect = calendarButtonRef.current.getBoundingClientRect();
          setCalendarPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right
          });
        }
      };
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showCalendar]);

  // Close calendar when clicking outside / pressing Escape
  useEffect(() => {
    if (!showCalendar) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't close if clicking on the calendar button (it will toggle itself)
      if (calendarButtonRef.current && calendarButtonRef.current.contains(target)) {
        return;
      }
      // Don't close if clicking inside the calendar popup
      if (calendarRef.current && calendarRef.current.contains(target)) {
        return;
      }
      // Close if clicking outside both button and calendar
      setShowCalendar(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCalendar(false); };
    // Use a slight delay to ensure the button's onClick runs first
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', onDocClick);
    }, 0);
    document.addEventListener('keydown', onEsc);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [showCalendar]);

  // Search handler
  const applySearch = useCallback(async (nextSearch: string) => {
    const s = String(nextSearch || '').trim();
    setSearchQuery(s);
    if (onSearchChange) {
      onSearchChange(s);
    }
    
    didInitialLoadRef.current = true;
    dispatch(clearHistory());
    dispatch(setFilters({
      mode,
      sortOrder,
      ...(s ? { search: s } : {}),
      ...(dateRange.start && dateRange.end ? { dateRange: { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() } } : {})
    } as any));
    await (dispatch as any)(loadHistory({
      filters: { mode, sortOrder, ...(s ? { search: s } : {}), ...(dateRange.start && dateRange.end ? { dateRange: { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() } } : {}) } as any,
      backendFilters: { mode, sortOrder, ...(s ? { search: s } : {}), ...(dateRange.start && dateRange.end ? { dateRange: { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() } } : {}) } as any,
      paginationParams: { limit: paginationLimit },
      requestOrigin: 'page',
      expectedType: mode === 'video' ? 'text-to-video' : 'text-to-image',
      skipBackendGenerationFilter: mode === 'image', // Image mode uses skipBackendGenerationFilter
      forceRefresh: true,
      debugTag: `HistoryControls:${mode}-search:${Date.now()}`,
    } as any));
  }, [dispatch, mode, sortOrder, dateRange, onSearchChange]);

  // Live prompt search (Freepik-style): as user types, debounce and query backend.
  useEffect(() => {
    // Skip first run (initial mount) to avoid an extra fetch.
    if (!didInitSearchRef.current) {
      didInitSearchRef.current = true;
      return;
    }

    const next = String(searchInput || '').trim();
    const applied = String(searchQuery || '').trim();
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
  const onSortChange = useCallback(async (order: 'asc' | 'desc') => {
    setSortOrder(order);
    if (onSortChangeCallback) {
      onSortChangeCallback(order);
    }
    
    didInitialLoadRef.current = true;
    dispatch(clearHistory());
    dispatch(setFilters({
      mode,
      sortOrder: order,
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      ...(dateRange.start && dateRange.end ? { dateRange: { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() } } : {})
    } as any));
    await (dispatch as any)(loadHistory({
      filters: { mode, sortOrder: order, ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}), ...(dateRange.start && dateRange.end ? { dateRange: { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() } } : {}) } as any,
      backendFilters: { mode, sortOrder: order, ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}), ...(dateRange.start && dateRange.end ? { dateRange: { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() } } : {}) } as any,
      paginationParams: { limit: paginationLimit },
      requestOrigin: 'page',
      expectedType: mode === 'video' ? 'text-to-video' : 'text-to-image',
      skipBackendGenerationFilter: mode === 'image', // Image mode uses skipBackendGenerationFilter
      forceRefresh: true,
      debugTag: `HistoryControls:${mode}-sort:${order}:${Date.now()}`,
    } as any));
  }, [dispatch, mode, dateRange, searchQuery, onSortChangeCallback]);

  // Date change handler
  const onDateChange = useCallback(async (next: { start: Date | null; end: Date | null }, nextInput?: string) => {
    setDateRange(next);
    if (typeof nextInput === 'string') setDateInput(nextInput);
    if (onDateChangeCallback) {
      onDateChangeCallback(next);
    }
    
    didInitialLoadRef.current = true;
    dispatch(clearHistory());
    dispatch(setFilters({
      mode,
      sortOrder,
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      ...(next.start && next.end ? { dateRange: { start: next.start.toISOString(), end: next.end.toISOString() } } : {})
    } as any));
    await (dispatch as any)(loadHistory({
      filters: { mode, sortOrder, ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}), ...(next.start && next.end ? { dateRange: { start: next.start.toISOString(), end: next.end.toISOString() } } : {}) } as any,
      backendFilters: { mode, sortOrder, ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}), ...(next.start && next.end ? { dateRange: { start: next.start.toISOString(), end: next.end.toISOString() } } : {}) } as any,
      paginationParams: { limit: paginationLimit },
      requestOrigin: 'page',
      expectedType: mode === 'video' ? 'text-to-video' : 'text-to-image',
      skipBackendGenerationFilter: mode === 'image', // Image mode uses skipBackendGenerationFilter
      forceRefresh: true,
      debugTag: `HistoryControls:${mode}-date:${Date.now()}`,
    } as any));
  }, [dispatch, mode, sortOrder, searchQuery, onDateChangeCallback]);

  return (
    <div className="flex items-center justify-end gap-2 px-0 md:px-0 mb-2 pt-10 md:pt-0 sticky">
      {/* Prompt search (backend-driven) */}
      <div className="relative flex items-center mr-auto">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search prompt..."
          className={`px-2 py-1 md:py-2 rounded-lg text-xs bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/10 text-white placeholder-white/70 w-44 md:w-60 ${searchInput ? 'pr-8' : ''}`}
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              // X behaves like clear: remove applied backend search and reload.
              setSearchInput('');
              applySearch('');
            }}
            className="absolute right-1 p-1 rounded bg-white/5 hover:bg-white/10 text-white/80"
            aria-label="Clear search input"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      <button
        onClick={() => onSortChange('desc')}
        className={`relative group md:px-2 px-1 py-1 md:py-2 rounded-lg text-xs flex items-center gap-1.5 ${sortOrder === 'desc' ? 'bg-white ring-1 ring-white/5 text-black' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}
        aria-label="Recent"
      >
        <img src="/icons/upload-square-2 (1).svg" alt="Recent" className={`${sortOrder === 'desc' ? '' : 'invert'} w-4 h-4`} />
        <span className="hidden md:block text-xs">Recent</span>
      </button>
      <button
        onClick={() => onSortChange('asc')}
        className={`relative group md:px-2 px-1 py-1 md:py-2 rounded-lg text-xs flex items-center gap-1.5 ${sortOrder === 'asc' ? 'bg-white ring-1 ring-white/5 text-black' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}
        aria-label="Oldest"
      >
        <img src="/icons/download-square-2.svg" alt="Oldest" className={`${sortOrder === 'asc' ? '' : 'invert'} w-4 h-4`} />
        <span className="hidden md:block text-xs">Oldest</span>
      </button>

      {/* Date picker */}
      <div className="relative flex items-center gap-1">
        <input
          ref={dateInputRef}
          type="date"
          value={dateInput}
          onChange={async (e) => {
            const value = e.target.value;
            setDateInput(value);
            if (!value) {
              await onDateChange({ start: null, end: null }, '');
              return;
            }
            const d = new Date(value + 'T00:00:00');
            const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
            const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
            await onDateChange({ start, end }, value);
          }}
          style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, opacity: 0 }}
        />
        <button
          ref={calendarButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            const base = dateRange.start ? new Date(dateRange.start) : new Date();
            setCalendarMonth(base.getMonth());
            setCalendarYear(base.getFullYear());
            if (!showCalendar && calendarButtonRef.current) {
              // Calculate position for mobile (fixed positioning)
              const rect = calendarButtonRef.current.getBoundingClientRect();
              setCalendarPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right
              });
            }
            setShowCalendar((v) => !v);
          }}
          className={`relative group px-1 py-1 md:py-1.5 rounded-lg text-xs ${(showCalendar || dateRange.start) ? 'bg-white ring-1 ring-white/5 text-black' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}
          aria-label="Date"
        >
          <img src="/icons/calendar-days.svg" alt="Date" className={`${(showCalendar || dateRange.start) ? '' : 'invert'} w-5 h-5`} />
        </button>
          {showCalendar && mounted && typeof document !== 'undefined' && createPortal(
            <div 
              ref={calendarRef} 
              data-calendar-popup="true" 
              className="fixed w-[280px] max-w-[calc(100vw-1rem)] select-none bg-black/90 backdrop-blur-3xl rounded-xl ring-1 ring-white/20 shadow-2xl p-3" 
              onMouseDown={(e) => e.stopPropagation()} 
              style={{
                top: calendarPosition?.top ? `${calendarPosition.top}px` : 'auto',
                right: calendarPosition?.right ? `${calendarPosition.right}px` : '1rem',
                zIndex: 99999,
                ...(typeof window !== 'undefined' && window.innerWidth >= 768 ? {
                  position: 'absolute',
                  top: 'auto',
                  right: '0',
                  bottom: 'auto'
                } : {})
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
              >‹</button>
              <div className="text-sm font-semibold">
                {new Date(calendarYear, calendarMonth, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
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
              >›</button>
            </div>
            <div className="grid grid-cols-7 text-[11px] text-white/70 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (<div key={d} className="text-center py-1">{d}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calendarFirstWeekday }).map((_, i) => (
                <div key={`pad-${i}`} className="h-8" />
              ))}
              {Array.from({ length: calendarDaysInMonth }).map((_, i) => {
                const day = i + 1;
                const thisDate = new Date(calendarYear, calendarMonth, day);
                const isSelected = !!dateRange.start && new Date(dateRange.start).toDateString() === thisDate.toDateString();
                return (
                  <button
                    key={day}
                    className={`h-8 rounded text-sm text-center text-white hover:bg-white/15 ${isSelected ? 'bg-white/25 ring-1 ring-white/40' : 'bg-white/5'}`}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const start = new Date(thisDate.getFullYear(), thisDate.getMonth(), thisDate.getDate(), 0, 0, 0);
                      const end = new Date(thisDate.getFullYear(), thisDate.getMonth(), thisDate.getDate(), 23, 59, 59, 999);
                      const iso = thisDate.toISOString().slice(0, 10);
                      setDateInput(iso);
                      await onDateChange({ start, end }, iso);
                      setShowCalendar(false);
                    }}
                  >{day}</button>
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
                  setDateInput('');
                  await onDateChange({ start: null, end: null }, '');
                  setShowCalendar(false);
                }}
              >Clear</button>
              <button 
                className="text-white/90 text-sm px-2 py-1 rounded hover:bg-white/10" 
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const now = new Date();
                  setCalendarMonth(now.getMonth());
                  setCalendarYear(now.getFullYear());
                }}
              >Today</button>
            </div>
          </div>,
          document.body
        )}
        {dateRange.start && (
          <button
            className="px-1 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-md"
            onClick={async () => {
              setDateInput('');
              await onDateChange({ start: null, end: null }, '');
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default HistoryControls;

