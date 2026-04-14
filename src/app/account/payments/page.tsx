"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, CreditCard, CheckCircle, XCircle, Clock, AlertCircle, Calendar, DollarSign } from 'lucide-react';

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

import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function PaymentsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const router = useRouter();

  useEffect(() => {
    if (user?.uid) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      if (!user?.uid) return;
      const response = await axios.get('/api/billing/payments');
      if (response.data.success || response.data.responseStatus === 'success') {
        const rawPayments = response.data.data || [];
        // Map API status to UI status
        const mappedPayments = rawPayments.map((p: any) => ({
          ...p,
          status: mapApiStatusToUiStatus(p.status)
        }));
        setPayments(mappedPayments);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapApiStatusToUiStatus = (status: string): 'success' | 'failed' | 'pending' | 'refunded' => {
    if (!status) return 'pending';
    const s = status.toLowerCase();
    if (s === 'captured' || s === 'success') return 'success';
    if (s === 'failed') return 'failed';
    if (s === 'refunded') return 'refunded';
    return 'pending'; // created, authorized, etc.
  };

  const formatCurrency = (paisa: number) => {
    return `₹${(paisa / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'refunded':
        return <AlertCircle className="w-5 h-5 text-[#2F6BFF]" />;
      default:
        return <Clock className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200';
      case 'failed':
        return 'border-red-500/25 bg-red-500/10 text-red-200';
      case 'pending':
        return 'border-amber-500/25 bg-amber-500/10 text-amber-200';
      case 'refunded':
        return 'border-[#2F6BFF]/25 bg-[#2F6BFF]/10 text-[#7aa3ff]';
      default:
        return 'border-white/[0.12] bg-white/[0.04] text-zinc-300';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredPayments = Array.isArray(payments) ? payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  }) : [];

  const successCount = Array.isArray(payments) ? payments.filter(p => p.status === 'success').length : 0;
  const failedCount = Array.isArray(payments) ? payments.filter(p => p.status === 'failed').length : 0;
  const totalAmount = Array.isArray(payments) ? payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + p.amountInPaise, 0) : 0;

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
          <button
            type="button"
            onClick={() => router.push('/account/billing')}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.14] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to billing
          </button>
        </header>

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
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-zinc-300">Filter:</span>
              <div className="flex flex-wrap gap-2">
                {['all', 'success', 'failed'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilter(status as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-[#2F6BFF] text-white shadow-[0_4px_12px_rgba(47,107,255,0.35)]'
                        : 'border border-white/[0.12] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]'
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
              {filter === 'all' ? 'No Payment History' : `No ${getStatusLabel(filter)} Payments`}
            </h3>
            <p className="mb-6 text-zinc-400">
              {filter === 'all' 
                ? 'Your payment transactions will appear here'
                : `You don't have any ${filter} payments yet`}
            </p>
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="font-semibold text-[#7aa3ff] hover:text-white transition"
              >
                View All Payments
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
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(payment.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {formatCurrency(payment.amountInPaise)}
                          </h3>
                          {payment.planName && (
                            <p className="text-sm text-zinc-400">
                              {payment.planName} Plan
                            </p>
                          )}
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
                        
                        {payment.paymentMethod && (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <CreditCard className="w-4 h-4" />
                            <span>{payment.paymentMethod}</span>
                          </div>
                        )}

                        {payment.razorpayPaymentId && (
                          <div className="text-xs text-zinc-500">
                            Transaction ID: {payment.razorpayPaymentId}
                          </div>
                        )}
                      </div>

                      {payment.errorMessage && (
                        <div className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 p-3">
                          <p className="text-sm text-red-200">
                            <strong>Error:</strong> {payment.errorMessage}
                          </p>
                        </div>
                      )}
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
