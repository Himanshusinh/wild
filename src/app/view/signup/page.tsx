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
  const [nextImage, setNextImage] = useState<ArtStationImage | null>(null)
  const [order, setOrder] = useState<number[]>([])
  const isFetchingRef = useRef(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const recentUrlsRef = useRef<string[]>([])
  const lastSeenRef = useRef<Set<string>>(new Set())
  const allImagesRef = useRef<ArtStationImage[]>([])
  const isInitializedRef = useRef(false)
  const [currentImage, setCurrentImage] = useState<ArtStationImage | null>(null)
  const isTransitioningRef = useRef(false)

  // Simple image change function (no complex transitions)
  const changeImage = (newImage: ArtStationImage | null, source: string) => {
    if (isTransitioningRef.current) {
      console.log(`Image change blocked from ${source}: already changing`);
      return;
    }
    
    console.log(`${source}: changing to ${newImage?.url}`);
    isTransitioningRef.current = true;
    
    // Simple immediate change with fade effect
    setCurrentImage(newImage);
    setNextImage(null);
    
    // Reset transition flag after a brief delay
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 100);
  };

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

  // Check if aspect ratio fits well on right side (portrait/square) - FIXED
  const isRightSideFriendlyRatio = (aspectRatio?: string): boolean => {
    if (!aspectRatio) return false;
    
    // Normalize the aspect ratio (handle different formats like "1x1", "1:1", "1/1")
    const normalizedRatio = aspectRatio.replace('x', ':').replace('/', ':');
    
    // Perfect ratios for right side display (portrait and square)
    const rightSideRatios = [
      '9:16',   // Perfect mobile portrait
      '3:4',    // Classic portrait
      '2:3',    // Portrait
      '4:5',    // Portrait
      '1:1',    // Square - perfect for right side
      '5:4',    // Slightly portrait
      '4:3',    // Classic portrait
      '16:9',   // Landscape but good for right side
      '3:2',    // Portrait
      '2:1',    // Very wide but acceptable
      '5:3',    // Portrait
      '7:5'     // Portrait
    ];
    
    // Check if it matches perfect ratios
    if (rightSideRatios.includes(normalizedRatio)) return true;
    
    // Parse ratio and check if height >= width (portrait/square) or acceptable landscape
    const parts = normalizedRatio.split(':');
    if (parts.length === 2) {
      const width = parseFloat(parts[0]);
      const height = parseFloat(parts[1]);
      
      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) return false;
      
      const ratio = height / width;
      
      // Accept ratios from 0.6 (landscape) to 2.5 (very tall)
      // This ensures we get more vertical images while still accepting some landscape
      return ratio >= 0.6 && ratio <= 2.5;
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
      
      // Filter for right-side friendly aspect ratio images only
      const imageItems = items.filter(item => {
        if (!Array.isArray(item.images) || item.images.length === 0) return false;
        
        // Check if any image has right-side friendly aspect ratio
        return item.images.some(img => {
          const aspectRatio = item.aspectRatio || item.aspect_ratio;
          return isRightSideFriendlyRatio(aspectRatio);
        });
      });
      
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

  // ALWAYS FRESH IMAGES: Never use cache, always fetch new random images
  const initializeVerticalImages = async () => {
    if (isInitializedRef.current || allImagesRef.current.length > 0) return

    // If no cache or cache is old, fetch in background (non-blocking)
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    
    try {
      console.log('[SignupCarousel] Fetching FRESH random images...')
      const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
      
      // Fetch random images with timestamp to ensure freshness
      const allItems: PublicItem[] = []
      let cursor: string | undefined = undefined
      let pageCount = 0
      const maxPages = 2 // Fetch 2 pages for 100 images total
      
      while (pageCount < maxPages) {
        const url = new URL(`${baseUrl}/api/feed`)
        url.searchParams.set('limit', '50') // 50 per page
        url.searchParams.set('_t', Date.now().toString()) // Force fresh data
        if (cursor) url.searchParams.set('cursor', cursor)
        
        const res = await fetch(url.toString(), { credentials: 'include' })
        if (!res.ok) {
          console.error(`[SignupCarousel] API Error ${res.status}:`, res.statusText)
          throw new Error(`HTTP ${res.status}`)
        }
        
        const data = await res.json()
        const payload = data?.data || data
        const items: PublicItem[] = payload?.items || []
        const nextCursor = payload?.meta?.nextCursor || payload?.nextCursor

        allItems.push(...items)
        pageCount++
        
        if (!nextCursor) break
        cursor = nextCursor
      }

      // Filter for right-side friendly aspect ratio images only
      const rightSideItems = allItems.filter(item => {
        if (!Array.isArray(item.images) || item.images.length === 0) return false;
        const aspectRatio = item.aspectRatio || item.aspect_ratio;
        const isFriendly = isRightSideFriendlyRatio(aspectRatio);
        
        // Debug logging for aspect ratios
        if (allItems.length > 0 && Math.random() < 0.1) { // Log 10% of items for debugging
          console.log('[SignupCarousel] Aspect ratio debug:', {
            aspectRatio: aspectRatio,
            aspect_ratio: item.aspect_ratio,
            frameSize: item.frameSize,
            isFriendly: isFriendly,
            itemId: item.id
          });
        }
        
        return isFriendly;
      });

      // Map and dedupe by url, then shuffle for better randomization
      const allImages: ArtStationImage[] = rightSideItems
        .filter(it => it.images && it.images[0] && typeof it.images[0].url === 'string' && it.images[0].url)
        .map(it => ({ 
          url: String(it.images![0]!.url), 
          username: it.createdBy?.username || it.createdBy?.displayName || 'Unknown Creator', 
          displayName: it.createdBy?.displayName, 
          timestamp: Date.now() 
        }))
        .filter((img, idx, arr) => arr.findIndex(o => o.url === img.url) === idx)
        .sort(() => Math.random() - 0.5) // Shuffle the array for better randomization

      // Update refs (NO CACHING - always fresh)
      allImagesRef.current = allImages
      isInitializedRef.current = true
      
      console.log('[SignupCarousel] FRESH random images loaded:', {
        totalFetched: allItems.length,
        rightSideFriendly: rightSideItems.length,
        finalImages: allImages.length,
        pagesFetched: pageCount
      })
      
    } catch (e) {
      console.error('[SignupCarousel] Fetch error:', e)
      // Try simple API call as fallback (NO CACHE)
      try {
        console.log('[SignupCarousel] Trying simple API call as fallback...')
        const simpleBaseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
        const simpleUrl = `${simpleBaseUrl}/api/feed?_t=${Date.now()}` // Force fresh
        const simpleRes = await fetch(simpleUrl, { credentials: 'include' })
        if (simpleRes.ok) {
          const simpleData = await simpleRes.json()
          const simplePayload = simpleData?.data || simpleData
          const simpleItems: PublicItem[] = simplePayload?.items || []
          
          const simpleRightSideItems = simpleItems.filter(item => {
            if (!Array.isArray(item.images) || item.images.length === 0) return false;
            const aspectRatio = item.aspectRatio || item.aspect_ratio;
            return isRightSideFriendlyRatio(aspectRatio);
          });
          
          const simpleImages: ArtStationImage[] = simpleRightSideItems
            .filter(it => it.images && it.images[0] && typeof it.images[0].url === 'string' && it.images[0].url)
            .map(it => ({ 
              url: String(it.images![0]!.url), 
              username: it.createdBy?.username || it.createdBy?.displayName || 'Unknown Creator', 
              displayName: it.createdBy?.displayName, 
              timestamp: Date.now() 
            }))
            .filter((img, idx, arr) => arr.findIndex(o => o.url === img.url) === idx)
          
          allImagesRef.current = simpleImages
          isInitializedRef.current = true
          console.log('[SignupCarousel] Simple API fallback successful:', simpleImages.length)
        }
      } catch (e2) {
        console.error('Fallback API failed:', e2)
      }
    } finally {
      isFetchingRef.current = false
    }
  }

  // Reset recent images tracking (call when user wants fresh images)
  const resetRecentImages = () => {
    lastSeenRef.current.clear()
    recentUrlsRef.current = []
    console.log('[SignupCarousel] Reset recent images tracking')
  }

  // Fetch FRESH random images when needed
  const fetchMoreImages = async () => {
    if (isFetchingRef.current) return
    
    try {
      console.log('[SignupCarousel] Fetching FRESH random images...')
      const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
      
      // Fetch fresh random images
      const allNewImages: ArtStationImage[] = []
      let cursor: string | undefined = undefined
      let pageCount = 0
      const maxPages = 2 // Fetch 2 pages for 100 fresh images
      
      while (pageCount < maxPages) {
        const url = new URL(`${baseUrl}/api/feed`)
        url.searchParams.set('limit', '50') // 50 per page
        url.searchParams.set('_t', Date.now().toString()) // Force fresh data
        if (cursor) url.searchParams.set('cursor', cursor)
        
        const res = await fetch(url.toString(), { credentials: 'include' })
        if (!res.ok) {
          console.error(`[SignupCarousel] More images API Error ${res.status}:`, res.statusText)
          throw new Error(`HTTP ${res.status}`)
        }
        
        const data = await res.json()
        const payload = data?.data || data
        const items: PublicItem[] = payload?.items || []
        const nextCursor = payload?.meta?.nextCursor || payload?.nextCursor

        // Filter for right-side friendly images
        const rightSideItems = items.filter(item => {
          if (!Array.isArray(item.images) || item.images.length === 0) return false;
          const aspectRatio = item.aspectRatio || item.aspect_ratio;
          const isFriendly = isRightSideFriendlyRatio(aspectRatio);
          
          // Debug logging for aspect ratios
          if (items.length > 0 && Math.random() < 0.1) { // Log 10% of items for debugging
            console.log('[SignupCarousel] More images aspect ratio debug:', {
              aspectRatio: aspectRatio,
              aspect_ratio: item.aspect_ratio,
              frameSize: item.frameSize,
              isFriendly: isFriendly,
              itemId: item.id
            });
          }
          
          return isFriendly;
        });

        // Map and dedupe
        const pageImages: ArtStationImage[] = rightSideItems
          .filter(it => it.images && it.images[0] && typeof it.images[0].url === 'string' && it.images[0].url)
          .map(it => ({ 
            url: String(it.images![0]!.url), 
            username: it.createdBy?.username || it.createdBy?.displayName || 'Unknown Creator', 
            displayName: it.createdBy?.displayName, 
            timestamp: Date.now() 
          }))
          .filter((img, idx, arr) => arr.findIndex(o => o.url === img.url) === idx)

        allNewImages.push(...pageImages)
        pageCount++
        
        if (!nextCursor) break
        cursor = nextCursor
      }

      // Add new images to existing pool
      const existingUrls = new Set(allImagesRef.current.map(img => img.url))
      const uniqueNewImages = allNewImages.filter(img => !existingUrls.has(img.url))
      
      if (uniqueNewImages.length > 0) {
        allImagesRef.current = [...allImagesRef.current, ...uniqueNewImages]
        console.log('[SignupCarousel] Added', uniqueNewImages.length, 'new images to pool. Total:', allImagesRef.current.length)
      }
      
    } catch (e) {
      console.error('[SignupCarousel] Failed to fetch more images:', e)
    }
  }

  // ULTRA SMART random selection with rotation-based anti-repeat
  const getRandomImage = () => {
    if (allImagesRef.current.length === 0) return null
    
    const lastSeen = lastSeenRef.current
    const recentUrls = recentUrlsRef.current
    
    // Create a rotation-based selection system
    const totalImages = allImagesRef.current.length
    const seenCount = lastSeen.size
    
    // If we've seen more than 80% of images, reset the tracking
    if (seenCount > totalImages * 0.8) {
      console.log('[SignupCarousel] Resetting image pool - seen too many images')
      lastSeen.clear()
      recentUrls.length = 0
    }
    
    // If pool is getting low, fetch more images in background
    if (totalImages < 50 && !isFetchingRef.current) {
      fetchMoreImages()
    }
    
    // Filter out recently seen images
    const availableImages = allImagesRef.current.filter(img => 
      !lastSeen.has(img.url) && !recentUrls.includes(img.url)
    )
    
    // If no available images, use all images (fallback)
    const source = availableImages.length > 0 ? availableImages : allImagesRef.current
    
    if (source.length > 0) {
      // Use a more sophisticated selection algorithm
      const chosenIdx = Math.floor(Math.random() * source.length)
      const chosen = source[chosenIdx]
      
      if (chosen?.url) {
        // Add to tracking systems
        lastSeen.add(chosen.url)
        recentUrls.push(chosen.url)
        
        // Keep recent URLs manageable (last 30 for better variety)
        if (recentUrls.length > 30) {
          recentUrls.shift() // Remove oldest
        }
        
        // Keep lastSeen manageable (last 60 for better variety)
        if (lastSeen.size > 60) {
          const it = lastSeen.values().next()
          if (!it.done) lastSeen.delete(it.value)
        }
      }
      
      console.log('[SignupCarousel] ULTRA SMART SELECTION:', {
        totalImages: totalImages,
        seenCount: seenCount,
        availablePool: source.length,
        selectedUrl: String(chosen.url),
        recentWindow: lastSeen.size,
        recentUrls: recentUrls.length,
        poolUtilization: `${Math.round((seenCount / totalImages) * 100)}%`
      })
      
      return chosen
    }
    return null
  }

  // Initial load (random mode) - ULTRA FAST with fallback
  useEffect(() => {
    if (randomMode) {
      // Show fallback image immediately for instant loading
      const fallbackImage: ArtStationImage = {
        url: "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fsignup%2F3.png?alt=media&token=e67afc08-10e0-4710-b251-d9031ef14026",
        username: "Aryan Prajapati",
        displayName: "Aryan Prajapati",
        timestamp: Date.now()
      }
      
      // Set fallback immediately
      setCurrentImage(fallbackImage)
      setIsLoading(false)
      
      // Then try to load cached images
      initializeVerticalImages().then(() => {
        const first = getRandomImage()
        if (first) {
          // Smooth transition to real image
          setTimeout(() => {
            changeImage(first, 'Cache Load')
          }, 100)
        }
      })
      
      // Change image on page refresh (detect if page was refreshed)
      const handlePageLoad = () => {
        if (allImagesRef.current.length > 0) {
          const next = getRandomImage()
          if (next) {
            console.log('Page load/refresh - changing image:', next.url)
            changeImage(next, 'Page Load')
          }
        }
      }
      
      // Check if this is a refresh (not initial load) - FRESH IMAGES
      if (performance.navigation.type === 1) { // 1 = reload
        console.log('Page refresh - fetching fresh images...')
        // Reset recent images to ensure fresh selection
        resetRecentImages()
        
        // Fetch fresh images on refresh
        fetchMoreImages().then(() => {
          const next = getRandomImage()
          if (next) {
            console.log('Refresh - fresh image:', next.url)
            changeImage(next, 'Refresh')
          }
        })
      }
      
      // Change image on window focus (user comes back) - FRESH IMAGES
      const handleWindowFocus = () => {
        console.log('Window focus - fetching fresh images...')
        // Reset tracking and fetch fresh images
        resetRecentImages()
        fetchMoreImages().then(() => {
          const next = getRandomImage()
          if (next) {
            console.log('Window focus - fresh image:', next.url)
            changeImage(next, 'Window Focus')
          }
        })
      }

      // Change image on page visibility change - FRESH IMAGES
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('Page visible - fetching fresh images...')
          // Reset tracking and fetch fresh images
          resetRecentImages()
          fetchMoreImages().then(() => {
            const next = getRandomImage()
            if (next) {
              console.log('Page visible - fresh image:', next.url)
              changeImage(next, 'Page Visible')
            }
          })
        }
      }

      window.addEventListener('focus', handleWindowFocus)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        window.removeEventListener('focus', handleWindowFocus)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
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
                {/* Current Image */}
                {currentImage?.url && (
                  <Image
                    key={`curr-${currentImage.url}`}
                    src={currentImage.url}
                    alt="Art Station Generation"
                    fill
                    className="absolute inset-0 object-cover object-[center_25%] scale-100 transition-opacity duration-500 ease-in-out"
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
                className="object-cover object-[center_25%] scale-100 transition-opacity duration-500" 
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
            // Minimal loading state: blurred previous image with spinner
            <div className="w-full h-full relative">
              {/* Blur previous current image if exists */}
              {currentImage?.url ? (
                <Image
                  src={currentImage.url}
                  alt="Loading previous"
                  fill
                  className="object-cover object-[center_25%] scale-100 blur-md opacity-70"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-[#0B0B0F]" />
              )}
              {/* Center spinner */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-10 w-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            </div>
          )}
          
          {/* Bottom Black Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          
          {/* Attribution Text - Bottom Right */}
          <div className="absolute bottom-6 right-6 text-white text-right z-10 pointer-events-auto">
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
