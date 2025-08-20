'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentView } from '@/store/slices/uiSlice';
import Nav from './Nav';
import SidePannelFeatures from './SidePannelFeatures';
import TextToImage from '../ImageGeneration/TextToImage/TextToImage';
import LogoGenerationComponent from '../ImageGeneration/LogoGeneration/compo/LogoGeneration';
import StickerGenerationComponent from '../ImageGeneration/StickerGeneration/compo/StickerGeneration';
import TextToVideoComponent from '../VideoGeneration/TextToVideo/compo/TextToVideo';
import TextToMusicComponent from '../MusicGeneration/TextToMusic/compo/TextToMusic';
import History from './History';
import Bookmarks from './Bookmarks';
import NotificationToast from '@/components/ui/NotificationToast';

const AppRouter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const currentView = useAppSelector((state: any) => state.ui?.currentView || 'generation');
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');

  // Sync URL with Redux state
  useEffect(() => {
    const pathToView: { [key: string]: string } = {
      '/': 'generation',
      '/text-to-image': 'generation',
      '/logo-generation': 'generation',
      '/sticker-generation': 'generation',
      '/text-to-video': 'generation',
      '/text-to-music': 'generation',
      '/history': 'history',
      '/bookmarks': 'bookmarks'
    };

    const viewFromPath = pathToView[pathname] || 'generation';
    if (currentView !== viewFromPath) {
      dispatch(setCurrentView(viewFromPath as any));
    }
  }, [pathname, currentView, dispatch]);

  const handleViewChange = (view: 'generation' | 'history' | 'bookmarks') => {
    dispatch(setCurrentView(view));

    // Update URL
    const viewToPath: { [key: string]: string } = {
      'generation': pathname.startsWith('/text-to-image') || pathname.startsWith('/logo-generation') || pathname.startsWith('/sticker-generation') || pathname.startsWith('/text-to-video') || pathname.startsWith('/text-to-music') || pathname === '/' ? pathname : '/text-to-image',
      'history': '/history',
      'bookmarks': '/bookmarks'
    };

    const newPath = viewToPath[view] || '/text-to-image';
    if (pathname !== newPath) {
      router.push(newPath);
    }
  };

  const renderContent = () => {
    // If we're on history or bookmarks page, show those
    if (currentView === 'history') {
      return <History />;
    }
    if (currentView === 'bookmarks') {
      return <Bookmarks />;
    }

    // Otherwise, show the appropriate InputBox based on URL
    switch (pathname) {
      case '/logo-generation':
        return (
          <div className="relative min-h-screen">
            <LogoGenerationComponent />
          </div>
        );
      case '/sticker-generation':
        return (
          <div className="relative min-h-screen">
            <StickerGenerationComponent />
          </div>
        );
      case '/text-to-video':
        return (
          <div className="relative min-h-screen">
            <TextToVideoComponent />
          </div>
        );
      case '/text-to-music':
        return (
          <div className="relative min-h-screen">
            <TextToMusicComponent />
          </div>
        );
      case '/text-to-image':
      case '/':
      default:
        return <TextToImage />;
    }
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff'
      }}
    >
      <Nav />
      <SidePannelFeatures
        currentView={currentView as any}
        onViewChange={handleViewChange as any}
      />
      <div className="ml-[68px] pt-[62px]">
        {renderContent()}
      </div>
      <NotificationToast />
    </div>
  );
};

export default AppRouter;
