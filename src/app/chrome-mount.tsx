'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import Nav from './view/Generation/Core/Nav';
import SidePannelFeatures from './view/Generation/Core/SidePannelFeatures';

/**
 * Conditionally renders the global chrome (navbar + side panel)
 * - Hidden on: root path, landing pages, signup page, public pages (pricing, workflows, legal, product, company)
 * - Visible on: authenticated pages only (home page, generation pages, history, bookmarks, account management)
 * - For ArtStation: Show chrome only when user is authenticated
 */
export default function ChromeMount() {
  const pathname = usePathname();
  const currentView = useAppSelector((state: any) => state?.ui?.currentView || 'home');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication status
  useEffect(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const u = JSON.parse(userStr);
        setIsAuthenticated(!!u?.uid);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, [pathname]); // Re-check when pathname changes

  const pathnameLower = pathname?.toLowerCase() || '';
  const isRoot = pathname === '/' || pathname === '' || pathname == null;
  
  // Public routes - hide chrome on these
  const isLandingRoute = pathnameLower.startsWith('/view/landingpage');
  const isSignupRoute = pathnameLower.startsWith('/view/signup') || pathnameLower.startsWith('/view/signin');
  const isForgotPasswordRoute = pathnameLower.startsWith('/view/forgot-password');
  const isPricingRoute = pathnameLower.startsWith('/view/pricing');
  const isWorkflowsRoute = pathnameLower.startsWith('/view/workflows');
  const isArtStationRoute = pathnameLower.startsWith('/view/artstation');
  const isLegalRoute = pathnameLower.startsWith('/legal/') || pathnameLower.startsWith('/view/legal');
  const isProductRoute = pathnameLower.startsWith('/product/');
  const isCompanyRoute = pathnameLower.startsWith('/company/');
  
  // Authenticated routes - show chrome on these
  const isHistoryRoute = pathnameLower.startsWith('/history');
  const isBookmarksRoute = pathnameLower.startsWith('/bookmarks');
  const isAccountRoute = pathnameLower.startsWith('/view/account-management');
  
  // Generation routes (all the generation type routes) - authenticated
  const generationRoutes = [
    'text-to-image',
    'image-to-image',
    'logo',
    'sticker-generation',
    'text-to-video',
    'image-to-video',
    'text-to-music',
    'mockup-generation',
    'product-generation',
    'ad-generation',
    'live-chat',
    'edit-image',
    'edit-video'
  ];
  
  const isGenerationRoute = generationRoutes.some(route => 
    pathnameLower === `/${route}` || 
    pathnameLower.startsWith(`/${route}/`)
  );
  
  // Home page route - authenticated (actual route is /view/HomePage with capital H and P)
  const isHomeRoute = pathnameLower.startsWith('/view/homepage');
  const isEditImageRoute = pathnameLower.startsWith('/view/editimage');
  const isEditVideoRoute = pathnameLower.startsWith('/view/editvideo');
  
  // For ArtStation: hide chrome if not authenticated, show if authenticated
  if (isArtStationRoute) {
    if (isAuthenticated) {
      return (
        <>
          <Nav />
          <SidePannelFeatures />
        </>
      );
    }
    return null; // Hide chrome when not authenticated
  }
  
  // Hide chrome on all other public pages
  const shouldHide = isRoot ||
                     isLandingRoute || 
                     isSignupRoute ||
                     isForgotPasswordRoute ||
                     isPricingRoute ||
                     isWorkflowsRoute ||
                     isLegalRoute ||
                     isProductRoute ||
                     isCompanyRoute ||
                     (isRoot && currentView === 'landing');

  // If should hide, return null immediately
  if (shouldHide) return null;
  
  // Show chrome only on authenticated pages
  const shouldShow = isHomeRoute || 
                     currentView === 'home' ||
                     isGenerationRoute || 
                     currentView === 'generation' || 
                     isHistoryRoute ||
                     currentView === 'history' ||
                     isBookmarksRoute ||
                     isAccountRoute ||
                     isEditImageRoute ||
                     isEditVideoRoute;
  
  // If should show, render chrome
  if (shouldShow) {
    return (
      <>
        <Nav />
        <SidePannelFeatures />
      </>
    );
  }
  
  // Default: don't show (for other pages not explicitly listed)
  return null;
}
