"use client";

import type { AppDispatch } from "@/store";
import { store } from "@/store";
import { fetchCurrentSubscription } from "@/store/slices/subscriptionSlice";
import { fetchUserCredits } from "@/store/slices/creditsSlice";
import { getApiClient } from "@/lib/axiosInstance";

export type RazorpaySubscriptionSuccessPayload = {
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
};

export type VerifyErrorKind = "signature_invalid" | "rail_blocked" | "transient";

export type VerifyErrorInfo = {
  kind: VerifyErrorKind;
  code?: string;
  message?: string;
};

function classifyVerifyError(e: unknown): VerifyErrorInfo {
  const anyErr = e as {
    response?: { data?: { code?: string; message?: string } };
    code?: string;
    message?: string;
  };
  const code =
    anyErr?.response?.data?.code ?? (typeof anyErr?.code === "string" ? anyErr.code : undefined);
  const message =
    anyErr?.response?.data?.message ??
    (typeof anyErr?.message === "string" ? anyErr.message : undefined);

  if (code === "PAYMENT_VERIFY_SIGNATURE_INVALID") {
    return { kind: "signature_invalid", code, message };
  }
  if (typeof code === "string" && code.startsWith("PLAN_CHANGE_")) {
    return { kind: "rail_blocked", code, message };
  }
  return { kind: "transient", code, message };
}

export type ConfirmSubscriptionOutcome = {
  becameActive: boolean;
  timedOut: boolean;
  /** Populated when verify POST fails with a non-transient reason. */
  lastVerifyError?: VerifyErrorInfo | null;
  /** Re-run verify + a short poll (e.g. after webhook delay). */
  retryVerify: () => Promise<
    Pick<ConfirmSubscriptionOutcome, "becameActive" | "timedOut" | "lastVerifyError">
  >;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Calls verify-payment (credit-service / Razorpay fallback), then polls subscription until ACTIVE or timeout.
 */
export async function confirmSubscriptionAfterCheckout(
  dispatch: AppDispatch,
  payload: RazorpaySubscriptionSuccessPayload,
  options?: {
    timeoutMs?: number;
    intervalMs?: number;
    /** @deprecated Prefer setStatusText for copy */
    setConfirming?: (v: boolean) => void;
    /** Banner text during verify / sync (null hides). */
    setStatusText?: (message: string | null) => void;
    /** After this many ms of polling without ACTIVE, show "syncing" copy. */
    syncingThresholdMs?: number;
    /** Extra poll after timeout (ms) for retryVerify. */
    retryPollMs?: number;
    /** If true, do not poll after a signature or rail error (webhook cannot fix those). */
    abortPollOnHardVerifyFailure?: boolean;
  },
): Promise<ConfirmSubscriptionOutcome> {
  const timeoutMs = options?.timeoutMs ?? 45000;
  const intervalMs = options?.intervalMs ?? 2500;
  const syncingThresholdMs = options?.syncingThresholdMs ?? 8000;
  const retryPollMs = options?.retryPollMs ?? 20000;
  const api = getApiClient();

  const canVerify =
    payload.razorpay_payment_id &&
    payload.razorpay_subscription_id &&
    payload.razorpay_signature;

  const setBusy = (on: boolean) => {
    options?.setConfirming?.(on);
  };

  const runVerifyPost = async (): Promise<VerifyErrorInfo | null> => {
    if (!canVerify) return null;
    try {
      await api.post("/api/subscriptions/verify-payment", {
        razorpayPaymentId: payload.razorpay_payment_id,
        razorpaySubscriptionId: payload.razorpay_subscription_id,
        razorpaySignature: payload.razorpay_signature,
      });
      return null;
    } catch (e: unknown) {
      return classifyVerifyError(e);
    }
  };

  const pollUntilActive = async (deadlineMs: number): Promise<boolean> => {
    const pollStarted = Date.now();
    const deadline = Date.now() + deadlineMs;
    while (Date.now() < deadline) {
      if (
        Date.now() - pollStarted >= syncingThresholdMs &&
        String(
          store.getState().subscription.current?.status ?? "",
        ).toUpperCase() !== "ACTIVE"
      ) {
        options?.setStatusText?.(
          "Payment received, syncing… You can retry if this takes too long.",
        );
      }
      await dispatch(fetchCurrentSubscription()).unwrap().catch(() => null);
      await dispatch(fetchUserCredits()).unwrap().catch(() => null);
      const st = String(
        store.getState().subscription.current?.status ?? "",
      ).toUpperCase();
      if (st === "ACTIVE") return true;
      await sleep(intervalMs);
    }
    return false;
  };

  setBusy(true);
  options?.setStatusText?.("Confirming payment…");
  let lastVerifyError: VerifyErrorInfo | null = null;
  try {
    if (canVerify) {
      const verifyErr = await runVerifyPost();
      if (verifyErr) {
        lastVerifyError = verifyErr;
        if (
          options?.abortPollOnHardVerifyFailure !== false &&
          (verifyErr.kind === "signature_invalid" ||
            verifyErr.kind === "rail_blocked")
        ) {
          return {
            becameActive: false,
            timedOut: true,
            lastVerifyError,
            retryVerify: async () => ({
              becameActive: false,
              timedOut: true,
              lastVerifyError,
            }),
          };
        }
      }
    }

    const active = await pollUntilActive(timeoutMs);
    return {
      becameActive: active,
      timedOut: !active,
      lastVerifyError,
      retryVerify: async () => {
        options?.setStatusText?.("Confirming payment…");
        const vErr = await runVerifyPost();
        const nextLast = vErr ?? lastVerifyError;
        if (
          options?.abortPollOnHardVerifyFailure !== false &&
          vErr &&
          (vErr.kind === "signature_invalid" || vErr.kind === "rail_blocked")
        ) {
          options?.setStatusText?.(null);
          return {
            becameActive: false,
            timedOut: true,
            lastVerifyError: nextLast,
          };
        }
        const ok = await pollUntilActive(retryPollMs);
        options?.setStatusText?.(null);
        return {
          becameActive: ok,
          timedOut: !ok,
          lastVerifyError: nextLast,
        };
      },
    };
  } finally {
    setBusy(false);
    options?.setStatusText?.(null);
  }
}
