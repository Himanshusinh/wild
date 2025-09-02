'use client';

import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import TextToImageInputBox from '../ImageGeneration/TextToImage/compo/InputBox';
import LogoGenerationInputBox from '../ImageGeneration/LogoGeneration/compo/InputBox';
import StickerGenerationInputBox from '../ImageGeneration/StickerGeneration/compo/InputBox';
import TextToVideoInputBox from '../VideoGeneration/TextToVideo/compo/InputBox';
import TextToMusicInputBox from '../MusicGeneration/TextToMusic/compo/InputBox';
import MockupGenerationInputBox from '../MockupGeneation/compo/InputBox';
import ProductGenerationInputBox from '../ProductGeneration/compo/ProductWithModelPoseInputBox';
import AdGenerationInputBox from '../AdGeneration/compo/InputBox';
import History from './History';
import Bookmarks from './Bookmarks';
import { loadHistory, clearHistoryByType } from '@/store/slices/historySlice';
import LiveChatInputBox from '../wildmindskit/LiveChat/compo/InputBox';

type ViewType = 'generation' | 'history' | 'bookmarks';
type GenerationType = 'text-to-image' | 'image-to-image' | 'logo-generation' | 'sticker-generation' | 'text-to-video' | 'image-to-video' | 'text-to-music' | 'mockup-generation' | 'product-generation' | 'ad-generation' | 'live-chat';

interface GeneratorComponentMap {
  [key: string]: React.ComponentType;
}

const generators: GeneratorComponentMap = {
  // Image Generation Features
  'text-to-image': TextToImageInputBox,
  'image-to-image': TextToImageInputBox, // Uses same component as text-to-image (supports image uploads)
  'logo-generation': LogoGenerationInputBox,
  'sticker-generation': StickerGenerationInputBox,
  
  // Video Generation Features
  'text-to-video': TextToVideoInputBox,
  'image-to-video': TextToVideoInputBox, // Uses same component as text-to-video (supports image-to-video mode)
  
  // Music Generation Features
  'text-to-music': TextToMusicInputBox,
  
  // Branding Kit Features
  'mockup-generation': MockupGenerationInputBox,
  'product-generation': ProductGenerationInputBox,
  'ad-generation': AdGenerationInputBox,
  'live-chat': LiveChatInputBox,
};

export default function PageRouter() {
  const dispatch = useAppDispatch();
  const currentView = useAppSelector((state: any) => state.ui?.currentView || 'generation');
  const currentGenerationType = useAppSelector((state: any) => state.ui?.currentGenerationType || 'text-to-image') as GenerationType;
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const currentFilters = useAppSelector((state: any) => state.history?.filters || {});
  const isHistoryLoading = useAppSelector((state: any) => state.history?.loading || false);
  
  // Use ref to track which generation types we've already loaded history for
  const loadedTypesRef = useRef<Set<string>>(new Set());
  const previousGenerationTypeRef = useRef<string>(currentGenerationType);
  const isInitialLoadRef = useRef<boolean>(true);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  const effectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load filtered history for the active generation type
  useEffect(() => {
    // Debounce the entire effect to prevent rapid state changes
    if (effectTimeoutRef.current) {
      clearTimeout(effectTimeoutRef.current);
    }
    
    effectTimeoutRef.current = setTimeout(() => {
      if (currentView === 'generation') {
        // Prevent multiple simultaneous loads
        if (isLoadingRef.current) {
          return;
        }
        
        // Check if generation type changed
        const generationTypeChanged = previousGenerationTypeRef.current !== currentGenerationType;
        
        // Check if we already have entries for this generation type
        const hasEntriesForType = historyEntries.some((entry: any) => entry.generationType === currentGenerationType);
        const alreadyLoaded = loadedTypesRef.current.has(currentGenerationType);
        
        // Only clear history if this is NOT the initial load and generation type actually changed
        if (generationTypeChanged && !isInitialLoadRef.current) {
          // Only clear if we actually have entries for the previous type
          const previousType = previousGenerationTypeRef.current;
          const hasPreviousEntries = historyEntries.some((entry: any) => entry.generationType === previousType);
          
          if (hasPreviousEntries) {
            // Clear any existing timeout
            if (clearTimeoutRef.current) {
              clearTimeout(clearTimeoutRef.current);
            }
            
            // Debounce the history clearing to prevent rapid clearing
            clearTimeoutRef.current = setTimeout(() => {
              if (previousType && previousType !== currentGenerationType) {
                dispatch(clearHistoryByType(previousType));
              }
            }, 100); // 100ms debounce
          } else {
            // no-op
          }
          
          loadedTypesRef.current.clear();
          previousGenerationTypeRef.current = currentGenerationType;
        }
        
        // Mark that initial load is complete
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
        }
        
        // Only load history if we haven't loaded it for this type before
        if (!loadedTypesRef.current.has(currentGenerationType)) {
          isLoadingRef.current = true;
          dispatch(loadHistory({ 
            filters: { generationType: currentGenerationType }, 
            paginationParams: { limit: 10 } 
          }))
            .finally(() => {
              isLoadingRef.current = false;
            });
          loadedTypesRef.current.add(currentGenerationType);
        } else if (!hasEntriesForType && !isInitialLoadRef.current && !isHistoryLoading) {
          // If we've loaded before but don't have entries, reload (but not on initial load or while loading)
          isLoadingRef.current = true;
          dispatch(loadHistory({ 
            filters: { generationType: currentGenerationType }, 
            paginationParams: { limit: 10 } 
          }))
            .finally(() => {
              isLoadingRef.current = false;
            });
        } else {
          // no-op
        }
      }
    }, 50); // 50ms debounce for the entire effect
    
    // Cleanup function
    return () => {
      if (effectTimeoutRef.current) {
        clearTimeout(effectTimeoutRef.current);
      }
    };
  }, [dispatch, currentView, currentGenerationType]); // Removed historyEntries and currentFilters to prevent infinite loop

  // Cleanup effect to reset refs on unmount and clear timeouts
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
      if (effectTimeoutRef.current) {
        clearTimeout(effectTimeoutRef.current);
      }
      loadedTypesRef.current.clear();
      previousGenerationTypeRef.current = currentGenerationType;
    };
  }, [currentGenerationType]);

  // Handle different views
  if (currentView === 'history') {
    return (
      <div className="min-h-screen p-6">
        <History />
      </div>
    );
  }

  if (currentView === 'bookmarks') {
    return (
      <div className="min-h-screen p-6">
        <Bookmarks />
      </div>
    );
  }

  // Handle generation features
  const GeneratorComponent = generators[currentGenerationType] || TextToImageInputBox;
  
  return (
    <div className="relative min-h-screen">
      <GeneratorComponent />
    </div>
  );
}

