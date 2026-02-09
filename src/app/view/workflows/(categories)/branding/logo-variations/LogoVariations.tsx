'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Zap, Download, Plus, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import { useCredits } from '@/hooks/useCredits';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { WORKFLOWS_DATA } from '@/app/view/workflows/components/data';
import { getSignInUrl } from '@/routes/routes';

export default function LogoVariations() {
  const router = useRouter();
  const {
    creditBalance,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction,
    user
  } = useCredits();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [numVariations, setNumVariations] = useState(4); // Default to 4 as per request

  const workflowData = WORKFLOWS_DATA.find(w => w.id === "logo-variations") || {
    id: "logo-variations",
    title: "Logo Variations",
    category: "Branding",
    description: "Generate multiple creative variations and styles for your existing logo.",
    model: "Logo Variation AI",
    cost: 90,
    sampleBefore: "/workflow-samples/logo-variations-before.png",
    sampleAfter: "/workflow-samples/logo-variations-after.png"
  };

  const CREDIT_COST = 90 * numVariations;

  useEffect(() => {
    setTimeout(() => setIsOpen(true), 50);
  }, []);

  const onClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      router.push('/view/workflows/branding');
    }, 300);
  };

  const handleImageSelect = (url: string) => {
    setOriginalImage(url);
    setGeneratedImages([]);
    setIsUploadModalOpen(false);
  };


  const handleRun = async () => {
    if (!user) {
      router.push(getSignInUrl());
      return;
    }
    if (!originalImage) {
      toast.error('Please upload your current logo first');
      return;
    }

    if (creditBalance < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      return;
    }

    try {
      deductCreditsOptimisticForGeneration(CREDIT_COST);
      setIsGenerating(true);
      setGeneratedImages([]);

      const response = await axiosInstance.post('/api/workflows/branding/logo-variations', {
        image: originalImage,
        numVariations,
        prompt: prompt.trim() || undefined,
        isPublic: true
      });

      if (response.data?.responseStatus === 'success' && response.data?.data?.images?.length > 0) {
        setGeneratedImages(response.data.data.images.map((img: any) => img.url));
        toast.success(`Generated ${response.data.data.images.length} variations successfully!`);
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

    } catch (error: any) {
      console.error('Logo Variations error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(error.response?.data?.message || error.message || 'Failed to generate variations');
    } finally {
      setIsGenerating(false);
    }
  };


  const handleDownload = async (url: string, index: number) => {
    try {
      await downloadFileWithNaming(url, null, 'image', `logo-variation-${index + 1}`);
      toast.success('Downloading...');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  return (
    <>
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
            <div className="w-full md:w-[42%] p-8 lg:p-12 flex flex-col border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto custom-scrollbar">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
                <p className="text-slate-400 text-sm md:text-lg mb-8 leading-relaxed">{workflowData.description}</p>

                <div className="text-xs text-slate-500 mb-6">Model: {workflowData.model}</div>

                <div className="mb-8">
                  <div className="border border-dashed border-white/15 rounded-xl bg-black/20 h-40 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors relative overflow-hidden group"
                    onClick={() => setIsUploadModalOpen(true)}>
                    {originalImage ? (
                      <>
                        <img src={originalImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Original" />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur">Change Logo</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-slate-400"><Camera size={20} /></div>
                        <div className="text-center">
                          <span className="text-sm text-slate-300 block font-medium">Upload Current Logo</span>
                          <span className="text-xs text-slate-500">JPG, PNG, WebP up to 25MB</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-8">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-4 block">Number of Variations</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => setNumVariations(num)}
                        className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all
                           ${numVariations === num
                            ? 'bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-4 block">Additional Details (Optional)</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Add extra data or specific instructions here..."
                    className="w-full h-32 p-4 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 transition-colors resize-none custom-scrollbar"
                  />
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
                      Generating {numVariations} Variations...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className={!originalImage ? "fill-slate-500" : "fill-black"} />
                      Generate {numVariations} Variations
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="w-full md:flex-1 h-[45%] md:h-full items-center justify-center bg-[#050505] relative overflow-hidden flex border-t md:border-t-0 md:border-l border-white/10 shrink-0">
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
              </div>

              {generatedImages.length > 0 ? (
                <div className="relative w-full h-full p-12 overflow-y-auto custom-scrollbar">
                  <div className={`grid gap-6 w-full h-full ${generatedImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {generatedImages.map((img, idx) => (
                      <div key={idx} className="relative group rounded-2xl overflow-hidden border border-white/10  shadow-inner flex items-center justify-center p-6">
                        <img src={img} className="max-w-full max-h-full object-contain" alt={`Variation ${idx + 1}`} />
                        <button
                          onClick={() => handleDownload(img, idx)}
                          className="absolute bottom-4 right-4 z-30 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 rounded-full text-white flex items-center justify-center transition-all active:scale-95 opacity-0 group-hover:opacity-100"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : originalImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-12 bg-white/5">
                  <div className="w-full h-full  rounded-2xl shadow-inner border border-white/5 flex items-center justify-center p-8 overflow-hidden">
                    <img src={originalImage} className="max-w-full max-h-full object-contain" alt="Preview" />
                  </div>
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-40 transition-all duration-500 rounded-3xl">
                      <div className="relative w-20 h-20 mb-4">
                        <div className="absolute inset-0 border-4 border-[#60a5fa]/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-[#60a5fa] rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <p className="text-white font-medium text-lg animate-pulse">Evolving your logo...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-12 bg-white/5">
                  <div className="w-full h-full  rounded-2xl shadow-inner border border-white/5 flex items-center justify-center p-8 overflow-hidden">
                    <img
                      src={workflowData.sampleAfter}
                      className="max-w-full max-h-full object-contain"
                      alt="Logo Variations Preview"
                    />
                  </div>

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
          onAdd={(urls: string[]) => urls.length > 0 && handleImageSelect(urls[0])}
          remainingSlots={1}
        />
      )}
    </>
  );
}
