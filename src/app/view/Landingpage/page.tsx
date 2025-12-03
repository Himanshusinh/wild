"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import ScrollFloat from './components/ScrollFloat'
import VariableProximity from './components/VariableProximity'
import { Card } from './components/CardsCarousel'
import { CardContainer, CardBody, CardItem } from './components/3DCardEffect'
import NAV_LAND from './components/NAV_LAND'
import Subscribe from './components/subscribe'
import SpotlightCard from './components/SpotlightCard'
import { workflowCards } from './data/workflowData'
import { carouselCards } from './data/carouselData'
import { layoutGridCards } from './data/layoutGridData'
import { heroProducts } from './data/heroParallaxData'
import { worldMapDots } from './data/worldMapData'
import FooterNew from '../core/FooterNew'
import { HoverBorderGradient } from './components/hover-border-gradiant'

// Lazy load heavy components with better performance
const LazyCircularGallery = React.lazy(() => import('./components/CicularGallery').then(module => ({ default: module.default })))
const LazyWorldMap = React.lazy(() => import('./components/worldmap').then(module => ({ default: module.WorldMap })))
const LazyHeroParallax = React.lazy(() => import('./components/HeroParallax').then(module => ({ default: module.HeroParallax })))
const LazyCarousel = React.lazy(() => import('./components/CardsCarousel').then(module => ({ default: module.Carousel })))
const LazyLayoutGrid = React.lazy(() => import('./components/LayoutGrid').then(module => ({ default: module.LayoutGrid })))
const LazyFeaturesAll = React.lazy(() => import('./components/FeatuesAll'))
const LazyWobbleCard = React.lazy(() => import('./components/wobble-card').then(module => ({ default: module.WobbleCard })))
const LazyFAQ = React.lazy(() => import('./components/FAQ'))
import { GenerationType } from '@/types/generation';

