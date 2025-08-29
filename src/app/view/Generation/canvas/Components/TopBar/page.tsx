'use client';

import React, { useRef, useEffect } from 'react';
import TopBarItem from './compo/TopBarItem';

interface TopBarProps {
  onImageUpload?: (files: File[]) => void;
  onExport?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onImageUpload, onExport, onUndo, onRedo }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TODO: Uncomment this when backend is ready
  // useEffect(() => {
  //   const loadFrameSizes = async () => {
  //     try {
  //       const frameSizes = await fetchFrameSizes();
  //       // Update frame sizes from backend
  //     } catch (error) {
  //       console.error('Failed to load frame sizes:', error);
  //     }
  //   };
  //   
  //   loadFrameSizes();
  // }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && onImageUpload) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        onImageUpload(imageFiles);
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Define top bar items with icons and actions
  const topBarItems = [
    {
      id: 'undo',
      name: 'Undo',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      onClick: onUndo || (() => console.log('Undo clicked')),
      variant: 'icon' as const,
      disabled: !onUndo, // Disable if no undo function provided
    },
    {
      id: 'redo',
      name: 'Redo',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      ),
      onClick: onRedo || (() => console.log('Redo clicked')),
      variant: 'icon' as const,
      disabled: !onRedo, // Disable if no redo function provided
    },
  ];

  return (
    <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-[50]">
      {/* Main TopBar Box Container */}
      <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-2">
        {/* TopBar Content Container */}
        <div className="flex items-center gap-6">
          {/* Left side - Icon tools */}
          <div className="flex items-center gap-3">
            {topBarItems.map((item) => (
              <TopBarItem
                key={item.id}
                id={item.id}
                name={item.name}
                icon={item.icon}
                onClick={item.onClick}
                variant={item.variant}
                disabled={item.disabled}
              />
            ))}
          </div>

          {/* Frame Size Selector */}
          {/* Removed as per edit hint */}

          {/* Vertical Separator */}
          <div className="w-px h-6 bg-white/20"></div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={triggerFileUpload}
              className="flex items-center gap-2 px-4 py-1.5 h-10 bg-white/15 w-40 hover:bg-white/25 text-white rounded-lg transition-all duration-200 border border-white/25 hover:border-white/35 hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm font-medium">Upload Image</span>
            </button>
            
            <button className="flex items-center gap-2 px-4 py-1.5 h-10 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-all duration-200 border border-white/25 hover:border-white/35 hover:scale-105">
              {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 0 11-18 0 9 9 0 0118 0z" />
              </svg> */}
              <span className="text-sm font-medium">History</span>
            </button>
            
            <button 
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-1.5 h-10 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-all duration-200 border border-white/25 hover:border-white/35 hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default TopBar;