'use client';

import React, { useState, Suspense } from 'react';
import MainLayout from '@/app/view/Generation/Core/MainLayout';
import EditVideoInterface from './compo/EditVideoInterface';
import { ViewType, GenerationType } from '@/types/generation';

const EditVideoPage = () => {
  const [currentView, setCurrentView] = useState<ViewType>('generation');
  const [currentGenerationType, setCurrentGenerationType] = useState<GenerationType>('edit-video');

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
      <Suspense fallback={<div className="p-4 text-white/70">Loading video editor…</div>}>
        <EditVideoInterface />
      </Suspense>
    </div>
  );
};

export default EditVideoPage;

