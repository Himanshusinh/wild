'use client';

import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
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
import { getImageUrl, API_BASE } from './routes'
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

  // Show deferred toast from login (set in signup/signin flow)
  useEffect(() => {
    try {
      const msg = localStorage.getItem('toastMessage');
      if (msg === 'LOGIN_SUCCESS') {
        const t = setTimeout(() => {
          try { toast.success('Logged in successfully') } catch {}
          try { localStorage.removeItem('toastMessage') } catch {}
        }, 2000);
        return () => clearTimeout(t);
      }
    } catch {}
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


  // Removed static ITEMS fallback; homepage will use live Art Station feed only

  const [artItems, setArtItems] = useState<Creation[]>([])

  const didInitArtRef = React.useRef(false)
  useEffect(() => {
    if (didInitArtRef.current) return; // Prevent React StrictMode double-invoke in dev
    didInitArtRef.current = true;
    const fetchHomeArt = async () => {
      try {
        const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
        let nextCursor: string | undefined = undefined
        const dims = [
          { w: 900, h: 1400 },
          { w: 1200, h: 1150 },
          { w: 1000, h: 1000 },
          { w: 1200, h: 1810 },
          { w: 1600, h: 1400 },
          { w: 1100, h: 1800 },
          { w: 1500, h: 1000 },
          { w: 1400, h: 1200 },
          { w: 1200, h: 1200 },
        ]

        const out: Creation[] = []
        let page = 0
        const maxPages = 3
        while (page < maxPages && out.length < 48) {
          const url = new URL(`${baseUrl}/api/feed`)
          url.searchParams.set('limit', '24')
          // Home page: prefer images for aesthetic layout
          url.searchParams.set('mode', 'image')
          if (nextCursor) url.searchParams.set('cursor', nextCursor)
          const res = await fetch(url.toString(), { credentials: 'include' })
          if (!res.ok) break
          const data = await res.json()
          const payload = data?.data || data
          const items: any[] = payload?.items || []
          nextCursor = payload?.meta?.nextCursor || payload?.nextCursor

          items.forEach((it: any, idx: number) => {
            const firstImage = (it.images && it.images[0])
            const firstVideo = (it.videos && it.videos[0])
            const firstAudio = (it.audios && it.audios[0])
            const media = firstVideo || firstImage || firstAudio
            const src = media?.url || ''
            if (!src) return
            const tRaw = (it.generationType || '')
            const t = tRaw.toLowerCase()
            const cat = (() => {
              if (firstAudio) return 'Music'
              if (t.includes('music') || t.includes('audio')) return 'Music'
              if (t === 'text-to-image') return 'Images'
              if (t === 'text-to-video') return 'Videos'
              if (t === 'logo' || t === 'logo-generation') return 'Logos'
              if (t === 'sticker-generation' || t === 'sticker') return 'Stickers'
              if (t === 'product-generation' || t === 'product') return 'Products'
              return 'All'
            })() as any
            const dim = dims[(out.length + idx) % dims.length]
            const creator = (it.createdBy?.displayName || it.createdBy?.username || 'User') as string
            out.push({ id: it.id || String(out.length + idx), src, prompt: it.prompt, categories: [cat], width: dim.w, height: dim.h, createdBy: creator })
          })

          page += 1
          if (!nextCursor) break
        }

        setArtItems(out)
      } catch (e) {
        // fallback to static
        setArtItems([])
      }
    }
    fetchHomeArt()
  }, [])

  return (
    <div className="min-h-screen bg-[#07070B]">
      {/* DEBUG: This is HomePage component */}
      {/* <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-2 text-center">
        🔍 DEBUG: HomePage Component is Rendering
      </div> */}

      {/* Navigation - fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Nav />
      </div>

      {/* Main layout - side panel + content area */}
      <div className="flex pt-16 md:pt-20"> {/* Responsive top padding */}
        {/* Side Panel - fixed width */}
        <div className="w-[68px] flex-shrink-0">
          <SidePannelFeatures
            currentView={currentView}
            onViewChange={onViewChange}
            onGenerationTypeChange={onGenerationTypeChange}
            onWildmindSkitClick={() => setShowWildmindSkitPopup(true)}
            showMobileHeader={false}
          />
        </div>

        {/* Main Content Area - takes remaining width */}
        <div className="flex-1 min-w-0 w-full md:w-auto -ml-[68px] md:ml-0">
          <Header />
          <Recentcreation />
          <Second />
          <main className="min-h-screen bg-[#07070B] text-white pt-10">
            <div className="w-full md:pl-12 mt-10">
              <h2 className="text-white text-4xl md:text-4xl font-medium ml-0 ">Workflow</h2>
              <WorkflowCarousel items={CARDS} autoPlay={true} intervalMs={30000} />
            </div>
          </main>

          <main className="min-h-screen bg-[#07070B] text-white px-4 md:px-8 pt-0 -mt-14">
            <div className="w-full px-4 pl-4">
              <CommunityCreations items={artItems} initialFilter="All" />
            </div>
          </main>

          {/* WobbleCard Section */}
          <main className="bg-[#07070B] text-white px-3 md:px-8 py-4 md:py-6 mb-16 md:mb-32 mt-5 md:mt-32">
            <div className="w-full px-2 md:px-8 lg:px-12">
              <div className="w-full">
                <WobbleCard
                  containerClassName="w-full bg-[#002933] min-h-[300px] md:min-h-[400px] lg:min-h-[500px]"
                  className="!p-0 !py-0 !h-full !min-h-full"
                >
                  <div
                    className="flex flex-col md:flex-row w-full h-full min-h-full relative"
                    style={{ height: '100%', minHeight: '300px' }}
                  >
                    {/* Left side content */}
                    <div className="flex-1 flex flex-col justify-between p-4 md:p-8 lg:p-10 z-10">
                      <div className="w-full">
                        <h2 className="max-w-sm md:max-w-lg text-left text-balance text-lg md:text-2xl lg:text-4xl font-semibold tracking-[-0.015em] text-white font-poppins">
                          Plans That Grow With You
                        </h2>
                        <p className="mt-3 md:mt-3 lg:mt-4 max-w-[40rem] md:max-w-[30rem] lg:max-w-[40rem] text-left text-sm md:text-base lg:text-lg text-neutral-200 mr-2 font-medium">
                          Whether you're a designer, marketer, filmmaker, or content creator, our pricing is built to match your workflow. Get unlimited generations, exclusive access to advanced AI models, and essential creative tools like storyboard generation, mockup design, and campaign visuals—all included with no extra fees. From individual projects to large-scale campaigns, our plans offer the perfect balance of affordability and professional-grade features. With us, you don't just save money—you unlock endless creative possibilities.
                        </p>
                      </div>

                      {/* Join Community Button - Bottom Left */}
                      <button className="font-poppins text-sm md:text-lg bg-white text-[#1C303D] font-semibold px-4 md:px-6 py-2 md:py-3 rounded-full transition-all duration-200 shadow-lg w-fit mt-4 md:mt-0">
                        Pricing Plans
                      </button>
                    </div>

                    {/* Right side image */}
                    <div
                      className="absolute right-0 top-0 w-1/2 h-1/2 md:h-full"
                      style={{ height: '50%', minHeight: '150px' }}
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
            className="fixed inset-0 bg-black/90 md:bg-black z-[200] flex items-center justify-center"
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