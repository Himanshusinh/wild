'use client';

import React from 'react'
import Nav from '../Generation/Core/Nav'
import SidePannelFeatures from '../Generation/Core/SidePannelFeatures'
import Header from './compo/Header'
import Second from './compo/Second'
import WorkflowCarousel, { WorkflowCard } from './compo/WorkflowCarousel'
import CommunityCreations, { Creation } from './compo/CommunityCreations'

const HomePage = () => {
  // Simple handlers for HomePage context
  const handleViewChange = (view: 'generation' | 'history' | 'bookmarks') => {
    // For HomePage, we can handle navigation here if needed
    console.log('View changed to:', view);
  };

  const handleGenerationTypeChange = (type: 'text-to-image' | 'logo-generation' | 'sticker-generation' | 'text-to-video' | 'text-to-music') => {
    // For HomePage, we can handle generation type changes here if needed
    console.log('Generation type changed to:', type);
  };

  const CARDS: WorkflowCard[] = [
    {
      id: "designer",
      title: "Designer",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s...",
      ctaText: "Sign Up",
      image: "/illustrations/designer.png",
    },
    {
      id: "producer",
      title: "Producer",
      description:
        "Plan shots, manage assets, and keep your team synced with versioned deliveries and approvals in one place.",
      ctaText: "Start Free",
      image: "/illustrations/producer.png",
    },
    {
      id: "developer",
      title: "Developer",
      description:
        "Integrate creative pipelines with clean APIs, webhooks, and service accounts for secure automation.",
      ctaText: "Docs",
      image: "/illustrations/developer.png",
    },
  ];


  const ITEMS: Creation[] = [
    {
      id: "1",
      src: "/community/astro-moon.jpg",
      prompt: "Ultra-realistic studio portrait in 8K of a glamorous astronaut on a moon rock…",
      categories: ["Trending", "Photography", "Character"],
      width: 900,
      height: 1400,
    },
    {
      id: "2",
      src: "/community/sneaker-art.jpg",
      prompt: "Custom street-art Nike sneaker product shot, reflective lacquer, moody studio lighting",
      categories: ["Trending", "Photography", "Food"], // sample categories
      width: 1200,
      height: 900,
    },
    {
      id: "3",
      src: "/community/pixel-anime.jpg",
      prompt: "Pixel-art anime frame close-up with halftone pattern",
      categories: ["Character"],
      width: 1000,
      height: 1000,
    },
    {
      id: "4",
      src: "/community/bulma-pop.jpg",
      prompt: "Bold pop-art portrait with neon palette",
      categories: ["Trending", "Character"],
      width: 1200,
      height: 1600,
    },
    {
      id: "5",
      src: "/community/park-paint.jpg",
      prompt: "Painterly spring park with vivid trees and reflections",
      categories: ["Photography"],
      width: 1600,
      height: 1100,
    },
    {
      id: "6",
      src: "/community/goku-street.jpg",
      prompt: "Urban anime character in layered hoodie, graffiti background",
      categories: ["Character"],
      width: 1100,
      height: 1500,
    },
    {
      id: "7",
      src: "/community/porsche-retro.jpg",
      prompt: "Retro wave Porsche poster with motion lines",
      categories: ["Photography", "Trending"],
      width: 1500,
      height: 1100,
    },
  ];

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
            currentView="generation"
            onViewChange={handleViewChange}
            onGenerationTypeChange={handleGenerationTypeChange}
          />
        </div>

        {/* Main Content Area - takes remaining width */}
        <div className="flex-1 min-w-0">
          <Header />
          <Second />
          <main className="min-h-screen bg-[#0b0f17] text-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6">Workflow</h2>
        <WorkflowCarousel items={CARDS} autoPlay intervalMs={5000} />
      </div>
    </main>

    <main className="min-h-screen bg-[#090D16] text-white px-4 md:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        <CommunityCreations items={ITEMS} initialFilter="Trending" />
      </div>
    </main>
        </div>
      </div>
    </div>
  )
}

export default HomePage