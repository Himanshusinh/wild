'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Zap, Download, Sparkles, User, Image as ImageIcon, Palmtree } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import { useCredits } from '@/hooks/useCredits';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { WORKFLOWS_DATA } from '@/app/view/workflows/components/data';

const PHOTOGRAPHER_STYLES = [
  { id: 'steve-mccurry', label: 'Steve McCurry', description: 'Vibrant, humanistic, National Geographic style.', icon: <Palmtree size={14} /> },
  { id: 'annie-leibovitz', label: 'Annie Leibovitz', description: 'Dramatic, painterly, high-end celebrity portraits.', icon: <User size={14} /> },
  { id: 'ansel-adams', label: 'Ansel Adams', description: 'Classic B&W, high contrast, majestic landscapes.', icon: <ImageIcon size={14} /> },
  { id: 'peter-lindbergh', label: 'Peter Lindbergh', description: 'Raw, emotional, cinematic B&W fashion.', icon: <Camera size={14} /> },
  { id: 'cartier-bresson', label: 'Henri Cartier-Bresson', description: 'Candid B&W, the "Decisive Moment".', icon: <Camera size={14} /> }
];

export default function FamousPhotographer() {
  const router = useRouter();
  const {
    creditBalance,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction
  } = useCredits();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('steve-mccurry');

  // Workflow Data
  const workflowData = (WORKFLOWS_DATA.find(w => w.id === "famous-photographer") || {
    id: "famous-photographer",
    title: "World Famous Photographer",
    category: "Photography",
    description: "Transform your photos into the signature style of legendary world-famous photographers.",
    model: "StyleRender AI",
    cost: 90,
    sampleBefore: "/workflow-samples/famous-photographer-before.png",
    sampleAfter: "/workflow-samples/famous-photographer-after.png"
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
    setSourceImage(url);
    setGeneratedImage(null);
    setIsUploadModalOpen(false);
  };

  const handleRun = async () => {
    if (!sourceImage) {
      toast.error('Please upload your photo first');
      return;
    }

    if (creditBalance < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      return;
    }

    try {
      deductCreditsOptimisticForGeneration(CREDIT_COST);
      setIsGenerating(true);

      const response = await axiosInstance.post('/api/workflows/photography/famous-photographer', {
        sourceImage,
        style: selectedStyle,
        isPublic: true
      });

      if (response.data?.responseStatus === 'success' && response.data?.data?.images?.[0]?.url) {
        setGeneratedImage(response.data.data.images[0].url);
        toast.success('Professional style applied successfully!');
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

    } catch (error: any) {
      console.error('Photographer Style error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(error.response?.data?.message || 'Failed to apply professional style');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      downloadFileWithNaming(generatedImage, null, 'image', 'famous-photographer');
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-500 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <Toaster position="top-right" />

      {/* Blurred Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />

      {/* Main Container */}
      <div className={`relative w-full max-w-6xl h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-10 opacity-0'}`}>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 md:top-10 md:right-10 z-50 w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95 shadow-2xl group"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <div className="flex w-full h-full">
          {/* Left Column: Controls */}
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
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">1. Your Photograph</label>
                  <div className="border border-dashed border-white/15 rounded-xl bg-black/20 h-28 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors relative overflow-hidden group"
                    onClick={() => setIsUploadModalOpen(true)}>
                    {sourceImage ? (
                      <>
                        <img src={sourceImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Source" />
                        <div className="relative z-10">
                          <span className="text-xs text-white font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur text-center">Change Photo</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-slate-400"><Camera size={20} /></div>
                        <div className="text-center">
                          <span className="text-sm text-slate-300 block font-medium">Upload Photo</span>
                          <span className="text-[10px] text-slate-500">Subject to transform</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Photographer Style Selection */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">2. Choose Photographer Style</label>
                  <div className="flex flex-col gap-2">
                    {PHOTOGRAPHER_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-4 rounded-xl transition-all border flex items-start gap-4 text-left ${selectedStyle === style.id
                          ? 'bg-[#60a5fa]/10 border-[#60a5fa] shadow-[0_0_15px_rgba(96,165,250,0.1)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedStyle === style.id ? 'bg-[#60a5fa] text-black' : 'bg-white/5 text-slate-500'}`}>
                          {style.icon}
                        </div>
                        <div>
                          <p className={`text-xs font-bold leading-none mb-1 ${selectedStyle === style.id ? 'text-white' : 'text-slate-300'}`}>{style.label}</p>
                          <p className="text-[10px] text-slate-500 font-medium leading-tight">{style.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
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
                disabled={isGenerating || !sourceImage}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2
                  ${isGenerating || !sourceImage
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-[#60a5fa] text-black hover:bg-[#60a5fa]/90 shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:shadow-[0_0_30px_rgba(96,165,250,0.5)] active:scale-[0.98]'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Applying Style...
                  </>
                ) : (
                  <>
                    <Zap size={16} className={!sourceImage ? "fill-slate-500" : "fill-black"} />
                    Run Workflow
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="flex-1 bg-[#020202] relative overflow-hidden flex flex-col">
            <div className="flex-1 relative">
              {generatedImage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 group">
                  <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                    <img src={generatedImage} className="w-full h-full object-contain bg-black/40" alt="Generated Professional Style" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Download Button */}
                    <button
                      onClick={handleDownload}
                      className="absolute bottom-6 right-6 z-30 flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#60a5fa] text-black rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
                    >
                      <Download size={18} />
                      Download Final Shot
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white/[0.01]">
                  <div className="w-full h-full relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-black/40">
                    <img src={workflowData.sampleAfter || undefined} className="w-full h-full object-cover" alt="Style Sample" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white font-medium text-sm flex items-center gap-2">
                        <Sparkles size={16} className="text-[#60a5fa]" /> Try it with your own photo
                      </div>
                    </div>
                  </div>

                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-40 transition-all duration-500 rounded-3xl m-8">
                      <div className="relative w-24 h-24 mb-6">
                        <div className="absolute inset-0 border-4 border-[#60a5fa]/10 rounded-full" />
                        <div className="absolute inset-0 border-4 border-[#60a5fa] rounded-full border-t-transparent animate-spin" />
                        <Camera size={32} className="absolute inset-0 m-auto text-[#60a5fa] animate-pulse" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-xl mb-2 tracking-tight">Applying Artist Palette</p>
                        <p className="text-white/40 text-sm font-medium italic">Replicating signature lens work and lighting...</p>
                      </div>
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
          onAdd={(urls: string[]) => urls.length > 0 && handleImageSelect(urls[0])}
          remainingSlots={1}
        />
      )}
    </div>
  );
}
