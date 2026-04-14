"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { auth } from "@/lib/firebase";
import { AppDispatch } from "@/store";
import {
  fetchCurrentSubscription,
  createSubscription,
  cancelSubscription,
  selectCurrentSubscription,
  selectSubscriptionLoading,
  selectCreatingSubscription,
  changeSubscriptionPlan,
} from "@/store/slices/subscriptionSlice";
import { fetchUserCredits, selectCredits } from "@/store/slices/creditsSlice";
import PlanCards, { Plan } from "./components/PlanCards";
import CheckoutModal from "./components/CheckoutModal";
import ActivePlanCard from "./components/ActivePlanCard";
import CelebrationModal from "./components/CelebrationModal";
import {
  ensureRazorpayScriptLoaded,
  openRazorpaySubscriptionCheckout,
} from "@/lib/razorpaySubscriptionCheckout";
import {
  fetchSubscriptionCatalog,
  findCatalogSkuByCode,
  type SubscriptionCatalog,
} from "@/lib/subscriptionCatalog";
import { getErrorMessage } from "@/lib/errorMessage";
import BillingMessageDialog from "./components/BillingMessageDialog";

export default function BillingPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const subscription = useSelector(selectCurrentSubscription);
  const credits = useSelector(selectCredits);
  const loading = useSelector(selectSubscriptionLoading);
  const creatingSubscription = useSelector(selectCreatingSubscription);
  const paymentBlocked = ["PAST_DUE", "HALTED"].includes(
    String(subscription?.status || "").toUpperCase(),
  );

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false); // New State
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [catalog, setCatalog] = useState<SubscriptionCatalog | null>(null);
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "YEARLY">(
    "MONTHLY",
  );

  const [isMounted, setIsMounted] = useState(false);
  const [flashNotice, setFlashNotice] = useState<{
    kind: "success" | "info";
    title: string;
    detail?: string;
  } | null>(null);
  const lastCreditBalanceRef = useRef<number | null>(null);
  /** Shown before Razorpay when UPI plan change needs a new mandate */
  const [mandateNotice, setMandateNotice] = useState<{
    onContinue: () => void;
  } | null>(null);
  const [billingMessage, setBillingMessage] = useState<{
    title: string;
    body: string;
    variant?: "error" | "info";
    onContinue?: () => void;
    primaryLabel?: string;
  } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    dispatch(fetchCurrentSubscription());
    dispatch(fetchUserCredits());
    fetchSubscriptionCatalog()
      .then(setCatalog)
      .catch((error) =>
        console.error("Failed to fetch subscription catalog", error),
      );

    // Get real user email from Firebase Auth
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email || "");
      setUserName(user.displayName || user.email?.split("@")[0] || "");
    }
  }, [dispatch]);

  useEffect(() => {
    if (typeof credits?.creditBalance === "number") {
      lastCreditBalanceRef.current = credits.creditBalance;
    }
  }, [credits?.creditBalance]);

  const nextBillingLabel = useMemo(() => {
    const status = String(subscription?.status || "").toUpperCase();
    return status === "CANCELLED" ? "Active until" : "Next billing date";
  }, [subscription?.status]);

  useEffect(() => {
    const currentCode = subscription?.planCode || credits?.planCode;
    const currentSku = findCatalogSkuByCode(catalog, currentCode);
    if (currentSku?.billingInterval) {
      setBillingInterval(currentSku.billingInterval);
    }
  }, [catalog, credits?.planCode, subscription?.planCode]);

  const handleSelectPlan = (planCode: string) => {
    const sku = findCatalogSkuByCode(catalog, planCode);
    const familyPlan = catalog?.plans.find(
      (entry) =>
        entry.monthly?.code === planCode || entry.yearly?.code === planCode,
    );
    if (!sku || !familyPlan) return;

    const currentCode = subscription?.planCode || credits?.planCode || null;
    const currentSku = findCatalogSkuByCode(catalog, currentCode);
    const currentPrice = currentSku ? currentSku.priceInPaise / 100 : 0;
    const nextPrice = sku.priceInPaise / 100;
    const changeType: "upgrade" | "downgrade" | "new" =
      currentCode && currentCode !== "FREE"
        ? nextPrice > currentPrice
          ? "upgrade"
          : "downgrade"
        : "new";

    setSelectedPlan({
      family: familyPlan.family,
      code: sku.code,
      name: familyPlan.name,
      billingInterval: sku.billingInterval,
      credits: sku.credits,
      storageGB: sku.storageGB,
      priceINR: sku.priceInPaise / 100,
      gstRatePercent: sku.gstRatePercent,
      gstAmountINR: sku.gstAmountInPaise / 100,
      totalPriceINR: sku.totalWithGstInPaise / 100,
      cycleLabel: sku.billingInterval === "YEARLY" ? "year" : "month",
      features: [],
      popular: familyPlan.family === "creator",
    });
    try {
      (window as any).__wmSelectedChangeType = changeType;
    } catch {}
    setShowCheckout(true);
  };

  const handleCheckoutConfirm = async (billingDetails: any) => {
    if (!selectedPlan) return;

    try {
      // Check if user has an active subscription to upgrade/downgrade
      const status = subscription?.status?.toUpperCase();
      const currentPlanCodeFromCredits = credits?.planCode?.toUpperCase();

      // If we have an active/past_due subscription, OR if credits slice shows they are on a paid plan (not FREE)
      const isPaidUser = (subscription && (status === 'ACTIVE' || status === 'PAST_DUE')) ||
        (currentPlanCodeFromCredits && currentPlanCodeFromCredits !== 'FREE');

      if (isPaidUser) {
        console.log("🔄 Processing plan change to:", selectedPlan.code);
        const changeResult = await dispatch(
          changeSubscriptionPlan({
            newPlanCode: selectedPlan.code,
            immediate: true,
          }),
        ).unwrap();

        const payload = changeResult?.data as
          | {
              requiresCheckout?: boolean;
              razorpaySubscriptionId?: string;
              keyId?: string;
              upiNotSupportedForPlan?: boolean;
              maxUpiRecurringPaise?: number;
              proration?: {
                remainingFraction?: number;
                remainingValuePaise?: number;
                newCostPaise?: number;
                payablePaise?: number;
              };
            }
          | undefined;

        if (
          payload?.requiresCheckout &&
          payload.razorpaySubscriptionId &&
          payload.keyId
        ) {
          const openPlanChangeCheckout = async () => {
            if (payload.upiNotSupportedForPlan) {
              const cap =
                (payload.maxUpiRecurringPaise ?? 1_500_000) / 100;
              setBillingMessage({
                title: "UPI AutoPay limit",
                body:
                  `This plan’s charge (incl. GST) is above the ₹${cap.toLocaleString("en-IN")} per-cycle limit for UPI AutoPay (NPCI). Typical for Agency-tier and similar. In the payment window, choose Card or bank e-mandate.`,
                variant: "info",
                onContinue: async () => {
                  await ensureRazorpayScriptLoaded();
                  openRazorpaySubscriptionCheckout({
                    keyId: payload.keyId!,
                    subscriptionId: payload.razorpaySubscriptionId!,
                    planName: selectedPlan.name,
                    prefill: {
                      name: billingDetails?.name || userName,
                      email: billingDetails?.email || userEmail,
                      contact: billingDetails?.phone,
                    },
                    onSuccess: () => {
                      setShowCheckout(false);
                      setShowCelebration(true);
                      dispatch(fetchCurrentSubscription());
                      dispatch(fetchUserCredits());
                      window.history.replaceState(
                        {},
                        document.title,
                        window.location.pathname,
                      );
                    },
                    onFailure: (msg) => {
                      setBillingMessage({
                        title: "Payment failed",
                        body: msg,
                        variant: "error",
                      });
                      setShowCheckout(false);
                    },
                    onDismiss: () => setShowCheckout(false),
                  });
                },
              });
              return;
            }
            await ensureRazorpayScriptLoaded();
            openRazorpaySubscriptionCheckout({
              keyId: payload.keyId!,
              subscriptionId: payload.razorpaySubscriptionId!,
              planName: selectedPlan.name,
              prefill: {
                name: billingDetails?.name || userName,
                email: billingDetails?.email || userEmail,
                contact: billingDetails?.phone,
              },
              onSuccess: () => {
                setShowCheckout(false);
                setShowCelebration(true);
                dispatch(fetchCurrentSubscription());
                dispatch(fetchUserCredits());
                window.history.replaceState(
                  {},
                  document.title,
                  window.location.pathname,
                );
              },
              onFailure: (msg) => {
                setBillingMessage({
                  title: "Payment failed",
                  body: msg,
                  variant: "error",
                });
                setShowCheckout(false);
              },
              onDismiss: () => setShowCheckout(false),
            });
          };

          const p = (payload as any)?.proration;
          const hasProration =
            p &&
            typeof p.remainingValuePaise === "number" &&
            typeof p.newCostPaise === "number" &&
            typeof p.payablePaise === "number";

          const showMandateThenCheckout = () => {
            setMandateNotice({
              onContinue: () => {
                setMandateNotice(null);
                void openPlanChangeCheckout();
              },
            });
          };

          if (hasProration) {
            const r = (p.remainingValuePaise / 100).toFixed(2);
            const n = (p.newCostPaise / 100).toFixed(2);
            const z = (p.payablePaise / 100).toFixed(2);
            setBillingMessage({
              title: "Yearly upgrade breakdown",
              body: `Remaining value: ₹${r}\nNew plan cost (remaining period): ₹${n}\nYou pay now: ₹${z}`,
              variant: "info",
              onContinue: showMandateThenCheckout,
            });
          } else {
            showMandateThenCheckout();
          }
          return;
        }

        setShowCheckout(false);
        setShowCelebration(true);
        dispatch(fetchCurrentSubscription());
        dispatch(fetchUserCredits()).then((res) => {
          try {
            const before = lastCreditBalanceRef.current;
            const after = (res as any)?.payload?.creditBalance;
            const delta =
              typeof before === "number" && typeof after === "number"
                ? Math.max(0, after - before)
                : null;
            setFlashNotice({
              kind: "success",
              title: "Plan updated successfully",
              detail: delta != null && delta > 0 ? `Credits added: ${delta.toLocaleString()}` : undefined,
            });
            // Auto-clear after a short while
            setTimeout(() => setFlashNotice(null), 6000);
          } catch {}
        });
        return;
      }

      // Handle New Subscription
      const result = await dispatch(
        createSubscription({
          planCode: selectedPlan.code,
          billingDetails: {
            ...billingDetails,
            email: userEmail,
            name: userName,
          },
        })
      ).unwrap();

      console.log("✅ Subscription created:", result);

      // Get subscription details
      const subscriptionId = result?.data?.razorpaySubscriptionId;
      const keyId = result?.data?.keyId;

      if (!subscriptionId || !keyId) {
        console.error("❌ Missing subscription ID or key ID in response!");
        setBillingMessage({
          title: "Couldn’t start payment",
          body:
            "Unable to initiate payment. Please try again or contact support.",
          variant: "error",
        });
        setShowCheckout(false);
        setSelectedPlan(null);
        return;
      }

      const d = result?.data as
        | {
            upiNotSupportedForPlan?: boolean;
            maxUpiRecurringPaise?: number;
          }
        | undefined;

      const openNewSubscriptionCheckout = async () => {
        await ensureRazorpayScriptLoaded();
        console.log("🚀 Opening Razorpay checkout modal");
        openRazorpaySubscriptionCheckout({
          keyId,
          subscriptionId,
          planName: selectedPlan?.name || "Plan",
          prefill: {
            name: billingDetails?.name || userName,
            email: billingDetails?.email || userEmail,
            contact: billingDetails?.phone,
          },
          onSuccess: () => {
            setShowCheckout(false);
            setShowCelebration(true);
            dispatch(fetchCurrentSubscription());
            dispatch(fetchUserCredits());
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
          },
          onFailure: (msg) => {
            setBillingMessage({
              title: "Payment failed",
              body: msg,
              variant: "error",
            });
            setShowCheckout(false);
          },
          onDismiss: () => setShowCheckout(false),
        });
      };

      if (d?.upiNotSupportedForPlan) {
        const cap = (d.maxUpiRecurringPaise ?? 1_500_000) / 100;
        setBillingMessage({
          title: "UPI AutoPay limit",
          body:
            `This plan’s charge (incl. GST) is above the ₹${cap.toLocaleString("en-IN")} per-cycle limit for UPI AutoPay (NPCI). Typical for Agency-tier and similar. In the payment window, choose Card or bank e-mandate.`,
          variant: "info",
          onContinue: () => {
            void openNewSubscriptionCheckout();
          },
        });
        return;
      }

      await openNewSubscriptionCheckout();

    } catch (error: unknown) {
      console.error("Checkout error:", error);
      setBillingMessage({
        title: "Couldn’t complete checkout",
        body: getErrorMessage(
          error,
          "Failed to create or change your subscription.",
        ),
        variant: "error",
      });
      setShowCheckout(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

    try {
      await dispatch(cancelSubscription({ immediate: false })).unwrap();
      setFlashNotice({
        kind: "success",
        title: "Subscription cancelled",
        detail:
          "It will remain active until the end of the current billing period.",
      });
      setTimeout(() => setFlashNotice(null), 6000);
    } catch (error: unknown) {
      setBillingMessage({
        title: "Couldn’t cancel subscription",
        body: getErrorMessage(error, "Failed to cancel subscription."),
        variant: "error",
      });
    }
  };

  // Hydration fix: Only show loading state after component has mounted on client
  // server renders the content view initially, so client must match for first render
  if (isMounted && loading && !subscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentCatalogSku = findCatalogSkuByCode(
    catalog,
    subscription?.planCode || credits?.planCode,
  );
  const currentCatalogFamily = catalog?.plans.find(
    (plan) =>
      plan.monthly?.code === (subscription?.planCode || credits?.planCode) ||
      plan.yearly?.code === (subscription?.planCode || credits?.planCode),
  );
  const currentSubscriptionPlan = (subscription as any)?.plan;
  const fallbackGstRatePercent =
    currentSubscriptionPlan?.gstRatePercent ?? 18;
  const fallbackTotalWithGstInPaise =
    currentSubscriptionPlan?.priceInPaise != null
      ? currentSubscriptionPlan.priceInPaise +
        Math.round(
          (currentSubscriptionPlan.priceInPaise * fallbackGstRatePercent) / 100,
        )
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <BillingMessageDialog
        open={billingMessage != null}
        title={billingMessage?.title ?? ""}
        body={billingMessage?.body ?? ""}
        variant={billingMessage?.variant}
        primaryLabel={billingMessage?.primaryLabel}
        onContinue={billingMessage?.onContinue}
        onClose={() => setBillingMessage(null)}
      />
      {mandateNotice && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mandate-notice-title"
        >
          <div className="max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <h3
              id="mandate-notice-title"
              className="mb-2 text-lg font-semibold text-gray-900 dark:text-white"
            >
              New UPI AutoPay authorization
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
              You pay with UPI. Changing your plan needs a new AutoPay mandate
              for the new amount. You&apos;ll complete a quick checkout to
              authorize it.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={() => {
                  setMandateNotice(null);
                  setShowCheckout(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                onClick={() => mandateNotice.onContinue()}
              >
                Continue to checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          setSelectedPlan(null);
          // Redirect to clear URL params if success payment was in URL
          if (window.location.search.includes('payment=success')) {
            router.replace('/account/billing');
          }
        }}
        planName={
          selectedPlan?.name ||
          currentCatalogFamily?.name ||
          (subscription as any)?.plan?.name ||
          "Premium"
        }
      />

      <div className="container mx-auto max-w-6xl">
        {paymentBlocked ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
            <div className="font-semibold">
              Payment failed. Please update your payment method to continue.
            </div>
            <div className="mt-1 text-xs text-red-800/80 dark:text-red-200/90">
              Credits will not refresh until payment succeeds.
            </div>
          </div>
        ) : null}
        {flashNotice ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
            <div className="font-semibold">{flashNotice.title}</div>
            {flashNotice.detail ? (
              <div className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/90">
                {flashNotice.detail}
              </div>
            ) : null}
          </div>
        ) : null}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription, view invoices, and track payments
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
              Current plan status: {String(subscription?.status || "UNKNOWN").toUpperCase()}
            </span>
            {subscription?.nextBillingDate ? (
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                {nextBillingLabel}:{' '}
                {new Date(subscription.nextBillingDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            ) : null}
          </div>

          {/* Quick Access Links */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => router.push('/account/invoices')}
              className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition text-sm font-medium"
            >
              View Invoices
            </button>
            <button
              onClick={() => router.push('/account/payments')}
              className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition text-sm font-medium"
            >
              Payment History
            </button>
          </div>
        </div>

        {/* Current Subscription Card */}
        {subscription && (currentCatalogSku || (subscription as any)?.plan) && (
          <div className="mb-8">
            <ActivePlanCard
              subscription={{
                id: subscription.id || "",
                planCode: subscription.planCode || "",
                status: subscription.status || "",
                nextBillingDate: subscription.nextBillingDate,
              }}
              credits={{
                creditBalance: credits?.creditBalance || 0,
                storageUsed: credits?.storageUsed || 0,
                storageQuota: credits?.storageQuota || 0,
              }}
              plan={{
                name:
                  currentCatalogFamily?.name ||
                  (subscription as any)?.plan?.name ||
                  "Plan",
                credits:
                  currentCatalogSku?.credits ||
                  (subscription as any)?.plan?.credits ||
                  0,
                storageGB:
                  currentCatalogSku?.storageGB ||
                  (subscription as any)?.plan?.storageGB ||
                  0,
                priceINR:
                  (currentCatalogSku?.priceInPaise ||
                    currentSubscriptionPlan?.priceInPaise ||
                    0) / 100,
                gstRatePercent:
                  currentCatalogSku?.gstRatePercent ?? fallbackGstRatePercent,
                totalPriceINR:
                  currentCatalogSku?.totalWithGstInPaise != null
                    ? Number(
                        (currentCatalogSku.totalWithGstInPaise / 100).toFixed(2),
                      )
                    : fallbackTotalWithGstInPaise != null
                    ? Number((fallbackTotalWithGstInPaise / 100).toFixed(2))
                    : undefined,
                billingInterval:
                  currentCatalogSku?.billingInterval ||
                  currentSubscriptionPlan?.billingInterval,
              }}
              onCancelSubscription={handleCancelSubscription}
            />
          </div>
        )}

        {/* Available Plans */}
        <div className="mb-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold">Available Plans</h2>
            <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 p-1">
              <button
                type="button"
                onClick={() => setBillingInterval("MONTHLY")}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  billingInterval === "MONTHLY"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval("YEARLY")}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  billingInterval === "YEARLY"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          <PlanCards
            plans={catalog?.plans || []}
            selectedBillingInterval={billingInterval}
            currentPlanCode={subscription?.planCode || credits?.planCode}
            onSelectPlan={handleSelectPlan}
          />
        </div>

        {/* Checkout Modal */}
        {selectedPlan && (
          <CheckoutModal
            plan={selectedPlan}
            isOpen={showCheckout}
            onClose={() => {
              setShowCheckout(false);
              setSelectedPlan(null);
            }}
            onConfirm={handleCheckoutConfirm}
            isLoadingPlanChange={creatingSubscription}
            changeType={(() => {
              try {
                return (window as any).__wmSelectedChangeType as any;
              } catch {
                return "new";
              }
            })()}
          />
        )}
      </div>
    </div>
  );
}
