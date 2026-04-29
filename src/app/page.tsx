'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import LandingPage from './view/Landingpage/page';
import HomePage from './view/HomePage/page';
import PricingPage from './view/pricing/page';
import WorkflowsPage from './view/workflows/page';
import MainLayout from './view/Generation/Core/MainLayout';
import { ViewType, GenerationType } from '@/types/generation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentView, setCurrentGenerationType } from '@/store/slices/uiSlice';


export default function App() {
  const dispatch = useAppDispatch();
  const currentView = useAppSelector((state: any) => state?.ui?.currentView || 'landing');
  const currentGenerationType = useAppSelector((state: any) => state?.ui?.currentGenerationType || 'text-to-image');
  const pathname = usePathname();

  console.log('🔍 App - Redux state:', { currentView, currentGenerationType });
  const isFirstLoad = React.useRef(true);

  // Preserve landing when explicitly selected; don't force home on first load
  useEffect(() => {
    if (!isFirstLoad.current) return;
    isFirstLoad.current = false;
  }, [dispatch, currentView]);

  const handleViewChange = (view: ViewType) => {
    console.log('🔍 App - handleViewChange called with:', view, 'previous view was:', currentView);
    dispatch(setCurrentView(view));
    console.log('🔍 App - Dispatched setCurrentView to Redux');

    if (view === 'landing') {
      localStorage.removeItem('wild-mind-visited');
      console.log('🔍 App - Removed wild-mind-visited from localStorage');
    } else {
      localStorage.setItem('wild-mind-visited', 'true');
      console.log('🔍 App - Set wild-mind-visited in localStorage');
    }
  };

  const handleGenerationTypeChange = (type: GenerationType) => {
    console.log('🔍 App - handleGenerationTypeChange called with:', type);
    dispatch(setCurrentGenerationType(type));
    dispatch(setCurrentView('generation'));
    console.log('🔍 App - Dispatched both actions to Redux');
  };

  // Hard route-based overrides to avoid race conditions
  if (pathname?.startsWith('/view/Landingpage')) {
    console.log('🔍 App - Route override: rendering LandingPage for', pathname);
    return <LandingPage />;
  }
  if (pathname?.startsWith('/view/HomePage')) {
    console.log('🔍 App - Route override: rendering HomePage for', pathname);
    return (
      <div className="min-h-screen bg-[#0E0E12]">
        <HomePage />
      </div>
    );
  }

  // Root path: Publicly accessible - always render LandingPage
  // This ensures Razorpay verification works and the site is publicly accessible
  if (pathname === '/') {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'WildMind AI',
              url: 'https://wildmindai.com',
              logo: 'https://wildmindai.com/icons/wildmind_icon_darkbg.svg',
              description: 'AI-powered creative studio for generating images, videos, music, and designs instantly.',
            }),
          }}
        />
        <div className="min-h-screen bg-[#0E0E12]">
          <HomePage />
        </div>
      </>
    );
  }
  // Render different views based on current state
  console.log('🔍 App - Rendering decision for currentView:', currentView);
  console.log('🔍 App - currentView type:', typeof currentView);
  console.log('🔍 App - currentView value:', currentView);

  if (currentView === 'landing') {
    console.log('🔍 App - Rendering LandingPage');
    return (
      <LandingPage />
    );
  }

  if (currentView === 'home') {
    console.log('🔍 App - Rendering HomePage');
    return (
      <div className="min-h-screen bg-[#0E0E12]">
        <HomePage />
      </div>
    );
  }

  if (currentView === 'pricing') {
    console.log('🔍 App - Rendering PricingPage');
    return (
      <PricingPage />
    );
  }

  if (currentView === 'workflows') {
    console.log('🔍 App - Rendering WorkflowsPage');
    return (
      <WorkflowsPage />
    );
  }

  if (currentView === 'generation') {
    console.log('🔍 App - Rendering MainLayout');
    return (
      <MainLayout
        onViewChange={handleViewChange}
        onGenerationTypeChange={handleGenerationTypeChange}
        currentView={currentView}
        currentGenerationType={currentGenerationType}
      />
    );
  }

  console.log('🔍 App - No matching view, returning null');
  return null;
}
