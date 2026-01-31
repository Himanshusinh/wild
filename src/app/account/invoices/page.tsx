"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Download, FileText, Calendar, CreditCard } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amountInPaise: number;
  taxInPaise: number;
  totalInPaise: number;
  status: string;
  createdAt: string;
  planName?: string;
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
      const response = await axios.get('/api/billing/invoices');
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
      const response = await axios.get(`/api/billing/invoices/${invoiceId}/pdf`, {
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

  const getStatusColor = (status: string) => {
    // Safety check for undefined/null status
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoices</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              View and download your billing invoices
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

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading invoices...</p>
            </div>
          </div>
        ) : invoices.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Invoices Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your invoices will appear here once you make a payment
            </p>
            <button
              onClick={() => router.push('/account/billing')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(invoice.createdAt)}</span>
                        </div>
                        
                        {invoice.planName && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <CreditCard className="w-4 h-4" />
                            <span>{invoice.planName} Plan</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(invoice.amountInPaise)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 mb-1">Tax (18% GST)</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(invoice.taxInPaise)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 mb-1">Total</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(invoice.totalInPaise)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Download Button */}
                    <div className="ml-6">
                      <button
                        onClick={() => downloadInvoice(invoice.id, invoice.invoiceNumber)}
                        disabled={downloading === invoice.id}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
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
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> All invoices are automatically generated and sent to your registered email address. 
              You can download them anytime from this page for your records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
