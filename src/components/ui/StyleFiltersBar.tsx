'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export type StyleFilterOption = {
  value: string;
  label: string;
};

type CustomDropdownProps = {
  ariaLabel: string;
  value: string;
  options: StyleFilterOption[];
  onChange: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
};

export const StyleFilterDropdown = ({
  ariaLabel,
  value,
  options,
  onChange,
  className = '',
  buttonClassName = "flex h-8 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm font-semibold text-white outline-none transition hover:border-white/20 hover:bg-white/[0.05]",
  searchable = true,
  searchPlaceholder = 'Search...',
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const selectedLabel = selectedOption?.label ?? '';

  useEffect(() => {
    if (!searchable) return;
    if (!isOpen) setSearchQuery(selectedLabel);
  }, [isOpen, searchable, selectedLabel]);

  useEffect(() => {
    if (!searchable || !isOpen) return;
    inputRef.current?.focus();
    inputRef.current?.setSelectionRange(
      inputRef.current.value.length,
      inputRef.current.value.length,
    );
  }, [isOpen, searchable]);

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, searchable, searchQuery]);

  return (
    <div ref={dropdownRef} className={className}>
      <div className="relative">
        {searchable ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              aria-label={ariaLabel}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              value={searchQuery}
              placeholder={searchPlaceholder}
              onFocus={() => setIsOpen(true)}
              onClick={() => setIsOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              className={`${buttonClassName} pr-8`}
            />
            <ChevronDown
              size={15}
              className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 shrink-0 text-white/55 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        ) : (
          <button
            type="button"
            aria-label={ariaLabel}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
            className={buttonClassName}
          >
            <span className="truncate">{selectedOption.label}</span>
            <ChevronDown
              size={15}
              className={`shrink-0 text-white/55 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        )}

        {isOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-full min-w-[150px] overflow-hidden rounded-2xl border border-white/10 bg-[#08080b] p-1 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div
              role="listbox"
              aria-label={ariaLabel}
              className="max-h-100 overflow-y-auto [scrollbar-width:thin]"
            >
              {filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center rounded-lg px-4 py-2 text-left text-sm transition ${
                      isSelected ? 'bg-white text-black' : 'text-white/82 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
              {filteredOptions.length === 0 && (
                <div className="px-4 py-2 text-xs text-white/45">
                  No results found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

type StyleFiltersBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  stateValue: string;
  onStateChange: (value: string) => void;
  stateOptions: StyleFilterOption[];
  typeValue: string;
  onTypeChange: (value: string) => void;
  typeOptions: StyleFilterOption[];
  searchPlaceholder?: string;
  stateLabel?: string;
  typeLabel?: string;
  className?: string;
  searchClassName?: string;
  stateClassName?: string;
  typeClassName?: string;
  stateDropdownSearchable?: boolean;
  typeDropdownSearchable?: boolean;
};

export default function StyleFiltersBar({
  searchValue,
  onSearchChange,
  stateValue,
  onStateChange,
  stateOptions,
  typeValue,
  onTypeChange,
  typeOptions,
  searchPlaceholder = 'Search styles',
  stateLabel = 'Filter by state',
  typeLabel = 'Filter by type',
  className = '',
  searchClassName = 'w-[260px]',
  stateClassName = 'w-[140px]',
  typeClassName = 'w-[140px]',
  stateDropdownSearchable = false,
  typeDropdownSearchable = false,
}: StyleFiltersBarProps) {
  const normalizedStateOptions = useMemo(() => {
    const withAll = stateOptions.some((option) => option.value === 'all')
      ? stateOptions
      : [{ value: 'all', label: 'All States' }, ...stateOptions];
    return withAll;
  }, [stateOptions]);

  const normalizedTypeOptions = useMemo(() => {
    const withAll = typeOptions.some((option) => option.value === 'all')
      ? typeOptions
      : [{ value: 'all', label: 'All Types' }, ...typeOptions];
    return withAll;
  }, [typeOptions]);

  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`.trim()}>
      <div className={`relative min-w-0 ${searchClassName}`.trim()}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
          aria-hidden
        />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:bg-white/[0.05]"
        />
      </div>

      <StyleFilterDropdown
        ariaLabel={stateLabel}
        value={stateValue}
        options={normalizedStateOptions}
        onChange={onStateChange}
        className={stateClassName}
        searchable={stateDropdownSearchable}
        searchPlaceholder="Search states"
      />

      <StyleFilterDropdown
        ariaLabel={typeLabel}
        value={typeValue}
        options={normalizedTypeOptions}
        onChange={onTypeChange}
        className={typeClassName}
        searchable={typeDropdownSearchable}
        searchPlaceholder="Search types"
      />
    </div>
  );
}
