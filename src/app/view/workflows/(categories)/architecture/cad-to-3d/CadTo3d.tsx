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

export default function CadTo3d() {
  const router = useRouter();
  const {
    creditBalance,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction
  } = useCredits();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [projectType, setProjectType] = useState('Interior Rendering');
  const [spaces, setSpaces] = useState('');
  const [designTheme, setDesignTheme] = useState('Modern');
  const [materials, setMaterials] = useState('');
  const [lighting, setLighting] = useState('Daylight');
  const [cameraAngle, setCameraAngle] = useState('Wide-angle');
  const [furniture, setFurniture] = useState('Furnished');
  const [renderQuality, setRenderQuality] = useState('High-Resolution Render');

  const lightingOptions = [
    'Daylight',
    'Golden Hour',
    'Evening / Night',
    'Studio Lighting (Interior)',
    'Auto lighting'
  ];

  const interiorCameraAngles = [
    'Wide-angle',
    'Straight-on',
    'Corner View',
    'Eye-level',
    'Detail View',
    'Down-View'
  ];

  const exteriorCameraAngles = [
    'Hero Shot',
    'Elevation',
    'Street-Level',
    "Bird's Eye",
    'Corner View',
    'Vignette'
  ];

  const furnitureOptions = [
    'Furnished',
    'Semi-furnished',
    'Empty (architecture only)'
  ];

  const renderQualityOptions = [
    'Concept Preview',
    'High-Resolution Render',
    'Ultra-Realistic Presentation'
  ];

  const designThemes = [
    'Modern',
    'Minimal',
    'Contemporary',
    'Classic',
    'Industrial',
    'Scandinavian',
    'Luxury',
    'Traditional / Regional',
    'Auto (AI decides)'
  ];

  const projectTypes = [
    { id: 'Interior Rendering', label: 'Interior Rendering' },
    { id: 'Exterior Rendering', label: 'Exterior Rendering' },
    { id: 'Both (Interior + Exterior)', label: 'Both (Interior + Exterior)' }
  ];

  // Workflow Data
  const workflowData = WORKFLOWS_DATA.find(w => w.id === "cad-to-3d") || {
    id: "cad-to-3d",
    title: "Cad plans to 3d render (Int/Ext)",
    category: "Architecture",
    description: "Transform 2D CAD drawings and floor plans into photorealistic 3D interior or exterior renders.",
    model: "Seadream4/ Nano Banana/ Qwen",
    cost: 90,
    sampleBefore: "/workflow-samples/cad-to-3d-before.jpg",
    sampleAfter: "/workflow-samples/cad-to-3d-after.jpg"
  };

  const CREDIT_COST = 90;

  useEffect(() => {
    setTimeout(() => setIsOpen(true), 50);
  }, []);

  const onClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      router.push('/view/workflows/architecture');
    }, 300);
  };

  const handleImageSelect = (url: string) => {
    setOriginalImage(url);
    setGeneratedImage(null);
    setIsUploadModalOpen(false);
  };

  const handleRun = async () => {
    if (!originalImage) {
      toast.error('Please upload an image first');
      return;
    }

    if (creditBalance < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      return;
    }

    try {
      deductCreditsOptimisticForGeneration(CREDIT_COST);
      setIsGenerating(true);

      const response = await axiosInstance.post('/api/workflows/architecture/cad-to-3d', {
        image: originalImage,
        projectType,
        spaces,
        designTheme,
        materials,
        lighting,
        cameraAngle,
        furniture: (projectType === 'Interior Rendering' || projectType === 'Both (Interior + Exterior)') ? furniture : undefined,
        renderQuality,
        isPublic: true
      });

      if (response.data?.responseStatus === 'success' && response.data?.data?.images?.[0]?.url) {
        setGeneratedImage(response.data.data.images[0].url);
        toast.success('3D render generated successfully!');
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

    } catch (error: any) {
      console.error('CAD to 3D error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(error.response?.data?.message || error.message || 'Failed to generate 3D render');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadFileWithNaming(generatedImage, null, 'image', 'cad-to-3d');
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
            <div className="w-full md:w-[40%] h-[55%] md:h-full p-8 lg:p-12 flex flex-col border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
                <p className="text-slate-400 text-sm md:text-lg mb-8 leading-relaxed">{workflowData.description}</p>

                <div className="text-xs text-slate-500 mb-6">Model: {workflowData.model}</div>

                <div className="mb-8">
                  <div className="border border-dashed border-white/15 rounded-xl bg-black/20 h-48 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors relative overflow-hidden group"
                    onClick={() => setIsUploadModalOpen(true)}>
                    {originalImage ? (
                      <>
                        {originalImage.startsWith('data:application/pdf') || originalImage.toLowerCase().endsWith('.pdf') ? (
                          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-red-900/20 text-red-200">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <path d="M14 2v6h6" />
                              <text x="8" y="18" fontSize="6" fill="currentColor" fontWeight="bold">PDF</text>
                            </svg>
                            <span className="text-xs font-medium">PDF Document</span>
                          </div>
                        ) : (
                          <img src={originalImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Original" />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur">Change Plan</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center text-slate-400"><Camera size={24} /></div>
                        <div className="text-center">
                          <span className="text-sm text-slate-300 block font-medium">Upload CAD Plan</span>
                          <span className="text-xs text-slate-500">PDF, PNG, JPG up to 25MB</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>

              <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 block">Project Type</label>
                <div className="space-y-2">
                  {projectTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setProjectType(type.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between group
                          ${projectType === type.id
                          ? 'bg-[#60a5fa]/10 border-[#60a5fa] text-white shadow-[0_0_15px_rgba(96,165,250,0.2)]'
                          : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5 hover:border-white/20'
                        }`}
                    >
                      <span className="font-medium text-sm">{type.label}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                          ${projectType === type.id
                          ? 'border-[#60a5fa]'
                          : 'border-slate-600 group-hover:border-slate-500'
                        }`}>
                        {projectType === type.id && (
                          <div className="w-2 h-2 rounded-full bg-[#60a5fa]"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mb-8 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 block">Spaces</label>
                  <input
                    type="text"
                    value={spaces}
                    onChange={(e) => setSpaces(e.target.value)}
                    placeholder={
                      projectType === 'Interior Rendering' ? 'e.g. Living Room, Bedroom, Kitchen...' :
                        projectType === 'Exterior Rendering' ? 'e.g. Front Facade, Backyard, Garden...' :
                          'e.g. Living Room, Front Facade...'
                    }
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] focus:bg-[#60a5fa]/5 transition-all text-sm"
                  />
                  <p className="text-[10px] text-slate-500 mt-2 px-1">Describe the spaces you want to render.</p>
                </div>

                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 block">Design Theme</label>
                  <div className="grid grid-cols-2 gap-2">
                    {designThemes.map((theme) => (
                      <button
                        key={theme}
                        onClick={() => setDesignTheme(theme)}
                        className={`px-3 py-3 rounded-xl border text-xs font-medium transition-all duration-200 text-center
                          ${designTheme === theme
                            ? 'bg-[#60a5fa]/10 border-[#60a5fa] text-white shadow-[0_0_15px_rgba(96,165,250,0.2)]'
                            : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5 hover:border-white/20'
                          }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 block">Materials Preference <span className="text-slate-600 normal-case">(Optional)</span></label>
                  <input
                    type="text"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    placeholder={
                      projectType === 'Interior Rendering' ? 'e.g. Wood finish, Marble / Stone, Concrete...' :
                        projectType === 'Exterior Rendering' ? 'e.g. Brick, Concrete, Glass façade...' :
                          'e.g. Wood finish, Brick, Stone...'
                    }
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] focus:bg-[#60a5fa]/5 transition-all text-sm"
                  />
                  <p className="text-[10px] text-slate-500 mt-2 px-1">Specify preferred materials (e.g., Wood, Marble, Glass).</p>
                </div>

                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 block">Lighting</label>
                  <div className="grid grid-cols-2 gap-2">
                    {lightingOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => setLighting(option)}
                        className={`px-3 py-3 rounded-xl border text-xs font-medium transition-all duration-200 text-center
                          ${lighting === option
                            ? 'bg-[#60a5fa]/10 border-[#60a5fa] text-white shadow-[0_0_15px_rgba(96,165,250,0.2)]'
                            : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5 hover:border-white/20'
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 block">Camera & View Angle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(projectType === 'Both (Interior + Exterior)'
                      ? Array.from(new Set([...interiorCameraAngles, ...exteriorCameraAngles]))
                      : projectType === 'Exterior Rendering'
                        ? exteriorCameraAngles
                        : interiorCameraAngles
                    ).map((angle) => (
                      <button
                        key={angle}
                        onClick={() => setCameraAngle(angle)}
                        className={`px-3 py-3 rounded-xl border text-xs font-medium transition-all duration-200 text-center
                          ${cameraAngle === angle
                            ? 'bg-[#60a5fa]/10 border-[#60a5fa] text-white shadow-[0_0_15px_rgba(96,165,250,0.2)]'
                            : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5 hover:border-white/20'
                          }`}
                      >
                        {angle}
                      </button>
                    ))}
                  </div>
                </div>

                {(projectType === 'Interior Rendering' || projectType === 'Both (Interior + Exterior)') && (
                  <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-600">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 block">Furniture</label>
                    <div className="grid grid-cols-2 gap-2">
                      {furnitureOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => setFurniture(option)}
                          className={`px-3 py-3 rounded-xl border text-xs font-medium transition-all duration-200 text-center
                            ${furniture === option
                              ? 'bg-[#60a5fa]/10 border-[#60a5fa] text-white shadow-[0_0_15px_rgba(96,165,250,0.2)]'
                              : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5 hover:border-white/20'
                            }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 block">Render Quality</label>
                  <div className="grid grid-cols-1 gap-2">
                    {renderQualityOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => setRenderQuality(option)}
                        className={`px-3 py-3 rounded-xl border text-xs font-medium transition-all duration-200 text-center
                          ${renderQuality === option
                            ? 'bg-[#60a5fa]/10 border-[#60a5fa] text-white shadow-[0_0_15px_rgba(96,165,250,0.2)]'
                            : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5 hover:border-white/20'
                          }`}
                      >
                        {option}
                      </button>
                    ))}
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
                      Rendering...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className={!originalImage ? "fill-slate-500" : "fill-black"} />
                      Generate 3D Render
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="w-full md:flex-1 h-[45%] md:h-full items-center justify-center bg-[#050505] relative overflow-hidden flex border-t md:border-t-0 md:border-l border-white/10 shrink-0">
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
              </div>

              {originalImage && generatedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <ImageComparisonSlider
                    beforeImage={originalImage}
                    afterImage={generatedImage}
                    beforeLabel="Plan"
                    afterLabel="3D Render"
                    imageFit="object-contain"
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
                      <p className="text-white font-medium text-lg animate-pulse">Generating 3D render...</p>
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
                  />

                </div>
              )}
            </div>
          </div>
        </div>
      </div >


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
          accept="application/pdf, image/png, image/jpeg, image/jpg"
        />
      )
      }
    </>
  );
}
