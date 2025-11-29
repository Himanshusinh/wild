'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const currentView = useAppSelector((state: any) => state?.ui?.currentView || 'landing');
  const currentGenerationType = useAppSelector((state: any) => state?.ui?.currentGenerationType || 'text-to-image');
  const pathname = usePathname();
  
  console.log('🔍 App - Redux state:', { currentView, currentGenerationType });
  const isFirstLoad = React.useRef(true);

  // Handle root path: Render LandingPage immediately for Razorpay verification
  // Then redirect authenticated users after page loads (but not for bots)
  useEffect(() => {
    if (pathname === '/') {
      // Check if this is a bot (Razorpay verification, crawlers, etc.)
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
      const isBot = /bot|crawler|spider|crawling|razorpay|curl|wget|python|java|php|ruby|go|scrapy|http/i.test(userAgent);
      
      // Don't redirect bots - let them see the full page content
      if (isBot) {
        console.log('🔍 App - Bot detected, not redirecting for Razorpay verification');
        return;
      }
      
      // Small delay to ensure page content is rendered first
      const timer = setTimeout(() => {
        // Check if user is authenticated
        const hasSession = document.cookie.includes('app_session=') || document.cookie.includes('app_session.sig=');
        const hasAuthHint = document.cookie.includes('auth_hint=');
        
        if (hasSession || hasAuthHint) {
          // User is authenticated, redirect to home
          router.replace('/view/HomePage');
        } else {
          // User is not authenticated, stay on root (already showing LandingPage)
          // Or redirect to /view/Landingpage for consistency
          router.replace('/view/Landingpage');
        }
      }, 500); // Delay ensures HTML is fully rendered for bots
      
      return () => clearTimeout(timer);
    }
  }, [pathname, router]);

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
    return <HomePage />;
  }
  
  // Root path: Render LandingPage immediately so Razorpay bot gets full HTML content
  if (pathname === '/') {
    console.log('🔍 App - Root path: rendering LandingPage for Razorpay verification');
    return <LandingPage />;
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
      <HomePage />
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
