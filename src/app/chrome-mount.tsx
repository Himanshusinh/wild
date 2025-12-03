'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import Nav from './view/Generation/Core/Nav';
import SidePannelFeatures from './view/Generation/Core/SidePannelFeatures';
import { registerBrowserPushToken, attachForegroundMessageListener } from '@/lib/messaging';

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
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [isVideoEditorOpen, setIsVideoEditorOpen] = useState(false);

  // Check authentication status
  useEffect(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const u = JSON.parse(userStr);
        const authed = !!u?.uid;
        console.log('[ChromeMount] user loaded from localStorage, uid:', u?.uid, 'isAuthenticated:', authed);
        setIsAuthenticated(authed);
      } else {
        console.log('[ChromeMount] no user in localStorage, treating as unauthenticated');
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('[ChromeMount] error reading user from localStorage', err);
      setIsAuthenticated(false);
    }
  }, [pathname]); // Re-check when pathname changes

  // Once authenticated in the browser, decide whether to show the notification permission prompt.
  useEffect(() => {
    console.log('[ChromeMount] isAuthenticated changed:', isAuthenticated);
    if (!isAuthenticated) {
      setShowNotifPrompt(false);
      return;
    }

    if (typeof window === 'undefined') return;

    // If permission already handled, don't show our custom prompt
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return;
    }

    const seen = window.localStorage.getItem('notif_prompt_seen');
    if (!seen) {
      setShowNotifPrompt(true);
    }
  }, [isAuthenticated]);

  // Foreground FCM notifications: show a notification even when tab is active
  useEffect(() => {
    if (typeof window === 'undefined') return;

    attachForegroundMessageListener((payload: any) => {
      console.log('[FCM] foreground message received', payload);

      const title = payload?.notification?.title || 'WildMind';
      const body = payload?.notification?.body || '';

      try {
        // If the user already granted permission, show a Notification while in foreground
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      } catch (err) {
        console.warn('[FCM] Failed to show foreground Notification', err);
      }
    });
  }, []);

  const handleEnableNotifications = async () => {
    try {
      setShowNotifPrompt(false);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('notif_prompt_seen', 'true');
      }
      await registerBrowserPushToken();
    } catch (err) {
      console.error('[ChromeMount] handleEnableNotifications error', err);
    }
  };

  const handleSkipNotifications = () => {
    setShowNotifPrompt(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('notif_prompt_seen', 'true');
    }
  };

  const pathnameLower = pathname?.toLowerCase() || '';
  const isRoot = pathname === '/' || pathname === '' || pathname == null;
  
  // Public routes - hide chrome on these
  const isLandingRoute = pathnameLower.startsWith('/view/landingpage');
  const isSignupRoute = pathnameLower.startsWith('/view/signup') || pathnameLower.startsWith('/view/signin');
  const isForgotPasswordRoute = pathnameLower.startsWith('/view/forgot-password');
  const isPricingRoute = pathnameLower.startsWith('/view/pricing');
  const isWorkflowsRoute = pathnameLower.startsWith('/view/workflows');
  const isArtStationRoute = pathnameLower.startsWith('/view/artstation');
  const isLegalRoute = pathnameLower.startsWith('/legal/');
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
          {!isVideoEditorOpen && <SidePannelFeatures />}
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
  
  // Check if video editor is open (via body data attribute)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const checkVideoEditor = () => {
        setIsVideoEditorOpen(document.body.hasAttribute('data-video-editor-open'));
      };
      checkVideoEditor();
      // Watch for changes
      const observer = new MutationObserver(checkVideoEditor);
      observer.observe(document.body, { attributes: true, attributeFilter: ['data-video-editor-open'] });
      return () => observer.disconnect();
    }
  }, []);

  // If should show, render chrome (but hide sidebar if video editor is open)
  if (shouldShow) {
    return (
      <>
        <Nav />
        {!isVideoEditorOpen && <SidePannelFeatures />}

        {/* In-app notification permission prompt (generic activity copy) */}
        {showNotifPrompt && (
          <div className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-xl bg-[#05050a]/95 border border-white/15 p-4 shadow-2xl backdrop-blur-md">
            <div className="text-sm font-semibold text-white mb-1">
              Enable WildMind notifications?
            </div>
            <div className="text-xs text-white/75 mb-3">
              Get notified instantly when there&apos;s new activity on your generations.
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleSkipNotifications}
                className="px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-white/10 text-white/80"
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="px-3.5 py-1.5 rounded-full text-xs bg-white text-black hover:bg-white/90"
              >
                Enable
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
  
  // Default: don't show (for other pages not explicitly listed)
  return null;
}
