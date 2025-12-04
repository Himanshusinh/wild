'use client';

import React, { useState } from 'react';
import MainLayout from '@/app/view/Generation/Core/MainLayout';
import { ViewType, GenerationType } from '@/types/generation';

const EditImagePage = () => {
  const [currentView, setCurrentView] = useState<ViewType>('generation');
  const [currentGenerationType, setCurrentGenerationType] = useState<GenerationType>('edit-image');

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
    </div>
  );
};

export default EditImagePage;
