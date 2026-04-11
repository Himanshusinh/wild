'use client';

import React from 'react';
import { formatInr, PRICE_SKELETON_STARTER_CLASS } from './pricingMath';

interface StarterCapsuleProps {
  priceINR: number;
  onCta: () => void;
  displayCurrency?: string;
  formatDisplayMoney?: (amountInr: number) => string;
  isPriceLoading?: boolean;
}

export function StarterCapsule({
  priceINR,
  onCta,
  displayCurrency = 'INR',
  formatDisplayMoney,
  isPriceLoading = false,
}: StarterCapsuleProps) {
  const isForeign =
    String(displayCurrency || '')
      .trim()
      .toUpperCase() !== 'INR' && typeof formatDisplayMoney === 'function';
  const primary = isForeign ? formatDisplayMoney!(priceINR) : formatInr(priceINR);
  return (
    <button
      type="button"
      onClick={onCta}
      className={[
        'relative w-full max-w-md rounded-2xl px-6 py-3.5 sm:px-8 sm:py-4',
        'flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center sm:text-left sm:justify-between',
        'border-2 border-[#60a5fa]/55 bg-gradient-to-r from-[#60a5fa]/20 via-white/[0.08] to-[#60a5fa]/10',
        'shadow-[0_0_36px_rgba(96,165,250,0.25),inset_0_1px_0_0_rgba(255,255,255,0.12)]',
        'transition-all duration-200 hover:border-[#60a5fa] hover:shadow-[0_0_48px_rgba(96,165,250,0.35)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070b]',
      ].join(' ')}
    >
      <span className="text-sm sm:text-base font-semibold text-white tracking-tight">Try out starter plan</span>
      <span className="flex flex-col items-end sm:items-end gap-0.5 shrink-0">
        {isPriceLoading ? (
          <span className={PRICE_SKELETON_STARTER_CLASS} aria-hidden />
        ) : (
          <>
            <span className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold tabular-nums text-white">{primary}</span>
              <span className="text-xs text-slate-400">/mo</span>
            </span>
            {isForeign ? (
              <span className="text-[10px] text-slate-500 tabular-nums">
                ≈ {formatInr(priceINR)} INR
              </span>
            ) : null}
          </>
        )}
      </span>
    </button>
  );
}
