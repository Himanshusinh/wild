'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ImageData {
  id: string;
  file: File;
  url: string;
  position: { x: number; y: number };
  scale: number;
  actualWidth: number;
  actualHeight: number;
  modifications?: any; // Track color grading and other modifications
}

interface HistoryState {
  images: ImageData[];
  canvasScale: number;
  canvasOffset: { x: number; y: number };
  timestamp: number;
}

interface ShowScreenProps {
  uploadedImages?: File[];
  selectedImage?: string | null;
  onImageSelect?: (imageId: string | null) => void;
  shouldShowDrawer?: boolean;
  shouldShowInputBox?: boolean;
  colorValues?: any;
  selectedTool?: string | null;
}

const ShowScreen: React.FC<ShowScreenProps> = ({ 
  uploadedImages = [], 
  selectedImage = null,
  onImageSelect,
  shouldShowDrawer = false, 
  shouldShowInputBox = false,
  colorValues = null,
  selectedTool = null
}) => {
  // Safety check for props
  if (!uploadedImages) {
    console.warn('ShowScreen: uploadedImages is undefined, using empty array');
    uploadedImages = [];
  }

  const [images, setImages] = useState<ImageData[]>([]);
  const [showLayers, setShowLayers] = useState(false);
  const [fileInputRef] = useState(React.useRef<HTMLInputElement>(null));
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [canvasDragStart, setCanvasDragStart] = useState({ x: 0, y: 0 });

  // History system for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [isHistoryAction, setIsHistoryAction] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Ref to track if we're currently processing uploaded images
  const isProcessingRef = useRef(false);
  
  // Flux Kontext selection state
  const [selectedKontext, setSelectedKontext] = useState<'max1' | 'max2'>('max1'); // Default to max1
  const [isProcessingKontext, setIsProcessingKontext] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [currentFilter, setCurrentFilter] = useState<string>('');
  const [pollingStatus, setPollingStatus] = useState<string>('');

  // Initialize after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle window resize events
  useEffect(() => {
    if (!isMounted) return;

    const handleResize = () => {
      // Force re-render when window resizes
      // This ensures the ShowScreen dimensions are updated
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMounted]);

  // Cleanup function for processing flag
  useEffect(() => {
    return () => {
      isProcessingRef.current = false;
    };
  }, []);

  // Error boundary for component
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('ShowScreen error caught:', error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Function to save current state to history
  const saveToHistory = useCallback(() => {
    if (isHistoryAction || !isInitialized) return; // Prevent saving during undo/redo operations or initial load
    
    const now = Date.now();
    if (now - lastSaveTime < 100) return; // Debounce: only save every 100ms
    
    const currentState: HistoryState = {
      images: JSON.parse(JSON.stringify(images)), // Deep copy
      canvasScale,
      canvasOffset: { ...canvasOffset },
      timestamp: now
    };

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    
    // Check if this state is actually different from the last one
    const lastState = newHistory[newHistory.length - 1];
    if (lastState) {
      const isSameState = 
        lastState.canvasScale === canvasScale &&
        lastState.canvasOffset.x === canvasOffset.x &&
        lastState.canvasOffset.y === canvasOffset.y &&
        lastState.images.length === images.length &&
        lastState.images.every((img, index) => 
          images[index] && 
          img.id === images[index].id &&
          img.position.x === images[index].position.x &&
          img.position.y === images[index].position.y &&
          img.scale === images[index].scale
        );
      
      if (isSameState) {
        return; // Don't save if state is identical
      }
    }
    
    // Add new state
    newHistory.push(currentState);
    
    // Limit history to 50 states to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);
    setLastSaveTime(now);
  }, [images, canvasScale, canvasOffset, history, currentHistoryIndex, isHistoryAction, lastSaveTime, isInitialized]);

  // Function to undo changes
  const undo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      setIsHistoryAction(true);
      const previousState = history[currentHistoryIndex - 1];
      
      setImages(previousState.images);
      setCanvasScale(previousState.canvasScale);
      setCanvasOffset(previousState.canvasOffset);
      setCurrentHistoryIndex(currentHistoryIndex - 1);
      
      // Clear selection if image was deleted
      if (selectedImage && !previousState.images.find(img => img.id === selectedImage)) {
        if (onImageSelect) {
          onImageSelect(null);
        }
      }
      
      setIsHistoryAction(false);
    }
  }, [currentHistoryIndex, history, selectedImage, onImageSelect]);

  // Function to redo changes
  const redo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      setIsHistoryAction(true);
      const nextState = history[currentHistoryIndex + 1];
      
      setImages(nextState.images);
      setCanvasScale(nextState.canvasScale);
      setCanvasOffset(nextState.canvasOffset);
      setCurrentHistoryIndex(currentHistoryIndex + 1);
      
      // Clear selection if image was deleted
      if (selectedImage && !nextState.images.find(img => img.id === selectedImage)) {
        if (onImageSelect) {
          onImageSelect(null);
        }
      }
      
      setIsHistoryAction(false);
    }
  }, [currentHistoryIndex, history, selectedImage, onImageSelect]);

  // Save to history whenever important changes occur
  useEffect(() => {
    if (!isHistoryAction && isInitialized && images.length > 0 && history.length < 50) {
      // Only save if we have images and haven't reached the limit
      const hasSignificantChanges = 
        canvasScale !== 1 || 
        canvasOffset.x !== 0 || 
        canvasOffset.y !== 0 ||
        images.some(img => img.id);
      
      if (hasSignificantChanges) {
        // Use setTimeout to debounce rapid changes
        const timeoutId = setTimeout(() => {
          saveToHistory();
        }, 50);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [images, canvasScale, canvasOffset, saveToHistory, isHistoryAction, history.length, isInitialized]);

  // Function to clear all color grading effects
  const clearColorGrading = useCallback(() => {
    try {
      // Remove all CSS filters
      const imageElements = document.querySelectorAll('.color-graded-image');
      imageElements.forEach((img) => {
        if (img instanceof HTMLImageElement) {
          img.style.filter = '';
        }
      });
      
      console.log('Color grading effects cleared');
    } catch (error) {
      console.error('Error clearing color grading:', error);
    }
  }, []);

  // Export the current canvas view as a PNG
  const exportCanvas = useCallback(() => {
    if (images.length === 0) {
      console.warn('No images to export');
      return;
    }

    try {
      // Get the first image (since we only allow one at a time)
      const imageData = images[0];
      if (!imageData || !imageData.file) {
        console.warn('Invalid image data for export');
        return;
      }

      // Create a canvas to combine the original image with all color grading effects
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D context for export');
        return;
      }

      // Find the image element in the DOM
      const imageElement = document.querySelector('.color-graded-image') as HTMLImageElement;
      if (!imageElement) {
        console.error('Image element not found for export');
        return;
      }

      // Set canvas size to match the image
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;

      // Draw the original image first
      ctx.drawImage(imageElement, 0, 0);

      // Apply all current color grading effects to the export canvas
      if (colorValues) {
        // Apply CSS filters by recreating them on the canvas
        const filters = generateCSSFilters(colorValues);
        if (filters) {
          // For CSS filters that can be replicated on canvas
          if (colorValues.brightness !== 0) {
            const brightness = (100 + colorValues.brightness) / 100;
            ctx.filter = `brightness(${brightness})`;
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
          }
          
          if (colorValues.contrast !== 0) {
            const contrast = (100 + colorValues.contrast) / 100;
            ctx.filter = `contrast(${contrast})`;
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
          }
          
          if (colorValues.saturation !== 0) {
            const saturation = (100 + colorValues.saturation) / 100;
            ctx.filter = `saturate(${saturation})`;
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
          }
        }
      }

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          // Safely get file extension and name
          let fileExtension = 'png';
          let originalFileName = 'image';

          if (imageData.file && imageData.file.name) {
            const nameParts = imageData.file.name.split('.');
            if (nameParts.length > 1) {
              fileExtension = nameParts[nameParts.length - 1];
              originalFileName = nameParts.slice(0, -1).join('.');
            }
          }

          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${originalFileName}_color_graded.${fileExtension}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          console.log('Export completed successfully');
        }
      }, 'image/png', 0.9);

    } catch (error) {
      console.error('Error during export:', error);
    }
  }, [images, colorValues]);

  // Add event listener for export
  useEffect(() => {
    const handleExportEvent = () => {
      exportCanvas();
    };

    window.addEventListener('exportCanvas', handleExportEvent);
    return () => {
      window.removeEventListener('exportCanvas', handleExportEvent);
    };
  }, [exportCanvas]);

  // Add event listeners for undo/redo
  useEffect(() => {
    const handleUndoEvent = () => {
      undo();
    };

    const handleRedoEvent = () => {
      redo();
    };

    window.addEventListener('undoCanvas', handleUndoEvent);
    window.addEventListener('redoCanvas', handleRedoEvent);
    
    return () => {
      window.removeEventListener('undoCanvas', handleUndoEvent);
      window.removeEventListener('redoCanvas', handleRedoEvent);
    };
  }, [undo, redo]);

  // Function to constrain image position within ShowScreen boundaries
  const constrainImagePosition = (position: { x: number; y: number }, scale: number = 1) => {
    // No boundaries - allow images to be placed anywhere on infinite canvas
    return position;
  };

  // Handle file upload from TopBar
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Only take the first image
      const file = files[0];
      const imageId = Date.now().toString();
      const imageUrl = URL.createObjectURL(file);
      
      console.log(`Creating single image:`, { id: imageId, url: imageUrl });
      
      // Create a temporary image to get actual dimensions
      const tempImg = document.createElement('img');
      tempImg.onload = () => {
        const actualWidth = tempImg.naturalWidth;
        const actualHeight = tempImg.naturalHeight;
        
        console.log(`Image dimensions: ${actualWidth}x${actualHeight}`);
        
        // Center the image in the ShowScreen with proper scaling
        const centeredImage = centerImageInShowScreen(actualWidth, actualHeight);
        
        // Replace any existing images with the new one
        setImages([{
          id: imageId,
          file,
          url: imageUrl,
          position: centeredImage.position,
          scale: centeredImage.scale,
          actualWidth: actualWidth,
          actualHeight: actualHeight
        }]);
      };
      
      tempImg.onerror = () => {
        console.error('Failed to load image for dimension detection');
        // Fallback to default centering with placeholder dimensions
        const centeredImage = centerImageInShowScreen(300, 400);
        setImages([{
          id: imageId,
          file,
          url: imageUrl,
          position: centeredImage.position,
          scale: centeredImage.scale,
          actualWidth: 300,
          actualHeight: 400
        }]);
      };
      
      tempImg.src = imageUrl;
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle remove background
  const handleRemoveBackground = () => {
    if (selectedImage) {
      console.log('Removing background for image:', selectedImage);
      // Here you would implement the remove background functionality
      // For now, just log the action
    }
  };

  // Handle canvas zoom with mouse wheel
  const handleCanvasWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = canvasScale * zoomFactor; // Remove min/max limits for infinite zoom
    
    // Zoom towards mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleChange = newScale / canvasScale;
    setCanvasScale(newScale);
    
    // Adjust offset to zoom towards mouse
    setCanvasOffset(prev => ({
      x: mouseX - (mouseX - prev.x) * scaleChange,
      y: mouseY - (mouseY - prev.y) * scaleChange
    }));
  };

  // Add wheel event listener with passive: false to prevent warnings
  useEffect(() => {
    const handleWheel = (e: Event) => {
      const wheelEvent = e as WheelEvent;
      wheelEvent.preventDefault();
      const zoomFactor = wheelEvent.deltaY > 0 ? 0.9 : 1.1;
      const newScale = canvasScale * zoomFactor;
      
      // Zoom towards mouse position
      const rect = (e.currentTarget as Element).getBoundingClientRect();
      const mouseX = wheelEvent.clientX - rect.left;
      const mouseY = wheelEvent.clientY - rect.top;
      
      const scaleChange = newScale / canvasScale;
      setCanvasScale(newScale);
      
      // Adjust offset to zoom towards mouse
      setCanvasOffset(prev => ({
        x: mouseX - (mouseX - prev.x) * scaleChange,
        y: mouseY - (mouseY - prev.y) * scaleChange
      }));
    };

    const showScreen = document.querySelector('.show-screen');
    if (showScreen) {
      showScreen.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (showScreen) {
        showScreen.removeEventListener('wheel', handleWheel);
      }
    };
  }, [canvasScale]);

  // Handle canvas pan (left click drag for intuitive movement)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Allow left click drag for canvas movement (more intuitive)
    if (e.button === 0) { // Left mouse button
      e.preventDefault();
      setIsCanvasDragging(true);
      setCanvasDragStart({
        x: e.clientX - canvasOffset.x,
        y: e.clientY - canvasOffset.y
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isCanvasDragging) {
      const newOffsetX = e.clientX - canvasDragStart.x;
      const newOffsetY = e.clientY - canvasDragStart.y;
      
      // Allow infinite canvas movement - no boundaries
      setCanvasOffset({
        x: newOffsetX,
        y: newOffsetY
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsCanvasDragging(false);
  };

  // Function to generate CSS filters from color values
  const generateCSSFilters = (values: any) => {
    if (!values) return '';
    
    const filters = [];
    
    // Basic controls
    if (values.brightness !== 0) {
      filters.push(`brightness(${100 + values.brightness}%)`);
    }
    if (values.contrast !== 0) {
      filters.push(`contrast(${100 + values.contrast}%)`);
    }
    if (values.saturation !== 0) {
      filters.push(`saturate(${100 + values.saturation}%)`);
    }
    
    // Temperature and tint (using hue-rotate and sepia)
    if (values.temperature !== 0) {
      const tempValue = values.temperature * 0.3; // Scale down for subtle effect
      if (tempValue > 0) {
        filters.push(`sepia(${tempValue}%)`);
      } else {
        filters.push(`hue-rotate(${tempValue * 2}deg)`);
      }
    }
    
    if (values.tint !== 0) {
      const tintValue = values.tint * 0.5; // Scale down for subtle effect
      filters.push(`hue-rotate(${tintValue}deg)`);
    }
    
    // LUT presets
    if (values.selectedLUT && values.selectedLUT !== 'None') {
      switch (values.selectedLUT) {
        case 'Vintage':
          filters.push('sepia(30%) contrast(120%) brightness(90%)');
          break;
        case 'Film':
          filters.push('contrast(110%) saturate(90%) brightness(95%)');
          break;
        case 'Cyberpunk':
          filters.push('hue-rotate(180deg) saturate(150%) contrast(130%)');
          break;
        case 'Horror':
          filters.push('brightness(80%) contrast(140%) saturate(70%)');
          break;
        case 'Warm':
          filters.push('sepia(20%) brightness(105%)');
          break;
        case 'Cool':
          filters.push('hue-rotate(200deg) saturate(110%)');
          break;
        case 'Cinematic':
          filters.push('contrast(120%) saturate(110%) brightness(95%)');
          break;
      }
    }
    
    return filters.join(' ');
  };

  // Simple color grading using only CSS filters (no canvas, no overlays, no flickering)
  const applyColorGrading = (imageElement: HTMLImageElement, values: any) => {
    if (!values || !imageElement) return;
    
    try {
      // Generate CSS filters for all effects
      const filters = generateCSSFilters(values);
      
      // Apply filters directly to the image
      if (filters) {
        imageElement.style.filter = filters;
      } else {
        imageElement.style.filter = '';
      }
    } catch (error) {
      console.error('Error applying color grading:', error);
      // Clear filters on error
      if (imageElement) {
        imageElement.style.filter = '';
      }
    }
  };

  // Enhanced color grading with CSS filters and overlay canvas (no URL changes)
  const applyAdvancedColorGrading = (imageElement: HTMLImageElement, values: any) => {
    // Use the simple approach instead
    applyColorGrading(imageElement, values);
  };

  // Get ShowScreen style based on current state
  const getShowScreenStyle = () => {
    // During SSR and before mounting, return consistent fallback values
    if (!isMounted) {
      return {
        left: '80px',
        top: '80px',
        width: 'calc(100vw - 80px)',
        height: 'calc(100vh - 100px)'
      };
    }

    try {
      const toolBarWidth = 80;
      const inputBoxHeight = shouldShowInputBox ? 120 : 0;
      const drawerWidth = (shouldShowDrawer) ? 320 : 0;
      const margin = shouldShowDrawer ? 24 : 0;

      const availableWidth = window.innerWidth - toolBarWidth - drawerWidth - margin;
      const availableHeight = window.innerHeight - 80 - inputBoxHeight - 24;

      // Use full available space for infinite canvas
      return {
        left: `${toolBarWidth}px`,
        top: '80px',
        width: `${availableWidth}px`,
        height: `${availableHeight}px`
      };
    } catch (error) {
      console.error('Error in getShowScreenStyle:', error);
      // Return safe fallback values
      return {
        left: '80px',
        top: '80px',
        width: 'calc(100vw - 80px)',
        height: 'calc(100vh - 100px)'
      };
    }
  };

  // Memoized function to check if files are different
  const areFilesDifferent = useCallback((currentImages: ImageData[], newFiles: File[]) => {
    if (currentImages.length !== newFiles.length) return true;
    
    const currentFileIds = currentImages.map(img => 
      img.file?.name + img.file?.size + img.file?.lastModified
    ).join(',');
    const newFileIds = newFiles.map(file => 
      file.name + file.size + file.lastModified
    ).join(',');
    
    return currentFileIds !== newFileIds;
  }, []);

  // Update images when new files are uploaded from TopBar
  useEffect(() => {
    if (!uploadedImages || isProcessingRef.current) return;
    
    // Prevent infinite loops by checking if we're already processing
    if (uploadedImages.length === 0 && images.length === 0) return;
    
    // Only process if uploadedImages actually changed
    if (!areFilesDifferent(images, uploadedImages)) {
      console.log('Uploaded images unchanged, skipping processing');
      return;
    }
    
    // Set processing flag
    isProcessingRef.current = true;
    
    try {
      if (uploadedImages.length > 0) {
        console.log('Processing uploaded images:', uploadedImages.length);
        
        // Since we only allow one image at a time, replace all existing images
        const newImages: ImageData[] = uploadedImages.map((file, index) => {
          const imageId = Date.now().toString() + index;
          const imageUrl = URL.createObjectURL(file);
          
          console.log(`Creating image ${index}:`, { id: imageId, url: imageUrl });
          
          // For uploaded images from TopBar, we'll use default dimensions initially
          // The actual dimensions will be detected when the image loads
          const centeredImage = centerImageInShowScreen(300, 400);
          
          return {
            id: imageId,
            file,
            url: imageUrl,
            position: centeredImage.position,
            scale: centeredImage.scale,
            actualWidth: 300, // Will be updated when image loads
            actualHeight: 400 // Will be updated when image loads
          };
        });
        
        console.log('New images to set:', newImages);
        
        // Replace all images instead of adding to existing ones
        setImages(newImages);
        
        // Clear any selected image when new images are uploaded
        if (onImageSelect) {
          onImageSelect(null);
        }
      } else if (uploadedImages.length === 0) {
        // Clear images if uploadedImages is empty
        console.log('Clearing all images');
        setImages([]);
        if (onImageSelect) {
          onImageSelect(null);
        }
      }
    } finally {
      // Reset processing flag
      isProcessingRef.current = false;
    }
  }, [uploadedImages, onImageSelect, images, areFilesDifferent]); // Optimized dependencies

  // Debug: Log current images state
  useEffect(() => {
    console.log('Current images state:', images);
  }, [images]);

  // Apply color grading when color values change - SIMPLIFIED VERSION
  useEffect(() => {
    if (!colorValues || !isMounted || images.length === 0) return;
    
    // Simple approach: just apply CSS filters directly
    const imageElements = document.querySelectorAll('.color-graded-image');
    
    imageElements.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        applyColorGrading(img, colorValues);
      }
    });
    
  }, [colorValues, isMounted]); // Removed images dependency to prevent loops

  // Apply color grading to newly loaded images
  useEffect(() => {
    if (!colorValues || !isMounted) return;
    
    const handleImageLoad = (event: Event) => {
      const img = event.target as HTMLImageElement;
      if (img && img.classList.contains('color-graded-image')) {
        applyColorGrading(img, colorValues);
      }
    };
    
    // Add event listener for all images
    document.addEventListener('load', handleImageLoad, true);
    
    return () => {
      document.removeEventListener('load', handleImageLoad, true);
    };
  }, [colorValues, isMounted]);

  // Handle image selection and dragging
  const handleImageClick = (imageId: string) => {
    if (onImageSelect) {
      onImageSelect(imageId);
    }
  };

  // Individual image handling functions removed - only canvas zoom/move is allowed

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        // Delete selected image if one is selected
        if (selectedImage) {
          setImages(prev => prev.filter(img => img.id !== selectedImage));
          // Clear selection after deletion
          if (onImageSelect) {
            onImageSelect(null);
          }
        }
        break;
      case '0':
        // Reset canvas view to default
        setCanvasScale(1);
        setCanvasOffset({ x: 0, y: 0 });
        break;
    }
  }, [selectedImage, onImageSelect]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle background click to deselect image
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Deselect image when clicking on ShowScreen background
    if (onImageSelect) {
      onImageSelect(null);
    }
  };

  // Function to center a single image in the ShowScreen
  const centerImageInShowScreen = (actualWidth: number = 300, actualHeight: number = 400) => {
    // During SSR and before mounting, return consistent fallback values
    if (!isMounted) {
      return {
        position: { x: 0, y: 0 },
        scale: 1
      };
    }

    try {
      const toolBarWidth = 80;
      const inputBoxHeight = shouldShowInputBox ? 120 : 0;
      const drawerWidth = (shouldShowDrawer) ? 320 : 0;
      const margin = shouldShowDrawer ? 24 : 0;

      const availableWidth = window.innerWidth - toolBarWidth - drawerWidth - margin;
      const availableHeight = window.innerHeight - 80 - inputBoxHeight - 24;

      // Safety check for dimensions
      if (availableWidth <= 0 || availableHeight <= 0 || actualWidth <= 0 || actualHeight <= 0) {
        console.warn('Invalid dimensions detected, using fallback values');
        return {
          position: { x: 0, y: 0 },
          scale: 1
        };
      }

      // Calculate optimal scale to ensure image is clearly visible
      // For small images, we want them to be at least a reasonable size
      const imageAspectRatio = actualWidth / actualHeight;
      const screenAspectRatio = availableWidth / availableHeight;
      
      let optimalScale;
      if (imageAspectRatio > screenAspectRatio) {
        // Image is wider than screen, fit to width
        optimalScale = availableWidth / actualWidth;
      } else {
        // Image is taller than screen, fit to height
        optimalScale = availableHeight / actualHeight;
      }
      
      // Ensure the image is at least 200px in its smallest dimension for visibility
      const minWidth = 200;
      const minHeight = 200;
      
      const minScaleForWidth = minWidth / actualWidth;
      const minScaleForHeight = minHeight / actualHeight;
      const minScale = Math.max(minScaleForWidth, minScaleForHeight);
      
      // Use the larger of: calculated scale or minimum scale for visibility
      optimalScale = Math.max(optimalScale, minScale);
      
      // Cap the maximum scale to prevent extremely large images
      const maxScale = 3;
      optimalScale = Math.min(optimalScale, maxScale);

      // Calculate center position
      const centerX = (availableWidth - (actualWidth * optimalScale)) / 2;
      const centerY = (availableHeight - (actualHeight * optimalScale)) / 2;

      return {
        position: { x: centerX, y: centerY },
        scale: optimalScale
      };
    } catch (error) {
      console.error('Error in centerImageInShowScreen:', error);
      // Return safe fallback values
      return {
        position: { x: 0, y: 0 },
        scale: 1
      };
    }
  };

  // Listen for Flux Kontext generation requests
  useEffect(() => {
    const handler = async (e: any) => {
      try {
        const detail = e?.detail as { tool?: string; prompt?: string };
        if (!detail || !detail.prompt) return;
        if (images.length === 0) {
          console.warn('No image to process');
          return;
        }

        console.log('Processing AI request:', detail);
        console.log('Tool:', detail.tool);
        console.log('Prompt being sent to API:', detail.prompt);
        console.log('Prompt length:', detail.prompt?.length || 0);
        console.log('Selected model:', selectedKontext === 'max1' ? 'Flux Kontext Max' : 'Flux Kontext Pro');
        setIsProcessingKontext(true);
        setCurrentFilter(detail.prompt || 'Processing...');

        // Prepare input image as base64
        const img = images[0];
        const base64 = await new Promise<string>((resolve, reject) => {
          const image = new window.Image();
          image.crossOrigin = 'anonymous';
          image.onload = () => {
            const c = document.createElement('canvas');
            c.width = image.naturalWidth;
            c.height = image.naturalHeight;
            const cctx = c.getContext('2d');
            if (!cctx) return reject(new Error('No 2D context'));
            cctx.drawImage(image, 0, 0);
            resolve(c.toDataURL('image/png'));
          };
          image.onerror = reject;
          image.src = img.url;
        });

        // Strip data URL header
        const base64Data = base64.split(',')[1];

        // Choose endpoint by selectedKontext
        const endpoint = selectedKontext === 'max2'
          ? 'https://api.bfl.ai/v1/flux-kontext-pro'
          : 'https://api.bfl.ai/v1/flux-kontext-max';
        
        console.log('Selected model:', selectedKontext === 'max2' ? 'Flux Kontext Pro' : 'Flux Kontext Max');
        console.log('API endpoint:', endpoint);

        const apiKey = process.env.NEXT_PUBLIC_BFL_API_KEY || '';
        if (!apiKey) {
          console.error('Missing NEXT_PUBLIC_BFL_API_KEY - Please add it to your .env.local file');
          alert('Missing API Key: Please add NEXT_PUBLIC_BFL_API_KEY to your .env.local file');
          return;
        }
        console.log('API Key found, length:', apiKey.length);

        const body = {
          prompt: detail.prompt,
          input_image: base64Data,
          output_format: 'png',
          safety_tolerance: 2,
          prompt_upsampling: false
        };
        
        console.log('Complete API request body:', {
          endpoint,
          prompt: detail.prompt,
          input_image_length: base64Data?.length || 0,
          output_format: 'png',
          safety_tolerance: 2
        });

        let job: any;
        try {
          // Use our proxy API route to avoid CORS issues
          const res = await fetch('/api/flux-kontext', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              endpoint,
              apiKey,
              ...body
            })
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`API Error: ${res.status} ${res.statusText} - ${errorData.error || 'Unknown error'}`);
          }
          
          job = await res.json();
          console.log('Flux API response:', job);
          
          // Check for different response formats
          if (job?.polling_url) {
            // Standard polling response - this is what we got!
            console.log('Using polling URL:', job.polling_url);
            console.log('Job ID:', job.id);
          } else if (job?.status === 'processing' && job?.id) {
            // Direct processing response
            console.log('Processing job ID:', job.id);
            return;
          } else if (job?.error) {
            console.error('Flux API error:', job.error);
            return;
          } else {
            console.error('Invalid response from Flux Kontext:', job);
            return;
          }
        } catch (error) {
          console.error('API request failed:', error);
          console.log('Falling back to simple filter system...');
          
          // Apply simple filter based on prompt keywords
          const prompt = detail.prompt.toLowerCase();
          
          // Map prompt keywords to filter types
          const filterMap: { [key: string]: string } = {
            'blue hour': 'blue-hour',
            'blue': 'blue-hour',
            '7000': 'blue-hour',
            '9000k': 'blue-hour',
            'sunset': 'sunset-glow',
            'golden': 'sunset-glow',
            '3200': 'sunset-glow',
            '4000k': 'sunset-glow',
            'moonlight': 'moonlight',
            'cool': 'moonlight',
            '4200k': 'moonlight',
            'silver-blue': 'moonlight',
            'campfire': 'campfire',
            'warm': 'campfire',
            '2200': 'campfire',
            '2800k': 'campfire',
            'midday': 'midday-sun',
            'overhead': 'midday-sun',
            '12 o\'clock': 'midday-sun',
            'split': 'split-lighting',
            '90°': 'split-lighting',
            'camera-left': 'split-lighting',
            'butterfly': 'butterfly-lighting',
            'above': 'butterfly-lighting',
            'centered': 'butterfly-lighting',
            'clamshell': 'clamshell-beauty',
            'beauty': 'clamshell-beauty',
            'glowing skin': 'clamshell-beauty',
            'rim': 'rim-fill',
            'edge': 'rim-fill',
            'back-left': 'rim-fill',
            'spotlight': 'hard-spotlight',
            'hard': 'hard-spotlight',
            'circle': 'hard-spotlight',
            'noir': 'noir-hard-light',
            'tungsten': 'noir-hard-light',
            'chiaroscuro': 'noir-hard-light',
            'underlight': 'underlight-horror',
            'horror': 'underlight-horror',
            'low camera-front': 'underlight-horror',
            'teal': 'teal-orange',
            'orange': 'teal-orange',
            'blockbuster': 'teal-orange',
            'backlit': 'backlit-halo',
            'halo': 'backlit-halo',
            '120°': 'backlit-halo',
            'studio': 'studio-portrait',
            'portrait': 'studio-portrait',
            'professional': 'studio-portrait',
            'cinematic': 'cinematic',
            'dramatic': 'cinematic',
            'moody': 'cinematic',
            'natural': 'natural-ambient',
            'ambient': 'natural-ambient',
            'soft': 'natural-ambient',
            'fashion': 'fashion-beauty',
            'glamour': 'fashion-beauty',
            'vintage': 'vintage',
            'retro': 'vintage',
            'classic': 'vintage',
            'modern': 'modern-clean',
            'contemporary': 'modern-clean',
            'clean': 'modern-clean'
          };
          
          // Find matching filter
          let filterType = null;
          for (const [keyword, filter] of Object.entries(filterMap)) {
            if (prompt.includes(keyword)) {
              filterType = filter;
              break;
            }
          }
          
          if (filterType) {
            console.log(`Applying ${filterType} filter...`);
            applySimpleFilter(filterType, detail.tool);
          } else {
            console.log('No matching filter found for prompt:', prompt);
            alert('No matching filter found. Please try a different preset.');
          }
          return;
        }

        // Poll until ready
        let resultUrl: string | null = null;
        console.log('Starting to poll for results...');
        
        for (let i = 0; i < 60; i++) {
          console.log(`Polling attempt ${i + 1}/60...`);
          setPollingStatus(`Polling attempt ${i + 1}/60...`);
          await new Promise(r => setTimeout(r, 1000)); // Reduced to 1 second since API is fast
          
          try {
            // Use proxy for polling to avoid CORS issues
            const pr = await fetch('/api/flux-kontext', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                endpoint: `https://api.eu4.bfl.ai/v1/get_result?id=${job.id}`,
                apiKey,
                method: 'GET'
              })
            });
            
            if (!pr.ok) {
              console.error('Polling request failed:', pr.status);
              continue;
            }
            
            const pdata = await pr.json();
            console.log('Polling response:', pdata);
            console.log('Response status:', pdata?.status);
            console.log('Response result:', pdata?.result);
            console.log('Response keys:', Object.keys(pdata || {}));
            
            if (pdata?.status === 'succeeded' && pdata?.output?.image_url) {
              resultUrl = pdata.output.image_url;
              console.log('Success! Got result URL:', resultUrl);
              break;
            } else if (pdata?.status === 'Ready' && pdata?.result?.sample) {
              // Handle 'Ready' status - image URL is in result.sample!
              resultUrl = pdata.result.sample;
              console.log('Success! Got result URL from Ready status (sample):', resultUrl);
              break;
            } else if (pdata?.status === 'Ready' && pdata?.result?.image_url) {
              // Handle 'Ready' status - this means the image is ready!
              resultUrl = pdata.result.image_url;
              console.log('Success! Got result URL from Ready status:', resultUrl);
              break;
            } else if (pdata?.status === 'Ready' && pdata?.result?.url) {
              // Alternative format for Ready status
              resultUrl = pdata.result.url;
              console.log('Success! Got result URL from Ready status (alt):', resultUrl);
              break;
            } else if (pdata?.status === 'failed') {
              console.error('Flux Kontext job failed:', pdata);
              break;
            } else if (pdata?.status === 'processing') {
              console.log('Still processing...');
            } else if (pdata?.status === 'pending') {
              console.log('Job is pending...');
            } else if (pdata?.status === 'Ready') {
              console.log('Job is Ready but no image URL found:', pdata);
              // Log the full response to see the structure
              console.log('Full Ready response:', pdata);
            } else {
              console.log('Unknown status:', pdata?.status);
            }
          } catch (error) {
            console.error('Error during polling:', error);
            continue;
          }
        }
        
        if (!resultUrl) {
          console.log('Polling timed out after 60 attempts (1 minute)');
          setPollingStatus('Timed out after 1 minute');
          alert('AI processing is taking longer than expected. Please try again in a few minutes.');
        } else {
          console.log('Successfully got result URL:', resultUrl);
          console.log('Result URL type:', typeof resultUrl);
          console.log('Result URL length:', resultUrl?.length);
          setPollingStatus('Image ready! Updating...');
        }

        if (!resultUrl) return;

        // Replace current image with result (keep position/scale)
        console.log('Updating image with new URL:', resultUrl);
        console.log('Previous image URL:', images[0]?.url);
        
        setImages(prev => {
          if (prev.length === 0) return prev;
          const copy = [...prev];
          copy[0] = {
            ...copy[0],
            url: resultUrl,
            file: copy[0].file
          };
          console.log('New image object:', copy[0]);
          return copy;
        });
        
        // Force a re-render by updating a timestamp
        setForceUpdate(prev => prev + 1);
        console.log('Force update triggered, new value:', forceUpdate + 1);
        
        // Show success message
        alert('Image relighted successfully!');
              } catch (err) {
          console.error('Error in kontextGenerate handler:', err);
        } finally {
          setIsProcessingKontext(false);
          setPollingStatus('');
        }
      };

    window.addEventListener('kontextGenerate' as any, handler);
    return () => window.removeEventListener('kontextGenerate' as any, handler);
  }, [images, selectedKontext]);





  // Simple image filter system for testing
  const applySimpleFilter = (filterType: string, toolName?: string) => {
    if (images.length === 0) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Apply filter based on type
      switch (filterType) {
        case 'blue-hour':
          ctx.filter = 'brightness(0.8) contrast(1.2) saturate(0.7) hue-rotate(200deg)';
          break;
        case 'sunset-glow':
          ctx.filter = 'brightness(1.1) contrast(1.1) saturate(1.3) hue-rotate(30deg) sepia(0.3)';
          break;
        case 'moonlight':
          ctx.filter = 'brightness(0.9) contrast(1.1) saturate(0.6) hue-rotate(220deg)';
          break;
        case 'campfire':
          ctx.filter = 'brightness(1.2) contrast(1.1) saturate(1.4) hue-rotate(15deg) sepia(0.4)';
          break;
        case 'midday-sun':
          ctx.filter = 'brightness(1.2) contrast(1.3) saturate(1.1) hue-rotate(0deg)';
          break;
        case 'split-lighting':
          ctx.filter = 'brightness(0.9) contrast(1.4) saturate(1.0) hue-rotate(0deg)';
          break;
        case 'butterfly-lighting':
          ctx.filter = 'brightness(1.1) contrast(1.1) saturate(1.0) hue-rotate(0deg)';
          break;
        case 'clamshell-beauty':
          ctx.filter = 'brightness(1.2) contrast(1.0) saturate(1.1) hue-rotate(0deg)';
          break;
        case 'rim-fill':
          ctx.filter = 'brightness(0.9) contrast(1.2) saturate(1.0) hue-rotate(0deg)';
          break;
        case 'hard-spotlight':
          ctx.filter = 'brightness(1.3) contrast(1.5) saturate(0.9) hue-rotate(0deg)';
          break;
        case 'noir-hard-light':
          ctx.filter = 'brightness(0.8) contrast(1.6) saturate(0.8) hue-rotate(0deg) grayscale(0.3)';
          break;
        case 'underlight-horror':
          ctx.filter = 'brightness(1.1) contrast(1.4) saturate(1.2) hue-rotate(0deg) invert(0.1)';
          break;
        case 'teal-orange':
          ctx.filter = 'brightness(1.0) contrast(1.2) saturate(1.3) hue-rotate(180deg) sepia(0.2)';
          break;
        case 'backlit-halo':
          ctx.filter = 'brightness(1.1) contrast(1.1) saturate(1.0) hue-rotate(0deg)';
          break;
        case 'studio-portrait':
          ctx.filter = 'brightness(1.1) contrast(1.1) saturate(1.0) hue-rotate(0deg)';
          break;
        case 'cinematic':
          ctx.filter = 'brightness(0.9) contrast(1.3) saturate(1.1) hue-rotate(0deg)';
          break;
        case 'natural-ambient':
          ctx.filter = 'brightness(1.0) contrast(1.0) saturate(1.0) hue-rotate(0deg)';
          break;
        case 'fashion-beauty':
          ctx.filter = 'brightness(1.2) contrast(1.0) saturate(1.2) hue-rotate(0deg)';
          break;
        case 'vintage':
          ctx.filter = 'brightness(0.9) contrast(1.1) saturate(0.8) hue-rotate(0deg) sepia(0.4)';
          break;
        case 'modern-clean':
          ctx.filter = 'brightness(1.1) contrast(1.1) saturate(1.0) hue-rotate(0deg)';
          break;
        default:
          ctx.filter = 'none';
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Convert to blob and update image
      canvas.toBlob((blob) => {
        if (blob) {
          const newUrl = URL.createObjectURL(blob);
          setImages(prev => {
            if (prev.length === 0) return prev;
            const copy = [...prev];
            copy[0] = {
              ...copy[0],
              url: newUrl
            };
            return copy;
          });
                    setForceUpdate(prev => prev + 1);
          setCurrentFilter(filterType);
          console.log(`Applied ${filterType} filter successfully!`);
          
          // Show success message
          setTimeout(() => {
            alert(`Applied ${filterType} effect successfully!\n\nTool: ${toolName || 'Unknown'}\nEffect: ${filterType}`);
          }, 100);
        }
      }, 'image/png');
    };
    img.src = images[0].url;
  };

  return (
    <div 
      className="fixed bg-black/80 backdrop-blur-sm z-[10] overflow-hidden"
      style={{
        ...getShowScreenStyle(),
        cursor: isCanvasDragging ? 'grabbing' : 'grab'
      }}
      onMouseMove={(e) => {
        try {
          handleCanvasMouseMove(e);
        } catch (error) {
          console.error('Error in handleCanvasMouseMove:', error);
        }
      }}
      onMouseUp={(e) => {
        try {
          handleCanvasMouseUp();
        } catch (error) {
          console.error('Error in handleCanvasMouseUp:', error);
        }
      }}
      onMouseLeave={(e) => {
        try {
          handleCanvasMouseUp();
        } catch (error) {
          console.error('Error in handleCanvasMouseLeave:', error);
        }
      }}
      onMouseDown={(e) => {
        try {
          handleCanvasMouseDown(e);
        } catch (error) {
          console.error('Error in handleCanvasMouseDown:', error);
        }
      }}
      onWheel={(e) => {
        try {
          handleCanvasWheel(e);
        } catch (error) {
          console.error('Error in handleCanvasWheel:', error);
        }
      }}
      onClick={(e) => {
        try {
          handleBackgroundClick(e);
        } catch (error) {
          console.error('Error in handleBackgroundClick:', error);
        }
      }}
    >
      {/* Show loading state during SSR to prevent hydration mismatch */}
      {!isMounted && (
        <div className="flex items-center justify-center h-full">
          <div className="text-white/50">Loading...</div>
        </div>
      )}

      {/* Only show content after mounting to prevent hydration issues */}
      {isMounted && (
        <>
          {/* Floating Layers Button */}
          <div className="absolute bottom-4 right-4 z-50">
            <button
              onClick={() => setShowLayers(!showLayers)}
              className={`w-12 h-12 rounded-xl transition-all duration-300 flex items-center justify-center ${
                showLayers 
                  ? 'bg-blue-600/80 ring-2 ring-blue-400/50 shadow-lg' 
                  : 'bg-black/40 backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:scale-105'
              } text-white shadow-2xl`}
              title="Layers"
            >
              <Image src="/icons/layerswhite.png" alt="Layers" width={24} height={24} />
            </button>
          </div>

          {/* Floating Layers Panel */}
          {showLayers && (
            <div className="absolute bottom-20 right-4 z-50 w-80 h-96 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="p-0 text-white h-full flex flex-col">
                {/* Panel Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <button 
                      className="text-white/60 hover:text-white transition-colors"
                      onClick={() => setShowLayers(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <h3 className="text-sm font-medium">Layers</h3>
                  </div>
                </div>

                {/* Simple Layers List */}
                <div className="flex-1 overflow-y-auto p-2 min-h-0">
                  <div className="mb-1 p-2 rounded bg-blue-600/20 border border-blue-500/50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/10 rounded border border-white/20 flex items-center justify-center">
                        <img src="/icons/colour.png" alt="Layer 1" className="w-6 h-6 object-cover rounded" />
                      </div>
                      <span className="flex-1 text-sm font-medium">Layer 1</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex-shrink-0 p-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <button className="p-2 text-white/60 hover:text-white transition-colors" title="Create New Layer">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <button className="p-2 text-white/60 hover:text-white transition-colors" title="Delete Layer">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Status Indicator */}
          {images.length > 0 && (
            <div className="absolute top-4 right-4 z-30 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white/60 text-xs border border-white/20">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span>↶</span>
                  <span className={currentHistoryIndex > 0 ? 'text-white' : 'text-white/40'}>
                    {currentHistoryIndex > 0 ? 'Available' : 'None'}
                  </span>
                </div>
                <div className="w-px h-4 bg-white/20"></div>
                <div className="flex items-center gap-1">
                  <span>↷</span>
                  <span className={currentHistoryIndex < history.length - 1 ? 'text-white' : 'text-white/40'}>
                    {currentHistoryIndex < history.length - 1 ? 'Available' : 'None'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {images.length === 0 && (
            <div className="relative z-10 flex items-center justify-center h-full">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 text-white/30 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-white/50 text-lg mb-2">Upload an image from the top bar to get started</p>
                <div className="text-white/40 text-sm space-y-1">
                  <p>• <strong>Left-click + drag</strong> to move the canvas</p>
                  <p>• <strong>Scroll wheel</strong> to zoom in/out</p>
                  <p>• <strong>Click image</strong> to select it</p>
                  <p>• <strong>Delete key</strong> or <strong>red button</strong> to delete selected image</p>
                  <p>• <strong>Press '0'</strong> to reset view</p>
                </div>
              </div>
            </div>
          )}

          {/* Image Display Area */}
          {images && images.length > 0 && images.map((image, index) => {
            // Safety check for image data
            if (!image || !image.id || !image.url) {
              console.warn('Invalid image data found:', image);
              return null;
            }
            
            return (
              <div
                key={image.id}
                className={`relative absolute z-20`}
                style={{
                  left: (image.position?.x || 0) * canvasScale + canvasOffset.x,
                  top: (image.position?.y || 0) * canvasScale + canvasOffset.y,
                  transform: `scale(${(image.scale || 1) * canvasScale})`,
                  transformOrigin: 'center'
                }}
                onClick={(e) => {
                  try {
                    e.stopPropagation();
                    handleImageClick(image.id);
                  } catch (error) {
                    console.error('Error in image click handler:', error);
                  }
                }}
              >
                <img
                  key={`${image.id}-${image.url}-${forceUpdate}`}
                  src={image.url}
                  alt={`Uploaded ${index + 1}`}
                  className="select-none pointer-events-none color-graded-image"
                  draggable={false}
                  onLoad={(e) => {
                    try {
                      const img = e.target as HTMLImageElement;
                      console.log(`Image ${index + 1} loaded:`, image.url, `Dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
                    } catch (error) {
                      console.error('Error in image onLoad:', error);
                    }
                  }}
                  onError={(e) => {
                    try {
                      console.error(`Image ${index + 1} failed to load:`, image.url, e);
                    } catch (error) {
                      console.error('Error in image onError:', error);
                    }
                  }}
                />
                
                {/* Remove Background Icon - Outside image at top */}
                {selectedImage === image.id && (
                  <div className="absolute top-0 -left-12 z-30 flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        try {
                          e.stopPropagation();
                          handleRemoveBackground();
                        } catch (error) {
                          console.error('Error in remove background handler:', error);
                        }
                      }}
                      className="w-10 h-10 rounded-xl bg-black/70 backdrop-blur-xl border border-white/40 hover:bg-white/30 hover:scale-110 transition-all duration-300 flex items-center justify-center text-white shadow-xl"
                      title="Remove Background"
                    >
                      <Image src="/icons/removebackgeound.png" alt="Remove Background" width={20} height={20} />
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        try {
                          e.stopPropagation();
                          // Delete the image
                          setImages(prev => prev.filter(img => img.id !== image.id));
                          // Clear selection
                          if (onImageSelect) {
                            onImageSelect(null);
                          }
                        } catch (error) {
                          console.error('Error in delete image handler:', error);
                        }
                      }}
                      className="w-10 h-10 rounded-xl bg-red-600/80 backdrop-blur-xl border border-red-400/50 hover:bg-red-500/80 hover:scale-110 transition-all duration-300 flex items-center justify-center text-white shadow-xl"
                      title="Delete Image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}





          {/* Processing Status - Shows current prompt being processed */}
          {isProcessingKontext && (
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-50 bg-black/90 p-4 rounded-lg text-white max-w-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="font-medium">
                  Processing with {selectedKontext === 'max1' ? 'Flux Kontext Max' : 'Flux Kontext Pro'}...
                </span>
              </div>
              <div className="text-sm text-white/80">
                <div className="font-medium mb-1">Current Prompt:</div>
                <div className="text-xs bg-white/10 p-2 rounded max-h-20 overflow-y-auto mb-2">
                  {currentFilter || 'Processing...'}
                </div>
                <div className="font-medium mb-1">Status:</div>
                <div className="text-xs bg-white/10 p-2 rounded">
                  {pollingStatus || 'Initializing...'}
                </div>
              </div>
            </div>
          )}

          {/* Flux Kontext Buttons - At Bottom of Main Screen (Only for Relight and Facial Expression) */}
                  {(selectedTool === 'Relight' || selectedTool === 'FacialExpression') && (
          <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-40">
            <div className="text-center mb-3">
              <p className="text-white/60 text-sm mb-2">Choose AI Model:</p>
              <div className="text-xs text-white/40 space-y-1">
                <p>• <strong>Flux Kontext Max</strong>: Faster processing, good quality</p>
                <p>• <strong>Flux Kontext Pro</strong>: Higher quality, slower processing</p>
              </div>
              <div className="mt-2 text-xs text-white/50">
                Currently selected: <strong>{selectedKontext === 'max1' ? 'Flux Kontext Max' : 'Flux Kontext Pro'}</strong>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-3">
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    selectedKontext === 'max1'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                  onClick={() => setSelectedKontext('max1')}
                  disabled={isProcessingKontext}
                >
                  Flux Kontext Max
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    selectedKontext === 'max2'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                  onClick={() => setSelectedKontext('max2')}
                  disabled={isProcessingKontext}
                >
                  Flux Kontext Pro
                </button>
              </div>
              {isProcessingKontext && (
                <div className="text-white/80 text-sm flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing with {selectedKontext === 'max1' ? 'Flux Kontext Max' : 'Flux Kontext Pro'}...
                </div>
              )}
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
};

export default ShowScreen;