import React, { useState, useEffect, useRef } from 'react'
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

  // Video data with different content for each slide
  const videoData = [
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
  ];

  // Preload all videos immediately for better performance
  useEffect(() => {
    const preloadAllVideos = () => {
      videoData.forEach((videoData, index) => {
        if (!preloadedVideos.has(index)) {
          console.log(`Preloading video ${index}`);
          const video = document.createElement('video');
          video.src = videoData.videoSrc;
          video.preload = 'auto';
          video.muted = true;
          video.load();
          
          video.addEventListener('canplaythrough', () => {
            console.log(`Preloaded video ${index}`);
            setPreloadedVideos(prev => new Set([...prev, index]));
          });
        }
      });
    };

    preloadAllVideos();
  }, [videoData]);

  // Safe transition function to prevent race conditions
  const safeTransition = (fromIndex: number, toIndex: number, source: string) => {
    if (isTransitioningRef.current) {
      console.log(`Transition blocked from ${source}: already transitioning`);
      return;
    }
    
    console.log(`${source}: transitioning from ${fromIndex} to ${toIndex}`);
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
  };

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

  const handleTryNowClick = () => {
    router.push('/text-to-image');
  };

  const handleDotClick = (index: number) => {
    if (index !== currentVideoIndex && !isTransitioningRef.current) {
      safeTransition(currentVideoIndex, index, 'Dot Click');
    }
  };

  const currentVideo = videoData[currentVideoIndex];

  // Preload first video for LCP optimization (only once on mount)
  useEffect(() => {
    if (currentVideoIndex === 0 && currentVideo.videoSrc) {
      const existingLink = document.head.querySelector(`link[rel="preload"][as="video"][href="${currentVideo.videoSrc}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = currentVideo.videoSrc;
        document.head.appendChild(link);
      }
    }
  }, []); // Only run once on mount

  return (
    <div className="w-full relative">
      {/* Video wrapper with right padding */}
      <div className="pr-6 md:pr-12 mt-4 ml-12">
        <div className="relative overflow-hidden rounded-3xl" style={{ aspectRatio: '16/9', minHeight: '60vh' }}>
          {currentVideo.videoSrc && (
            <video
              ref={videoRef}
              key={currentVideoIndex} // Force re-render when video changes
              src={currentVideo.videoSrc}
              autoPlay
              muted
              playsInline
              preload="auto"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onLoadStart={() => {
                // Reset start time when video starts loading
                setVideoStartTime(Date.now());
                console.log(`Video ${currentVideoIndex} started loading`);
              }}
              onCanPlay={() => {
                console.log(`Video ${currentVideoIndex} can play`);
                // Force play to ensure immediate start
                if (videoRef.current && videoRef.current.paused) {
                  videoRef.current.play().catch(console.error);
                }
              }}
              onPlay={() => {
                console.log(`Video ${currentVideoIndex} started playing`);
              }}
              onEnded={() => {
                // Only auto-advance if video has been playing for at least 3 seconds
                const timePlayed = Date.now() - videoStartTime;
                console.log(`Video ${currentVideoIndex} ended. Time played: ${timePlayed}ms`);
                if (timePlayed >= 3000 && !isTransitioningRef.current) {
                  const nextIndex = (currentVideoIndex + 1) % videoData.length;
                  safeTransition(currentVideoIndex, nextIndex, 'Video End');
                } else {
                  console.log(`Video too short or already transitioning, waiting for timer`);
                }
              }}
              className={`rounded-3xl transform-gpu will-change-transform transition-transform duration-2000 ease-in-out ${
                isTransitioning ? '-translate-x-full' : 'translate-x-0'
              }`}
            />
          )}

          {/* Hidden preloader for the next video to ensure instant start */}
          {(() => {
            const nextIndex = (currentVideoIndex + 1) % videoData.length;
            const nextSrc = videoData[nextIndex]?.videoSrc;
            return nextSrc ? (
              <video
                key={`preload-${nextIndex}`}
                src={nextSrc}
                preload="auto"
                muted
                playsInline
                aria-hidden="true"
                className="absolute w-0 h-0 opacity-0 pointer-events-none"
              />
            ) : null;
          })()}

          {/* Gradient overlay from bottom to top */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Text Overlay - Centered above the video */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-10 mt-64" style={{ minHeight: '200px' }}>
        <h1 className={`text-3xl md:text-4xl font-medium mb-2 mt-6 transition-opacity duration-1000 ease-in-out ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`} style={{ minHeight: '48px' }}>
          {currentVideo.title}
        </h1>
        <p className={`text-lg md:text-xl mb-4 transition-opacity duration-1000 ease-in-out delay-150 ${
          isTransitioning ? 'opacity-0' : 'opacity-90'
        }`} style={{ minHeight: '56px' }}>
          {currentVideo.description}
        </p>
        <button 
          onClick={handleTryNowClick}
          className={`bg-[#1C303D] hover:bg-blue-700 text-white px-4 py-2 rounded-full text-md font-medium transition-opacity duration-1000 ease-in-out delay-300 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {currentVideo.buttonText}
        </button>
      </div>

      {/* Dot Navigation */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {videoData.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
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
