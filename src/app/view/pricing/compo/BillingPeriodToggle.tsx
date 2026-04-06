'use client';

import React from 'react';

export type BillingPeriod = 'monthly' | 'yearly';

interface BillingPeriodToggleProps {
  value: BillingPeriod;
  onChange: (next: BillingPeriod) => void;
  /** e.g. 20 — shown on the Yearly segment corner badge. */
  yearlyPrimaryDiscountPercent: number;
  className?: string;
}

export function BillingPeriodToggle({
  value,
  onChange,
  yearlyPrimaryDiscountPercent,
  className = '',
}: BillingPeriodToggleProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className="inline-flex rounded-full border border-white/15 bg-white/[0.04] p-1 shadow-inner overflow-visible"
        role="tablist"
        aria-label="Billing period"
      >
        <button
          type="button"
          role="tab"
          aria-selected={value === 'monthly'}
          onClick={() => onChange('monthly')}
          className={`rounded-full px-4 py-2.5 text-xs font-semibold transition-all sm:px-5 sm:text-sm min-w-[5.5rem] sm:min-w-[6.25rem] ${
            value === 'monthly'
              ? 'bg-white text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={value === 'yearly'}
          aria-label={`Yearly billing — ${yearlyPrimaryDiscountPercent}% off the annual total vs paying list price monthly`}
          onClick={() => onChange('yearly')}
          className={`relative overflow-visible rounded-full px-4 py-2.5 text-xs font-semibold transition-all sm:px-5 sm:text-sm min-w-[5.5rem] sm:min-w-[6.25rem] ${
            value === 'yearly'
              ? 'bg-gradient-to-r from-[#60a5fa] to-[#93c5fd] text-black shadow-md ring-1 ring-white/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span
            className={[
              'pointer-events-none absolute z-10 rounded-md border px-1.5 py-0.5 text-[9px] font-bold leading-none tracking-wide shadow-md sm:text-[10px] sm:px-2',
              value === 'yearly'
                ? 'right-1 top-0 -translate-y-1/2 border-white/95 bg-slate-950 text-[#7dd3fc] shadow-black/50'
                : 'right-0.5 top-0 -translate-y-1/2 border-white/25 bg-slate-900/95 text-slate-200 shadow-black/40',
            ].join(' ')}
            title={`${yearlyPrimaryDiscountPercent}% off the annual bill vs 12× list price`}
          >
            {yearlyPrimaryDiscountPercent}% off
          </span>
          Yearly
        </button>
      </div>
    </div>
  );
}
