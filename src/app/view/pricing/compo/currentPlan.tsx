"use client";

import React from 'react';
import { getApiClient } from '../../../../lib/axiosInstance';
import { getMeCached } from '../../../../lib/me';

function CurrentPlan() {
  const [credits, setCredits] = React.useState<number | null>(null);
  const [plan, setPlan] = React.useState<string>('');
  const [activeSince, setActiveSince] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const api = getApiClient();
        // Fetch credits
        try {
          const creditsRes = await api.get('/api/credits/me');
          const payload = creditsRes.data?.data || creditsRes.data;
          const balance = Number(payload?.creditBalance ?? payload?.credits);
          if (!Number.isNaN(balance)) setCredits(balance);
        } catch {}

        // Fetch user to get plan
        try {
          const data = await getMeCached();
          if (data?.plan) setPlan(String(data.plan));

          // Derive activation date from multiple possible fields
          const rawDate = (
            data?.planActivatedAt ||
            data?.planSince ||
            data?.planActiveSince ||
            data?.subscription?.activeSince ||
            data?.subscription?.startedAt ||
            data?.createdAt
          );

          let jsDate: Date | null = null;
          if (typeof rawDate === 'string') {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) jsDate = d;
          } else if (rawDate && typeof rawDate === 'object') {
            // Support Firestore Timestamp-like { _seconds }
            if (typeof rawDate._seconds === 'number') {
              jsDate = new Date(rawDate._seconds * 1000);
            } else if (typeof (rawDate as any).seconds === 'number') {
              jsDate = new Date((rawDate as any).seconds * 1000);
            }
          }

          if (jsDate) {
            setActiveSince(jsDate.toLocaleDateString());
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="relative text-gray-900 dark:text-white rounded-[2rem]
      bg-white/90 dark:bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
      border border-gray-200 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-gray-200 dark:ring-white/10
      p-5 py-6 w-full md:w-[60%] lg:w-[60%] max-w-7xl min-h-[260px] isolate">
      {/* Glass highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-gray-100/50 dark:from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />

      <div className="min-h-[92px]">
        <h1 className="text-2xl font-semibold mx-2">Current Plan</h1>
        <p className="text-medium text-gray-900 dark:text-gray-600 dark:text-white/80 mt-1 mx-2">{loading ? '...' : (plan || 'Free')}</p>
      </div>

      <div className="absolute top-6 right-6 text-right">
        <p className="text-3xl font-semibold leading-none">{loading ? '...' : (credits ?? 0)}</p>
        <p className="text-medium text-gray-900 dark:text-gray-600 dark:text-white/70 mt-1">Credits</p>
      </div>

      <div className="mt-4 mx-2">
        {activeSince && (
          <div className="text-sm text-gray-900 dark:text-gray-600 dark:text-white/70 mt-16 mb-2 ml-2">Active since: {activeSince}</div>
        )}
        <div className="flex items-center">
          <button className="mt-0 bg-blue-600 hover:bg-blue-700 dark:bg-[#1C303D] dark:hover:bg-[#1c3c52] text-white rounded-full px-5 py-2 text-medium font-regular ring-1 ring-gray-300 dark:ring-white/15 transition-colors">
            Change Plan
          </button>
        </div>
      </div>
    </div>
  );

    
}

export default CurrentPlan; 