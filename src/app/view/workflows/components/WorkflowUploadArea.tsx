'use client';

import React, { useState } from 'react';
import { Camera, Loader2, Plus } from 'lucide-react';
import { saveUpload } from '@/lib/libraryApi';
import toast from 'react-hot-toast';

interface WorkflowUploadAreaProps {
  label?: string;
  placeholderLabel: string;
  placeholderSublabel?: string;
  currentImage: string | null;
  changeLabel: string;
  onImageSelect: (url: string) => void;
  openModal: () => void;
  className?: string;
  objectFit?: 'cover' | 'contain';
  icon?: React.ReactNode;
}

export default function WorkflowUploadArea({
  label,
  placeholderLabel,
  placeholderSublabel,
  currentImage,
  changeLabel,
  onImageSelect,
  openModal,
  className = "h-40",
  objectFit = 'contain',
  icon
}: WorkflowUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Please upload image files');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(imageFiles.length > 1 ? `Uploading ${imageFiles.length} images...` : 'Uploading image...');
    
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of imageFiles) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const response = await saveUpload({ url: dataUrl, type: 'image' });
        if (response.responseStatus === 'success' && response.data?.url) {
          uploadedUrls.push(response.data.url);
        } else {
          toast.error(response.message || `Failed to upload ${file.name}`);
        }
      }

      if (uploadedUrls.length > 0) {
        if (uploadedUrls.length === 1) {
          onImageSelect(uploadedUrls[0]);
          toast.success('Image uploaded!', { id: toastId });
        } else {
          // If multiple were uploaded, we need to decide how to call onImageSelect.
          // For now, let's just call it for each if the workflow supports it, 
          // or add a new prop onImagesSelect.
          uploadedUrls.forEach(url => onImageSelect(url));
          toast.success(`${uploadedUrls.length} images uploaded!`, { id: toastId });
        }
      } else {
        toast.dismiss(toastId);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload images', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      await handleUpload(files);
    }
  };

  const displayIcon = icon || <Camera size={20} />;

  return (
    <div className="w-full">
      {label && <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block tracking-widest pl-1">{label}</label>}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={openModal}
        className={`border border-dashed rounded-xl transition-all relative overflow-hidden group cursor-pointer flex flex-col items-center justify-center gap-3 ${className} ${
          isDragging 
            ? 'border-[#60a5fa] bg-[#60a5fa]/10 scale-[1.02] ring-4 ring-[#60a5fa]/10' 
            : 'border-white/15 bg-black/20 hover:bg-[#60a5fa]/5'
        }`}
      >
        {isUploading && (
          <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 text-[#60a5fa] animate-spin" />
             <span className="text-[10px] text-white font-bold mt-2 uppercase tracking-widest">Uploading...</span>
          </div>
        )}

        {currentImage ? (
          <>
            <img 
              src={currentImage} 
              className={`absolute inset-0 w-full h-full p-2 transition-opacity ${isDragging ? 'opacity-20' : 'opacity-60 group-hover:opacity-40'} ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`} 
              alt="Upload preview" 
            />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className="text-white text-xs font-bold bg-black/60 px-4 py-1.5 rounded-full backdrop-blur border border-white/10 shadow-xl">{changeLabel}</span>
            </div>
          </>
        ) : (
          <>
            <div className={`w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-slate-400 border border-white/5 shadow-inner transition-transform ${isDragging ? 'scale-110 text-[#60a5fa]' : 'group-hover:scale-110'}`}>
              {displayIcon}
            </div>
            <div className="text-center">
              <span className="text-xs text-slate-300 block font-bold tracking-tight">{placeholderLabel}</span>
              {placeholderSublabel && <span className="text-[9px] text-slate-500 uppercase tracking-tighter">{placeholderSublabel}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
