'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Zap } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import LightDirectionSphere from './LightDirectionSphere';

export default function Relight() {
  const router = useRouter();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lightDirection, setLightDirection] = useState({ x: 0.5, y: 0.5, z: 0.7 });

  // Workflow Data
  const workflowData = {
    id: "relight",
    title: "Relight",
    category: "Photography",
    description: "Professionally relight your photos.",
    cost: 90
  };

  useEffect(() => {
    // Open modal animation on mount
    setTimeout(() => setIsOpen(true), 50);
  }, []);

  const onClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      router.push('/view/workflows/photography');
    }, 300);
  };

  const openUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleImageSelect = (url: string) => {
    setOriginalImage(url);
    setIsUploadModalOpen(false);
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
                <p className="text-slate-400 text-lg mb-8">{workflowData.description}</p>

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

                <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
                  <LightDirectionSphere
                    value={lightDirection}
                    onChange={setLightDirection}
                    size={220}
                  />

                  <div className="grid grid-cols-3 gap-2 mt-6">
                    {[
                      { label: 'Top', value: { x: 0, y: 1, z: 0.2 } },
                      { label: 'Front', value: { x: 0, y: 0, z: 1 } },
                      { label: 'Bottom', value: { x: 0, y: -1, z: 0.2 } },
                      { label: 'Left', value: { x: -1, y: 0, z: 0 } },
                      { label: 'Back', value: { x: 0, y: 0, z: -1 } },
                      { label: 'Right', value: { x: 1, y: 0, z: 0 } },
                    ].map((pos) => (
                      <button
                        key={pos.label}
                        onClick={() => setLightDirection(pos.value)}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all hover:scale-105"
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                <button
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 bg-slate-800 text-slate-500 cursor-not-allowed`}
                  disabled
                >
                  <Zap size={16} className="fill-slate-500" />
                  Run Workflow
                </button>
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="w-full md:flex-1 h-[45%] md:h-full items-center justify-center bg-[#050505] relative overflow-hidden flex border-t md:border-t-0 md:border-l border-white/10 shrink-0">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
              </div>

              <div className="relative w-full h-full flex items-center justify-center p-8">
                {originalImage ? (
                  <img src={originalImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Preview" />
                ) : (
                  <div className="text-slate-600 text-sm">Preview will appear here</div>
                )}
              </div>
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
