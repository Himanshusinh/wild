"use client";

import React from 'react';
import { getApiClient } from '../../../../lib/axiosInstance';

function CurrentPlan() {
  const [credits, setCredits] = React.useState<number | null>(null);
  const [plan, setPlan] = React.useState<string>('');
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
          const userRes = await api.get('/api/auth/me');
          const data = userRes.data?.data?.user || userRes.data?.user || userRes.data;
          if (data?.plan) setPlan(String(data.plan));
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="relative text-white rounded-[2rem]
      bg-white/5 backdrop-blur-2xl backdrop-saturate-150 bg-clip-padding
      border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10
      p-5 py-6 w-full md:w-[60%] lg:w-[60%] max-w-7xl min-h-[260px] isolate">
      {/* Glass highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-20" aria-hidden />
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" aria-hidden />

      <div className="min-h-[92px]">
        <h1 className="text-lg font-semibold mx-2">Current Plan</h1>
        <p className="text-xs text-white/80 mt-1 mx-2">Plan: {loading ? '...' : (plan || 'Free')}</p>
      </div>

      <div className="absolute top-5 right-6 text-right">
        <p className="text-xl font-bold leading-none">{loading ? '...' : (credits ?? 0)}</p>
        <p className="text-xs text-white/70 mt-1">Credits</p>
      </div>

      <div className="mt-4 mx-2">
        <button className="mt-2 bg-[#1C303D] hover:bg-[#1c3c52] text-white rounded-full px-5 py-2 text-xs font-medium ring-1 ring-white/15 transition-colors">
          Change Plan
        </button>
      </div>
    </div>
  );

    
}

export default CurrentPlan; 