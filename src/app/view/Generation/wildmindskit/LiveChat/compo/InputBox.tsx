"use client";

import React, { useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setPrompt, setUploadedImages, setSelectedModel, setLastGeneratedImages, generateLiveChatImage } from "@/store/slices/generationSlice";
import { addNotification } from "@/store/slices/uiSlice";
import { addAndSaveHistoryEntry } from "@/store/slices/historySlice";
import { HistoryEntry, GeneratedImage, LiveChatMessage } from "@/types/history";
import { saveLiveChatSession, findOrCreateLiveChatSession, updateLiveChatSession } from '@/lib/historyService';
import { ensureSessionReady, clearAuthData, isUserAuthenticated } from '@/lib/axiosInstance';
import axiosInstance from '@/lib/axiosInstance';
import { findOrCreateSession, addMessageToSession, completeSession } from '@/lib/liveChatSessionService';
import { auth } from '@/lib/firebase';
import Image from "next/image";
import { Trash2 } from 'lucide-react';
import LiveChatModelsDropdown from "./LiveChatModelsDropdown";
// Replaced custom loader with Logo.gif
import { useEffect } from 'react';
// Live chat persistence will be handled by backend history endpoints

const LiveChatInputBox: React.FC = () => {
  const dispatch = useAppDispatch();
  const prompt = useAppSelector((state: any) => state.generation?.prompt || "");
  const uploadedImages = useAppSelector((state: any) => state.generation?.uploadedImages || []);
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || "flux-dev");
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const style = useAppSelector((state: any) => state.generation?.style || 'none');
  const inputEl = useRef<HTMLTextAreaElement>(null);
  const historyEntries = useAppSelector((s:any)=> (s.history?.entries || []).filter((e:any)=> e.generationType === 'live-chat'));

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null);
  const [overlayOpen, setOverlayOpen] = React.useState<boolean>(false);
  const [sessionImages, setSessionImages] = React.useState<GeneratedImage[]>([]);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const stripRef = React.useRef<HTMLDivElement>(null);
  const imagesRowRef = React.useRef<HTMLDivElement>(null);
  const [liveChatDocId, setLiveChatDocId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<LiveChatMessage[]>([]);
  // Track session document ID for incremental Firebase updates
  const [sessionDocId, setSessionDocId] = React.useState<string | null>(null);
  
  // State for tracking which image is currently the latest/focused (on left side)
  const [centeredImageUrl, setCenteredImageUrl] = React.useState<string | null>(null);
  // Note: imageSizes removed - using fixed sizes now (65vh for latest, 50vh for right-side images)
  
  // Touch/swipe handlers for horizontal sliding
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
  
  // State for current generation preview
  const [currentGeneration, setCurrentGeneration] = React.useState<{
    prompt: string;
    status: 'generating' | 'completed' | 'failed';
    images: GeneratedImage[];
  } | null>(null);

  // Note: We prefer using direct URLs for reference images to keep requests small and fast

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

  // Force allowed models for Live Chat (include Nano Banana)
  useEffect(() => {
    const allowed = ["flux-kontext-pro", "flux-kontext-max", "gemini-25-flash-image"];
    if (!allowed.includes(selectedModel)) {
      dispatch(setSelectedModel("flux-kontext-pro"));
    }
  }, [dispatch]);

  // Track if component has mounted to prevent auto-open on refresh
  const hasMountedRef = React.useRef(false);
  
  // Auto-open overlay when image is uploaded (user clicks image from history to modify)
  // But only after initial mount to prevent auto-opening on page refresh
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    
    if (uploadedImages.length > 0 && !overlayOpen) {
      // User clicked an image to modify - open overlay and input
      setOverlayOpen(true);
      
      // Check if there's a restored session in localStorage
      try {
        const restoredSessionData = localStorage.getItem('livechat-restored-session');
        if (restoredSessionData) {
          const restoredSession = JSON.parse(restoredSessionData);
          // Only restore if restored within last 5 seconds (to avoid stale data)
          if (restoredSession.restoredAt && (Date.now() - restoredSession.restoredAt) < 5000) {
            // Restore the original session ID
            setCurrentSessionId(restoredSession.sessionId);
            // Restore sessionDocId if available (from backend session)
            if (restoredSession.sessionDocId) {
              setSessionDocId(restoredSession.sessionDocId);
            } else {
              setSessionDocId(null); // Clear so it can be found/created fresh
            }
            
            // Restore messages from entries (in reverse chronological order - newest first)
            const restoredMessages: LiveChatMessage[] = restoredSession.entries
              .map((entry: any) => ({
                prompt: entry.prompt || '',
                images: entry.images || [],
                timestamp: entry.timestamp || new Date().toISOString()
              }))
              .reverse(); // Reverse to show newest first
            setMessages(restoredMessages);
            
            // Restore images properly:
            // - Latest image goes to currentGeneration (left side)
            // - Previous images go to sessionImages (right side)
            // Sort entries by timestamp to ensure chronological order
            const sortedEntries = [...restoredSession.entries].sort((a, b) => {
              const timeA = new Date(a.timestamp || 0).getTime();
              const timeB = new Date(b.timestamp || 0).getTime();
              return timeA - timeB; // Oldest first
            });
            
            // Collect ALL images from all entries in chronological order
            // Use order field if available (from backend session), otherwise use timestamp order
            const allImages: Array<GeneratedImage & { order?: number }> = [];
            for (const entry of sortedEntries) {
              // Handle both array and single image formats
              const images = entry.images || [];
              const imageArray = Array.isArray(images) ? images : (images ? [images] : []);
              
              if (imageArray.length > 0) {
                // Ensure each image has proper structure
                for (const img of imageArray) {
                  // Handle different image formats
                  const imageUrl = img?.url || img?.firebaseUrl || img?.storagePath || img;
                  if (imageUrl && typeof imageUrl === 'string') {
                    allImages.push({
                      id: img?.id || `img-${Date.now()}-${Math.random()}`,
                      url: imageUrl,
                      originalUrl: img?.originalUrl || imageUrl,
                      firebaseUrl: img?.firebaseUrl,
                      order: img?.order // Use order from backend if available
                    });
                  }
                }
              }
            }
            
            // Sort by order if available (from backend), otherwise keep chronological order
            if (allImages.some(img => img.order !== undefined)) {
              allImages.sort((a, b) => {
                const orderA = a.order ?? 999999;
                const orderB = b.order ?? 999999;
                return orderA - orderB;
              });
            }
            
            console.log('[LiveChat] Restoring session:', {
              sessionId: restoredSession.sessionId,
              entriesCount: sortedEntries.length,
              imagesCount: allImages.length,
              uploadedImagesCount: uploadedImages.length
            });
            
            // Use images from entries if available, otherwise fallback to uploadedImages
            // If we have fewer images from entries than uploadedImages, combine them
            let imagesToUse: GeneratedImage[] = allImages;
            
            if (allImages.length === 0 && uploadedImages.length > 0) {
              // No images from entries, use uploadedImages
              imagesToUse = uploadedImages.map((url: string, idx: number) => ({
                id: `restored-${idx}-${Date.now()}`,
                url: url,
                originalUrl: url
              }));
            } else if (allImages.length > 0 && uploadedImages.length > allImages.length) {
              // If uploadedImages has more images (might be from history), use those as fallback
              // But prefer allImages if they exist
              console.warn('[LiveChat] Mismatch: entries have', allImages.length, 'images but uploadedImages has', uploadedImages.length);
            }
            
            if (imagesToUse.length > 0) {
              console.log('[LiveChat] Restoring images:', {
                totalImages: imagesToUse.length,
                previousImages: imagesToUse.slice(0, -1).length,
                lastImage: imagesToUse[imagesToUse.length - 1]?.url
              });
              
              // Latest image (last one) goes to currentGeneration (left side)
              const lastImage = imagesToUse[imagesToUse.length - 1];
              const lastEntry = sortedEntries[sortedEntries.length - 1];
              
              setCurrentGeneration({
                prompt: lastEntry?.prompt || '',
                status: 'completed',
                images: [lastImage]
              });
              setCenteredImageUrl(lastImage.url);
              
              // Previous images (all except the last one) go to sessionImages (right side)
              const previousImages = imagesToUse.slice(0, -1);
              setSessionImages(previousImages);
            } else {
              // Fallback: if no images found, show uploaded images
              if (uploadedImages.length > 0) {
                const imageObjects: GeneratedImage[] = uploadedImages.map((url: string, idx: number) => ({
                  id: `fallback-${idx}-${Date.now()}`,
                  url: url,
                  originalUrl: url
                }));
                
                if (imageObjects.length === 1) {
                  setCurrentGeneration({
                    prompt: '',
                    status: 'completed',
                    images: [imageObjects[0]]
                  });
                  setCenteredImageUrl(imageObjects[0].url);
                  setSessionImages([]);
                } else {
                  // Multiple images: latest on left, previous ones on right
                  const lastImage = imageObjects[imageObjects.length - 1];
                  const previousImages = imageObjects.slice(0, -1);
                  
                  setCurrentGeneration({
                    prompt: '',
                    status: 'completed',
                    images: [lastImage]
                  });
                  setCenteredImageUrl(lastImage.url);
                  setSessionImages(previousImages);
                }
              }
            }
            
            // Clear the restored session data after restoring
            localStorage.removeItem('livechat-restored-session');
          } else {
            // Stale data, create new session
            const sessionId = `session-${Date.now()}`;
            setCurrentSessionId(sessionId);
            localStorage.removeItem('livechat-restored-session');
          }
        } else {
          // No restored session, create new session and show uploaded images
          const sessionId = `session-${Date.now()}`;
          setCurrentSessionId(sessionId);
          
          // Show uploaded images immediately when opening overlay
          if (uploadedImages.length > 0) {
            // Convert uploadedImages to GeneratedImage format and show the latest one on left side
            const imageObjects: GeneratedImage[] = uploadedImages.map((url: string, idx: number) => ({
              id: `uploaded-${idx}-${Date.now()}`,
              url: url,
              originalUrl: url
            }));
            
            // If there's only one image, show it on left side
            if (imageObjects.length === 1) {
              setCurrentGeneration({
                prompt: '',
                status: 'completed',
                images: [imageObjects[0]]
              });
              setCenteredImageUrl(imageObjects[0].url);
              setSessionImages([]);
            } else {
              // Multiple images: latest on left, previous ones on right
              const lastImage = imageObjects[imageObjects.length - 1];
              const previousImages = imageObjects.slice(0, -1);
              
              setCurrentGeneration({
                prompt: '',
                status: 'completed',
                images: [lastImage]
              });
              setCenteredImageUrl(lastImage.url);
              setSessionImages(previousImages);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to restore session:', e);
        // Fallback: create new session and show uploaded images
        const sessionId = `session-${Date.now()}`;
        setCurrentSessionId(sessionId);
        localStorage.removeItem('livechat-restored-session');
        
        // Show uploaded images even if restoration failed
        if (uploadedImages.length > 0) {
          const imageObjects: GeneratedImage[] = uploadedImages.map((url: string, idx: number) => ({
            id: `uploaded-${idx}-${Date.now()}`,
            url: url,
            originalUrl: url
          }));
          
          if (imageObjects.length === 1) {
            setCurrentGeneration({
              prompt: '',
              status: 'completed',
              images: [imageObjects[0]]
            });
            setCenteredImageUrl(imageObjects[0].url);
            setSessionImages([]);
          } else {
            // Multiple images: latest on left, previous ones on right
            const lastImage = imageObjects[imageObjects.length - 1];
            const previousImages = imageObjects.slice(0, -1);
            
            setCurrentGeneration({
              prompt: '',
              status: 'completed',
              images: [lastImage]
            });
            setCenteredImageUrl(lastImage.url);
            setSessionImages(previousImages);
          }
        }
      }
    } else if (uploadedImages.length === 0 && overlayOpen) {
      // User clicked Done - close overlay and clear session
      setOverlayOpen(false);
      setCurrentSessionId(null);
      setSessionImages([]);
      setMessages([]);
      setCurrentGeneration(null);
      // Clear any restored session data
      localStorage.removeItem('livechat-restored-session');
    }
  }, [uploadedImages, overlayOpen]);

  // Lock scroll when overlay is open
  useEffect(() => {
    if (overlayOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [overlayOpen]);

  // Auto-scroll the strip to the left when new images arrive (newest first)
  useEffect(() => {
    if (stripRef.current) {
      stripRef.current.scrollLeft = 0;
    }
  }, [sessionImages.length]);

  // Keep currentGeneration visible after completion so the latest image stays on left side

  // Convenience flag to simplify centering logic while generating
  const isGenerating = currentGeneration?.status === 'generating';

  // Function to detect which image is the latest/focused (simplified - no dynamic sizing)
  const detectCenteredImage = React.useCallback(() => {
    if (!imagesRowRef.current) return;
    
    const container = imagesRowRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerCenterX = containerRect.left + (containerRect.width / 2);
    
    let closestImage: HTMLElement | null = null;
    let closestDistance = Infinity;
    let closestUrl: string | null = null;
    
    // Check all images (including current generation)
    const allImageElements = container.querySelectorAll('[data-image-url], [data-center-image="true"]');
    
    allImageElements.forEach((imgEl) => {
      if (imgEl instanceof HTMLElement) {
        const imgRect = imgEl.getBoundingClientRect();
        const imgCenterX = imgRect.left + (imgRect.width / 2);
        const distanceFromCenter = Math.abs(imgCenterX - containerCenterX);
        
        // Get image URL
        const url = imgEl.getAttribute('data-image-url') || 
                   (imgEl.hasAttribute('data-center-image') && currentGeneration?.status === 'completed' && currentGeneration.images.length > 0
                     ? currentGeneration.images[0].url 
                     : null);
        
        if (url) {
          // Track closest image (for focus tracking)
          if (distanceFromCenter < closestDistance) {
            closestDistance = distanceFromCenter;
            closestImage = imgEl;
            closestUrl = url;
          }
        }
      }
    });
    
    // Update centered image URL (for focus tracking only)
    if (closestUrl && closestDistance < 200) {
      setCenteredImageUrl(closestUrl);
    }
  }, [currentGeneration]);

  // Navigation functions for arrow buttons
  const scrollLeft = () => {
    if (imagesRowRef.current) {
      const scrollAmount = 400; // Scroll amount in pixels
      imagesRowRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      setTimeout(detectCenteredImage, 300);
    }
  };

  const scrollRight = () => {
    if (imagesRowRef.current) {
      const scrollAmount = 400; // Scroll amount in pixels
      imagesRowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(detectCenteredImage, 300);
    }
  };

  // Touch/swipe handlers
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      scrollRight();
    } else if (isRightSwipe) {
      scrollLeft();
    }
  };

  // Function to center a specific image
  const centerImage = (imageUrl: string, element: HTMLElement) => {
    if (!imagesRowRef.current) return;
    
    const container = imagesRowRef.current;
    const containerWidth = container.offsetWidth;
    const imageLeft = element.offsetLeft;
    const imageWidth = element.offsetWidth;
    
    const targetScrollLeft = imageLeft - (containerWidth / 2) + (imageWidth / 2);
    container.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
    
    setCenteredImageUrl(imageUrl);
  };

  // Auto-scroll to center the current image when it changes (generating or completed)
  React.useEffect(() => {
    if (imagesRowRef.current && currentGeneration) {
      const centerImage = () => {
        const centerImageEl = imagesRowRef.current?.querySelector('[data-center-image="true"]') as HTMLElement;
        if (centerImageEl && imagesRowRef.current) {
          const container = imagesRowRef.current;
          const imageLeft = centerImageEl.offsetLeft;
          const imageWidth = centerImageEl.offsetWidth;
          const containerWidth = container.offsetWidth;
          const targetScrollLeft = imageLeft - (containerWidth / 2) + (imageWidth / 2);
          
          container.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
          
          // Update centered image after scroll (for focus tracking)
          setTimeout(() => {
            detectCenteredImage();
            if (currentGeneration.status === 'completed' && currentGeneration.images.length > 0) {
              setCenteredImageUrl(currentGeneration.images[0].url);
            }
          }, 300);
        }
      };
      
      // Wait for DOM to update before scrolling
      setTimeout(centerImage, 200);
    }
  }, [currentGeneration?.status, currentGeneration?.images, sessionImages.length, detectCenteredImage]);

  // Add scroll listener to detect focused image (for tracking purposes)
  React.useEffect(() => {
    const container = imagesRowRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Debounce scroll events for performance
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        detectCenteredImage();
      }, 16); // ~60fps update rate
    };

    const handleResize = () => {
      detectCenteredImage();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    
    // Initial detection
    setTimeout(detectCenteredImage, 100);
    setTimeout(detectCenteredImage, 300);

    return () => {
      clearTimeout(scrollTimeout);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [sessionImages, currentGeneration, detectCenteredImage]);

  return (
    <>
    {/* Input box - always visible */}
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[820px] z-70">
      <div className="rounded-xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
        {/* Top row: prompt + actions */}
        <div className="flex items-center gap-2 p-2.5">
          <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-3 py-2">
            <textarea
              ref={inputEl}
              placeholder="Type your prompt..."
              value={prompt}
              onChange={(e) => {
                dispatch(setPrompt(e.target.value));
                adjustTextareaHeight(e.target);
              }}
              className={`flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[14px] leading-relaxed resize-none overflow-y-auto transition-all duration-200 ${
                prompt ? 'text-white' : 'text-white/70'
              }`}
              rows={1}
              style={{ minHeight: '22px', maxHeight: '64px', lineHeight: '1.2' }}
              spellCheck={true}
              lang="en"
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="on"
            />

            {/* Previews just to the left of upload */}
            {uploadedImages.length > 0 && (
              <div className="flex items-center gap-1.5 pr-1">
                {uploadedImages.map((u: string, i: number) => (
                  <div key={i} className="relative w-12 h-12 rounded-md overflow-hidden ring-1 ring-white/20 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt={`ref-${i}`} className="w-full h-full object-cover transition-opacity group-hover:opacity-30" />
                    <button
                      aria-label="Remove reference"
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 drop-shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = uploadedImages.filter((_: string, idx: number) => idx !== i);
                        dispatch(setUploadedImages(next));
                        if (next.length === 0) {
                          setCurrentSessionId(null);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <div className="relative group">
              <label className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer">
                <Image src="/icons/fileupload.svg" alt="Attach" width={18} height={18} className="opacity-90" />
                <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const inputEl = e.currentTarget as HTMLInputElement;
                  const files = Array.from(inputEl.files || []).slice(0, 4);
                  const urls: string[] = [];
                  for (const file of files) {
                    const reader = new FileReader();
                    const asDataUrl: string = await new Promise((res) => {
                      reader.onload = () => res(reader.result as string);
                      reader.readAsDataURL(file);
                    });
                    urls.push(asDataUrl);
                  }
                  // Start a NEW session on any fresh upload selection
                  const next = urls.slice(0, 4);
                  dispatch(setUploadedImages(next));
                  if (next.length > 0) {
                    dispatch(setSelectedModel("flux-kontext-pro"));
                    setCurrentSessionId(`session-${Date.now()}`);
                  }
                  if (inputEl) inputEl.value = "";
                }}
              />
              </label>
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/80 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">Upload image</div>
            </div>
          </div>

          {/* Generate button - stub for now */}
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (uploadedImages.length === 0) {
                  dispatch(addNotification({ type: 'error', message: 'Please upload at least one image for Live Chat.' }));
                  return;
                }
                try {
                  // Ensure session is ready before making API calls
                  console.log('[LiveChat] Checking session readiness...');
                  
                  // Add timeout to prevent hanging
                  const sessionPromise = ensureSessionReady(2000); // 2 second timeout
                  const timeoutPromise = new Promise<boolean>((_, reject) => 
                    setTimeout(() => reject(new Error('Session creation timeout')), 3000)
                  );
                  
                  let sessionReady = false;
                  try {
                    sessionReady = await Promise.race([sessionPromise, timeoutPromise]);
                    console.log('[LiveChat] Session ready:', sessionReady);
                  } catch (error) {
                    console.error('[LiveChat] Session creation failed or timed out:', error);
                    sessionReady = false;
                  }
                  
                  if (!sessionReady) {
                    console.error('[LiveChat] Session not ready, checking authentication...');
                    
                    // Use simplified authentication check as fallback
                    const isAuthenticated = isUserAuthenticated();
                    console.log('[LiveChat] Simplified auth check:', isAuthenticated);
                    
                    if (!isAuthenticated) {
                      dispatch(addNotification({ type: 'error', message: 'Please log in to use Live Chat.' }));
                      return;
                    }
                    
                  // If user is authenticated but session creation failed, try to proceed anyway
                  console.log('[LiveChat] Proceeding with simplified authentication...');
                  
                  // Test if we can make a basic API call
                  try {
                    console.log('[LiveChat] Testing API connectivity...');
                    const testResponse = await axiosInstance.get('/api/health');
                    console.log('[LiveChat] API test successful:', testResponse.status);
                  } catch (apiError) {
                    console.error('[LiveChat] API test failed:', apiError);
                    dispatch(addNotification({ type: 'error', message: 'Unable to connect to server. Please check your connection and try again.' }));
                    return;
                  }
                  }

                  // Ensure session and open process overlay
                  const sessionId = currentSessionId ?? `session-${Date.now()}`;
                  if (!currentSessionId) setCurrentSessionId(sessionId);
                  if (!overlayOpen) setOverlayOpen(true);
                  
                  // Find or create session in backend
                  if (!sessionDocId) {
                    try {
                      const { sessionDocId: newDocId } = await findOrCreateSession({
                        sessionId,
                        model: selectedModel,
                        frameSize,
                        style,
                        startedAt: messages.length > 0 ? messages[messages.length - 1]?.timestamp || new Date().toISOString() : new Date().toISOString(),
                      });
                      setSessionDocId(newDocId);
                    } catch (e) {
                      console.error('[LiveChat] Failed to find or create session:', e);
                    }
                  }
                  
                  // BEFORE starting new generation, shift current latest image to right side
                  // Move previous latest image to right side (sessionImages)
                  if (currentGeneration?.status === 'completed' && currentGeneration.images.length > 0) {
                    // Add current latest image to sessionImages (will appear on right side)
                    // Order: oldest to newest (further right to closer to left)
                    setSessionImages((prev) => [...prev, ...currentGeneration.images]);
                  }
                  
                  setIsProcessing(true);
                  
                  // Set current generation state for preview (generating starts in center)
                  setCurrentGeneration({
                    prompt: prompt,
                    status: 'generating',
                    images: []
                  });
                  
                  // As soon as processing starts, make sure the viewport shows the first tile (spinner)
                  setTimeout(() => {
                    if (stripRef.current) stripRef.current.scrollLeft = 0;
                  }, 0);

                  console.log('[LiveChat] generate click', {
                    selectedModel,
                    sessionId,
                    frameSize,
                    uploadedImagesCount: uploadedImages.length,
                  });
                  const result = await dispatch(
                    generateLiveChatImage({
                      prompt,
                      model: selectedModel,
                      frameSize,
                      uploadedImages,
                    })
                  ).unwrap();
                  console.log('[LiveChat] generation result', {
                    from: 'live-chat',
                    requestId: (result as any)?.requestId || (result as any)?.historyId,
                    imagesCount: (result as any)?.images?.length,
                    firstUrl: (result as any)?.images?.[0]?.url,
                  });

                  if (result?.images?.length) {
                    const latest = result.images[0];
                    dispatch(setLastGeneratedImages(result.images));
                    // Use the resulting image URL as the next reference
                    dispatch(setUploadedImages([latest.url]));
                    
                    // Add message to backend session
                    if (sessionDocId) {
                      try {
                        await addMessageToSession(sessionDocId, {
                          prompt: prompt,
                          images: result.images.map((img: any) => ({
                            id: img.id || `img-${Date.now()}-${Math.random()}`,
                            url: img.url,
                            storagePath: img.storagePath,
                            originalUrl: img.originalUrl || img.url,
                            firebaseUrl: img.firebaseUrl,
                          })),
                          timestamp: new Date().toISOString(),
                        });
                      } catch (e) {
                        console.error('[LiveChat] Failed to add message to session:', e);
                      }
                    }
                    
                    // Note: Image shifting to left already happened before generation started
                    // The new image will now appear in the center
                    
                    // Record this prompt -> images as one live chat message in overlay state
                    const msg: LiveChatMessage = { prompt, images: result.images, timestamp: new Date().toISOString() };
                    setMessages(prev => [msg, ...prev]);
                    
                    // Save each generation to history immediately with the same sessionId
                    const now = new Date().toISOString();
                    const historyEntry: HistoryEntry = {
                      id: `livechat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      prompt: prompt,
                      model: selectedModel,
                      generationType: 'live-chat',
                      images: result.images,
                      timestamp: now,
                      createdAt: now,
                      imageCount: result.images.length,
                      status: 'completed',
                      frameSize,
                      style,
                      sessionId: sessionId, // Use the same sessionId for all generations in this session
                    };
                    dispatch(addAndSaveHistoryEntry(historyEntry));
                    
                    // Update or create session in Firebase incrementally with all messages in sequence
                    (async () => {
                      try {
                        let docId = sessionDocId;
                        
                        // If no docId, find or create the session
                        if (!docId) {
                          // Get the oldest message timestamp (first generation) or use now
                          const allMessagesSoFar = [...messages, msg].reverse(); // oldest first
                          const startTime = allMessagesSoFar.length > 0 
                            ? allMessagesSoFar[0]?.timestamp || now 
                            : now;
                          docId = await findOrCreateLiveChatSession(sessionId, {
                            model: selectedModel,
                            frameSize,
                            style,
                            startedAt: startTime
                          });
                          setSessionDocId(docId);
                        }
                        
                        // Update the session with all messages in sequence (oldest first)
                        // messages are in reverse order (newest first), so we need to reverse them
                        const allMessages = [...messages, msg].reverse(); // Reverse to get oldest first
                        // Calculate total images from all messages
                        const totalImagesCount = allMessages.reduce((sum, m) => sum + (m.images?.length || 0), 0);
                        
                        await updateLiveChatSession(docId, {
                          messages: allMessages,
                          totalImages: totalImagesCount,
                          status: 'active', // Keep as active until Done is clicked
                        });
                      } catch (e) {
                        console.error('Failed to update live chat session incrementally:', e);
                        // Don't block the UI if session update fails
                      }
                    })();
                    
                    // Update current generation state to completed (new image stays centered, previous moved to left)
                    setCurrentGeneration({
                      prompt: prompt,
                      status: 'completed',
                      images: result.images
                    });
                    
                    setIsProcessing(false);
                    dispatch(addNotification({ type: 'success', message: 'Image generated. Continuing Live Chat with latest image.' }));
                    
                    // Set centered image URL - the useEffect will handle centering
                    const latestImageUrl = result.images[0].url;
                    if (latestImageUrl) {
                      setCenteredImageUrl(latestImageUrl);
                    }
                  }
                } catch (e) {
                  // Update current generation state to failed
                  setCurrentGeneration({
                    prompt: prompt,
                    status: 'failed',
                    images: []
                  });
                  
                  setIsProcessing(false);
                  dispatch(addNotification({ type: 'error', message: e instanceof Error ? e.message : 'Generation failed' }));
                }
              }}
              disabled={!prompt.trim()}
              className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Bottom row: only model selector for Live Chat */}
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          <LiveChatModelsDropdown />
        </div>
      </div>
    </div>
    {/* Live chat process overlay (keeps input visible above) */}
    {overlayOpen && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl">
        <div className={`absolute inset-0 flex ${isGenerating ? 'items-center' : 'items-start'} justify-center p-6 pt-16 pb-[140px]`}>
          <div className="relative bg-transparent max-w-[95vw] w-full px-2 py-2">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white/80 text-sm flex items-center gap-2">
                <span>Live Chat session</span>
                {isProcessing && (
                  <span className="inline-flex items-center gap-2 text-white/70">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                    {/* <span className="text-xs">Generating…</span> */}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Collect all images from session (sessionImages + currentGeneration)
                    const allSessionImages: GeneratedImage[] = [...sessionImages];
                    if (currentGeneration?.status === 'completed' && currentGeneration.images.length > 0) {
                      allSessionImages.push(...currentGeneration.images);
                    }
                    
                    const now = new Date().toISOString();
                    
                    // Save all images as a history entry if there are any
                    if (allSessionImages.length > 0) {
                      const entry: HistoryEntry = {
                        id: `livechat-${Date.now()}`,
                        prompt: currentGeneration?.prompt || prompt || '',
                        model: selectedModel,
                        generationType: 'live-chat',
                        images: allSessionImages,
                        timestamp: now,
                        createdAt: now,
                        imageCount: allSessionImages.length,
                        status: 'completed',
                        frameSize,
                        style,
                        sessionId: currentSessionId || `session-${Date.now()}`,
                      };
                      dispatch(addAndSaveHistoryEntry(entry));
                    }
                    
                    // Persist a consolidated Live Chat session document
                    (async () => {
                      try {
                        const sessionId = currentSessionId || `session-${Date.now()}`;
                        const payload = {
                          sessionId,
                          model: selectedModel,
                          frameSize,
                          style,
                          startedAt: messages.length > 0 ? messages[messages.length - 1]?.timestamp || now : now,
                          completedAt: now,
                          status: 'completed' as const,
                          messages: messages.length > 0 ? [...messages].reverse() : [], // oldest -> newest
                          totalImages: allSessionImages.length,
                        };
                        // Always create a consolidated session document per Done
                        const id = await saveLiveChatSession(payload);
                        setLiveChatDocId(id);
                      } catch (e) {
                        console.error('Failed to persist live chat session:', e);
                      }
                    })();
                    
                    // Finalize session in backend (async, don't block UI)
                    if (sessionDocId) {
                      (async () => {
                        try {
                          await completeSession(sessionDocId, now);
                        } catch (e) {
                          console.error('[LiveChat] Failed to complete session:', e);
                        }
                      })();
                    }
                    
                    // Close overlay and clear all state
                    setOverlayOpen(false);
                    setSessionImages([]);
                    setMessages([]);
                    setCurrentGeneration(null);
                    setCurrentSessionId(null);
                    setSessionDocId(null); // Clear session document ID
                    // Clear uploaded images to exit live session
                    dispatch(setUploadedImages([]));
                  }}
                  className="px-3 py-1.5 text-xs rounded-full bg-white text-black hover:bg-gray-200 transition"
                >
                  Done
                </button>
              </div>
            </div>
            {/* Horizontal row with all images - center image in the middle */}
            <div className="relative w-full h-[calc(100vh-220px)] flex items-center justify-center">
              {/* Left arrow button */}
              {(sessionImages.length > 0 || currentGeneration) && (
                <button
                  onClick={scrollLeft}
                  className="absolute left-4 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center transition-all hover:scale-110"
                  aria-label="Scroll left"
                  type="button"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
              )}
              
              {/* Right arrow button */}
              {(sessionImages.length > 0 || currentGeneration) && (
                <button
                  onClick={scrollRight}
                  className="absolute right-4 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center transition-all hover:scale-110"
                  aria-label="Scroll right"
                  type="button"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              )}

              <div 
                ref={imagesRowRef} 
                className="flex flex-row items-center gap-4 overflow-x-auto custom-scrollbar px-4 scroll-smooth"
                style={{ 
                  width: '100%',
                  maxWidth: '100vw'
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {/* Latest image (left side) - currentGeneration - slightly bigger */}
                {currentGeneration && (() => {
                  const currentImageUrl = currentGeneration.status === 'completed' && currentGeneration.images.length > 0 
                    ? currentGeneration.images[0].url 
                    : null;
                  // Fixed size for latest image - slightly bigger than right-side images
                  const latestImageSize = 65; // 65vh for latest image
                  const sizeVh = `${latestImageSize}vh`;
                  
                  return (
                    <div 
                      data-center-image="true"
                      data-image-url={currentImageUrl || undefined}
                      onClick={(e) => {
                        if (currentImageUrl) {
                          centerImage(currentImageUrl, e.currentTarget);
                        }
                      }}
                      className="relative rounded-xl overflow-hidden bg-black/30 flex-shrink-0 transition-all duration-500 ease-out cursor-pointer"
                      style={{
                        width: sizeVh,
                        height: sizeVh,
                      }}
                    >
                      {currentGeneration.status === 'generating' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <div className="flex flex-col items-center gap-2 p-4">
                            <Image src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" />
                            <Image src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" />
                            <div className="text-xs text-white/60 text-center">Generating...</div>
                          </div>
                        </div>
                      ) : currentGeneration.status === 'failed' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                          <div className="flex flex-col items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            <div className="text-xs text-red-400">Failed</div>
                          </div>
                        </div>
                      ) : currentGeneration.images.length > 0 ? (
                        <div className="relative w-full h-full">
                          <Image src={currentGeneration.images[0].url} alt="Generated image" fill className="object-cover" sizes="40vh" />
                        </div>
                      ) : null}
                    </div>
                  );
                })()}
                
                {/* Previous session images (right side) - all same size */}
                {sessionImages
                  .filter((img) => {
                    // Don't show images that are currently in currentGeneration
                    const currentImageUrl = currentGeneration?.status === 'completed' && currentGeneration.images.length > 0 
                      ? currentGeneration.images[0].url 
                      : null;
                    return currentImageUrl !== img.url;
                  })
                  .map((img, idx) => {
                    // Fixed size for all right-side images - same size for all
                    const rightSideImageSize = 50; // 50vh for all right-side images
                    const sizeVh = `${rightSideImageSize}vh`;
                    return (
                      <div 
                        key={`${img.id || 'img'}-${idx}-${img.url}`} 
                        data-image-url={img.url}
                        onClick={(e) => centerImage(img.url, e.currentTarget)}
                        className="relative rounded-xl overflow-hidden bg-black/70 flex-shrink-0 cursor-pointer transition-all duration-500 ease-out"
                        style={{
                          width: sizeVh,
                          height: sizeVh,
                        }}
                      >
                        <Image src={img.url} alt="generated" fill className="object-cover" />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default LiveChatInputBox;


