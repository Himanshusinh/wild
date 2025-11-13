'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import Nav from './view/Generation/Core/Nav';
import SidePannelFeatures from './view/Generation/Core/SidePannelFeatures';

/**
 * Conditionally renders the global chrome (navbar + side panel)
 * - Hidden on the landing pages ("/" and "/view/Landingpage")
 * - Visible on the home screen, features, history, edit pages, etc.
 */
export default function ChromeMount() {
  const pathname = usePathname();
  const currentView = useAppSelector((state: any) => state?.ui?.currentView || 'home');

  const isRoot = pathname === '/' || pathname === '' || pathname == null;
  const isLandingRoute = pathname?.toLowerCase().startsWith('/view/landingpage');

  // Hide ONLY when on explicit Landingpage route OR when root path AND view is landing
  const shouldHide = isLandingRoute || (isRoot && currentView === 'landing');

  if (shouldHide) return null;

  return (
    <>
      <Nav />
      <SidePannelFeatures />
    </>
  );
}
