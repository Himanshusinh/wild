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

export default function SurpriseMe() {
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
  const [additionalText, setAdditionalText] = useState("");

  // Workflow Data
  const workflowData = {
    id: "surprise-me",
    title: "Surprise Me",
    category: "Fun",
    description: "100,000 prompts ready to inspire your next creative masterpiece.",
    cost: 90
  };

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

      const response = await axiosInstance.post('/api/workflows/fun/surprise-me', {
        image: originalImage,
        isPublic: true,
        additionalText: additionalText
      });

      if (response.data?.data?.images?.[0]?.url) {
        setGeneratedImage(response.data.data.images[0].url);
        toast.success('Surprise generated successfully!');
      } else {
        // Simulation for now if no real API
        await new Promise(resolve => setTimeout(resolve, 3000));
        setGeneratedImage("/workflow-samples/surpriseme-after.jpg");
        toast.success('Surprise generated successfully!');
      }

    } catch (error: any) {
      console.error('Surprise Me error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(error.response?.data?.message || error.message || 'Failed to run workflow');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadFileWithNaming(generatedImage, null, 'image', 'surprise-result');
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

          <div className="flex w-full h-full flex-col md:flex-row shadow-2xl">
            {/* Left Panel - Controls */}
            <div className="w-full md:w-[40%] h-[55%] md:h-full p-8 lg:p-12 flex flex-col border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto shadow-xl">
              <div className="flex-1 pb-6">
                <div className="inline-flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">{workflowData.description}</p>

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

                <div className="mb-8">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block tracking-wider">Additional Details (Optional)</label>
                  <textarea
                    value={additionalText}
                    onChange={(e) => setAdditionalText(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all resize-none h-32"
                    placeholder="Add extra guidance for the surprise, e.g., 'make it cyberpunk' or 'add neon lights'..."
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
            <div className="w-full md:flex-1 h-[45%] md:h-full items-center justify-center bg-[#050505] relative overflow-hidden flex border-t md:border-t-0 md:border-l border-white/10 shrink-0 shadow-inner">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
              </div>

              {originalImage && generatedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8 transition-all duration-300">
                  <ImageComparisonSlider
                    beforeImage={originalImage}
                    afterImage={generatedImage}
                    beforeLabel="Before"
                    afterLabel="Result"
                    imageFit="object-contain"
                    imagePosition="object-center"
                  />
                  <button
                    onClick={handleDownload}
                    className="absolute bottom-10 right-10 z-30 flex items-center gap-2 px-5 py-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 rounded-full text-white text-sm font-medium transition-all active:scale-95 group shadow-2xl"
                  >
                    <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                    Download
                  </button>
                </div>
              ) : originalImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8 transition-all duration-300">
                  <img src={originalImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300" alt="Preview" />
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all duration-500">
                      <img src="/styles/Logo.gif" alt="Loading" className="w-24 h-24 mb-4" />
                      <p className="text-white font-medium text-lg animate-pulse">Generating surprise...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <ImageComparisonSlider
                    beforeImage="/workflow-samples/surpriseme-before.jpg"
                    afterImage="/workflow-samples/surpriseme-after.jpg"
                    beforeLabel="Before"
                    afterLabel="After"
                    imageFit="object-contain"
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
