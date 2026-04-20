"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  Search,
  RefreshCw,
} from "lucide-react";
import { getApiClient } from "@/lib/axiosInstance";
import { getErrorMessage } from "@/lib/errorMessage";

interface Payment {
  id: string;
  razorpayPaymentId?: string;
  amountInPaise: number;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  paymentMethod?: string;
  createdAt: string;
  planName?: string;
  errorMessage?: string;
}

import { useSelector } from "react-redux";
import { RootState } from "@/store";

type PaymentFilter = "all" | "success" | "failed" | "pending" | "refunded";

export default function PaymentsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (user?.uid) {
      void fetchPayments();
    }
  }, [user]);

  const fetchPayments = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setErrorText(null);
    try {
      if (!user?.uid) {
        setPayments([]);
        return;
      }
      const api = getApiClient();
      const response = await api.get("/api/billing/payments");
      if (response.data.success || response.data.responseStatus === "success") {
        const rawPayments = response.data.data || [];
        // Map API status to UI status
        const mappedPayments = rawPayments.map((p: any) => ({
          ...p,
          status: mapApiStatusToUiStatus(p.status),
        }));
        setPayments(mappedPayments);
      } else {
        setPayments([]);
      }
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load payment history.");
      setErrorText(message);
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const mapApiStatusToUiStatus = (
    status: string,
  ): "success" | "failed" | "pending" | "refunded" => {
    if (!status) return "pending";
    const s = status.toLowerCase();
    if (s === "captured" || s === "success") return "success";
    if (s === "failed") return "failed";
    if (s === "refunded") return "refunded";
    return "pending"; // created, authorized, etc.
  };

  const formatCurrency = (paisa: number) => {
    return `₹${(paisa / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "pending":
        return <Clock className="w-5 h-5 text-amber-400" />;
      case "refunded":
        return <AlertCircle className="w-5 h-5 text-[#2F6BFF]" />;
      default:
        return <Clock className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
      case "failed":
        return "border-red-500/25 bg-red-500/10 text-red-200";
      case "pending":
        return "border-amber-500/25 bg-amber-500/10 text-amber-200";
      case "refunded":
        return "border-[#2F6BFF]/25 bg-[#2F6BFF]/10 text-[#7aa3ff]";
      default:
        return "border-white/[0.12] bg-white/[0.04] text-zinc-300";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Array.isArray(payments)
      ? payments.filter((payment) => {
          if (filter !== "all" && payment.status !== filter) {
            return false;
          }
          if (!q) return true;
          return (
            payment.planName?.toLowerCase().includes(q) ||
            payment.paymentMethod?.toLowerCase().includes(q) ||
            payment.razorpayPaymentId?.toLowerCase().includes(q) ||
            payment.errorMessage?.toLowerCase().includes(q)
          );
        })
      : [];
  }, [payments, filter, query]);

  const successCount = Array.isArray(payments)
    ? payments.filter((p) => p.status === "success").length
    : 0;
  const failedCount = Array.isArray(payments)
    ? payments.filter((p) => p.status === "failed").length
    : 0;
  const totalAmount = Array.isArray(payments)
    ? payments
        .filter((p) => p.status === "success")
        .reduce((sum, p) => sum + p.amountInPaise, 0)
    : 0;

  return (
    <div className="min-h-screen bg-black px-2 py-8 text-white sm:px-3 md:pl-20 md:pr-4 md:py-10 lg:pl-24 lg:pr-6">
      <div className="mx-auto w-full max-w-[1600px]">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-[#2F6BFF]" />
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Payment history
              </h1>
            </div>
            <p className="max-w-2xl text-base text-zinc-400">
              View all your payment transactions
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void fetchPayments({ silent: true })}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.14] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => router.push("/account/billing")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.14] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to billing
            </button>
          </div>
        </header>

        {errorText ? (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="font-semibold">Unable to load payments</div>
            <div className="mt-1 text-red-100/90">{errorText}</div>
            <button
              type="button"
              onClick={() => void fetchPayments()}
              className="mt-3 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-100 hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Stats */}
        {!loading && Array.isArray(payments) && payments.length > 0 && (
          <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
              <div className="mb-2 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <p className="text-sm text-zinc-400">Successful payments</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-white">{successCount}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
              <div className="mb-2 flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-[#2F6BFF]" />
                <p className="text-sm text-zinc-400">Total paid</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-white">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
              <div className="mb-2 flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-400" />
                <p className="text-sm text-zinc-400">Failed attempts</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-white">{failedCount}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {!loading && Array.isArray(payments) && payments.length > 0 && (
          <div className="mb-8 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by plan, method, payment ID or error"
                  className="w-full rounded-lg border border-white/[0.12] bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white outline-none transition focus:border-[#2F6BFF]/60"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "success", "failed", "pending", "refunded"] as PaymentFilter[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? "bg-[#2F6BFF] text-white shadow-[0_4px_12px_rgba(47,107,255,0.35)]"
                        : "border border-white/[0.12] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#2F6BFF]" />
              <p className="text-zinc-400">Loading payment history...</p>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] py-16 text-center">
            <CreditCard className="mx-auto mb-4 h-16 w-16 text-zinc-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">
              {payments.length === 0
                ? "No Payment History"
                : filter === "all"
                  ? "No matching payments"
                  : `No ${getStatusLabel(filter)} payments`}
            </h3>
            <p className="mb-6 text-zinc-400">
              {payments.length === 0
                ? "Your payment transactions will appear here"
                : "Try a different search term or filter"}
            </p>
            {(filter !== "all" || query) && (
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
                className="font-semibold text-[#7aa3ff] hover:text-white transition"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          /* Payment List */
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a] transition hover:border-white/[0.14]"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        {getStatusIcon(payment.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {formatCurrency(payment.amountInPaise)}
                          </h3>
                          {payment.planName ? (
                            <p className="text-sm text-zinc-400">
                              {payment.planName} Plan
                            </p>
                          ) : null}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(payment.status)}`}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(payment.createdAt)} at {formatTime(payment.createdAt)}</span>
                        </div>
                        
                        {payment.paymentMethod ? (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <CreditCard className="w-4 h-4" />
                            <span>{payment.paymentMethod}</span>
                          </div>
                        ) : null}

                        {payment.razorpayPaymentId ? (
                          <div className="text-xs text-zinc-500">
                            Transaction ID: {payment.razorpayPaymentId}
                          </div>
                        ) : null}
                      </div>

                      {payment.errorMessage ? (
                        <div className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 p-3">
                          <p className="text-sm text-red-200">
                            <strong>Error:</strong> {payment.errorMessage}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
