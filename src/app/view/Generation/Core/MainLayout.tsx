'use client';

import React from 'react';
import Nav from './Nav';
import SidePannelFeatures from './SidePannelFeatures';
import PageRouter from './PageRouter';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentView, setCurrentGenerationType } from '@/store/slices/uiSlice';
import NotificationToast from '@/components/ui/NotificationToast';
import { usePathname, useRouter } from 'next/navigation';

const MainLayout = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const currentView = useAppSelector((state: any) => state.ui?.currentView || 'generation');
  const currentGenerationType = useAppSelector((state: any) => state.ui?.currentGenerationType || 'text-to-image');

  // Debug: Log Redux state (remove in production)
  React.useEffect(() => {
    console.log('Redux state initialized:', { currentView });
  }, [currentView]);

  const handleViewChange = (view: 'generation' | 'history' | 'bookmarks') => {
    dispatch(setCurrentView(view));
    if (view === 'history') {
      router.push('/history');
      return;
    }
    if (view === 'bookmarks') {
      router.push('/bookmarks');
      return;
    }
    // For generation view, route to the current generation type
    const typeToPath: Record<string, string> = {
      'text-to-image': '/text-to-image',
      'logo-generation': '/logo-generation',
      'sticker-generation': '/sticker-generation',
      'text-to-video': '/text-to-video',
      'text-to-music': '/text-to-music',
    };
    router.push(typeToPath[currentGenerationType] || '/text-to-image');
  };

  // Handle generation type changes directly
  const handleGenerationTypeChange = (type: 'text-to-image' | 'logo-generation' | 'sticker-generation' | 'text-to-video' | 'text-to-music') => {
    dispatch(setCurrentGenerationType(type));
    dispatch(setCurrentView('generation'));
    
    const typeToPath: Record<string, string> = {
      'text-to-image': '/text-to-image',
      'logo-generation': '/logo-generation',
      'sticker-generation': '/sticker-generation',
      'text-to-video': '/text-to-video',
      'text-to-music': '/text-to-music',
    };
    router.push(typeToPath[type]);
  };

  // Sync URL -> Redux on initial mount and on route changes
  React.useEffect(() => {
    const path = pathname || '/';
    if (path === '/history') {
      dispatch(setCurrentView('history'));
      return;
    }
    if (path === '/bookmarks') {
      dispatch(setCurrentView('bookmarks'));
      return;
    }
    dispatch(setCurrentView('generation'));
    const pathToType: Record<string, any> = {
      '/': 'text-to-image',
      '/text-to-image': 'text-to-image',
      '/logo-generation': 'logo-generation',
      '/sticker-generation': 'sticker-generation',
      '/text-to-video': 'text-to-video',
      '/text-to-music': 'text-to-music',
    };
    const nextType = pathToType[path] || 'text-to-image';
    dispatch(setCurrentGenerationType(nextType));
  }, [pathname, dispatch]);

  return (
    <div className="min-h-screen bg-black">
      <Nav />
      <SidePannelFeatures
        currentView={currentView}
        onViewChange={handleViewChange}
        onGenerationTypeChange={handleGenerationTypeChange}
      />
      <div className="ml-[68px] pt-[62px]">
        <PageRouter />
      </div>
      <NotificationToast />
    </div>
  );
};

export default MainLayout;
