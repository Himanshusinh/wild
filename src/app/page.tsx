'use client';

import React, { useEffect } from 'react';
import LandingPage from './view/Landingpage/page';
import HomePage from './view/HomePage/page';
import MainLayout from './view/Generation/Core/MainLayout';
import { ViewType, GenerationType } from '@/types/generation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentView, setCurrentGenerationType } from '@/store/slices/uiSlice';


export default function App() {
  const dispatch = useAppDispatch();
  const currentView = useAppSelector((state: any) => state?.ui?.currentView || 'landing');
  const currentGenerationType = useAppSelector((state: any) => state?.ui?.currentGenerationType || 'text-to-image');
  
  console.log('🔍 App - Redux state:', { currentView, currentGenerationType });
  const isFirstLoad = React.useRef(true);


  // Check if user has visited before (stored in localStorage) - only on first load
  useEffect(() => {
    if (isFirstLoad.current) {
      const hasVisited = localStorage.getItem('wild-mind-visited');
      console.log('🔍 App - First load check:', { hasVisited, currentView });
      if (hasVisited && currentView === 'landing') {
        console.log('🔍 App - Setting currentView to home due to localStorage');
        dispatch(setCurrentView('home'));
      }
      isFirstLoad.current = false;
    }
  }, [dispatch, currentView]); // Only run once on mount

  const handleViewChange = (view: ViewType) => {
    console.log('🔍 App - handleViewChange called with:', view, 'previous view was:', currentView);
    dispatch(setCurrentView(view));
    console.log('🔍 App - Dispatched setCurrentView to Redux');

    if (view === 'landing') {
      localStorage.removeItem('wild-mind-visited');
      console.log('🔍 App - Removed wild-mind-visited from localStorage');
    } else {
      localStorage.setItem('wild-mind-visited', 'true');
      console.log('🔍 App - Set wild-mind-visited in localStorage');
    }
  };

  const handleGenerationTypeChange = (type: GenerationType) => {
    console.log('🔍 App - handleGenerationTypeChange called with:', type);
    dispatch(setCurrentGenerationType(type));
    dispatch(setCurrentView('generation'));
    console.log('🔍 App - Dispatched both actions to Redux');
  };

  // Render different views based on current state
  console.log('🔍 App - Rendering decision for currentView:', currentView);
  console.log('🔍 App - currentView type:', typeof currentView);
  console.log('🔍 App - currentView value:', currentView);
  
  if (currentView === 'landing') {
    console.log('🔍 App - Rendering LandingPage');
    return (
      <LandingPage 
        onGetStarted={() => handleViewChange('home')}
        onNavigateToGeneration={(type: GenerationType) => handleGenerationTypeChange(type)}
      />
    );
  }

  if (currentView === 'home') {
    console.log('🔍 App - Rendering HomePage');
    return (
      <HomePage 
        onViewChange={handleViewChange}
        onGenerationTypeChange={handleGenerationTypeChange}
        currentView={currentView}
        currentGenerationType={currentGenerationType}
      />
    );
  }

  if (currentView === 'generation') {
    console.log('🔍 App - Rendering MainLayout');
    return (
      <MainLayout 
        onViewChange={handleViewChange}
        onGenerationTypeChange={handleGenerationTypeChange}
        currentView={currentView}
        currentGenerationType={currentGenerationType}
      />
    );
  }
  
  console.log('🔍 App - No matching view, returning null');
  return null;

  return null;
}