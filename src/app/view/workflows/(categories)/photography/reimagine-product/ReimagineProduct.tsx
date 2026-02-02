'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Zap, Download, Sparkles, Box, Palette } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import ImageComparisonSlider from '@/app/view/workflows/components/ImageComparisonSlider';
import { useCredits } from '@/hooks/useCredits';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { WORKFLOWS_DATA } from '@/app/view/workflows/components/data';
import { getSignInUrl } from '@/routes/routes';

const STYLES = [
  'Minimalist', 'Nature', 'Luxury', 'Industrial',
  'Cyberpunk', 'Studio', 'Vintage', 'Futuristic'
];

export default function ReimagineProduct() {
  const router = useRouter();
  const {
    creditBalance,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction,
    user
  } = useCredits();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('Minimalist');
  const [additionalDetails, setAdditionalDetails] = useState('');

  // Workflow Data
  const workflowData = (WORKFLOWS_DATA.find(w => w.id === "reimagine-product") || {
    id: "reimagine-product",
    title: "Reimagine Product",
    category: "Photography",
    description: "Place your product in stunning new environments and artistic styles while keeping the product authentic.",
    model: "Seadream4/ Nano Banana/ Qwen",
    cost: 80,
    sampleBefore: "/workflow-samples/reimagine-product-before-v2.png",
    sampleAfter: "/workflow-samples/reimagine-product-after-v2.png",
  }) as any;

  const CREDIT_COST = 90;

  useEffect(() => {
    setTimeout(() => setIsOpen(true), 50);
  }, []);

  const onClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      router.push('/view/workflows/photography');
    }, 300);
  };

  const handleImageSelect = (url: string) => {
    setProductImage(url);
    setGeneratedImage(null);
    setIsUploadModalOpen(false);
  };

  const handleRun = async () => {
    if (!user) {
      router.push(getSignInUrl());
      return;
    }
    if (!productImage) {
      toast.error('Please upload a product snapshot first');
      return;
    }

    if (creditBalance < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      return;
    }

    try {
      deductCreditsOptimisticForGeneration(CREDIT_COST);
      setIsGenerating(true);

      const response = await axiosInstance.post('/api/workflows/photography/reimagine-product', {
        image: productImage,
        style: selectedStyle,
        additionalDetails,
        isPublic: true
      });

      if (response.data?.responseStatus === 'success' && response.data?.data?.images?.[0]?.url) {
        setGeneratedImage(response.data.data.images[0].url);
        toast.success('Product reimagined successfully!');
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

    } catch (error: any) {
      console.error('Reimagine Product error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(error.response?.data?.message || error.message || 'Failed to reimagine product');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadFileWithNaming(generatedImage, null, 'image', 'reimagine-product');
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

          <div className="flex w-full h-full">
            <div className="w-full md:w-[48%] p-8 lg:p-12 flex flex-col border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">{workflowData.description}</p>

                <div className="text-xs text-slate-500 mb-6">Model: {workflowData.model}</div>

                <div className="flex flex-col gap-6 mb-8">
                  {/* 1. Source Photo */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">1. Product Snapshot</label>
                    <div className="border border-dashed border-white/15 rounded-xl bg-black/20 h-28 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors relative overflow-hidden group"
                      onClick={() => setIsUploadModalOpen(true)}>
                      {productImage ? (
                        <>
                          <img src={productImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Product" />
                          <div className="relative z-10">
                            <span className="text-xs text-white font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur text-center">Change Product Image</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-slate-400"><Camera size={20} /></div>
                          <div className="text-center">
                            <span className="text-sm text-slate-300 block font-medium">Upload Product Image</span>
                            <span className="text-[10px] text-slate-500">Center-faced snapshot best</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-3 block ml-1 tracking-wider">REIMAGINATION STYLE</label>
                    <div className="flex flex-wrap gap-2">
                      {STYLES.map((style) => (
                        <button
                          key={style}
                          onClick={() => setSelectedStyle(style)}
                          className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${selectedStyle === style
                            ? 'bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">ADDITIONAL DETAILS (OPTIONAL)</label>
                    <textarea
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all resize-none h-24"
                      placeholder="E.g. Soft lighting, marble surface, flowers in background..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-slate-500">Cost:</span>
                  <div className="flex items-center gap-1.5 text-white font-medium text-sm">
                    <Zap size={14} className="text-[#60a5fa] fill-[#60a5fa]" />
                    {CREDIT_COST} Credits
                  </div>
                </div>
                <button
                  onClick={handleRun}
                  disabled={isGenerating || !productImage}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2
                  ${isGenerating || !productImage
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-[#60a5fa] text-black hover:bg-[#60a5fa]/90 shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:shadow-[0_0_30px_rgba(96,165,250,0.5)] active:scale-[0.98]'
                    }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Reimagining...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className={!productImage ? "fill-slate-500" : "fill-black"} />
                      Run Workflow
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Preview */}
            <div className="flex-1 bg-[#020202] relative overflow-hidden flex flex-col">
              <div className="flex-1 relative">
                {productImage && generatedImage ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 group">
                    <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                      <ImageComparisonSlider
                        beforeImage={productImage}
                        afterImage={generatedImage}
                        beforeLabel="Before"
                        afterLabel="Output"
                        imageFit="object-contain"
                        imagePosition="object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      {/* Download Button */}
                      <button
                        onClick={handleDownload}
                        className="absolute bottom-6 right-6 z-30 flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#60a5fa] text-black rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
                      >
                        <Download size={18} />
                        Download
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white/[0.01]">
                    <div className="w-full h-full relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-black/40">
                      <ImageComparisonSlider
                        beforeImage={workflowData.sampleBefore}
                        afterImage={workflowData.sampleAfter}
                        beforeLabel="Before"
                        afterLabel="After"
                        imageFit="object-contain"
                        imagePosition="object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white font-medium text-sm flex items-center gap-2">
                          <Sparkles size={16} className="text-[#60a5fa]" /> Try it with your own product
                        </div>
                      </div>
                    </div>

                    {isGenerating && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all duration-500">
                        <div className="relative w-20 h-20 mb-4">
                          <div className="absolute inset-0 border-4 border-[#60a5fa]/20 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-[#60a5fa] rounded-full border-t-transparent animate-spin"></div>
                          <Box size={32} className="absolute inset-0 m-auto text-[#60a5fa] animate-pulse" />
                        </div>
                        <p className="text-white font-medium text-lg animate-pulse">Reimagining product...</p>
                      </div>
                    )}
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
      </div>
    </>
  );
}


