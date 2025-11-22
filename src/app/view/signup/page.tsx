"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"

import SignInForm from "./sign-up-form"

interface ImageData {
  imageUrl: string
  prompt?: string
  generationId?: string
  creator?: { username?: string; photoURL?: string }
}

export default function SignUp() {
  const [images, setImages] = useState<ImageData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoadingImage, setIsLoadingImage] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Proxy function to avoid 429 errors from Google
  const getProxiedImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined
    // If it's a Google profile image, use proxy
    if (url.includes('googleusercontent.com') || url.includes('googleapis.com')) {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'
      return `${apiBase.replace(/\/$/, '')}/api/proxy/external?url=${encodeURIComponent(url)}`
    }
    return url
  }

  // Fetch multiple random high-scored images on mount
  useEffect(() => {
    const fetchRandomImages = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'
        const apiUrl = `${apiBase.replace(/\/$/, '')}/api/feed/random/high-scored?count=20`
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data?.responseStatus === 'success' && Array.isArray(data?.data) && data.data.length > 0) {
            // Start slideshow as soon as first image arrives
            if (data.data.length > 0) {
              setImages([data.data[0]]) // Set first image immediately
              setIsLoadingImage(false) // Stop loading state
              // Then add remaining images
              if (data.data.length > 1) {
                setTimeout(() => {
                  setImages(data.data)
                }, 100)
              }
            } else {
              setImages([])
              setIsLoadingImage(false)
            }
          } else {
            // API returned success but no images - use default
            setImages([])
            setIsLoadingImage(false)
          }
        } else {
          // API call failed - use default
          setImages([])
          setIsLoadingImage(false)
        }
      } catch (error) {
        console.error('❌ Failed to fetch random images:', error)
        // API call failed - use default
        setImages([])
        setIsLoadingImage(false)
      }
    }

    fetchRandomImages()
  }, [])

  // Slideshow effect - change image every 7 seconds with smooth fade transition
  useEffect(() => {
    if (images.length <= 1) return

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up interval to change images
    intervalRef.current = setInterval(() => {
      // Start fade out
      setFadeOut(true)
      
      // After fade out completes, change to next image and fade in
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
        // Small delay before fading in for smoother transition
        setTimeout(() => {
          setFadeOut(false)
        }, 100)
      }, 600) // Half of transition duration (1200ms / 2)
    }, 7000) // Change image every 7 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [images.length])

  // Default image URL (fallback)
  const defaultImageUrl = "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fsignup%2F3.png?alt=media&token=e67afc08-10e0-4710-b251-d9031ef14026"
  
  // Get current image data
  const currentImage = images.length > 0 ? images[currentIndex] : null
  const imageSrc = currentImage?.imageUrl || defaultImageUrl
  const creatorInfo = currentImage?.creator || null

  return (
    <main className="flex min-h-screen bg-background w-[100%]">
      {/* Left Side - Form */}
      <div className="w-full md:w-[60%] min-h-screen relative z-20 bg-[#07070B] flex justify-center items-center">

        <SignInForm />

      </div>

      {/* Right Side - Image - Hidden on mobile */}
      <div className="hidden md:flex flex-1 min-h-screen relative bg-gray-900 w-[40%] z-10">
        <div className="absolute inset-0 rounded-tl-[50px] rounded-bl-[50px] overflow-hidden pointer-events-none">
          {isLoadingImage ? (
            // Smooth loading state
            <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
                </div>
                <p className="text-white text-sm opacity-70 animate-pulse">Loading featured creation...</p>
              </div>
            </div>
          ) : images.length > 0 ? (
            <div className="relative w-full h-full">
              {images.map((img, index) => {
                const isActive = index === currentIndex
                const isVisible = isActive && !fadeOut
                
                return (
                  <Image
                    key={img.generationId || `img-${index}`}
                    src={img.imageUrl}
                    alt={img.prompt || "Featured creation"}
                    fill
                  className={`object-cover object-[center_25%] scale-100 transition-opacity duration-[1200ms] ease-in-out absolute inset-0 ${
                    isVisible
                      ? 'opacity-100 z-10'
                      : 'opacity-0 z-0'
                  }`}
                    priority={index === 0}
                    unoptimized
                    onError={() => {
                      // Remove failed image from array
                      setImages(prev => prev.filter((_, i) => i !== index))
                    }}
                  />
                )
              })}
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-2">Welcome to WildMind AI</h2>
                <p className="text-lg opacity-80">Create amazing content with AI</p>
              </div>
            </div>
          )}
          
          {/* Bottom Black Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          
          {/* Attribution Text - Bottom Right Corner */}
          {creatorInfo && (creatorInfo.username || creatorInfo.photoURL) && (
            <div className="absolute bottom-8 right-8 text-white z-20 pointer-events-auto flex items-center gap-4 transition-opacity duration-1000">
              {creatorInfo.photoURL && (
                <Image
                  src={getProxiedImageUrl(creatorInfo.photoURL) || creatorInfo.photoURL}
                  alt={creatorInfo.username || 'Creator'}
                  width={56}
                  height={56}
                  className="rounded-full object-cover flex-shrink-0 border-2 border-white/20 shadow-lg"
                  unoptimized
                />
              )}
              <div className="text-right">
                <p className="text-sm opacity-90 mb-1">Generated by</p>
                <p className="text-xl font-bold">{creatorInfo.username || 'WildMind User'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
