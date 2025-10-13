'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentView } from '@/store/slices/uiSlice';

const Bookmarks = () => {
  const dispatch = useAppDispatch();
  const bookmarkedImages = useAppSelector((state: any) => state.bookmarks?.images || []);
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');

  const handleBackToGeneration = () => {
    dispatch(setCurrentView('generation'));
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-theme-primary p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToGeneration}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold">Bookmarks</h1>
            <p className="text-sm opacity-70">Your saved and favorite images</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-70">{bookmarkedImages.length} bookmarked</span>
        </div>
      </div>

      {/* Bookmarks Grid */}
      {bookmarkedImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="opacity-50">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
          <p className="text-sm opacity-70 mb-6 max-w-md">
            Start bookmarking your favorite generated images to see them here. 
            Click the bookmark icon on any image to save it.
          </p>
          <button
            onClick={handleBackToGeneration}
            className="bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white px-6 py-3 rounded-full font-medium transition"
          >
            Start Generating
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bookmarkedImages.map((image: any, index: number) => (
            <div
              key={index}
              className="group relative bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-200"
            >
              {/* Image */}
              <div className="aspect-square relative">
                <Image
                  src={image.url}
                  alt={image.prompt || 'Bookmarked image'}
                  fill
                  className="object-cover"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex gap-2">
                    <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                    <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Info */}
              <div className="p-4">
                <p className="text-sm opacity-70 line-clamp-2 mb-2">
                  {image.prompt || 'No prompt available'}
                </p>
                <div className="flex items-center justify-between text-xs opacity-50">
                  <span>{image.model || 'Unknown model'}</span>
                  <span>{image.createdAt ? new Date(image.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
