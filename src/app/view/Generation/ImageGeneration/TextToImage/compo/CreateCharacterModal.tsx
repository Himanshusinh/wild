'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Character } from './CharacterModal';

type CreateCharacterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: (character: Character) => void;
};

const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({
  isOpen,
  onClose,
  onCharacterCreated,
}) => {
  const [name, setName] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [leftImage, setLeftImage] = useState<string | null>(null);
  const [rightImage, setRightImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const frontInputRef = useRef<HTMLInputElement>(null);
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setName('');
      setFrontImage(null);
      setLeftImage(null);
      setRightImage(null);
      setError(null);
      setIsGenerating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (
    file: File,
    setter: (url: string) => void,
    maxSize: number = 2 * 1024 * 1024
  ) => {
    if (file.size > maxSize) {
      setError('File size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (
    inputRef: React.RefObject<HTMLInputElement | null>,
    setter: (url: string) => void
  ) => {
    inputRef.current?.click();
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, setter);
    }
  };

  const handleGenerate = async () => {
    if (!name.trim()) {
      setError('Character name is required');
      return;
    }
    if (!frontImage) {
      setError('Front image is required');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Build character prompt for highly realistic, passport-like character
      // Store character name at the start of prompt for easy extraction
      const characterPrompt = `${name.trim()}, highly realistic and natural-looking portrait, passport-style framing, square format, professional photography, detailed facial features, natural lighting, high quality, photorealistic`;

      // Prepare uploaded images array (front is mandatory, left/right are optional)
      const uploadedImages: string[] = [frontImage];
      if (leftImage) uploadedImages.push(leftImage);
      if (rightImage) uploadedImages.push(rightImage);

      // Use Google Nano Banana (gemini-25-flash-image) for character generation
      // or Seedream if preferred - using Nano Banana as default
      const model = 'gemini-25-flash-image'; // or 'seedream-v4' if preferred

      // Call backend API
      const api = (await import('@/lib/axiosInstance')).getApiClient();
      const payload = {
        prompt: characterPrompt,
        model: model,
        n: 1, // Generate single character
        aspect_ratio: '1:1', // Square format for passport-like
        frameSize: '1:1',
        uploadedImages: uploadedImages,
        generationType: 'text-to-character', // Important: use text-to-character
        output_format: 'jpeg',
        isPublic: false, // Characters are private by default
        characterName: name.trim(), // Store character name directly for text-to-character
      };

      const { data } = await api.post('/api/fal/generate', payload);
      const result = data?.data || data;

      if (!result.images || result.images.length === 0) {
        throw new Error('No character image generated');
      }

      // Create character object with generated image
      const character: Character = {
        id: result.historyId || `char-${Date.now()}`,
        name: name.trim(),
        frontImageUrl: result.images[0].url,
        leftImageUrl: leftImage || undefined,
        rightImageUrl: rightImage || undefined,
        createdAt: new Date().toISOString(),
      };

      onCharacterCreated(character);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create character');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-2xl bg-black/70 backdrop-blur-xl ring-1 ring-white/20 rounded-lg overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h2 className="text-white text-lg font-semibold">Create New Character</h2>
            <button className="text-white/80 hover:text-white" onClick={onClose}>✕</button>
          </div>

          <div className="p-6 space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Character Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter character name"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            {/* First Row: Front Image (Mandatory) */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Front Image <span className="text-red-400">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-white/60 transition-colors ${
                  frontImage ? 'border-white/40' : 'border-white/30'
                }`}
                onClick={() => handleFileSelect(frontInputRef, setFrontImage)}
              >
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setFrontImage)}
                />
                {frontImage ? (
                  <div className="relative w-full aspect-square max-w-xs mx-auto rounded-lg overflow-hidden ring-1 ring-white/20">
                    <Image src={frontImage} alt="Front" fill className="object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFrontImage(null);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 flex items-center justify-center"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                        <path d="M3 6h18" />
                        <path d="M8 6v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-white/60">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 5v14"/>
                      <path d="M5 12h14"/>
                    </svg>
                    <div className="mt-2 text-sm">Click to upload front image</div>
                  </div>
                )}
              </div>
            </div>

            {/* Second Row: Left and Right Side Images (Optional) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Side Image */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Left Side Image <span className="text-white/50 text-xs">(Optional)</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-white/60 transition-colors ${
                    leftImage ? 'border-white/40' : 'border-white/30'
                  }`}
                  onClick={() => handleFileSelect(leftInputRef, setLeftImage)}
                >
                  <input
                    ref={leftInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setLeftImage)}
                  />
                  {leftImage ? (
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden ring-1 ring-white/20">
                      <Image src={leftImage} alt="Left" fill className="object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLeftImage(null);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 flex items-center justify-center"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                          <path d="M3 6h18" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-white/60">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 5v14"/>
                        <path d="M5 12h14"/>
                      </svg>
                      <div className="mt-1 text-xs">Click to upload</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side Image */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Right Side Image <span className="text-white/50 text-xs">(Optional)</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-white/60 transition-colors ${
                    rightImage ? 'border-white/40' : 'border-white/30'
                  }`}
                  onClick={() => handleFileSelect(rightInputRef, setRightImage)}
                >
                  <input
                    ref={rightInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setRightImage)}
                  />
                  {rightImage ? (
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden ring-1 ring-white/20">
                      <Image src={rightImage} alt="Right" fill className="object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRightImage(null);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 flex items-center justify-center"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                          <path d="M3 6h18" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-white/60">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 5v14"/>
                        <path d="M5 12h14"/>
                      </svg>
                      <div className="mt-1 text-xs">Click to upload</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <button
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                onClick={onClose}
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerate}
                disabled={isGenerating || !name.trim() || !frontImage}
              >
                {isGenerating ? 'Creating...' : 'Create Character'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCharacterModal;

