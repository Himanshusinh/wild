'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ArrowUpRight } from 'lucide-react';
import { getAccessibilityRowPresentation, PLAN_ACCESSIBILITY_ROWS, type MainPlanConfig } from './pricingConfig';
import type { BillingPeriod } from './BillingPeriodToggle';
import { formatCredits, formatInr, getPlanPricingDerived } from './pricingMath';

const BG_CARD = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.1)';
const BORDER_ACCENT = 'rgba(96, 165, 250, 0.45)';

const easePrice = [0.22, 1, 0.36, 1] as const;

const priceTransition = { duration: 0.42, ease: easePrice };

/** After toggle: `toYearly` = user just chose yearly; `toMonthly` = user chose monthly. Drives exit direction. */
type BillingAnimDir = 'toYearly' | 'toMonthly';

/** Strikethrough list row: rises in with yearly; on switch to monthly it exits up and fades (line disappears). */
const strikeVariants = {
  initial: { opacity: 0, y: 22, x: 0 },
  animate: { opacity: 1, y: 0, x: 0, transition: priceTransition },
  exit: {
    opacity: 0,
    y: -22,
    x: 0,
    scale: 0.94,
    transition: { duration: 0.3, ease: easePrice },
  },
};

const mainVariants = {
  /**
   * Enter: yearly comes from below (`toYearly`); monthly comes from above (`toMonthly`) — reverse paths.
   */
  initial: (dir: BillingAnimDir) => ({
    opacity: 0,
    y: dir === 'toYearly' ? 38 : -36,
    x: 0,
    scale: 1,
    textDecoration: 'none',
    color: 'rgb(255 255 255)',
    transition: {
      ...priceTransition,
      delay: dir === 'toYearly' ? 0.05 : 0.08,
    },
  }),
  animate: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    textDecoration: 'none',
    color: 'rgb(255 255 255)',
    transition: priceTransition,
  },
  exit: (dir: BillingAnimDir) =>
    dir === 'toYearly'
      ? {
          /** Monthly list price: moves up + struck through (becomes the “canceled” story). */
          opacity: 0,
          y: -42,
          x: 0,
          scale: 0.86,
          textDecoration: 'line-through',
          color: 'rgb(148 163 184)',
          transition: { ...priceTransition, duration: 0.38 },
        }
      : {
          /** Yearly effective price: moves down and out (reverse of entering from below). */
          opacity: 0,
          y: 52,
          x: 0,
          scale: 0.86,
          textDecoration: 'none',
          color: 'rgb(148 163 184)',
          transition: { ...priceTransition, duration: 0.4 },
        },
};

interface MainPlanCardProps {
  plan: MainPlanConfig;
  billingPeriod: BillingPeriod;
  onCta: () => void;
  gstRatePercent?: number;
  compact?: boolean;
  className?: string;
}

