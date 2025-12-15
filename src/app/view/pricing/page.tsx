'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Image as ImageIcon, Video, ArrowUpRight, Sparkles } from 'lucide-react';
import FooterNew from '../core/FooterNew';

const PricingPage: React.FC = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [trialStartDate, setTrialStartDate] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Check authentication status and fetch plan
  useEffect(() => {
    const checkAuthAndFetchPlan = async () => {
      try {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (userStr) {
          const u = JSON.parse(userStr);
          setIsAuthenticated(!!u?.uid);
          if (u?.uid) {
            try {
              const { getApiClient } = await import('@/lib/axiosInstance');
              const api = getApiClient();
              const response = await api.get('/api/credits/me');
              const creditsData = response.data?.data || response.data;

              if (creditsData) {
                const planCode = creditsData.planCode || 'FREE';
                setUserPlan(planCode);

                if (planCode === 'LAUNCH_4000_FIXED' && creditsData.launchTrialStartDate) {
                  let startDate: Date;

                  if (creditsData.launchTrialStartDate.toDate) {
                    startDate = creditsData.launchTrialStartDate.toDate();
                  } else if (creditsData.launchTrialStartDate._seconds) {
                    startDate = new Date(
                      creditsData.launchTrialStartDate._seconds * 1000 +
                        (creditsData.launchTrialStartDate._nanoseconds || 0) / 1000000
                    );
                  } else if (typeof creditsData.launchTrialStartDate === 'string') {
                    startDate = new Date(creditsData.launchTrialStartDate);
                  } else if (typeof creditsData.launchTrialStartDate === 'number') {
                    startDate = new Date(creditsData.launchTrialStartDate * 1000);
                  } else {
                    startDate = new Date(creditsData.launchTrialStartDate);
                  }

                  setTrialStartDate(startDate);

                  const now = new Date();
                  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const remaining = Math.max(0, 15 - daysSinceStart);
                  setDaysRemaining(remaining);
                }
              }
            } catch (error) {
              console.error('Failed to fetch plan info:', error);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      }
    };

    checkAuthAndFetchPlan();
  }, []);

  // Countdown timer for trial end
  useEffect(() => {
    if (!trialStartDate) return;

    const cutoffDate = new Date('2025-12-18T23:59:59.999Z');
    const trialEndDate15Days = new Date(trialStartDate);
    trialEndDate15Days.setDate(trialEndDate15Days.getDate() + 15);

    const trialEndDate = trialEndDate15Days.getTime() <= cutoffDate.getTime()
      ? trialEndDate15Days
      : cutoffDate;

    const updateTimeRemaining = () => {
      const now = new Date();
      const diff = trialEndDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [trialStartDate]);

  return (
    <div
      className={`min-h-screen bg-[#07070B] text-white font-sans selection:bg-[#60a5fa] selection:text-white overflow-x-hidden ${
        isAuthenticated ? 'md:ml-[68px]' : ''
      }`}
    >
      {/* --- Ambient Background Effects (WildCanvas Theme) --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(96, 165, 250, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 165, 250, 0.03) 1px, transparent 1px)",
            backgroundSize: '100px 100px'
          }}
        ></div>
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/[0.05] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/[0.05] rounded-full blur-[100px]" />
      </div>

      {/* --- Hero Section --- */}
      <div className="relative z-10  md:pt-24 pb-12 px-6 text-center animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className="inline-flex items-center gap-2 border border-[#60a5fa]/30 bg-[#60a5fa]/10 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest text-[#60a5fa] mb-8 shadow-[0_0_10px_rgba(96,165,250,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse"></span>
          Generate unlimited images from z image turbo
        </div>

        <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-white mb-6 leading-[0.95]">
          Launching Offer<br />
          <span className="bg-gradient-to-r from-[#60a5fa] to-white bg-clip-text text-transparent">15 Days Free</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Get <span className="text-[#60a5fa] font-bold">4,000 credits</span>  for 15 days. 
          Create <span className="text-white font-semibold">unlimited images &</span> <span className="text-white font-semibold">20 videos</span>, absolutely free.
        </p>

        {/* Launching Offer Banner - 15 Days Free */}
        <div className="max-w-5xl mx-auto mb-20 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#60a5fa]/20 via-[#3b82f6]/20 to-[#8b5cf6]/20 rounded-3xl blur-2xl opacity-60 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#60a5fa]/10 to-transparent rounded-3xl"></div>
          
          <div className="relative bg-gradient-to-br from-[#0A0A0A] via-[#0F1115] to-[#0A0A0A] border-2 border-[#60a5fa]/40 rounded-3xl p-8 md:p-12 overflow-hidden shadow-[0_0_60px_rgba(96,165,250,0.3)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#60a5fa]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8b5cf6]/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#60a5fa]/20 border border-[#60a5fa]/40 rounded-full mb-6">
                <Sparkles size={16} className="text-[#60a5fa]" />
                <span className="text-[#60a5fa] text-xs font-bold uppercase tracking-widest">Launching Offer</span>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                    <span className="bg-gradient-to-r from-white to-[#60a5fa] bg-clip-text text-transparent">
                     Free
                    </span>
                   
                    <span className="text-xl md:text-4xl text-slate-300"> for 15 days</span>
                  </h2>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <div className="p-2 bg-[#60a5fa]/20 rounded-lg">
                        <Zap size={20} className="text-[#60a5fa]" fill="currentColor" />
                      </div>
                      <div>
                        <div className="text-2xl md:text-3xl font-bold text-white">
                          <span className="text-[#60a5fa]">4,000</span> Credits
                        </div>
                        <p className="text-slate-400 text-sm">Free for 15 days</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6 pt-6 border-t border-white/10">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                        <ImageIcon size={18} className="text-[#60a5fa]" />
                        <span className="text-white font-semibold">Unlimited Images</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                        <Video size={18} className="text-[#60a5fa]" />
                        <span className="text-white font-semibold">20 Videos</span>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-400 text-center md:text-left">
                    Other models available at their credit cost
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isAuthenticated && userPlan === 'LAUNCH_4000_FIXED' ? (
                    <div className="text-center">
                      <div className="px-8 py-4 bg-gradient-to-r from-[#60a5fa]/20 to-[#3b82f6]/20 border-2 border-[#60a5fa]/40 text-white font-bold rounded-full flex items-center justify-center gap-2">
                        <Check size={20} className="text-[#60a5fa]" />
                        <span>You're already in free trial</span>
                      </div>
                      {timeRemaining === null ? (
                        <div className="mt-3 h-16 flex items-center justify-center">
                          <div className="text-xs text-slate-500">Loading...</div>
                        </div>
                      ) : timeRemaining.days > 0 || timeRemaining.hours > 0 || timeRemaining.minutes > 0 || timeRemaining.seconds > 0 ? (
                        <div className="mt-4 space-y-2">
                          <p className="text-center text-xs text-slate-400 uppercase tracking-wider">
                            Your free trial ends in
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            {timeRemaining.days > 0 && (
                              <div className="flex flex-col items-center px-3 py-2 bg-[#0A0A0A] border border-[#60a5fa]/30 rounded-lg">
                                <span className="text-2xl font-bold text-[#60a5fa] tabular-nums">
                                  {String(timeRemaining.days).padStart(2, '0')}
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                  {timeRemaining.days === 1 ? 'Day' : 'Days'}
                                </span>
                              </div>
                            )}
                            <div className="flex flex-col items-center px-3 py-2 bg-[#0A0A0A] border border-[#60a5fa]/30 rounded-lg">
                              <span className="text-2xl font-bold text-[#60a5fa] tabular-nums">
                                {String(timeRemaining.hours).padStart(2, '0')}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Hours</span>
                            </div>
                            <div className="flex flex-col items-center px-3 py-2 bg-[#0A0A0A] border border-[#60a5fa]/30 rounded-lg">
                              <span className="text-2xl font-bold text-[#60a5fa] tabular-nums">
                                {String(timeRemaining.minutes).padStart(2, '0')}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Minutes</span>
                            </div>
                            <div className="flex flex-col items-center px-3 py-2 bg-[#0A0A0A] border border-[#60a5fa]/30 rounded-lg">
                              <span className="text-2xl font-bold text-[#60a5fa] tabular-nums">
                                {String(timeRemaining.seconds).padStart(2, '0')}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Seconds</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center mt-3 text-sm text-slate-400">
                          Your free trial has ended
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          if (isAuthenticated) {
                            router.push('/');
                          } else {
                            router.push('/view/signup');
                          }
                        }}
                        className="group relative px-8 py-4 bg-gradient-to-r from-white to-[#60a5fa] text-black font-bold rounded-full hover:from-[#60a5fa] hover:to-[#3b82f6] hover:text-white transition-all duration-300 shadow-[0_0_30px_rgba(96,165,250,0.5)] hover:shadow-[0_0_40px_rgba(96,165,250,0.8)] transform hover:scale-105 flex items-center gap-2"
                      >
                        <span>Start Free Trial</span>
                        <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                      <p className="text-center mt-3 text-xs text-slate-400">No credit card required</p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-slate-400 text-sm">
                  Limited time offer • <span className="text-[#60a5fa] font-semibold">Available for all new users</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Pricing Plans Placeholder (no plan data exposed) --- */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pb-20">
        <div className="rounded-3xl border border-[#60a5fa]/20 bg-gradient-to-br from-[#0A0A0A] via-[#0F1115] to-[#0A0A0A] p-8 md:p-12 shadow-[0_0_40px_rgba(96,165,250,0.15)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#60a5fa]/15 border border-[#60a5fa]/30 rounded-full text-xs font-bold uppercase tracking-widest text-[#60a5fa]">
                <Sparkles size={14} /> Pricing refresh in progress
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">New pricing plans are coming soon</h2>
              <p className="text-slate-400 max-w-3xl">
                We are updating our plans and will publish the full details here once finalized.
                Until then, only the free trial is available and no plan data is embedded in this page.
              </p>
            </div>
            
          </div>
          <div className="mt-6 text-xs text-slate-500">
            For security, plan definitions are no longer rendered or stored in the client bundle.
          </div>
        </div>
      </div>

      <FooterNew/>
    </div>
  );
};

export default PricingPage;
