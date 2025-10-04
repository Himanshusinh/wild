'use client';

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Nav from './compo/Nav'
import SidePannelFeatures from '../Generation/Core/SidePannelFeatures';
import Header from './compo/Header'
import Second from './compo/Second'
import WorkflowCarousel, { WorkflowCard } from './compo/WorkflowCarousel'
import CommunityCreations, { Creation } from './compo/CommunityCreations'
import FooterNew from '../core/FooterNew'
import Recentcreation from './compo/Recentcreation'
import { WobbleCard } from '../Landingpage/components/wobble-card'
import Image from 'next/image'
import { getImageUrl } from './routes'
import WelcomeModal from './compo/WelcomeModal'

import { ViewType, GenerationType } from '@/types/generation';

const HomePage: React.FC = () => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentGenerationType, setCurrentGenerationType] = useState<GenerationType>('text-to-image');
  const [showWildmindSkitPopup, setShowWildmindSkitPopup] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const onViewChange = (view: ViewType) => {
    setCurrentView(view);
    switch (view) {
      case 'landing':
        router.push('/view/Landingpage');
        break;
      case 'home':
        router.push('/view/HomePage');
        break;
      case 'history':
        router.push('/history');
        break;
      case 'bookmarks':
        router.push('/bookmarks');
        break;
      case 'generation':
      default:
        router.push('/text-to-image');
        break;
    }
  };
  const onGenerationTypeChange = (type: GenerationType) => {
    setCurrentGenerationType(type);
    router.push(`/${type}`);
  };

  console.log('🔍 HomePage - Rendered with state:', { currentView, currentGenerationType });

  // Check for first-time user and show welcome modal
  useEffect(() => {
    const checkFirstTimeUser = () => {
      // Check if user has seen the welcome modal before
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal');

      if (!hasSeenWelcome) {
        // Show welcome modal after a short delay
        const timer = setTimeout(() => {
          setShowWelcomeModal(true);
          // Mark as seen
          localStorage.setItem('hasSeenWelcomeModal', 'true');
        }, 2000); // 2 second delay

        return () => clearTimeout(timer);
      }
    };

    checkFirstTimeUser();
  }, []);

  const CARDS: WorkflowCard[] = [
    {
      id: "Designing",
      title: "Designing",
      description:
        "Boost your creative workflow with AI-powered design tools and premium digital assets that save time and maximize productivity. Eliminate repetitive tasks, customize designs instantly, and ensure every project stays consistent, secure, and on-brand. Whether you’re a designer, marketer, or business owner, our smart tools help you work faster, focus on what matters, and deliver high-quality results – without extra effort",
      subtitle: "Keep Every Asset On-Brand with Wild Mind’s Branding Kit",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'designing'),
    },
    {
      id: "Film Making",
      title: "Film Making",
      description:
        "Accelerate your filmmaking process with AI-powered video tools built for creators by Wild Mind. Upscale footage instantly for streaming, presentations, or final delivery without expensive setups. Generate realistic voiceovers to test edits or polish trailers—no studio required. Quickly create storyboards, shot mockups, and concept art to plan scenes and visualize ideas faster. With AI handling the technical heavy lifting, filmmakers can focus on storytelling and creativity.",
      subtitle: "From Concept to Final Cut",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'filmMaking'),
    },
    {
      id: "Printing",
      title: "Printing",
      description:
        "Prepare flawless, print-ready designs in seconds with AI. Automatically resize, retouch, and format images for business cards, posters, packaging, or merchandise—all while preserving quality. Eliminate manual prep with tools that generate high-resolution outputs optimized for print, ensuring colors, details, and layouts stay sharp and professional. Whether you’re producing marketing collateral or creative projects, our AI helps you move from concept to final print seamlessly.",
      subtitle: "Print-Ready Visuals Without the Hassle",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'printing'),
    },
    {
      id: "Branding",
      title: "Branding",
      description:
        "Strengthen your identity with AI-powered branding tools that ensure consistency across every campaign. Instantly generate logos, brand mockups, and style assets tailored to your guidelines. Use Wild Mind’s Branding Kit to keep fonts, colors, and design elements unified across marketing visuals, social media posts, and presentations. From fresh brand concepts to polished assets, our AI keeps every creation aligned, recognizable, and professional—without extra effort.",
      subtitle: "Creative workfloKeep Every Asset On-Brand with Wild Mind’s Branding Kit",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'branding'),
    },
    {
      id: "Content Creation",
      title: "Content Creation",
      description:
        "Stand out on every platform with AI-powered content creation tools designed for YouTube, TikTok, Reels, and beyond. Animate images, add AI-generated voiceovers, and create professional intros in seconds. Upscale visuals, design eye-catching graphics, and generate on-brand assets that match your unique style. With assistive tools built for speed and creativity, you can focus on engaging your audience while AI handles the heavy lifting.",
      subtitle: "Make Scroll-Stopping Content Instantly",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'contentCreation'),
    },
    {
      id: "Art Direction",
      title: "Art Direction",
      description:
        "Turn ideas into visuals instantly with AI-powered comic generation, film scene creation, and storyboard design from simple text prompts. Explore creative directions faster, experiment with styles, and bring concepts to life without long manual processes. From drafting storyboards to generating cinematic frames or comic panels, our tools give art directors full creative control while cutting production time. Secondary assistive features let you refine details, adjust compositions, and adapt outputs for campaigns—ensuring every project moves smoothly from concept to final delivery.",
      subtitle: "Creative Control at Every Stage for Art Directors",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'artDirection'),
    },
    {
      id: "Marketing",
      title: "Marketing",
      description:
        "Create impactful marketing campaign visuals in seconds with AI. From generating realistic AI models for product shoots and ads to producing ready-to-use mockups across platforms, our tools help marketers scale faster without compromising creativity. Whether you’re preparing ads, social posts, or promotional content, every asset is campaign-ready, on-brand, and designed to capture attention—all powered by Wild Mind.",
      subtitle: "Create Stunning Visuals in Seconds for your Marketing Campaigns with Wild Mind",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'marketing'),
    },
    {
      id: "Photography",
      title: "Photography",
      description:
        "Elevate your photography with AI-powered photo enhancement and retouching tools by Wild Mind. Instantly correct details, remove imperfections, and enhance image quality—without complex editing software. Optimize a single shot for large prints, portfolios, social media, or client delivery with just one click. From color correction to fine-tuned detail adjustments, our AI tools help photographers save time, stay consistent, and deliver professional-quality results every time.",
      subtitle: "Perfect Every Shot in Seconds",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'photography'),
    },
  ];


  const ITEMS: Creation[] = [
    {
      id: "1",
      src: getImageUrl('communityCreations', 'creation1'),
      prompt: "Ultra-realistic studio portrait in 8K of a glamorous astronaut on a moon rock…",
      categories: ["Trending", "Photography", "Character"],
      width: 900,
      height: 1400,
    },
    {
      id: "2",
      src: getImageUrl('communityCreations', 'creation2'),
      prompt: "Custom street-art Nike sneaker product shot, reflective lacquer, moody studio lighting",
      categories: ["Trending", "Photography", "Food"], // sample categories
      width: 1200,
      height: 1150,
    },
    {
      id: "3",
      src: getImageUrl('communityCreations', 'creation3'),
      prompt: "Pixel-art anime frame close-up with halftone pattern",
      categories: ["Character"],
      width: 1000,
      height: 1000,
    },
    {
      id: "4",
      src: getImageUrl('communityCreations', 'creation4'),
      prompt: "Bold pop-art portrait with neon palette",
      categories: ["Trending", "Animals"],
      width: 1200,
      height: 1810,
    },
    {
      id: "5",
      src: getImageUrl('communityCreations', 'creation5'),
      prompt: "Painterly spring park with vivid trees and reflections",
      categories: ["Photography"],
      width: 1600,
      height: 1400,
    },
    {
      id: "6",
      src: getImageUrl('communityCreations', 'creation6'),
      prompt: "Urban anime character in layered hoodie, graffiti background",
      categories: ["Character"],
      width: 1100,
      height: 1800,
    },
    {
      id: "7",
      src: getImageUrl('communityCreations', 'creation7'),
      prompt: "Retro wave Porsche poster with motion lines",
      categories: ["Photography", "Trending"],
      width: 1500,
      height: 1000,
    },
    {
      id: "8",
      src: getImageUrl('communityCreations', 'creation8'),
      prompt: "Cyberpunk cityscape with neon lights and flying cars",
      categories: ["Trending", "Character"],
      width: 1400,
      height: 1200,
    },
    {
      id: "9",
      src: getImageUrl('communityCreations', 'creation9'),
      prompt: "Abstract geometric patterns with vibrant gradients",
      categories: ["All", "Trending"],
      width: 1200,
      height: 1200,
    },

  ];

  return (
    <div className="min-h-screen bg-black">
      {/* DEBUG: This is HomePage component */}
      {/* <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-2 text-center">
        🔍 DEBUG: HomePage Component is Rendering
      </div> */}

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
            onViewChange={onViewChange}
            onGenerationTypeChange={onGenerationTypeChange}
            onWildmindSkitClick={() => setShowWildmindSkitPopup(true)}
          />
        </div>

        {/* Main Content Area - takes remaining width */}
        <div className="flex-1 min-w-0">
          <Header />
          <Recentcreation />
          <Second />
          <main className="min-h-screen bg-black text-white py-10">
            <div className="w-full px-4 md:px-8 lg:px-12 mt-32">
              <h2 className="text-white text-4xl md:text-4xl font-medium ml-6 ">Workflow</h2>
              <WorkflowCarousel items={CARDS} autoPlay={true} intervalMs={30000} />
            </div>
          </main>

          <main className="min-h-screen bg-black text-white px-4 md:px-8 py-10">
            <div className="w-full px-4 md:px-8 lg:px-12">
              <CommunityCreations items={ITEMS} initialFilter="Trending" />
            </div>
          </main>

          {/* WobbleCard Section */}
          <main className="bg-black text-white px-4 md:px-8 py-6 mb-32 mt-32">
            <div className="w-full px-4 md:px-8 lg:px-12">
              <div className="w-full">
                <WobbleCard
                  containerClassName="w-full bg-[#002933] min-h-[500px] md:min-h-[400px] lg:min-h-[500px]"
                  className="!p-0 !py-0 !h-full !min-h-full"
                >
                  <div
                    className="flex w-full h-full min-h-full relative"
                    style={{ height: '100%', minHeight: '500px' }}
                  >
                    {/* Left side content */}
                    <div className="flex-1 flex flex-col justify-between p-6 md:p-8 lg:p-10 z-10">
                      <div className="w-full">
                        <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-2xl lg:text-4xl font-semibold tracking-[-0.015em] text-white font-poppins">
                          Plans That Grow With You
                        </h2>
                        <p className="mt-4 md:mt-3 lg:mt-4 max-w-[40rem] md:max-w-[30rem] lg:max-w-[40rem] text-left text-base/6 md:text-base lg:text-lg text-neutral-200 text-justify mr-2 font-medium">
                          Whether you’re a designer, marketer, filmmaker, or content creator, our pricing is built to match your workflow. Get unlimited generations, exclusive access to advanced AI models, and essential creative tools like storyboard generation, mockup design, and campaign visuals—all included with no extra fees. From individual projects to large-scale campaigns, our plans offer the perfect balance of affordability and professional-grade features. With us, you don’t just save money—you unlock endless creative possibilities.
                        </p>
                      </div>

                      {/* Join Community Button - Bottom Left */}
                      <button className="font-poppins text-lg font-semibold bg-white text-[#1C303D] font-medium px-6 py-3 rounded-full transition-all duration-200 shadow-lg w-fit">
                        Pricing Plans
                      </button>
                    </div>

                    {/* Right side image */}
                    <div
                      className="absolute right-0 top-0 w-1/2 h-full"
                      style={{ height: '100%', minHeight: '500px' }}
                    >
                      <Image
                        src="https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fpricing%2F20250830_1122_Abstract%20Nautical%20Scene_remix_01k3wres6ye27s4wtw945t05dz.png?alt=media&token=14f642d0-2e5b-4daf-b3bb-388b374a55d5"
                        alt="AI Art Community"
                        fill
                        className="object-cover rounded-r-2xl"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 40vw, 30vw"
                        priority
                      />
                    </div>
                  </div>
                </WobbleCard>
              </div>
            </div>
          </main>

          <FooterNew />
        </div>
      </div>
      {/* Wildmind Skit Popup */}
      {showWildmindSkitPopup && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black z-[200] flex items-center justify-center"
            onClick={() => setShowWildmindSkitPopup(false)}
          >
            {/* Popup Content */}
            <div
              className="bg-black backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-[90vw] max-w-4xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-white text-3xl font-bold">Choose Style</h2>
                <button
                  onClick={() => setShowWildmindSkitPopup(false)}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Video Ads - Available */}
                <div
                  onClick={() => {
                    onGenerationTypeChange('ad-generation');
                    setShowWildmindSkitPopup(false);
                  }}
                  className="relative group cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 h-48 flex flex-col items-center justify-center text-center transition-transform group-hover:scale-105">
                    <div className="absolute top-4 right-4">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-4xl mb-4">📹</div>
                  </div>
                  <h3 className="text-white text-lg font-semibold mt-4">Video Ads</h3>
                </div>

                {/* Jewelry - Coming Soon */}
                <div className="relative group cursor-not-allowed opacity-60">
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-8 h-48 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4">💎</div>
                  </div>
                  <h3 className="text-white text-lg font-semibold mt-4">Jewelry</h3>
                  <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-semibold">Soon</span>
                </div>

                {/* Live Chat - Available */}
                <div
                  onClick={() => {
                    router.push('/view/Generation/wildmindskit/LiveChat');
                    setShowWildmindSkitPopup(false);
                  }}
                  className="relative group cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl p-8 h-48 flex flex-col items-center justify-center text-center transition-transform group-hover:scale-105">
                    <div className="absolute top-4 right-4">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-4xl mb-4">💬</div>
                  </div>
                  <h3 className="text-white text-lg font-semibold mt-4">Live Chat</h3>
                </div>

                {/* Virtual Try-On - Coming Soon */}
                <div className="relative group cursor-not-allowed opacity-60">
                  <div className="bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl p-8 h-48 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4">👗</div>
                  </div>
                  <h3 className="text-white text-lg font-semibold mt-4">Virtual Try-On</h3>
                  <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-semibold">Soon</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </div>
  )
}

export default HomePage