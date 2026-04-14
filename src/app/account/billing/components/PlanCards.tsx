"use client";

import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { PRICE_SKELETON_CLASS } from "@/app/view/pricing/compo/pricingMath";
import { CurrencySwitcher } from "@/app/view/pricing/compo/CurrencySwitcher";

export interface Plan {
  family: string;
  code: string;
  name: string;
  billingInterval: "MONTHLY" | "YEARLY";
  credits: number;
  storageGB: number;
  priceINR: number;
  gstRatePercent: number;
  gstAmountINR: number;
  totalPriceINR: number;
  cycleLabel: string;
  features: string[];
  popular?: boolean;
}

interface CatalogSku {
  code: string;
  credits: number;
  storageGB: number;
  priceInPaise: number;
  gstRatePercent: number;
  gstAmountInPaise: number;
  totalWithGstInPaise: number;
}

export interface CatalogPlanFamily {
  family: string;
  name: string;
  monthly: CatalogSku | null;
  yearly: CatalogSku | null;
}

interface PlanCardsProps {
  plans: CatalogPlanFamily[];
  selectedBillingInterval: "MONTHLY" | "YEARLY";
  currentPlanCode?: string;
  onSelectPlan: (planCode: string) => void;
}

export default function PlanCards({
  plans,
  selectedBillingInterval,
  currentPlanCode,
  onSelectPlan,
}: PlanCardsProps) {
  const { displayCurrency, formatMoney, fxLoading, hasFxRates } = useDisplayCurrency();
  const isForeign = displayCurrency !== "INR";
  const isPriceFxPending = isForeign && (!hasFxRates || fxLoading);

  const currentSku =
    plans
      .flatMap((plan) => [plan.monthly, plan.yearly].filter(Boolean))
      .find((plan) => plan?.code === currentPlanCode) || null;

  const displayPlans = plans.reduce<Plan[]>((acc, plan) => {
      const sku =
        selectedBillingInterval === "YEARLY"
          ? plan.yearly
          : plan.monthly;
      if (!sku) return acc;

      const intervalLabel =
        selectedBillingInterval === "YEARLY" ? "year" : "month";

      acc.push({
        family: plan.family,
        code: sku.code,
        name: plan.name,
        billingInterval: selectedBillingInterval,
        credits: sku.credits,
        storageGB: sku.storageGB,
        priceINR: sku.priceInPaise / 100,
        gstRatePercent: sku.gstRatePercent,
        gstAmountINR: sku.gstAmountInPaise / 100,
        totalPriceINR: sku.totalWithGstInPaise / 100,
        cycleLabel: intervalLabel,
        popular: plan.family === "creator",
        features: [
          "Credits refresh every month.",
          ...(selectedBillingInterval === "YEARLY"
            ? ["Paid yearly. Credits are added monthly."]
            : []),
          "Unused credits expire at refresh.",
          `${sku.storageGB} GB storage`,
          selectedBillingInterval === "YEARLY"
            ? "Billed yearly (save 20%)."
            : "Billed monthly.",
          selectedBillingInterval === "YEARLY"
            ? "Cancel anytime (no refund)."
            : "Cancel anytime.",
          "Invoices with GST support",
        ],
      });
      return acc;
    }, []);

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-end">
        <CurrencySwitcher />
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      {displayPlans.map((plan) => {
        const isCurrent = plan.code === currentPlanCode;
        const currentPlanPrice = currentSku ? currentSku.priceInPaise / 100 : 0;
        const canUpgrade = !currentPlanCode || plan.priceINR > currentPlanPrice;

        return (
          <div
            key={plan.code}
            className={`relative rounded-2xl border bg-[#0a0a0a] p-6 transition-all duration-200 ${
              isCurrent
                ? "border-[#2F6BFF]/50 shadow-[0_0_0_1px_rgba(47,107,255,0.2)]"
                : "border-white/[0.08] hover:border-white/[0.14]"
            } ${
              plan.popular && !isCurrent
                ? "shadow-[0_0_0_1px_rgba(47,107,255,0.35)]"
                : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                <span className="rounded-full bg-[#2F6BFF] px-3 py-1 text-xs font-bold text-white shadow-[0_4px_14px_rgba(47,107,255,0.45)]">
                  MOST POPULAR
                </span>
              </div>
            )}

            {isCurrent && (
              <div className="absolute -top-3 right-4">
                <span className="rounded-full border border-[#2F6BFF]/40 bg-[#2F6BFF]/15 px-3 py-1 text-xs font-bold text-[#7aa3ff]">
                  CURRENT PLAN
                </span>
              </div>
            )}

            <div className="mb-6 text-center">
              <h3 className="mb-2 text-2xl font-bold text-white">{plan.name}</h3>
              <div className="flex flex-col items-center gap-1">
                {isPriceFxPending && plan.priceINR > 0 ? (
                  <div className="relative z-20 flex min-h-[2.5rem] items-center justify-center py-1">
                    <div className={PRICE_SKELETON_CLASS} aria-hidden />
                  </div>
                ) : (
                  <>
                    <div className="relative z-10 flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-extrabold tabular-nums text-white">
                        {isForeign && plan.priceINR > 0
                          ? formatMoney(plan.priceINR)
                          : `₹${plan.priceINR}`}
                      </span>
                      {plan.priceINR > 0 && (
                        <span className="text-zinc-500">/{plan.cycleLabel}</span>
                      )}
                    </div>
                    {isForeign && plan.priceINR > 0 ? (
                      <p className="tabular-nums text-xs text-zinc-500">
                        ≈ ₹{plan.priceINR.toLocaleString("en-IN")} charged in INR
                      </p>
                    ) : null}
                  </>
                )}
              </div>
              {plan.priceINR > 0 && (
                <p className="mt-2 text-xs text-zinc-500">
                  +{plan.gstRatePercent}% GST at checkout
                </p>
              )}
            </div>

            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Credits</span>
                <span className="font-semibold tabular-nums text-zinc-200">
                  {plan.credits.toLocaleString()}
                  {"/mo"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Storage</span>
                <span className="font-semibold tabular-nums text-zinc-200">
                  {plan.storageGB} GB
                </span>
              </div>
            </div>

            <ul className="mb-6 space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2F6BFF]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-zinc-400">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => onSelectPlan(plan.code)}
              disabled={isCurrent}
              className={`w-full rounded-lg py-3 px-6 text-sm font-semibold transition-all ${
                isCurrent
                  ? "cursor-not-allowed border border-white/10 bg-white/[0.04] text-zinc-600"
                  : plan.popular
                    ? "bg-[#2F6BFF] text-white shadow-[0_4px_16px_rgba(47,107,255,0.4)] hover:bg-[#2a5fe3]"
                    : "border border-white/[0.12] bg-white/[0.06] text-white hover:bg-white/[0.1]"
              }`}
            >
              {isCurrent
                ? "Current plan"
                : canUpgrade
                  ? plan.priceINR === 0
                    ? "Get started"
                    : "Upgrade"
                  : "Downgrade"}
            </button>
          </div>
        );
      })}
      </div>
    </div>
  );
}
