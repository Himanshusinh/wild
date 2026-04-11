"use client";

import { useState } from "react";
import { Plan } from "./PlanCards";
import api from "@/lib/axiosInstance";

interface CheckoutModalProps {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (billingDetails: BillingDetails) => Promise<void>;
  isLoadingPlanChange: boolean;
  changeType?: "upgrade" | "downgrade" | "new";
}

interface BillingDetails {
  email?: string;
  name?: string;
  gstin?: string;
  billingState?: string;
  billingAddress?: string;
}

const INDIAN_STATES = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman and Diu" },
  { code: "26", name: "Dadra and Nagar Haveli" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
];

export default function CheckoutModal({
  plan,
  isOpen,
  onClose,
  onConfirm,
  isLoadingPlanChange = false,
  changeType = "new",
}: CheckoutModalProps) {
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    gstin: "",
    billingState: "",
    billingAddress: "",
  });

  const [showGSTFields, setShowGSTFields] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [gstVerifyError, setGstVerifyError] = useState<string | null>(null);
  const [verifyingGst, setVerifyingGst] = useState(false);
  const [verifiedLegalName, setVerifiedLegalName] = useState<string | null>(
    null,
  );

  const gstinTrimmed = (billingDetails.gstin ?? "").trim().toUpperCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showGSTFields && gstinTrimmed.length > 0 && !gstVerified) {
      alert(
        "Verify your GSTIN before continuing — click Verify GSTIN after entering the number.",
      );
      return;
    }
    onConfirm(showGSTFields ? billingDetails : {});
  };

  const handleVerifyGstin = async () => {
    const raw = (billingDetails.gstin ?? "").trim();
    if (!raw) {
      setGstVerifyError("Enter a GSTIN to verify.");
      return;
    }
    setGstVerifyError(null);
    setVerifyingGst(true);
    try {
      const res = await api.post("/api/billing/validate-gstin", {
        gstin: raw,
      });
      const payload = res.data?.data as
        | {
            gstin?: string;
            legalName?: string;
            state?: string;
            status?: string;
            isGSTVerified?: boolean;
          }
        | undefined;
      if (!payload?.state) {
        setGstVerifyError("Unexpected response from GST verification.");
        return;
      }
      setGstVerified(true);
      setVerifiedLegalName(payload.legalName ?? null);
      setBillingDetails((prev) => ({
        ...prev,
        gstin: payload.gstin ?? raw.toUpperCase().replace(/\s+/g, ""),
        billingState: payload.state,
      }));
    } catch (err: any) {
      const data = err?.response?.data;
      let msg =
        (typeof data?.message === "string" && data.message) ||
        err?.message ||
        "GST verification failed.";
      if (Array.isArray(data?.message)) {
        msg = data.message.join(", ");
      }
      setGstVerified(false);
      setVerifiedLegalName(null);
      setGstVerifyError(msg);
    } finally {
      setVerifyingGst(false);
    }
  };

  const calculateGST = () => {
    const basePrice = plan.priceINR;
    const gstRatePercent = plan.gstRatePercent ?? 18;
    const gstAmount =
      plan.gstAmountINR ?? Number((basePrice * (gstRatePercent / 100)).toFixed(2));
    return {
      basePrice,
      gstRatePercent,
      gstAmount,
      total:
        plan.totalPriceINR ?? Number((basePrice + gstAmount).toFixed(2)),
    };
  };

  const pricing = calculateGST();
  const isHighValuePlan =
    (plan.billingInterval === "MONTHLY" ? plan.totalPriceINR : plan.totalPriceINR / 12) >=
      10000 ||
    String(plan.code || "").toUpperCase().includes("AGENCY");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Checkout</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Plan Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">{plan.name} Plan</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Credits refresh:</span>
                <span className="font-medium">
                  {plan.credits.toLocaleString()} / month
                </span>
              </div>
              <div className="flex justify-between">
                <span>Storage:</span>
                <span className="font-medium">{plan.storageGB} GB</span>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-300">
              <div>Credits refresh every month.</div>
              {plan.billingInterval === "YEARLY" ? (
                <div>Paid yearly. Credits are added monthly.</div>
              ) : null}
              <div>Unused credits expire at refresh.</div>
              {plan.billingInterval === "YEARLY" ? (
                <div>Cancel anytime (no refund).</div>
              ) : (
                <div>Cancel anytime.</div>
              )}
            </div>
            {changeType === "upgrade" ? (
              <div className="mt-3 text-xs text-blue-800 dark:text-blue-200 font-medium">
                Upgrade now to get additional credits instantly. New pricing will apply from your next billing cycle.
              </div>
            ) : changeType === "downgrade" ? (
              <div className="mt-3 text-xs text-blue-800 dark:text-blue-200 font-medium">
                Downgrade will take effect from your next billing cycle.
              </div>
            ) : null}
            {isHighValuePlan ? (
              <div className="mt-3 text-xs text-amber-800 dark:text-amber-200">
                UPI Autopay may not support high-value recurring payments. Recommended: pay with card for uninterrupted renewals.
              </div>
            ) : null}
          </div>

          {/* GST Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Add GST Details (Optional)</label>
            <button
              type="button"
              onClick={() => {
                const next = !showGSTFields;
                setShowGSTFields(next);
                if (!next) {
                  setGstVerified(false);
                  setGstVerifyError(null);
                  setVerifiedLegalName(null);
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showGSTFields ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showGSTFields ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* GST Fields */}
          {showGSTFields && (
            <div className="space-y-4 animate-fadeIn">
              {/* GSTIN */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  GSTIN (Optional)
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={billingDetails.gstin}
                      onChange={(e) => {
                        setGstVerified(false);
                        setGstVerifyError(null);
                        setVerifiedLegalName(null);
                        setBillingDetails({
                          ...billingDetails,
                          gstin: e.target.value,
                        });
                      }}
                      placeholder="22AAAAA0000A1Z5"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleVerifyGstin()}
                    disabled={verifyingGst}
                    className="shrink-0 rounded-lg border border-blue-600 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-200"
                  >
                    {verifyingGst ? "Verifying…" : "Verify GSTIN"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Required for GST invoices: verify once; billing state is set from your GSTIN.
                </p>
                {verifiedLegalName && gstVerified && (
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    Legal name: {verifiedLegalName}
                  </p>
                )}
                {gstVerifyError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {gstVerifyError}
                  </p>
                )}
              </div>

              {/* Billing State */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Billing State <span className="text-red-500">*</span>
                </label>
                <select
                  value={billingDetails.billingState}
                  onChange={(e) =>
                    setBillingDetails({ ...billingDetails, billingState: e.target.value })
                  }
                  required={showGSTFields}
                  disabled={gstVerified && gstinTrimmed.length > 0}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Billing Address */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Billing Address (Optional)
                </label>
                <textarea
                  value={billingDetails.billingAddress}
                  onChange={(e) =>
                    setBillingDetails({ ...billingDetails, billingAddress: e.target.value })
                  }
                  rows={3}
                  placeholder="Enter your billing address"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Base Price:</span>
              <span>₹{pricing.basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST ({pricing.gstRatePercent}%):</span>
              <span>₹{pricing.gstAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-3 flex justify-between font-bold text-lg">
              <span>Total payable:</span>
              <span>₹{pricing.total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500">
              {plan.billingInterval === "YEARLY"
                ? "Billed yearly. Credits refresh monthly during the active year."
                : "Billed monthly. Cancel anytime."}
            </p>
            <p className="text-xs text-gray-500">
              Razorpay charges the GST-inclusive total shown above.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoadingPlanChange}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoadingPlanChange ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Proceed to Payment</span>
              </>
            )}
          </button>

          {/* Security Note */}
          <p className="text-xs text-center text-gray-500">
            Secured by Razorpay. Your payment information is encrypted.
          </p>
        </form>
      </div>
    </div>
  );
}
