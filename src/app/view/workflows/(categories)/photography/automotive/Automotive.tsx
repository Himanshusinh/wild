'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Zap, Download, Car, Sparkles, Map, Sun, Wind } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import { useCredits } from '@/hooks/useCredits';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { WORKFLOWS_DATA } from '@/app/view/workflows/components/data';

const BACKGROUND_STYLES = [
  { id: 'urban', label: 'Modern City', icon: <Map size={14} /> },
  { id: 'mountain', label: 'Mountain Pass', icon: <Map size={14} /> },
  { id: 'coast', label: 'Coastal Road', icon: <Map size={14} /> },
  { id: 'studio', label: 'Pro Studio', icon: <Camera size={14} /> },
  { id: 'forest', label: 'Pine Forest', icon: <Map size={14} /> },
  { id: 'desert', label: 'Open Desert', icon: <Map size={14} /> }
];

const LIGHTING_EFFECTS = [
  { id: 'golden-hour', label: 'Golden Hour', icon: <Sun size={14} /> },
  { id: 'sunset', label: 'Deep Sunset', icon: <Sun size={14} /> },
  { id: 'noon', label: 'Harsh Daylight', icon: <Sun size={14} /> },
  { id: 'moonlight', label: 'Moonlight', icon: <Sun size={14} /> },
  { id: 'cinematic', label: 'Cinematic Blue', icon: <Sparkles size={14} /> },
  { id: 'neon', label: 'Neon Night', icon: <Sparkles size={14} /> }
];

export default function Automotive() {
  const router = useRouter();
  const {
    creditBalance,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction
  } = useCredits();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [carImage, setCarImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState('urban');
  const [selectedLighting, setSelectedLighting] = useState('golden-hour');
  const [motionBlur, setMotionBlur] = useState('Medium');

  // Workflow Data
  const workflowData = (WORKFLOWS_DATA.find(w => w.id === "automotive") || {
    id: "automotive",
    title: "Automotive Photography",
    category: "Photography",
    description: "Transform car photos with professional cinematic backgrounds, lighting, and motion effects.",
    model: "AutoRender AI",
    cost: 90,
    sampleBefore: "/workflow-samples/automotive-before.png",
    sampleAfter: "/workflow-samples/automotive-after.png"
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
    setCarImage(url);
    setGeneratedImage(null);
    setIsUploadModalOpen(false);
  };

  const handleRun = async () => {
    if (!carImage) {
      toast.error('Please upload your car photo first');
      return;
    }

    if (creditBalance < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      return;
    }

    try {
      deductCreditsOptimisticForGeneration(CREDIT_COST);
      setIsGenerating(true);

      const response = await axiosInstance.post('/api/workflows/photography/automotive', {
        carImage,
        background: selectedBackground,
        lighting: selectedLighting,
        motionBlur,
        isPublic: true
      });

      if (response.data?.responseStatus === 'success' && response.data?.data?.images?.[0]?.url) {
        setGeneratedImage(response.data.data.images[0].url);
        toast.success('Automotive shot generated successfully!');
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

    } catch (error: any) {
      console.error('Automotive Photography error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(error.response?.data?.message || 'Failed to generate automotive shot');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      downloadFileWithNaming(generatedImage, null, 'image', 'automotive');
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
                {/* 1. Car Photo */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">1. Car Snapshot</label>
                  <div className="border border-dashed border-white/15 rounded-xl bg-black/20 h-28 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors relative overflow-hidden group"
                    onClick={() => setIsUploadModalOpen(true)}>
                    {carImage ? (
                      <>
                        <img src={carImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Car" />
                        <div className="relative z-10">
                          <span className="text-xs text-white font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur text-center">Change Car</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-slate-400"><Camera size={20} /></div>
                        <div className="text-center">
                          <span className="text-sm text-slate-300 block font-medium">Upload Car</span>
                          <span className="text-[10px] text-slate-500">Subject to enhance</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Environment Style */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">2. Environment Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BACKGROUND_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedBackground(style.id)}
                        className={`py-3 rounded-xl text-[10px] font-bold transition-all border flex items-center justify-center gap-2 ${selectedBackground === style.id
                          ? 'bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Lighting Type */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">3. Lighting Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LIGHTING_EFFECTS.map((effect) => (
                      <button
                        key={effect.id}
                        onClick={() => setSelectedLighting(effect.id)}
                        className={`py-3 rounded-xl text-[10px] font-bold transition-all border flex items-center justify-center gap-2 ${selectedLighting === effect.id
                          ? 'bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                      >
                        {effect.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Motion Blur */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">4. Motion Effect</label>
                  <div className="flex gap-2">
                    {['None', 'Low', 'Medium', 'High'].map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => setMotionBlur(intensity)}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all border ${motionBlur === intensity
                          ? 'bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                      >
                        {intensity}
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
                disabled={isGenerating || !carImage}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2
                  ${isGenerating || !carImage
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-[#60a5fa] text-black hover:bg-[#60a5fa]/90 shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:shadow-[0_0_30px_rgba(96,165,250,0.5)] active:scale-[0.98]'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Generating Shot...
                  </>
                ) : (
                  <>
                    <Zap size={16} className={!carImage ? "fill-slate-500" : "fill-black"} />
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
                    <img src={generatedImage} className="w-full h-full object-contain bg-black/40" alt="Generated Automotive Shot" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <button onClick={handleDownload} className="absolute bottom-6 right-6 z-30 flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#60a5fa] text-black rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-xl">
                      <Download size={18} />
                      Download Shot
                    </button>
                  </div>
                </div>
              ) : carImage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                  <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/20">
                    <img src={carImage} className="w-full h-full object-contain" alt="Uploaded Car" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white/[0.01]">
                  <div className="w-full h-full relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-black/40">
                    <img src={workflowData.sampleAfter} className="w-full h-full object-cover" alt="Sample Display" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white font-medium text-sm flex items-center gap-2">
                        <Sparkles size={16} className="text-[#60a5fa]" /> Try it with your own car photo
                      </div>
                    </div>
                  </div>
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-40 transition-all duration-500 rounded-3xl m-8">
                      <img src="/styles/Logo.gif" className="w-24 h-24" alt="Loading" />
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
