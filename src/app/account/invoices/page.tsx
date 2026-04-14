"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, Calendar, CreditCard } from 'lucide-react';
import api from '@/lib/axiosInstance';

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

import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function InvoicesPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user?.uid) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      if (!user?.uid) return;
      // Note: Backend requires userId for fetching invoices
      const response = await api.get('/api/billing/invoices');
      if (response.data.success || response.data.responseStatus === 'success') {
        setInvoices(response.data.data || []);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setDownloading(invoiceId);
      const response = await api.get(`/api/billing/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download invoice:', error);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const formatCurrency = (minorUnits: number, currency: string) => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(minorUnits / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    // Safety check for undefined/null status
    if (!status) return 'border-white/[0.12] bg-white/[0.04] text-zinc-300';
    
    switch (status.toLowerCase()) {
      case 'paid':
        return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200';
      case 'pending':
        return 'border-amber-500/25 bg-amber-500/10 text-amber-200';
      case 'failed':
        return 'border-red-500/25 bg-red-500/10 text-red-200';
      default:
        return 'border-white/[0.12] bg-white/[0.04] text-zinc-300';
    }
  };

  const getInvoiceKindLabel = (invoice: Invoice) => {
    if (invoice.paymentRecord?.providerSubId) return 'Subscription';
    if (invoice.invoiceKind === 'EXPORT') return 'One-time export';
    return 'One-time';
  };

  const getTaxLabel = (invoice: Invoice) => {
    if (invoice.invoiceKind === 'EXPORT') return 'Export / GST';
    if (invoice.gstType === 'CGST_SGST') return 'CGST + SGST';
    if (invoice.gstType === 'IGST') return 'IGST';
    return 'Tax';
  };

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
          <button
            type="button"
            onClick={() => router.push('/account/billing')}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.14] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to billing
          </button>
        </header>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-zinc-400">Loading invoices...</p>
            </div>
          </div>
        ) : invoices.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] py-16 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-zinc-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">
              No Invoices Yet
            </h3>
            <p className="mb-6 text-zinc-400">
              Your invoices will appear here once you make a payment
            </p>
            <button
              type="button"
              onClick={() => router.push('/account/billing')}
              className="rounded-lg bg-[#2F6BFF] px-6 py-3 font-medium text-white shadow-[0_4px_16px_rgba(47,107,255,0.4)] transition hover:bg-[#2a5fe3]"
            >
              View Billing Plans
            </button>
          </div>
        ) : (
          /* Invoice List */
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a] transition hover:border-white/[0.14]"
              >
                <div className="p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
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
                        {invoice.paymentRecord?.providerPaymentId && (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <CreditCard className="w-4 h-4" />
                            <span>Payment ref: {invoice.paymentRecord.providerPaymentId}</span>
                          </div>
                        )}
                        {invoice.paymentRecord?.providerOrderId && (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <CreditCard className="w-4 h-4" />
                            <span>Order ref: {invoice.paymentRecord.providerOrderId}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-zinc-400">
                          <CreditCard className="w-4 h-4" />
                          <span>
                            {invoice.invoiceKind === 'EXPORT'
                              ? 'Export invoice'
                              : invoice.gstType === 'CGST_SGST'
                                ? 'Same-state GST'
                                : 'Interstate GST'}
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
        {invoices.length > 0 && (
          <div className="mt-8 rounded-xl border border-[#2F6BFF]/25 bg-[#2F6BFF]/10 p-4">
            <p className="text-sm text-[#b8ccff]">
              <strong>Note:</strong> Paid invoices are generated in your account after payment succeeds.
              Domestic invoices include GST breakdown, while export invoices are rendered separately with zero-tax wording.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
