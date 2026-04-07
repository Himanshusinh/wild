/**
 * Single source of truth for marketing pricing.
 *
 * - Customer-facing yearly headline uses YEARLY_PRIMARY_DISCOUNT (e.g. 20% → effective /mo when prepaid yearly).
 * - Spark / Creator / Studio: primary + secondary compound to STANDARD_TIER_TOTAL_OFF_LIST_ANNUAL (33%).
 * - Agency: AGENCY_YEARLY_MULTIPLIER_FROM_GROSS (35% off list annual).
 *
 * Credits: exact monthly allowance per plan (static; edit here only).
 */

/** First annual step: billed annual = (monthly × 12) × (1 − this). Also drives headline /mo when yearly. */
export const YEARLY_PRIMARY_DISCOUNT = 0.2;

/**
 * Total fraction taken off list annual for Spark, Creator, Studio after both steps.
 * finalAnnual / grossAnnual = 1 − this ⇒ 0.67.
 */
export const STANDARD_TIER_TOTAL_OFF_LIST_ANNUAL = 0.33;

/**
 * Second step on *primary* annual only: (1−primary)(1−secondary) = 1 − STANDARD_TIER_TOTAL_OFF_LIST_ANNUAL.
 */
export const YEARLY_SECONDARY_DISCOUNT =
  1 - (1 - STANDARD_TIER_TOTAL_OFF_LIST_ANNUAL) / (1 - YEARLY_PRIMARY_DISCOUNT);

/** Agency: final annual = grossAnnual × this (35% off list annual). */
export const AGENCY_YEARLY_MULTIPLIER_FROM_GROSS = 0.65;

/** Shown on starter capsule only; never multiplied or discounted. */
export const STARTER_MONTHLY_INR = 99;

export type MainPlanId = 'spark' | 'creator' | 'studio' | 'agency';

/** Row order for access details on plan cards (after marketing features). */
export const PLAN_ACCESSIBILITY_ROWS = [
  { key: 'queue', label: 'Queue' },
  { key: 'models', label: 'Models' },
  { key: 'studio', label: 'Studio' },
  { key: 'storage', label: 'Storage' },
  { key: 'videoEditor', label: 'Video editor' },
  { key: 'imageEditor', label: 'Image editor' },
] as const;

export type PlanAccessibilityKey = (typeof PLAN_ACCESSIBILITY_ROWS)[number]['key'];

/** Per-plan extra rows under marketing features (queue count, model tier, Studio product, storage, editors). */
export interface PlanAccessibility {
  /** Concurrent queue capacity: Spark 0 → Agency 10. */
  queue: number;
  /** Spark: subset of models; other plans: full catalog. */
  models: 'few' | 'all';
  /** Studio workspace: Creator, Studio plan, and Agency only (not Spark). */
  studio: boolean;
  /** Cloud library storage (GB): Spark 5 → Agency 100. */
  storageGB: number;
  videoEditor: boolean;
  imageEditor: boolean;
}

/** Card list line + whether to show a check (vs minus) for that row. */
export function getAccessibilityRowPresentation(
  plan: { accessibility: PlanAccessibility },
  key: PlanAccessibilityKey,
): { line: string; positive: boolean } {
  const a = plan.accessibility;
  switch (key) {
    case 'queue':
      return { line: `Queue: ${a.queue}`, positive: true };
    case 'models':
      return { line: a.models === 'few' ? 'Few models' : 'All models', positive: true };
    case 'studio':
      return { line: 'Studio', positive: a.studio };
    case 'storage':
      return { line: `Storage: ${a.storageGB} GB`, positive: true };
    case 'videoEditor':
      return { line: 'Video editor', positive: a.videoEditor };
    case 'imageEditor':
      return { line: 'Image editor', positive: a.imageEditor };
  }
}

export interface MainPlanConfig {
  id: MainPlanId;
  name: string;
  monthlyINR: number;
  /** Monthly credits — fixed marketing numbers (not derived). */
  monthlyCredits: number;
  yearlySecondaryDiscount?: number;
  yearlyFinalMultiplierFromGross?: number;
  features: string[];
  /** Access details shown after marketing feature bullets. */
  accessibility: PlanAccessibility;
  highlighted?: boolean;
  cta: string;
}

export const MAIN_PLANS: MainPlanConfig[] = [
  {
    id: 'spark',
    name: 'Spark',
    monthlyINR: 699,
    monthlyCredits: 4000,
    features: ['Faster queues', 'All standard models', 'Library storage'],
    accessibility: {
      queue: 0,
      models: 'few',
      studio: false,
      storageGB: 5,
      videoEditor: true,
      imageEditor: true,
    },
    cta: 'Choose Spark',
  },
  {
    id: 'creator',
    name: 'Creator',
    monthlyINR: 1499,
    monthlyCredits: 8580,
    features: ['Priority generation', 'Commercial-friendly usage', 'More storage', 'Better support'],
    accessibility: {
      queue: 3,
      models: 'all',
      studio: true,
      storageGB: 15,
      videoEditor: true,
      imageEditor: true,
    },
    highlighted: true,
    cta: 'Choose Creator',
  },
  {
    id: 'studio',
    name: 'Studio',
    monthlyINR: 2799,
    monthlyCredits: 16_020,
    features: ['Highest priority', 'Expanded storage', 'Production-ready usage'],
    accessibility: {
      queue: 6,
      models: 'all',
      studio: true,
      storageGB: 30,
      videoEditor: true,
      imageEditor: true,
    },
    cta: 'Choose Studio',
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyINR: 12_999,
    monthlyCredits: 71_100,
    yearlyFinalMultiplierFromGross: AGENCY_YEARLY_MULTIPLIER_FROM_GROSS,
    features: ['Top priority lane', 'Bulk workflows', 'Success options'],
    accessibility: {
      queue: 10,
      models: 'all',
      studio: true,
      storageGB: 100,
      videoEditor: true,
      imageEditor: true,
    },
    cta: 'Choose Agency',
  },
];
