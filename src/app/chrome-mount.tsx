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

  const isRoot = pathname === '/' || pathname === '' || pathname == null;
  const isLandingRoute = pathname?.toLowerCase().startsWith('/view/landingpage');
  const isSignupRoute = pathname?.toLowerCase().startsWith('/view/signup');
  
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
    pathname?.toLowerCase() === `/${route}` || 
    pathname?.toLowerCase().startsWith(`/${route}/`)
  );
  
  const isHomeRoute = pathname?.toLowerCase().startsWith('/view/homepage');
  
  // Show sidebar/navbar on:
  // 1. Home page
  // 2. Generation routes
  // 3. When currentView is 'generation' or 'history' (handled by MainLayout)
  const shouldShow = isHomeRoute || 
                     isGenerationRoute || 
                     currentView === 'generation' || 
                     currentView === 'history';
  
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
  
  // Default: don't show (for other pages like pricing, workflows, etc.)
  return null;
}
