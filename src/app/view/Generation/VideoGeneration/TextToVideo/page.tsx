'use client';

import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentView } from '@/store/slices/uiSlice';
import { setSelectedModel, setFrameSize, setStyle } from '@/store/slices/generationSlice';
import Nav from '../../Core/Nav';
import SidePannelFeatures from '../../Core/SidePannelFeatures';
import TextToVideoComponent from './compo/TextToVideo';
import NotificationToast from '@/components/ui/NotificationToast';

const TextToVideo = () => {
  const dispatch = useAppDispatch();
  const currentView = useAppSelector((state: any) => state.ui?.currentView || 'text-to-video');

  const handleViewChange = (view: 'text-to-image' | 'logo-generation' | 'sticker-generation' | 'text-to-video' | 'history' | 'bookmarks') => {
    dispatch(setCurrentView(view));
  };

  // Ensure sensible defaults for video generation models/settings on mount
  useEffect(() => {
    dispatch(setSelectedModel('MiniMax-Hailuo-02'));
    dispatch(setFrameSize('1080p'));
    dispatch(setStyle('6s'));
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-black">
      <Nav />
      <SidePannelFeatures
        currentView={currentView as any}
        onViewChange={handleViewChange as any}
      />
      <div className="ml-[68px] pt-[62px]">
        <TextToVideoComponent />
      </div>
      <NotificationToast />
    </div>
  );
};

export default TextToVideo;