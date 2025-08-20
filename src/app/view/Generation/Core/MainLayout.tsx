'use client';

import React from 'react';
import Nav from './Nav';
import SidePannelFeatures from './SidePannelFeatures';
import PageRouter from './PageRouter';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentView } from '@/store/slices/uiSlice';
import NotificationToast from '@/components/ui/NotificationToast';

const MainLayout = () => {
  const dispatch = useAppDispatch();
  const currentView = useAppSelector((state: any) => state.ui?.currentView || 'generation');

  // Debug: Log Redux state (remove in production)
  React.useEffect(() => {
    console.log('Redux state initialized:', { currentView });
  }, [currentView]);

  const handleViewChange = (view: 'generation' | 'history' | 'bookmarks') => {
    dispatch(setCurrentView(view));
  };

  return (
    <div className="min-h-screen bg-black">
      <Nav />
      <SidePannelFeatures
        currentView={currentView}
        onViewChange={handleViewChange}
      />
      <div className="ml-[68px] pt-[62px]">
        <PageRouter />
      </div>
      <NotificationToast />
    </div>
  );
};

export default MainLayout;
