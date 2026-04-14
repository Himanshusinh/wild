'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ChevronDown } from 'lucide-react';
import type { AppDispatch } from '@/store';
import { fetchMe } from '@/store/slices/authSlice';
import { getApiClient } from '@/lib/axiosInstance';
import { clearMeCache } from '@/lib/me';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

const COMMON_FIRST = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY', 'AED'] as const;

export function CurrencySwitcher({ className = '' }: { className?: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const { displayCurrency, availableCurrencies, fxLoading } = useDisplayCurrency();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const options = useMemo(() => {
    const set = new Set<string>([...COMMON_FIRST, ...availableCurrencies]);
    return [...set].filter((c) => /^[A-Z]{3}$/.test(c)).sort((a, b) => {
      if (a === 'INR') return -1;
      if (b === 'INR') return 1;
      return a.localeCompare(b);
    });
  }, [availableCurrencies]);

  const onChange = useCallback(
    async (nextRaw: string) => {
      const next = nextRaw.toUpperCase();
      if (next === displayCurrency) return;
      setSaving(true);
      try {
        await getApiClient().patch('/api/auth/me', { preferredCurrency: next });
        clearMeCache();
        await dispatch(fetchMe()).unwrap();
      } catch {
      } finally {
        setSaving(false);
      }
    },
    [dispatch, displayCurrency],
  );

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div className={`inline-flex items-center gap-2 text-xs text-zinc-400 ${className}`}>
      <span className="whitespace-nowrap text-zinc-400">Display currency</span>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={saving || fxLoading}
          onClick={() => setOpen((prev) => !prev)}
          className={[
            'flex min-w-[5.75rem] items-center justify-between gap-2 rounded-lg border py-1.5 pl-3 pr-2.5',
            'bg-[#0b0d12] text-sm font-medium tabular-nums text-slate-100',
            'border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
            'transition-colors hover:border-white/25 hover:bg-[#0f1219]',
            'focus:border-[#60a5fa]/45 focus:outline-none focus:ring-2 focus:ring-[#60a5fa]/25',
            'disabled:cursor-not-allowed disabled:opacity-55',
          ].join(' ')}
        >
          <span>{displayCurrency}</span>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {open && (
          <div className="absolute right-0 z-50 mt-2 max-h-72 min-w-[7.5rem] overflow-y-auto rounded-xl border border-white/15 bg-[#090b11] py-1 shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
            {options.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setOpen(false);
                  void onChange(c);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition ${
                  c === displayCurrency
                    ? 'bg-[#2F6BFF]/20 text-[#9fbeff]'
                    : 'text-zinc-200 hover:bg-white/[0.06]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
