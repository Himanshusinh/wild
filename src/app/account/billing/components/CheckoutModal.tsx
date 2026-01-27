"use client";

import { useState } from "react";
import { Plan, PLANS } from "./PlanCards";

interface CheckoutModalProps {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (billingDetails: BillingDetails) => void;
  loading?: boolean;
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
  loading = false,
}: CheckoutModalProps) {
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    gstin: "",
    billingState: "",
    billingAddress: "",
  });

  const [showGSTFields, setShowGSTFields] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(showGSTFields ? billingDetails : {});
  };

  const calculateGST = () => {
    const basePrice = plan.priceINR;
    const gstRate = 0.18; // 18%
    const gstAmount = basePrice * gstRate;
    return {
      basePrice,
      gstAmount,
      total: basePrice + gstAmount,
    };
  };

  const pricing = calculateGST();

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
                <span>Credits per month:</span>
                <span className="font-medium">{plan.credits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Storage:</span>
                <span className="font-medium">{plan.storageGB} GB</span>
              </div>
            </div>
          </div>

          {/* GST Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Add GST Details (Optional)</label>
            <button
              type="button"
              onClick={() => setShowGSTFields(!showGSTFields)}
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
                <input
                  type="text"
                  value={billingDetails.gstin}
                  onChange={(e) =>
                    setBillingDetails({ ...billingDetails, gstin: e.target.value })
                  }
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For business/GST billing
                </p>
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
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
              <span>₹{pricing.basePrice}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST (18%):</span>
              <span>₹{pricing.gstAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-3 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>₹{pricing.total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500">
              Billed monthly. Cancel anytime.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
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
            🔒 Secured by Razorpay. Your payment information is encrypted.
          </p>
        </form>
      </div>
    </div>
  );
}
