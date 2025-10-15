"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { API_BASE } from "../HomePage/routes"

import SignInForm from "./sign-up-form"

type PublicItem = {
  id: string;
  prompt?: string;
  generationType?: string;
  model?: string;
  aspectRatio?: string;
  frameSize?: string;
  aspect_ratio?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { uid?: string; username?: string; displayName?: string; photoURL?: string };
  images?: { id: string; url: string; originalUrl?: string; storagePath?: string }[];
};

type ArtStationImage = {
  url: string;
  username: string;
  displayName?: string;
  timestamp: number;
};

type CarouselCache = {
  images: ArtStationImage[];
  ts: number; // epoch ms when cached
  index?: number; // last viewed index
};

export default function SignUp() {
  const [imageError, setImageError] = useState(false)
  const randomMode = true
  const [carouselImages, setCarouselImages] = useState<ArtStationImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [nextImage, setNextImage] = useState<ArtStationImage | null>(null)
  const [isSliding, setIsSliding] = useState(false)
  const [order, setOrder] = useState<number[]>([])
  const isFetchingRef = useRef(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const recentUrlsRef = useRef<string[]>([])
  const lastSeenRef = useRef<Set<string>>(new Set())
  const [currentImage, setCurrentImage] = useState<ArtStationImage | null>(null)
  // Utility: shuffle array (Fisher–Yates). Optionally avoid a specific first url.
  const shuffleImages = (list: ArtStationImage[], avoidFirstUrl?: string): ArtStationImage[] => {
    const a = list.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    if (avoidFirstUrl && a.length > 1 && a[0]?.url === avoidFirstUrl) {
      // swap first with a random later item to avoid immediate repeat
      const k = 1 + Math.floor(Math.random() * (a.length - 1))
      ;[a[0], a[k]] = [a[k], a[0]]
    }
    try { console.log('[SignupCarousel] Shuffled batch size:', a.length, 'avoidFirstUrl:', avoidFirstUrl) } catch {}
    return a
  }

  // Check if aspect ratio is vertical (portrait)
  const isVerticalAspectRatio = (aspectRatio?: string): boolean => {
    if (!aspectRatio) return false;
    
    // Common vertical aspect ratios
    const verticalRatios = ['9:16', '3:4', '2:3', '4:5', '1:1'];
    
    // Check if it matches common vertical ratios
    if (verticalRatios.includes(aspectRatio)) return true;
    
    // Parse ratio and check if height > width
    const parts = aspectRatio.split(':');
    if (parts.length === 2) {
      const width = parseFloat(parts[0]);
      const height = parseFloat(parts[1]);
      return height >= width;
    }
    
    return false;
  };

  // Fetch art station images
  // Persist carousel position (unused in randomMode, safe to keep)
  useEffect(() => {
    try {
      if (carouselImages.length > 0) {
        const existingRaw = localStorage.getItem('artStationSignupCarousel')
        const existing: CarouselCache | null = existingRaw ? JSON.parse(existingRaw) : null
        const toStore: CarouselCache = {
          images: existing?.images || carouselImages,
          ts: existing?.ts || Date.now(),
          index: currentIndex,
        }
        localStorage.setItem('artStationSignupCarousel', JSON.stringify(toStore))
      }
    } catch {}
  }, [currentIndex, carouselImages])

  // Fetch a batch of public images for the carousel
  const fetchArtStationImages = async (opts?: { append?: boolean }) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    try {
      const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
      const url = new URL(`${baseUrl}/api/feed`);
      url.searchParams.set('limit', '50'); // larger batch to enlarge pool
      if (opts?.append && nextCursor) {
        url.searchParams.set('cursor', nextCursor)
      }
      
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 5000)
      const res = await fetch(url.toString(), { 
        credentials: 'include',
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeoutId));
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const payload = data?.data || data;
      const items: PublicItem[] = payload?.items || [];
      const newCursor = payload?.meta?.nextCursor || payload?.nextCursor
      
      // Keep ANY items that have at least one image (no aspect ratio filter)
      const imageItems = items.filter(item => Array.isArray(item.images) && item.images.length > 0)
      
      if (imageItems.length === 0) {
        console.warn('No vertical images found in art station');
        setIsLoading(false);
        return;
      }
      
      // Map + dedupe by URL to avoid repeats, then shuffle
      const seen = new Set<string>()
      const mapped: ArtStationImage[] = imageItems.map((it: any) => ({
        url: it.images?.[0]?.url,
        username: it.createdBy?.username || it.createdBy?.displayName || 'Unknown Creator',
        displayName: it.createdBy?.displayName,
        timestamp: Date.now()
      }))
      .filter(x => Boolean(x.url) && !seen.has(x.url!) && seen.add(x.url!))

      if (mapped.length > 0) {
        try { console.log('[SignupCarousel] Mapped unique vertical images:', mapped.length) } catch {}
        const shuffled = shuffleImages(mapped)
        setCarouselImages(prev => {
          if (opts?.append) {
            const existing = new Set(prev.map(p => p.url))
            const appended = [...prev, ...shuffled.filter(s => !existing.has(s.url))]
            try { console.log('[SignupCarousel] Appending images. prev:', prev.length, 'added:', appended.length - prev.length) } catch {}
            return appended
          }
          try { console.log('[SignupCarousel] Setting initial images:', shuffled.length) } catch {}
          return shuffled
        })
        setNextCursor(newCursor)
        setHasMore(Boolean(newCursor))
        // Try resume position from cache
        try {
          const cachedRaw = localStorage.getItem('artStationSignupCarousel')
          const cached: CarouselCache | null = cachedRaw ? JSON.parse(cachedRaw) : null
          const withinHour = cached && Date.now() - cached.ts < 60 * 60 * 1000
          const sourceLen = (opts?.append ? (carouselImages.length + shuffled.length) : shuffled.length)
          const startIndex = withinHour && typeof cached?.index === 'number' ? Math.min(Math.max(cached.index!, 0), sourceLen - 1) : 0
          setCurrentIndex(startIndex)
        } catch {
          setCurrentIndex(0)
        }
        // Preload the first two images
        const preloadList = (opts?.append ? [...carouselImages.slice(-1), ...shuffled.slice(0, 1)] : shuffled.slice(0, 2))
        preloadList.forEach(m => { const img = new window.Image(); img.src = m.url })
        // Write fresh cache
        try {
          const cache: CarouselCache = { images: (opts?.append ? (carouselImages.concat(shuffled)) : shuffled), ts: Date.now(), index: 0 }
          localStorage.setItem('artStationSignupCarousel', JSON.stringify(cache))
        } catch {}

        // If this was an initial load and there are more pages, immediately append next page to make it feel infinite
        if (!opts?.append && newCursor) {
          try { console.log('[SignupCarousel] Fetching next page immediately to enlarge pool...') } catch {}
          fetchArtStationImages({ append: true })
        }
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch art station image:', error);
      // Fallback to stale cache if available
      try {
        const cachedRaw = localStorage.getItem('artStationSignupCarousel')
        const cached: CarouselCache | null = cachedRaw ? JSON.parse(cachedRaw) : null
        if (cached?.images?.length) {
          setCarouselImages(cached.images)
          setCurrentIndex(cached.index || 0)
          setIsLoading(false)
          return
        }
      } catch {}
      setIsLoading(false)
    }
    finally {
      isFetchingRef.current = false
    }
  };

  // Simple RANDOM fetcher over the whole feed using random cursor hops
  const fetchOneRandomImage = async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    try {
      const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
      let cursor: string | undefined = undefined
      // Random number of cursor hops (1-4) to sample anywhere in the feed
      const hops = 1 + Math.floor(Math.random() * 4)
      let chosen: ArtStationImage | null = null
      for (let i = 0; i < hops; i++) {
        const url = new URL(`${baseUrl}/api/feed`)
        url.searchParams.set('limit', '50')
        if (cursor) url.searchParams.set('cursor', cursor)
        url.searchParams.set('_t', `${Date.now()}-${i}`)
        const controller = new AbortController()
        const timeoutId = window.setTimeout(() => controller.abort(), 6000)
        const res = await fetch(url.toString(), { credentials: 'include', signal: controller.signal }).finally(() => window.clearTimeout(timeoutId))
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const payload = data?.data || data
        const items: PublicItem[] = payload?.items || []
        cursor = payload?.meta?.nextCursor || payload?.nextCursor
        const mapped: ArtStationImage[] = (items || [])
          .filter(it => it.images && it.images[0] && typeof it.images[0].url === 'string' && it.images[0].url)
          .map(it => ({ url: String(it.images![0]!.url), username: it.createdBy?.username || it.createdBy?.displayName || 'Unknown Creator', displayName: it.createdBy?.displayName, timestamp: Date.now() }))
        if (mapped.length > 0) {
          chosen = mapped[Math.floor(Math.random() * mapped.length)]
        }
        // If no more pages, stop early
        if (!cursor) break
      }
      if (chosen) {
        setCurrentImage(chosen)
        try { console.log('[SignupCarousel] Random pick (cursor-walk) hops:', hops, 'url:', String(chosen.url)) } catch {}
      }
      setIsLoading(false)
    } catch (e) {
      console.error('[SignupCarousel] Random fetch error', e)
      setIsLoading(false)
    } finally {
      isFetchingRef.current = false
    }
  }

  // Initial load (random mode)
  useEffect(() => {
    if (randomMode) {
      fetchOneRandomImage().then((first: any) => {
        if (first) setCurrentImage(first as ArtStationImage)
      })
      const id = window.setInterval(() => {
        fetchOneRandomImage().then((img: any) => {
          const theImg = img as ArtStationImage | null
          if (!theImg) return
          setNextImage(theImg)
          setIsSliding(true)
          setTimeout(() => {
            setCurrentImage(theImg)
            setNextImage(null)
            setIsSliding(false)
          }, 500)
        })
      }, 8000)
      return () => window.clearInterval(id)
    } else {
      try {
        const cachedRaw = localStorage.getItem('artStationSignupCarousel')
        const cached: CarouselCache | null = cachedRaw ? JSON.parse(cachedRaw) : null
        const withinHour = cached && Date.now() - cached.ts < 60 * 60 * 1000
        if (withinHour && cached?.images?.length) {
          setCarouselImages(cached.images)
          setCurrentIndex(cached.index || 0)
          setIsLoading(false)
          setTimeout(() => { fetchArtStationImages() }, 0)
          return
        }
      } catch {}
      fetchArtStationImages();
    }
  }, []);

  // Auto-advance carousel (disabled in randomMode)
  useEffect(() => {
    if (randomMode || carouselImages.length === 0) return

    // Slide timer
    const slideMs = 8000
    const slideId = window.setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(prev => {
          let queue = order
          if (!queue || queue.length === 0) {
            // Build a fresh shuffled order excluding the current index to prevent immediate repeat
            const all = Array.from({ length: carouselImages.length }, (_, i) => i)
            const startExcluded = all.filter(i => i !== prev)
            // Fisher–Yates
            for (let i = startExcluded.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1))
              ;[startExcluded[i], startExcluded[j]] = [startExcluded[j], startExcluded[i]]
            }
            queue = startExcluded
          }
          const nextIdx = queue[0]
          setOrder(queue.slice(1))
          const chosenUrl = carouselImages[nextIdx]?.url
          try { console.log('[SignupCarousel] Slide choose idx:', nextIdx, 'url:', chosenUrl, 'queueLeft:', queue.length - 1) } catch {}
          // If queue is getting short and we have more pages, fetch next page and rebuild queue soon
          if (queue.length < 3 && hasMore && !isFetchingRef.current) {
            fetchArtStationImages({ append: true })
          }
          return typeof nextIdx === 'number' ? nextIdx : prev
        })
        setIsTransitioning(false)
        // Preload next image
        const next = carouselImages[(order[0] ?? 0)]
        if (next?.url) { const img = new window.Image(); img.src = next.url }
      }, 400) // brief fade duration sync
    }, slideMs)

    // Hourly refresh of the feed to keep it fresh
    return () => {
      window.clearInterval(slideId)
    }
  }, [carouselImages, order])

  // When images list changes (e.g., appended), rebuild order (disabled in randomMode)
  useEffect(() => {
    if (randomMode || carouselImages.length === 0) return
    const current = currentIndex
    const indices = Array.from({ length: carouselImages.length }, (_, i) => i).filter(i => i !== current)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    setOrder(indices)
  }, [carouselImages.length])

  // Remove old hourly timer (not needed in randomMode)
  useEffect(() => {
    return () => {}
  }, [])

  return (
    <main className="flex min-h-screen bg-[#07070B] w-[100%]">
      {/* Left Side - Form */}
      <div className="w-[60%] min-h-screen relative z-20 bg-[#07070B] flex justify-center items-center">

        <SignInForm />

      </div>

      {/* Right Side - Image */}
      <div className="flex-1 min-h-screen relative bg-[#07070B] w-[40%] z-10">
        <div className="absolute inset-0 rounded-tl-[50px] rounded-bl-[50px] overflow-hidden pointer-events-none">
          {!isLoading && !imageError && (randomMode ? Boolean(currentImage?.url) : carouselImages.length > 0) ? (
            randomMode ? (
              <div className="absolute inset-0 overflow-hidden">
                {currentImage?.url && (
                  <Image
                    key={`curr-${currentImage.url}`}
                    src={currentImage.url}
                    alt="Art Station Generation"
                    fill
                    className={`object-cover object-[center_25%] scale-100 transition-transform duration-500 ${isSliding ? 'translate-x-full' : 'translate-x-0'}`}
                    priority
                    onError={() => setImageError(true)}
                  />
                )}
                {nextImage?.url && (
                  <Image
                    key={`next-${nextImage.url}`}
                    src={nextImage.url}
                    alt="Art Station Generation Next"
                    fill
                    className={`object-cover object-[center_25%] scale-100 transition-transform duration-500 ${isSliding ? 'translate-x-0' : '-translate-x-full'}`}
                    priority
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
            ) : (
              <Image 
                key={(carouselImages[currentIndex]?.url) as string}
                src={(carouselImages[currentIndex]?.url) as string} 
                alt="Art Station Generation" 
                fill 
                className={`object-cover object-[center_25%] scale-100 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`} 
                priority 
                onError={() => setImageError(true)}
              />
            )
          ) : imageError || (!isLoading && (randomMode ? !currentImage : carouselImages.length === 0)) ? (
            // Fallback to original static image if art station fails
            <Image 
              src="https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fsignup%2F3.png?alt=media&token=e67afc08-10e0-4710-b251-d9031ef14026" 
              alt="Stylized 3D Character" 
              fill 
              className="object-cover object-[center_25%] scale-100" 
              priority 
            />
          ) : (
            // Skeleton loader with shimmer effect
            <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 relative overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              
              {/* Skeleton content blocks */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 space-y-4">
                {/* Large skeleton block for visual interest */}
                <div className="w-3/4 h-32 bg-gray-700/30 rounded-lg"></div>
                <div className="w-1/2 h-24 bg-gray-700/30 rounded-lg"></div>
                
                {/* Attribution skeleton at bottom */}
                <div className="absolute bottom-6 right-6 space-y-2">
                  <div className="w-24 h-3 bg-gray-700/40 rounded ml-auto"></div>
                  <div className="w-32 h-4 bg-gray-700/40 rounded"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Bottom Black Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          
          {/* Attribution Text - Bottom Right */}
          <div className={`absolute bottom-6 right-6 text-white text-right z-10 pointer-events-auto transition-transform duration-500 ${isSliding ? 'translate-x-full' : 'translate-x-0'}`}>
            <p className="text-xs opacity-80">Generated by</p>
            <p className="text-sm font-semibold">
              {!isLoading && (randomMode ? Boolean(currentImage) : carouselImages.length > 0) 
                ? (randomMode ? (currentImage?.displayName || currentImage?.username) : (carouselImages[currentIndex]?.displayName || carouselImages[currentIndex]?.username))
                : 'Aryan Prajapati'}
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}
