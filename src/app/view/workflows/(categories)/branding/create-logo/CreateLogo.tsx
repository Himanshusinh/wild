'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Zap, Download, Plus, Cpu, ShoppingBag, TrendingUp, Heart, Home } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import ImageComparisonSlider from '@/app/view/workflows/components/ImageComparisonSlider';
import { useCredits } from '@/hooks/useCredits';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { WORKFLOWS_DATA } from '@/app/view/workflows/components/data';


const EXAMPLE_LOGOS = [
  {
    name: "TechSense",
    tagline: "TECHNOLOGY & AI",
    icon: <Cpu className="w-8 h-8 text-sky-400" />,
    color: "from-blue-600 to-purple-600",
    iconBg: "bg-sky-500/10"
  },
  {
    name: "Belle Vogue",
    tagline: "FASHION & BEAUTY",
    icon: <ShoppingBag className="w-8 h-8 text-rose-400" />,
    color: "from-rose-600 to-pink-600",
    iconBg: "bg-rose-500/10"
  },
  {
    name: "InvestEase",
    tagline: "FINANCIAL ADVISORY",
    icon: <TrendingUp className="w-8 h-8 text-indigo-400" />,
    color: "from-indigo-600 to-blue-600",
    iconBg: "bg-indigo-500/10"
  },
  {
    name: "HealthHub",
    tagline: "HEALTHCARE",
    icon: <Heart className="w-8 h-8 text-red-400" />,
    color: "from-red-600 to-rose-600",
    iconBg: "bg-red-500/10"
  },
  {
    name: "Horizon",
    tagline: "REAL ESTATE",
    icon: <Home className="w-8 h-8 text-orange-400" />,
    color: "from-orange-600 to-amber-600",
    iconBg: "bg-orange-500/10"
  },
  {
    name: "Lumina",
    tagline: "CREATIVE STUDIO",
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    color: "from-yellow-600 to-orange-600",
    iconBg: "bg-yellow-500/10"
  }
];

const LogoPreviewItem = ({ logo }: { logo: typeof EXAMPLE_LOGOS[0] }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
    <div className={`w-20 h-20 ${logo.iconBg} rounded-[2rem] flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-500 shadow-inner`}>
      {logo.icon}
    </div>
    <div className="text-center">
      <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1.5">{logo.name}</h3>
      <p className="text-[10px] font-black tracking-[0.25em] text-slate-400 uppercase">{logo.tagline}</p>
    </div>
  </div>
);

