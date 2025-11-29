"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

import SignInForm from "./sign-up-form"

interface ImageData {
  imageUrl: string
  prompt?: string
  generationId?: string
  creator?: { username?: string; photoURL?: string }
}

export default function SignUp() {
  const [image, setImage] = useState<ImageData | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(true)
  
  // Proxy function to avoid 429 errors from Google
  const getProxiedImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined
    // If it's a Google profile image, use proxy
    if (url.includes('googleusercontent.com') || url.includes('googleapis.com')) {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || ''
      return `${apiBase.replace(/\/$/, '')}/api/proxy/external?url=${encodeURIComponent(url)}`
    }
    return url
  }

  // Fetch single random high-scored image on mount - ONLY on desktop (not mobile/tablet)
  // Uses optimized Next.js API route with aggressive caching for instant loading
  useEffect(() => {
    // Check if we're on desktop (width >= 1024px)
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
    
    if (!isDesktop) {
      setIsLoadingImage(false)
      return
    }

    const fetchRandomImage = async () => {
      const startTime = performance.now()
      
      try {
        // Use Next.js API route with caching instead of direct backend call
        // This route caches responses for 5 minutes and uses in-memory cache for instant responses
        console.log('[Signup] Fetching from /api/signup-image...');
        const response = await fetch('/api/signup-image', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // No cache - fetch fresh image on every refresh
          cache: 'no-store',
        });
        console.log('[Signup] Response received:', response.status, response.statusText);

        if (response.ok) {
          const data = await response.json()
          console.log('[Signup] API response:', {
            responseStatus: data?.responseStatus,
            hasData: !!data?.data,
            imageUrl: data?.data?.imageUrl ? 'present' : 'missing'
          })
          
          if (data?.responseStatus === 'success' && data?.data) {
            setImage(data.data)
            setIsLoadingImage(false)
            const duration = performance.now() - startTime
            console.log(`[Signup] ✅ Image loaded in ${duration.toFixed(0)}ms`)
            
            // Preload the actual image for instant display
            if (data.data.imageUrl) {
              const img = new window.Image()
              img.src = data.data.imageUrl
            }
          } else {
            console.warn('[Signup] ⚠️ Invalid response structure:', data)
            setImage(null)
            setIsLoadingImage(false)
          }
        } else {
          // Get error details from response
          let errorData: any = null
          let errorText = ''
          try {
            errorText = await response.text()
            console.log('[Signup] Error response text:', errorText)
            try {
              errorData = JSON.parse(errorText)
            } catch {
              errorData = { message: errorText }
            }
          } catch (e) {
            console.error('[Signup] Failed to read error response:', e)
            errorData = { message: 'Unknown error' }
          }
          
          console.error('[Signup] ❌ API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            errorText: errorText.substring(0, 200),
            url: response.url,
            headers: Object.fromEntries(response.headers.entries())
          })
          
          // Log detailed error if available
          if (errorData?.error) {
            console.error('[Signup] Detailed error:', errorData.error)
          }
          
          setImage(null)
          setIsLoadingImage(false)
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch random image from Next.js API:', error)
        
        // Fallback: Try direct backend call if Next.js route fails
        try {
          console.log('[Signup] 🔄 Trying direct backend call as fallback...')
          const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || ''
          const apiUrl = `${apiBase.replace(/\/$/, '')}/api/feed/random/high-scored`
          
          const fallbackResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            if (fallbackData?.responseStatus === 'success' && fallbackData?.data) {
              console.log('[Signup] ✅ Fallback backend call succeeded')
              setImage(fallbackData.data)
              setIsLoadingImage(false)
              
              // Preload the actual image
              if (fallbackData.data.imageUrl) {
                const img = new window.Image()
                img.src = fallbackData.data.imageUrl
              }
              return
            }
          }
        } catch (fallbackError: any) {
          console.error('❌ Fallback backend call also failed:', fallbackError)
        }
        
        setImage(null)
        setIsLoadingImage(false)
      }
    }

    fetchRandomImage()
  }, [])

  // Default image URL (fallback)
  const defaultImageUrl = "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fsignup%2F3.png?alt=media&token=e67afc08-10e0-4710-b251-d9031ef14026"
  
  // Get image data
  const imageSrc = image?.imageUrl || defaultImageUrl
  const creatorInfo = image?.creator || null

  return (
    <main className="flex min-h-screen bg-gray-900 w-full">
      {/* Left Side - Form - Full width on mobile/tablet, 50% on desktop */}
      <div className="w-full lg:w-[50%] min-h-screen relative z-20 bg-gray-900 flex flex-col">
        <SignInForm />
      </div>

      {/* Right Side - Image - Hidden on mobile and tablet, only show on desktop (lg and above) */}
      <div className="hidden  lg:flex flex-1 min-h-screen relative bg-transparent w-[50%] z-10">
        <div className="absolute  inset-0 overflow-hidden m-2 rounded-lg ">
          {image ? (
            <div className="relative w-full h-full">
              <Image
                src={imageSrc}
                alt={image.prompt || "Featured creation"}
                fill
                className="object-cover absolute inset-0"
                priority
                unoptimized
                loading="eager"
                fetchPriority="high"
                onError={() => {
                  setImage(null)
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {/* <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-2">Welcome to WildMind AI</h2>
                <p className="text-lg opacity-80">Create amazing content with AI</p>
              </div> */}
            </div>
          )}
          
          {/* Attribution Text - Bottom Right Corner (Krea Style) */}
          {creatorInfo && (creatorInfo.username || creatorInfo.photoURL) && (
            <div className="absolute bottom-6 right-6 text-white-900 z-20 pointer-events-auto">
              <p className="text-xs font-medium">
                Created by: <span className="font-bold">@{creatorInfo.username || 'wildminduser'}</span> with WildMind AI
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
