/**
 * Shared Razorpay subscription checkout (new sub + UPI plan-change resubscribe).
 */
export type RazorpayBillingPrefill = {
  name?: string;
  email?: string;
  contact?: string;
};

export type OpenSubscriptionCheckoutParams = {
  keyId: string;
  subscriptionId: string;
  planName: string;
  prefill?: RazorpayBillingPrefill;
  onSuccess: () => void;
  onFailure: (message: string) => void;
  onDismiss?: () => void;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (payload: any) => void) => void;
    };
  }
}

export async function ensureRazorpayScriptLoaded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.Razorpay) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

export function openRazorpaySubscriptionCheckout(
  params: OpenSubscriptionCheckoutParams,
): void {
  const {
    keyId,
    subscriptionId,
    planName,
    prefill,
    onSuccess,
    onFailure,
    onDismiss,
  } = params;

  const options: Record<string, unknown> = {
    key: keyId,
    subscription_id: subscriptionId,
    name: "WildMind AI",
    description: `${planName} Plan`,
    image: "/icons/icon-512x512.png",
    handler: () => onSuccess(),
    modal: {
      ondismiss: () => onDismiss?.(),
    },
    theme: {
      color: "#3b82f6",
    },
    prefill: {
      name: prefill?.name,
      email: prefill?.email,
      contact: prefill?.contact,
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", (response: { error?: { description?: string } }) => {
    onFailure(response?.error?.description || "Payment failed");
  });
  rzp.open();
}
