'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Zap, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import ImageComparisonSlider from '@/app/view/workflows/components/ImageComparisonSlider';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { useCredits } from '@/hooks/useCredits';
import { getSignInUrl } from '@/routes/routes';
import WorkflowUploadArea from '@/app/view/workflows/components/WorkflowUploadArea';

// Preset color swatches with their human-readable names
const COLOR_SWATCHES = [
  { hex: '#38bdf8', name: 'Sky Blue' },
  { hex: '#f87171', name: 'Coral Red' },
  { hex: '#facc15', name: 'Golden Blonde' },
  { hex: '#4ade80', name: 'Emerald Green' },
  { hex: '#2dd4bf', name: 'Teal' },
  { hex: '#3b82f6', name: 'Royal Blue' },
  { hex: '#ec4899', name: 'Hot Pink' },
];

const DEFAULT_COLOR = { hex: '#f43f5e', name: 'Red Blonde' };

export default function HairStyle() {
  const router = useRouter();
  const {
    creditBalance,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction,
    user,
  } = useCredits();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [hairStyle, setHairStyle] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLOR.hex);
  const [selectedColorName, setSelectedColorName] = useState<string>(DEFAULT_COLOR.name);

  // Workflow data
  const workflowData = {
    id: 'hair-style',
    title: 'Hair Style',
    category: 'Fashion',
    description: 'Try different hairstyles on your photo.',
    cost: 90,
  };

  const CREDIT_COST = 90;

  useEffect(() => {
    setTimeout(() => setIsOpen(true), 50);
  }, []);

  const onClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      router.push('/view/workflows/fashion');
    }, 300);
  };

  const openUploadModal = () => setIsUploadModalOpen(true);

  const handleImageSelect = (url: string) => {
    setUploadedImage(url);
    setGeneratedImage(null);
    setIsUploadModalOpen(false);
  };

  // Convert a hex color to a descriptive color name for the prompt
  const getColorDescription = (hex: string): string => {
    const preset = COLOR_SWATCHES.find(s => s.hex.toLowerCase() === hex.toLowerCase());
    if (preset) return preset.name;
    if (hex === DEFAULT_COLOR.hex) return DEFAULT_COLOR.name;
    // For custom colors, return the hex value and let the AI interpret it
    return hex;
  };

  const handleRun = async () => {
    if (!user) {
      router.push(getSignInUrl());
      return;
    }
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }
    if (creditBalance < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      return;
    }

    try {
      deductCreditsOptimisticForGeneration(CREDIT_COST);
      setIsGenerating(true);

      const colorDescription = getColorDescription(selectedColor);

      // Build payload — if the user left the prompt empty, the backend falls back to a hardcoded default.
      // If user typed a full instructional prompt (detected by length/keywords), pass it verbatim as customPrompt.
      const looksLikeCustomPrompt =
        hairStyle.trim().length > 80 ||
        /\b(do not|don't|keep|preserve|maintain|change only|only change|make sure|ensure|strictly)\b/i.test(hairStyle.trim());

      const payload: Record<string, any> = {
        image: uploadedImage,
        isPublic: true,
        size: '2K',
      };

      if (looksLikeCustomPrompt) {
        // Use verbatim — backend skips its own prompt builder
        payload.customPrompt = hairStyle.trim();
      } else {
        // May be empty — service will use its hardcoded default style
        payload.hairStyle = hairStyle.trim();
        payload.hairColor = colorDescription;
      }

      const response = await axiosInstance.post('/api/workflows/fashion/hair-style', payload);

      if (response.data?.responseStatus === 'success' && response.data?.data?.images?.[0]?.url) {
        setGeneratedImage(response.data.data.images[0].url);
        toast.success('Hairstyle generated successfully!');
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }
    } catch (error: any) {
      console.error('HairStyle generation error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(
        error.response?.data?.message || error.message || 'Failed to generate hairstyle',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadFileWithNaming(generatedImage, null, 'image', 'hairstyle-result');
      toast.success('Downloading...');
    } catch {
      toast.error('Failed to download image');
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes shimmer { 100% { left: 150%; } }
      `}</style>
      <Toaster position="bottom-center" toastOptions={{
        style: { background: '#333', color: '#fff' }
      }} />

      <div className={`fixed inset-0 z-[80] flex items-center justify-center px-4 md:pl-20 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="absolute top-0 right-0 bottom-0 left-0 md:left-20 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 md:top-10 md:right-10 z-50 w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95 shadow-2xl group"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <div className={`relative w-full max-w-6xl h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>

          <div className="flex w-full h-full flex-col md:flex-row">
            {/* Left Panel - Controls */}
            <div className="w-full md:w-[40%] h-[55%] md:h-full p-8 lg:p-12 flex flex-col border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
                <p className="text-slate-400 text-lg mb-8">{workflowData.description}</p>

                {/* Upload Area */}
                <div className="mb-8">
                  <WorkflowUploadArea
                    placeholderLabel="Upload Image"
                    placeholderSublabel="JPG, PNG, WebP up to 25MB"
                    currentImage={uploadedImage}
                    changeLabel="Change Image"
                    onImageSelect={(url) => {
                      setUploadedImage(url);
                      setGeneratedImage(null);
                    }}
                    openModal={() => openUploadModal()}
                    className="h-48"
                    icon={<Camera size={24} />}
                  />
                </div>

                {/* Hair Style / Custom Prompt */}
                <div className="mb-8">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block tracking-wider">
                    HAIR STYLE
                    <span className="ml-2 font-normal normal-case text-slate-600">(optional)</span>
                  </label>
                  <textarea
                    value={hairStyle}
                    onChange={(e) => setHairStyle(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all resize-none h-32"
                    placeholder="e.g. 'Long curly red hair' — leave blank to let AI choose the best style..."
                  ></textarea>
                  <p className="text-[10px] text-slate-600 mt-1 px-1">Leave blank for AI-selected style, or write a full custom prompt to control every detail.</p>
                </div>

                {/* Color Preference */}
                <div className="mb-8">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-3 block tracking-wider">
                    COLOR PREFERENCE
                    <span className="ml-2 text-slate-600 normal-case font-normal">(default: Red Blonde)</span>
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Default color swatch */}
                    <button
                      onClick={() => { setSelectedColor(DEFAULT_COLOR.hex); setSelectedColorName(DEFAULT_COLOR.name); }}
                      title={DEFAULT_COLOR.name}
                      className={`w-10 h-10 rounded-xl transition-all shrink-0 ${selectedColor === DEFAULT_COLOR.hex ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                      style={{ background: 'linear-gradient(135deg, #f43f5e 50%, #fbbf24 100%)' }}
                    />
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        onClick={() => { setSelectedColor(swatch.hex); setSelectedColorName(swatch.name); }}
                        title={swatch.name}
                        className={`w-10 h-10 rounded-xl transition-all shrink-0 ${selectedColor === swatch.hex ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: swatch.hex }}
                      />
                    ))}
                    {/* Custom color picker */}
                    <div className="relative shrink-0">
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => {
                          setSelectedColor(e.target.value);
                          setSelectedColorName(e.target.value);
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                      <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-all ${!COLOR_SWATCHES.some(s => s.hex === selectedColor) && selectedColor !== DEFAULT_COLOR.hex ? 'ring-2 ring-white' : ''}`}>
                        <span className="text-xl">+</span>
                      </div>
                    </div>
                  </div>
                  {selectedColorName && (
                    <p className="text-[10px] text-slate-500 mt-2 px-1">Selected: {selectedColorName}</p>
                  )}
                </div>
              </div>

              {/* Run Button */}
              <div className="mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-slate-500">Cost estimated:</span>
                  <div className="flex items-center gap-1.5 text-white font-medium text-sm">
                    <Zap size={14} className="text-[#60a5fa] fill-[#60a5fa]" />
                    {workflowData.cost} Credits
                  </div>
                </div>
                <button
                  onClick={handleRun}
                  disabled={isGenerating || !uploadedImage}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2
                    ${isGenerating || !uploadedImage
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-[#60a5fa] text-black hover:bg-[#60a5fa]/90 shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:shadow-[0_0_30px_rgba(96,165,250,0.5)]'
                    }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Running Workflow...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className={!uploadedImage ? 'fill-slate-500' : 'fill-black'} />
                      Run Workflow
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="w-full md:flex-1 h-[45%] md:h-full items-center justify-center bg-[#050505] relative overflow-hidden flex border-t md:border-t-0 md:border-l border-white/10 shrink-0">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
              </div>

              {uploadedImage && generatedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <ImageComparisonSlider
                    beforeImage={uploadedImage}
                    afterImage={generatedImage}
                    beforeLabel="Before"
                    afterLabel="Result"
                    imageFit="object-cover"
                    imagePosition="object-center"
                  />
                  <button
                    onClick={handleDownload}
                    className="absolute bottom-10 right-10 z-30 flex items-center gap-2 px-5 py-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 rounded-full text-white text-sm font-medium transition-all active:scale-95 group"
                  >
                    <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                    Download
                  </button>
                </div>
              ) : uploadedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <img src={uploadedImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Preview" />
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all duration-500">
                      <div className="relative w-20 h-20 mb-4">
                        <div className="absolute inset-0 border-4 border-[#60a5fa]/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-[#60a5fa] rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <p className="text-white font-medium text-lg animate-pulse">Generating hairstyle...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <ImageComparisonSlider
                    beforeImage="/workflow-samples/hair-style-before.jpg"
                    afterImage="/workflow-samples/hair-style-after.jpg"
                    beforeLabel="Before"
                    afterLabel="Result"
                    imageFit="object-cover"
                    imagePosition="object-center"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isUploadModalOpen && (
        <UploadModal
          persistLocalDeviceUploads={false}
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onAdd={(urls: string[]) => {
            if (urls && urls.length > 0) {
              handleImageSelect(urls[0]);
            }
          }}
          remainingSlots={1}
        />
      )}
    </>
  );
}
