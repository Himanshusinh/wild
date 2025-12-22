'use client';

import React from 'react';
import MainLayout from '../view/Generation/Core/MainLayout';
import { ViewType, GenerationType } from '@/types/generation';

// Note: This page is client-side, so metadata must be set in parent layout
// or via document manipulation. For proper SEO blocking, robots.txt handles this.
const HistoryPage = () => {
  const onViewChange = (_view: ViewType) => {};
  const onGenerationTypeChange = (_type: GenerationType) => {};
  
  // Set meta robots tag for this page
  React.useEffect(() => {
    const metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (metaRobots) {
      metaRobots.content = 'noindex, nofollow';
    } else {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.head.appendChild(meta);
    }
  }, []);
  
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
