'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Zap, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import WorkflowUploadArea from '@/app/view/workflows/components/WorkflowUploadArea';
import ImageComparisonSlider from '@/app/view/workflows/components/ImageComparisonSlider';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { useCredits } from '@/hooks/useCredits';
import { getSignInUrl } from '@/routes/routes';

export default function FashionStylist() {
  const router = useRouter();
  const {
    creditBalance,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction,
    user
  } = useCredits();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // Outfit
  const [userImage, setUserImage] = useState<string | null>(null); // Person
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeField, setActiveField] = useState<'outfit' | 'user'>('outfit');
  const [backgroundPrompt, setBackgroundPrompt] = useState("");

  // Workflow Data
  const workflowData = {
    id: "fashion-stylist",
    title: "Fashion Stylist",
    category: "Fashion",
    description: "Generate professional styling suggestions and combinations by virtually trying on outfits.",
    cost: 90
  };

  const CREDIT_COST = 90;

  useEffect(() => {
    // Open modal animation on mount
    setTimeout(() => setIsOpen(true), 50);
  }, []);

  const onClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      router.push('/view/workflows/fashion');
    }, 300);
  };

  const openUploadModal = (field: 'outfit' | 'user') => {
    setActiveField(field);
    setIsUploadModalOpen(true);
  };

  const handleImageSelect = (url: string) => {
    if (activeField === 'outfit') {
      setUploadedImage(url);
    } else {
      setUserImage(url);
    }
    setGeneratedImage(null);
    setIsUploadModalOpen(false);
  };

  const handleRun = async () => {
    if (!user) {
      router.push(getSignInUrl());
      return;
    }

    if (!uploadedImage) {
      toast.error('Please upload an outfit image');
      return;
    }
    if (!userImage) {
      toast.error('Please upload your photo');
      return;
    }
    if (!backgroundPrompt.trim()) {
      toast.error('Please describe the background context');
      return;
    }

    if (creditBalance < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      return;
    }

    try {
      deductCreditsOptimisticForGeneration(CREDIT_COST);
      setIsGenerating(true);

      const response = await axiosInstance.post('/api/workflows/fashion/fashion-stylist', {
        outfitImage: uploadedImage,
        userImage: userImage,
        backgroundDetails: backgroundPrompt.trim(),
        isPublic: true,
        size: '2K',
      });

      if (response.data?.responseStatus === 'success' && response.data?.data?.images?.[0]?.url) {
        setGeneratedImage(response.data.data.images[0].url);
        toast.success('Fashion styling generated!');
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

    } catch (error: any) {
      console.error('Generation error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(error.response?.data?.message || error.message || 'Failed to generate styling');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadFileWithNaming(generatedImage, null, 'image', 'stylist-result');
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
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">{workflowData.description}</p>

                {/* Outfit Upload */}
                <WorkflowUploadArea
                  label="STEP 1: UPLOAD OUTFIT"
                  placeholderLabel="Upload Outfit"
                  placeholderSublabel="Flat lay or model photo"
                  currentImage={uploadedImage}
                  changeLabel="Change Outfit"
                  onImageSelect={(url) => setUploadedImage(url)}
                  openModal={() => openUploadModal('outfit')}
                />

                {/* User Photo Upload */}
                <WorkflowUploadArea
                  label="STEP 2: UPLOAD USER PHOTO (HIM/HER)"
                  placeholderLabel="Upload Your Photo"
                  placeholderSublabel="Front-facing for best results"
                  currentImage={userImage}
                  changeLabel="Change Photo"
                  onImageSelect={(url) => setUserImage(url)}
                  openModal={() => openUploadModal('user')}
                  objectFit="cover"
                />

                {/* Background Details */}
                <div className="mb-8">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block tracking-wider">BACKGROUND DETAILS (REQUIRED)</label>
                  <textarea
                    value={backgroundPrompt}
                    onChange={(e) => setBackgroundPrompt(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all resize-none h-32"
                    placeholder="Describe the context (e.g. 'Luxury boutique backdrop', 'Urban street style setting')..."
                  ></textarea>
                </div>

              </div>

              {/* Action Section */}
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
                  disabled={isGenerating || !uploadedImage || !userImage || !backgroundPrompt.trim()}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2
                    ${isGenerating || !uploadedImage || !userImage || !backgroundPrompt.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-[#60a5fa] text-black hover:bg-[#60a5fa]/90 shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:shadow-[0_0_30px_rgba(96,165,250,0.5)]'
                    }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Generating Style...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className={(!uploadedImage || !userImage || !backgroundPrompt.trim()) ? "fill-slate-500" : "fill-black"} />
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

              {userImage && generatedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <ImageComparisonSlider
                    beforeImage={userImage}
                    afterImage={generatedImage}
                    beforeLabel="Person"
                    afterLabel="Styled Result"
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
              ) : (userImage && isGenerating) ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <img src={userImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Preview" />
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all duration-500">
                    <div className="relative w-20 h-20 mb-4">
                      <div className="absolute inset-0 border-4 border-[#60a5fa]/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-[#60a5fa] rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-white font-medium text-lg animate-pulse tracking-wide">Applying outfit...</p>
                  </div>
                </div>
              ) : userImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <img src={userImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Preview" />
                  <div className="absolute top-10 left-10 flex gap-4">
                    {uploadedImage && (
                       <div className="w-24 h-32 rounded-lg border border-white/10 overflow-hidden shadow-2xl bg-black/40 backdrop-blur">
                          <img src={uploadedImage} className="w-full h-full object-contain p-1" alt="Outfit thumbnail" />
                       </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <ImageComparisonSlider
                    beforeImage="https://idr01.zata.ai/devstoragev1/public/workflow-samples/fashion-stylist-before-v3.avif"
                    afterImage="https://idr01.zata.ai/devstoragev1/public/workflow-samples/fashion-stylist-after-v3.avif"
                    beforeLabel="Before"
                    afterLabel="Result"
                    imageFit="object-cover"
                    imagePosition="object-center"
                  />
                  {!uploadedImage && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <p className="text-white/20 text-xs font-bold uppercase tracking-[0.2em]">Ready for Styling</p>
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
