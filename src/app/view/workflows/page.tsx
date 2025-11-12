'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// Nav and SidePannelFeatures are provided by the persistent root layout
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
    <div className="min-h-screen bg-[#07070B]">
      {/* Main layout - content area (root layout provides Nav + SidePanel) */}
      <div className="flex pt-10 ml-[68px]"> {/* spacing to account for persistent Nav + SidePanel */}
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

