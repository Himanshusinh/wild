"use client";

// Razorpay TypeScript declarations
declare global {
  interface Window {
    Razorpay: any;
  }
}

import { useEffect, useState } from "react";
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
import PlanCards, { Plan, PLANS } from "./components/PlanCards";
import CheckoutModal from "./components/CheckoutModal";
import ActivePlanCard from "./components/ActivePlanCard";

// Extend Window type for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BillingPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const subscription = useSelector(selectCurrentSubscription);
  const credits = useSelector(selectCredits);
  const loading = useSelector(selectSubscriptionLoading);
  const creatingSubscription = useSelector(selectCreatingSubscription);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    dispatch(fetchCurrentSubscription());
    dispatch(fetchUserCredits());
    
    // Get real user email from Firebase Auth
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email || "");
      setUserName(user.displayName || user.email?.split("@")[0] || "");
    }
  }, [dispatch]);

  // ... (handlers)

  const handleSelectPlan = (planCode: string) => {
    const plan = PLANS.find((p) => p.code === planCode);
    if (plan && plan.priceINR > 0) {
      setSelectedPlan(plan);
      setShowCheckout(true);
    }
  };

  const handleCheckoutConfirm = async (billingDetails: any) => {
    if (!selectedPlan) return;

    try {
      // Check if user has an active subscription to upgrade/downgrade
      const status = subscription?.status?.toUpperCase();
      if (subscription && (status === 'ACTIVE' || status === 'PAST_DUE')) {
        // Handle Upgrade/Downgrade
        console.log("🔄 Processing plan change to:", selectedPlan.code);
        await dispatch(
          changeSubscriptionPlan({
            newPlanCode: selectedPlan.code,
            immediate: true, // Auto-charge prorated amount
          })
        ).unwrap();

        alert(`Plan changed to ${selectedPlan.name} successfully!`);
        setShowCheckout(false);
        setSelectedPlan(null);
        dispatch(fetchCurrentSubscription()); // Refresh data
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
        alert("Unable to initiate payment. Please try again or contact support.");
        setShowCheckout(false);
        setSelectedPlan(null);
        return;
      }

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        console.log("📦 Loading Razorpay SDK...");
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
        
        console.log("✅ Razorpay SDK loaded");
      }

      // Configure Razorpay options
      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "WildMind AI",
        description: `${selectedPlan?.name} Plan`,
        image: "/icons/icon-512x512.png",
        handler: function (response: any) {
          console.log("✅ Payment successful:", response);
          alert("Payment successful! Your subscription is now active.");
          setShowCheckout(false);
          setSelectedPlan(null);
          // Refresh subscription data
          dispatch(fetchCurrentSubscription());
          window.location.href = "/account/billing?payment=success";
        },
        modal: {
          ondismiss: function () {
            console.log("Payment modal closed by user");
            setShowCheckout(false);
            setSelectedPlan(null);
          },
        },
        theme: {
          color: "#3b82f6",
        },
      };

      // Open Razorpay checkout modal
      console.log("🚀 Opening Razorpay checkout modal");
      const rzp = new window.Razorpay(options);
      
      rzp.on("payment.failed", function (response: any) {
        console.error("❌ Payment failed:", response.error);
        alert(`Payment failed: ${response.error.description}`);
        setShowCheckout(false);
        setSelectedPlan(null);
      });

      rzp.open();
      
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(`Error: ${error.message || "Failed to create subscription"}`);
      setShowCheckout(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

    try {
      await dispatch(cancelSubscription({ immediate: false })).unwrap();
      alert("Subscription cancelled. It will remain active until the end of the current billing period.");
    } catch (error: any) {
      alert(`Error: ${error.message || "Failed to cancel subscription"}`);
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

  const currentPlan = PLANS.find((p) => p.code === subscription?.planCode);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription, view invoices, and track payments
          </p>
          
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
      {subscription && currentPlan && (
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
              name: currentPlan.name,
              credits: currentPlan.credits,
              storageGB: currentPlan.storageGB,
              priceINR: currentPlan.priceINR,
            }}
            onCancelSubscription={handleCancelSubscription}
          />
        </div>
      )}

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Available Plans</h2>
        <PlanCards
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
        />
      )}
      </div>
    </div>
  );
}
