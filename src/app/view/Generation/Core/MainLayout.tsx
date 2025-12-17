'use client';

import React, { useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentView, setCurrentGenerationType } from '@/store/slices/uiSlice';
import { clearGenerationState } from '@/store/slices/generationSlice';
// Nav and SidePannelFeatures are now rendered in the root layout to remain persistent across route changes
import PageRouter from './PageRouter';
import NotificationToast from '@/components/ui/NotificationToast';
import { ViewType, GenerationType } from '@/types/generation';
import { useGenerationHydration } from '@/hooks/useGenerationHydration';
import ActiveGenerationsPanel from '../ImageGeneration/TextToImage/compo/ActiveGenerationsPanel';

interface MainLayoutProps {
  onViewChange: (view: ViewType) => void;
  onGenerationTypeChange: (type: GenerationType) => void;
  currentView: ViewType;
  currentGenerationType: GenerationType;
}

export default function MainLayout({ 
  onViewChange = () => {}, 
  onGenerationTypeChange = () => {}, 
  currentView: propCurrentView, 
  currentGenerationType: propCurrentGenerationType 
}: MainLayoutProps) {
  console.log('🔍 MainLayout - COMPONENT IS RENDERING!');
  console.log('🔍 MainLayout - Props received:', { propCurrentView, propCurrentGenerationType });

  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [showWildmindSkitPopup, setShowWildmindSkitPopup] = React.useState(false);
  
  // Hydrate generations from localStorage on mount
  useGenerationHydration();
  
  // Use props from parent component (main App)
  const currentView = propCurrentView;
  const currentGenerationType = propCurrentGenerationType;

  // When this layout is used with explicit props (like /history route),
  // sync the Redux UI state so PageRouter uses the correct view/type.
  useEffect(() => {
    if (propCurrentView) {
      dispatch(setCurrentView(propCurrentView));
    }
    if (propCurrentGenerationType) {
      dispatch(setCurrentGenerationType(propCurrentGenerationType));
    }
  }, [dispatch, propCurrentView, propCurrentGenerationType]);

  // Sync URL with state on initial load and route changes
  // Only run this logic when MainLayout is the main component (not when used as child)
  useEffect(() => {
    if (!pathname || propCurrentView) return; // Skip if we're being used as a child component

    // Respect explicit landing navigation from side panel/logo
    if (pathname.includes('/view/Landingpage')) {
      try { console.log('🔍 MainLayout - Respecting landing route. Setting currentView=landing and skipping generation sync.') } catch {}
      dispatch(setCurrentView('landing'));
      return;
    }

    if (pathname.includes('/history')) {
      dispatch(setCurrentView('history'));
    } else if (pathname.includes('/bookmarks')) {
      dispatch(setCurrentView('bookmarks'));
    } else if (
      pathname.startsWith('/text-to-image') ||
      pathname.startsWith('/text-to-video') ||
      pathname.startsWith('/text-to-music') ||
      pathname.startsWith('/edit-image')
    ) {
      dispatch(setCurrentView('generation'));
      // Extract generation type from URL
      const type = pathname.split('/').pop();
      if (type && type !== 'generation') {
        const newType = type as GenerationType;
        // PRESERVE STATE: Don't clear generation state when navigating between generation types
        // This allows users to keep their inputs and configurations when switching pages
        dispatch(setCurrentGenerationType(newType));
      }
    } else {
      // Default to landing for any other non-generation routes
      try { console.log('🔍 MainLayout - Non-generation route detected, setting currentView=landing:', pathname) } catch {}
      dispatch(setCurrentView('landing'));
    }
  }, [pathname, dispatch, currentGenerationType, propCurrentView]);

  // Removed debug logging for cleaner console

  const handleViewChange = (view: ViewType) => {
    console.log('🔍 MainLayout - handleViewChange called with:', view, 'current view was:', currentView);
    try {
      if (view === currentView) return; // Prevent unnecessary updates
      
      // PRESERVE STATE: Only clear generation state when switching to non-generation views (history, landing, etc.)
      // Don't clear when navigating between generation types
      // Check this BEFORE early returns so TypeScript doesn't narrow the type
      if (currentView === 'generation' && (view === 'history' || view === 'bookmarks' || view === 'landing' || view === 'home')) {
        dispatch(clearGenerationState());
      }
      
      // Handle new view types - these should go to the main App component
      if (view === 'landing' || view === 'home') {
        console.log('🔍 MainLayout - Redirecting to main App for view:', view);
        if (onViewChange && typeof onViewChange === 'function') {
          console.log('🔍 MainLayout - Calling onViewChange with:', view);
          onViewChange(view);
        } else {
          console.warn('🔍 MainLayout - onViewChange is not available or not a function');
        }
        return;
      }
    
      // For other views, handle routing and let parent App handle Redux updates
      if (onViewChange && typeof onViewChange === 'function') {
        onViewChange(view);
      }
      
      // Handle routing for generation-related views
      switch (view) {
        case 'history':
          router.push('/history');
          break;
        case 'bookmarks':
          router.push('/bookmarks');
          break;
        default:
          router.push(`/${currentGenerationType}`);
      }
    } catch (error) {
      console.error('Error in handleViewChange:', error);
    }
  };

  const handleGenerationTypeChange = (type: GenerationType) => {
    try {
      if (type === currentGenerationType && currentView === 'generation') return;
      
      // Call the prop function to handle navigation and Redux updates
      if (onGenerationTypeChange && typeof onGenerationTypeChange === 'function') {
        onGenerationTypeChange(type);
      }
      
      // PRESERVE STATE: Don't clear generation state when switching between generation types
      // This preserves all user inputs and configurations across navigation
      
      // Handle routing
      router.push(`/${type}`);
    } catch (error) {
      console.error('Error in handleGenerationTypeChange:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B]">
      {/* DEBUG: This is MainLayout component */}
      
      
      <div className="md:ml-[68px] ml-0 pt-[62px]">
        <Suspense fallback={null}>
          {/* Let PageRouter read from Redux; MainLayout already syncs UI state */}
          <PageRouter />
        </Suspense>
      </div>
      <NotificationToast />
      
      {/* Active Generations Panel - Fixed position overlay */}
      <ActiveGenerationsPanel />
      
      {/* Wildmind Skit Popup */}
      {showWildmindSkitPopup && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
            onClick={() => setShowWildmindSkitPopup(false)}
          >
            {/* Popup Content */}
            <div 
              className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-[90vw] max-w-4xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-white text-3xl font-bold">Choose Style</h2>
                <button 
                  onClick={() => setShowWildmindSkitPopup(false)}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Video Ads - Currently Available */}
                <div 
                  onClick={() => {
                    handleGenerationTypeChange('ad-generation');
                    setShowWildmindSkitPopup(false);
                  }}
                  className="relative group cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 h-48 flex flex-col items-center justify-center text-center transition-transform group-hover:scale-105">
                    <div className="absolute top-4 right-4">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div className="text-4xl mb-4">📹</div>
                  </div>
                  <h3 className="text-white text-lg font-semibold mt-4">Video Ads</h3>
                </div>

                {/* Jewelry - Coming Soon */}
                <div className="relative group cursor-not-allowed opacity-60">
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-8 h-48 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4">💎</div>
                  </div>
                  <h3 className="text-white text-lg font-semibold mt-4">Jewelry</h3>
                  <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-semibold">Soon</span>
                </div>

                {/* Live Chat - Available */}
                <div 
                  onClick={() => {
                    router.push('/view/Generation/wildmindskit/LiveChat');
                    setShowWildmindSkitPopup(false);
                  }}
                  className="relative group cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl p-8 h-48 flex flex-col items-center justify-center text-center transition-transform group-hover:scale-105">
                    <div className="absolute top-4 right-4">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div className="text-4xl mb-4">💬</div>
                  </div>
                  <h3 className="text-white text-lg font-semibold mt-4">Live Chat</h3>
                </div>

                {/* Virtual Try-On - Coming Soon */}
                <div className="relative group cursor-not-allowed opacity-60">
                  <div className="bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl p-8 h-48 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4">👗</div>
                  </div>
                  <h3 className="text-white text-lg font-semibold mt-4">Virtual Try-On</h3>
                  <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-semibold">Soon</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
