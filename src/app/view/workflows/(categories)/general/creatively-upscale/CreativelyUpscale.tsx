'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Zap, Plus, Image as ImageIcon, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import ImageComparisonSlider from '@/app/view/workflows/components/ImageComparisonSlider';
import { useCredits } from '@/hooks/useCredits';
import { downloadFileWithNaming } from '@/utils/downloadUtils';

export default function CreativelyUpscale() {
    const router = useRouter();

    const {
        creditBalance,
        deductCreditsOptimisticForGeneration,
        rollbackOptimisticDeduction,
        refreshCredits,
    } = useCredits();

    // State
    const [isOpen, setIsOpen] = useState(false);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [upscaleFactor, setUpscaleFactor] = useState(2);
    const [inputNaturalSize, setInputNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    // Workflow Data
    const workflowData = {
        id: "creatively-upscale",
        title: "Creatively Upscale",
        category: "General",
        description: "Creatively upscale the image using SeedVR to ensure all details are crisp and in high quality.",
        model: "SeedVR Image Upscale",
        costPerMp: 5,
    };

    useEffect(() => {
        const url = originalImage;
        if (!url) {
            setInputNaturalSize({ width: 0, height: 0 });
            return;
        }
        let cancelled = false;
        const img = document.createElement('img');
        img.onload = () => {
            if (cancelled) return;
            const w = Number(img.naturalWidth || img.width || 0);
            const h = Number(img.naturalHeight || img.height || 0);
            setInputNaturalSize({ width: w, height: h });
        };
        img.onerror = () => {
            if (cancelled) return;
            setInputNaturalSize({ width: 0, height: 0 });
        };
        img.src = url;
        return () => { cancelled = true; };
    }, [originalImage]);

    const estimate = useMemo(() => {
        const w = Number(inputNaturalSize?.width || 0);
        const h = Number(inputNaturalSize?.height || 0);
        if (!originalImage || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
        const factor = Math.max(1, Math.min(8, Math.round(Number(upscaleFactor) || 2)));
        const outW = Math.max(1, Math.round(w * factor));
        const outH = Math.max(1, Math.round(h * factor));
        const mp = (outW * outH) / 1_000_000;
        const credits = Math.max(1, Math.ceil(mp * 5));
        return { factor, outW, outH, credits };
    }, [inputNaturalSize?.width, inputNaturalSize?.height, originalImage, upscaleFactor]);

    useEffect(() => {
        setTimeout(() => setIsOpen(true), 50);
    }, []);

    const onClose = () => {
        setIsOpen(false);
        setTimeout(() => {
            router.push('/view/workflows/general');
        }, 300);
    };

    const handleImageSelect = (url: string) => {
        setOriginalImage(url);
        setGeneratedImage(null);
        setIsUploadModalOpen(false);
    };

    const handleRun = async () => {
        if (isGenerating) return;
        if (!originalImage) {
            toast.error('Please upload an image first');
            return;
        }

        const toZataPublicUrl = (urlOrPath: string): string => {
            const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
            const RESOURCE_SEG = '/api/proxy/resource/';
            const s = String(urlOrPath || '').trim();
            if (!s) return s;
            if (s.startsWith(ZATA_PREFIX)) return s;
            if (s.startsWith(RESOURCE_SEG)) {
                const decoded = decodeURIComponent(s.substring(RESOURCE_SEG.length));
                return `${ZATA_PREFIX}${decoded}`;
            }
            if (s.startsWith('http://') || s.startsWith('https://')) {
                try {
                    const u = new URL(s);
                    if (u.pathname.startsWith(RESOURCE_SEG)) {
                        const decoded = decodeURIComponent(u.pathname.substring(RESOURCE_SEG.length));
                        return `${ZATA_PREFIX}${decoded}`;
                    }
                } catch { }
            }
            return s;
        };

        let optimisticDebit = 0;
        try {
            const expectedCredits = estimate?.credits;
            if (!expectedCredits || expectedCredits <= 0) {
                toast.error('Unable to estimate credits. Please try another image.');
                return;
            }
            if ((creditBalance || 0) < expectedCredits) {
                toast.error(`Insufficient credits. Need ${expectedCredits}, have ${creditBalance || 0}`);
                return;
            }
            setIsGenerating(true);

            try {
                deductCreditsOptimisticForGeneration(expectedCredits);
                optimisticDebit = expectedCredits;
            } catch { /* ignore optimistic errors */ }

            const imageForApi = toZataPublicUrl(originalImage);

            const response = await axiosInstance.post('/api/workflows/general/creatively-upscale', {
                image: imageForApi,
                upscaleFactor: upscaleFactor
            });

            if (response.data?.responseStatus === 'success' && response.data?.data?.images?.[0]?.url) {
                setGeneratedImage(response.data.data.images[0].url);
                toast.success('Image upscaled successfully!');
                try { await refreshCredits(); } catch { }
            } else {
                throw new Error(response.data?.message || 'Invalid response from server');
            }

        } catch (error: any) {
            console.error('Upscale error:', error);
            if (optimisticDebit > 0) {
                try { rollbackOptimisticDeduction(optimisticDebit); } catch { }
            }
            toast.error(error.response?.data?.message || error.message || 'Failed to upscale image');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!generatedImage) return;
        try {
            await downloadFileWithNaming(generatedImage, null, 'image', 'upscaled');
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
                        <div className="w-full md:w-[40%] p-8 lg:p-12 flex flex-col border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 mb-6">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
                                <p className="text-slate-400 text-lg mb-8">{workflowData.description}</p>

                                <div className="text-xs text-slate-500 mb-6 font-mono">Model: {workflowData.model}</div>

                                <div className="mb-8">
                                    <div className="border border-dashed border-white/15 rounded-xl bg-black/20 h-48 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#60a5fa]/5 transition-colors relative overflow-hidden group"
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
                                                <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center text-slate-400"><Camera size={24} /></div>
                                                <div className="text-center">
                                                    <span className="text-sm text-slate-300 block font-medium">Upload Image</span>
                                                    <span className="text-xs text-slate-500">JPG, PNG, WebP up to 25MB</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Upscale Factor Slider */}
                                <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Upscale Factor</label>
                                        <span className="text-[#60a5fa] font-bold font-mono bg-[#60a5fa]/10 px-2 py-0.5 rounded text-sm">{upscaleFactor}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="8"
                                        step="1"
                                        value={upscaleFactor}
                                        onChange={(e) => setUpscaleFactor(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#60a5fa] px-3"
                                    />
                                    <div className="mt-2 grid grid-cols-8 text-[10px] text-slate-500 font-mono">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <span key={i} className="text-center">{i + 1}x</span>
                                        ))}
                                    </div>
                                    <div className="mt-3 text-[11px] text-slate-500 font-mono">
                                        Output: {estimate ? `${estimate.outW} × ${estimate.outH}` : '—'} • Est. cost: {estimate ? `${estimate.credits} credits` : '—'}
                                    </div>
                                    {/* <div className="mt-1 text-[11px] text-slate-600">
                                        Estimated cost uses 5 credits per output megapixel (rounded up). Final cost is recalculated and deducted server-side only after success.
                                    </div> */}
                                </div>

                                {/* <div className="mb-4">
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">ADDITIONAL DETAILS (OPTIONAL)</label>
                                    <textarea
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all resize-none h-24"
                                        placeholder="Add extra data or specific instructions here..."
                                    ></textarea>
                                </div> */}

                            </div>

                            <div className="mt-auto pt-6 border-t border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-medium text-slate-500">Cost estimated:</span>
                                    <div className="flex items-center gap-1.5 text-white font-medium text-sm">
                                        <Zap size={14} className="text-[#60a5fa] fill-[#60a5fa]" />
                                        {estimate ? `${estimate.credits} Credits` : '—'}
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
                                            Upscaling...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={16} className={!originalImage ? "fill-slate-500" : "fill-black"} />
                                            Run Workflow
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Right Panel - Preview */}
                        <div className="flex-1 items-center justify-center bg-[#050505] relative overflow-hidden flex">
                            <div className="absolute inset-0 opacity-20"
                                style={{ backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
                            </div>

                            {originalImage && generatedImage ? (
                                <div className="relative w-full h-full flex items-center justify-center p-8">
                                    <ImageComparisonSlider
                                        beforeImage={originalImage}
                                        afterImage={generatedImage}
                                        beforeLabel="Original"
                                        afterLabel="Upscaled"
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
                                            <p className="text-white font-medium text-lg animate-pulse">Upscaling image...</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="relative w-full h-full flex items-center justify-center p-8">
                                    <ImageComparisonSlider
                                        beforeImage="/workflow-samples/creatively-upscale-before.png"
                                        afterImage="/workflow-samples/creatively-upscale-after.png"
                                        beforeLabel="Before"
                                        afterLabel="After"
                                        imageFit="object-contain"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10 text-white font-medium text-sm">
                                            Try it with your own image
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