export function MainPlanCard({
  plan,
  billingPeriod,
  onCta,
  gstRatePercent = 18,
  compact,
  className = '',
}: MainPlanCardProps) {
  const isHi = plan.highlighted;
  const isYearly = billingPeriod === 'yearly';
  const d = getPlanPricingDerived(plan);

  const billingDir: BillingAnimDir = isYearly ? 'toYearly' : 'toMonthly';

  /** Main row: yearly avg when yearly; list monthly when monthly (monthly mode hides yearly entirely). */
  const monthlyPriceStr = formatInr(plan.monthlyINR, 0);
  const yearlyPriceStr = formatInr(d.displayMonthlyYearly, 1);
  const activePrice = isYearly ? yearlyPriceStr : monthlyPriceStr;
  /** Wider amount reserves width; ghost row includes `/mo` so the whole line matches live layout. */
  const mainPriceWidthGhost =
    monthlyPriceStr.length >= yearlyPriceStr.length ? monthlyPriceStr : yearlyPriceStr;
  const priceKey = `${plan.id}-${isYearly ? 'yearly' : 'monthly'}`;

  const monthlyCreditsLine = `${formatCredits(plan.monthlyCredits)} credits / month`;
  const yearlyCreditsLine = `${formatCredits(plan.monthlyCredits * 12)} credits / year`;
  const creditsLine = isYearly ? yearlyCreditsLine : monthlyCreditsLine;

  return (
    <article
      className={[
        'relative flex flex-col rounded-2xl border transition-all duration-300 h-full min-h-0',
        compact ? 'p-5 min-h-[520px]' : 'p-6 min-h-[580px]',
        isHi
          ? 'shadow-[0_0_40px_rgba(96,165,250,0.2)] z-[1] ring-1 ring-[#60a5fa]/35'
          : 'hover:border-white/[0.18]',
        className,
      ].join(' ')}
      style={{
        background: isHi
          ? 'linear-gradient(165deg, rgba(96,165,250,0.12) 0%, rgba(15,17,21,0.96) 45%, rgba(7,7,11,0.98) 100%)'
          : BG_CARD,
        borderColor: isHi ? BORDER_ACCENT : BORDER,
        boxShadow: isHi ? undefined : 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      }}
    >
      {isHi && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black"
          style={{
            background: 'linear-gradient(90deg, #fff 0%, #93c5fd 100%)',
            boxShadow: '0 4px 20px rgba(96,165,250,0.35)',
          }}
        >
          Most popular
        </div>
      )}
      <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
      <p className="text-sm text-slate-400 mt-2 min-h-[40px] leading-snug">{plan.description}</p>

      {/** Fixed vertical band: strike slot + main price — same height when toggling billing. */}
      <div className="mt-3 flex flex-col gap-0 shrink-0 min-h-[4.125rem] sm:min-h-[4.25rem]">
        <div className="h-[1.25rem] sm:h-[1.3rem] flex items-end shrink-0 overflow-visible leading-none">
          <AnimatePresence initial={false} mode="sync">
            {isYearly ? (
              <motion.div
                key={`${plan.id}-strike-list`}
                variants={strikeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ transformOrigin: 'left bottom' }}
                className="flex items-baseline gap-1 leading-none"
              >
                <span className="text-[13px] sm:text-sm font-medium tabular-nums text-slate-500 line-through decoration-slate-500/90 decoration-1">
                  {formatInr(plan.monthlyINR, 0)}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-600 line-through decoration-slate-600/70 shrink-0">
                  /mo
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="min-h-[2.5rem] sm:min-h-[2.65rem] flex items-end">
          <div className="relative inline-block align-baseline shrink-0">
            <span
              className="invisible inline-flex items-baseline gap-1 whitespace-nowrap pointer-events-none select-none leading-none"
              aria-hidden
            >
              <span className="text-2xl sm:text-[1.75rem] font-semibold tabular-nums">
                {mainPriceWidthGhost}
              </span>
              <span className="text-sm font-normal">/mo</span>
            </span>
            <div className="absolute inset-0 flex items-end justify-start overflow-visible">
              <AnimatePresence initial={false} mode="sync" custom={billingDir}>
                <motion.span
                  key={`main-${priceKey}`}
                  custom={billingDir}
                  variants={mainVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ transformOrigin: 'left bottom' }}
                  className="absolute left-0 bottom-0 inline-flex items-baseline gap-1 whitespace-nowrap will-change-transform"
                >
                  <span className="text-2xl sm:text-[1.75rem] font-semibold tabular-nums tracking-tight text-inherit">
                    {activePrice}
                  </span>
                  <span className="text-sm font-normal text-inherit opacity-70">/mo</span>
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        +{gstRatePercent}% GST at checkout
      </p>

      <ul className="mt-4 flex-1 flex flex-col gap-2.5 min-h-0 mb-0 list-none p-0" aria-label={`${plan.name} plan details`}>
        <li className="flex items-start gap-2.5 text-sm text-slate-200 font-medium">
          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isHi ? 'text-[#60a5fa]' : 'text-slate-500'}`} strokeWidth={2.5} />
          {creditsLine}
        </li>
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
            <Check
              className={`w-4 h-4 shrink-0 mt-0.5 ${isHi ? 'text-[#60a5fa]' : 'text-slate-500'}`}
              strokeWidth={2.5}
            />
            {f}
          </li>
        ))}
        {PLAN_ACCESSIBILITY_ROWS.map((row) => {
          const { line, positive } = getAccessibilityRowPresentation(plan, row.key);
          return (
            <li key={row.key} className="flex items-start gap-2.5 text-sm text-slate-300">
              {positive ? (
                <Check
                  className={`w-4 h-4 shrink-0 mt-0.5 ${isHi ? 'text-[#60a5fa]' : 'text-slate-500'}`}
                  strokeWidth={2.5}
                />
              ) : (
                <span className="inline-flex shrink-0 mt-0.5" title="Not included">
                  <X
                    className={`w-4 h-4 ${isHi ? 'text-rose-400' : 'text-slate-500'}`}
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </span>
              )}
              {line}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onCta}
        className={[
          'mt-4 mt-auto w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200',
          isHi
            ? 'text-black bg-gradient-to-r from-white to-[#93c5fd] hover:from-[#93c5fd] hover:to-[#60a5fa] hover:text-white shadow-[0_0_24px_rgba(96,165,250,0.35)]'
            : 'text-white border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25',
        ].join(' ')}
      >
        {plan.cta}
        <ArrowUpRight className="w-4 h-4 opacity-80" />
      </button>
    </article>
  );
}
