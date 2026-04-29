import {
  ensureRazorpayScriptLoaded,
  type RazorpayBillingPrefill,
} from "@/lib/razorpaySubscriptionCheckout";

type OpenOrderCheckoutParams = {
  keyId: string;
  orderId: string;
  amountInPaise: number;
  packName: string;
  prefill?: RazorpayBillingPrefill;
  disableUpi?: boolean;
  onSuccess: (payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => void;
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

export async function openRazorpayOrderCheckout(
  params: OpenOrderCheckoutParams,
): Promise<void> {
  await ensureRazorpayScriptLoaded();
  const {
    keyId,
    orderId,
    amountInPaise,
    packName,
    prefill,
    disableUpi,
    onSuccess,
    onFailure,
    onDismiss,
  } = params;

  const options: Record<string, unknown> = {
    key: keyId,
    order_id: orderId,
    amount: amountInPaise,
    currency: "INR",
    name: "WildMind AI",
    description: `Additional credits: ${packName}`,
    image: "/icons/icon-512x512.png",
    handler: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) =>
      onSuccess({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      }),
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
    ...(disableUpi
      ? {
          method: {
            upi: false,
          },
          config: {
            display: {
              hide: [{ method: "upi" }],
            },
          },
        }
      : {}),
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", (response: { error?: { description?: string } }) => {
    onFailure(response?.error?.description || "Payment failed. Please try again.");
  });
  rzp.open();
}
