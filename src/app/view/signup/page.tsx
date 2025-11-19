"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

import SignInForm from "./sign-up-form"

export default function SignUp() {
  const [imageError, setImageError] = useState(false)
  const [featuredImage, setFeaturedImage] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(true)
  const [creatorInfo, setCreatorInfo] = useState<{ username?: string; photoURL?: string } | null>(null)

  // Fetch random high-scored image on mount
  useEffect(() => {
    const fetchRandomImage = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'
        const apiUrl = `${apiBase.replace(/\/$/, '')}/api/feed/random/high-scored`
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data?.responseStatus === 'success' && data?.data?.imageUrl) {
            setFeaturedImage(data.data.imageUrl)
            // Set creator info if available
            if (data?.data?.creator) {
              setCreatorInfo(data.data.creator)
            }
            console.log('✅ Random high-scored image loaded:', data.data.imageUrl)
          } else {
            // API returned success but no image - use default
            setFeaturedImage(null)
            setCreatorInfo(null)
          }
        } else {
          // API call failed - use default
          setFeaturedImage(null)
          setCreatorInfo(null)
        }
      } catch (error) {
        console.error('❌ Failed to fetch random image:', error)
        // API call failed - use default
        setFeaturedImage(null)
        setCreatorInfo(null)
      } finally {
        setIsLoadingImage(false)
      }
    }

    fetchRandomImage()
  }, [])

  // Default image URL (fallback)
  const defaultImageUrl = "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fsignup%2F3.png?alt=media&token=e67afc08-10e0-4710-b251-d9031ef14026"
  
  // Use featured image if available, otherwise use default
  const imageSrc = featuredImage || defaultImageUrl

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
          ) : !imageError ? (
            <Image 
              src={imageSrc}
              alt="Featured creation" 
              fill 
              className="object-cover object-[center_25%] scale-100 transition-opacity duration-500" 
              priority 
              unoptimized={!!featuredImage}
              onError={() => {
                setImageError(true)
                // If featured image fails, try default
                if (featuredImage && imageSrc === featuredImage) {
                  setFeaturedImage(null)
                  setImageError(false)
                }
              }}
            />
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
          
          {/* Attribution Text - Bottom Right */}
          {creatorInfo && (creatorInfo.username || creatorInfo.photoURL) && (
            <div className="absolute bottom-6 right-6 text-white z-10 pointer-events-auto flex items-center gap-2">
              {creatorInfo.photoURL && (
                <Image
                  src={creatorInfo.photoURL}
                  alt={creatorInfo.username || 'Creator'}
                  width={24}
                  height={24}
                  className="rounded-full object-cover flex-shrink-0"
                  unoptimized
                />
              )}
              <div className="text-right">
                <p className="text-xs opacity-80">Generated by</p>
                <p className="text-sm font-semibold">{creatorInfo.username || 'WildMind User'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
