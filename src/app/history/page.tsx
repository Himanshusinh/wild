'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MainLayout from '../view/Generation/Core/MainLayout';
import { ViewType, GenerationType } from '@/types/generation';

const HistoryPage = () => {
  const onViewChange = (_view: ViewType) => {};
  const onGenerationTypeChange = (_type: GenerationType) => {};
  return (
    <ProtectedRoute>
      <MainLayout 
        onViewChange={onViewChange}
        onGenerationTypeChange={onGenerationTypeChange}
        currentView={'history'}
        currentGenerationType={'text-to-image'}
      />
    </ProtectedRoute>
  );
};

export default HistoryPage;
