'use client';

import React from 'react';
import Image from 'next/image';
import { Share, Trash2, Palette, Video } from 'lucide-react';
// Redirect to Edit Image page rather than opening inline popups
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { HistoryEntry } from '@/types/history';
import axiosInstance from '@/lib/axiosInstance';
import { removeHistoryEntry, updateHistoryEntry } from '@/store/slices/historySlice';
import { downloadFileWithNaming, getFileType, getExtensionFromUrl } from '@/utils/downloadUtils';
import { getModelDisplayName } from '@/utils/modelDisplayNames';

interface ImagePreviewModalProps {
  preview: { entry: HistoryEntry; image: { id?: string; url: string } } | null;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ preview, onClose }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.auth?.user);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  const toProxyPath = React.useCallback((urlOrPath: string | undefined) => {
    if (!urlOrPath) return '';
    const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
    if (urlOrPath.startsWith(ZATA_PREFIX)) {
      return urlOrPath.substring(ZATA_PREFIX.length);
    }
    // Allow direct storagePath-like values (users/...)
    if (/^users\//.test(urlOrPath)) return urlOrPath;
    // For external URLs (fal.media, etc.), return empty to indicate they should be used directly
    return '';
  }, []);

  const toProxyResourceUrl = React.useCallback((urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    // Use frontend Next.js proxy instead of backend API to avoid SSL issues
    return path ? `/api/proxy/resource/${encodeURIComponent(path)}` : '';
  }, [toProxyPath]);
  
  // Move all hooks to the top before any conditional returns
  const [isPromptExpanded, setIsPromptExpanded] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
  const [objectUrl, setObjectUrl] = React.useState<string>('');
  const [copiedButtonId, setCopiedButtonId] = React.useState<string | null>(null);
  const [isPublicFlag, setIsPublicFlag] = React.useState<boolean>(true);
  const [imageDimensions, setImageDimensions] = React.useState<{ width: number; height: number } | null>(null);
  // Local state to track the current entry (updated after deletion)
  const [currentEntry, setCurrentEntry] = React.useState<HistoryEntry | null>(preview?.entry || null);
  
  // Update currentEntry when preview changes
  React.useEffect(() => {
    if (preview?.entry) {
      setCurrentEntry(preview.entry);
    }
  }, [preview?.entry?.id, preview?.entry?.images?.length]);
  // Popups removed in favor of redirecting to Edit Image page
  const router = useRouter();

  // single dispatch instance
  // Fullscreen viewer state
  const [isFsOpen, setIsFsOpen] = React.useState(false);
  const [fsScale, setFsScale] = React.useState(1);
  const [fsFitScale, setFsFitScale] = React.useState(1);
  const [fsOffset, setFsOffset] = React.useState({ x: 0, y: 0 });
  const [fsIsPanning, setFsIsPanning] = React.useState(false);
  const [fsLastPoint, setFsLastPoint] = React.useState({ x: 0, y: 0 });
  const [fsNaturalSize, setFsNaturalSize] = React.useState({ width: 0, height: 0 });
  const fsContainerRef = React.useRef<HTMLDivElement>(null);
  const wheelNavCooldown = React.useRef(false);
  
  // -------- Fullscreen helpers (declared before any early returns) ---------
  const fsClampOffset = React.useCallback((newOffset: { x: number; y: number }, currentScale: number) => {
    if (!fsContainerRef.current) return newOffset;
    const rect = fsContainerRef.current.getBoundingClientRect();
    const imgW = fsNaturalSize.width * currentScale;
    const imgH = fsNaturalSize.height * currentScale;
    const maxX = Math.max(0, (imgW - rect.width) / 2);
    const maxY = Math.max(0, (imgH - rect.height) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, newOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, newOffset.y))
    };
  }, [fsNaturalSize]);

  const fsZoomToPoint = React.useCallback((point: { x: number; y: number }, newScale: number) => {
    if (!fsContainerRef.current) return;
    const rect = fsContainerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newOffsetX = centerX - (point.x * newScale);
    const newOffsetY = centerY - (point.y * newScale);
    const clamped = fsClampOffset({ x: newOffsetX, y: newOffsetY }, newScale);
    setFsScale(newScale);
    setFsOffset(clamped);
  }, [fsClampOffset]);

  const openFullscreen = React.useCallback(() => {
    setIsFsOpen(true);
  }, []);

  const closeFullscreen = React.useCallback(() => {
    setIsFsOpen(false);
    setFsIsPanning(false);
  }, []);

  // Compute fit scale on open/resize
  React.useEffect(() => {
    if (!isFsOpen) return;
    const computeFit = () => {
      if (!fsContainerRef.current || !fsNaturalSize.width || !fsNaturalSize.height) return;
      const rect = fsContainerRef.current.getBoundingClientRect();
      const fit = Math.min(rect.width / fsNaturalSize.width, rect.height / fsNaturalSize.height) || 1;
      const base = Math.min(1, fit); // do not upscale by default
      setFsFitScale(base);
      setFsScale(base);
      setFsOffset({ x: 0, y: 0 });
    };
    computeFit();
    const onResize = () => computeFit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    
  }, [isFsOpen, fsNaturalSize]);

  // Lock background scroll while fullscreen is open
  React.useEffect(() => {
    if (!isFsOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isFsOpen]);

  // Build gallery from images in the SAME ENTRY (same generation run)
  // Use currentEntry instead of preview.entry so it updates after deletion
  const sameDateGallery = React.useMemo(() => {
    try {
      const entryToUse = currentEntry || preview?.entry;
      if (!entryToUse) return [] as Array<{ entry: any, image: any }>;
      const imgs = (entryToUse as any)?.images || [];
      return imgs.map((im: any) => ({ entry: entryToUse, image: im }));
    } catch { return []; }
  }, [currentEntry, preview]);

  const goPrev = React.useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    try { if (e && 'preventDefault' in e) { e.preventDefault(); } } catch {}
    setSelectedIndex((idx) => {
      const total = (sameDateGallery as any[]).length;
      if (total <= 1) return idx;
      const prevIdx = (idx - 1 + total) % total;
      try {
        const prevPair: any = (sameDateGallery as any[])[prevIdx];
        console.log('[Fullscreen] Prev image clicked', { fromIndex: idx, toIndex: prevIdx, total, url: prevPair?.image?.url || prevPair?.image?.storagePath });
      } catch {}
      return prevIdx;
    });
  }, [sameDateGallery]);

  const goNext = React.useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    try { if (e && 'preventDefault' in e) { e.preventDefault(); } } catch {}
    setSelectedIndex((idx) => {
      const total = (sameDateGallery as any[]).length;
      if (total <= 1) return idx;
      const nextIdx = (idx + 1) % total;
      try {
        const nextPair: any = (sameDateGallery as any[])[nextIdx];
        console.log('[Fullscreen] Next image clicked', { fromIndex: idx, toIndex: nextIdx, total, url: nextPair?.image?.url || nextPair?.image?.storagePath });
      } catch {}
      return nextIdx;
    });
  }, [sameDateGallery]);

  const fsOnWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!fsContainerRef.current) return;

    // If not zoomed in, use wheel to navigate between images
    if (fsScale <= fsFitScale + 0.001) {
      if (wheelNavCooldown.current) return;
      const dy = e.deltaY || 0;
      const dx = e.deltaX || 0;
      const delta = Math.abs(dy) > Math.abs(dx) ? dy : dx;
      if (delta > 20) {
        goNext();
      } else if (delta < -20) {
        goPrev();
      }
      wheelNavCooldown.current = true;
      setTimeout(() => { wheelNavCooldown.current = false; }, 250);
      return;
    }

    // When zoomed, keep existing zoom-to-point behavior
    const rect = fsContainerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const deltaZoom = e.deltaY > 0 ? -0.1 : 0.1;
    const next = Math.max(0.5, Math.min(6, fsScale + deltaZoom));
    if (next !== fsScale) fsZoomToPoint({ x: mx, y: my }, next);
  }, [fsScale, fsFitScale, fsZoomToPoint, goNext, goPrev]);

  const fsOnMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Determine click position relative to container for zoom-to-point
    if (fsContainerRef.current) {
      const rect = fsContainerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const atFit = fsScale <= fsFitScale + 0.001;

      // Left button
      if (e.button === 0) {
        if (atFit) {
          // Zoom in to point from fit
          const next = Math.min(6, fsScale * 1.2);
          if (next !== fsScale) {
            fsZoomToPoint({ x: mx, y: my }, next);
            return;
          }
        } else {
          // When zoomed, start panning with left button
          setFsIsPanning(true);
          setFsLastPoint({ x: e.clientX, y: e.clientY });
          return;
        }
      }

      // Middle button -> always pan
      if (e.button === 1) {
        setFsIsPanning(true);
        setFsLastPoint({ x: e.clientX, y: e.clientY });
        return;
      }

      // Right button -> zoom out from point
      if (e.button === 2) {
        const next = Math.max(0.5, fsScale / 1.2);
        if (next !== fsScale) {
          fsZoomToPoint({ x: mx, y: my }, next);
          return;
        }
      }
    }

    // Fallback: start panning
    setFsIsPanning(true);
    setFsLastPoint({ x: e.clientX, y: e.clientY });
  }, [fsScale, fsFitScale, fsZoomToPoint]);

  const fsOnMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!fsIsPanning) return;
    e.preventDefault();
    const dx = e.clientX - fsLastPoint.x;
    const dy = e.clientY - fsLastPoint.y;
    const clamped = fsClampOffset({ x: fsOffset.x + dx, y: fsOffset.y + dy }, fsScale);
    setFsOffset(clamped);
    setFsLastPoint({ x: e.clientX, y: e.clientY });
  }, [fsIsPanning, fsLastPoint, fsOffset, fsClampOffset, fsScale]);

  const fsOnMouseUp = React.useCallback(() => setFsIsPanning(false), []);

  // Keyboard navigation in fullscreen
  React.useEffect(() => {
    if (!isFsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFsOpen, goPrev, goNext, closeFullscreen]);
  
  // (moved above for navigation callbacks)

  // Select clicked image within same-date gallery
  const initialIndex = React.useMemo(() => {
    if (!preview) return 0;
    const mUrl = (preview.image as any)?.url;
    const mId = (preview.image as any)?.id;
    const mEntryId = (preview.entry as any)?.id;
    const idx = sameDateGallery.findIndex((pair: any) => {
      return (pair?.entry?.id === mEntryId) && ((mId && pair?.image?.id === mId) || (mUrl && pair?.image?.url === mUrl));
    });
    return idx >= 0 ? idx : 0;
  }, [sameDateGallery, preview]);

  React.useEffect(() => setSelectedIndex(initialIndex), [initialIndex]);

  // Keep visibility toggle in sync when user switches images in same run
  React.useEffect(() => {
    try {
      const selectedPair = sameDateGallery[selectedIndex] || { entry: preview?.entry, image: preview?.image };
      const selectedImage = selectedPair.image || preview?.image;
      const isPublic = ((selectedImage as any)?.isPublic !== false);
      setIsPublicFlag(isPublic);
    } catch {}
  }, [selectedIndex, sameDateGallery, preview]);

  // Only show immediate neighbors (left/right) in the sidebar thumbnails
  const windowGallery = React.useMemo(() => {
    const total = (sameDateGallery as any[]).length;
    if (total === 0) return [] as any[];
    if (total === 1) return [sameDateGallery[0]] as any[];
    const prevIdx = (selectedIndex - 1 + total) % total;
    const nextIdx = (selectedIndex + 1) % total;
    const result: any[] = [];
    result.push(sameDateGallery[prevIdx]);
    result.push(sameDateGallery[selectedIndex]);
    if (total > 2) result.push(sameDateGallery[nextIdx]);
    return result;
  }, [sameDateGallery, selectedIndex]);

  // Lock background scroll while modal is open
  React.useEffect(() => {
    if (!preview) return;
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = (document.documentElement as HTMLElement).style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    (document.documentElement as HTMLElement).style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      (document.documentElement as HTMLElement).style.overscrollBehavior = prevOverscroll;
    };
  }, [preview]);

  // Helper to get media proxy URL
  const toMediaProxyUrl = React.useCallback((urlOrPath: string | undefined) => {
    if (!urlOrPath) return '';
    // If it's already a full HTTP/HTTPS URL (external), use it directly
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      return urlOrPath;
    }
    const path = toProxyPath(urlOrPath);
    // If path is empty, it means it's not a Zata URL - use original URL directly
    if (!path) return urlOrPath;
    // For Zata paths, use proxy
    return `/api/proxy/media/${encodeURIComponent(path)}`;
  }, [toProxyPath]);

  React.useEffect(() => {
    if (!preview) return;
    
    let revoke: string | null = null;
    setObjectUrl('');
    setImageDimensions(null); // Reset dimensions when image changes
    const run = async () => {
      try {
        const selectedPair = sameDateGallery[selectedIndex] || { entry: preview?.entry, image: preview?.image };
        const selectedImage = selectedPair.image || preview.image;
        const imageUrl = selectedImage?.url || preview.image.url;
        if (!imageUrl) return;
        
        // Use media proxy for Zata URLs, direct URL for external URLs (FAL, etc.)
        const url = toMediaProxyUrl(imageUrl);
        if (!url) return;
        
        // For external URLs (FAL), use CORS mode; for proxy URLs, use credentials
        const isExternalUrl = url.startsWith('http://') || url.startsWith('https://');
        const res = await fetch(url, {
          credentials: isExternalUrl ? 'omit' : 'include',
          mode: isExternalUrl ? 'cors' : 'same-origin'
        });
        if (!res.ok) {
          console.warn('[ImagePreviewModal] Failed to fetch image:', url, res.status);
          return;
        }
        const blob = await res.blob();
        const obj = URL.createObjectURL(blob);
        revoke = obj;
        setObjectUrl(obj);
      } catch (err) {
        console.error('[ImagePreviewModal] Error loading image:', err);
      }
    };
    run();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [selectedIndex, preview, sameDateGallery, toMediaProxyUrl]);

  if (!preview) return null;

  const toProxyDownloadUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `${API_BASE}/api/proxy/download/${encodeURIComponent(path)}` : '';
  };

  // removed earlier duplicate definition; using single helper below near navigation

  const extractStyleFromPrompt = (promptText: string): string | undefined => {
    const match = promptText.match(/\[\s*Style:\s*([^\]]+)\]/i);
    return match?.[1]?.trim();
  };

  const handleDelete = async () => {
    try {
      const selectedPair = sameDateGallery[selectedIndex] || { entry: preview?.entry, image: preview?.image };
      const imageToDelete = selectedPair.image || preview?.image;
      const entry = selectedPair.entry || preview?.entry;
      
      if (!window.confirm('Delete this image permanently? This cannot be undone.')) return;
      
      // Get the current entry to check how many images it has
      const currentImages = Array.isArray((entry as any)?.images) ? (entry as any).images : [];
      const remainingImages = currentImages.filter((img: any) => {
        // Match by id, url, or storagePath
        const matchesId = imageToDelete?.id && img.id === imageToDelete.id;
        const matchesUrl = imageToDelete?.url && img.url === imageToDelete.url;
        const matchesStoragePath = (imageToDelete as any)?.storagePath && img.storagePath === (imageToDelete as any).storagePath;
        return !(matchesId || matchesUrl || matchesStoragePath);
      });
      
      // If this is the last image, delete the entire entry
      if (remainingImages.length === 0) {
        await axiosInstance.delete(`/api/generations/${entry.id}`);
        try { dispatch(removeHistoryEntry(entry.id)); } catch {}
        onClose();
      } else {
        // Otherwise, update the entry to remove just this image
        await axiosInstance.patch(`/api/generations/${entry.id}`, {
          images: remainingImages
        });
        // Update Redux store with the new images array
        try {
          dispatch(updateHistoryEntry({ id: entry.id, updates: { images: remainingImages } as any }));
        } catch {}
        // Update local entry state so the gallery updates immediately
        setCurrentEntry({ ...entry, images: remainingImages } as any);
        // Adjust the selected index - if we deleted the last image, go to the previous one
        // If we deleted a middle image, stay at the same index (which will now show the next image)
        const newIndex = Math.min(selectedIndex, remainingImages.length - 1);
        if (newIndex >= 0 && newIndex < remainingImages.length) {
          setSelectedIndex(newIndex);
        } else {
          // Shouldn't happen, but close if somehow no valid index
          onClose();
        }
      }
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Failed to delete image');
    }
  };


  const getCleanPrompt = (promptText: string): string => {
    return promptText.replace(/\[\s*Style:\s*[^\]]+\]/i, '').trim();
  };

  const copyPrompt = async (prompt: string, buttonId: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedButtonId(buttonId);
      setTimeout(() => {
        setCopiedButtonId(null);
      }, 2000); // Hide after 2 seconds
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const downloadImage = async (url: string) => {
    try {
      await downloadFileWithNaming(url, null, 'image');
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const toggleVisibility = async () => {
    try {
      const next = !isPublicFlag;
      setIsPublicFlag(next);
      try {
        if (selectedEntry?.id) {
          const target = selectedImage;
          const payload: any = target?.url || target?.id || target?.storagePath ? { image: { id: (target as any)?.id, url: (target as any)?.url, storagePath: (target as any)?.storagePath, isPublic: next } } : { isPublic: next };
          await axiosInstance.patch(`/api/generations/${selectedEntry.id}`, payload);
          try {
            const images = Array.isArray((selectedEntry as any).images) ? (selectedEntry as any).images.map((im: any) => {
              if ((target?.id && im.id === target.id) || (target?.url && im.url === target.url) || (target as any)?.storagePath && im.storagePath === (target as any).storagePath) {
                return { ...im, isPublic: next };
              }
              return im;
            }) : (selectedEntry as any).images;
            dispatch(updateHistoryEntry({ id: selectedEntry.id, updates: { images } as any }));
          } catch {}
        }
      } catch {}
    } catch {}
  };

  const shareImage = async (url: string) => {
    try {
      // Check if the Web Share API is available
      if (!navigator.share) {
        // Fallback: Copy image URL to clipboard
        await copyToClipboard(url);
        alert('Image URL copied to clipboard!');
        return;
      }

      // Fetch the image as a blob
      const downloadUrl = toProxyDownloadUrl(url);
      if (!downloadUrl) return;
      
      const response = await fetch(downloadUrl, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      const blob = await response.blob();
      const fileName = (toProxyPath(url) || 'generated-image').split('/').pop() || 'generated-image.jpg';
      
      // Create a File from the blob
      const file = new File([blob], fileName, { type: blob.type });
      
      // Use Web Share API
      await navigator.share({
        title: 'Wild Mind AI Generated Image',
        text: `Check out this AI-generated image!\n${cleanPrompt.substring(0, 100)}...`,
        files: [file]
      });
      
      console.log('Image shared successfully');
    } catch (error: any) {
      // Handle user cancellation gracefully
      if (error.name === 'AbortError') {
        console.log('Share cancelled by user');
        return;
      }
      
      // Fallback to copying URL
      console.error('Share failed:', error);
      try {
        await copyToClipboard(url);
        alert('Sharing not supported. Image URL copied to clipboard!');
      } catch (copyError) {
        console.error('Copy failed:', copyError);
        alert('Unable to share image. Please try downloading instead.');
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const selectedPair: any = sameDateGallery[selectedIndex] || { entry: currentEntry || preview?.entry, image: preview?.image };
  const selectedImage: any = selectedPair.image || preview?.image;
  const selectedEntry: any = selectedPair.entry || currentEntry || preview?.entry;
  const isUserUploadSelected = false;

  // Helper function to calculate aspect ratio from dimensions
  const calculateAspectRatio = (width: number, height: number): string => {
    if (!width || !height || width <= 0 || height <= 0) return '—';
    
    const ratio = width / height;
    const tolerance = 0.01; // 1% tolerance for matching common ratios
    
    // Common aspect ratios with their decimal values
    const commonRatios: Array<{ ratio: number; label: string }> = [
      { ratio: 1.0, label: '1:1' },
      { ratio: 4/3, label: '4:3' },
      { ratio: 3/4, label: '3:4' },
      { ratio: 16/9, label: '16:9' },
      { ratio: 9/16, label: '9:16' },
      { ratio: 3/2, label: '3:2' },
      { ratio: 2/3, label: '2:3' },
      { ratio: 21/9, label: '21:9' },
      { ratio: 9/21, label: '9:21' },
      { ratio: 16/10, label: '16:10' },
      { ratio: 10/16, label: '10:16' },
      { ratio: 5/4, label: '5:4' },
      { ratio: 4/5, label: '4:5' },
    ];
    
    // Check if ratio matches any common ratio (within tolerance)
    for (const common of commonRatios) {
      if (Math.abs(ratio - common.ratio) < tolerance || Math.abs(ratio - 1/common.ratio) < tolerance) {
        return common.label;
      }
    }
    
    // If no match, calculate simplified ratio using GCD
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    const w = width / divisor;
    const h = height / divisor;
    
    // If the simplified ratio is reasonable, return it
    if (w <= 100 && h <= 100) {
      return `${w}:${h}`;
    }
    
    // Otherwise, return a rounded decimal ratio
    return `${Math.round(ratio * 100) / 100}:1`;
  };

  // Get aspect ratio from entry or calculate from image dimensions
  const getAspectRatio = (): string => {
    // First try to get from stored fields
    const stored = selectedEntry?.frameSize || selectedEntry?.aspect_ratio || selectedEntry?.aspectRatio;
    if (stored && stored !== '—' && stored !== null && stored !== undefined) return stored;
    
    // Try to get from image metadata (stored in database)
    const imgWidth = (selectedImage as any)?.width || (selectedEntry as any)?.width;
    const imgHeight = (selectedImage as any)?.height || (selectedEntry as any)?.height;
    if (imgWidth && imgHeight) {
      return calculateAspectRatio(imgWidth, imgHeight);
    }
    
    // Try to get from loaded image dimensions (from onLoad event)
    if (imageDimensions && imageDimensions.width && imageDimensions.height) {
      return calculateAspectRatio(imageDimensions.width, imageDimensions.height);
    }
    
    return '—';
  };

  const displayedStyle = selectedEntry?.style || extractStyleFromPrompt(selectedEntry?.prompt || '') || '—';
  const displayedAspect = getAspectRatio();
  const cleanPrompt = getCleanPrompt(selectedEntry?.prompt || '');
  const isLongPrompt = cleanPrompt.length > 280;



  const toFrontendProxyResourceUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `/api/proxy/resource/${encodeURIComponent(path)}` : '';
  };

  const isBlobOrDataUrl = (u?: string) => !!u && (u.startsWith('blob:') || u.startsWith('data:'));

  const navigateToEdit = (feature: 'upscale' | 'remove-bg' | 'resize') => {
    try {
      const storagePath = (selectedImage as any)?.storagePath || (() => {
        const original = selectedImage?.url || '';
        const pathCandidate = toProxyPath(original);
        return pathCandidate && pathCandidate !== original ? pathCandidate : '';
      })();

      // Prefer stable frontend proxy from storagePath; fallback to http(s) url; never use blob:/data:
      const fallbackHttp = selectedImage?.url && !isBlobOrDataUrl(selectedImage.url) ? selectedImage.url : (preview.image.url && !isBlobOrDataUrl(preview.image.url) ? preview.image.url : '');
      const imgUrl = toFrontendProxyResourceUrl(storagePath) || fallbackHttp;
      const qs = new URLSearchParams();
      qs.set('feature', feature);
      if (imgUrl) qs.set('image', imgUrl);
      // Also pass raw storage path when available so the Edit page can reconstruct a public URL for external services
      if (storagePath) qs.set('sp', storagePath);
      router.push(`/edit-image?${qs.toString()}`);
      onClose();
    } catch {}
  };

  const handleEditInLiveCanvas = () => {
    try {
      // Navigate to Live Canvas with the current image
      const storagePath = (selectedImage as any)?.storagePath || (() => {
        const original = selectedImage?.url || '';
        const pathCandidate = toProxyPath(original);
        return pathCandidate && pathCandidate !== original ? pathCandidate : '';
      })();
      const fallbackHttp = selectedImage?.url && !isBlobOrDataUrl(selectedImage.url) ? selectedImage.url : (preview.image.url && !isBlobOrDataUrl(preview.image.url) ? preview.image.url : '');
      const imgUrl = toFrontendProxyResourceUrl(storagePath) || fallbackHttp;
      const qs = new URLSearchParams();
      if (imgUrl) qs.set('image', imgUrl);
      if (storagePath) qs.set('sp', storagePath);
      router.push(`/view/Generation/wildmindskit/LiveChat?${qs.toString()}`);
      onClose();
    } catch (error) {
      console.error('Error navigating to Live Canvas:', error);
    }
  };

  const handleCreateVideo = () => {
    try {
      // Navigate to Video Generation with the current image as input
      // Use the same approach as Remix button - use storagePath to construct direct Zata URL
      const storagePath = (selectedImage as any)?.storagePath || (() => {
        const original = selectedImage?.url || '';
        const pathCandidate = toProxyPath(original);
        return pathCandidate && pathCandidate !== original ? pathCandidate : '';
      })();
      
      const fallbackHttp = selectedImage?.url && !isBlobOrDataUrl(selectedImage.url) ? selectedImage.url : (preview.image.url && !isBlobOrDataUrl(preview.image.url) ? preview.image.url : '');
      
      // Use direct Zata URL (same as Remix button approach)
      const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
      let imgUrl = '';
      
      if (storagePath) {
        // Construct direct Zata URL from storage path (same as Remix)
        imgUrl = `${ZATA_PREFIX}${storagePath}`;
      } else if (fallbackHttp) {
        // If fallback is already a full Zata URL, use it directly
        if (fallbackHttp.startsWith(ZATA_PREFIX)) {
          imgUrl = fallbackHttp;
        } else if (fallbackHttp.startsWith('http://') || fallbackHttp.startsWith('https://')) {
          imgUrl = fallbackHttp;
        }
      }
      
      console.log('Create Video - ImagePreviewModal debug:', {
        selectedImage: selectedImage,
        storagePath: storagePath,
        imgUrl: imgUrl
      });
      
      const qs = new URLSearchParams();
      if (imgUrl) qs.set('image', imgUrl);
      if (storagePath) qs.set('sp', storagePath);
      
      const finalUrl = `/text-to-video?${qs.toString()}`;
      console.log('Create Video - Final URL:', finalUrl);
      
      router.push(finalUrl);
      onClose();
    } catch (error) {
      console.error('Error navigating to Video Generation:', error);
    }
  };


  return (
    <div 
      className="fixed inset-0 mt-15 bg-black/90 md:bg-black/70 backdrop-blur-sm z-70 flex items-center justify-center p-2 md:py-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    > 

    <button aria-label="Close" className="text-white/100 hover:text-white text-lg absolute top-8 right-10 " onClick={onClose}>✕</button>
      <div 
        className="relative  h-full  md:w-full md:max-w-6xl w-[90%] max-w-[90%] bg-transparent  border border-white/10 rounded-3xl overflow-hidden shadow-3xl"
        onClick={(e) => e.stopPropagation()}
      > 
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-transparent  ">
          <div className="text-white/70 text-sm"></div>
          <div className="flex items-center gap-2">
            {/* <button 
              className="p-2 rounded-full  text-white transition-colors" 
              onClick={handleDelete}
              aria-label="Delete image"
            >
              <Trash2 className="w-5 h-5" />
            </button> */}
          </div>
        </div>

        {/* Content */}
        <div className=" md:flex md:flex-row md:gap-0">
          {/* Media */}
          <div className="relative bg-transparent h-[35vh] md:h-[84vh] md:flex-1 group flex items-center justify-center ">
            {selectedImage?.url && (
              <div className="relative w-full h-full flex items-center justify-center ">
                <img
                  src={objectUrl || toMediaProxyUrl(selectedImage.url)}
                  alt={selectedEntry?.prompt}
                  className="object-contain w-auto h-auto max-w-full max-h-full mx-auto"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.naturalWidth && img.naturalHeight) {
                      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                    }
                  }}
                />
                {isUserUploadSelected && (
                  <div className="absolute top-3 left-3 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm ">User upload</div>
                )}
              </div>
            )}
            <button
              aria-label="Fullscreen"
              title="Fullscreen"
              className="absolute top-3 left-3 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-opacity"
              onClick={openFullscreen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M3 9V5a2 2 0 0 1 2-2h4" />
                <path d="M21 9V5a2 2 0 0 0-2-2h-4" />
                <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
                <path d="M3 15v4a2 2 0 0 0 2 2h4" />
              </svg>
            </button>
          </div>
          {/* Sidebar */}
          <div className="relative md:p-5 text-white white/10 bg-transparent h-[calc(100vh-35vh-60px)] md:h-full md:w-[34%] mt-4 md:mt-10 flex flex-col">
            {/* Action Buttons - Fixed on mobile */}
            <div className="md:mb-4 sticky md:relative top-0 md:top-auto left-0 right-0 md:left-auto md:right-auto z-40 md:z-auto p-4 md:p-0 bg-transparent md:bg-transparent backdrop-blur-0 md:backdrop-blur-0 border-b-0 md:border-b-0 md:mb-4 flex-shrink-0">
              <div className="flex gap-2">
              <div className="relative group flex-1">
                <button
                  onClick={() => downloadImage(selectedImage?.url || preview.image.url)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M12 3v12" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M5 19h14" />
                  </svg>
                </button>
                <div className="pointer-events-none absolute  left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Download</div>
              </div>

              <div className="relative group flex-1">
                <button
                  onClick={() => shareImage(selectedImage?.url || preview.image.url)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm"
                >
                  <Share className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Share</div>
              </div>

              <div className="relative group flex-1">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm"
                  aria-label="Delete image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Delete</div>
              </div>

              <div className="relative group flex-1">
                <button
                  onClick={toggleVisibility}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm`}
                  aria-pressed={isPublicFlag}
                  aria-label="Toggle visibility"
                  title={isPublicFlag ? 'Public' : 'Private'}
                >
                  {isPublicFlag ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l18 18"/><path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88"/><path d="M16.1 16.1C14.84 16.7 13.46 17 12 17 7 17 2.73 13.89 1 9.5a14.78 14.78 0 0 1 5.06-5.56"/></svg>
                  )}
                </button>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">{isPublicFlag ? 'Public' : 'Private'}</div>
              </div>
            </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 md:p-0 flex-1 overflow-y-auto custom-scrollbar pb-28 md:pb-0">
             {/* Date */}
             <div className="mb-1 ">
              <div className="text-white/60 text-sm uppercase tracking-wider mb-0">Date</div>
              <div className="text-white/80 text-sm">{new Date(selectedEntry?.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {(() => { const d = new Date(selectedEntry?.timestamp); const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); return `${dd}-${mm}-${yyyy}` })()}</div>
            </div>

            

            {/* Prompt */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-white/60 text-xs uppercase tracking-wider mb-0">
                <span>Prompt</span>
                <button 
                  onClick={() => copyPrompt(cleanPrompt, `preview-${preview.entry.id}`)}
                  className={`flex items-center gap-2 px-2 py-1.5 text-white/80 text-xs rounded-lg transition-colors ${
                    copiedButtonId === `preview-${preview.entry.id}` 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {copiedButtonId === `preview-${preview.entry.id}` ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </>
                  )}
                </button>
              </div>
              <div className={`text-white/90 text-xs leading-relaxed whitespace-pre-wrap break-words ${!isPromptExpanded && isLongPrompt ? 'line-clamp-4' : ''}`}>
                {cleanPrompt}
              </div>
              {isLongPrompt && (
                <button
                  onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                  className="mt-2 text-xs text-white/70 hover:text-white underline"
                >
                  Read {isPromptExpanded ? 'less' : 'more'}
                </button>
              )}
            </div>
            
           
            {/* Details */}
            <div className="mb-4">
              <div className="text-white/80 text-sm uppercase tracking-wider mb-1">Details</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Model:</span>
                  <span className="text-white/80 text-sm">{getModelDisplayName(selectedEntry?.model)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Style:</span>
                  <span className="text-white/80 text-sm">{displayedStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Aspect ratio:</span>
                  <span className="text-white/80 text-sm">{displayedAspect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Format:</span>
                  <span className="text-white/80 text-sm">Image</span>
                </div>
              </div>
            </div>
            {/* Gallery - show all images from this generation run in original order */}
            {Array.isArray((selectedEntry as any)?.images) && (selectedEntry as any).images.length > 1 && (
              <div className="mb-4">
                <div className="text-white/80 text-sm uppercase tracking-wider mb-1">Images</div>
                <div className="grid grid-cols-3 gap-2">
                  {sameDateGallery.map((pair: any, idx: number) => (
                    <button
                      key={pair.image?.id || idx}
                      onClick={() => {
                        try { setSelectedIndex(idx); } catch {}
                      }}
                      className={`relative aspect-square rounded-md overflow-hidden border transition-colors ${selectedIndex === idx ? 'border-white/10' : 'border-transparent hover:border-white/10'}`}
                    >
                      <img src={toMediaProxyUrl(pair.image?.url) || pair.image?.url} alt={`Image ${idx+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => navigateToEdit('upscale')}
                  className="flex-1 px-3 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-white text-sm ring-1 ring-white/20 transition"
                >
                  Upscale
                </button>
                <button
                  onClick={() => navigateToEdit('remove-bg')}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm ring-1 ring-white/20 transition"
                >
                  Remove background
                </button>
                
              </div>

              <div className="flex gap-2">
              <button
                  onClick={() => navigateToEdit('resize')}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm ring-1 ring-white/20 transition"
                >
                  Resize
                </button>
              <button
                onClick={() => {
                  try {
                    const storagePath = (selectedImage as any)?.storagePath || (() => {
                      const original = selectedImage?.url || '';
                      const pathCandidate = toProxyPath(original);
                      return pathCandidate && pathCandidate !== original ? pathCandidate : '';
                    })();
                    const fallbackHttp = selectedImage?.url && !isBlobOrDataUrl(selectedImage.url) ? selectedImage.url : (preview.image.url && !isBlobOrDataUrl(preview.image.url) ? preview.image.url : '');
                    const imgUrl = toFrontendProxyResourceUrl(storagePath) || fallbackHttp;
                    const qs = new URLSearchParams();
                    qs.set('prompt', cleanPrompt);
                    if (imgUrl) qs.set('image', imgUrl);
                    if (storagePath) qs.set('sp', storagePath);
                    // also pass model, frameSize and style for preselection
                    console.log('preview.entry', selectedEntry);
                    if (selectedEntry?.model) {
                      // Map backend model ids to UI dropdown ids where needed
                      const m = String(selectedEntry.model);
                      const mapped = m === 'bytedance/seedream-4' ? 'seedream-v4' : m;
                      qs.set('model', mapped);
                    }
                    if (selectedEntry?.frameSize) qs.set('frame', String(selectedEntry.frameSize));
                    const sty = selectedEntry?.style || extractStyleFromPrompt(selectedEntry?.prompt || '') || '';
                    if (sty) qs.set('style', String(sty));
                    // Client-side navigation to avoid full page reload
                    router.push(`/text-to-image?${qs.toString()}`);
                    onClose();
                  } catch {}
                }}
                className="flex-1 px-3 py-2 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white rounded-lg transition-colors text-sm font-medium shadow-[0_4px_16px_rgba(47,107,255,.45)]"
              >
                Remix 
              </button>
              </div>

              {/* New buttons row */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleEditInLiveCanvas}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm ring-1 ring-white/20 transition"
                >
                  {/* <Palette className="h-4 w-4" /> */}
                  Edit in Live Canvas
                </button>
                <button
                  onClick={handleCreateVideo}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm ring-1 ring-white/20 transition"
                >
                  {/* <Video className="h-4 w-4" /> */}
                  Create Video
                </button>
              </div>
              
            </div>
            </div>
          </div>
        </div>
      </div>
      {/* Fullscreen viewer overlay */}
      {isFsOpen && (
        <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex items-center justify-center">
          <div className="absolute top-3 right-4 z-[90]">
            <button aria-label="Close fullscreen" onClick={closeFullscreen} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm ring-1 ring-white/30">
              ✕
            </button>
          </div>
          {/* Navigation arrows (only when multiple images in this run) */}
          {(sameDateGallery.length > 1) && <button
            aria-label="Previous image"
            onClick={(e) => { e.stopPropagation(); goPrev(e); }}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[90] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center ring-1 ring-white/20 pointer-events-auto"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>}
          {(sameDateGallery.length > 1) && <button
            aria-label="Next image"
            onClick={(e) => { e.stopPropagation(); goNext(e); }}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[90] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center ring-1 ring-white/20 pointer-events-auto"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
          </button>}
          <div
            ref={fsContainerRef}
            className="relative w-full h-full cursor-zoom-in"
            onWheel={fsOnWheel}
            onMouseDown={fsOnMouseDown}
            onMouseMove={fsOnMouseMove}
            onMouseUp={fsOnMouseUp}
            onMouseLeave={fsOnMouseUp}
            onContextMenu={(e) => { e.preventDefault(); }}
            style={{ cursor: fsScale > fsFitScale ? (fsIsPanning ? 'grabbing' : 'grab') : 'zoom-in' }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate3d(${fsOffset.x}px, ${fsOffset.y}px, 0) scale(${fsScale})`,
                transformOrigin: 'center center',
                transition: fsIsPanning ? 'none' : 'transform 0.15s ease-out'
              }}
            >
              <img
                src={objectUrl || toMediaProxyUrl(selectedImage?.url) || toMediaProxyUrl(preview.image.url)}
                alt={selectedEntry?.prompt}
                onLoad={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  setFsNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                }}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            </div>
          </div>
          {/* Instructions */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs bg-white/10 px-3 py-1.5 rounded-md ring-1 ring-white/20">
            Scroll to navigate images. Left-click to zoom in, right-click to zoom out. When zoomed, drag to pan.
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePreviewModal;