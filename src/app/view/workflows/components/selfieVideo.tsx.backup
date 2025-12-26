'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Plus,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Play,
  ImageIcon
} from 'lucide-react';

// --- TYPES ---
interface Workflow {
  id: string;
  title: string;
  category: string;
  description: string;
  model: string;
  thumbnail: string;
  sampleBefore: string;
  sampleAfter: string;
}

// --- MODAL COMPONENT ---
interface SelfieVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowData: Workflow | null;
}

export default function SelfieVideoModal({ isOpen, onClose, workflowData }: SelfieVideoModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // State Management: 0: Upload, 1: Images Grid, 2: Videos Grid, 3: Final Video
  const [step, setStep] = useState(0);
  const [frameSize, setFrameSize] = useState<"vertical" | "horizontal">("vertical");
  const [friendPhotos, setFriendPhotos] = useState<string[]>([]);

  // Result Data
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(false);
      setStep(0);
      setFriendPhotos([]);
      setGeneratedImages([]);
      setGeneratedVideos([]);
      setFinalVideoUrl(null);
    }
  }, [isOpen, workflowData]);

  if (!workflowData) return null;

  const isFullScreenStep = step > 0;

  // --- ACTIONS ---

  const handleMergeImages = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const count = friendPhotos.length > 0 ? friendPhotos.length : 6;
      const mocks = Array(count).fill(null).map((_, i) => `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&fit=crop&sig=${i}`);
      setGeneratedImages(mocks);
      setIsGenerating(false);
      setStep(1);
    }, 2000);
  };

  const handleImagesToVideos = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedVideos([...generatedImages]);
      setIsGenerating(false);
      setStep(2);
    }, 1500);
  };

  const handleVideosToFinal = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setFinalVideoUrl("https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200");
      setIsGenerating(false);
      setStep(3);
    }, 2000);
  };

  const handleAddFriendPhoto = () => {
    const newPhoto = `https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=200&fit=crop&sig=${Math.random()}`;
    setFriendPhotos([...friendPhotos, newPhoto]);
  };

  return (
    <>
      {/* Custom Styles for animations */}
      <style>{`
        .animate-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .video-placeholder { position: relative; overflow: hidden; }
        .video-placeholder::after {
          content: ''; position: absolute; top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer { 100% { left: 150%; } }
      `}</style>

      <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>

        <div className={`relative w-full max-w-6xl h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>

          {/* Close Button */}
          {(!isFullScreenStep || step === 3) && (
            <button onClick={onClose} className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          )}

          <div className="flex w-full h-full">

            {/* LEFT PANEL (Controls) */}
            <div className={`w-full md:w-[40%] p-8 lg:p-12 flex flex-col border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto ${isFullScreenStep ? 'hidden' : 'flex'}`}>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-white/10 px-2 py-1 rounded-full">Step 1/4</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
                <p className="text-slate-400 text-lg mb-8">Upload your photo and friend photos to start.</p>

                <div className="mb-4">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">1. Your Photo</label>
                  <div className="border border-dashed border-white/15 rounded-xl bg-black/20 h-24 flex items-center justify-center gap-3 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center text-slate-400"><Camera size={16} /></div>
                    <span className="text-sm text-slate-400">Upload your selfie</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">2. Friend Photos</label>
                  {friendPhotos.length === 0 ? (
                    <div onClick={handleAddFriendPhoto} className="border border-dashed border-white/15 rounded-xl bg-black/20 h-24 flex items-center justify-center gap-3 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-[#60a5fa]/20 transition-all"><Plus size={16} /></div>
                      <span className="text-sm text-slate-400 group-hover:text-white">Upload friend photos</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {friendPhotos.map((photo, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                          <img src={photo} className="w-full h-full object-cover" alt="friend" />
                        </div>
                      ))}
                      <button onClick={handleAddFriendPhoto} className="w-20 h-20 rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center hover:text-[#60a5fa] transition-all"><Plus size={20} /></button>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">3. Frame Size</label>
                  <div className="flex gap-3">
                    <button onClick={() => setFrameSize("vertical")} className={`flex-1 py-2 rounded-lg text-sm border ${frameSize === "vertical" ? "bg-[#60a5fa]/20 border-[#60a5fa] text-[#60a5fa]" : "border-white/10 text-slate-400"}`}>Vertical (9:16)</button>
                    <button onClick={() => setFrameSize("horizontal")} className={`flex-1 py-2 rounded-lg text-sm border ${frameSize === "horizontal" ? "bg-[#60a5fa]/20 border-[#60a5fa] text-[#60a5fa]" : "border-white/10 text-slate-400"}`}>Horizontal (16:9)</button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 mt-auto">
                <button onClick={handleMergeImages} disabled={isGenerating} className="w-full py-4 bg-[#60a5fa] hover:bg-[#4f8edb] text-black font-bold rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                  {isGenerating ? <><span className="animate-spin"><Sparkles size={18} /></span> Merging...</> : "Submit & Generate"}
                </button>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className={`relative bg-[#020202] ${isFullScreenStep ? 'w-full h-full p-0 flex flex-col' : 'w-full md:w-[60%] p-8 flex items-center justify-center'}`}>

              {/* Step 0: Placeholder */}
              {step === 0 && (
                <div className="text-center opacity-50">
                  <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10"><ImageIcon size={48} className="text-slate-600" /></div>
                  <p className="text-slate-500">Preview will appear here</p>
                </div>
              )}

              {/* === STEP 1: IMAGES GRID === */}
              {step === 1 && (
                <div className="w-full h-full flex flex-col animate-in relative">
                  <div className="flex justify-between items-center p-8 z-20 absolute top-0 w-full bg-gradient-to-b from-black/80 to-transparent">
                    <h2 className="text-white text-xl font-medium">Images</h2>
                    <button onClick={() => setStep(0)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                      <ArrowLeft size={24} className="text-white" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 pb-24 flex justify-center items-center">
                    <div className={`grid gap-6 w-full max-w-7xl content-center ${frameSize === 'horizontal' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
                      {generatedImages.map((src, i) => (
                        <div key={i} className={`relative group bg-[#111] rounded-lg overflow-hidden border border-white/10 ${frameSize === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]'}`}>
                          <img src={src} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="generated" />
                          <div className="absolute bottom-3 right-3 w-7 h-7 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-[#60a5fa] hover:text-black transition-all cursor-pointer">
                            <RefreshCw size={14} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 z-30">
                    <button onClick={handleImagesToVideos} className="py-3 px-8 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-md shadow-lg transition-all hover:scale-105">
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* === STEP 2: VIDEOS GRID === */}
              {step === 2 && (
                <div className="w-full h-full flex flex-col animate-in relative">
                  <div className="flex justify-between items-center p-8 z-20 absolute top-0 w-full bg-gradient-to-b from-black/80 to-transparent">
                    <h2 className="text-white text-xl font-medium">Videos</h2>
                    <button onClick={() => setStep(1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                      <ArrowLeft size={24} className="text-white" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 pb-24 flex justify-center items-center">
                    <div className={`grid gap-6 w-full max-w-7xl content-center ${frameSize === 'horizontal' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
                      {generatedVideos.map((src, i) => (
                        <div key={i} className={`relative group bg-[#111] rounded-lg overflow-hidden border border-white/10 video-placeholder ${frameSize === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]'}`}>
                          <img src={src} className="w-full h-full object-cover opacity-60" alt="video thumb" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center pl-1"><Play size={16} fill="white" /></div>
                          </div>
                          <div className="absolute bottom-3 right-3 w-7 h-7 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-[#60a5fa] hover:text-black transition-all cursor-pointer">
                            <RefreshCw size={14} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 z-30">
                    <button onClick={handleVideosToFinal} className="py-3 px-8 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-md shadow-lg transition-all hover:scale-105">
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* === STEP 3: FINAL VIDEO === */}
              {step === 3 && (
                <div className="w-full h-full flex flex-col items-center justify-center animate-in bg-black relative">
                  <div className="absolute top-8 left-8 text-white text-xl font-medium z-20">Final Video</div>
                  <div className="w-full max-w-4xl aspect-video bg-[#111] border border-white/10 rounded-xl overflow-hidden relative shadow-2xl">
                    <img src={finalVideoUrl || ""} className="w-full h-full object-cover opacity-80" alt="final video" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center pl-1 cursor-pointer hover:scale-110 transition-transform"><Play size={40} fill="white" /></div>
                    </div>
                    <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black to-transparent">
                      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-[#60a5fa]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-12 z-30">
                    <button className="py-3 px-8 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-md shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all hover:scale-105">
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}