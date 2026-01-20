'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Unused imports removed
import { X, Camera, Zap, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import ImageComparisonSlider from '@/app/view/workflows/components/ImageComparisonSlider';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { useCredits } from '@/hooks/useCredits';

export default function CustomStickers() {
  const router = useRouter();
  const {
    creditBalance,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction
  } = useCredits();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedShape, setSelectedShape] = useState("Circle");
  const [selectedStyle, setSelectedStyle] = useState("Cartoon");
  const [selectedTheme, setSelectedTheme] = useState("Emoji / Expressions");
  const [selectedMaterial, setSelectedMaterial] = useState("Matte");
  const [selectedFileStyle, setSelectedFileStyle] = useState("PNG");
  const [additionalDetails, setAdditionalDetails] = useState("");

  // Workflow Data
  const workflowData = {
    id: "custom-stickers",
    title: "Create custom stickers",
    category: "Fun",
    description: "Create a collection of cute chibi illustration stickers and see them as mockups on notebooks or laptops.",
    cost: 90
  };

  const shapeOptions = [
    "Circle",
    "Square",
    "Rectangle",
    "Rounded Rectangle",
    "Custom Shape (Auto Cut)"
  ];

  const styleOptions = [
    "Cartoon",
    "Minimal",
    "Cute",
    "Bold",
    "Hand-Drawn",
    "Realistic"
  ];

  const themeOptions = [
    "Emoji / Expressions",
    "Logo / Brand",
    "Quotes / Typography",
    "Illustration",
    "Icon / Symbol",
    "Pattern-Based"
  ];

  const materialOptions = [
    "Matte",
    "Glossy",
    "Transparent",
    "Holographic",
    "Vinyl",
    "Paper"
  ];

  useEffect(() => {
    // Open modal animation on mount
    setTimeout(() => setIsOpen(true), 50);
  }, []);

  const onClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      router.push('/view/workflows/fun');
    }, 300);
  };

  const openUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleImageSelect = (url: string) => {
    setOriginalImage(url);
    // Reset generated image when new image is selected
    setGeneratedImage(null);
    setIsUploadModalOpen(false);
  };

  const handleRun = async () => {
    if (!originalImage) {
      toast.error('Please upload an image first');
      return;
    }

    const CREDIT_COST = 90;
    if (creditBalance < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      return;
    }

    try {
      deductCreditsOptimisticForGeneration(CREDIT_COST);
      setIsGenerating(true);

      // Simulation for now
      console.log(`Generating sticker with shape: ${selectedShape}, style: ${selectedStyle}, theme: ${selectedTheme}, details: ${additionalDetails}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      setGeneratedImage("/workflow-samples/custom-stickers-after.jpg"); // Placeholder result
      toast.success(`Sticker created successfully!`);

    } catch (error: any) {
      console.error('Custom Stickers error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(error.response?.data?.message || error.message || 'Failed to create stickers');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadFileWithNaming(generatedImage, null, 'image', 'custom-stickers-result');
      toast.success('Downloading...');
    } catch (error) {
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

                <div className="mb-8">
                  <div className="border border-dashed border-white/15 rounded-xl bg-black/20 h-48 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors relative overflow-hidden group"
                    onClick={openUploadModal}>
                    {originalImage ? (
                      <>
                        <img src={originalImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Original" />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur">Change Image</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center text-slate-400"><Camera size={24} /></div>
                        <div className="text-center">
                          <span className="text-sm text-slate-300 block font-medium">Upload Image</span>
                          <span className="text-xs text-slate-500">JPG, PNG, WebP up to 25MB</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">Sticker Shape</label>
                  <div className="flex flex-wrap gap-2">
                    {shapeOptions.map(shape => (
                      <button
                        key={shape}
                        onClick={() => setSelectedShape(shape)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${selectedShape === shape
                          ? 'bg-[#60a5fa] text-black border-[#60a5fa] shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8 animate-in fade-in slide-in-from-top-3 duration-700">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">Sticker Style</label>
                  <div className="flex flex-wrap gap-2">
                    {styleOptions.map(style => (
                      <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${selectedStyle === style
                          ? 'bg-[#60a5fa] text-black border-[#60a5fa] shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">Design Theme</label>
                  <div className="flex flex-wrap gap-2">
                    {themeOptions.map(theme => (
                      <button
                        key={theme}
                        onClick={() => setSelectedTheme(theme)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${selectedTheme === theme
                          ? 'bg-[#60a5fa] text-black border-[#60a5fa] shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">Material</label>
                  <div className="flex flex-wrap gap-2">
                    {materialOptions.map(material => (
                      <button
                        key={material}
                        onClick={() => setSelectedMaterial(material)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${selectedMaterial === material
                          ? 'bg-[#60a5fa] text-black border-[#60a5fa] shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8 animate-in fade-in slide-in-from-top-5 duration-1000">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">Sticker Type</label>
                  <div className="flex flex-wrap gap-2">
                    {["Single Sticker", "Sticker Sheet", "Die Cut", "Kiss Cut"].map(style => (
                      <button
                        key={style}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8 animate-in fade-in slide-in-from-top-5 duration-1000">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">File Style</label>
                  <div className="flex flex-wrap gap-2">
                    {["PNG", "JPG", "WEBP"].map(style => (
                      <button
                        key={style}
                        onClick={() => setSelectedFileStyle(style)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${selectedFileStyle === style
                          ? 'bg-[#60a5fa] text-black border-[#60a5fa] shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8 animate-in fade-in slide-in-from-top-5 duration-1000">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block tracking-wider">ADDITIONAL DETAILS (OPTIONAL)</label>
                  <textarea
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all resize-none h-32"
                    placeholder="Add extra text, background details, or specific instructions here..."
                  ></textarea>
                </div>
              </div>


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
                  disabled={isGenerating || !originalImage}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2
                    ${isGenerating || !originalImage
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
                      <Zap size={16} className={(!originalImage) ? "fill-slate-500" : "fill-black"} />
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

              {originalImage && generatedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <ImageComparisonSlider
                    beforeImage={originalImage}
                    afterImage={generatedImage}
                    beforeLabel="Before"
                    afterLabel="Result"
                    imageFit="object-contain"
                  />
                  <button
                    onClick={handleDownload}
                    className="absolute bottom-10 right-10 z-30 flex items-center gap-2 px-5 py-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 rounded-full text-white text-sm font-medium transition-all active:scale-95 group"
                  >
                    <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                    Download
                  </button>
                </div>
              ) : originalImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <img src={originalImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Preview" />
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all duration-500">
                      <div className="relative w-20 h-20 mb-4">
                        <div className="absolute inset-0 border-4 border-[#60a5fa]/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-[#60a5fa] rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <p className="text-white font-medium text-lg animate-pulse">Creating stickers...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <ImageComparisonSlider
                    beforeImage="/workflow-samples/custom-stickers-before.png"
                    afterImage="/workflow-samples/custom-stickers-after.png"
                    beforeLabel="Before"
                    afterLabel="After"
                    imageFit="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onAdd={(urls: string[]) => {
            if (urls && urls.length > 0) {
              handleImageSelect(urls[0]);
            }
          }}
          remainingSlots={1}
        />
      )
      }
    </>
  );
}
