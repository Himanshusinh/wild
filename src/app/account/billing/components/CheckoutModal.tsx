"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plan } from "./PlanCards";
import api from "@/lib/axiosInstance";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";

interface CheckoutModalProps {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (billingDetails: BillingDetails) => Promise<void>;
  isLoadingPlanChange: boolean;
  changeType?: "upgrade" | "downgrade" | "new";
  onBillingIntervalChange?: (interval: "MONTHLY" | "YEARLY") => void;
}

interface BillingDetails {
  email?: string;
  name?: string;
  country?: string;
  gstin?: string;
  billingState?: string;
  billingAddress?: string;
}

const COUNTRY_OPTIONS: Array<{ label: string; value: string; currency: string }> = [
  { label: "India", value: "IN", currency: "INR" },
  { label: "United States", value: "US", currency: "USD" },
  { label: "United Kingdom", value: "GB", currency: "GBP" },
  { label: "United Arab Emirates", value: "AE", currency: "AED" },
  { label: "European Union", value: "EU", currency: "EUR" },
  { label: "Canada", value: "CA", currency: "CAD" },
  { label: "Australia", value: "AU", currency: "AUD" },
  { label: "Singapore", value: "SG", currency: "SGD" },
  { label: "Japan", value: "JP", currency: "JPY" },
  { label: "Germany", value: "DE", currency: "EUR" },
  { label: "France", value: "FR", currency: "EUR" },
  { label: "Italy", value: "IT", currency: "EUR" },
  { label: "Spain", value: "ES", currency: "EUR" },
  { label: "Netherlands", value: "NL", currency: "EUR" },
  { label: "Sweden", value: "SE", currency: "SEK" },
  { label: "Norway", value: "NO", currency: "NOK" },
  { label: "Denmark", value: "DK", currency: "DKK" },
  { label: "Switzerland", value: "CH", currency: "CHF" },
  { label: "Austria", value: "AT", currency: "EUR" },
  { label: "Belgium", value: "BE", currency: "EUR" },
  { label: "Poland", value: "PL", currency: "PLN" },
  { label: "Czech Republic", value: "CZ", currency: "CZK" },
  { label: "Hungary", value: "HU", currency: "HUF" },
  { label: "Romania", value: "RO", currency: "RON" },
  { label: "Portugal", value: "PT", currency: "EUR" },
  { label: "Ireland", value: "IE", currency: "EUR" },
  { label: "Finland", value: "FI", currency: "EUR" },
  { label: "Greece", value: "GR", currency: "EUR" },
  { label: "Turkey", value: "TR", currency: "TRY" },
  { label: "Russia", value: "RU", currency: "RUB" },
  { label: "Ukraine", value: "UA", currency: "UAH" },
  { label: "Saudi Arabia", value: "SA", currency: "SAR" },
  { label: "Qatar", value: "QA", currency: "QAR" },
  { label: "Kuwait", value: "KW", currency: "KWD" },
  { label: "Bahrain", value: "BH", currency: "BHD" },
  { label: "Oman", value: "OM", currency: "OMR" },
  { label: "Israel", value: "IL", currency: "ILS" },
  { label: "South Africa", value: "ZA", currency: "ZAR" },
  { label: "Nigeria", value: "NG", currency: "NGN" },
  { label: "Kenya", value: "KE", currency: "KES" },
  { label: "Egypt", value: "EG", currency: "EGP" },
  { label: "Morocco", value: "MA", currency: "MAD" },
  { label: "Brazil", value: "BR", currency: "BRL" },
  { label: "Mexico", value: "MX", currency: "MXN" },
  { label: "Argentina", value: "AR", currency: "ARS" },
  { label: "Chile", value: "CL", currency: "CLP" },
  { label: "Colombia", value: "CO", currency: "COP" },
  { label: "Peru", value: "PE", currency: "PEN" },
  { label: "China", value: "CN", currency: "CNY" },
  { label: "Hong Kong", value: "HK", currency: "HKD" },
  { label: "South Korea", value: "KR", currency: "KRW" },
  { label: "Taiwan", value: "TW", currency: "TWD" },
  { label: "Thailand", value: "TH", currency: "THB" },
  { label: "Malaysia", value: "MY", currency: "MYR" },
  { label: "Indonesia", value: "ID", currency: "IDR" },
  { label: "Philippines", value: "PH", currency: "PHP" },
  { label: "Vietnam", value: "VN", currency: "VND" },
  { label: "Pakistan", value: "PK", currency: "PKR" },
  { label: "Bangladesh", value: "BD", currency: "BDT" },
  { label: "Sri Lanka", value: "LK", currency: "LKR" },
  { label: "Nepal", value: "NP", currency: "NPR" },
  { label: "New Zealand", value: "NZ", currency: "NZD" },
];

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
  onBillingIntervalChange,
}: CheckoutModalProps) {
  const { formatMoney } = useDisplayCurrency();
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    country: "IN",
    gstin: "",
    billingState: "",
    billingAddress: "",
  });

  const [showGSTFields, setShowGSTFields] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [stateQuery, setStateQuery] = useState("");
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
  const selectedCountry = billingDetails.country || "IN";
  const selectedCountryLabel =
    COUNTRY_OPTIONS.find((c) => c.value === selectedCountry)?.label || "India";
  const selectedCurrency =
    COUNTRY_OPTIONS.find((c) => c.value === selectedCountry)?.currency || "INR";
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);
  const stateDropdownRef = useRef<HTMLDivElement | null>(null);
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((country) =>
      `${country.label} ${country.currency}`.toLowerCase().includes(q),
    );
  }, [countryQuery]);
  const selectedStateLabel =
    INDIAN_STATES.find((s) => s.code === billingDetails.billingState)?.name ||
    "Select State";
  const filteredStates = useMemo(() => {
    const q = stateQuery.trim().toLowerCase();
    if (!q) return INDIAN_STATES;
    return INDIAN_STATES.filter((state) =>
      state.name.toLowerCase().includes(q),
    );
  }, [stateQuery]);

  useEffect(() => {
    if (!countryDropdownOpen && !stateDropdownOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setCountryDropdownOpen(false);
      }
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(event.target as Node)
      ) {
        setStateDropdownOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCountryDropdownOpen(false);
        setStateDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEscape);
    };
  }, [countryDropdownOpen, stateDropdownOpen]);
  const isHighValuePlan =
    (plan.billingInterval === "MONTHLY" ? plan.totalPriceINR : plan.totalPriceINR / 12) >=
      10000 ||
    String(plan.code || "").toUpperCase().includes("AGENCY");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-1.5 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[calc(100dvh-0.5rem)] w-full max-w-5xl overflow-y-auto rounded-lg border border-white/[0.1] bg-[#0a0a0a] shadow-[0_24px_64px_rgba(0,0,0,0.65)] sm:max-h-[92vh] sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#0a0a0a]/95 p-3 backdrop-blur-md sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white sm:text-2xl">Checkout</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 transition hover:text-white"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 p-3 text-white sm:gap-6 sm:p-6 lg:grid-cols-[1fr_0.95fr]">
          {/* Left: Billing information */}
          <section className="space-y-3 rounded-lg bg-white/[0.02] p-3 sm:space-y-5 sm:rounded-xl sm:p-5">
            <h3 className="text-lg font-semibold tracking-tight sm:text-2xl">Billing information</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Name
                </label>
                <input
                  type="text"
                  value={billingDetails.name ?? ""}
                  onChange={(e) =>
                    setBillingDetails({ ...billingDetails, name: e.target.value })
                  }
                  placeholder="Enter your name"
                  className="w-full rounded-lg border border-white/[0.12] bg-black/40 px-3 py-1.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-[#2F6BFF]/40 sm:px-4 sm:py-2 sm:text-base"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Country
                </label>
                <div ref={countryDropdownRef} className="relative">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={countryDropdownOpen}
                    onClick={() => setCountryDropdownOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-lg border border-white/[0.12] bg-[#0b0d12] px-3 py-1.5 text-left text-sm text-white outline-none transition hover:border-white/[0.22] focus:ring-2 focus:ring-[#2F6BFF]/40 sm:px-4 sm:py-2 sm:text-base"
                  >
                    <span className="truncate">{selectedCountryLabel}</span>
                    <svg
                      className={`h-4 w-4 text-zinc-400 transition-transform ${
                        countryDropdownOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {countryDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-white/15 bg-[#090b11] shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
                      <div className="border-b border-white/10 p-2">
                        <input
                          type="text"
                          value={countryQuery}
                          onChange={(e) => setCountryQuery(e.target.value)}
                          placeholder="Search country..."
                          className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-[#2F6BFF]/35"
                        />
                      </div>
                      <div
                        role="listbox"
                        className="max-h-48 overflow-y-auto py-1 sm:max-h-56"
                      >
                        {filteredCountries.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-zinc-500">No country found</div>
                        ) : (
                          filteredCountries.map((country) => {
                            const isSelected = country.value === selectedCountry;
                            return (
                              <button
                                key={country.value}
                                type="button"
                                onClick={() => {
                                  setBillingDetails({
                                    ...billingDetails,
                                    country: country.value,
                                  });
                                  setCountryDropdownOpen(false);
                                  setCountryQuery("");
                                }}
                                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                                  isSelected
                                    ? "bg-[#2F6BFF]/20 text-[#9fbeff]"
                                    : "text-zinc-200 hover:bg-white/[0.06]"
                                }`}
                              >
                                <span>{country.label}</span>
                                <span className="text-xs text-zinc-500">{country.currency}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GST Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-200 sm:text-lg">
                Add GST Details (Optional)
              </label>
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
                  showGSTFields ? "bg-[#2F6BFF]" : "bg-zinc-600"
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
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
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
                        className="w-full rounded-lg border border-white/[0.12] bg-black/40 px-3 py-1.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-[#2F6BFF]/40 sm:px-4 sm:py-2 sm:text-base"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleVerifyGstin()}
                      disabled={verifyingGst}
                      className="shrink-0 rounded-lg border border-[#2F6BFF]/50 bg-[#2F6BFF]/15 px-3 py-1.5 text-xs font-medium text-[#7aa3ff] transition hover:bg-[#2F6BFF]/25 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
                    >
                      {verifyingGst ? "Verifying…" : "Verify GSTIN"}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Required for GST invoices: verify once; billing state is set from your GSTIN.
                  </p>
                  {verifiedLegalName && gstVerified && (
                    <p className="mt-1 text-xs text-emerald-400">
                      Legal name: {verifiedLegalName}
                    </p>
                  )}
                  {gstVerifyError && (
                    <p className="mt-1 text-xs text-red-400">
                      {gstVerifyError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Billing State <span className="text-red-400">*</span>
                  </label>
                  <div ref={stateDropdownRef} className="relative">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={stateDropdownOpen}
                      disabled={gstVerified && gstinTrimmed.length > 0}
                      onClick={() => setStateDropdownOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-lg border border-white/[0.12] bg-[#0b0d12] px-3 py-1.5 text-left text-sm text-white outline-none transition hover:border-white/[0.22] focus:ring-2 focus:ring-[#2F6BFF]/40 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2 sm:text-base"
                    >
                      <span className="truncate">{selectedStateLabel}</span>
                      <svg
                        className={`h-4 w-4 text-zinc-400 transition-transform ${
                          stateDropdownOpen ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {stateDropdownOpen && (
                      <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-white/15 bg-[#090b11] shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
                        <div className="border-b border-white/10 p-2">
                          <input
                            type="text"
                            value={stateQuery}
                            onChange={(e) => setStateQuery(e.target.value)}
                            placeholder="Search state..."
                            className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-[#2F6BFF]/35"
                          />
                        </div>
                        <div role="listbox" className="max-h-40 overflow-y-auto py-1 sm:max-h-48">
                          {filteredStates.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-zinc-500">No state found</div>
                          ) : (
                            filteredStates.map((state) => {
                              const isSelected = state.code === billingDetails.billingState;
                              return (
                                <button
                                  key={state.code}
                                  type="button"
                                  onClick={() => {
                                    setBillingDetails({
                                      ...billingDetails,
                                      billingState: state.code,
                                    });
                                    setStateDropdownOpen(false);
                                    setStateQuery("");
                                  }}
                                  className={`w-full px-3 py-2 text-left text-sm transition ${
                                    isSelected
                                      ? "bg-[#2F6BFF]/20 text-[#9fbeff]"
                                      : "text-zinc-200 hover:bg-white/[0.06]"
                                  }`}
                                >
                                  {state.name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Billing Address (Optional)
                  </label>
                  <textarea
                    value={billingDetails.billingAddress}
                    onChange={(e) =>
                      setBillingDetails({ ...billingDetails, billingAddress: e.target.value })
                    }
                    rows={3}
                    placeholder="Enter your billing address"
                    className="w-full resize-none rounded-lg border border-white/[0.12] bg-black/40 px-3 py-1.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-[#2F6BFF]/40 sm:px-4 sm:py-2 sm:text-base"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Right: Plan info and payment summary */}
          <section className="space-y-3 rounded-lg bg-white/[0.02] p-3 sm:space-y-5 sm:rounded-xl sm:p-5">
            <h3 className="text-lg font-semibold tracking-tight sm:text-2xl">Plan info</h3>
            <div className="rounded-lg bg-white/[0.02] p-3 sm:rounded-xl sm:p-4">
              <h4 className="mb-2 text-base font-semibold sm:mb-3 sm:text-lg">{plan.name} Plan</h4>
              <ul className="space-y-1.5 text-sm text-zinc-300 sm:space-y-2">
                <li className="flex items-center gap-2"><span className="text-[#2F6BFF]">✓</span> {plan.credits.toLocaleString()} credits / month</li>
                <li className="flex items-center gap-2"><span className="text-[#2F6BFF]">✓</span> {plan.storageGB} GB storage</li>
                <li className="flex items-center gap-2"><span className="text-[#2F6BFF]">✓</span> Unused credits expire at refresh</li>
              </ul>
              {changeType === "upgrade" ? (
                <p className="mt-3 text-xs font-medium text-[#7aa3ff]">
                  Upgrade now to get additional credits instantly. New pricing will apply from your next billing cycle.
                </p>
              ) : changeType === "downgrade" ? (
                <p className="mt-3 text-xs font-medium text-[#7aa3ff]">
                  Downgrade will take effect from your next billing cycle.
                </p>
              ) : null}
              {isHighValuePlan ? (
                <p className="mt-3 text-xs text-amber-200/90">
                  UPI Autopay may not support high-value recurring payments.
                </p>
              ) : null}
            </div>

            <div className="rounded-lg bg-white/[0.02] p-3 sm:rounded-xl sm:p-4">
              <div className="mb-2 flex items-center justify-between sm:mb-3">
                <span className="text-xs font-medium text-zinc-300 sm:text-sm">Billing</span>
                <div className="inline-flex rounded-lg border border-white/[0.12] p-1">
                  <button
                    type="button"
                    onClick={() => onBillingIntervalChange?.("MONTHLY")}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${
                      plan.billingInterval === "MONTHLY"
                        ? "bg-[#2F6BFF] text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => onBillingIntervalChange?.("YEARLY")}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${
                      plan.billingInterval === "YEARLY"
                        ? "bg-[#2F6BFF] text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 rounded-lg bg-white/[0.03] p-3 sm:space-y-3 sm:rounded-xl sm:p-4">
                <div className="flex justify-between text-xs text-zinc-300 sm:text-sm">
                  <span>Base Price:</span>
                  <span className="tabular-nums text-white">{formatMoney(pricing.basePrice, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-300 sm:text-sm">
                  <span>GST ({pricing.gstRatePercent}%):</span>
                  <span className="tabular-nums text-white">{formatMoney(pricing.gstAmount, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between border-t border-white/[0.08] pt-2.5 text-lg font-bold sm:pt-3 sm:text-2xl">
                  <span>Total payable:</span>
                  <span className="tabular-nums">{formatMoney(pricing.total, selectedCurrency)}</span>
                </div>
                {selectedCurrency !== "INR" ? (
                  <p className="text-xs text-zinc-500">
                    Converted display amount. Billing is charged in INR.
                  </p>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoadingPlanChange}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2F6BFF] py-2.5 px-4 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(47,107,255,0.4)] transition-colors hover:bg-[#2a5fe3] disabled:bg-zinc-600 disabled:shadow-none sm:py-3 sm:px-6 sm:text-base"
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
                  <span>Continue to Pay</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-zinc-500">
              Secured by Razorpay. Your payment information is encrypted.
            </p>
          </section>
        </form>
      </div>
    </div>
  );
}
