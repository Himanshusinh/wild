'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import TextToImageInputBox from '../ImageGeneration/TextToImage/compo/InputBox';
import LogoGenerationInputBox from '../ImageGeneration/LogoGeneration/compo/InputBox';
import StickerGenerationInputBox from '../ImageGeneration/StickerGeneration/compo/InputBox';
import TextToVideoInputBox from '../VideoGeneration/TextToVideo/compo/InputBox';
import TextToMusicInputBox from '../MusicGeneration/TextToMusic/compo/InputBox';
import History from './History';
import Bookmarks from './Bookmarks';

type PageType = 'generation' | 'history' | 'bookmarks';

const PageRouter = () => {
  const pathname = usePathname();
  const currentView = useAppSelector((state: any) => state.ui?.currentView || 'generation');

  const renderPage = () => {
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
            <LogoGenerationInputBox />
          </div>
        );
      case '/sticker-generation':
        return (
          <div className="relative min-h-screen">
            <StickerGenerationInputBox />
          </div>
        );
      case '/text-to-video':
        return (
          <div className="relative min-h-screen">
            <TextToVideoInputBox />
          </div>
        );
      case '/text-to-music':
        return (
          <div className="relative min-h-screen">
            <TextToMusicInputBox />
          </div>
        );
      case '/text-to-image':
      case '/':
      default:
        return (
          <div className="relative min-h-screen">
            <TextToImageInputBox />
          </div>
        );
    }
  };

  return (
    <div className="flex-1 relative">
      {renderPage()}
    </div>
  );
};

export default PageRouter;
