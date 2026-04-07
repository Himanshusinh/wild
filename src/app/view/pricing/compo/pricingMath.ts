import type { MainPlanConfig } from './pricingConfig';
import { YEARLY_PRIMARY_DISCOUNT, YEARLY_SECONDARY_DISCOUNT } from './pricingConfig';

/** Pre-discount annual (list × 12). */
export function grossAnnualFromMonthly(monthlyINR: number): number {
  return monthlyINR * 12;
}

/** Annual total after the first (customer-facing) yearly discount step — main “total to pay / yr” for yearly prepay. */
export function annualAfterPrimary(monthlyINR: number, primaryDiscount: number = YEARLY_PRIMARY_DISCOUNT): number {
  return grossAnnualFromMonthly(monthlyINR) * (1 - primaryDiscount);
}

/** Equivalent monthly when customer prepays yearly at the primary discount tier. */
export function effectiveMonthlyPrimaryYearly(monthlyINR: number, primaryDiscount: number = YEARLY_PRIMARY_DISCOUNT): number {
  return monthlyINR * (1 - primaryDiscount);
}

/**
 * Final annual after all stacked steps (primary on gross, then secondary on that result).
 * If plan has yearlyFinalMultiplierFromGross, annual = gross × that (overrides stack).
 */
export function annualAfterFullStack(plan: MainPlanConfig): number {
  if (plan.yearlyINR != null) {
    return plan.yearlyINR;
  }
  const gross = grossAnnualFromMonthly(plan.monthlyINR);
  const mult = plan.yearlyFinalMultiplierFromGross;
  if (mult != null) {
    return gross * mult;
  }
  const secondary = plan.yearlySecondaryDiscount ?? YEARLY_SECONDARY_DISCOUNT;
  const afterPrimary = gross * (1 - YEARLY_PRIMARY_DISCOUNT);
  return afterPrimary * (1 - secondary);
}

export function effectiveMonthlyFullStack(plan: MainPlanConfig): number {
  return annualAfterFullStack(plan) / 12;
}

/** (1 - finalAnnual/gross) × 100 */
export function totalOffGrossAnnualPercent(plan: MainPlanConfig): number {
  const gross = grossAnnualFromMonthly(plan.monthlyINR);
  if (gross <= 0) return 0;
  return (1 - annualAfterFullStack(plan) / gross) * 100;
}

/** Secondary saves this much vs the primary-discounted annual. */
export function secondarySavingsINR(plan: MainPlanConfig): number {
  if (plan.yearlyFinalMultiplierFromGross != null) {
    const primaryAnnual = annualAfterPrimary(plan.monthlyINR);
    return Math.max(0, primaryAnnual - annualAfterFullStack(plan));
  }
  const secondary = plan.yearlySecondaryDiscount ?? YEARLY_SECONDARY_DISCOUNT;
  if (secondary <= 0) return 0;
  const primaryAnnual = annualAfterPrimary(plan.monthlyINR);
  return primaryAnnual * secondary;
}

export function secondarySavingsMonthlyINR(plan: MainPlanConfig): number {
  return secondarySavingsINR(plan) / 12;
}

export function netMonthlyAfterFullStack(plan: MainPlanConfig): number {
  return effectiveMonthlyFullStack(plan);
}

export function impliedMarginMonthlyINR(plan: MainPlanConfig): number {
  return plan.monthlyINR - netMonthlyAfterFullStack(plan);
}

export function formatInr(amount: number, maximumFractionDigits: number = 0): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatCredits(value: number): string {
  if (!Number.isFinite(value)) return '';
  if (Number.isInteger(value)) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 20 }).format(value);
}

export function formatPercentRound(value: number): string {
  return `${Math.round(value)}%`;
}

/** Card + breakdown: pricing from list price; credits from plan.monthlyCredits. */
export function getPlanPricingDerived(plan: MainPlanConfig) {
  const grossAnnual = grossAnnualFromMonthly(plan.monthlyINR);
  const primaryAnnual = annualAfterPrimary(plan.monthlyINR);
  const finalAnnual = annualAfterFullStack(plan);
  const credits = plan.monthlyCredits;

  return {
    grossAnnual,
    primaryAnnual,
    finalAnnual,
    displayMonthlyYearly: finalAnnual / 12,
    effectiveMonthlyFullStack: effectiveMonthlyFullStack(plan),
    totalOffGrossPercent: totalOffGrossAnnualPercent(plan),
    secondarySavingsAnnual: secondarySavingsINR(plan),
    secondarySavingsMonthly: secondarySavingsMonthlyINR(plan),
    impliedMarginMonthly: impliedMarginMonthlyINR(plan),
    credits,
  };
}
