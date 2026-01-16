'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Zap, Download, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import { useCredits } from '@/hooks/useCredits';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { WORKFLOWS_DATA } from '@/app/view/workflows/components/data';
import ImageComparisonSlider from '@/app/view/workflows/components/ImageComparisonSlider';

export default function BusinessCard() {
  const router = useRouter();
  const {
    creditBalance,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction
  } = useCredits();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [personDetails, setPersonDetails] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [cardType, setCardType] = useState<'Single Sided' | 'Double Sided'>('Single Sided');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [cardStyle, setCardStyle] = useState<string>('Modern');

  const CARD_STYLES = [
    'Professional', 'Modern', 'Minimalist', 'Corporate',
    'Premium', 'Luxury', 'Executive', 'Tech', 'Creative'
  ];

  const PRESET_COLORS = [
    '#38BDF8', // Light Blue
    '#F87171', // Coral
    '#FBBF24', // Yellow
    '#4ADE80', // Green
    '#10B981', // Teal
    '#3B82F6', // Blue
    '#EC4899'  // Pink
  ];

  const workflowData = WORKFLOWS_DATA.find(w => w.id === "business-card") || {
    id: "business-card",
    title: "Business Card",
    category: "Branding",
    description: "Generate professional business card mockups from your logos or descriptions.",
    model: "Logo Creator AI",
    cost: 90,
    sampleBefore: "/workflow-samples/business-card-before.png",
    sampleAfter: "/workflow-samples/business-card-after.png"
  };

  const CREDIT_COST = 90;

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
    setLogoImage(url);
    setGeneratedImage(null);
    setIsUploadModalOpen(false);
  };

  const handleRun = async () => {
    if (!logoImage) {
      toast.error('Please upload your logo first');
      return;
    }

    if (creditBalance < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      return;
    }

    try {
      deductCreditsOptimisticForGeneration(CREDIT_COST);
      setIsGenerating(true);

      // Simulation for frontend focus
      await new Promise(resolve => setTimeout(resolve, 3000));

      setGeneratedImage(workflowData.sampleAfter);
      toast.success('Business card mockup generated successfully!');

    } catch (error: any) {
      console.error('Business Card error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(error.response?.data?.message || error.message || 'Failed to generate business card');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadFileWithNaming(generatedImage, null, 'image', 'business-card-mockup');
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

          <div className="flex w-full h-full">
            <div className="w-full md:w-[42%] p-8 lg:p-12 flex flex-col border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto custom-scrollbar">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">{workflowData.description}</p>

                <div className="text-xs text-slate-500 mb-6">Model: {workflowData.model}</div>

                <div className="mb-8">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-4 block tracking-wider">Card Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Single Sided', 'Double Sided'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setCardType(type as any)}
                        className={`py-3 rounded-xl text-xs font-bold transition-all border ${cardType === type
                          ? 'bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.4)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">Upload Logo</label>
                  <div
                    onClick={() => {
                      setIsUploadModalOpen(true);
                    }}
                    className="border border-dashed border-white/15 rounded-xl bg-black/20 h-32 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors relative overflow-hidden group"
                  >
                    {logoImage ? (
                      <>
                        <img src={logoImage} className="absolute inset-0 w-full h-full object-contain opacity-50 group-hover:opacity-30 transition-opacity" alt="Logo" />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur">Change Logo</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center text-slate-400 group-hover:text-[#60a5fa] transition-colors"><Camera size={16} /></div>
                        <div className="text-center">
                          <span className="text-xs text-slate-300 block font-medium">Click to upload logo</span>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Required</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-4 block tracking-wider">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter your company name..."
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 transition-colors"
                  />
                </div>

                <div className="mb-6">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-4 block tracking-wider">Person Name-Designation</label>
                  <input
                    type="text"
                    value={personDetails}
                    onChange={(e) => setPersonDetails(e.target.value)}
                    placeholder="E.g. John Doe-Creative Director"
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 transition-colors"
                  />
                </div>

                <div className="mb-8">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-4 block tracking-wider">Contact Details (Number, Email, ...)</label>
                  <input
                    type="text"
                    value={contactDetails}
                    onChange={(e) => setContactDetails(e.target.value)}
                    placeholder="E.g. +1 123 456 7890, hello@wildmind.ai"
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 transition-colors"
                  />
                </div>

                <div className="mb-8">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-4 block tracking-wider">Card Style</label>
                  <div className="flex flex-wrap gap-2">
                    {CARD_STYLES.map((style) => (
                      <button
                        key={style}
                        onClick={() => setCardStyle(style)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${cardStyle === style
                          ? 'bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.4)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                          }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-4 block tracking-wider">Color Preference</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-9 h-9 rounded-xl transition-all border-2 ${selectedColor === color
                          ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                          : 'border-transparent hover:scale-105'
                          }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                      <span className="text-lg font-medium">+</span>
                    </button>
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
                  disabled={isGenerating || !logoImage}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2
                    ${isGenerating || !logoImage
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-[#60a5fa] text-black hover:bg-[#60a5fa]/90 shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:shadow-[0_0_30px_rgba(96,165,250,0.5)]'
                    }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Generating Business Card...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className={!logoImage ? "fill-slate-500" : "fill-black"} />
                      Generate Business Card
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center bg-[#050505] relative overflow-hidden">
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
              </div>

              {generatedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8 bg-white/5">
                  <div className="w-full h-full bg-white/5 rounded-2xl shadow-inner border border-white/10 overflow-hidden relative">
                    <img
                      src={generatedImage}
                      className="w-full h-full object-contain"
                      alt="Generated Business Card"
                    />
                  </div>
                  <button
                    onClick={handleDownload}
                    className="absolute bottom-10 right-10 z-30 flex items-center gap-2 px-5 py-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 rounded-full text-white text-sm font-medium transition-all active:scale-95 group"
                  >
                    <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                    Download
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-white/5 overflow-hidden">
                  <div className="w-full h-full bg-black/20 rounded-2xl shadow-inner border border-white/5 overflow-hidden relative">
                    <img
                      src={workflowData.sampleAfter}
                      className="w-full h-full object-contain"
                      alt="Business Card Example"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white font-medium text-sm flex items-center gap-2">
                      <Sparkles size={16} className="text-[#60a5fa]" /> Workflow Sample Output
                    </div>
                  </div>
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-40 transition-all duration-500 rounded-3xl">
                      <div className="relative w-20 h-20 mb-4">
                        <div className="absolute inset-0 border-4 border-[#60a5fa]/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-[#60a5fa] rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <p className="text-white font-medium text-lg animate-pulse">Designing your card...</p>
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
    </>
  );
}
