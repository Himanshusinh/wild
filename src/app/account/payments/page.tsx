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
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'refunded':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment History</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              View all your payment transactions
            </p>
          </div>
          <button
            onClick={() => router.push('/account/billing')}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </button>
        </div>

        {/* Stats */}
        {!loading && Array.isArray(payments) && payments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Successful Payments</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{successCount}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed Attempts</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{failedCount}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {!loading && Array.isArray(payments) && payments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
              <div className="flex gap-2">
                {['all', 'success', 'failed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading payment history...</p>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {filter === 'all' ? 'No Payment History' : `No ${getStatusLabel(filter)} Payments`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'all' 
                ? 'Your payment transactions will appear here'
                : `You don't have any ${filter} payments yet`}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
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
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(payment.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(payment.amountInPaise)}
                          </h3>
                          {payment.planName && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {payment.planName} Plan
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(payment.createdAt)} at {formatTime(payment.createdAt)}</span>
                        </div>
                        
                        {payment.paymentMethod && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <CreditCard className="w-4 h-4" />
                            <span>{payment.paymentMethod}</span>
                          </div>
                        )}

                        {payment.razorpayPaymentId && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Transaction ID: {payment.razorpayPaymentId}
                          </div>
                        )}
                      </div>

                      {payment.errorMessage && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <p className="text-sm text-red-800 dark:text-red-200">
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
