'use client';

import React, { useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setPrompt, generateMockup, setGeneratedMockups } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';
import { GeneratedImage } from '@/types/history';
import ModelsDropdown from '@/app/view/Generation/Core/MockupGeneation/compo/ModelsDropdown';
import UploadLogoButton, { UploadLogoButtonRef } from '@/app/view/Generation/Core/MockupGeneation/compo/UploadLogoButton';
import BusinessNameButton from '@/app/view/Generation/Core/MockupGeneation/compo/BusinessNameButton';
import TagLineButton from '@/app/view/Generation/Core/MockupGeneation/compo/TagLineButton';
import ProductImageButton, { ProductImageButtonRef } from '@/app/view/Generation/Core/MockupGeneation/compo/ProductImageButton';
import FrameSizeButton from '@/app/view/Generation/Core/MockupGeneation/compo/FrameSizeButton';
import ImageCountButton from '@/app/view/Generation/Core/MockupGeneation/compo/ImageCountButton';
import Image from 'next/image';

const InputBox = () => {
  const dispatch = useAppDispatch();
  const logoButtonRef = useRef<UploadLogoButtonRef>(null);
  const productButtonRef = useRef<ProductImageButtonRef>(null);

  const prompt = useAppSelector((state: any) => state.generation?.prompt || '');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || '');
  const imageCount = useAppSelector((state: any) => state.generation?.imageCount || 1);
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const logoImageName = useAppSelector((state: any) => state.generation?.logoImageName || '');
  const productImageName = useAppSelector((state: any) => state.generation?.productImageName || '');
  const businessName = useAppSelector((state: any) => state.generation?.businessName || '');
  const tagLine = useAppSelector((state: any) => state.generation?.tagLine || '');
  const isGenerating = useAppSelector((state: any) => state.generation?.isGenerating || false);
  const error = useAppSelector((state: any) => state.generation?.error);
  const generatedMockups = useAppSelector((state: any) => state.generation?.generatedMockups || []);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  // Check if all required fields are filled
  const isFormValid = prompt.trim() && logoImageName && productImageName && businessName.trim();

  const handleGenerate = async () => {
    if (!isFormValid || isGenerating) return;

    try {
      // Get the actual File objects from the refs
      const logoFile = logoButtonRef.current?.getSelectedFile();
      const productFile = productButtonRef.current?.getSelectedFile();

      if (!logoFile || !productFile) {
        console.error('Files not found');
        return;
      }

      // The generateMockup thunk will automatically update the generatedMockups state
      await dispatch(generateMockup({
        prompt: prompt.trim(),
        model: selectedModel,
        imageCount,
        frameSize,
        logoImage: logoFile,
        productImage: productFile,
        businessName: businessName.trim(),
        tagLine: tagLine,
      })).unwrap();

    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as HTMLElement).closest('.dropdown-container')) {
        dispatch(toggleDropdown(''));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown, dispatch]);

  return (
    <>
      {/* Generated Images Display */}
      {generatedMockups.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-[780px] z-[50] mb-4">
          <div className="rounded-2xl bg-black/80 backdrop-blur-xl ring-1 ring-white/20 shadow-2xl p-4">
            <h3 className="text-white text-lg font-semibold mb-3">Generated Mockups</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedMockups.map((image: GeneratedImage, index: number) => (
                <div key={index} className="relative rounded-xl overflow-hidden ring-1 ring-white/20">
                  <Image 
                    src={image.url} 
                    alt={`Generated mockup ${index + 1}`}
                    width={400}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 rounded-full p-2">
                    <span className="text-white text-sm font-medium">{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[780px] z-[60]">
        <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          <div className="flex items-center gap-3 p-3">
            <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
              <input
                type="text"
                placeholder="Describe how you want the logo integrated into the product..."
                value={prompt}
                onChange={(e) => dispatch(setPrompt(e.target.value))}
                className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-none"
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <button
                onClick={handleGenerate}
                disabled={!isFormValid || isGenerating}
                className={`px-6 py-2.5 rounded-full text-[15px] font-semibold transition ${
                  isFormValid && !isGenerating
                    ? 'bg-[#2F6BFF] hover:bg-[#1d4ed8] text-white'
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                }`}
              >
                {isGenerating ? 'Generating...' : 'Generate Mockup'}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
            <UploadLogoButton ref={logoButtonRef} />
            <ModelsDropdown />
            <ProductImageButton ref={productButtonRef} />
            <BusinessNameButton />
            <TagLineButton />
            <FrameSizeButton />
            <ImageCountButton />
          </div>
          
          {/* Form validation indicator */}
          {!isFormValid && (
            <div className="px-3 pb-3">
              <div className="text-orange-400 text-sm">
                Please fill in: {!prompt.trim() && 'Prompt, '}{!logoImageName && 'Logo, '}{!productImageName && 'Product Image, '}{!businessName.trim() && 'Business Name'}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InputBox;


