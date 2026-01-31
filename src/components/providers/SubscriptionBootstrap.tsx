
"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCurrentSubscription, selectCurrentSubscription } from "@/store/slices/subscriptionSlice";
import { addNotification } from "@/store/slices/uiSlice";
import toast from "react-hot-toast";

const SubscriptionBootstrap = () => {
  const dispatch = useAppDispatch();
  const subscription = useAppSelector(selectCurrentSubscription);
  const user = useAppSelector((state: any) => state.auth.user);
  const hasCheckedRef = useRef(false);

  // Fetch subscription on mount when user is logged in
  useEffect(() => {
    if (user && !hasCheckedRef.current) {
      dispatch(fetchCurrentSubscription());
      hasCheckedRef.current = true;
    }
  }, [dispatch, user]);

  // Monitor subscription status
  useEffect(() => {
    if (!subscription) return;

    const status = subscription.status;

    // Check for specific statuses
    if (status === "PAST_DUE") {
      // Prevent duplicate toasts if possible, but for now just show error
      dispatch(
        addNotification({
          type: "error",
          message: "Your subscription payment failed. Please update your payment method to avoid interruption.",
        })
      );
      toast.error("Subscription payment failed. Please check your billing details.", {
        duration: 6000,
        id: "sub-past-due", // Unique ID prevents duplicates
      });
    } else if (status === "CANCELLED") {
      // Optional: Inform user, or maybe just let them see it in Billing
      // We generally don't want to nag them every time they reload if they cancelled intentionally.
      // But maybe if it was cancelled recently?
      // For now, we skip global notification for cancellation unless we track 'viewed' state.
    } else if (status === "EXPIRED") {
       toast("Your subscription has expired.", {
         icon: "⚠️",
         id: "sub-expired",
       });
    }
  }, [subscription, dispatch]);

  return null;
};

export default SubscriptionBootstrap;
