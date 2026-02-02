'use client';

import React, { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setCurrentView, setCurrentGenerationType } from '@/store/slices/uiSlice';
import { ViewType, GenerationType } from '@/types/generation';
import MainLayout from '@/app/view/Generation/Core/MainLayout';

const TextToImageEditImagePage = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setCurrentView('generation'));
    dispatch(setCurrentGenerationType('text-to-image'));
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
    <div className="relative">
      <MainLayout
        onViewChange={onViewChange}
        onGenerationTypeChange={onGenerationTypeChange}
        currentView="generation"
        currentGenerationType="text-to-image"
      />
    </div>
  );
};

export default TextToImageEditImagePage;
