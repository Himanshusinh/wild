'use client';

import React from 'react';
import MainLayout from '../view/Generation/Core/MainLayout';
import { ViewType, GenerationType } from '@/types/generation';

const HistoryPage = () => {
  const onViewChange = (_view: ViewType) => {};
  const onGenerationTypeChange = (_type: GenerationType) => {};
  return (
    <MainLayout 
      onViewChange={onViewChange}
      onGenerationTypeChange={onGenerationTypeChange}
      currentView={'history'}
      currentGenerationType={'text-to-image'}
    />
  );
};

export default HistoryPage;
