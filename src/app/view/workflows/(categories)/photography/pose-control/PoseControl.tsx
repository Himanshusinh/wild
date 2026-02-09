'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Zap, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import ImageComparisonSlider from '@/app/view/workflows/components/ImageComparisonSlider';
import { useCredits } from '@/hooks/useCredits';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { WORKFLOWS_DATA } from '@/app/view/workflows/components/data';
import { getSignInUrl } from '@/routes/routes';

export default function PoseControl() {
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
  const [poseReferenceImage, setPoseReferenceImage] = useState<string | null>(null);
  const [activeUploadType, setActiveUploadType] = useState<'model' | 'pose'>('model');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [poseDescription, setPoseDescription] = useState('');

  // Workflow Data
  const workflowData = (WORKFLOWS_DATA.find(w => w.id === "pose-control") || {
    id: "pose-control",
    title: "Pose Control",
    category: "Photography",
    description: "Control the pose of your subjects using pose reference images for precise photography compositions.",
    model: "Seadream4/ Nano Banana/ Qwen",
    cost: 90,
    sampleBefore: "/workflow-samples/pose-control-before-v2.jpg",
    sampleAfter: "/workflow-samples/pose-control-after-v2.png",
    imageFit: "object-cover",
    imagePosition: "object-top"
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
    if (activeUploadType === 'model') {
      setOriginalImage(url);
    } else {
      setPoseReferenceImage(url);
    }
    setGeneratedImage(null);
    setIsUploadModalOpen(false);
  };

  const handleRun = async () => {
    if (!user) {
      router.push(getSignInUrl());
      return;
    }
    if (!originalImage || !poseReferenceImage) {
      toast.error('Please upload both Model and Pose Reference images');
      return;
    }

    if (creditBalance < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      return;
    }

    try {
      deductCreditsOptimisticForGeneration(CREDIT_COST);
      setIsGenerating(true);

      const response = await axiosInstance.post('/api/workflows/photography/pose-control', {
        image: originalImage,
        pose_image: poseReferenceImage,
        description: poseDescription,
        isPublic: true
      });

      if (response.data?.responseStatus === 'success' && response.data?.data?.images?.[0]?.url) {
        setGeneratedImage(response.data.data.images[0].url);
        toast.success('Pose control transformation complete!');
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

    } catch (error: any) {
      console.error('Pose Control error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(error.response?.data?.message || error.message || 'Failed to control pose');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadFileWithNaming(generatedImage, null, 'image', 'pose-control');
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
            <div className="w-full md:w-[48%] p-8 lg:p-12 flex flex-col border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
                <p className="text-slate-400 text-sm md:text-lg mb-8 leading-relaxed">{workflowData.description}</p>

                <div className="text-xs text-slate-500 mb-6">Model: {workflowData.model}</div>

                <div className="flex flex-col gap-6 mb-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Model Image</label>
                    <div className="border border-dashed border-white/15 rounded-xl bg-black/20 h-48 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors relative overflow-hidden group"
                      onClick={() => {
                        setActiveUploadType('model');
                        setIsUploadModalOpen(true);
                      }}>
                      {originalImage ? (
                        <>
                          <img src={originalImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Model" />
                          <div className="relative z-10">
                            <span className="text-xs text-white font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur text-center">Change Model Image</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-slate-400"><Camera size={20} /></div>
                          <div className="text-center">
                            <span className="text-sm text-slate-300 block font-medium">Upload Model Image</span>
                            <span className="text-[10px] text-slate-500">Subject to be posed</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Pose Reference</label>
                    <div className="border border-dashed border-white/15 rounded-xl bg-black/20 h-48 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors relative overflow-hidden group"
                      onClick={() => {
                        setActiveUploadType('pose');
                        setIsUploadModalOpen(true);
                      }}>
                      {poseReferenceImage ? (
                        <>
                          <img src={poseReferenceImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Pose" />
                          <div className="relative z-10">
                            <span className="text-xs text-white font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur text-center">Change Pose Reference</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-slate-400"><Camera size={20} /></div>
                          <div className="text-center">
                            <span className="text-sm text-slate-300 block font-medium">Upload Pose Reference</span>
                            <span className="text-[10px] text-slate-500">Target pose image</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">POSE DESCRIPTION (OPTIONAL)</label>
                  <textarea
                    value={poseDescription}
                    onChange={(e) => setPoseDescription(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all resize-none h-32"
                    placeholder="Describe the desired pose or character position..."
                  ></textarea>
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
                  disabled={isGenerating || !originalImage || !poseReferenceImage}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2
                    ${isGenerating || !originalImage || !poseReferenceImage
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-[#60a5fa] text-black hover:bg-[#60a5fa]/90 shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:shadow-[0_0_30px_rgba(96,165,250,0.5)]'
                    }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Processing Pose...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className={(!originalImage || !poseReferenceImage) ? "fill-slate-500" : "fill-black"} />
                      Run Workflow
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center bg-[#050505] relative overflow-hidden">
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
              </div>

              {originalImage && generatedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <ImageComparisonSlider
                    beforeImage={originalImage}
                    afterImage={generatedImage}
                    beforeLabel="Before"
                    afterLabel="After"
                    imageFit="object-contain"
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
              ) : originalImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <img src={originalImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Preview" />
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all duration-500">
                      <div className="relative w-20 h-20 mb-4">
                        <div className="absolute inset-0 border-4 border-[#60a5fa]/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-[#60a5fa] rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <p className="text-white font-medium text-lg animate-pulse">Controlling pose...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <ImageComparisonSlider
                    beforeImage={workflowData.sampleBefore}
                    afterImage={workflowData.sampleAfter}
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
