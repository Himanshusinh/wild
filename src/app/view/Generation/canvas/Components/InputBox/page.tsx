'use client';

import React, { useState, useRef } from 'react'
import SelectModel from './compo/SelectModel'
import FrameSize from './compo/FrameSize'

interface InputBoxProps {
  onImageUpload?: (files: File[]) => void;
}

const InputBox: React.FC<InputBoxProps> = ({ onImageUpload }) => {
  const [selectedModel, setSelectedModel] = useState('Select Model');
  const [selectedFrameSize, setSelectedFrameSize] = useState('Square');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
  };

  const handleFrameSizeSelect = (size: string) => {
    setSelectedFrameSize(size);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        setUploadedImages(prev => [...prev, ...imageFiles]);
        // Pass uploaded images to parent component
        if (onImageUpload) {
          onImageUpload(imageFiles);
        }
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[90%] max-w-[780px] z-[60] transition-all duration-300 ease-in-out">
      <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
        {/* Main input row */}
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
            <input
              type="text"
              placeholder="Type your prompt..."
              className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-none"
            />
          </div>
          
          {/* Generate button */}
          <button className="px-6 py-2.5 rounded-full text-[15px] font-semibold bg-[#2F6BFF] hover:bg-[#1d4ed8] text-white transition">
            Generate
          </button>
        </div>
        
        {/* Bottom row with Select Model and Frame Size buttons */}
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          <SelectModel 
            selectedModel={selectedModel}
            onModelSelect={handleModelSelect}
          />
          {/* <FrameSize 
            selectedFrameSize={selectedFrameSize}
            onFrameSizeSelect={handleFrameSizeSelect}
          /> */}
        </div>

        {/* Uploaded Images Display */}
        {uploadedImages.length > 0 && (
          <div className="px-3 pb-3">
            <div className="flex flex-wrap gap-2">
              {uploadedImages.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Uploaded ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-lg ring-1 ring-white/20"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}

export default InputBox