const LandingPage: React.FC = () => {
  const router = useRouter()
  const logoutToastShown = React.useRef(false)
  const proximityContainerRef = React.useRef<HTMLDivElement | null>(null)
  const hKnowRef = React.useRef<HTMLDivElement | null>(null)
  const hFeaturesRef = React.useRef<HTMLDivElement | null>(null)
  const hHighlightsRef = React.useRef<HTMLDivElement | null>(null)
  const hWorkflowsRef = React.useRef<HTMLDivElement | null>(null)
  const hGlobalRef = React.useRef<HTMLDivElement | null>(null)
  const hWhyRef = React.useRef<HTMLDivElement | null>(null)
  const hPricingRef = React.useRef<HTMLDivElement | null>(null)
  const hArtGalleryRef = React.useRef<HTMLDivElement | null>(null)
  const hFAQRef = React.useRef<HTMLDivElement | null>(null)
  const workflowScrollRef = React.useRef<HTMLDivElement | null>(null)
  const afterScrollFloatRef = React.useRef<HTMLDivElement | null>(null)
  const unlockRef = React.useRef<HTMLDivElement | null>(null)
  const [showProximity, setShowProximity] = React.useState(false)
  const [unlockBelow, setUnlockBelow] = React.useState(false)
  const [canScrollWorkflowLeft, setCanScrollWorkflowLeft] = React.useState(false)
  const [canScrollWorkflowRight, setCanScrollWorkflowRight] = React.useState(true)
  const [loadHeroParallax, setLoadHeroParallax] = React.useState(true)
  const [loadCarousel, setLoadCarousel] = React.useState(false)
  const [loadFeatures, setLoadFeatures] = React.useState(false)
  const [loadLayoutGrid, setLoadLayoutGrid] = React.useState(false)
  const [loadWorldMap, setLoadWorldMap] = React.useState(false)
  const [loadPricing, setLoadPricing] = React.useState(false)
  const [loadGallery, setLoadGallery] = React.useState(false)
  const [loadFAQ, setLoadFAQ] = React.useState(false)
  
  // Show logout toast on entry and prevent navigating back into protected routes after logout
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    // Toast logic moved to global ToastMount.tsx to prevent race conditions
    // Only keeping popstate handling here
    if (typeof window === 'undefined') return
    try {
      // Clean up any stale local storage flags if they exist
      const key = 'toastMessage'
      const flag = localStorage.getItem(key)
      if (flag === 'LOGOUT_SUCCESS') {
        // Let ToastMount handle it, but if we are here, we might want to ensure it's not double handled
        // Actually ToastMount handles it globally, so we just ignore it here
      }
    } catch {}
    const handlePop = () => {
      // Always stay on landing page if user came here after logout
      if (window.location.pathname.toLowerCase().includes('/view/landingpage')) {
        history.pushState(null, document.title, window.location.href)
      }
    }
    try {
      history.pushState(null, document.title, window.location.href)
      window.addEventListener('popstate', handlePop)
    } catch {}
    return () => {
      window.removeEventListener('popstate', handlePop)
    }
  }, [])
  
  // Carousel items
  const carouselItems = carouselCards.map((card, index) => (
    <Card
      key={card.title}
      card={{
        src: card.src,
        title: card.title,
        description: card.description,
      }}
      index={index}
      layout
    />
  ))
  
  // Memoized workflow scroll functions to prevent recreation on every render
  const checkWorkflowScrollability = React.useCallback(() => {
    if (workflowScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = workflowScrollRef.current;
      setCanScrollWorkflowLeft(scrollLeft > 0);
      setCanScrollWorkflowRight(scrollLeft < scrollWidth - clientWidth);
    }
  }, []);

  const smoothScrollTo = React.useCallback((container: HTMLDivElement, targetLeft: number, duration = 600) => {
    const startLeft = container.scrollLeft;
    const maxLeft = container.scrollWidth - container.clientWidth;
    const clampedTarget = Math.max(0, Math.min(targetLeft, maxLeft));
    const change = clampedTarget - startLeft;
    
    // Use native smooth scrolling for better performance
    if ('scrollBehavior' in container.style) {
      container.scrollTo({
        left: clampedTarget,
        behavior: 'smooth'
      });
      
      // Check scrollability after animation completes
      setTimeout(() => {
        checkWorkflowScrollability();
      }, duration);
    } else {
      // Fallback for browsers that don't support smooth scrolling
      const startTime = performance.now();
      const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

      function step(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        container.scrollLeft = startLeft + change * easeOutQuart(progress);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          checkWorkflowScrollability();
        }
      }
      requestAnimationFrame(step);
    }
  }, [checkWorkflowScrollability]);

  const scrollWorkflowLeft = React.useCallback(() => {
    if (workflowScrollRef.current) {
      const container = workflowScrollRef.current;
      const cardWidth = 384; // w-[24rem]
      const gap = 24; // gap-6
      const delta = cardWidth + gap;
      const target = container.scrollLeft - delta;
      smoothScrollTo(container, target, 500); // Reduced duration for snappier feel
    }
  }, [smoothScrollTo]);

  const scrollWorkflowRight = React.useCallback(() => {
    if (workflowScrollRef.current) {
      const container = workflowScrollRef.current;
      const cardWidth = 384; // w-[24rem]
      const gap = 24; // gap-6
      const delta = cardWidth + gap;
      const target = container.scrollLeft + delta;
      smoothScrollTo(container, target, 500); // Reduced duration for snappier feel
    }
  }, [smoothScrollTo]);

  const onGetStarted = () => {
    try {
      const hasSessionCookie = document.cookie.split(';').some(c => c.trim().startsWith('app_session='))
      const hasLocalAuth = Boolean(localStorage.getItem('authToken') || localStorage.getItem('user'))
      if (hasSessionCookie || hasLocalAuth) {
        router.push('/view/HomePage')
        return
      }
    } catch {}
    router.push('/view/signup')
  };

  // Optimized intersection observers with proper cleanup
  React.useEffect(() => {
    const sentinel = afterScrollFloatRef.current
    if (!sentinel) return
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShowProximity(true)
        observer.disconnect()
      }
    }, { threshold: 0.5, rootMargin: '50px' })
    
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    const el = unlockRef.current
    if (!el) return
    
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setUnlockBelow(true)
        io.disconnect()
      }
    }, { threshold: 0.25, rootMargin: '100px' })
    
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Progressive loading observers
  React.useEffect(() => {
    const observers: IntersectionObserver[] = []
    
    // Load carousel when carousel section comes into view
    if (hKnowRef.current) {
      const carouselObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setLoadCarousel(true)
          carouselObserver.disconnect()
        }
      }, { threshold: 0.1, rootMargin: '200px' })
      carouselObserver.observe(hKnowRef.current)
      observers.push(carouselObserver)
    }

    // Load features when features section comes into view
    if (hFeaturesRef.current) {
      const featuresObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setLoadFeatures(true)
          featuresObserver.disconnect()
        }
      }, { threshold: 0.1, rootMargin: '200px' })
      featuresObserver.observe(hFeaturesRef.current)
      observers.push(featuresObserver)
    }

    // Load layout grid when highlights section comes into view
    if (hHighlightsRef.current) {
      const layoutObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setLoadLayoutGrid(true)
          layoutObserver.disconnect()
        }
      }, { threshold: 0.1, rootMargin: '200px' })
      layoutObserver.observe(hHighlightsRef.current)
      observers.push(layoutObserver)
    }

    // Load world map when global section comes into view
    if (hGlobalRef.current) {
      const worldMapObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setLoadWorldMap(true)
          worldMapObserver.disconnect()
        }
      }, { threshold: 0.1, rootMargin: '200px' })
      worldMapObserver.observe(hGlobalRef.current)
      observers.push(worldMapObserver)
    }

    // Load pricing when pricing section comes into view
    if (hPricingRef.current) {
      const pricingObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setLoadPricing(true)
          pricingObserver.disconnect()
        }
      }, { threshold: 0.1, rootMargin: '200px' })
      pricingObserver.observe(hPricingRef.current)
      observers.push(pricingObserver)
    }

    // Load gallery when gallery section comes into view
    if (hArtGalleryRef.current) {
      const galleryObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setLoadGallery(true)
          galleryObserver.disconnect()
        }
      }, { threshold: 0.1, rootMargin: '200px' })
      galleryObserver.observe(hArtGalleryRef.current)
      observers.push(galleryObserver)
    }

    // Load FAQ early since it's near the bottom
    const faqTimer = setTimeout(() => {
      setLoadFAQ(true)
    }, 3000)

    return () => {
      observers.forEach(observer => observer.disconnect())
      clearTimeout(faqTimer)
    }
  }, [])

  // const [isHovered, setIsHovered] = useState(false)
  return (

    
  <div className='relative w-full h-full bg-[#07070B] overflow-x-hidden md:overflow-visible mb:w-full mb:h-full'>                    

    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-6 md:px-4 lg:px-6">
        <NAV_LAND onGetStarted={onGetStarted} />
    </div>
                
    <div className='w-full bg-[#07070B]'>
        {loadHeroParallax ? (
          <React.Suspense fallback={<div className="h-screen bg-[#07070B] animate-pulse" />}>
            <LazyHeroParallax products={heroProducts} />
          </React.Suspense>
        ) : (
          <div className="h-screen bg-[#07070B]" />
        )}
    </div>
    
    {/* Spacer to ensure proper separation (minimized) */}
    {/* <div className="h-0 bg-[#07070B] md:h-32 md:mt-48 md:mb-24"></div> */}

    {/* New sections after HeroParallax (not nested inside) */}
    <div className={`relative z-[10] -mt-96 bg-[#07070B] px-8 md:px-8 md:mt-32 desktop:-mt-40 desktop-lg:-mt-56 lg:px-8 desktop:px-24 desktop-lg:px-32 pt-2 md:pt-1 lg:pt-2 pb-10 md:pb-16 lg:pb-20 flex flex-col items-center text-center ${unlockBelow ? '' : 'min-h-[100vh] overflow-hidden'}`}>
      <ScrollFloat
        containerClassName="text-center md:mt-24 desktop:mt-0 desktop-lg:mt-0"
        animationDuration={5}
        ease="back.inOut(5)"
        textClassName="text-white font-medium md:font-semibold -mb-20 font-poppins text-[clamp(1.8rem,4.5vw,2.5rem)] md:text-[clamp(4rem,6vw,5rem)] lg:text-[clamp(5rem,7vw,5.5rem)]"
        scrollStart="top 85%"
        scrollEnd="bottom 25%"
      >
        Streamline The Entire Visual
      </ScrollFloat>

      <ScrollFloat
        containerClassName="text-center -mt-5  md:-mt-6 lg:-mt-8 md:mb-16"
        textClassName="text-white font-medium md:font-semibold font-poppins text-[clamp(1.8rem,4.5vw,2.5rem)] md:text-[clamp(4rem,6vw,5rem)] lg:text-[clamp(5rem,7vw,5.5rem)]"
        scrollStart="top 100%"
        scrollEnd="bottom 25%"
      >
        Content Production Pipeline
      </ScrollFloat>

      <ScrollFloat
        containerClassName="text-center -mb-4  md:mt-8 lg:mt-3"
        textClassName="text-white font-medium md:font-semibold font-poppins text-[clamp(1.8rem,4.5vw,2.5rem)] md:text-[clamp(4rem,6vw,5rem)] lg:text-[clamp(5rem,7vw,5.5rem)]"
        scrollStart="top 85%"
        scrollEnd="bottom 25%"
      >
        From Initial Scripting
      </ScrollFloat>

      <ScrollFloat
        containerClassName="text-center -mb-4  md:-mt-6 lg:-mt-8"
        textClassName="text-white font-medium md:font-semibold font-poppins text-[clamp(1.8rem,4.5vw,2.5rem)] md:text-[clamp(4rem,6vw,5rem)] lg:text-[clamp(5rem,7vw,5.5rem)]"
        scrollStart="top 85%"
        scrollEnd="bottom 25%"
      >
        To Final Scene Generation
      </ScrollFloat>

      <div ref={afterScrollFloatRef} className="h-[16vh] md:h-[24vh] lg:h-[28vh]" />

      {/* Invisible unlock sentinel placed after both ScrollFloat headings */}
      <div ref={unlockRef} className="h-1" />

        {unlockBelow && showProximity && (
          <div ref={proximityContainerRef} style={{ position: 'relative' }} className="-mt-10 md:mt-6 lg:-mt-44 mx-auto max-w-[680px] md:max-w-3xl lg:max-w-[1440px]">
            <VariableProximity
              label={'We have got you covered with\nImage Generation, Video Creation,\nAudio Production, Branding Requirements,\nFilming Tools, and 3D Objects!'}
              className={'variable-proximity-demo text-white font-semibold text-left text-[1.25rem] leading-[1.2] whitespace-pre-line px-4 md:px-0 md:text-[2.5rem] lg:text-[2.8rem] md:leading-normal'}
              fromFontVariationSettings="'wght' 400"
              toFontVariationSettings="'wght' 900"
              containerRef={proximityContainerRef}
              radius={140}
              falloff='linear'
            />
          </div>
      )}
    </div>
    
    {/* Consolidated sections with same background */}
    <div className={`bg-[#07070B] ${unlockBelow ? '' : 'opacity-0 pointer-events-none'}`}>
      <div className="w-full h-full py-20 md:py-16 lg:py-20" ref={hKnowRef}>
        <h2 className="text-white text-left flex justify-start items-start font-bold font-poppins dark:text-neutral-200 text-[2rem] md:text-[2.5rem] lg:text-[2.8rem] mb-6 md:mb-4 lg:mb-6 px-6 md:px-8 lg:px-10 lg:flex lg:justify-center lg:items-center">
          <VariableProximity
            label={'Feature Categories'}
            className={''}
            fromFontVariationSettings="'wght' 400"
            toFontVariationSettings="'wght' 900"
            containerRef={hKnowRef}
            radius={140}
            falloff='linear'
          />
        </h2>
        <div className="max-w-7xl mx-auto">
          {loadCarousel ? (
            <React.Suspense fallback={<div className="h-96 bg-gray-800 rounded-lg animate-pulse" />}>
              <LazyCarousel items={carouselItems} />
            </React.Suspense>
          ) : (
            <div className="h-96 bg-gray-800 rounded-lg animate-pulse" />
          )}
        </div>
      </div>
      
      <div className="relative z-[10]">
        {/* <ArtGallery /> */}
        {/* <SocialMediaSuite /> */}
        <div ref={hFeaturesRef}>
          <p id="features-heading" className="text-white text-left flex justify-start items-start font-bold font-poppins dark:text-neutral-200 text-[2rem] md:text-[2rem] lg:text-[2.5rem] mb-10 md:mb-6 lg:mb-10 px-6 md:px-8 lg:px-10 lg:flex lg:justify-center lg:items-center">
            <VariableProximity
              label={'Explore All Our Features'}
              className={''}
              fromFontVariationSettings="'wght' 400"
              toFontVariationSettings="'wght' 900"
              containerRef={hFeaturesRef}
              radius={140}
              falloff='linear'
            />
          </p>
        </div>
        <div>
          {loadFeatures ? (
            <React.Suspense fallback={<div className="h-96 bg-gray-800 rounded-lg animate-pulse" />}>
              <LazyFeaturesAll />
            </React.Suspense>
          ) : (
            <div className="h-96 bg-gray-800 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Additional ScrollFloat under Features section - ensure visibility even with short content */}
        <div className="relative z-[10] px-8 md:px-6 lg:px-8 py-4 md:py-2 lg:py-6 flex flex-col items-center text-center ">
          <ScrollFloat
            containerClassName="text-center"
            textClassName="text-white font-semibold font-poppins text-[clamp(1.5rem,4vw,2rem)] md:text-[clamp(2.2rem,3vw,2.5rem)] lg:text-[clamp(5rem,7vw,5.5rem)]"
            scrollStart="top 85%"
            scrollEnd="bottom 25%"
          >
            From Imagination To Creation
          </ScrollFloat>
        </div>

        {/* Heading under the second ScrollFloat */}
        <div ref={hHighlightsRef}>
          <p className="text-white text-center flex justify-center items-center font-bold font-poppins dark:text-neutral-200 text-[1.25rem] md:text-[2.5rem] lg:text-[2.8rem] mb-6 mt-10 md:mb-4 lg:mb-6 md:px-4 lg:px-6">
            <VariableProximity
              label={'Check The Latest AI Models Added!'}
              className={''}
              fromFontVariationSettings="'wght' 400"
              toFontVariationSettings="'wght' 900"
              containerRef={hHighlightsRef}
              radius={140}
              falloff='linear'
            />
          </p>
        </div>

        {/* LayoutGrid section */}
        {/* <div className="px-8 md:px-6 lg:px-8 -mt-4 md:-mt-2 lg:-mt-4">
          {loadLayoutGrid ? (
            <React.Suspense fallback={<div className="h-96 bg-gray-800 rounded-lg animate-pulse" />}>
              <LazyLayoutGrid cards={layoutGridCards} />
            </React.Suspense>
          ) : (
            <div className="h-96 bg-gray-800 rounded-lg animate-pulse" />
          )}
        </div> */}

        {/* Workflows */}
        <div ref={hWorkflowsRef}>
          <p className="text-white  text-center flex justify-center items-center font-bold font-poppins dark:text-neutral-200 text-[1.25rem] md:text-[2.5rem] lg:text-[2.8rem] mb-6 md:mb-4 lg:mb-6 md:mt-8 lg:mt-12 md:px-4 lg:px-6">
            <VariableProximity
              label={'Workflows Filtered Based On Your Requirements'}
              className={''}
              fromFontVariationSettings="'wght' 400"
              toFontVariationSettings="'wght' 900"
              containerRef={hWorkflowsRef}
              radius={140}
              falloff='linear'
            />
          </p>


        
        </div>
        <div className="relative w-full">
          <div className="flex gap-6 md:gap-4 lg:gap-6 overflow-x-auto px-4 md:px-3 lg:px-4 py-4 md:py-3 lg:py-4 [scrollbar-width:none] scroll-smooth" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }} ref={workflowScrollRef} onScroll={checkWorkflowScrollability}>
            {workflowCards.map((item, idx) => (
              <CardContainer key={item.title + idx} className="inter-var" containerClassName="py-6">
                <CardBody className="bg-[#0f181f] relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-[24rem] md:w-[20rem] lg:w-[22rem] h-auto rounded-xl p-6 md:p-4 lg:p-5 border">
                  <CardItem translateZ="50" className="text-xl md:text-lg lg:text-xl font-bold text-white dark:text-white">
                    {item.title}
                  </CardItem>
                  <CardItem translateZ="100" rotateX={20} rotateZ={-10} className="w-full mt-4 md:mt-3 lg:mt-4">
                    {item.src ? (
                      <Image
                        src={item.src}
                        height={1000}
                        width={1000}
                        className="h-60 md:h-48 lg:h-56 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                        alt="thumbnail"
                      />
                    ) : (
                      <div className="h-60 md:h-48 lg:h-56 w-full bg-gray-800 rounded-xl flex items-center justify-center">
                        <span className="text-gray-400">Image not available</span>
                      </div>
                    )}
                  </CardItem>
                  <div className="flex justify-end items-center mt-16 md:mt-12 lg:mt-14">
                    <CardItem translateZ="20" translateX={40} as="button" className="px-4 md:px-3 lg:px-4 py-2 md:py-1.5 lg:py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs md:text-[10px] lg:text-xs font-bold">
                      Explore
                    </CardItem>
                  </div>
                </CardBody>
              </CardContainer>
            ))}
          </div>
          {/* Workflow Navigation Arrows */}
          <div className="flex justify-end gap-2 mr-10 md:mr-6 lg:mr-8">
            <button
              onClick={scrollWorkflowLeft}
              className="relative z-40 flex h-10 w-10 md:h-9 md:w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
              disabled={!canScrollWorkflowLeft}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-500"
              >
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
            <button
              onClick={scrollWorkflowRight}
              className="relative z-40 flex h-10 w-10 md:h-9 md:w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
              disabled={!canScrollWorkflowRight}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-500"
              >
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* WorldMap Section */}
        {/* <div className="w-full max-w-7xl mx-auto px-8 md:px-6 lg:px-8 mt-16 md:mt-12 lg:mt-16" ref={hGlobalRef}>
          <h2 className="text-white text-center font-bold font-poppins dark:text-neutral-200 text-[3rem] md:text-[2.5rem] lg:text-[2.8rem] mb-10 md:mb-6 lg:mb-10 md:px-4 lg:px-6">
            <VariableProximity
              label={'Powering users across the globe, one platform everywhere.'}
              className={''}
              fromFontVariationSettings="'wght' 400"
              toFontVariationSettings="'wght' 900"
              containerRef={hGlobalRef}
              radius={140}
              falloff='linear'
            />
          </h2>
          {loadWorldMap ? (
            <React.Suspense fallback={<div className="h-96 bg-gray-800 rounded-lg animate-pulse" />}>
              <LazyWorldMap 
                dots={worldMapDots}
                lineColor="#0ea5e9"
              />
            </React.Suspense>
          ) : (
            <div className="h-96 bg-gray-800 rounded-lg animate-pulse" />
          )}
        </div> */}

        {/* Why choose wildmindAI Section */}
        <div className="w-full max-w-7xl mx-auto px-8 md:px-6 lg:px-8 mt-32 md:mt-20 lg:mt-28" ref={hWhyRef}>
          <h2 className="text-white text-center font-bold font-poppins dark:text-neutral-200 text-[1.5rem] md:text-[2.5rem] lg:text-[2.8rem] mb-6 md:mb-4 lg:mb-6 md:px-4 lg:px-6">
            <VariableProximity
              label={'Why Choose Wild Mind?'}
              className={''}
              fromFontVariationSettings="'wght' 400"
              toFontVariationSettings="'wght' 900"
              containerRef={hWhyRef}
              radius={140}
              falloff='linear'
            />
          </h2>
          <p className="text-white text-center font-medium font-poppins text-xl md:text-lg lg:text-xl mb-8 md:mb-6 lg:mb-8 opacity-90">
            Powerful. Affordable. Built for creators and teams that expect more from AI.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3 lg:gap-4">
            <SpotlightCard className="bg-white/10 border-neutral-800">
              <div className="relative">
                <h3 className="text-neutral-200 font-semibold text-lg md:text-base lg:text-lg mb-3 md:mb-2 lg:mb-3">All-in-One Multimodal AI Platform</h3>
                <p className="text-neutral-400 text-sm md:text-xs lg:text-sm leading-relaxed text-justify">Get everything you need: text, image, branding collaterals, video, audio, and more!
                    Over 20+ Generative AI features in one powerful AI workspace.
                    No need to juggle tools or platforms.
                </p>
              </div>
            </SpotlightCard>
            
            <SpotlightCard className="bg-white/10 border-neutral-800">
              <div className="relative">
                <h3 className="text-neutral-200 font-semibold text-lg md:text-base lg:text-lg mb-3 md:mb-2 lg:mb-3">Industry-Leading Value for Price</h3>
                <p className="text-neutral-400 text-sm md:text-xs lg:text-sm leading-relaxed text-justify">We offer the most affordable AI platform on the market. No competitor matches the features and performance you get at our price point.</p>
              </div>
            </SpotlightCard>
            
            <SpotlightCard className="bg-white/10 border-neutral-800">
              <div className="relative">
                <h3 className="text-neutral-200 font-semibold text-lg md:text-base lg:text-lg mb-3 md:mb-2 lg:mb-3">Flexible Credit System with On-Demand Top-Ups</h3>
                <p className="text-neutral-400 text-sm md:text-xs lg:text-sm leading-relaxed text-justify">Run out of credits? Buy exactly what you need, whether it&apos;s 1,000 or 10,000 credits. No rigid tiers, no waste, just full control.</p>
              </div>
            </SpotlightCard>
            
            <SpotlightCard className="bg-white/10 border-neutral-800">
              <div className="relative">
                <h3 className="text-neutral-200 font-semibold text-lg md:text-base lg:text-lg mb-3 md:mb-2 lg:mb-3">Always Up-to-Date with the Best AI Models</h3>
                <p className="text-neutral-400 text-sm md:text-xs lg:text-sm leading-relaxed text-justify">We integrate the world&apos;s most advanced AI models and continuously upgrade to the latest versions, ensuring you always achieve the best possible results.</p>
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* WobbleCard Section */}
        <div className="w-full max-w-7xl mx-auto px-8 md:px-6 lg:px-8 mt-32 md:mt-20 lg:mt-28" ref={hPricingRef}>
          <h2 className="text-white text-center font-bold font-poppins dark:text-neutral-200 text-[1.5rem] md:text-[2.5rem] lg:text-[2.8rem] mb-10 md:mb-6 lg:mb-10 md:px-4 lg:px-6">
            <VariableProximity
              label={'Unmatched Value, Unbeatable Pricing Plans.'}
              className={''}
              fromFontVariationSettings="'wght' 400"
              toFontVariationSettings="'wght' 900"
              containerRef={hPricingRef}
              radius={140}
              falloff='linear'
            />
          </h2>
          {loadPricing ? (
            <React.Suspense fallback={<div className="h-96 bg-gray-800 rounded-lg animate-pulse" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-3 lg:gap-4 max-w-7xl mx-auto w-full">
                <LazyWobbleCard
                  containerClassName="col-span-1 lg:col-span-2 md:col-span-2 h-full bg-pink-800 min-h-[500px] md:min-h-[350px] lg:min-h-[400px]"
                  className=""
                >
                  <div className="max-w-xs md:max-w-sm lg:max-w-xs">
                    <h2 className="text-left text-balance text-base md:text-2xl lg:text-2xl font-semibold tracking-[-0.015em] text-white font-poppins">
                      Free Plan
                    </h2>
                    <p className="mt-4 md:mt-3 lg:mt-4 font-poppins text-neutral-200 text-justify font-medium text-sm md:text-sm lg:text-sm">
                    Get started with 2,100 free credits and access to our full creative suite. No cost, no commitment, just pure AI power from day one. Generate 100+ Images monthly with the free plan
                    </p>
                  </div>
                  <div className="absolute -right-16 md:-right-[40%] lg:-right-[35%] -bottom-20 mb:static mb-10 mb:mt-6 mb:w-[90%] mb:max-w-[320px] mb:mx-auto mobile:w-[85%]">
                    <Image
                      src="https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fpricing%2Ffree%20plan%20(1).jpg?alt=media&token=24ca1409-6f04-45d5-a9c4-f891a7f6fcc6"
                      width={500}
                      height={500}
                      alt="Free pricing plan artwork"
                      className="grayscale filter object-contain rounded-2xl scale-90"
                      unoptimized
                    />
                  </div>
                </LazyWobbleCard>
                <LazyWobbleCard containerClassName="col-span-1 md:col-span-1 min-h-[300px] md:min-h-[250px] lg:min-h-[280px] bg-[#288F1A]">
                  <h2 className="max-w-80 text-left text-balance text-base md:text-2xl lg:text-2xl font-semibold tracking-[-0.015em] text-white font-poppins">
                    Student Discount
                  </h2>
                  <p className="mt-4 md:mt-3 lg:mt-4 max-w-[26rem] text-base/6 md:text-sm lg:text-base text-neutral-200 text-justify font-medium">
                  Students save 33% on all plans — verified student ID required. Unlock pro-level AI tools at a student-friendly price.
                  </p>
                </LazyWobbleCard>
                <LazyWobbleCard containerClassName="col-span-1 lg:col-span-3 md:col-span-3 bg-[#3F2185] min-h-[500px] md:min-h-[400px] lg:min-h-[500px]">
                  <div className="max-w-sm md:max-w-md lg:max-w-sm">
                    <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-2xl lg:text-2xl font-semibold tracking-[-0.015em] text-white font-poppins">
                      Explore All Plans
                    </h2>
                    <p className="mt-4 md:mt-3 lg:mt-4 max-w-[26rem] text-base/6 md:text-sm lg:text-base text-neutral-200 text-justify mr-2 font-medium">
                    From hobbyist to enterprise, our plans <br/>scale with your creativity. Get more<br/>credits, more power, more freedom — <br/>see what fits you best
                    </p>
                  </div>
                  
                  {/* Pricing Plans Button - Bottom Left */}
                  <button className="absolute font-poppins text-sm bottom-6 left-10 bg-white text-[#3F2185] font-medium px-4 py-2 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg">
                    Pricing Plans
                  </button>
                  
                  <Image
                    src="https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fpricing%2Fexplore_plans%20(1).jpg?alt=media&token=9c03c318-b7c3-4326-b53f-7310e70815bc"
                    width={500}
                    height={500}
                    alt="Explore pricing plans artwork"
                    className="grayscale filter absolute -right-10 md:-right-[20%] lg:-right-[20%] -bottom-10 object-contain rounded-2xl mb:static mb:mt-6 mb:w-[80%] mb:max-w-[320px] mb:mx-auto mobile:w-[85%]"
                    unoptimized
                  />
                </LazyWobbleCard>
              </div>
            </React.Suspense>
          ) : (
            <div className="h-96 bg-gray-800 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Get Started for Free Button */}
       
        {/* FAQ */}
        <div ref={hFAQRef} className="w-full max-w-7xl mx-auto px-8 md:px-6 lg:px-8 mt-32 md:mt-20 lg:mt-28">
          {loadFAQ ? (
            <React.Suspense fallback={<div className="h-96 bg-gray-800 rounded-lg animate-pulse" />}>
              <LazyFAQ />
            </React.Suspense>
          ) : (
            <div className="h-96 bg-gray-800 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Circular Gallery (same placement as landingPage) */}
        <div className="w-full max-w-10xl mx-auto px-8 md:px-6 lg:px-8 mt-16 md:mt-12 lg:mt-16" ref={hArtGalleryRef}>
          <div className="relative">
            {/* translucent overlay and big label covering both galleries */}
            <div className="pointer-events-none absolute inset-0 z-[35] flex items-center justify-center">
              <div className="absolute inset-0" />
                <span className="relative block text-white font-bold text-4xl md:text-[10rem] lg:text-[10rem] xl:text-[9rem]">
                <VariableProximity
                  label={'Explore Art Gallery'}
                  className={''}
                  fromFontVariationSettings="'wght' 400"
                  toFontVariationSettings="'wght' 900"
                  containerRef={hArtGalleryRef}
                  radius={140}
                  falloff='linear'
                />
              </span>
            </div>

            {loadGallery ? (
              <>
                {/* First gallery */}
                <div className="relative mt-30 z-[30]">
                  <div style={{ height: '600px', position: 'relative' }} className="opacity-40">
                    <React.Suspense fallback={<div className="h-full bg-gray-800 rounded-lg animate-pulse" />}>
                      <LazyCircularGallery
                        bend={0}
                        textColor="#ffffff"
                        borderRadius={0.05}
                        scrollEase={0.02}
                        imageGap={0.8}
                        items={[
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex9.jpg?alt=media&token=08712171-a305-4bf5-969d-f8b548a65c81', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex8.jpg?alt=media&token=7deea9d9-80ce-4f43-ab39-25fd93ef5b82', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex7.jpg?alt=media&token=65905b8e-b572-4473-823a-a18306a3666b', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex6.jpg?alt=media&token=afeeeb2a-0a1e-41e2-a1ef-87bd87b87783', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex5.jpg?alt=media&token=e6a9e826-fe91-40fa-8347-2b61d938f468', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex4.jpg?alt=media&token=a383f425-2a12-42c8-ae0d-ad39493ef90e', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex3.jpg?alt=media&token=09f28b25-8635-4ce9-ba5b-1050118b496a', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex2.jpg?alt=media&token=f0ef5806-af7e-460c-b710-e28d9284ea55', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex15.jpg?alt=media&token=f1031ad3-9c87-4ed3-8d47-9f866e2ad783', text: '' },
                        ]}
                      />
                    </React.Suspense>
                  </div>
                </div>
                {/* Second gallery below, opposite direction */}
                <div className="relative -mt-[96px] md:-mt-[140px] lg:-mt-[180px] z-[30]">
                  <div style={{ height: '600px', position: 'relative' }} className="opacity-40">
                    <React.Suspense fallback={<div className="h-full bg-gray-800 rounded-lg animate-pulse" />}>
                      <LazyCircularGallery
                        bend={0}
                        textColor="#ffffff"
                        borderRadius={0.05}
                        scrollEase={0.02}
                        autoScrollSpeed={-0.05}
                        imageGap={0.8}
                        items={[
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F01.jpg?alt=media&token=1bc68638-d1d8-48b7-9f91-99eb471e3101', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F03.jpg?alt=media&token=21108bdd-17ba-47f3-9063-0096f06a92b4', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F04.jpg?alt=media&token=effb0258-6e26-4765-ad7b-50d743f281e7', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F05.jpg?alt=media&token=dfd47617-166c-4d24-a511-80a9255b3b50', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F06.jpg?alt=media&token=8f46f11a-b300-44ac-9d5f-709211b9ef45', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F07.jpg?alt=media&token=bec3c6e5-3f1f-4226-a42b-78e15b0b8ee3', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F08.jpg?alt=media&token=3b844060-4bc5-43ee-b0fa-130fad0fd25a', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F09.jpg?alt=media&token=b6b65df7-046d-4ebf-b48f-c96415e1e181', text: '' },
                          { image: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F10.jpg?alt=media&token=2c311119-52ff-4afb-8564-3157496e500f', text: '' },
                        ]}
                      />
                    </React.Suspense>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-96 bg-gray-800 rounded-lg animate-pulse" />
            )}
        </div>
      </div>

        <div className="relative z-[10] -mt-8">
          <Subscribe />
        </div>

        {/* Footer */}
        <div className="relative z-[10] bg-[#0a1116] mt-16">
          <FooterNew />
        </div>
      </div>
    </div>

    {/* Floating Get Started (mobile only) */}
    <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[1100]">
      <HoverBorderGradient
        containerClassName="rounded-full border border-[#1C303D] dark:border-white/20"
        as="button"
        duration={1}
        clockwise={false}
        glowBlurPx={0.5}
        innerFillClassName="bg-[#1C303D]"
        className="text-white flex items-center space-x-2 px-6 py-3 text-sm rounded-full shadow-lg"
        onClick={onGetStarted}
      >
        <span>Get Started</span>
      </HoverBorderGradient>
    </div>
    </div>
  )
}

export default LandingPage;
