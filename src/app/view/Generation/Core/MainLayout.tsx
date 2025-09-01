'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentView, setCurrentGenerationType } from '@/store/slices/uiSlice';
import { clearGenerationState } from '@/store/slices/generationSlice';
import Nav from './Nav';
import SidePannelFeatures from './SidePannelFeatures';
import PageRouter from './PageRouter';
import NotificationToast from '@/components/ui/NotificationToast';
import { ViewType, GenerationType } from '@/types/generation';

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
  // Use props from parent component (main App)
  const currentView = propCurrentView;
  const currentGenerationType = propCurrentGenerationType;

  // Sync URL with state on initial load and route changes
  // Only run this logic when MainLayout is the main component (not when used as child)
  useEffect(() => {
    if (!pathname || propCurrentView) return; // Skip if we're being used as a child component

    if (pathname.includes('/history')) {
      dispatch(setCurrentView('history'));
    } else if (pathname.includes('/bookmarks')) {
      dispatch(setCurrentView('bookmarks'));
    } else {
      dispatch(setCurrentView('generation'));
      // Extract generation type from URL
      const type = pathname.split('/').pop();
      if (type && type !== 'generation') {
        const newType = type as GenerationType;
        // Only clear generation state if switching to a DIFFERENT generation type
        if (newType !== currentGenerationType) {
          dispatch(clearGenerationState());
        }
        dispatch(setCurrentGenerationType(newType));
      }
    }
  }, [pathname, dispatch, currentGenerationType, propCurrentView]);

  // Removed debug logging for cleaner console

  const handleViewChange = (view: ViewType) => {
    console.log('🔍 MainLayout - handleViewChange called with:', view, 'current view was:', currentView);
    try {
      if (view === currentView) return; // Prevent unnecessary updates
      
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
      
      // Clear generation state when switching away from generation view
      if (currentView === 'generation') {
        dispatch(clearGenerationState());
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
      
      // Only clear generation state when switching to a DIFFERENT generation type
      if (type !== currentGenerationType) {
        dispatch(clearGenerationState());
      }
      
      // Handle routing
      router.push(`/${type}`);
    } catch (error) {
      console.error('Error in handleGenerationTypeChange:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* DEBUG: This is MainLayout component */}
      
      
      <Nav />
      <SidePannelFeatures
        currentView={currentView as ViewType}
        onViewChange={handleViewChange}
        onGenerationTypeChange={handleGenerationTypeChange}
      />
      <div className="ml-[68px] pt-[62px]">
        <PageRouter />
      </div>
      <NotificationToast />
    </div>
  );
}
