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

export default function MainLayout() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const currentView = useAppSelector((state: any) => state.ui?.currentView || 'generation');
  const currentGenerationType = useAppSelector((state: any) => state.ui?.currentGenerationType || 'text-to-image');

  // Sync URL with state on initial load and route changes
  useEffect(() => {
    if (!pathname) return;

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
  }, [pathname, dispatch, currentGenerationType]);

  // Removed debug logging for cleaner console

  const handleViewChange = (view: ViewType) => {
    if (view === currentView) return; // Prevent unnecessary updates
    
    // Clear generation state when switching away from generation view
    if (currentView === 'generation') {
      dispatch(clearGenerationState());
    }
    
    dispatch(setCurrentView(view));
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
  };

  const handleGenerationTypeChange = (type: GenerationType) => {
    if (type === currentGenerationType && currentView === 'generation') return;
    
    // Only clear generation state when switching to a DIFFERENT generation type
    if (type !== currentGenerationType) {
      dispatch(clearGenerationState());
    }
    
    dispatch(setCurrentGenerationType(type));
    dispatch(setCurrentView('generation'));
    router.push(`/${type}`);
  };

  return (
    <div className="min-h-screen bg-black">
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
