'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SidePannelFeatures from '../Generation/Core/SidePannelFeatures';
import Nav from '../Generation/Core/Nav';
import Header from './compo/Header';
import TemplateGrid from './compo/TemplateGrid';
import FooterNew from '../core/FooterNew';
import { ViewType, GenerationType } from '@/types/generation';

type CategoryType = 'All' | 'General' | 'Fun' | 'Viral Trend' | 'Architecture' | 'Photography' | 'Fashion' | 'Virtual tryon' | 'Social Media' | 'Film Industry' | 'Branding' | 'Design' | 'Video';

const WorkflowsPage: React.FC = () => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewType>('workflows');
  const [currentGenerationType, setCurrentGenerationType] = useState<GenerationType>('text-to-image');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('All');

  const handleViewChange = (view: ViewType) => {
    console.log('View changed to:', view);
    setCurrentView(view);
  };

  const handleGenerationTypeChange = (type: GenerationType) => {
    console.log('Generation type changed to:', type);
    setCurrentGenerationType(type);
    router.push(`/${type}`);
  };

  const handleCategoryChange = (category: CategoryType) => {
    setActiveCategory(category);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation - fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Nav />
      </div>

      {/* Main layout - side panel + content area */}
      <div className="flex pt-[80px]"> {/* pt-[80px] to account for fixed nav */}
        {/* Side Panel - fixed width */}
        <div className="w-[68px] flex-shrink-0">
          <SidePannelFeatures 
            currentView={currentView}
            onViewChange={handleViewChange}
            onGenerationTypeChange={handleGenerationTypeChange}
          />
        </div>

        {/* Main Content Area - takes remaining width */}
        <div className="flex-1 min-w-0">
          <Header 
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
          <TemplateGrid activeCategory={activeCategory} />
          <FooterNew />
        </div>
      </div>
    </div>
  );
};

export default WorkflowsPage;

