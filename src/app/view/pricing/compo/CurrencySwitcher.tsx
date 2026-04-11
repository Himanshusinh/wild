'use client';

import React, { useCallback, useMemo, useState } from 'react';
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

  const options = useMemo(() => {
    const set = new Set<string>([...COMMON_FIRST, ...availableCurrencies]);
    return [...set].filter((c) => /^[A-Z]{3}$/.test(c)).sort((a, b) => {
      if (a === 'INR') return -1;
      if (b === 'INR') return 1;
      return a.localeCompare(b);
    });
  }, [availableCurrencies]);

  const onChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value.toUpperCase();
      if (next === displayCurrency) return;
      setSaving(true);
      try {
        await getApiClient().patch('/api/auth/me', { preferredCurrency: next });
        clearMeCache();
        await dispatch(fetchMe()).unwrap();
      } catch {
        e.target.value = displayCurrency;
      } finally {
        setSaving(false);
      }
    },
    [dispatch, displayCurrency],
  );

  return (
    <div className={`inline-flex items-center gap-2 text-xs text-slate-400 ${className}`}>
      <span className="text-slate-500 whitespace-nowrap">Display currency</span>
      <div className="relative">
        <select
          value={displayCurrency}
          onChange={onChange}
          disabled={saving || fxLoading}
          style={{ colorScheme: 'dark' }}
          className={[
            'appearance-none min-w-[5.75rem] cursor-pointer rounded-lg border py-1.5 pl-3 pr-9',
            'bg-[#0b0d12] text-sm font-medium tabular-nums text-slate-100',
            'border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
            '[&_option]:bg-[#0b0d12] [&_option]:text-slate-100',
            'transition-colors hover:border-white/25 hover:bg-[#0f1219]',
            'focus:border-[#60a5fa]/45 focus:outline-none focus:ring-2 focus:ring-[#60a5fa]/25',
            'disabled:cursor-not-allowed disabled:opacity-55',
          ].join(' ')}
        >
          {options.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
      </div>
    </div>
  );
}
