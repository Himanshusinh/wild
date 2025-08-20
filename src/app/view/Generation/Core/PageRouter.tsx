'use client';

import React from 'react';
import { useAppSelector } from '@/store/hooks';
import ImageGeneration from '../ImageGeneration/TextToImage/TextToImage';
import History from './History';
import Bookmarks from './Bookmarks';

type PageType = 'generation' | 'history' | 'bookmarks';

const PageRouter = () => {
  const currentView = useAppSelector((state: any) => state.ui?.currentView || 'generation');

  const renderPage = () => {
    switch (currentView as PageType) {
      case 'generation':
        return <ImageGeneration />;
      case 'history':
        return <History />;
      case 'bookmarks':
        return <Bookmarks />;
      default:
        return <ImageGeneration />;
    }
  };

  return (
    <div className="flex-1 relative">
      {renderPage()}
    </div>
  );
};

export default PageRouter;
