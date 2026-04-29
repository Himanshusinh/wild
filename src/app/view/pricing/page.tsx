'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setSidebarExpanded } from '@/store/slices/uiSlice';
import { Menu } from 'lucide-react';
import FooterNew from '../core/FooterNew';
import PricingPlans from './compo/PricingPlans';
import { isUserAuthenticated } from '@/lib/axiosInstance';

const PricingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const userStr =
        typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const authToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('authToken') || localStorage.getItem('idToken')
          : null;
      const hasStoredUser = Boolean(userStr);
      const hasStoredToken = Boolean(authToken);
      const hasLiveSession = isUserAuthenticated();

      setIsAuthenticated(hasLiveSession || hasStoredToken || hasStoredUser);
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  // SidePannelFeatures is always mounted on /view/pricing (fixed w-[72px] from md+). Reserve that
  // width so content never sits under the rail; ml must match the sidebar, not 68px.
  return (
    <div
      className={
        'min-h-screen bg-[#07070B] text-white font-sans selection:bg-[#60a5fa] selection:text-white overflow-x-hidden ' +
        'md:ml-[72px] md:w-[calc(100%-72px)] md:min-w-0 md:max-w-none md:pl-3 md:pr-1 lg:pl-5 lg:pr-2 box-border'
      }
    >
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{ backgroundImage: "url('/noise.svg')" }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(96, 165, 250, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 165, 250, 0.03) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
          }}
        />
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/[0.05] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/[0.05] rounded-full blur-[100px]" />
      </div>

      <div className="md:hidden sticky top-0 z-50 bg-[#07070B]/80 backdrop-blur-md px-4 py-3 flex items-center">
        <button
          type="button"
          onClick={() => dispatch(setSidebarExpanded(true))}
          className="flex h-10 w-10 items-center justify-center shrink-0 text-white/70 hover:text-white transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      </div>

      <PricingPlans isAuthenticated={isAuthenticated} />

      <FooterNew />
    </div>
  );
};

export default PricingPage;
