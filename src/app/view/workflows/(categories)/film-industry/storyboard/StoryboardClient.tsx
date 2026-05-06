'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Zap, Download, Trash2, Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import WorkflowUploadArea from '@/app/view/workflows/components/WorkflowUploadArea';

import { useCredits } from '@/hooks/useCredits';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { WORKFLOWS_DATA } from '@/app/view/workflows/components/data';

export default function Storyboard() {
  const router = useRouter();
  const {
    creditBalance,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction
  } = useCredits();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [characterImages, setCharacterImages] = useState<{ url: string; name: string }[]>([]);
  const [storyScript, setStoryScript] = useState("");
  const [storyboardTitle, setStoryboardTitle] = useState("");
  const [textVisibility, setTextVisibility] = useState("With Text");
  const [visualStyle, setVisualStyle] = useState("AI Cinematic View");
  const [screenOrientation, setScreenOrientation] = useState("Vertical (9:16)");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const STYLE_OPTIONS = [
    "AI Cinematic View",
    "Ultra-Realistic",
    "Sketch",
    "Pencil",
    "Minimal Line Art",
    "Anime / Stylized",
    "3D Render"
  ];

  const ORIENTATION_OPTIONS = [
    "Vertical (9:16)",
    "Horizontal (16:9)"
  ];

  const TEXT_VISIBILITY_OPTIONS = [
    "With Text",
    "Without Text"
  ];

  // Workflow Data (Hardcoded for this specific page, matching data.js)
  const workflowData = WORKFLOWS_DATA.find((w: any) => w.id === "storyboard") || {
    id: "storyboard",
    title: "Storyboard",
    category: "Film Industry",
    description: "Generate a storyboard for your film or video project. Use the example to see a student life journey.",
    model: "Seadream4/ Nano Banana/ Qwen",
    cost: 90,
    sampleBefore: "/workflow-samples/storyboard-student-journey.jpg",
    sampleAfter: "/workflow-samples/storyboard-student-journey.jpg"
  };

  const CREDIT_COST = 90;

  useEffect(() => {
    // Open modal animation on mount
    setTimeout(() => setIsOpen(true), 50);
  }, []);

  const onClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      router.push('/view/workflows/film-industry');
    }, 300);
  };

  const openUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleAddImages = (urls: string[]) => {
    const newImages = urls.map(url => ({ url, name: "" }));
    setCharacterImages(prev => [...prev, ...newImages]);
    // Reset generated images when new image is selected
    setGeneratedImages([]);
    setIsUploadModalOpen(false);
  };

  const handleNameChange = (index: number, name: string) => {
    setCharacterImages(prev => {
      const newImages = [...prev];
      newImages[index].name = name;
      return newImages;
    });
  };

  const removeCharacter = (index: number) => {
    setCharacterImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRun = async () => {
    if (characterImages.length === 0) {
      toast.error('Please upload at least one character image');
      return;
    }

    if (!storyScript.trim()) {
      toast.error('Please enter a story script');
      return;
    }

    if (creditBalance < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      return;
    }

    try {
      deductCreditsOptimisticForGeneration(CREDIT_COST);
      setIsGenerating(true);

      // Real API call
      const response = await axiosInstance.post('/api/workflows/film-industry/storyboard', {
        image: characterImages[0].url, // Backward compatibility
        characterImages: characterImages,
        storyScript: storyScript,
        storyboardTitle: storyboardTitle,
        textVisibility: textVisibility,
        visualStyle: visualStyle,
        screenOrientation: screenOrientation,
        isPublic: true
      });

      if (response.data?.data?.images && response.data.data.images.length > 0) {
        const urls = response.data.data.images.map((img: any) => img.url);
        setGeneratedImages(urls);
        setSelectedImageIndex(0);
        toast.success('Storyboard generation complete!');
      } else {
        throw new Error('No images returned from server');
      }

    } catch (error: any) {
      console.error('Storyboard error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(error.response?.data?.message || error.message || 'Failed to generate storyboard');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (generatedImages.length === 0) return;
    try {
      // Download current selected image
      await downloadFileWithNaming(generatedImages[selectedImageIndex], null, 'image', `storyboard-${selectedImageIndex + 1}`);
      toast.success('Downloading...');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  return (
    <>
      <style {...{ jsx: "true", global: "true" } as any}>{`
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
                <p className="text-slate-400 text-sm md:text-lg mb-8 leading-relaxed">{workflowData.description}</p>

                <div className="text-xs text-slate-500 mb-6">Model: {workflowData.model}</div>

                <div className="mb-8">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Characters</label>

                  {characterImages.length === 0 ? (
                    // Empty State - Big Upload Box
                    <WorkflowUploadArea
                      placeholderLabel="Upload Characters"
                      placeholderSublabel="JPG, PNG, WebP up to 25MB"
                      currentImage={null}
                      changeLabel="Change"
                      onImageSelect={(url) => handleAddImages([url])}
                      openModal={openUploadModal}
                      className="h-48"
                      icon={<Camera size={24} />}
                    />
                  ) : (
                    // List of Uploaded Characters
                    <div className="grid grid-cols-2 gap-3">
                      {characterImages.map((char, idx) => (
                        <div key={idx} className="relative group border border-white/10 rounded-xl overflow-hidden bg-white/5">
                          <div className="aspect-square relative">
                            <img src={char.url} className="w-full h-full object-cover" alt={`Character ${idx + 1}`} />
                            <button
                              onClick={(e) => { e.stopPropagation(); removeCharacter(idx); }}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="p-2 border-t border-white/5">
                            <input
                              type="text"
                              value={char.name}
                              onChange={(e) => handleNameChange(idx, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Character Name"
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#60a5fa]/50 transition-colors"
                            />
                          </div>
                        </div>
                      ))}
                      {/* Add Button */}
                      <div
                        onClick={openUploadModal}
                        className="aspect-square rounded-xl border border-dashed border-white/15 bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                      >
                        <Plus size={24} />
                        <span className="text-xs font-medium">Add</span>
                      </div>
                    </div>
                  )}
                </div>



                <div className="mb-6">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">STORY SCRIPT</label>
                  <textarea
                    value={storyScript}
                    onChange={(e) => setStoryScript(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all resize-none h-32"
                    placeholder="Once upon a time..."
                  ></textarea>
                </div>

                <div className="mb-6">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Text Visibility</label>
                  <div className="flex bg-black/20 border border-white/10 rounded-xl p-1 w-max">
                    {TEXT_VISIBILITY_OPTIONS.map((option) => (
                      <button
                        key={option}
                        onClick={() => setTextVisibility(option)}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${textVisibility === option
                          ? 'bg-[#60a5fa] text-black shadow-lg'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">STORYBOARD TITLE</label>
                  <input
                    type="text"
                    value={storyboardTitle}
                    onChange={(e) => setStoryboardTitle(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all"
                    placeholder="Enter a title for your storyboard"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">VISUAL FRAME STYLE</label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style}
                        onClick={() => setVisualStyle(style)}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border ${visualStyle === style
                          ? 'bg-[#60a5fa] text-black border-[#60a5fa]'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Screen Orientation</label>
                  <div className="flex flex-wrap gap-2">
                    {ORIENTATION_OPTIONS.map((orientation) => (
                      <button
                        key={orientation}
                        onClick={() => setScreenOrientation(orientation)}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border ${screenOrientation === orientation
                          ? 'bg-[#60a5fa] text-black border-[#60a5fa]'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        {orientation}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-slate-500">Cost estimated:</span>
                  <div className="flex items-center gap-1.5 text-white font-medium text-sm">
                    <Zap size={14} className="text-[#60a5fa] fill-[#60a5fa]" />
                    {CREDIT_COST} Credits
                  </div>
                </div>
                <button
                  onClick={handleRun}
                  disabled={isGenerating || characterImages.length === 0 || !storyScript.trim()}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2
                    ${isGenerating || characterImages.length === 0 || !storyScript.trim()
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
                      <Zap size={16} className={characterImages.length === 0 ? "fill-slate-500" : "fill-black"} />
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

              {characterImages.length > 0 && generatedImages.length > 0 ? (
                <div className="relative w-full h-full flex flex-col">
                  <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                    <img
                      src={generatedImages[selectedImageIndex]}
                      className="w-full h-full object-contain"
                      alt={`Generated Storyboard ${selectedImageIndex + 1}`}
                    />

                    {/* Pagination Dots if multiple images */}
                    {generatedImages.length > 1 && (
                      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
                        {generatedImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${selectedImageIndex === idx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'
                              }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleDownload}
                    className="absolute bottom-10 right-10 z-30 flex items-center gap-2 px-5 py-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 rounded-full text-white text-sm font-medium transition-all active:scale-95 group"
                  >
                    <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                    Download
                  </button>
                </div>
              ) : characterImages.length > 0 ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <div className="grid grid-cols-2 gap-4 max-w-lg">
                    {characterImages.slice(0, 4).map((img, i) => (
                      <img key={i} src={img.url} className="rounded-lg shadow-xl border border-white/10 object-cover aspect-square" alt="Preview Input" />
                    ))}
                    {characterImages.length > 4 && (
                      <div className="flex items-center justify-center bg-white/5 rounded-lg border border-white/10 text-slate-400">
                        +{characterImages.length - 4} more
                      </div>
                    )}
                  </div>

                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all duration-500">
                      <img src="/styles/Logo.gif" alt="Loading" className="w-24 h-24 mb-4" />
                      <p className="text-white font-medium text-lg animate-pulse">Processing storyboard...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={workflowData.sampleAfter}
                    className="w-full h-full object-contain rounded-lg shadow-2xl"
                    alt="Example Storyboard"
                  />    </div>
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
              handleAddImages(urls);
            }
          }}
          remainingSlots={10}
        />
      )}
    </>
  );
}

