'use client';

import React, { useEffect } from 'react';
import MainLayout from '@/app/view/Generation/Core/MainLayout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentView, setCurrentGenerationType } from '@/store/slices/uiSlice';
import { ViewType, GenerationType } from '@/types/generation';

const TextToMusicPage = () => {
  const dispatch = useAppDispatch();
  const currentView = useAppSelector((state: any) => state?.ui?.currentView || 'generation');
  const currentGenerationType = useAppSelector((state: any) => state?.ui?.currentGenerationType || 'text-to-image');

  // Ensure Redux reflects this route on first mount/navigation
  useEffect(() => {
    dispatch(setCurrentView('generation'));
    dispatch(setCurrentGenerationType('text-to-music'));
  }, [dispatch]);

  const onViewChange = (view: ViewType) => {
    dispatch(setCurrentView(view));
    if (view === 'landing') {
      localStorage.removeItem('wild-mind-visited');
    } else {
      localStorage.setItem('wild-mind-visited', 'true');
    }
  };

  const onGenerationTypeChange = (type: GenerationType) => {
    dispatch(setCurrentGenerationType(type));
    dispatch(setCurrentView('generation'));
  };

  return (
    <MainLayout
      onViewChange={onViewChange}
      onGenerationTypeChange={onGenerationTypeChange}
      currentView={currentView}
      currentGenerationType={currentGenerationType}
    />
  );
};

export default TextToMusicPage;


