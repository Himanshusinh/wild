'use client';

import React from 'react';
import Nav from './Nav';
import SidePannelFeatures from './SidePannelFeatures';
import History from './History';
import InputBox from '../ImageGeneration/TextToImage/compo/InputBox';
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

  const handleViewChange = (view: 'generation' | 'history') => {
    dispatch(setCurrentView(view));
  };

  const renderContent = () => {
    switch (currentView) {
      case 'history':
        return <History onBack={() => handleViewChange('generation')} />;
      case 'generation':
      default:
        return <InputBox />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Nav />
      <SidePannelFeatures
        currentView={currentView}
        onViewChange={handleViewChange}
      />
      <div className="ml-[68px] pt-[62px]">
        {renderContent()}
      </div>
      <NotificationToast />
    </div>
  );
};

export default MainLayout;
