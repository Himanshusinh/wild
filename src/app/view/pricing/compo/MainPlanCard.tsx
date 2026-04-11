'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ArrowUpRight } from 'lucide-react';
import { getAccessibilityRowPresentation, PLAN_ACCESSIBILITY_ROWS, type MainPlanConfig } from './pricingConfig';
import type { BillingPeriod } from './BillingPeriodToggle';
import { formatCredits, formatInr, getPlanPricingDerived, PRICE_SKELETON_CLASS } from './pricingMath';

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
  isCurrent?: boolean;
  gstRatePercent?: number;
  compact?: boolean;
  className?: string;
  /** When set with `formatDisplayMoney`, show converted primary + INR reference (billing stays INR). */
  displayCurrency?: string;
  formatDisplayMoney?: (amountInr: number) => string;
  /** Shimmer over price band while FX rates are loading (non-INR display). */
  isPriceLoading?: boolean;
}

export function MainPlanCard({
  plan,
  billingPeriod,
  onCta,
  isCurrent,
  gstRatePercent = 18,
  compact,
  className = '',
  displayCurrency = 'INR',
  formatDisplayMoney,
  isPriceLoading = false,
}: MainPlanCardProps) {
  const isHi = plan.highlighted;
  const isYearly = billingPeriod === 'yearly';
  const d = getPlanPricingDerived(plan);

  const billingDir: BillingAnimDir = isYearly ? 'toYearly' : 'toMonthly';

  const isForeign =
    String(displayCurrency || '')
      .trim()
      .toUpperCase() !== 'INR' && typeof formatDisplayMoney === 'function';

  /** Main row: yearly avg when yearly; list monthly when monthly (monthly mode hides yearly entirely). */
  const monthlyPriceStr = formatInr(plan.monthlyINR, 0);
  const yearlyPriceStr = formatInr(d.displayMonthlyYearly, 1);
  const primaryMonthly = isForeign ? formatDisplayMoney!(plan.monthlyINR) : monthlyPriceStr;
  const primaryYearly = isForeign ? formatDisplayMoney!(d.displayMonthlyYearly) : yearlyPriceStr;
  const activePrice = isYearly ? primaryYearly : primaryMonthly;
  const activeInrAmount = isYearly ? d.displayMonthlyYearly : plan.monthlyINR;
  /** Wider amount reserves width; ghost row includes `/mo` so the whole line matches live layout. */
  const mainPriceWidthGhost =
    primaryMonthly.length >= primaryYearly.length ? primaryMonthly : primaryYearly;
  const priceKey = `${plan.id}-${isYearly ? 'yearly' : 'monthly'}`;

  const creditsLine = `${formatCredits(plan.monthlyCredits)} credits refresh every month.`;

  return (
    <article
      className={[
        'relative flex flex-col rounded-2xl border transition-all duration-300 h-full min-h-0',
        compact ? 'p-5 min-h-[480px]' : 'p-6 min-h-[540px]',
        isHi
          ? 'shadow-[0_0_40px_rgba(96,165,250,0.2)] z-20 ring-1 ring-[#60a5fa]/35'
          : 'z-10 hover:border-white/[0.18]',
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
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
        {isCurrent ? (
          <span className="shrink-0 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
            Current plan
          </span>
        ) : null}
      </div>

      {/** Fixed vertical band: strike (always real INR when yearly) + main price (skeleton only while FX loads). */}
      <div className="mt-2 flex flex-col gap-0 shrink-0 min-h-[4.125rem] sm:min-h-[4.25rem]">
        <div className="h-[1.25rem] sm:h-[1.3rem] flex items-end shrink-0 overflow-visible leading-none relative z-10">
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

        <div className="relative z-30 min-h-[2.85rem] sm:min-h-[3.1rem] flex items-end">
          {isPriceLoading ? (
            <div className={PRICE_SKELETON_CLASS} aria-hidden />
          ) : (
            <div className="relative inline-block align-baseline shrink-0">
              <span
                className="invisible inline-flex items-baseline gap-1.5 whitespace-nowrap pointer-events-none select-none leading-none"
                aria-hidden
              >
                <span className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight">
                  {mainPriceWidthGhost}
                </span>
                <span className="text-base sm:text-lg font-medium">/mo</span>
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
                    className="absolute left-0 bottom-0 inline-flex items-baseline gap-1.5 whitespace-nowrap will-change-transform"
                  >
                    <span
                      className={[
                        'text-3xl sm:text-4xl font-bold tabular-nums tracking-tight',
                        isHi
                          ? 'bg-gradient-to-br from-white via-[#f1f5f9] to-[#93c5fd] bg-clip-text text-transparent [filter:drop-shadow(0_0_22px_rgba(96,165,250,0.55))]'
                          : 'text-white [filter:drop-shadow(0_0_18px_rgba(96,165,250,0.35))]',
                      ].join(' ')}
                    >
                      {activePrice}
                    </span>
                    <span
                      className={[
                        'text-base sm:text-lg font-semibold tabular-nums',
                        isHi ? 'text-[#bfdbfe]' : 'text-slate-300',
                      ].join(' ')}
                    >
                      /mo
                    </span>
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
      {isForeign && !isPriceLoading ? (
        <p className="mt-1 text-[11px] text-slate-500 tabular-nums relative z-10">
          ≈ {formatInr(activeInrAmount, isYearly ? 1 : 0)}{' '}
          <span className="text-slate-600">/mo charged in INR</span>
        </p>
      ) : null}
      <p className="mt-2 text-xs text-slate-500">
        +{gstRatePercent}% GST at checkout
      </p>

      <ul className="mt-3 flex-1 flex flex-col gap-2.5 min-h-0 mb-0 list-none p-0" aria-label={`${plan.name} plan details`}>
        <li className="flex items-start gap-2.5 text-sm text-slate-200 font-medium">
          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isHi ? 'text-[#60a5fa]' : 'text-slate-500'}`} strokeWidth={2.5} />
          {creditsLine}
        </li>
        {isYearly ? (
          <li className="flex items-start gap-2.5 text-sm text-slate-300">
            <Check
              className={`w-4 h-4 shrink-0 mt-0.5 ${isHi ? 'text-[#60a5fa]' : 'text-slate-500'}`}
              strokeWidth={2.5}
            />
            Paid yearly. Credits are added monthly.
          </li>
        ) : null}
        <li className="flex items-start gap-2.5 text-sm text-slate-300">
          <Check
            className={`w-4 h-4 shrink-0 mt-0.5 ${isHi ? 'text-[#60a5fa]' : 'text-slate-500'}`}
            strokeWidth={2.5}
          />
          Unused credits expire at refresh.
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
          'mt-auto w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200',
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
