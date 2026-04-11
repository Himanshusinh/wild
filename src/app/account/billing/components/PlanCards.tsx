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
      <div className="flex justify-end mb-4">
        <CurrencySwitcher />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayPlans.map((plan) => {
        const isCurrent = plan.code === currentPlanCode;
        const currentPlanPrice = currentSku ? currentSku.priceInPaise / 100 : 0;
        const canUpgrade = !currentPlanCode || plan.priceINR > currentPlanPrice;

        return (
          <div
            key={plan.code}
            className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl ${
              isCurrent ? "ring-2 ring-green-500" : ""
            } ${plan.popular ? "ring-2 ring-blue-500" : ""}`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
            )}

            {/* Current Plan Badge */}
            {isCurrent && (
              <div className="absolute -top-3 right-4">
                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  CURRENT PLAN
                </span>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex flex-col items-center gap-1">
                {isPriceFxPending && plan.priceINR > 0 ? (
                  <div className="relative z-20 flex min-h-[2.5rem] items-center justify-center py-1">
                    <div className={PRICE_SKELETON_CLASS} aria-hidden />
                  </div>
                ) : (
                  <>
                    <div className="relative z-10 flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-extrabold">
                        {isForeign && plan.priceINR > 0
                          ? formatMoney(plan.priceINR)
                          : `₹${plan.priceINR}`}
                      </span>
                      {plan.priceINR > 0 && (
                        <span className="text-gray-500 dark:text-gray-400">
                          /{plan.cycleLabel}
                        </span>
                      )}
                    </div>
                    {isForeign && plan.priceINR > 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                        ≈ ₹{plan.priceINR.toLocaleString("en-IN")} charged in INR
                      </p>
                    ) : null}
                  </>
                )}
              </div>
              {plan.priceINR > 0 && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  +{plan.gstRatePercent}% GST at checkout
                </p>
              )}
            </div>

            {/* Credits & Storage */}
            <div className="mb-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Credits
                </span>
                <span className="font-semibold">
                  {plan.credits.toLocaleString()}
                  {"/mo"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Storage
                </span>
                <span className="font-semibold">{plan.storageGB} GB</span>
              </div>
            </div>

            {/* Features List */}
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={() => onSelectPlan(plan.code)}
              disabled={isCurrent}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                isCurrent
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : plan.popular
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
              }`}
            >
              {isCurrent
                ? "Current Plan"
                : canUpgrade
                ? plan.priceINR === 0
                  ? "Get Started"
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
