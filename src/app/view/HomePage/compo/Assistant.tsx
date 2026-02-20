"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Plus, History, Send, Settings, Clock, Check, Bot } from "lucide-react";
import AssistantModelSelector from "./AssistantModelSelector";
import UploadModal from "../../Generation/ImageGeneration/TextToImage/compo/UploadModal";
import { useRouter } from "next/navigation";
import { saveAutoResumeIntent } from "@/lib/autoResume";

interface AssistantProps {
    isOpen: boolean;
    onClose: () => void;
    userName?: string;
}

export default function Assistant({ isOpen, onClose, userName = "Aryan" }: AssistantProps) {
    const router = useRouter();
    const [prompt, setPrompt] = useState("");
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [selectedModelId, setSelectedModelId] = useState("google/nano-banana-pro");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [prompt]);

    const handleActionClick = (type: 'anything' | 'visuals' | 'ask') => {
        if (type === 'visuals') {
            setPrompt("Create a beautiful landscape with sunset...");
        } else if (type === 'anything') {
            setPrompt("Generate a creative idea for a new product...");
        } else {
            setPrompt("Explain how AI image generation works...");
        }
        textareaRef.current?.focus();
    };

    const handleUploadImages = (urls: string[]) => {
        setUploadedImages(prev => [...prev, ...urls].slice(0, 4));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        // Determine intent based on prompt or selected model
        const intentType = selectedModelId.includes('video') ? 'video' : 'image';

        saveAutoResumeIntent(intentType, {
            prompt: prompt,
            selectedModel: selectedModelId,
            imageUrls: uploadedImages
        });

        router.push(intentType === 'video' ? '/text-to-video' : '/text-to-image');
        onClose();
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, scale: 0.95 }}
                        animate={{ height: "calc(100vh - 100px)", opacity: 1, scale: 1 }}
                        exit={{ height: 0, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-4 bottom-4 z-[60] w-[calc(100%-32px)] md:w-80 lg:w-[380px] bg-[#0b0f17] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col origin-bottom"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="text-sm font-semibold text-white uppercase tracking-wider">Assist</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                <button className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                                    <Clock className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
                            {/* Background Glows */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-blue-500/10 blur-[60px] -z-10" />
                            <div className="absolute top-20 right-0 w-32 h-32 bg-purple-500/10 blur-[60px] -z-10" />

                            <div className="space-y-6 mt-2">
                                <div>
                                    <h2 className="text-zinc-500 text-sm">Good afternoon, {userName}</h2>
                                    <p className="text-white text-lg font-medium">What do you want to create today?</p>
                                </div>

                                {/* Preset Cards */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleActionClick('anything')}
                                        className="w-full flex items-center gap-3 p-1 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all text-left shadow-lg overflow-hidden group active:scale-[0.98]"
                                    >
                                        <div className="flex-1 p-3">
                                            <p className="text-sm font-medium text-white">Create anything</p>
                                            <p className="text-xs text-zinc-500">Start from an idea</p>
                                        </div>
                                        <div className="h-16 w-24 relative opacity-80 group-hover:opacity-100 transition-opacity">
                                            <img src="https://imagine.animagic.art/imagine-one/chat/11.webp" alt="" className="w-full h-full object-cover rounded-r-xl" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleActionClick('visuals')}
                                        className="w-full flex items-center gap-3 p-1 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all text-left shadow-lg overflow-hidden group active:scale-[0.98]"
                                    >
                                        <div className="flex-1 p-3">
                                            <p className="text-sm font-medium text-white">Create image or video</p>
                                            <p className="text-xs text-zinc-500">Generate visuals from text</p>
                                        </div>
                                        <div className="h-16 w-24 relative opacity-80 group-hover:opacity-100 transition-opacity">
                                            <img src="https://imagine.animagic.art/imagine-one/chat/22.webp" alt="" className="w-full h-full object-cover rounded-r-xl" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleActionClick('ask')}
                                        className="w-full flex items-center gap-3 p-1 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all text-left shadow-lg overflow-hidden group active:scale-[0.98]"
                                    >
                                        <div className="flex-1 p-3">
                                            <p className="text-sm font-medium text-white">Ask anything</p>
                                            <p className="text-xs text-zinc-500">Get help or ideas</p>
                                        </div>
                                        <div className="h-16 w-24 relative opacity-80 group-hover:opacity-100 transition-opacity">
                                            <img src="https://imagine.animagic.art/imagine-one/chat/33.webp" alt="" className="w-full h-full object-cover rounded-r-xl" />
                                        </div>
                                    </button>
                                </div>

                                {/* Powered By */}
                                <div className="flex justify-center pt-4 opacity-40 hover:opacity-60 transition-opacity">
                                    <span className="text-[10px] text-zinc-500 flex items-center gap-1.5 grayscale">
                                        Powered by <Bot className="w-3 h-3" /> Chatly AI
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Input Footer */}
                        <div className="p-4 bg-white/[0.02] border-t border-white/10">
                            <form onSubmit={handleSubmit} className="relative group">
                                <div className="bg-[#151a24] border border-white/10 rounded-2xl p-2 shadow-inner focus-within:border-white/20 transition-colors">
                                    <textarea
                                        ref={textareaRef}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Ask anything, create anything"
                                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-zinc-500 text-sm py-1.5 px-2 resize-none max-h-32 scrollbar-none"
                                        rows={1}
                                    />

                                    <div className="flex items-center justify-between mt-2 px-1">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setIsUploadModalOpen(true)}
                                                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-90"
                                            >
                                                <Plus className="w-4.5 h-4.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowModelSelector(!showModelSelector)}
                                                className={`p-1.5 rounded-lg transition-all active:scale-90 ${showModelSelector ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                                            >
                                                <Settings className="w-4.5 h-4.5" />
                                            </button>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!prompt.trim()}
                                            className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-all active:scale-95 px-3 flex items-center gap-2 group/btn"
                                        >
                                            <span className="text-xs font-medium">Send</span>
                                            <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                {/* Model Selector Popover */}
                                <AnimatePresence>
                                    {showModelSelector && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute bottom-full left-0 right-0 mb-4 z-[70]"
                                        >
                                            <AssistantModelSelector
                                                selectedModelId={selectedModelId}
                                                onSelect={(id) => {
                                                    setSelectedModelId(id);
                                                    setShowModelSelector(false);
                                                }}
                                                onClose={() => setShowModelSelector(false)}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                            <p className="text-[10px] text-zinc-600 mt-3 text-center">
                                ImagineArt can make mistakes, Check important info.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upload Modal Overlay */}
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onAdd={handleUploadImages}
                remainingSlots={4 - uploadedImages.length}
            />
        </>
    );
}
