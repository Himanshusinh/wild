"use client";
import React, { useState } from 'react';
import { BackendPromptV1 } from '@/types/backendPrompt';

interface AdvancedManualFormProps {
  onSubmit: (backendPrompt: BackendPromptV1) => void;
  onCancel: () => void;
  productImage: File | null;
  isGenerating: boolean;
}

const AdvancedManualForm: React.FC<AdvancedManualFormProps> = ({
  onSubmit,
  onCancel,
  productImage,
  isGenerating
}) => {
  const [activeTab, setActiveTab] = useState<'delivery' | 'talent' | 'additional'>('delivery');
  const [formData, setFormData] = useState<Partial<BackendPromptV1>>({
    mode: 'manual',
    delivery: {
      engine: 'veo3_fast',
      resolution: '720p',
      duration: '8s',
      generate_audio: true,
    },
    style: {
      motion_intensity: 'low'
    },
    constraints: {
      avoid: [
        "extra fingers",
        "warped hands", 
        "distorted product",
        "changed or blurred logo",
        "extra brands",
        "text artifacts",
        "heavy flicker"
      ]
    }
  });

  const [useBeats, setUseBeats] = useState(false);
  const [beats, setBeats] = useState([
    { start: 0, end: 2, camera: 'Zoom in', action: 'presenter brings product toward camera', dialogue: 'Real talk... this actually made my mornings easier.' },
    { start: 2, end: 6, camera: 'Pan left', action: 'rotate product to show details', dialogue: 'Build quality is solid and it does what it says.' },
    { start: 6, end: 8, camera: 'Tilt up', action: 'eye contact with a small nod', dialogue: 'If you\'re on the fence... try it and thank me later.' }
  ]);

  // Dropdown states
  const [engineDropdown, setEngineDropdown] = useState(false);
  const [resolutionDropdown, setResolutionDropdown] = useState(false);
  const [audioDropdown, setAudioDropdown] = useState(false);
  const [motionDropdown, setMotionDropdown] = useState(false);

  // Local image upload (optional) – if provided here, it overrides the parent productImage
  const [localImage, setLocalImage] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const handleLocalImageChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    // Validate type
    if (!file.type.startsWith('image/')) {
      alert('Unsupported file. Please upload an image.');
      e.currentTarget.value = '';
      return;
    }
    
    // Compress image if needed
    if (file.type.startsWith('image/')) {
      (async () => {
        try {
          const { compressImageIfNeeded, blobToDataUrl } = await import('@/utils/imageCompression');
          const processed = await compressImageIfNeeded(file);
          const asDataUrl = await blobToDataUrl(processed);
          setLocalImage(processed as any);
          setLocalPreview(asDataUrl);
        } catch (error) {
          console.error('Error processing image:', error);
          alert('Failed to process image');
          e.currentTarget.value = '';
        }
      })();
    } else {
      setLocalImage(file);
      const reader = new FileReader();
      reader.onload = () => setLocalPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => {
      const currentSection = prev[section as keyof BackendPromptV1];
      if (currentSection && typeof currentSection === 'object') {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [field]: value
          }
        };
      } else {
        return {
          ...prev,
          [section]: { [field]: value }
        };
      }
    });
  };

  const handleBeatChange = (index: number, field: string, value: any) => {
    const newBeats = [...beats];
    newBeats[index] = { ...newBeats[index], [field]: value };
    setBeats(newBeats);
  };

  const addBeat = () => {
    setBeats([...beats, { start: 0, end: 2, camera: '', action: '', dialogue: '' }]);
  };

  const removeBeat = (index: number) => {
    if (beats.length > 1) {
      setBeats(beats.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    const selectedImage = localImage || productImage;
    if (!selectedImage) {
      alert('Please upload a product image first');
      return;
    }

    // Validate product image per Veo3 Fast requirements
    const allowedImage = /^image\//.test(selectedImage.type);
    const maxBytes = 8 * 1024 * 1024; // 8MB limit per docs
    if (!allowedImage) {
      alert('Unsupported file. Please upload a valid image file.');
      return;
    }
    if (selectedImage.size > maxBytes) {
      alert('Image too large. Please upload an image ≤ 8MB.');
      return;
    }

    // Convert image to base64
    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUri = reader.result as string;
      
      // Build prompt compatible with Veo3 Fast image-to-video
      const backendPrompt: BackendPromptV1 = {
        mode: 'manual',
        media: { image_url: imageDataUri },
        delivery: formData.delivery!,
        brand: formData.brand,
        style: formData.style,
        talent: formData.talent,
        script: useBeats ? undefined : formData.script,
        beats: useBeats ? beats : undefined,
        constraints: formData.constraints,
        notes: formData.notes
      };

      onSubmit(backendPrompt);
    };
    reader.readAsDataURL(selectedImage);
  };

  const renderDeliveryTab = () => (
    <div className="space-y-4">
      {/* Input Image (local upload) */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-3">Input Image</h3>
        <div className="flex items-start gap-4">
          <div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg ring-1 ring-white/20 bg-white/10 hover:bg-white/20 text-white/90 text-sm cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLocalImageChange} />
            </label>
            <div className="text-xs text-white/60 mt-2">Max 8MB • Recommended 16:9 image</div>
          </div>
          {(localPreview || productImage) && (
            <div className="flex items-center gap-3">
              <div className="w-28 h-16 rounded-lg overflow-hidden ring-1 ring-white/20 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={localPreview || ''} alt="Preview" className="w-full h-full object-cover" />
              </div>
              {localImage && (
                <button
                  type="button"
                  onClick={() => { setLocalImage(null); setLocalPreview(null); }}
                  className="px-3 py-1.5 text-xs rounded-md bg-white/10 hover:bg-white/20 text-white/80"
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-3">Delivery Settings</h3>
        <div className="grid grid-cols-3 gap-3">
          {/* Engine Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setEngineDropdown(!engineDropdown)}
              className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-1 w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {formData.delivery?.engine === 'veo3_fast' ? 'Fast' : 'Quality'}
            </button>
            {engineDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                <button
                  onClick={() => {
                    handleInputChange('delivery', 'engine', 'veo3_fast');
                    setEngineDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition text-[13px] flex items-center justify-between"
                >
                  <span>Fast</span>
                  {formData.delivery?.engine === 'veo3_fast' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
                <button
                  onClick={() => {
                    handleInputChange('delivery', 'engine', 'veo3');
                    setEngineDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition text-[13px] flex items-center justify-between"
                >
                  <span>Quality</span>
                  {formData.delivery?.engine === 'veo3' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Resolution Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setResolutionDropdown(!resolutionDropdown)}
              className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-1 w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a2 2 0 012-2h2a2 2 0 012 2v4m2 0V4a2 2 0 012-2h2a2 2 0 012 2v4m-6 0h12m-6 0v12m0 0v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4m0 0h12" />
              </svg>
              {formData.delivery?.resolution}
            </button>
            {resolutionDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                <button
                  onClick={() => {
                    handleInputChange('delivery', 'resolution', '720p');
                    setResolutionDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition text-[13px] flex items-center justify-between"
                >
                  <span>720p</span>
                  {formData.delivery?.resolution === '720p' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
                <button
                  onClick={() => {
                    handleInputChange('delivery', 'resolution', '1080p');
                    setResolutionDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition text-[13px] flex items-center justify-between"
                >
                  <span>1080p</span>
                  {formData.delivery?.resolution === '1080p' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Audio Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setAudioDropdown(!audioDropdown)}
              className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-1 w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              {formData.delivery?.generate_audio ? 'Yes' : 'No'}
            </button>
            {audioDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                <button
                  onClick={() => {
                    handleInputChange('delivery', 'generate_audio', true);
                    setAudioDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition text-[13px] flex items-center justify-between"
                >
                  <span>Yes</span>
                  {formData.delivery?.generate_audio === true && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
                <button
                  onClick={() => {
                    handleInputChange('delivery', 'generate_audio', false);
                    setAudioDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition text-[13px] flex items-center justify-between"
                >
                  <span>No</span>
                  {formData.delivery?.generate_audio === false && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brand Settings */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-3">Brand Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-white/70 mb-1">Brand Name</label>
            <input
              type="text"
              value={formData.brand?.name || ''}
              onChange={(e) => handleInputChange('brand', 'name', e.target.value)}
              placeholder="e.g., WildMind"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/70 mb-1">Brand Tone</label>
              <input
                type="text"
                value={formData.brand?.tone || ''}
                onChange={(e) => handleInputChange('brand', 'tone', e.target.value)}
                placeholder="authentic, confident"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Colors (Hex)</label>
              <input
                type="text"
                value={formData.brand?.color_palette?.join(', ') || ''}
                onChange={(e) => handleInputChange('brand', 'color_palette', e.target.value.split(',').map(c => c.trim()))}
                placeholder="#111111, #F2F2F2"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Style Settings */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-3">Style Settings</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/70 mb-1">Background</label>
              <input
                type="text"
                value={formData.style?.background || ''}
                onChange={(e) => handleInputChange('style', 'background', e.target.value)}
                placeholder="sunny living room"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Lighting</label>
              <input
                type="text"
                value={formData.style?.lighting || ''}
                onChange={(e) => handleInputChange('style', 'lighting', e.target.value)}
                placeholder="soft window light"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/70 mb-1">Camera Style</label>
              <input
                type="text"
                value={formData.style?.camera_style || ''}
                onChange={(e) => handleInputChange('style', 'camera_style', e.target.value)}
                placeholder="handheld"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Motion</label>
              <div className="relative dropdown-container">
                <button
                  onClick={() => setMotionDropdown(!motionDropdown)}
                  className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-1 w-full"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {formData.style?.motion_intensity}
                </button>
                {motionDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-black/70 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                    {['low', 'medium', 'high'].map((motion) => (
                      <button
                        key={motion}
                        onClick={() => {
                          handleInputChange('style', 'motion_intensity', motion);
                          setMotionDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 transition text-[13px] flex items-center justify-between"
                      >
                        <span className="capitalize">{motion}</span>
                        {formData.style?.motion_intensity === motion && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Framing</label>
            <input
              type="text"
              value={formData.style?.framing || ''}
              onChange={(e) => handleInputChange('style', 'framing', e.target.value)}
              placeholder="waist-up with close-ups"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTalentTab = () => (
    <div className="space-y-4">
      {/* Talent Settings */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-3">Talent Settings</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/70 mb-1">Age Range</label>
            <input
              type="text"
              value={formData.talent?.age_range || ''}
              onChange={(e) => handleInputChange('talent', 'age_range', e.target.value)}
              placeholder="21-25"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Presentation</label>
            <input
              type="text"
              value={formData.talent?.presentation || ''}
              onChange={(e) => handleInputChange('talent', 'presentation', e.target.value)}
              placeholder="casual, natural"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Speaking Style</label>
            <input
              type="text"
              value={formData.talent?.speaking_style || ''}
              onChange={(e) => handleInputChange('talent', 'speaking_style', e.target.value)}
              placeholder="friendly, honest"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Gestures</label>
            <input
              type="text"
              value={formData.talent?.gestures || ''}
              onChange={(e) => handleInputChange('talent', 'gestures', e.target.value)}
              placeholder="subtle hand motions"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content Type Selection */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-3">Content Type</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="script"
              checked={!useBeats}
              onChange={() => setUseBeats(false)}
              className="text-blue-500 w-4 h-4"
            />
            <label htmlFor="script" className="text-white text-sm">Simple Script (Hook/Body/CTA)</label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="beats"
              checked={useBeats}
              onChange={() => setUseBeats(true)}
              className="text-blue-500 w-4 h-4"
            />
            <label htmlFor="beats" className="text-white text-sm">Detailed Beats Timeline</label>
          </div>
        </div>
      </div>

      {/* Script or Beats */}
      {!useBeats ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10">
          <h3 className="text-lg font-semibold text-white mb-3">Script</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/70 mb-1">Hook (0-2s)</label>
              <textarea
                value={formData.script?.hook || ''}
                onChange={(e) => handleInputChange('script', 'hook', e.target.value)}
                placeholder="Opening line in quotes"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 h-16 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Body (2-6s)</label>
              <textarea
                value={formData.script?.body || ''}
                onChange={(e) => handleInputChange('script', 'body', e.target.value)}
                placeholder="Benefits or mini demo in quotes"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 h-16 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">CTA (6-8s)</label>
              <textarea
                value={formData.script?.cta || ''}
                onChange={(e) => handleInputChange('script', 'cta', e.target.value)}
                placeholder="Closing call-to-action in quotes"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 h-16 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Beats Timeline</h3>
            <button
              onClick={addBeat}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              + Add Beat
            </button>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {beats.map((beat, index) => (
              <div key={index} className="border border-white/20 rounded-lg p-3 bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-xs font-medium">Beat {index + 1}</span>
                  {beats.length > 1 && (
                    <button
                      onClick={() => removeBeat(index)}
                      className="text-red-400 hover:text-red-300 text-xs hover:bg-red-400/10 px-2 py-1 rounded transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Start (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="8"
                      value={beat.start}
                      onChange={(e) => handleBeatChange(index, 'start', parseFloat(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">End (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="8"
                      value={beat.end}
                      onChange={(e) => handleBeatChange(index, 'end', parseFloat(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Camera movement"
                    value={beat.camera}
                    onChange={(e) => handleBeatChange(index, 'camera', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Action"
                    value={beat.action}
                    onChange={(e) => handleBeatChange(index, 'action', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <textarea
                    placeholder="Dialogue (in quotes)"
                    value={beat.dialogue}
                    onChange={(e) => handleBeatChange(index, 'dialogue', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs placeholder-white/50 h-16 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAdditionalTab = () => (
    <div className="space-y-4">
      {/* Constraints & Notes */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10">
        <h3 className="text-lg font-semibold text-white mb-3">Additional Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-white/70 mb-1">Avoid (comma-separated)</label>
            <input
              type="text"
              value={formData.constraints?.avoid?.join(', ') || ''}
              onChange={(e) => handleInputChange('constraints', 'avoid', e.target.value.split(',').map(c => c.trim()))}
              placeholder="extra fingers, warped hands, distorted product"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional instructions or special requests..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 h-16 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl ring-1 ring-white/10 w-[800px] h-[700px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">Advanced Manual Control</h2>
          <button
            onClick={onCancel}
            className="text-white/60 hover:text-white text-xl p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/20">
          {[
            { id: 'delivery', label: 'Delivery Settings' },
            { id: 'talent', label: 'Talent Settings' },
            { id: 'additional', label: 'Additional Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-blue-500 bg-white/5'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto h-[400px]">
          {activeTab === 'delivery' && renderDeliveryTab()}
          {activeTab === 'talent' && renderTalentTab()}
          {activeTab === 'additional' && renderAdditionalTab()}
        </div>

        {/* Footer with Action Buttons */}
        <div className="border-t border-white/20 p-6">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 text-white/80 hover:text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isGenerating || !(localImage || productImage)}
              className="px-8 py-2.5 bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white rounded-lg font-semibold transition-colors shadow-[0_4px_16px_rgba(47,107,255,.45)] text-sm"
            >
              {isGenerating ? 'Generating...' : 'Generate Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedManualForm;
