'use client';

import React, { Suspense, useEffect } from 'react';
import MainLayout from '@/app/view/Generation/Core/MainLayout';
import EditImageInterface from '../compo/EditImageInterface';
import { ViewType, GenerationType } from '@/types/generation';

const EditImageFillPage = () => {
  const [currentView, setCurrentView] = React.useState<ViewType>('generation');
  const [currentGenerationType, setCurrentGenerationType] = React.useState<GenerationType>('edit-image');

  useEffect(() => {
    // Ensure URL reflects fill feature for tab auto-select
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('feature') !== 'fill') {
        url.searchParams.set('feature', 'fill');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  const onViewChange = (view: ViewType) => {
    setCurrentView(view);
    if (view === 'landing') {
      localStorage.removeItem('wild-mind-visited');
    } else {
      localStorage.setItem('wild-mind-visited', 'true');
    }
  };

  const onGenerationTypeChange = (type: GenerationType) => {
    setCurrentGenerationType(type);
    setCurrentView('generation');
  };

  return (
    <div className="relative">
      <MainLayout
        onViewChange={onViewChange}
        onGenerationTypeChange={onGenerationTypeChange}
        currentView={currentView}
        currentGenerationType={currentGenerationType}
      />
      <Suspense fallback={<div className="p-4 text-white/70">Loading fill editor…</div>}>
        <EditImageInterface />
      </Suspense>
    </div>
  );
};

export default EditImageFillPage;


