'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import Nav from './view/Generation/Core/Nav';
import SidePannelFeatures from './view/Generation/Core/SidePannelFeatures';

/**
 * Conditionally renders the global chrome (navbar + side panel)
 * - Hidden on: landing pages, signup page
 * - Visible on: home page, generation pages, history page
 */
export default function ChromeMount() {
  const pathname = usePathname();
  const currentView = useAppSelector((state: any) => state?.ui?.currentView || 'home');

  const pathnameLower = pathname?.toLowerCase() || '';
  const isRoot = pathname === '/' || pathname === '' || pathname == null;
  const isLandingRoute = pathnameLower.startsWith('/view/landingpage');
  const isSignupRoute = pathnameLower.startsWith('/view/signup');
  
  // Generation routes (all the generation type routes)
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
  
  // Home page routes - check both pathname (case-insensitive) and currentView
  // Note: actual route is /view/HomePage (capital H and P)
  const isHomeRoute = pathnameLower.startsWith('/view/homepage') || 
                      pathnameLower === '/view/homepage' ||
                      (isRoot && currentView === 'home');
  
  // Pricing and workflows routes
  const isPricingRoute = pathnameLower.startsWith('/view/pricing');
  const isWorkflowsRoute = pathnameLower.startsWith('/view/workflows');
  
  // Show sidebar/navbar on:
  // 1. Home page (by route OR currentView === 'home')
  // 2. Generation routes
  // 3. History page (currentView === 'history')
  // 4. Pricing page
  // 5. Workflows page
  const shouldShow = isHomeRoute || 
                     currentView === 'home' ||
                     isGenerationRoute || 
                     currentView === 'generation' || 
                     currentView === 'history' ||
                     isPricingRoute ||
                     currentView === 'pricing' ||
                     isWorkflowsRoute ||
                     currentView === 'workflows';
  
  // Hide on:
  // 1. Landing page
  // 2. Signup page
  // 3. Root path when view is landing
  const shouldHide = isLandingRoute || 
                     isSignupRoute || 
                     (isRoot && currentView === 'landing');

  // If explicitly should hide, return null
  if (shouldHide) return null;
  
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
