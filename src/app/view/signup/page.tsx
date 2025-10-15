"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
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

export default function SignUp() {
  const [imageError, setImageError] = useState(false)
  const [artStationImage, setArtStationImage] = useState<ArtStationImage | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
  const fetchArtStationImage = async () => {
    try {
      const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
      const url = new URL(`${baseUrl}/api/feed`);
      url.searchParams.set('limit', '50'); // Fetch more to have better selection
      
      const res = await fetch(url.toString(), { 
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const payload = data?.data || data;
      const items: PublicItem[] = payload?.items || [];
      
      // Filter for images with vertical aspect ratio
      const verticalImages = items.filter(item => {
        if (!item.images || item.images.length === 0) return false;
        
        const aspectRatio = item.aspectRatio || item.frameSize || item.aspect_ratio;
        return isVerticalAspectRatio(aspectRatio);
      });
      
      if (verticalImages.length === 0) {
        console.warn('No vertical images found in art station');
        setIsLoading(false);
        return;
      }
      
      // Get random image from the filtered list
      const randomIndex = Math.floor(Math.random() * verticalImages.length);
      const selectedItem = verticalImages[randomIndex];
      const imageUrl = selectedItem.images?.[0]?.url;
      const username = selectedItem.createdBy?.username || selectedItem.createdBy?.displayName || 'Unknown Creator';
      const displayName = selectedItem.createdBy?.displayName;
      
      if (!imageUrl) {
        setIsLoading(false);
        return;
      }
      
      const newImage: ArtStationImage = {
        url: imageUrl,
        username,
        displayName,
        timestamp: Date.now()
      };
      
      setArtStationImage(newImage);
      
      // Store in localStorage
      try {
        localStorage.setItem('artStationSignupImage', JSON.stringify(newImage));
      } catch (e) {
        console.error('Failed to store image in localStorage:', e);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch art station image:', error);
      setIsLoading(false);
    }
  };

  // Check if we need to fetch a new image (hourly rotation)
  useEffect(() => {
    const checkAndFetchImage = () => {
      try {
        const stored = localStorage.getItem('artStationSignupImage');
        
        if (stored) {
          const parsedImage: ArtStationImage = JSON.parse(stored);
          const hoursPassed = (Date.now() - parsedImage.timestamp) / (1000 * 60 * 60);
          
          // If less than 1 hour has passed, use stored image
          if (hoursPassed < 1) {
            setArtStationImage(parsedImage);
            setIsLoading(false);
            return;
          }
        }
        
        // Fetch new image if no stored image or more than 1 hour has passed
        fetchArtStationImage();
      } catch (e) {
        console.error('Error checking stored image:', e);
        fetchArtStationImage();
      }
    };
    
    checkAndFetchImage();
  }, []);

  return (
    <main className="flex min-h-screen bg-[#07070B] w-[100%]">
      {/* Left Side - Form */}
      <div className="w-[60%] min-h-screen relative z-20 bg-[#07070B] flex justify-center items-center">

        <SignInForm />

      </div>

      {/* Right Side - Image */}
      <div className="flex-1 min-h-screen relative bg-[#07070B] w-[40%] z-10">
        <div className="absolute inset-0 rounded-tl-[50px] rounded-bl-[50px] overflow-hidden pointer-events-none">
          {!isLoading && artStationImage && !imageError ? (
            <Image 
              src={artStationImage.url} 
              alt="Art Station Generation" 
              fill 
              className="object-cover object-[center_25%] scale-100" 
              priority 
              onError={() => setImageError(true)}
            />
          ) : imageError || (!isLoading && !artStationImage) ? (
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
          <div className="absolute bottom-6 right-6 text-white text-right z-10 pointer-events-auto">
            <p className="text-xs opacity-80">Generated by</p>
            <p className="text-sm font-semibold">
              {!isLoading && artStationImage 
                ? (artStationImage.displayName || artStationImage.username)
                : 'Aryan Prajapati'}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
