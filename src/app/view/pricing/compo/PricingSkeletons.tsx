'use client';

import React from 'react';

const pulse = 'animate-pulse rounded-md bg-white/10';

export function StarterCapsuleSkeleton() {
  return (
    <div
      className="w-full max-w-md rounded-2xl px-6 py-3.5 sm:px-8 sm:py-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-between border-2 border-white/10 bg-white/[0.03]"
      aria-hidden
    >
      <div className={`h-5 w-44 ${pulse}`} />
      <div className={`h-9 w-28 ${pulse}`} />
    </div>
  );
}

export function MainPlanCardSkeleton({
  compact,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <article
      className={[
        'relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] h-full min-h-0',
        compact ? 'p-5 min-h-[480px]' : 'p-6 min-h-[540px]',
        className,
      ].join(' ')}
      aria-hidden
    >
      <div className="flex justify-between gap-3">
        <div className={`h-6 w-28 ${pulse}`} />
        <div className={`h-5 w-20 rounded-full ${pulse}`} />
      </div>
      <div className="mt-4 space-y-2">
        <div className={`h-4 w-20 ${pulse}`} />
        <div className={`h-11 w-40 ${pulse}`} />
        <div className={`h-3 w-32 ${pulse}`} />
      </div>
      <div className="mt-4 flex-1 space-y-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-4 w-full max-w-[220px] ${pulse}`} />
        ))}
      </div>
      <div className={`mt-auto h-11 w-full rounded-xl ${pulse}`} />
    </article>
  );
}
