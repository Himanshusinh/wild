'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentView } from '@/store/slices/uiSlice';
import Nav from '../../Core/Nav';
import SidePannelFeatures from '../../Core/SidePannelFeatures';
import TextToMusicComponent from './compo/TextToMusic';
import NotificationToast from '@/components/ui/NotificationToast';

const TextToMusic = () => {
  const dispatch = useAppDispatch();
  const currentView = useAppSelector((state: any) => state.ui?.currentView || 'generation');

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
        <TextToMusicComponent />
      </div>
      <NotificationToast />
    </div>
  );
};

export default TextToMusic;