export default function CreateLogo() {
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

  // New Fields State
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('Icon');
  const [selectedFileType, setSelectedFileType] = useState<string>('PNG');

  const LOGO_STYLES = [
    'Minimal', 'Modern', 'Professional', 'Luxury',
    'Creative', 'Bold', 'Futuristic', 'Playful'
  ];

  const BRAND_PERSONALITIES = [
    'Trustworthy', 'Innovative', 'Elegant',
    'Friendly', 'Powerful', 'Premium'
  ];

  const PRESET_COLORS = [
    '#38BDF8', '#F87171', '#FBBF24', '#4ADE80', '#10B981', '#3182CE', '#D53F8C'
  ];

  const LOGO_FORMATS = [
    'Icon', 'Horizontal', 'Vertical'
  ];

  const FILE_TYPES = [
    'PNG', 'SVG', 'JPG'
  ];

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const togglePersonality = (trait: string) => {
    setSelectedPersonalities(prev =>
      prev.includes(trait)
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  // Workflow Data
  const workflowData = WORKFLOWS_DATA.find(w => w.id === "create-logo") || {
    id: "create-logo",
    title: "Create Logo",
    category: "Branding",
    description: "Professional AI logo design from your sketches or descriptions.",
    model: "Logo Creator AI",
    cost: 60,
    sampleBefore: "/workflow-samples/create-logo-before.png",
    sampleAfter: "/workflow-samples/create-logo-grid.png"
  };

  const CREDIT_COST = 60;

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

      // Mocking API call for frontend UI focus
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockResult = "/workflow-samples/create-logo-grid.png";
      setGeneratedImage(mockResult);
      toast.success('Logo created successfully!');

      /* 
      const response = await axiosInstance.post('/api/workflows/branding/create-logo', {
        image: originalImage,
        companyName,
        industry,
        styles: selectedStyles,
        personalities: selectedPersonalities,
        color: selectedColor,
        format: selectedFormat,
        fileType: selectedFileType,
        isPublic: true
      });

      if (response.data?.responseStatus === 'success' && response.data?.data?.images?.[0]?.url) {
        setGeneratedImage(response.data.data.images[0].url);
        toast.success('Logo created successfully!');
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }
      */

    } catch (error: any) {
      console.error('Create Logo error:', error);
      rollbackOptimisticDeduction(CREDIT_COST);
      toast.error(error.response?.data?.message || error.message || 'Failed to create logo');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      await downloadFileWithNaming(generatedImage, null, 'image', 'logo');
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
                  <div className="border border-dashed border-white/15 rounded-xl bg-black/20 h-40 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors relative overflow-hidden group"
                    onClick={() => setIsUploadModalOpen(true)}>
                    {originalImage ? (
                      <>
                        <img src={originalImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Original" />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur">Change Image</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-slate-400"><Camera size={20} /></div>
                        <div className="text-center">
                          <span className="text-sm text-slate-300 block font-medium">Upload Reference Image</span>
                          <span className="text-xs text-slate-500">JPG, PNG, WebP up to 25MB</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Company Name</label>
                    <input
                      type="text"
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all"
                      placeholder="Enter company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Industry</label>
                    <input
                      type="text"
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all"
                      placeholder="E.g. Technology, Fashion, Food..."
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-3 block">Logo Style (Select Multiple)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {LOGO_STYLES.map((style) => (
                        <button
                          key={style}
                          onClick={() => toggleStyle(style)}
                          className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${selectedStyles.includes(style)
                            ? 'bg-[#60a5fa] border-[#60a5fa] text-black'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-3 block">Brand Personality (Select Multiple)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {BRAND_PERSONALITIES.map((trait) => (
                        <button
                          key={trait}
                          onClick={() => togglePersonality(trait)}
                          className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${selectedPersonalities.includes(trait)
                            ? 'bg-[#60a5fa] border-[#60a5fa] text-black'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                        >
                          {trait}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-3 block">Color Preference</label>
                    <div className="flex flex-wrap items-center gap-3">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${selectedColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                      <div className="flex items-center gap-2 ml-2">
                        <div className="relative w-8 h-8 rounded-lg border border-white/10 overflow-hidden flex items-center justify-center bg-white/5 group hover:border-[#60a5fa]/50 transition-colors">
                          <input
                            type="color"
                            className="absolute inset-0 w-[150%] h-[150%] cursor-pointer opacity-0"
                            onChange={(e) => setSelectedColor(e.target.value)}
                            value={selectedColor || '#ffffff'}
                          />
                          <Plus size={14} className="text-slate-400 group-hover:text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-3 block">Logo Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {LOGO_FORMATS.map((format) => (
                        <button
                          key={format}
                          onClick={() => setSelectedFormat(format)}
                          className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${selectedFormat === format
                            ? 'bg-[#60a5fa] border-[#60a5fa] text-black'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-3 block">File Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {FILE_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectedFileType(type)}
                          className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${selectedFileType === type
                            ? 'bg-[#60a5fa] border-[#60a5fa] text-black'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                        >
                          {type}
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
                      Creating Logo...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className={!originalImage ? "fill-slate-500" : "fill-black"} />
                      Generate Logo
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center bg-[#050505] relative overflow-hidden">
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
              </div>

              {originalImage && generatedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-12 bg-white/5">
                  <div className="w-full h-full bg-[#f8f9fa] rounded-2xl shadow-inner border border-white/5 flex items-center justify-center p-8 overflow-hidden">
                    <img
                      src={generatedImage}
                      className="max-w-full max-h-full object-contain"
                      alt="Generated Logo"
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
              ) : originalImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-12 bg-white/5">
                  <div className="w-full h-full bg-[#f8f9fa] rounded-2xl shadow-inner border border-white/5 flex items-center justify-center p-8 overflow-hidden">
                    <img src={originalImage} className="max-w-full max-h-full object-contain" alt="Preview" />
                  </div>
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-40 transition-all duration-500 rounded-3xl">
                      <div className="relative w-20 h-20 mb-4">
                        <div className="absolute inset-0 border-4 border-[#60a5fa]/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-[#60a5fa] rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <p className="text-white font-medium text-lg animate-pulse">Designing your logo...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-12 bg-white/5">
                  <div className="w-full h-full bg-[#fdfdfd] rounded-2xl shadow-inner border border-white/5 flex items-center justify-center p-12 overflow-hidden overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4 w-full">
                      {EXAMPLE_LOGOS.map((logo, idx) => (
                        <LogoPreviewItem key={idx} logo={logo} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10 text-white font-medium text-sm">
                      Try it with your sketch
                    </div>
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
