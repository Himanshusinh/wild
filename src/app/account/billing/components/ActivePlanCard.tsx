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

  const storageUsedGB = (credits.storageUsed / 1024 / 1024 / 1024);
  const storageQuotaGB = (credits.storageQuota / 1024 / 1024 / 1024);
  const usagePercent = (credits.storageUsed / credits.storageQuota) * 100;
  const creditsPercent = (credits.creditBalance / plan.credits) * 100;
  
  const isStorageNearLimit = usagePercent > 80;
  const isStorageFull = usagePercent >= 100;
  const isCreditsLow = creditsPercent < 20;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl">
      {/* Plan Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">{plan.name} Plan</h2>
          <p className="text-blue-100 mt-1 flex items-center gap-2">
            {subscription.status?.toUpperCase() === 'PAST_DUE' ? (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold tracking-wide">
                PAYMENT FAILED
              </span>
            ) : (
              'Active Subscription'
            )}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-extrabold">₹{plan.priceINR}</div>
          <div className="text-sm text-blue-100">per month</div>
        </div>
      </div>

      {/* Credits */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Credits</span>
          <span className="font-bold">
            {credits.creditBalance.toLocaleString()} /{" "}
            {plan.credits.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-blue-900 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              isCreditsLow ? "bg-yellow-400" : "bg-white"
            }`}
            style={{ width: `${Math.min(creditsPercent, 100)}%` }}
          />
        </div>
        {isCreditsLow && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-yellow-300 text-sm">⚠️</span>
            <p className="text-yellow-300 text-sm">Credits running low</p>
          </div>
        )}
      </div>

      {/* Storage */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Storage</span>
          <span className="font-bold">
            {storageUsedGB.toFixed(2)} GB / {storageQuotaGB.toFixed(2)} GB
          </span>
        </div>
        <div className="w-full bg-blue-900 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              isStorageFull
                ? "bg-red-500"
                : isStorageNearLimit
                ? "bg-yellow-400"
                : "bg-white"
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        {isStorageFull && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-red-300 text-lg">🚫</span>
            <p className="text-red-300 text-sm font-semibold">
              Storage full - Upgrade required to continue generating
            </p>
          </div>
        )}
        {!isStorageFull && isStorageNearLimit && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-yellow-300 text-sm">⚠️</span>
            <p className="text-yellow-300 text-sm">
              Storage nearly full - Consider upgrading soon
            </p>
          </div>
        )}
      </div>

      {/* Next Billing */}
      {subscription.nextBillingDate && (
        <div className="border-t border-blue-400 pt-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-100">
              Next billing:{" "}
              {new Date(subscription.nextBillingDate).toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric", year: "numeric" }
              )}
            </p>
            <div className="flex gap-2">
              {onCancelSubscription && ['ACTIVE', 'PAST_DUE'].includes(subscription.status?.toUpperCase()) && (
                <button
                  onClick={onCancelSubscription}
                  className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-100 px-3 py-1 rounded transition border border-red-500/50"
                >
                  Cancel Plan
                </button>
              )}
              <button
                onClick={() => router.push("/account/invoices")}
                className="text-xs bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded transition"
              >
                View Invoices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
