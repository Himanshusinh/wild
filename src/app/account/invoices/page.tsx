"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  FileText,
  Search,
  RefreshCw,
} from "lucide-react";
import { getApiClient } from "@/lib/axiosInstance";
import { getErrorMessage } from "@/lib/errorMessage";
import BillingMessageDialog from "../billing/components/BillingMessageDialog";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amountInPaise: number;
  taxInPaise: number;
  totalInPaise: number;
  status: string;
  invoiceKind: string;
  currency: string;
  gstType?: string | null;
  description?: string | null;
  createdAt: string;
  paymentRecord?: {
    providerPaymentId?: string;
    providerOrderId?: string;
    providerSubId?: string;
  };
}

import { useSelector } from "react-redux";
import { RootState } from "@/store";

type StatusFilter = "all" | "paid" | "pending" | "failed";

export default function InvoicesPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialog, setDialog] = useState<{
    title: string;
    body: string;
    variant?: "error" | "info";
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user?.uid) {
      void fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setErrorText(null);
    try {
      if (!user?.uid) {
        setInvoices([]);
        return;
      }
      const api = getApiClient();
      const response = await api.get("/api/billing/invoices");
      if (response.data.success || response.data.responseStatus === "success") {
        setInvoices(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load invoices.");
      setErrorText(message);
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setDownloading(invoiceId);
      const api = getApiClient();
      const response = await api.get(`/api/billing/invoices/${invoiceId}/pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download invoice:", error);
      setDialog({
        title: "Couldn’t download invoice",
        body: getErrorMessage(error, "Failed to download invoice. Please try again."),
        variant: "error",
      });
    } finally {
      setDownloading(null);
    }
  };

  const formatCurrency = (minorUnits: number, currency: string) => {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((minorUnits || 0) / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    // Safety check for undefined/null status
    if (!status) return "border-white/[0.12] bg-white/[0.04] text-zinc-300";

    switch (status.toLowerCase()) {
      case "paid":
        return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
      case "pending":
        return "border-amber-500/25 bg-amber-500/10 text-amber-200";
      case "failed":
        return "border-red-500/25 bg-red-500/10 text-red-200";
      default:
        return "border-white/[0.12] bg-white/[0.04] text-zinc-300";
    }
  };

  const getInvoiceKindLabel = (invoice: Invoice) => {
    if (invoice.paymentRecord?.providerSubId) return "Subscription";
    if (invoice.invoiceKind === "EXPORT") return "One-time export";
    return "One-time";
  };

  const getTaxLabel = (invoice: Invoice) => {
    if (invoice.invoiceKind === "EXPORT") return "Export / GST";
    if (invoice.gstType === "CGST_SGST") return "CGST + SGST";
    if (invoice.gstType === "IGST") return "IGST";
    return "Tax";
  };

  const visibleInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const status = String(invoice.status || "").toLowerCase();
      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        invoice.invoiceNumber?.toLowerCase().includes(q) ||
        invoice.description?.toLowerCase().includes(q) ||
        invoice.paymentRecord?.providerPaymentId?.toLowerCase().includes(q) ||
        invoice.paymentRecord?.providerOrderId?.toLowerCase().includes(q)
      );
    });
  }, [invoices, query, statusFilter]);

  const paidCount = invoices.filter((i) => i.status?.toLowerCase() === "paid").length;
  const pendingCount = invoices.filter((i) => i.status?.toLowerCase() === "pending").length;

  return (
    <div className="min-h-screen bg-black px-2 py-8 text-white sm:px-3 md:pl-20 md:pr-4 md:py-10 lg:pl-24 lg:pr-6">
      <div className="mx-auto w-full max-w-[1600px]">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <FileText className="h-8 w-8 text-[#2F6BFF]" />
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Invoices
              </h1>
            </div>
            <p className="max-w-2xl text-base text-zinc-400">
              View and download your billing invoices
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void fetchInvoices({ silent: true })}
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

        {!loading && invoices.length > 0 ? (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-5">
              <div className="text-sm text-zinc-400">Paid invoices</div>
              <div className="mt-2 text-2xl font-semibold text-white">{paidCount}</div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-5">
              <div className="text-sm text-zinc-400">Pending invoices</div>
              <div className="mt-2 text-2xl font-semibold text-white">{pendingCount}</div>
            </div>
          </div>
        ) : null}

        {!loading && invoices.length > 0 ? (
          <div className="mb-8 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search invoice number, payment or order reference"
                  className="w-full rounded-lg border border-white/[0.12] bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white outline-none transition focus:border-[#2F6BFF]/60"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "paid", "pending", "failed"] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      statusFilter === status
                        ? "bg-[#2F6BFF] text-white shadow-[0_4px_12px_rgba(47,107,255,0.35)]"
                        : "border border-white/[0.12] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    {status[0].toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {errorText ? (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="font-semibold">Unable to load invoices</div>
            <div className="mt-1 text-red-100/90">{errorText}</div>
            <button
              type="button"
              onClick={() => void fetchInvoices()}
              className="mt-3 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-100 hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#2F6BFF]" />
              <p className="text-zinc-400">Loading invoices...</p>
            </div>
          </div>
        ) : visibleInvoices.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] py-16 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-zinc-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">
              {invoices.length === 0 ? "No Invoices Yet" : "No matching invoices"}
            </h3>
            <p className="mb-6 text-zinc-400">
              {invoices.length === 0
                ? "Your invoices will appear here once you make a payment"
                : "Try a different search term or status filter"}
            </p>
            <button
              type="button"
              onClick={() =>
                invoices.length === 0
                  ? router.push("/account/billing")
                  : (setQuery(""), setStatusFilter("all"))
              }
              className="rounded-lg bg-[#2F6BFF] px-6 py-3 font-medium text-white shadow-[0_4px_16px_rgba(47,107,255,0.4)] transition hover:bg-[#2a5fe3]"
            >
              {invoices.length === 0 ? "View Billing Plans" : "Clear filters"}
            </button>
          </div>
        ) : (
          /* Invoice List */
          <div className="space-y-4">
            {visibleInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a] transition hover:border-white/[0.14]"
              >
                <div className="p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          {invoice.invoiceNumber}
                        </h3>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(invoice.createdAt)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-zinc-400">
                          <CreditCard className="w-4 h-4" />
                          <span>{getInvoiceKindLabel(invoice)}</span>
                        </div>
                        {invoice.description && (
                          <div className="text-zinc-400">
                            {invoice.description}
                          </div>
                        )}
                        {invoice.paymentRecord?.providerPaymentId ? (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <CreditCard className="w-4 h-4" />
                            <span>Payment ref: {invoice.paymentRecord.providerPaymentId}</span>
                          </div>
                        ) : null}
                        {invoice.paymentRecord?.providerOrderId ? (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <CreditCard className="w-4 h-4" />
                            <span>Order ref: {invoice.paymentRecord.providerOrderId}</span>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2 text-zinc-400">
                          <CreditCard className="w-4 h-4" />
                          <span>
                            {invoice.invoiceKind === "EXPORT"
                              ? "Export invoice"
                              : invoice.gstType === "CGST_SGST"
                                ? "Same-state GST"
                                : "Interstate GST"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-white/[0.08] pt-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="mb-1 text-zinc-500">Amount</p>
                            <p className="font-semibold text-zinc-100">
                              {formatCurrency(invoice.amountInPaise, invoice.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 text-zinc-500">{getTaxLabel(invoice)}</p>
                            <p className="font-semibold text-zinc-100">
                              {formatCurrency(invoice.taxInPaise, invoice.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 text-zinc-500">Total</p>
                            <p className="text-xl font-bold text-white">
                              {formatCurrency(invoice.totalInPaise, invoice.currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Download Button */}
                    <div className="lg:ml-6">
                      <button
                        type="button"
                        onClick={() => downloadInvoice(invoice.id, invoice.invoiceNumber)}
                        disabled={downloading === invoice.id}
                        className="flex items-center gap-2 rounded-lg bg-[#2F6BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(47,107,255,0.35)] transition hover:bg-[#2a5fe3] disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:shadow-none"
                      >
                        {downloading === invoice.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        {visibleInvoices.length > 0 && (
          <div className="mt-8 rounded-xl border border-[#2F6BFF]/25 bg-[#2F6BFF]/10 p-4">
            <p className="text-sm text-[#b8ccff]">
              <strong>Note:</strong> Paid invoices are generated in your account after payment succeeds.
              Domestic invoices include GST breakdown, while export invoices are rendered separately with zero-tax wording.
            </p>
          </div>
        )}
      </div>
      <BillingMessageDialog
        open={!!dialog}
        title={dialog?.title || ""}
        body={dialog?.body || ""}
        variant={dialog?.variant}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
