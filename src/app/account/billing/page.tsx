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
  confirmSubscriptionAfterCheckout,
  type RazorpaySubscriptionSuccessPayload,
} from "@/lib/billingSubscriptionConfirm";
import { openRazorpayOrderCheckout } from "@/lib/razorpayOrderCheckout";
import {
  fetchSubscriptionCatalog,
  findCatalogSkuByCode,
  type SubscriptionCatalog,
} from "@/lib/subscriptionCatalog";
import { getErrorCode, getErrorMessage } from "@/lib/errorMessage";
import BillingMessageDialog from "./components/BillingMessageDialog";
import { getApiClient } from "@/lib/axiosInstance";

function normalizePlanCode(value?: string | null): string | null {
  if (!value) return null;
  return value.trim().toUpperCase();
}

type CreditPack = {
  code: string;
  name: string;
  credits: number;
  priceUSD: string;
  pricePerCredit: string;
};

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
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [creditPacksLoading, setCreditPacksLoading] = useState(false);
  const [selectedPackCode, setSelectedPackCode] = useState<string>("");
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);
  const [confirmingPaymentBanner, setConfirmingPaymentBanner] = useState<
    string | null
  >(null);
  const [resumeSubscriptionBusy, setResumeSubscriptionBusy] = useState(false);

  const confirmAfterSubscriptionCheckout = async (
    rzp: RazorpaySubscriptionSuccessPayload,
  ) => {
    const out = await confirmSubscriptionAfterCheckout(dispatch, rzp, {
      setStatusText: setConfirmingPaymentBanner,
    });
    if (out.lastVerifyError?.kind === "signature_invalid") {
      setBillingMessage({
        title: "Payment could not be verified",
        body:
          "We could not confirm the payment signature with our servers. If you were charged, contact support with your Razorpay payment ID.",
        variant: "error",
      });
      return out;
    }
    if (out.lastVerifyError?.kind === "rail_blocked" && out.lastVerifyError.code) {
      setBillingMessage({
        title: "Checkout follow-up blocked",
        body: mapSubscriptionErrorMessage({
          response: { data: { code: out.lastVerifyError.code } },
        } as unknown),
        variant: "error",
      });
      return out;
    }
    if (out.timedOut) {
      setBillingMessage({
        title: "Payment received, syncing…",
        body:
          "We’re still confirming your subscription. Tap Retry sync to call our server again, or wait a few seconds for webhooks to finish.",
        variant: "info",
        primaryLabel: "Retry sync",
        onContinue: () => {
          void (async () => {
            const r2 = await out.retryVerify();
            if (r2.lastVerifyError?.kind === "signature_invalid") {
              setBillingMessage({
                title: "Payment could not be verified",
                body:
                  "We could not confirm the payment signature. If you were charged, contact support with your Razorpay payment ID.",
                variant: "error",
              });
              return;
            }
            if (r2.becameActive) {
              setShowCelebration(true);
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname,
              );
            } else if (r2.timedOut) {
              setBillingMessage({
                title: "Still syncing",
                body:
                  "Your plan may update shortly. Refresh the page or contact support if billing does not match after several minutes.",
                variant: "info",
              });
            }
          })();
        },
      });
    }
    return out;
  };

  const handleResumeSubscription = async () => {
    if (resumeSubscriptionBusy) return;
    setResumeSubscriptionBusy(true);
    try {
      const api = getApiClient();
      const res = await api.post("/api/subscriptions/recover", {});
      const data = res.data?.data ?? res.data;
      if (data?.code === "RECOVERY_NOT_REQUIRED") {
        setFlashNotice({
          kind: "success",
          title: "Subscription active",
          detail: data?.message || "Your subscription is already active.",
        });
        setTimeout(() => setFlashNotice(null), 6000);
        await dispatch(fetchCurrentSubscription());
        await dispatch(fetchUserCredits());
        return;
      }
      if (
        data?.requiresCheckout &&
        data?.razorpaySubscriptionId &&
        data?.keyId
      ) {
        await ensureRazorpayScriptLoaded();
        const planLabel =
          typeof data.targetPlanCode === "string"
            ? data.targetPlanCode.replace(/_/g, " ")
            : "Subscription";
        openRazorpaySubscriptionCheckout({
          keyId: data.keyId,
          subscriptionId: data.razorpaySubscriptionId,
          planName: planLabel,
          prefill: {
            name: userName,
            email: userEmail,
          },
          disableUpi: data.upiNotSupportedForPlan === true,
          onSuccess: async (payload) => {
            try {
              await api.post("/api/subscriptions/recover", {
                razorpayPaymentId: payload.razorpay_payment_id,
                razorpaySubscriptionId: payload.razorpay_subscription_id,
                razorpaySignature: payload.razorpay_signature,
              });
            } catch (e) {
              setBillingMessage({
                title: "Could not confirm recovery payment",
                body: mapSubscriptionErrorMessage(e),
                variant: "error",
              });
              return;
            }
            await confirmAfterSubscriptionCheckout(payload);
            await dispatch(fetchCurrentSubscription());
            await dispatch(fetchUserCredits());
          },
          onFailure: (message) => {
            setBillingMessage({
              title: "Payment failed",
              body: message || "Payment failed. Please try again.",
              variant: "error",
            });
          },
        });
        return;
      }
      await dispatch(fetchCurrentSubscription());
      await dispatch(fetchUserCredits());
      setFlashNotice({
        kind: "success",
        title: "Subscription updated",
        detail: data?.message || "Recovery completed.",
      });
      setTimeout(() => setFlashNotice(null), 6000);
    } catch (error: unknown) {
      setBillingMessage({
        title: "Could not resume subscription",
        body: mapSubscriptionErrorMessage(error),
        variant: "error",
      });
    } finally {
      setResumeSubscriptionBusy(false);
    }
  };

  const mapSubscriptionErrorMessage = (error: unknown): string => {
    const code = getErrorCode(error);
    if (code === "PLAN_CHANGE_NOT_ALLOWED_UPI") {
      return "Your current payment method (UPI AutoPay) does not support changing this plan in place. Please cancel and resubscribe, or use card/e-mandate for smoother plan changes.";
    }
    if (code === "PLAN_CHANGE_NOT_ALLOWED_DOMESTIC_CARD") {
      return "Your current domestic card mandate allows offer updates only, not direct plan changes. Please cancel and resubscribe, or complete a fresh mandate via checkout.";
    }
    if (code === "PLAN_CHANGE_MANDATE_REAUTH_REQUIRED") {
      return "Your payment method needs re-authorization for this amount change. Please complete checkout again to authorize the new mandate.";
    }
    if (code === "PLAN_CHANGE_CONFLICT") {
      return "Another plan change is already in progress. Please wait a few seconds and try again.";
    }
    if (code === "RECOVERY_REQUIRES_HALTED") {
      return "Recovery with payment verification is only available when your subscription is halted. Try again after checkout or contact support.";
    }
    if (code === "RECOVERY_SUBSCRIPTION_NOT_FOUND") {
      return "No halted subscription was found to recover. Refresh the page or contact support if billing still looks wrong.";
    }
    if (code === "PAYMENT_VERIFY_SIGNATURE_INVALID") {
      return "We could not verify the payment signature. If you were charged, contact support with your payment ID.";
    }
    return getErrorMessage(
      error,
      "Failed to create or change your subscription.",
    );
  };

  const fetchCreditPacks = async (): Promise<void> => {
    setCreditPacksLoading(true);
    try {
      const api = getApiClient();
      const res = await api.get("/api/payments/packs");
      const packs: CreditPack[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setCreditPacks(packs);
      if (!selectedPackCode && packs[0]?.code) {
        setSelectedPackCode(packs[0].code);
      }
    } catch (error) {
      setBillingMessage({
        title: "Couldn’t load credit packs",
        body: getErrorMessage(error, "Failed to load available credit packs."),
        variant: "error",
      });
    } finally {
      setCreditPacksLoading(false);
    }
  };

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
  const currentPlanCode = normalizePlanCode(
    subscription?.planCode || credits?.planCode || "FREE",
  );
  const hasWalletCredits = (credits?.creditBalance ?? 0) > 0;
  const freeWithBalance =
    currentPlanCode === "FREE" &&
    hasWalletCredits &&
    !["ACTIVE", "PAST_DUE"].includes(
      String(subscription?.status || "").toUpperCase(),
    );

  /** Razorpay can stay INCOMPLETE while credits/planCode already reflect the paid tier — avoid scaring users with a raw gateway status. */
  const billingStatusPresentation = useMemo(() => {
    const raw = String(subscription?.status || "").trim();
    const upper = raw.toUpperCase();
    const paidPlan = !!(currentPlanCode && currentPlanCode !== "FREE");
    const incompleteLike = new Set([
      "INCOMPLETE",
      "CREATED",
      "PENDING",
      "AUTHENTICATED",
    ]);

    if (upper === "ACTIVE" || upper === "TRIALING") {
      return {
        pillClass:
          "border-emerald-500/35 bg-emerald-500/10 text-emerald-200",
        label: upper === "TRIALING" ? "TRIALING" : "ACTIVE",
        hint: null as string | null,
      };
    }
    if (paidPlan && incompleteLike.has(upper)) {
      return {
        pillClass: "border-amber-500/35 bg-amber-500/10 text-amber-100",
        label: "SETUP IN PROGRESS",
        hint: "Your plan tier and credits are active; the subscription record is still finalizing with the payment provider. If this stays for days, open billing support or retry checkout.",
      };
    }
    if (upper === "PAST_DUE" || upper === "HALTED") {
      return {
        pillClass: "border-red-500/35 bg-red-500/10 text-red-100",
        label: upper,
        hint: null as string | null,
      };
    }
    if (!raw) {
      if (paidPlan) {
        return {
          pillClass:
            "border-emerald-500/35 bg-emerald-500/10 text-emerald-200",
          label: "ACTIVE",
          hint: null as string | null,
        };
      }
      return {
        pillClass: "border-white/[0.12] bg-white/[0.04] text-zinc-300",
        label: "FREE",
        hint: null as string | null,
      };
    }
    return {
      pillClass: "border-white/[0.12] bg-white/[0.04] text-zinc-300",
      label: upper,
      hint: null as string | null,
    };
  }, [subscription?.status, currentPlanCode]);

  useEffect(() => {
    const currentCode = currentPlanCode;
    const currentSku = findCatalogSkuByCode(catalog, currentCode);
    if (currentSku?.billingInterval) {
      setBillingInterval(currentSku.billingInterval);
    }
  }, [catalog, currentPlanCode]);

  const handleSelectPlan = (planCode: string) => {
    const sku = findCatalogSkuByCode(catalog, planCode);
    const familyPlan = catalog?.plans.find(
      (entry) =>
        entry.monthly?.code === planCode || entry.yearly?.code === planCode,
    );
    if (!sku || !familyPlan) return;

    const currentCode = currentPlanCode;
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

  const handleCheckoutIntervalChange = (interval: "MONTHLY" | "YEARLY") => {
    if (!selectedPlan || !catalog) return;
    if (selectedPlan.billingInterval === interval) return;

    const familyPlan = catalog.plans.find(
      (entry) =>
        entry.family === selectedPlan.family ||
        entry.monthly?.code === selectedPlan.code ||
        entry.yearly?.code === selectedPlan.code,
    );
    if (!familyPlan) return;

    const targetSku = interval === "YEARLY" ? familyPlan.yearly : familyPlan.monthly;
    if (!targetSku) return;

    const currentCode = currentPlanCode;
    const currentSku = findCatalogSkuByCode(catalog, currentCode);
    const currentPrice = currentSku ? currentSku.priceInPaise / 100 : 0;
    const nextPrice = targetSku.priceInPaise / 100;
    const changeType: "upgrade" | "downgrade" | "new" =
      currentCode && currentCode !== "FREE"
        ? nextPrice > currentPrice
          ? "upgrade"
          : "downgrade"
        : "new";
    try {
      (window as any).__wmSelectedChangeType = changeType;
    } catch {}

    setSelectedPlan((prev) =>
      prev
        ? {
            ...prev,
            code: targetSku.code,
            billingInterval: interval,
            credits: targetSku.credits,
            storageGB: targetSku.storageGB,
            priceINR: targetSku.priceInPaise / 100,
            gstRatePercent: targetSku.gstRatePercent,
            gstAmountINR: targetSku.gstAmountInPaise / 100,
            totalPriceINR: targetSku.totalWithGstInPaise / 100,
            cycleLabel: interval === "YEARLY" ? "year" : "month",
          }
        : prev,
    );
  };

  const handleCheckoutConfirm = async (billingDetails: any) => {
    if (!selectedPlan) return;

    try {
      // Use both subscription and credits state, because either one can lag briefly during hydration.
      const status = String(subscription?.status || "").toUpperCase();
      const normalizedCurrentPlanCode = normalizePlanCode(
        subscription?.planCode || credits?.planCode || currentPlanCode,
      );
      const isPaidUser =
        ["ACTIVE", "PAST_DUE", "HALTED"].includes(status) ||
        (!!normalizedCurrentPlanCode && normalizedCurrentPlanCode !== "FREE");

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
              orderId?: string;
              amount?: number;
              currency?: string;
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
          payload.orderId &&
          payload.keyId &&
          typeof payload.amount === "number"
        ) {
          const upgradeOrderId = payload.orderId;
          const upgradeOrderAmount = payload.amount;
          const upgradeKeyId = payload.keyId;
          const openPlanChangeOrderCheckout = async () => {
            await openRazorpayOrderCheckout({
              keyId: upgradeKeyId,
              orderId: upgradeOrderId,
              amountInPaise: upgradeOrderAmount,
              packName: `${selectedPlan.name} plan upgrade`,
              prefill: {
                name: billingDetails?.name || userName,
                email: billingDetails?.email || userEmail,
              },
              onSuccess: async ({ razorpayPaymentId }) => {
                const api = getApiClient();
                await api.post("/api/subscriptions/verify-upgrade-order", {
                  razorpayPaymentId,
                });
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

          if (hasProration) {
            const r = (p.remainingValuePaise / 100).toFixed(2);
            const n = (p.newCostPaise / 100).toFixed(2);
            const z = (p.payablePaise / 100).toFixed(2);
            setBillingMessage({
              title: "Yearly upgrade breakdown",
              body: `Remaining value: ₹${r}\nNew plan cost (remaining period): ₹${n}\nYou pay now: ₹${z}`,
              variant: "info",
              onContinue: () => {
                void openPlanChangeOrderCheckout();
              },
            });
          } else {
            await openPlanChangeOrderCheckout();
          }
          return;
        }

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
                    onSuccess: async (rzp) => {
                      setShowCheckout(false);
                      const co = await confirmAfterSubscriptionCheckout(rzp);
                      if (co.becameActive) {
                        setShowCelebration(true);
                        window.history.replaceState(
                          {},
                          document.title,
                          window.location.pathname,
                        );
                      }
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
              onSuccess: async (rzp) => {
                setShowCheckout(false);
                const co = await confirmAfterSubscriptionCheckout(rzp);
                if (co.becameActive) {
                  setShowCelebration(true);
                  window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname,
                  );
                }
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
          onSuccess: async (rzp) => {
            setShowCheckout(false);
            const co = await confirmAfterSubscriptionCheckout(rzp);
            if (co.becameActive) {
              setShowCelebration(true);
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname,
              );
            }
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
        body: mapSubscriptionErrorMessage(error),
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
        body:
          mapSubscriptionErrorMessage(error) ||
          getErrorMessage(error, "Failed to cancel subscription."),
        variant: "error",
      });
    }
  };

  const handleBuyAdditionalCredits = async () => {
    if (isBuyingCredits) return;
    const packCode = selectedPackCode || creditPacks[0]?.code;
    if (!packCode) {
      setBillingMessage({
        title: "Select a pack",
        body: "Please select a credit pack before continuing.",
        variant: "error",
      });
      return;
    }

    setIsBuyingCredits(true);
    try {
      const api = getApiClient();
      const orderResponse = await api.post("/api/payments/create-order", {
        packCode,
      });
      const data = orderResponse.data?.data;
      if (!data?.orderId || !data?.keyId || !data?.amountInPaise) {
        throw new Error("Invalid payment order response");
      }

      const chosen = creditPacks.find((p) => p.code === packCode);
      await openRazorpayOrderCheckout({
        keyId: data.keyId,
        orderId: data.orderId,
        amountInPaise: data.amountInPaise,
        packName: chosen?.name || "Credit pack",
        prefill: {
          name: userName,
          email: userEmail,
        },
        onSuccess: async (payload) => {
          try {
            await api.post("/api/payments/verify", payload);
          } catch (verifyError) {
            setBillingMessage({
              title: "Payment received, verifying...",
              body: getErrorMessage(
                verifyError,
                "We received your payment. Credits and invoice will sync shortly.",
              ),
              variant: "info",
            });
          } finally {
            dispatch(fetchUserCredits());
            dispatch(fetchCurrentSubscription());
            setFlashNotice({
              kind: "success",
              title: "Credits added successfully",
              detail: "Credits are added instantly and do not expire until used.",
            });
            setTimeout(() => setFlashNotice(null), 6000);
            setShowCreditsModal(false);
          }
        },
        onFailure: (message) => {
          setBillingMessage({
            title: "Payment failed",
            body: message || "Payment failed. Please try again.",
            variant: "error",
          });
        },
        onDismiss: () => {
          setBillingMessage({
            title: "Checkout closed",
            body: "Payment failed. Please try again.",
            variant: "error",
          });
        },
      });
    } catch (error) {
      setBillingMessage({
        title: "Couldn’t start payment",
        body: getErrorMessage(error, "Payment failed. Please try again."),
        variant: "error",
      });
    } finally {
      setIsBuyingCredits(false);
    }
  };

  // Hydration fix: Only show loading state after component has mounted on client
  // server renders the content view initially, so client must match for first render
  if (isMounted && loading && !subscription) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div
          className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#2F6BFF]"
          aria-hidden
        />
      </div>
    );
  }

  const currentCatalogSku = findCatalogSkuByCode(
    catalog,
    currentPlanCode,
  );
  const currentCatalogFamily = catalog?.plans.find(
    (plan) =>
      plan.monthly?.code === currentPlanCode ||
      plan.yearly?.code === currentPlanCode,
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
    <div className="min-h-screen bg-black px-2 py-8 text-white sm:px-3 md:pl-20 md:pr-4 md:py-10 lg:pl-24 lg:pr-6">
      {mandateNotice && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mandate-notice-title"
        >
          <div className="max-w-md rounded-2xl border border-white/[0.1] bg-[#0a0a0a] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
            <h3
              id="mandate-notice-title"
              className="mb-2 text-lg font-semibold text-white"
            >
              New UPI AutoPay authorization
            </h3>
            <p className="mb-6 text-sm text-zinc-400">
              You pay with UPI. Changing your plan needs a new AutoPay mandate
              for the new amount. You&apos;ll complete a quick checkout to
              authorize it.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
                onClick={() => {
                  setMandateNotice(null);
                  setShowCheckout(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#2F6BFF] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(47,107,255,0.4)] transition hover:bg-[#2a5fe3]"
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

      <div className="mx-auto w-full max-w-[1600px]">
        {paymentBlocked ? (
          <div className="mb-8 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
            <div className="font-semibold">
              Payment failed. Please update your payment method to continue.
            </div>
            <div className="mt-1 text-xs text-red-200/80">
              Credits will not refresh until payment succeeds.
            </div>
            <button
              type="button"
              disabled={resumeSubscriptionBusy}
              onClick={() => void handleResumeSubscription()}
              className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 ring-1 ring-red-500/40 transition hover:bg-red-500/30 disabled:opacity-50"
            >
              {resumeSubscriptionBusy ? "Opening…" : "Resume subscription"}
            </button>
          </div>
        ) : null}
        {freeWithBalance ? (
          <div className="mb-8 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 text-sm text-blue-100">
            <div className="font-semibold">You are currently on Free plan.</div>
            <div className="mt-1 text-xs text-blue-200/80">
              Your existing credits remain available until used. Upgrading re-enables
              recurring plan credits and storage tiers.
            </div>
          </div>
        ) : null}
        {flashNotice ? (
          <div className="mb-8 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <div className="font-semibold">{flashNotice.title}</div>
            {flashNotice.detail ? (
              <div className="mt-1 text-xs text-emerald-200/85">
                {flashNotice.detail}
              </div>
            ) : null}
          </div>
        ) : null}
        {confirmingPaymentBanner ? (
          <div className="mb-8 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100">
            {confirmingPaymentBanner}
          </div>
        ) : null}
        {/* Header */}
        <header className="mb-12 space-y-6">
          <div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Billing & Subscription
            </h1>
            <p className="max-w-2xl text-base text-zinc-400">
              Manage your subscription, view invoices, and track payments
            </p>
          </div>

          <div className="flex flex-col gap-2 text-xs sm:flex-row sm:flex-wrap sm:items-center">
            <span
              className={`rounded-full border px-3 py-1.5 font-medium ${billingStatusPresentation.pillClass}`}
            >
              Current plan status: {billingStatusPresentation.label}
            </span>
            {billingStatusPresentation.hint ? (
              <span className="max-w-2xl text-[11px] leading-snug text-zinc-500 sm:ml-1">
                {billingStatusPresentation.hint}
              </span>
            ) : null}
            {subscription?.nextBillingDate ? (
              <span className="rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 font-medium text-zinc-300">
                {nextBillingLabel}:{" "}
                {new Date(subscription.nextBillingDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/account/invoices")}
              className="rounded-lg border border-white/[0.14] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              View invoices
            </button>
            <button
              type="button"
              onClick={() => router.push("/account/payments")}
              className="rounded-lg border border-white/[0.14] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Payment history
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreditsModal(true);
                void fetchCreditPacks();
              }}
              className="rounded-lg border border-white/[0.14] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Buy additional credits
            </button>
          </div>
        </header>

        {/* Current Subscription Card */}
        {(currentCatalogSku ||
          currentSubscriptionPlan ||
          currentPlanCode === "FREE") && (
          <div className="mb-12">
            <ActivePlanCard
              subscription={{
                id: subscription?.id || "",
                planCode: currentPlanCode || subscription?.planCode || "FREE",
                status:
                  subscription?.status ??
                  (currentPlanCode !== "FREE" ? "ACTIVE" : "FREE"),
                nextBillingDate: subscription?.nextBillingDate,
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
                  (currentPlanCode === "FREE" ? "Free" : "Plan"),
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
        <div className="mb-16">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Available plans
            </h2>
            <div className="inline-flex rounded-xl border border-white/[0.1] bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setBillingInterval("MONTHLY")}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                  billingInterval === "MONTHLY"
                    ? "bg-[#2F6BFF] text-white shadow-[0_4px_12px_rgba(47,107,255,0.35)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval("YEARLY")}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                  billingInterval === "YEARLY"
                    ? "bg-[#2F6BFF] text-white shadow-[0_4px_12px_rgba(47,107,255,0.35)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          <PlanCards
            plans={catalog?.plans || []}
            selectedBillingInterval={billingInterval}
            currentPlanCode={currentPlanCode || undefined}
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
            onBillingIntervalChange={handleCheckoutIntervalChange}
            changeType={(() => {
              try {
                return (window as any).__wmSelectedChangeType as any;
              } catch {
                return "new";
              }
            })()}
          />
        )}

        {showCreditsModal ? (
          <div
            className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="buy-credits-title"
          >
            <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0a0a0a] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
              <div className="mb-2 text-lg font-semibold text-white" id="buy-credits-title">
                Buy additional credits
              </div>
              <p className="mb-5 text-sm text-zinc-400">
                Credits are added instantly and do not expire until used.
              </p>
              <div className="space-y-2">
                {creditPacksLoading ? (
                  <div className="text-sm text-zinc-400">Loading packs...</div>
                ) : creditPacks.length === 0 ? (
                  <div className="text-sm text-zinc-400">
                    No credit packs are available for your plan right now.
                  </div>
                ) : (
                  creditPacks.map((pack) => {
                    const selected = selectedPackCode === pack.code;
                    const priceInr = Number(pack.priceUSD);
                    return (
                      <button
                        key={pack.code}
                        type="button"
                        onClick={() => setSelectedPackCode(pack.code)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          selected
                            ? "border-blue-400/60 bg-blue-500/10"
                            : "border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-white">{pack.name}</span>
                          <span className="text-zinc-200">₹{priceInr.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="mt-1 text-xs text-zinc-400">
                          {pack.credits.toLocaleString()} credits
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="mt-3 text-xs text-zinc-500">GST included in checkout pricing.</div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
                  onClick={() => setShowCreditsModal(false)}
                  disabled={isBuyingCredits}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-[#2F6BFF] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(47,107,255,0.4)] transition hover:bg-[#2a5fe3] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => void handleBuyAdditionalCredits()}
                  disabled={isBuyingCredits || creditPacksLoading || creditPacks.length === 0}
                >
                  {isBuyingCredits ? "Processing..." : "Continue to pay"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <BillingMessageDialog
        open={!!billingMessage}
        title={billingMessage?.title || ""}
        body={billingMessage?.body || ""}
        variant={billingMessage?.variant}
        onContinue={billingMessage?.onContinue}
        primaryLabel={billingMessage?.primaryLabel}
        onClose={() => setBillingMessage(null)}
      />
    </div>
  );
}
