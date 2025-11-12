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
import { loadHistory, clearHistoryByType, loadMoreHistory } from '@/store/slices/historySlice';
import LiveChatInputBox from '../wildmindskit/LiveChat/compo/InputBox';
import EditImageInterface from '../../EditImage/compo/EditImageInterface';
import EditVideoInterface from '../../EditVideo/compo/EditVideoInterface';

type ViewType = 'generation' | 'history' | 'bookmarks';
type GenerationType = 'text-to-image' | 'image-to-image' | 'logo' | 'sticker-generation' | 'text-to-video' | 'image-to-video' | 'text-to-music' | 'mockup-generation' | 'product-generation' | 'ad-generation' | 'live-chat' | 'edit-image' | 'edit-video';

interface GeneratorComponentMap {
  [key: string]: React.ComponentType;
}

const generators: GeneratorComponentMap = {
  // Image Generation Features
  'text-to-image': TextToImageInputBox,
  'image-to-image': TextToImageInputBox, // Uses same component as text-to-image (supports image uploads)
  'logo': LogoGenerationInputBox,
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
  
  // Image Editing Features
  'edit-image': EditImageInterface,
  'edit-video': EditVideoInterface,
};

export default function PageRouter({ currentView: propCurrentView, currentGenerationType: propCurrentGenerationType }: { currentView?: ViewType; currentGenerationType?: GenerationType } = {}) {
  const dispatch = useAppDispatch();
  const selectedView = useAppSelector((state: any) => state.ui?.currentView || 'generation');
  const selectedGenerationType = useAppSelector((state: any) => state.ui?.currentGenerationType || 'text-to-image') as GenerationType;
  const currentView = propCurrentView ?? selectedView;
  const currentGenerationType = propCurrentGenerationType ?? selectedGenerationType;
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
  // Helper: single-page fetch for a given filter (no auto-pagination)
  const fetchFirstPage = async (filtersObj: any) => {
    try {
      if (isHistoryLoading) {
        try { console.log('[PageRouter] fetchFirstPage.skip: store already loading'); } catch {}
        return;
      }
      const isVideoMode = !!(filtersObj && (filtersObj.mode === 'video'));
      const isTextToImage = !!(filtersObj && filtersObj.generationType === 'text-to-image');
      const limit = isVideoMode ? 50 : (isTextToImage ? 50 : 50);
      const debugTag = `central:${Date.now()}`;
      console.log('[PageRouter] fetchFirstPage', { filtersObj, limit, debugTag, currentGenerationType });
      const expectedType = (filtersObj?.generationType 
        || (isVideoMode ? 'text-to-video' 
        : ((currentGenerationType === 'image-to-image') ? 'text-to-image' : currentGenerationType)));
      const result: any = await (dispatch as any)(loadHistory({ 
        filters: filtersObj, 
        paginationParams: { limit },
        requestOrigin: 'central',
        expectedType,
        debugTag
      } as any)).unwrap();
      console.log('[PageRouter] fetchFirstPage.fulfilled', { received: result?.entries?.length, hasMore: result?.hasMore, debugTag });
    } catch (e: any) {
      if (e && e.name === 'ConditionError') {
        try { console.log('[PageRouter] fetchFirstPage.skip: condition aborted'); } catch {}
        return;
      }
      console.error('[PageRouter] fetchFirstPage.error', e);
    }
  };


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
        
        // Normalize type for history filters (history doesn't track 'image-to-image' separately)
        const historyGenerationType = (currentGenerationType === 'image-to-image') ? 'text-to-image' : currentGenerationType;

        // Skip central fetch for self-managed pages that load their own history (to prevent duplicate requests)
        const selfManagedTypes = new Set<GenerationType>([
          'logo',
          'sticker-generation',
          'product-generation',
          'ad-generation',
          'mockup-generation',
          'live-chat',
          'edit-image',
          'edit-video',
        ]);
        if (selfManagedTypes.has(historyGenerationType)) {
          // Keep refs in sync but do not dispatch loadHistory here
          previousGenerationTypeRef.current = currentGenerationType;
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
                try {
                  dispatch(clearHistoryByType(previousType as any));
                } catch (e) {
                  console.warn('clearHistoryByType skipped due to invalid type:', previousType);
                }
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
          const isVideoPage = ['text-to-video', 'image-to-video', 'video-to-video'].includes(historyGenerationType);
          const filters = isVideoPage 
            ? ({ mode: 'video' } as any)
            : ({ generationType: historyGenerationType as any } as any);
          fetchFirstPage(filters)
            .then(() => {
              // Only mark as loaded when the fetch actually ran
              loadedTypesRef.current.add(currentGenerationType);
            })
            .catch((_e) => {
              // If aborted by condition, leave as not-loaded so a later attempt can retry
            })
            .finally(() => {
              isLoadingRef.current = false;
            });
        } else if (!hasEntriesForType && !isInitialLoadRef.current && !isHistoryLoading) {
          // If we've loaded before but don't have entries, reload (but not on initial load or while loading)
          isLoadingRef.current = true;
          const isVideoPage = ['text-to-video', 'image-to-video', 'video-to-video'].includes(historyGenerationType);
          const filters = isVideoPage 
            ? ({ mode: 'video' } as any)
            : ({ generationType: historyGenerationType as any } as any);
          fetchFirstPage(filters)
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

