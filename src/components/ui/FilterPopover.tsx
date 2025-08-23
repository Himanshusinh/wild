'use client';

import React from 'react';
import { HistoryFilters } from '@/types/history';

interface FilterPopoverProps {
  isOpen: boolean;
  filters: HistoryFilters;
  sortOrder: 'desc' | 'asc';
  dateRange: { start: Date | null; end: Date | null };
  onFilterChange: (key: keyof HistoryFilters, value: string | undefined) => void;
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
  onSortChange: (order: 'desc' | 'asc') => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onClose: () => void;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({
  isOpen,
  filters,
  sortOrder,
  dateRange,
  onFilterChange,
  onDateRangeChange,
  onSortChange,
  onApplyFilters,
  onClearFilters,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="filter-container absolute top-16 right-4 z-50 w-80 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 shadow-2xl">
      {/* Arrow pointing up */}
      <div className="absolute -top-2 right-6 w-4 h-4 bg-white/5 border-l border-t border-white/10 transform rotate-45"></div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white/80">Quick Filters</h3>
          <button
            onClick={onClearFilters}
            className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
          >
            Clear
          </button>
        </div>
        
        <div className="space-y-3">
          {/* Generation Type Filter */}
          <div>
            <label className="block text-xs text-white/60 mb-1">Type</label>
            <select
              value={filters.generationType || ''}
              onChange={(e) => onFilterChange('generationType', e.target.value || undefined)}
              className="w-full px-2 py-1.5 text-xs bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value="">All Types</option>
              <option value="text-to-image">Text to Image</option>
              <option value="logo-generation">Logo Generation</option>
              <option value="sticker-generation">Sticker Generation</option>
              <option value="text-to-video">Text to Video</option>
              <option value="text-to-music">Text to Music</option>
            </select>
          </div>
          
          {/* Model Filter */}
          <div>
            <label className="block text-xs text-white/60 mb-1">Model</label>
            <select
              value={filters.model || ''}
              onChange={(e) => onFilterChange('model', e.target.value || undefined)}
              className="w-full px-2 py-1.5 text-xs bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value="">All Models</option>
              <option value="flux-kontext-pro">Flux Kontext Pro</option>
              <option value="flux-pro-1.1">Flux Pro 1.1</option>
              <option value="gen4_aleph">Gen4 Aleph</option>
              <option value="gen4_turbo">Gen4 Turbo</option>
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-xs text-white/60 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange('status', e.target.value || undefined)}
              className="w-full px-2 py-1.5 text-xs bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="generating">Generating</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          {/* Sort Order */}
          <div>
            <label className="block text-xs text-white/60 mb-1">Sort</label>
            <select
              value={sortOrder}
              onChange={(e) => onSortChange(e.target.value as 'desc' | 'asc')}
              className="w-full px-2 py-1.5 text-xs bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          
          {/* Date Range Filter - Compact */}
          <div>
            <label className="block text-xs text-white/60 mb-1">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  onDateRangeChange(date, dateRange.end);
                }}
                className="w-full px-2 py-1.5 text-xs bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
              />
              <input
                type="date"
                value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  onDateRangeChange(dateRange.start, date);
                }}
                className="w-full px-2 py-1.5 text-xs bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
              />
            </div>
          </div>
        </div>
        
        {/* Apply Filters Button */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onApplyFilters}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors font-medium"
          >
            Apply
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPopover;
