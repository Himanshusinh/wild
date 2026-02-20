"use client";

import React, { useState } from "react";
import { X, Check, Lock, Zap, Sparkles, Image as ImageIcon, Video, Play, Bot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MODEL_MAPPING } from "@/utils/modelMapping";

type ModelType = "All" | "Image" | "Video";

interface AssistantModelSelectorProps {
    onSelect: (modelId: string) => void;
    onClose: () => void;
    selectedModelId: string;
}

export default function AssistantModelSelector({
    onSelect,
    onClose,
    selectedModelId,
}: AssistantModelSelectorProps) {
    const [activeTab, setActiveTab] = useState<ModelType>("All");
    const [isAuto, setIsAuto] = useState(true);

    // Filter models based on the mapping and user requested ones
    // We'll prioritize the ones from the snippet but pull data from MODEL_MAPPING
    const displayModels = [
        { id: "google/nano-banana-pro", name: "Nano Banana Pro", type: "image", icon: <Bot className="w-5 h-5" />, badge: "G" },
        { id: "seedream-4.5", name: "Seedream v4.5", type: "image", icon: <ImageIcon className="w-5 h-5" />, badge: "S" },
        { id: "wan-2.5-t2v", name: "Wan 2.6", type: "video", icon: <Sparkles className="w-5 h-5" />, badge: "W" },
        { id: "seedance-1.5-pro-t2v", name: "Seedance 1.5 Pro", type: "video", icon: <Video className="w-5 h-5" />, badge: "S" },
        { id: "kling-2.6-pro", name: "Kling 2.6 Pro", type: "video", icon: <Play className="w-5 h-5" />, badge: "K" },
        { id: "veo3.1-t2v-8s", name: "Google Veo 3.1 Fast", type: "video", icon: <Zap className="w-5 h-5" />, badge: "G" },
    ];

    const filteredModels = displayModels.filter((m) => {
        if (activeTab === "All") return true;
        return m.type.toLowerCase() === activeTab.toLowerCase();
    });

    return (
        <div className="bg-[#0b0f17] flex size-full flex-col gap-4 overflow-y-auto p-4 rounded-xl border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between">
                <p className="text-lg text-white font-semibold">Select model</p>
                <button
                    onClick={onClose}
                    className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-white/10 text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center p-1 bg-white/5 rounded-xl border border-white/5">
                    {(["All", "Image", "Video"] as ModelType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${activeTab === tab
                                ? "bg-white/10 text-white"
                                : "text-zinc-500 hover:text-white"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAuto(!isAuto)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isAuto ? "bg-blue-600" : "bg-white/10"
                            }`}
                    >
                        <span
                            className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${isAuto ? "translate-x-5" : "translate-x-1"
                                }`}
                        />
                    </button>
                    <span className="text-xs font-medium text-zinc-400">Auto</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 overflow-y-auto custom-scrollbar pr-1">
                {filteredModels.map((model) => (
                    <div
                        key={model.id}
                        className="group relative flex flex-col items-center justify-center gap-1.5"
                    >
                        <button
                            onClick={() => onSelect(model.id)}
                            className={`relative flex h-20 w-full shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-all ${selectedModelId === model.id
                                ? "bg-white/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                                }`}
                        >
                            <div className={`${selectedModelId === model.id ? "text-blue-400" : "text-zinc-400 group-hover:text-white"}`}>
                                {model.icon}
                            </div>

                            <div className="absolute top-1 right-1 flex items-center justify-center size-4 bg-black/40 backdrop-blur-md rounded border border-white/10">
                                <span className="text-[9px] font-bold text-white/50">{model.badge}</span>
                            </div>

                            {/* Optional Lock Icon if Credits are needed/Model is restricted */}
                            {/* <div className="absolute top-1 right-1">
                <Lock className="w-2.5 h-2.5 text-white/30" />
              </div> */}
                        </button>
                        <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-medium text-center line-clamp-1 w-full">
                            {model.name}
                        </span>
                        {selectedModelId === model.id && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 shadow-lg ring-2 ring-[#0b0f17]">
                                <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
