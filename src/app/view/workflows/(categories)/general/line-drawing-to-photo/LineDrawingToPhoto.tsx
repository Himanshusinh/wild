'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, X, ChevronLeft, Calendar, User, Camera, Plus, Zap, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/lib/axiosInstance';
import UploadModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal';
import ImageComparisonSlider from '@/app/view/workflows/components/ImageComparisonSlider';
import { downloadFileWithNaming } from '@/utils/downloadUtils';
import { useCredits } from '@/hooks/useCredits';

export default function LineDrawingToPhoto() {
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

    // Workflow Data
    const workflowData = {
        id: "line-drawing-to-photo",
        title: "Line Drawing to Photo",
        category: "General",
        description: "Transform line art into a high-quality photorealistic image.",
        model: "Seadream4/ Nano Banana",
        cost: 80
    };

    const DETAILED_PROMPT = `Convert the attached black-and-white line art into a fully photorealistic image.
Preserve the exact subject, pose, proportions, composition, and perspective from the reference image.
Replace all sketch and outline lines with realistic textures, materials, and natural details while maintaining structural accuracy.
Render lifelike surface details (texture, depth, shading, highlights), realistic lighting, natural color tones, and believable shadows.
Add environmental realism with depth, atmosphere, and scale appropriate to the scene.
Use cinematic lighting, realistic depth of field, and professional photography quality.
Ultra-high resolution, sharp focus, realistic contrast, natural imperfections, and physically accurate rendering.
No illustration style — the final result should look like a real photograph.`;

    useEffect(() => {
        // Open modal animation on mount
        setTimeout(() => setIsOpen(true), 50);
    }, []);

    const onClose = () => {
        setIsOpen(false);
        setTimeout(() => {
            router.push('/view/workflows/general');
        }, 300);
    };

    const openUploadModal = () => {
        setIsUploadModalOpen(true);
    };

    const handleImageSelect = (url: string) => {
        setOriginalImage(url);
        // Reset generated image when new image is selected
        setGeneratedImage(null);
        setIsUploadModalOpen(false);
    };

    const handleRun = async () => {
        if (!originalImage) {
            toast.error('Please upload an image first');
            return;
        }

        const CREDIT_COST = 80;
        if (creditBalance < CREDIT_COST) {
            toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
            return;
        }

        try {
            deductCreditsOptimisticForGeneration(CREDIT_COST);
            setIsGenerating(true);

            // Payload structure
            const payload = {
                image: originalImage,
                prompt: DETAILED_PROMPT,
                model: "qwen/qwen-image-edit-2511",
                frameSize: "match_input_image",
                output_format: "jpg",
                style: "none",
                generationType: "text-to-image",
                isPublic: true,
                n: 1,
            };

            const response = await axiosInstance.post('/api/workflows/general/line-drawing-to-photo', payload);

            if (response.data?.responseStatus === 'success' && response.data?.data?.images?.[0]?.url) {
                setGeneratedImage(response.data.data.images[0].url);
                toast.success('Generated successfully!');
            } else {
                throw new Error(response.data?.message || 'Invalid response from server');
            }

        } catch (error: any) {
            console.error('Line Drawing to Photo error:', error);
            rollbackOptimisticDeduction(CREDIT_COST);
            toast.error(error.response?.data?.message || error.message || 'Failed to generate');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!generatedImage) return;
        try {
            await downloadFileWithNaming(generatedImage, null, 'image', 'photo');
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
                        {/* Left Panel - Controls */}
                        <div className="w-full md:w-[40%] p-8 lg:p-12 flex flex-col border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 mb-6">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
                                <p className="text-slate-400 text-lg mb-8">{workflowData.description}</p>

                                <div className="text-xs text-slate-500 mb-6">Model: {workflowData.model}</div>

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
                                                    <span className="text-sm text-slate-300 block font-medium">Upload Line Drawing</span>
                                                    <span className="text-xs text-slate-500">JPG, PNG, WebP up to 25MB</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">ADDITIONAL DETAILS (OPTIONAL)</label>
                                    <textarea
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#60a5fa]/50 focus:bg-black/30 transition-all resize-none h-32"
                                        placeholder="Add extra data or specific instructions here..."
                                    ></textarea>
                                </div>

                            </div>

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
                                            Running Workflow...
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
                        <div className="hidden md:flex flex-1 items-center justify-center bg-[#050505] relative overflow-hidden">
                            {/* Background pattern */}
                            <div className="absolute inset-0 opacity-20"
                                style={{ backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
                            </div>

                            {originalImage && generatedImage ? (
                                <div className="relative w-full h-full flex items-center justify-center p-8">
                                    <ImageComparisonSlider
                                        beforeImage={originalImage}
                                        afterImage={generatedImage}
                                        beforeLabel="Line Drawing"
                                        afterLabel="Photorealistic"
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
                                            <p className="text-white font-medium text-lg animate-pulse">Generating...</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="relative w-full h-full flex items-center justify-center p-8">
                                    <ImageComparisonSlider
                                        beforeImage="/line-to-photo-before.jpg"
                                        afterImage="/line-to-photo-after.jpg"
                                        beforeLabel="Before"
                                        afterLabel="Photorealistic"
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
