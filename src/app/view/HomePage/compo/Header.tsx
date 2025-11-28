import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getImageUrl } from '../routes'

const Header = () => {
  const router = useRouter();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [videoStartTime, setVideoStartTime] = useState<number>(Date.now());
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [preloadedVideos, setPreloadedVideos] = useState<Set<number>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningRef = useRef(false);

  // Memoize video data to prevent recreation on every render
  const videoData = useMemo(() => [
    {
      videoSrc: getImageUrl('header', 'heroVideo'),
      title: "Introducing Kling",
      description: "Revolutionary AI video generation that brings your creative visions to life with unprecedented realism and cinematic quality.",
      buttonText: "Try Now"
    },
    {
      videoSrc: getImageUrl('header', 'heroVideo2'), // You'll need to add more videos
      title: "Introducing to Sora by OpenAI",
      description: "Experience the future of video creation with Sora's advanced AI that generates stunning, high-quality videos from simple text prompts.",
      buttonText: "Get Started"
    },
    {
      videoSrc: getImageUrl('header', 'heroVideo3'),
      title: "Introducing to Veo3 by Google",
      description: "Discover Google's latest breakthrough in AI video generation - Veo3 delivers professional-grade videos with incredible detail and motion.",
      buttonText: "Explore"
    }
  ], []); // Empty deps - video data is static

  // Preload all videos immediately for better performance (optimized)
  useEffect(() => {
    const preloadAllVideos = () => {
      videoData.forEach((videoItem, index) => {
        if (!preloadedVideos.has(index) && videoItem.videoSrc) {
          const video = document.createElement('video');
          video.src = videoItem.videoSrc;
          video.preload = 'auto';
          video.muted = true;
          video.load();
          
          const handleCanPlayThrough = () => {
            setPreloadedVideos(prev => {
              const next = new Set(prev);
              next.add(index);
              return next;
            });
            video.removeEventListener('canplaythrough', handleCanPlayThrough);
          };
          
          video.addEventListener('canplaythrough', handleCanPlayThrough);
        }
      });
    };

    preloadAllVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Safe transition function to prevent race conditions (memoized)
  const safeTransition = useCallback((fromIndex: number, toIndex: number, source: string) => {
    if (isTransitioningRef.current) {
      return;
    }
    
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentVideoIndex(toIndex);
      setIsTransitioning(false);
      isTransitioningRef.current = false;
      transitionTimeoutRef.current = null;
    }, 1000);
  }, []); // Stable reference

  // Auto-slide functionality with smooth transition (fallback for longer videos)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-advance if not currently transitioning
      if (!isTransitioningRef.current) {
        const nextIndex = (currentVideoIndex + 1) % videoData.length;
        safeTransition(currentVideoIndex, nextIndex, 'Timer');
      }
    }, 10000); // 10 seconds fallback

    return () => {
      clearInterval(interval);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [videoData.length, currentVideoIndex]);

  const handleTryNowClick = useCallback(() => {
    router.push('/text-to-image');
  }, [router]);

  const handleDotClick = useCallback((index: number) => {
    if (index !== currentVideoIndex && !isTransitioningRef.current) {
      safeTransition(currentVideoIndex, index, 'Dot Click');
    }
  }, [currentVideoIndex, safeTransition]);

  // Memoize current video to prevent unnecessary recalculations
  const currentVideo = useMemo(() => videoData[currentVideoIndex], [videoData, currentVideoIndex]);

  // Memoize video event handlers to prevent recreation
  const handleVideoLoadStart = useCallback(() => {
    setVideoStartTime(Date.now());
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleVideoPlay = useCallback(() => {
    setIsVideoLoading(false);
  }, []);

  const handleVideoEnded = useCallback(() => {
    const timePlayed = Date.now() - videoStartTime;
    if (timePlayed >= 3000 && !isTransitioningRef.current) {
      const nextIndex = (currentVideoIndex + 1) % videoData.length;
      safeTransition(currentVideoIndex, nextIndex, 'Video End');
    }
  }, [videoStartTime, currentVideoIndex, videoData.length, safeTransition]);

  // Preload logic moved to layout.tsx


  return (
    <div className="w-full relative">
      {/* Video wrapper with right padding */}
      <div className="px-4 md:pr-0 md:pl-12 md:mt-0 md:ml-12">
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl md:mt-0 mt-10 min-h-[20vh] md:min-h-[60vh] max-h-[80vh]" style={{ aspectRatio: '16/9' }}>
          {currentVideo.videoSrc && (
            <video
              ref={videoRef}
              key={currentVideoIndex} // Force re-render when video changes
              src={currentVideo.videoSrc}
              autoPlay
              muted
              playsInline
              preload="auto"
              // LCP optimization: fetchPriority=high for first video (LCP element)
              {...(currentVideoIndex === 0 ? { fetchPriority: 'high' as any } : {})}
              style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '200px' }}
              onLoadStart={handleVideoLoadStart}
              onCanPlay={handleVideoCanPlay}
              onPlay={handleVideoPlay}
              onEnded={handleVideoEnded}
              className={`rounded-2xl md:rounded-3xl md:transform-gpu will-change-transform transition-transform duration-2000 ease-in-out ${
                isTransitioning ? '-translate-x-full' : 'translate-x-0'
              }`}
            />
          )}

          {/* Hidden preloader for the next video to ensure instant start */}
          {useMemo(() => {
            const nextIndex = (currentVideoIndex + 1) % videoData.length;
            const nextSrc = videoData[nextIndex]?.videoSrc;
            return nextSrc ? (
              <video
                key={`preload-${nextIndex}`}
                src={nextSrc}
                preload="metadata"
                muted
                playsInline
                aria-hidden="true"
                className="absolute w-0 h-0 opacity-0 pointer-events-none"
              />
            ) : null;
          }, [currentVideoIndex, videoData])}

          {/* Gradient overlay from bottom to top */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Text Overlay - Centered above the video */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-10 md:mt-64 mt-20 px-4 min-h-[150px] md:min-h-[200px]">
        {/* <h1 className={`text-lg md:text-4xl font-medium md:mb-2 mb-1 md:mt-6 mt-2 transition-opacity duration-1000 ease-in-out min-h-[40px] md:min-h-[48px] max-h-[60px] ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}>
          {currentVideo.title}
        </h1>
        <p className={`text-[11px] md:text-xl md:mb-4 mb-2 md:px-0 px-2 transition-opacity duration-1000 ease-in-out delay-150 min-h-[40px] md:min-h-[56px] max-h-[80px] leading-[1.4] ${
          isTransitioning ? 'opacity-0' : 'opacity-90'
        }`}>
          {currentVideo.description}
        </p> */}
        <button 
          onClick={handleTryNowClick}
          className={`bg-white/5 backdrop-blur-xl hover:bg-blue-700 text-white md:px-4 px-2 md:py-2 py-1 rounded-full md:text-md text-xs font-base transition-opacity duration-1000 ease-in-out delay-300 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {currentVideo.buttonText}
        </button>
      </div>

      {/* Dot Navigation */}
      <div className="absolute -bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {videoData.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 ${
              index === currentVideoIndex
                ? 'bg-white scale-125'
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default Header
