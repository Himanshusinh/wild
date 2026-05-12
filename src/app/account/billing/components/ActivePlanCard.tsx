"use client";

import { useRouter } from "next/navigation";

interface ActivePlanCardProps {
  subscription: {
    id: string;
    planCode: string;
    status: string;
    nextBillingDate?: string;
  };
  credits: {
    creditBalance: number;
    storageUsed: number;
    storageQuota: number;
  };
  plan: {
    name: string;
    credits: number;
    storageGB: number;
    priceINR: number;
    gstRatePercent?: number;
    totalPriceINR?: number;
    billingInterval?: "MONTHLY" | "YEARLY";
  };
  onCancelSubscription?: () => void;
}

export default function ActivePlanCard({
  subscription,
  credits,
  plan,
  onCancelSubscription,
}: ActivePlanCardProps) {
  const router = useRouter();
  const statusUpper = String(subscription.status || "").toUpperCase();
  const isFreePlan = String(subscription.planCode || "").toUpperCase() === "FREE";
  const subscriptionSetupPending = [
    "INCOMPLETE",
    "CREATED",
    "PENDING",
    "AUTHENTICATED",
  ].includes(statusUpper);
  const statusText =
    statusUpper === "PAST_DUE"
      ? null
      : isFreePlan
        ? "Free plan"
        : subscriptionSetupPending
          ? "Paid plan — billing setup still finishing (your credits and quota already apply)"
          : "Active subscription";

  const storageUsedGB = credits.storageUsed / 1024 / 1024 / 1024;
  const storageQuotaGB = credits.storageQuota / 1024 / 1024 / 1024;
  const usagePercent =
    credits.storageQuota > 0
      ? (credits.storageUsed / credits.storageQuota) * 100
      : 0;
  /** Monthly allocation from plan — balance can exceed this; do not show balance/plan as a single ratio. */
  const monthlyIncluded = Math.max(plan.credits, 1);
  const creditsVsMonthlyPercent = Math.min(
    100,
    (credits.creditBalance / monthlyIncluded) * 100,
  );
  const isCreditsLow = credits.creditBalance < monthlyIncluded * 0.2;

  const isStorageNearLimit = usagePercent > 80;
  const isStorageFull = usagePercent >= 100;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-8 text-white shadow-[0_0_0_1px_rgba(47,107,255,0.12),0_24px_48px_-12px_rgba(0,0,0,0.85)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(47,107,255,0.18),transparent_55%)]"
        aria-hidden
      />
      <div className="relative">
        {/* Plan Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{plan.name} Plan</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
              {statusUpper === "PAST_DUE" ? (
                <span className="rounded bg-red-500/90 px-2 py-0.5 text-xs font-bold tracking-wide text-white">
                  PAYMENT FAILED
                </span>
              ) : (
                statusText
              )}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-4xl font-extrabold tabular-nums text-white">
              ₹{plan.priceINR}
            </div>
            <div className="text-sm text-zinc-400">
              per {plan.billingInterval === "YEARLY" ? "year" : "month"}
            </div>
            {plan.priceINR > 0 && (
              <div className="mt-1 text-xs text-zinc-500">
                +{plan.gstRatePercent ?? 18}% GST
              </div>
            )}
          </div>
        </div>

        {/* Credits — balance is wallet total; monthly is plan refresh, not a hard cap */}
        <div className="mb-8">
          <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="font-semibold text-zinc-200">Credits</span>
            <div className="text-right sm:text-left">
              <span className="font-bold tabular-nums text-white">
                {credits.creditBalance.toLocaleString()}
              </span>
              <span className="text-zinc-500"> available</span>
              <p className="mt-0.5 text-xs font-normal text-zinc-500">
                Plan includes {monthlyIncluded.toLocaleString()} / month
              </p>
            </div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCreditsLow ? "bg-amber-400" : "bg-[#2F6BFF]"
              }`}
              style={{ width: `${creditsVsMonthlyPercent}%` }}
              title="Relative to monthly plan allocation (capped at 100%)"
            />
          </div>
          {isCreditsLow && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-amber-400">⚠️</span>
              <p className="text-sm text-amber-400/90">
                Credits running low vs your monthly allocation
              </p>
            </div>
          )}
        </div>

        {/* Storage */}
        <div className="mb-2">
          <div className="mb-2 flex justify-between">
            <span className="font-semibold text-zinc-200">Storage</span>
            <span className="font-bold tabular-nums">
              {storageUsedGB.toFixed(2)} GB / {storageQuotaGB.toFixed(2)} GB
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isStorageFull
                  ? "bg-red-500"
                  : isStorageNearLimit
                    ? "bg-amber-400"
                    : "bg-[#2F6BFF]"
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          {isStorageFull && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg text-red-400">🚫</span>
              <p className="text-sm font-semibold text-red-400">
                Storage full — upgrade to continue generating
              </p>
            </div>
          )}
          {!isStorageFull && isStorageNearLimit && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-amber-400">⚠️</span>
              <p className="text-sm text-amber-400/90">
                Storage nearly full — consider upgrading
              </p>
            </div>
          )}
        </div>

        {/* Next Billing */}
        {subscription.nextBillingDate && (
          <div className="mt-8 border-t border-white/[0.08] pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-400">
                Next billing:{" "}
                {new Date(subscription.nextBillingDate).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" },
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {onCancelSubscription &&
                  !isFreePlan &&
                  ["ACTIVE", "PAST_DUE"].includes(statusUpper) && (
                    <button
                      type="button"
                      onClick={onCancelSubscription}
                      className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                    >
                      Cancel plan
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() => router.push("/account/invoices")}
                  className="rounded-lg bg-[#2F6BFF] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(47,107,255,0.35)] transition hover:bg-[#2a5fe3]"
                >
                  View invoices
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
