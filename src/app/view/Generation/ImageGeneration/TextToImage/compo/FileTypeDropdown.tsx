'use client';

import React, { useEffect, useRef } from 'react';
import { FileImage, ChevronUp } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setOutputFormat } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

type FileTypeDropdownProps = {
  openDirection?: 'up' | 'down';
};

const FileTypeDropdown = ({ openDirection = 'up' }: FileTypeDropdownProps) => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-dev');
  const outputFormat = useAppSelector((state: any) => state.generation?.outputFormat || 'jpeg');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current model is an Imagen model
  const isImagenModel = selectedModel === 'imagen-4-ultra' || selectedModel === 'imagen-4' || selectedModel === 'imagen-4-fast';

  const fileTypes = [
    { name: 'JPEG', value: 'jpeg', description: 'Best for photos' },
    { name: 'PNG', value: 'png', description: 'Best for graphics' },
    { name: 'WebP', value: 'webp', description: 'Modern format' }
  ];

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('fileType'));
  };

  // Auto-close dropdown after 5 seconds
  useEffect(() => {
    if (activeDropdown === 'fileType') {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for 5 seconds
      timeoutRef.current = setTimeout(() => {
        dispatch(toggleDropdown(''));
      }, 20000);
    } else {
      // Clear timeout if dropdown is closed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeDropdown, dispatch]);

  const handleFileTypeSelect = (fileTypeValue: string) => {
    dispatch(setOutputFormat(fileTypeValue));
    dispatch(toggleDropdown(''));
  };

  const selectedFileType = fileTypes.find(ft => ft.value === outputFormat);

  // Don't render if not an Imagen model
  if (!isImagenModel) {
    return null;
  }

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-black/20 dark:ring-white/20 bg-transparent text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1"
      >
        <FileImage className="w-4 h-4 mr-1" />
        {selectedFileType?.name || 'File Type'}
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'fileType' ? 'rotate-180' : ''}`} />
      </button>

      {activeDropdown === 'fileType' && ( 
        <div className={`absolute ${openDirection === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 w-48 bg-white/90 dark:bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden ring-1 ring-black/30 dark:ring-white/30 pb-2 pt-2 z-50`}>
          {fileTypes.map((fileType) => (
            <button
              key={fileType.value}
              onClick={(e) => {
                e.stopPropagation();
                handleFileTypeSelect(fileType.value);
              }}
              className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${outputFormat === fileType.value
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'text-black/90 dark:text-white/90 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
            >
              <div className="flex flex-col">
                <span>{fileType.name}</span>
                <span className="text-xs opacity-70">{fileType.description}</span>
              </div>
              {outputFormat === fileType.value && (
                <div className="w-2 h-2 bg-white dark:bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTypeDropdown;
