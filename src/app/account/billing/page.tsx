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
} from "@/store/slices/subscriptionSlice";
import { fetchUserCredits, selectCredits } from "@/store/slices/creditsSlice";
import PlanCards, { Plan, PLANS } from "./components/PlanCards";
import CheckoutModal from "./components/CheckoutModal";

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

  useEffect(() => {
    dispatch(fetchCurrentSubscription());
    dispatch(fetchUserCredits());
    
    // Get real user email from Firebase Auth
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email || "");
      setUserName(user.displayName || user.email?.split("@")[0] || "");
    }
  }, [dispatch]);

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

  if (loading && !subscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentPlan = PLANS.find((p) => p.code === subscription?.planCode);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscriptions</h1>

      {/* Current Subscription Card */}
      {subscription && currentPlan && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 mb-8 border-2 border-blue-200 dark:border-blue-900">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Current Plan: {currentPlan.name}</h2>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Credits:</span>
                  <span className="font-bold ml-2">{credits?.creditBalance?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Storage:</span>
                  <span className="font-bold ml-2">
                    {((credits?.storageUsed || 0) / 1024 / 1024 / 1024).toFixed(2)} GB / {currentPlan.storageGB} GB
                  </span>
                </div>
              </div>
              {subscription.nextBillingDate && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                </p>
              )}
            </div>
            
            {subscription.status === "ACTIVE" && currentPlan.priceINR > 0 && (
              <button
                onClick={handleCancelSubscription}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Available Plans</h2>
        <PlanCards
          currentPlanCode={subscription?.planCode}
          onSelectPlan={handleSelectPlan}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => router.push("/account/invoices")}
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Invoices
        </button>
        <button
          onClick={() => router.push("/account/payments")}
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Payment History
        </button>
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
          loading={creatingSubscription}
        />
      )}
    </div>
  );
}
