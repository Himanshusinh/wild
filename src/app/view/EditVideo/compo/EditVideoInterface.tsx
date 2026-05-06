"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { ChevronUp } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { getIsPublic } from "@/lib/publicFlag";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import VideoUploadModal from "@/app/view/Generation/VideoGeneration/TextToVideo/compo/VideoUploadModal";
import { loadMoreHistory } from "@/store/slices/historySlice";
import { useHistoryLoader } from "@/hooks/useHistoryLoader";
import { downloadFileWithNaming } from "@/utils/downloadUtils";
import { getSignInUrl } from "@/routes/routes";
import {
  saveAutoResumeIntent,
  getAutoResumeIntent,
  clearAutoResumeIntent,
} from "@/lib/autoResume";
import { EditImageSidebar } from "../../EditImage/compo/EditImageSidebar";
import { EditImageCanvasArea } from "../../EditImage/compo/EditImageCanvasArea";

type EditFeature = "upscale" | "remove-bg";

const EditVideoInterface: React.FC = () => {
  const user = useAppSelector((state: any) => state.auth?.user);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedFeature, setSelectedFeature] =
    useState<EditFeature>("upscale");
  const [inputs, setInputs] = useState<Record<EditFeature, string | null>>({
    upscale: null,
    "remove-bg": null,
  });
  // Per-feature outputs and processing flags so operations don't block each other
  const [outputs, setOutputs] = useState<Record<EditFeature, string | null>>({
    upscale: null,
    "remove-bg": null,
  });
  const [processing, setProcessing] = useState<Record<EditFeature, boolean>>({
    upscale: false,
    "remove-bg": false,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showUpscaleAdvanced, setShowUpscaleAdvanced] = useState(false);
  const [showRemoveBgAdvanced, setShowRemoveBgAdvanced] = useState(false);
  // SeedVR upscale params (video)
  const [seedvrUpscaleMode, setSeedvrUpscaleMode] = useState<
    "factor" | "target"
  >("factor");
  const [seedvrUpscaleFactor, setSeedvrUpscaleFactor] = useState<number>(2);
  const [seedvrTargetResolution, setSeedvrTargetResolution] = useState<
    "720p" | "1080p" | "1440p" | "2160p"
  >("1080p");
  const [seedvrNoiseScale, setSeedvrNoiseScale] = useState<number>(0.1);
  const [seedvrOutputFormat, setSeedvrOutputFormat] = useState<
    "X264 (.mp4)" | "VP9 (.webm)" | "PRORES4444 (.mov)" | "GIF (.gif)"
  >("X264 (.mp4)");
  const [seedvrOutputQuality, setSeedvrOutputQuality] = useState<
    "low" | "medium" | "high" | "maximum"
  >("high");
  const [seedvrOutputWriteMode, setSeedvrOutputWriteMode] = useState<
    "fast" | "balanced" | "small"
  >("balanced");
  const [seedvrSyncMode, setSeedvrSyncMode] = useState<boolean>(false);
  const [seedvrSeed, setSeedvrSeed] = useState<string>("");

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [fitScale, setFitScale] = useState(1);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [inputNaturalSize, setInputNaturalSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  // Form states
  const [model, setModel] = useState<
    | "fal-ai/birefnet/v2/video"
    | "fal-ai/seedvr/upscale/video"
    | "851-labs/background-remover"
    | "lucataco/remove-bg"
  >("fal-ai/birefnet/v2/video");
  const [output, setOutput] = useState<"" | "png" | "jpg" | "jpeg" | "webp">(
    "png",
  );
  const [threshold, setThreshold] = useState<string>("");
  const [reverseBg, setReverseBg] = useState(false);
  const [backgroundType, setBackgroundType] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<
    | "output"
    | "backgroundType"
    | "seedvrMode"
    | "seedvrRes"
    | "seedvrFormat"
    | "seedvrQuality"
    | "seedvrWriteMode"
    | "seedvrTargetResolution"
    | "birefModel"
    | "birefOperatingResolution"
    | "birefOutputType"
    | "birefQuality"
    | "birefWriteMode"
    | ""
  >("");
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  // --- UI Sub-renderers ---

  const renderSidebarImagePreview = () => {
    const currentInput = inputs[selectedFeature];
    if (!currentInput) return null;

    return (
      <div className="p-4 pb-2">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
          {isVideoUrl(currentInput) ? (
            <video
              src={currentInput}
              className="w-full h-full object-cover"
              muted
              onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
              onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
            />
          ) : (
            <Image
              src={currentInput}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={handleOpenUploadModal}
              className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-medium text-white border border-white/20 hover:bg-white/30 transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebarParameters = () => {
    return (
      <div className="px-4 py-1 space-y-2">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1 animate-in fade-in slide-in-from-top-1">
            <p className="text-red-400 text-[11px] font-medium leading-relaxed">
              {errorMsg}
            </p>
          </div>
        )}
        {/* AI MODEL Section */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
            AI Model
          </p>
          <div className="relative edit-dropdown">
            <button className="h-[36px] w-full px-4 rounded-xl text-[13px] font-medium ring-1 ring-white/15 hover:ring-white/25 transition flex items-center justify-between bg-white/[0.03] text-white/90 cursor-default">
              <span className="truncate">
                {selectedFeature === "upscale"
                  ? "SeedVR Upscaler"
                  : model === "fal-ai/birefnet/v2/video"
                    ? "BiRefNet v2"
                    : "Remove Background"}
              </span>
              {/* <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'birefModel' ? 'rotate-180' : ''}`} /> */}
            </button>
          </div>
        </div>

        {/* Dynamic Parameters based on feature */}
        {selectedFeature === "upscale" ? (
          <div className="space-y-2">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold tracking-widest text-white/40 uppercase"></p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                    Upscale Mode
                  </label>
                  <div className="relative edit-dropdown">
                    <button
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === "seedvrMode" ? "" : "seedvrMode",
                        )
                      }
                      className="h-[36px] w-full px-4 rounded-xl ring-1 ring-white/15 hover:ring-white/25 text-[13px] font-medium transition flex items-center justify-between bg-white/[0.03] text-white/90"
                    >
                      <span className="truncate capitalize">
                        {seedvrUpscaleMode}
                      </span>
                      <ChevronUp
                        className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "seedvrMode" ? "rotate-180" : ""}`}
                      />
                    </button>
                    {activeDropdown === "seedvrMode" && (
                      <div className="absolute z-30 top-full mt-2 left-0 w-full bg-[#1A1A24] backdrop-blur-xl rounded-xl ring-1 ring-white/30 py-1 shadow-xl">
                        {["factor", "target"].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setSeedvrUpscaleMode(opt as any);
                              setActiveDropdown("");
                            }}
                            className="w-full px-4 py-1 text-left text-[13px] text-white/90 hover:bg-white/10 capitalize"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Upscale Factor (Ruler UI) or Resolution */}
            {seedvrUpscaleMode === "factor" ? (
              <div className="space-y-2 pt-0">
                <p className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                  Scale Factor
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-white/50">
                    1× — 10×
                  </span>
                  <span className="bg-[#2F6BFF] text-white text-[11px] font-semibold px-2 py-0.5 rounded-md leading-tight">
                    {seedvrUpscaleFactor}×
                  </span>
                </div>
                <div className="pt-0">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.1}
                    value={seedvrUpscaleFactor}
                    onChange={(e) =>
                      setSeedvrUpscaleFactor(Number(e.target.value))
                    }
                    className="w-full h-[3px] appearance-none rounded-full cursor-pointer touch-none"
                    style={{
                      background: `linear-gradient(to right, #2F6BFF 0%, #2F6BFF ${((seedvrUpscaleFactor - 1) / 5) * 100}%, rgba(255,255,255,0.15) ${((seedvrUpscaleFactor - 1) / 5) * 100}%, rgba(255,255,255,0.15) 100%)`,
                    }}
                  />
                  <div className="flex justify-between mt-1 px-[8px]">
                    {[1, 2, 3, 4, 5, 6].map((v) => (
                      <span
                        key={v}
                        className="text-[10px] font-medium text-white/30 w-0 flex justify-center"
                      >
                        {v}×
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                  Target Resolution
                </p>
                <div className="relative edit-dropdown">
                  <button
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "seedvrRes" ? "" : "seedvrRes",
                      )
                    }
                    className="h-[36px] w-full px-4 rounded-xl ring-1 ring-white/15 hover:ring-white/25 text-[13px] font-medium transition flex items-center justify-between bg-white/[0.03] text-white/90"
                  >
                    <span className="truncate">{seedvrTargetResolution}</span>
                    <ChevronUp
                      className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "seedvrRes" ? "rotate-180" : ""}`}
                    />
                  </button>
                  {activeDropdown === "seedvrRes" && (
                    <div className="absolute z-30 top-full mt-2 left-0 w-full bg-[#1A1A24] backdrop-blur-xl rounded-xl ring-1 ring-white/30 py-1 shadow-xl">
                      {["720p", "1080p", "1440p", "2160p"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setSeedvrTargetResolution(opt as any);
                            setActiveDropdown("");
                          }}
                          className="w-full px-4 py-1 text-left text-[13px] text-white/90 hover:bg-white/10"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Settings */}
            <div className="border-t border-white/5 pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                  Additional Settings
                </span>
                <button
                  onClick={() => setShowUpscaleAdvanced(!showUpscaleAdvanced)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-white/[0.05] ring-1 ring-white/10 text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  {showUpscaleAdvanced ? "Less" : "More"}
                </button>
              </div>

              {showUpscaleAdvanced && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                        Seed
                      </label>
                      <input
                        type="text"
                        value={seedvrSeed}
                        onChange={(e) => setSeedvrSeed(e.target.value)}
                        placeholder="random"
                        className="w-full h-[28px] px-4 rounded-lg ring-1 ring-white/15 hover:ring-white/25 bg-white/[0.03] text-white text-[11px] font-medium transition focus:outline-none focus:ring-1 focus:ring-[#2F6BFF]/50 border-none placeholder-white/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                        Noise Scale
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        value={seedvrNoiseScale}
                        onChange={(e) =>
                          setSeedvrNoiseScale(Number(e.target.value))
                        }
                        className="w-full h-[28px] px-4 rounded-lg ring-1 ring-white/15 hover:ring-white/25 bg-white/[0.03] text-white text-[11px] font-medium transition focus:outline-none focus:ring-1 focus:ring-[#2F6BFF]/50 border-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                        Output Format
                      </label>
                      <div className="relative edit-dropdown">
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "seedvrFormat"
                                ? ""
                                : "seedvrFormat",
                            )
                          }
                          className="h-[28px] w-full px-4 rounded-xl ring-1 ring-white/15 hover:ring-white/25 text-[11px] font-medium transition flex items-center justify-between bg-white/[0.03] text-white/90"
                        >
                          <span className="truncate">{seedvrOutputFormat}</span>
                          <ChevronUp
                            className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "seedvrFormat" ? "rotate-180" : ""}`}
                          />
                        </button>
                        {activeDropdown === "seedvrFormat" && (
                          <div className="absolute z-30 top-full mt-2 left-0 w-[120%] bg-[#1A1A24] backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-1 shadow-xl">
                            {[
                              "X264 (.mp4)",
                              "VP9 (.webm)",
                              "PRORES4444 (.mov)",
                              "GIF (.gif)",
                            ].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  setSeedvrOutputFormat(opt as any);
                                  setActiveDropdown("");
                                }}
                                className="w-full px-4 py-1 text-left text-[11px] text-white/90 hover:bg-white/10"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                        Output Quality
                      </label>
                      <div className="relative edit-dropdown">
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "seedvrQuality"
                                ? ""
                                : "seedvrQuality",
                            )
                          }
                          className="h-[28px] w-full px-4 rounded-xl ring-1 ring-white/15 hover:ring-white/25 text-[11px] font-medium transition flex items-center justify-between bg-white/[0.03] text-white/90"
                        >
                          <span className="truncate capitalize">
                            {seedvrOutputQuality}
                          </span>
                          <ChevronUp
                            className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "seedvrQuality" ? "rotate-180" : ""}`}
                          />
                        </button>
                        {activeDropdown === "seedvrQuality" && (
                          <div className="absolute z-30 top-full mt-2 left-0 w-full bg-[#1A1A24] backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-1 shadow-xl">
                            {["low", "medium", "high", "maximum"].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  setSeedvrOutputQuality(opt as any);
                                  setActiveDropdown("");
                                }}
                                className="w-full px-4 py-1 text-left text-[11px] text-white/90 hover:bg-white/10 capitalize"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                        Write Mode
                      </label>
                      <div className="relative edit-dropdown">
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "seedvrWriteMode"
                                ? ""
                                : "seedvrWriteMode",
                            )
                          }
                          className="h-[28px] w-full px-4 rounded-xl ring-1 ring-white/15 hover:ring-white/25 text-[11px] font-medium transition flex items-center justify-between bg-white/[0.03] text-white/90"
                        >
                          <span className="truncate capitalize">
                            {seedvrOutputWriteMode}
                          </span>
                          <ChevronUp
                            className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "seedvrWriteMode" ? "rotate-180" : ""}`}
                          />
                        </button>
                        {activeDropdown === "seedvrWriteMode" && (
                          <div className="absolute z-30 top-full mt-2 left-0 w-full bg-[#1A1A24] backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-1 shadow-xl">
                            {["fast", "balanced", "small"].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  setSeedvrOutputWriteMode(opt as any);
                                  setActiveDropdown("");
                                }}
                                className="w-full px-4 py-1 text-left text-[11px] text-white/90 hover:bg-white/10 capitalize"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                        Sync Mode
                      </label>
                      <button
                        onClick={() => setSeedvrSyncMode(!seedvrSyncMode)}
                        className={`h-[28px] w-full px-4 rounded-lg ring-1 ring-white/15 hover:ring-white/25 text-[11px] font-medium transition flex items-center justify-center ${seedvrSyncMode ? "bg-[#2F6BFF] text-white ring-transparent hover:ring-transparent" : "bg-white/[0.03] text-white/90"}`}
                      >
                        {seedvrSyncMode ? "On" : "Off"}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] font-medium text-white/40 italic leading-snug pt-2">
                    Note: When sync_mode is true, the media will be returned as
                    a Base64 URI and not stored.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold tracking-widest text-white/40 uppercase"></p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                    Model
                  </label>
                  <div className="relative edit-dropdown">
                    <button
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === "birefModel" ? "" : "birefModel",
                        )
                      }
                      className="h-[32px] w-full px-4 rounded-lg ring-1 ring-white/15 hover:ring-white/25 text-[11px] font-medium transition flex items-center justify-between bg-white/[0.03] text-white/90"
                    >
                      <span className="truncate">{birefModel}</span>
                      <ChevronUp
                        className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "birefModel" ? "rotate-180" : ""}`}
                      />
                    </button>
                    {activeDropdown === "birefModel" && (
                      <div className="absolute z-30 top-full mt-2 left-0 w-full bg-[#1A1A24] backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 shadow-xl">
                        {[
                          "General Use (Light)",
                          "General Use (Light 2K)",
                          "General Use (Heavy)",
                          "Matting",
                          "Portrait",
                          "General Use (Dynamic)",
                        ].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setBirefModel(opt as any);
                              setActiveDropdown("");
                            }}
                            className="w-full px-4 py-2 text-left text-[11px] text-white/90 hover:bg-white/10"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold tracking-widest text-white/40 uppercase">
                    Operating Resolution
                  </label>
                  <div className="relative edit-dropdown">
                    <button
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === "birefOperatingResolution"
                            ? ""
                            : "birefOperatingResolution",
                        )
                      }
                      className="h-[32px] w-full px-4 rounded-lg ring-1 ring-white/15 hover:ring-white/25 text-[13px] font-medium transition flex items-center justify-between bg-white/[0.03] text-white/90"
                    >
                      <span className="truncate">
                        {birefOperatingResolution}
                      </span>
                      <ChevronUp
                        className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "birefOperatingResolution" ? "rotate-180" : ""}`}
                      />
                    </button>
                    {activeDropdown === "birefOperatingResolution" && (
                      <div className="absolute z-30 top-full mt-2 left-0 w-full bg-[#1A1A24] backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-2 shadow-xl">
                        {["1024x1024", "2048x2048", "2304x2304"].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setBirefOperatingResolution(opt as any);
                              setActiveDropdown("");
                            }}
                            className="w-full px-4 py-2 text-left text-[11px] text-white/90 hover:bg-white/10"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold tracking-widest text-white/40 uppercase">
                    Output Mask
                  </label>
                  <button
                    onClick={() => setBirefOutputMask(!birefOutputMask)}
                    className={`h-[28px] px-4 rounded-lg ring-1 ring-white/15 hover:ring-white/25 text-[11px] font-medium transition flex items-center justify-center ${birefOutputMask ? "bg-[white] text-black ring-transparent hover:ring-transparent" : "bg-white/[0.03] text-white/90"}`}
                  >
                    {birefOutputMask ? "On" : "Off"}
                  </button>
                </div>

                <div className="flex items-center justify-between pb-2">
                  <label className="block text-[11px] font-semibold tracking-widest text-white/40 uppercase">
                    Refine Foreground
                  </label>
                  <button
                    onClick={() => setBirefRefineFg(!birefRefineFg)}
                    className={`h-[28px] px-4 rounded-lg ring-1 ring-white/15 hover:ring-white/25 text-[11px] font-medium transition flex items-center justify-center ${birefRefineFg ? "bg-[white] text-black ring-transparent hover:ring-transparent" : "bg-white/[0.03] text-white/90"}`}
                  >
                    {birefRefineFg ? "On" : "Off"}
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Settings */}
            <div className="border-t border-white/5 pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                  Additional Settings
                </span>
                <button
                  onClick={() => setShowRemoveBgAdvanced(!showRemoveBgAdvanced)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/[0.05] ring-1 ring-white/10 text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  {showRemoveBgAdvanced ? "Less" : "More"}
                </button>
              </div>

              {showRemoveBgAdvanced && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold tracking-widest text-white/40 uppercase">
                        Output Format
                      </label>
                      <div className="relative edit-dropdown">
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "birefOutputType"
                                ? ""
                                : "birefOutputType",
                            )
                          }
                          className="h-[28px] w-full px-4 rounded-lg ring-1 ring-white/15 hover:ring-white/25 text-[11px] font-medium transition flex items-center justify-between bg-white/[0.03] text-white/90"
                        >
                          <span className="truncate">{birefOutputType}</span>
                          <ChevronUp
                            className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "birefOutputType" ? "rotate-180" : ""}`}
                          />
                        </button>
                        {activeDropdown === "birefOutputType" && (
                          <div className="absolute z-30 top-full mt-2 left-0 w-[120%] bg-[#1A1A24] backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-1 shadow-xl">
                            {[
                              "X264 (.mp4)",
                              "VP9 (.webm)",
                              "PRORES4444 (.mov)",
                              "GIF (.gif)",
                            ].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  setBirefOutputType(opt as any);
                                  setActiveDropdown("");
                                }}
                                className="w-full px-4 py-1 text-left text-[11px] text-white/90 hover:bg-white/10"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                        Write Mode
                      </label>
                      <div className="relative edit-dropdown">
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "birefWriteMode"
                                ? ""
                                : "birefWriteMode",
                            )
                          }
                          className="h-[28px] w-full px-4 rounded-lg ring-1 ring-white/15 hover:ring-white/25 text-[11px] font-medium transition flex items-center justify-between bg-white/[0.03] text-white/90"
                        >
                          <span className="truncate capitalize">
                            {birefWriteMode}
                          </span>
                          <ChevronUp
                            className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "birefWriteMode" ? "rotate-180" : ""}`}
                          />
                        </button>
                        {activeDropdown === "birefWriteMode" && (
                          <div className="absolute z-30 top-full mt-2 left-0 w-full bg-[#1A1A24] backdrop-blur-xl rounded-lg ring-1 ring-white/30 py-1 shadow-xl">
                            {["fast", "balanced", "small"].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  setBirefWriteMode(opt as any);
                                  setActiveDropdown("");
                                }}
                                className="w-full px-4 py-1 text-left text-[11px] text-white/90 hover:bg-white/10 capitalize"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                        Sync Mode
                      </label>
                      <button
                        onClick={() => setBirefSyncMode(!birefSyncMode)}
                        className={`h-[28px] w-full px-4 rounded-lg ring-1 ring-white/15 hover:ring-white/25 text-[11px] font-medium transition flex items-center justify-center ${birefSyncMode ? "bg-[#2F6BFF] text-white ring-transparent hover:ring-transparent" : "bg-white/[0.03] text-white/90"}`}
                      >
                        {birefSyncMode ? "On" : "Off"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estimated Output Section */}
        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
            Estimated Output
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1 flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                Resolution
              </span>
              <span className="text-[12px] font-semibold text-white leading-tight">
                {inputNaturalSize.width > 0
                  ? `${Math.round(inputNaturalSize.width * seedvrUpscaleFactor)} × ${Math.round(inputNaturalSize.height * seedvrUpscaleFactor)}`
                  : "—"}
              </span>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-1 flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
                Est. Cost
              </span>
              <span className="text-[12px] font-semibold text-white leading-tight">
                60 credits
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebarFooter = () => {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="flex-1 px-4 py-2 text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10"
        >
          Reset
        </button>
        <button
          onClick={handleRun}
          disabled={!inputs[selectedFeature] || processing[selectedFeature]}
          className="flex-[2] px-4 py-2 text-xs font-semibold text-white bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg shadow-blue-500/20"
        >
          {processing[selectedFeature] ? "Processing..." : "Generate"}
        </button>
      </div>
    );
  };

  const renderCanvasTopBar = () => {
    return (
      <div className="flex items-center justify-between w-full h-full px-4">
        <div className="flex items-center gap-6">
          {(["upscale", "remove-bg"] as EditFeature[]).map((feature) => (
            <button
              key={feature}
              onClick={() => {
                setSelectedFeature(feature);
                if (feature === "remove-bg")
                  setModel("fal-ai/birefnet/v2/video");
                else setModel("fal-ai/seedvr/upscale/video");
              }}
              className={`relative h-[48px] flex items-center transition-all duration-200 group`}
            >
              <div className="flex items-center gap-2 px-1">
                <span
                  className={`text-sm font-medium transition-colors duration-200 ${selectedFeature === feature ? "text-white" : "text-white/40 group-hover:text-white/70"}`}
                >
                  {feature === "upscale" ? "Upscale" : "Remove BG"}
                </span>
              </div>
              {selectedFeature === feature && (
                <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-white/40" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            className="p-2 text-white/40 hover:text-white transition-colors"
            title="Zoom"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button
            onClick={handleDownloadOutput}
            className={`p-2 transition-colors ${outputs[selectedFeature] ? "text-white/80 hover:text-white" : "text-white/10 cursor-not-allowed"}`}
            disabled={!outputs[selectedFeature]}
            title="Download"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button
            onClick={handleShareOutput}
            className={`p-2 transition-colors ${outputs[selectedFeature] ? "text-white/80 hover:text-white" : "text-white/10 cursor-not-allowed"}`}
            disabled={!outputs[selectedFeature]}
            title="Share"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const historyEntries = useAppSelector((s: any) =>
    (s.history?.entries || []).filter(
      (e: any) => e.generationType === "text-to-video",
    ),
  );
  const historyLoading = useAppSelector(
    (s: any) => s.history?.loading || false,
  );
  const historyHasMore = useAppSelector(
    (s: any) => s.history?.hasMore || false,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to check if URL is a video
  const isVideoUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
    const videoMimeTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ];
    const lowerUrl = url.toLowerCase();
    // Check file extension
    if (videoExtensions.some((ext) => lowerUrl.includes(ext))) return true;
    // Check data URI mime type
    if (
      url.startsWith("data:") &&
      videoMimeTypes.some((mime) => url.includes(mime))
    )
      return true;
    // Check blob URL (assume it's video for video edit interface)
    if (url.startsWith("blob:")) return true;
    return false;
  };

  // Initialize from query params: feature and image and ensure we have some video history via unified loader
  useHistoryLoader({ generationType: "text-to-video", initialLimit: 30 });
  useEffect(() => {
    try {
      // Allow tab selection via query
      const featureParam = (searchParams?.get("feature") || "").toLowerCase();
      const imageParam = searchParams?.get("image") || "";
      const storagePathParam = searchParams?.get("sp") || "";

      const validFeature = ["upscale", "remove-bg"].includes(featureParam)
        ? (featureParam as EditFeature)
        : null;
      if (validFeature) {
        setSelectedFeature(validFeature);
        // Set default model based on feature
        if (validFeature === "remove-bg") {
          setModel("fal-ai/birefnet/v2/video" as any);
        } else if (validFeature === "upscale") {
          setModel("fal-ai/seedvr/upscale/video" as any);
        }
        // Prefer raw storage path if provided; use frontend proxy URL for preview rendering
        if (storagePathParam) {
          const frontendProxied = `/api/proxy/resource/${encodeURIComponent(storagePathParam)}`;
          // Apply to both features so switching tabs preserves the same input
          setInputs({
            upscale: frontendProxied,
            "remove-bg": frontendProxied,
          });
        } else if (imageParam && imageParam.trim() !== "") {
          setInputs({
            upscale: imageParam,
            "remove-bg": imageParam,
          });
        }
      } else if (imageParam && imageParam.trim() !== "") {
        // Fallback: if only image provided, attach to both features
        setInputs({
          upscale: imageParam,
          "remove-bg": imageParam,
        });
      }
    } catch {}
    // Only run once on mount for initial hydration from URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // State restoration for auto-resume
  useEffect(() => {
    if (typeof window === "undefined") return;
    const intent = getAutoResumeIntent();
    if (intent && intent.type === "video" && intent.data?.isEditVideo) {
      console.log("[EditVideo] Auto-resuming editor state:", intent.data);
      const data = intent.data;
      if (data.selectedFeature) setSelectedFeature(data.selectedFeature);
      if (data.inputs) setInputs(data.inputs);
      if (data.model) setModel(data.model);
      if (data.seedvrUpscaleMode) setSeedvrUpscaleMode(data.seedvrUpscaleMode);
      if (data.seedvrUpscaleFactor)
        setSeedvrUpscaleFactor(data.seedvrUpscaleFactor);
      if (data.seedvrTargetResolution)
        setSeedvrTargetResolution(data.seedvrTargetResolution);
      if (data.birefModel) setBirefModel(data.birefModel);
      if (data.birefOperatingResolution)
        setBirefOperatingResolution(data.birefOperatingResolution);

      clearAutoResumeIntent();
    }
  }, [user]);

  // BiRefNet (video remove bg) params
  const [birefModel, setBirefModel] = useState<
    | "General Use (Light)"
    | "General Use (Light 2K)"
    | "General Use (Heavy)"
    | "Matting"
    | "Portrait"
    | "General Use (Dynamic)"
  >("General Use (Light)");
  const [birefOperatingResolution, setBirefOperatingResolution] = useState<
    "1024x1024" | "2048x2048" | "2304x2304"
  >("1024x1024");
  const [birefOutputMask, setBirefOutputMask] = useState<boolean>(false);
  const [birefRefineFg, setBirefRefineFg] = useState<boolean>(true);
  const [birefSyncMode, setBirefSyncMode] = useState<boolean>(false);
  const [birefOutputType, setBirefOutputType] = useState<
    "X264 (.mp4)" | "VP9 (.webm)" | "PRORES4444 (.mov)" | "GIF (.gif)"
  >("X264 (.mp4)");
  const [birefQuality, setBirefQuality] = useState<
    "low" | "medium" | "high" | "maximum"
  >("high");
  const [birefWriteMode, setBirefWriteMode] = useState<
    "fast" | "balanced" | "small"
  >("balanced");

  // Ensure SeedVR is the default model when switching to Upscale
  useEffect(() => {
    if (selectedFeature === "upscale") {
      if (model !== "fal-ai/seedvr/upscale/video") {
        setModel("fal-ai/seedvr/upscale/video" as any);
      }
    } else if (selectedFeature === "remove-bg") {
      if (model !== "fal-ai/birefnet/v2/video") {
        setModel("fal-ai/birefnet/v2/video" as any);
      }
    }
  }, [selectedFeature, model]);

  // Auto-detect input video/image dimensions
  useEffect(() => {
    const src = inputs.upscale || inputs["remove-bg"];
    if (!src) return;
    (async () => {
      try {
        let measurableSrc = String(src);
        // Make relative paths absolute for measurement
        if (!/^https?:|^data:|^blob:/i.test(measurableSrc)) {
          measurableSrc = new URL(measurableSrc, window.location.origin).href;
        }
        // If it's a proxy path that streams, load via fetch->blob to avoid CORS hiccups, then measure
        const needsBlob =
          measurableSrc.startsWith(window.location.origin) ||
          measurableSrc.startsWith("/");
        if (needsBlob && !/^data:|^blob:/i.test(measurableSrc)) {
          try {
            const resp = await fetch(measurableSrc, { cache: "force-cache" });
            const blob = await resp.blob();
            measurableSrc = URL.createObjectURL(blob);
          } catch {
            // fallback to direct src
          }
        }
        await new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            const w = Math.max(1, Math.floor(img.naturalWidth || 0));
            const h = Math.max(1, Math.floor(img.naturalHeight || 0));
            setInputNaturalSize({ width: w, height: h });
            try {
              if (measurableSrc.startsWith("blob:"))
                URL.revokeObjectURL(measurableSrc);
            } catch {}
            resolve();
          };
          img.onerror = () => resolve();
          img.src = measurableSrc;
        });
      } catch {}
    })();
  }, [inputs]);

  // Zoom and pan utility functions (improved from ImagePreviewModal)
  const clampOffset = useCallback(
    (newOffset: { x: number; y: number }, currentScale: number) => {
      if (!imageContainerRef.current) return newOffset;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const imgW = naturalSize.width * currentScale;
      const imgH = naturalSize.height * currentScale;
      const maxX = Math.max(0, (imgW - rect.width) / 2);
      const maxY = Math.max(0, (imgH - rect.height) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, newOffset.x)),
        y: Math.max(-maxY, Math.min(maxY, newOffset.y)),
      };
    },
    [naturalSize],
  );

  const zoomToPoint = useCallback(
    (point: { x: number; y: number }, newScale: number) => {
      if (!imageContainerRef.current) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const newOffsetX = centerX - point.x * newScale;
      const newOffsetY = centerY - point.y * newScale;
      const clamped = clampOffset({ x: newOffsetX, y: newOffsetY }, newScale);
      setScale(newScale);
      setOffset(clamped);
    },
    [clampOffset],
  );

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageContainerRef.current) return;

      const container = imageContainerRef.current;
      const rect = container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (Math.abs(scale - fitScale) < 1e-3) {
        // Zoom to 1.5x at click point (more reasonable)
        zoomToPoint({ x: clickX, y: clickY }, Math.min(6, fitScale * 1.5));
      } else {
        // Reset to fit
        resetZoom();
      }
    },
    [scale, fitScale, zoomToPoint, resetZoom],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPanning(true);
    setLastPoint({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPanning) return;

      e.preventDefault();
      const deltaX = e.clientX - lastPoint.x;
      const deltaY = e.clientY - lastPoint.y;

      const newOffset = {
        x: offset.x + deltaX,
        y: offset.y + deltaY,
      };

      const clampedOffset = clampOffset(newOffset, scale);
      setOffset(clampedOffset);
      setLastPoint({ x: e.clientX, y: e.clientY });
    },
    [isPanning, scale, offset, lastPoint, clampOffset],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!imageContainerRef.current) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const next = Math.max(0.1, Math.min(6, scale + delta));
      if (next !== scale) zoomToPoint({ x: mx, y: my }, next);
    },
    [scale, zoomToPoint],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        const newScale = Math.min(6, scale + 0.1);
        if (newScale !== scale) {
          setScale(newScale);
          setOffset(clampOffset(offset, newScale));
        }
      } else if (e.key === "-") {
        e.preventDefault();
        const newScale = Math.max(0.1, scale - 0.1);
        if (newScale !== scale) {
          setScale(newScale);
          setOffset(clampOffset(offset, newScale));
        }
      } else if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    },
    [scale, offset, clampOffset, resetZoom],
  );

  // Reset offsets on image change; scale will be computed on image load
  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [outputs[selectedFeature]]);

  // Recompute fit scale when container resizes or natural size changes
  useEffect(() => {
    if (!imageContainerRef.current || !naturalSize.width || !naturalSize.height)
      return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const fitCandidate =
      Math.min(
        rect.width / naturalSize.width,
        rect.height / naturalSize.height,
      ) || 1;
    const newFit = Math.min(1, fitCandidate); // do not upscale by default
    const centerOffset = { x: 0, y: 0 };
    setFitScale(newFit);
    setScale(1); // Always start at 100% zoom
    setOffset(centerOffset);
  }, [naturalSize]);
  useEffect(() => {
    const handleResize = () => {
      if (
        !imageContainerRef.current ||
        !naturalSize.width ||
        !naturalSize.height
      )
        return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const fitCandidate =
        Math.min(
          rect.width / naturalSize.width,
          rect.height / naturalSize.height,
        ) || 1;
      const newFit = Math.min(1, fitCandidate);
      const centerOffset = { x: 0, y: 0 };
      setFitScale(newFit);
      setScale(1); // Always reset to 100% zoom on resize
      setOffset(centerOffset);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [naturalSize]);

  // Prevent page scroll when mouse is over image container
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (
        imageContainerRef.current &&
        imageContainerRef.current.contains(e.target as Node)
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Add passive: false to allow preventDefault
    document.addEventListener("wheel", handleGlobalWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleGlobalWheel);
    };
  }, []);

  // Prevent page scroll on Space when the image viewer has focus
  useEffect(() => {
    const handleSpaceScrollBlock = (e: KeyboardEvent) => {
      if (e.key === " " && imageContainerRef.current) {
        const active = document.activeElement;
        if (active && imageContainerRef.current.contains(active)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener("keydown", handleSpaceScrollBlock, {
      passive: false,
    } as any);
    return () =>
      window.removeEventListener("keydown", handleSpaceScrollBlock as any);
  }, []);

  // Allow page scroll so actions are reachable on small screens
  // (removed the global overflow lock)

  // Close image menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close image actions menu
      if (showImageMenu) {
        const target = event.target as Node | null;
        const menuEl = menuRef.current;
        const btnEl = menuButtonRef.current;
        if (menuEl && menuEl.contains(target as Node)) return;
        if (btnEl && btnEl.contains(target as Node)) return;
        setShowImageMenu(false);
      }

      // Close edit dropdowns (model/output)
      if (activeDropdown) {
        const el = event.target as HTMLElement | null;
        if (!(el && el.closest(".edit-dropdown"))) {
          setActiveDropdown("");
        }
      }
    };

    if (showImageMenu || activeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showImageMenu, activeDropdown]);

  // Debug menu state
  useEffect(() => {
    if (showImageMenu) {
      console.log("🎯 MENU IS NOW VISIBLE! showImageMenu:", showImageMenu);
      console.log(
        "TEST: Menu is now visible, outputs:",
        outputs[selectedFeature],
      );
    }
  }, [showImageMenu, outputs, selectedFeature]);

  const features: { id: EditFeature; label: string; description: string }[] = [
    {
      id: "upscale",
      label: "Upscale",
      description: "Increase resolution while preserving details",
    },
    {
      id: "remove-bg",
      label: "Remove BG",
      description: "Remove background from your Video",
    },
  ];

  // Feature preview assets and display labels
  const featurePreviewGif: Record<EditFeature, string> = {
    upscale: "https://idr01.zata.ai/devstoragev1/public/editimage/upscale-banner.avif",
    "remove-bg": "https://idr01.zata.ai/devstoragev1/public/editimage/removebg-banner.avif",
  };
  const featureDisplayName: Record<EditFeature, string> = {
    upscale: "Upscale",
    "remove-bg": "Remove BG",
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const video = e.target?.result as string;
        // Apply selected video to both features
        setInputs({
          upscale: video,
          "remove-bg": video,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenUploadModal = () => setIsUploadOpen(true);

  const handleRun = async () => {
    const TWENTY_MINUTES_MS = 20 * 60 * 1000;

    const toAbsoluteProxyUrl = (url: string | null | undefined) => {
      if (!url) return url as any;
      if (url.startsWith("data:")) return url as any;
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const ZATA_PREFIX = "https://idr01.zata.ai/devstoragev1/";
      // For Replicate, we must provide a publicly reachable URL. Use Zata public URL instead of localhost proxy.
      try {
        const RESOURCE_SEG = "/api/proxy/resource/";
        if (url.startsWith(RESOURCE_SEG)) {
          const decoded = decodeURIComponent(
            url.substring(RESOURCE_SEG.length),
          );
          return `${ZATA_PREFIX}${decoded}`;
        }
        // Absolute to frontend origin
        if (url.startsWith("http://") || url.startsWith("https://")) {
          const u = new URL(url);
          if (u.pathname.startsWith(RESOURCE_SEG)) {
            const decoded = decodeURIComponent(
              u.pathname.substring(RESOURCE_SEG.length),
            );
            return `${ZATA_PREFIX}${decoded}`;
          }
          return url as any;
        }
      } catch {}
      return url as any;
    };

    const blobUrlToDataUri = async (src: string): Promise<string> => {
      const resp = await fetch(src);
      const blob = await resp.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    // For videos: prefer sending a public URL (small payload, visible in DevTools).
    // Only use data URI when the input is local (blob:) or already a data URI.
    const normalizeVideoInput = async (
      srcRaw: string,
    ): Promise<{ video?: string; video_url?: string }> => {
      if (!srcRaw) return {};
      if (srcRaw.startsWith("data:")) return { video: srcRaw };
      if (srcRaw.startsWith("blob:"))
        return { video: await blobUrlToDataUri(srcRaw) };
      const abs = String(toAbsoluteProxyUrl(srcRaw) || srcRaw);
      if (abs.startsWith("data:")) return { video: abs };
      return { video_url: abs };
    };

    const pollFalQueueResult = async (
      modelId: string,
      requestId: string,
    ): Promise<any> => {
      const start = Date.now();
      // Poll every 2s for up to 20 minutes
      while (Date.now() - start < TWENTY_MINUTES_MS) {
        const statusRes = await axiosInstance.get("/api/fal/queue/status", {
          params: { model: modelId, requestId },
        });
        const statusBody = statusRes?.data?.data || statusRes?.data;
        const s = String(statusBody?.status || "").toLowerCase();
        if (s === "completed" || s === "success" || s === "succeeded") {
          const resultRes = await axiosInstance.get("/api/fal/queue/result", {
            params: { model: modelId, requestId },
          });
          return resultRes?.data?.data || resultRes?.data;
        }
        if (s === "failed" || s === "error") {
          throw new Error("Video processing failed");
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      throw new Error("Video processing timeout exceeded (20 minutes)");
    };

    // NOTE: we intentionally do NOT fetch/convert remote videos to data URIs.
    // Doing so creates huge request bodies (hard to debug in DevTools) and can break/timeout.

    const currentInputRaw = inputs[selectedFeature];
    const currentInput = toAbsoluteProxyUrl(currentInputRaw) as any;
    if (!currentInput) return;

    if (!user) {
      saveAutoResumeIntent("video", {
        isEditVideo: true,
        selectedFeature,
        inputs,
        model,
        seedvrUpscaleMode,
        seedvrUpscaleFactor,
        seedvrTargetResolution,
        birefModel,
        birefOperatingResolution,
      });
      router.push(getSignInUrl());
      return;
    }

    setErrorMsg("");
    setOutputs((prev) => ({ ...prev, [selectedFeature]: null }));
    setProcessing((prev) => ({ ...prev, [selectedFeature]: true }));
    try {
      // Keep payloads small and debuggable: prefer public URLs for remote assets
      const normalizedVideo = currentInputRaw
        ? await normalizeVideoInput(String(currentInputRaw))
        : {};
      const isPublic = await getIsPublic();

      if (selectedFeature === "upscale") {
        // Video Upscale via FAL SeedVR
        const src = inputs["upscale"];
        if (!src) throw new Error("Please upload a video to upscale");
        const body: any = {};
        if (normalizedVideo.video) body.video = normalizedVideo.video;
        if (normalizedVideo.video_url)
          body.video_url = normalizedVideo.video_url;
        body.upscale_mode = seedvrUpscaleMode;
        if (seedvrUpscaleMode === "factor")
          body.upscale_factor = Math.max(1.1, Number(seedvrUpscaleFactor) || 2);
        if (seedvrUpscaleMode === "target")
          body.target_resolution = seedvrTargetResolution;
        if (seedvrSeed !== "") body.seed = Math.round(Number(seedvrSeed) || 0);
        body.noise_scale = Number.isFinite(Number(seedvrNoiseScale))
          ? Number(seedvrNoiseScale)
          : 0.1;
        body.output_format = seedvrOutputFormat;
        body.output_quality = seedvrOutputQuality;
        body.output_write_mode = seedvrOutputWriteMode;
        if (seedvrSyncMode) body.sync_mode = true;
        const res = await axiosInstance.post(
          "/api/fal/seedvr/upscale/video",
          body,
          { timeout: TWENTY_MINUTES_MS },
        );

        // 1) If backend returns the final URL immediately
        const immediateUrl =
          res?.data?.data?.videos?.[0]?.url ||
          res?.data?.videos?.[0]?.url ||
          "";
        if (immediateUrl) {
          setOutputs((prev) => ({ ...prev, ["upscale"]: immediateUrl }));
          try {
            setCurrentHistoryId(res?.data?.data?.historyId || null);
          } catch {}
          return;
        }

        // 2) Otherwise, queue-based response: poll status/result until completed
        const requestId =
          res?.data?.data?.requestId || res?.data?.requestId || "";
        const modelId =
          res?.data?.data?.model ||
          res?.data?.model ||
          "fal-ai/seedvr/upscale/video";
        if (!requestId) {
          console.error(
            "[Video Upscale] No video URL and no requestId in response:",
            res?.data,
          );
          throw new Error("Upscale submitted but no tracking ID returned");
        }

        const result = await pollFalQueueResult(
          String(modelId),
          String(requestId),
        );
        const polledUrl = result?.videos?.[0]?.url || result?.video?.url || "";
        if (!polledUrl) {
          console.error(
            "[Video Upscale] Polling completed but no URL in result:",
            result,
          );
          throw new Error("Upscale completed but no output URL returned");
        }
        setOutputs((prev) => ({ ...prev, ["upscale"]: polledUrl }));
        try {
          setCurrentHistoryId(res?.data?.data?.historyId || null);
        } catch {}
        return;
      }
      if (selectedFeature === "remove-bg") {
        const src = inputs["remove-bg"];
        if (!src) throw new Error("Please upload a video");
        const body: any = {};
        if (normalizedVideo.video) body.video = normalizedVideo.video;
        if (normalizedVideo.video_url)
          body.video_url = normalizedVideo.video_url;
        // BiRefNet parameters
        body.model = birefModel;
        body.operating_resolution = birefOperatingResolution;
        if (birefOutputMask) body.output_mask = true;
        if (birefRefineFg === false) body.refine_foreground = false;
        else body.refine_foreground = true;
        if (birefSyncMode) body.sync_mode = true;
        body.video_output_type = birefOutputType;
        body.video_quality = birefQuality;
        body.video_write_mode = birefWriteMode;
        // Ensure we're calling the backend endpoint (not Next.js)
        const endpoint = "/api/fal/birefnet/v2/video/remove-bg";
        console.log(
          "[Video Remove BG] Calling endpoint:",
          endpoint,
          "with body:",
          {
            ...body,
            video_url: body.video_url?.substring(0, 100) + "...",
            video: body.video
              ? "data URI (length: " + body.video.length + ")"
              : "none",
          },
        );
        const res = await axiosInstance.post(endpoint, body);
        const out =
          res?.data?.data?.videos?.[0]?.url ||
          res?.data?.videos?.[0]?.url ||
          res?.data?.data?.video?.url ||
          res?.data?.video?.url ||
          "";
        if (out) setOutputs((prev) => ({ ...prev, ["remove-bg"]: out }));
        try {
          setCurrentHistoryId(res?.data?.data?.historyId || null);
        } catch {}
      }
    } catch (e) {
      console.error("[EditVideo] run.error", e);
      const errorData = (e as any)?.response?.data;
      const status = (e as any)?.response?.status;
      const config = (e as any)?.config;

      // Check if we got an HTML response (Next.js error page)
      if (
        errorData &&
        typeof errorData === "string" &&
        errorData.includes("<!DOCTYPE html>")
      ) {
        const baseURL = config?.baseURL || axiosInstance.defaults.baseURL;
        const url = config?.url || "";
        console.error(
          "[EditVideo] Got HTML response - request may have hit Next.js instead of backend",
          {
            baseURL,
            url,
            fullUrl: baseURL ? `${baseURL}${url}` : url,
            status,
          },
        );
        setErrorMsg(
          `Backend connection error. Please check that NEXT_PUBLIC_API_BASE_URL is set correctly. (Status: ${status || "unknown"})`,
        );
        return;
      }

      let msg =
        (errorData && (errorData.message || errorData.error)) ||
        (e as any)?.message ||
        "Request failed";
      if (!msg && Array.isArray(errorData)) {
        try {
          msg = errorData.map((x: any) => x?.msg || x).join(", ");
        } catch {}
      }
      if (typeof msg !== "string") {
        try {
          msg = JSON.stringify(errorData);
        } catch {}
      }
      console.log("[EditVideo] Error details:", {
        errorData,
        status,
        url: config?.url,
        baseURL: config?.baseURL,
      });
      setErrorMsg(String(msg));
    } finally {
      setProcessing((prev) => ({ ...prev, [selectedFeature]: false }));
    }
  };

  const handleReset = () => {
    setInputs({ upscale: null, "remove-bg": null });
    setOutputs({ upscale: null, "remove-bg": null });
    // Set appropriate default model based on selected feature
    if (selectedFeature === "remove-bg") {
      setModel("fal-ai/birefnet/v2/video" as any);
      // Reset BiRefNet parameters to defaults
      setBirefModel("General Use (Light)");
      setBirefOperatingResolution("1024x1024");
      setBirefOutputMask(false);
      setBirefRefineFg(true);
      setBirefSyncMode(false);
      setBirefOutputType("X264 (.mp4)");
      setBirefQuality("high");
      setBirefWriteMode("balanced");
      setShowRemoveBgAdvanced(false);
    } else if (selectedFeature === "upscale") {
      setModel("fal-ai/seedvr/upscale/video" as any);
    }
    setOutput("png");
    setBackgroundType("rgba");
    setThreshold("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper functions from ImagePreviewModal.tsx
  const toProxyPath = React.useCallback((urlOrPath: string | undefined) => {
    if (!urlOrPath) return "";
    const ZATA_PREFIX = "https://idr01.zata.ai/devstoragev1/";
    if (urlOrPath.startsWith(ZATA_PREFIX)) {
      return urlOrPath.substring(ZATA_PREFIX.length);
    }
    return urlOrPath;
  }, []);

  const toProxyDownloadUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    return path
      ? `${API_BASE}/api/proxy/download/${encodeURIComponent(path)}`
      : "";
  };

  const handleDownloadOutput = async () => {
    try {
      const url = outputs[selectedFeature];
      if (!url) {
        alert("No video available to download");
        return;
      }

      await downloadFileWithNaming(url, null, "video", "edited");
    } catch (e) {
      console.error("[EditVideo] download.error", e);
      alert("Failed to download video. Please try again.");
    }
  };

  const handleShareOutput = async () => {
    const shareUrl = outputs[selectedFeature] || "";
    try {
      if (!shareUrl) {
        alert("No video available to share");
        return;
      }

      // Use the same logic as ImagePreviewModal
      if (!navigator.share) {
        // Fallback: Copy video URL to clipboard
        await copyToClipboard(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
        alert("Video URL copied to clipboard!");
        return;
      }

      // Fetch the video as a blob
      const downloadUrl = toProxyDownloadUrl(shareUrl);
      if (!downloadUrl) {
        await copyToClipboard(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
        alert("Video URL copied to clipboard!");
        return;
      }

      const response = await fetch(downloadUrl, {
        credentials: "include",
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      const blob = await response.blob();
      const fileName =
        (toProxyPath(shareUrl) || "generated-video").split("/").pop() ||
        "generated-video.mp4";

      // Create a File from the blob
      const file = new File([blob], fileName, { type: blob.type });

      // Use Web Share API
      await navigator.share({
        title: "Wild Mind AI Generated Video",
        text: `Check out this AI-generated video!`,
        files: [file],
      });

      console.log("Video shared successfully");
    } catch (error: any) {
      // Handle user cancellation gracefully
      if (error.name === "AbortError") {
        console.log("Share cancelled by user");
        return;
      }

      // Fallback to copying URL
      console.error("Share failed:", error);
      try {
        await copyToClipboard(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
        alert("Sharing not supported. Video URL copied to clipboard!");
      } catch (copyError) {
        console.error("Copy failed:", copyError);
        alert("Unable to share video. Please try downloading instead.");
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
      document.body.removeChild(textArea);
    }
  };

  const renderCanvasArea = () =>
    (() => {
      const isOutputVideo = Boolean(
        outputs[selectedFeature] && isVideoUrl(outputs[selectedFeature]),
      );
      return (
        <div
          className="bg-[#0E0E12] relative overflow-hidden min-h-[24rem] h-full w-full max-w-6xl md:max-w-[100rem] flex items-center justify-center"
          onDragOver={(e) => {
            try {
              e.preventDefault();
            } catch {}
          }}
          onDrop={(e) => {
            try {
              e.preventDefault();
              const file = e.dataTransfer?.files?.[0];
              if (!file || !file.type.startsWith("video/")) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const video = ev.target?.result as string;
                setInputs({ upscale: video, "remove-bg": video });
                setOutputs({ upscale: null, "remove-bg": null });
                setScale(1);
                setOffset({ x: 0, y: 0 });
              };
              reader.readAsDataURL(file);
            } catch {}
          }}
        >
          {outputs[selectedFeature] && (
            <div className="absolute top-5 left-4 z-10 ">
              <span className="text-xs font-medium text-white bg-black/80 px-2 py-1 rounded md:text-sm md:px-3 md:py-1">
                Output {selectedFeature === "upscale" ? "Video" : "Image"}
              </span>
            </div>
          )}
          {(outputs[selectedFeature] || inputs[selectedFeature]) && (
            <div className="absolute bottom-3 left-3 z-50 md:bottom-16 md:left-4 flex items-center gap-2">
              {outputs[selectedFeature] && (
                <div className="relative">
                  <button
                    ref={menuButtonRef}
                    className="p-2.5 bg-black/80 hover:bg-black/70 text-white rounded-lg transition-all duration-200 border border-white/30 md:p-2"
                    aria-haspopup="menu"
                    aria-expanded={showImageMenu}
                    onClick={() => setShowImageMenu((v) => !v)}
                  >
                    <svg
                      className="w-4 h-4 2xl:w-5 2xl:h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="5" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="19" cy="12" r="2" />
                    </svg>
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  try {
                    handleOpenUploadModal();
                  } catch {}
                }}
                className="p-2 bg-black/80 hover:bg-black/70 text-white rounded-lg transition-all duration-200 border border-white/30"
                title="Upload other"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                  aria-hidden="true"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </button>
              {outputs[selectedFeature] && showImageMenu && (
                <div
                  ref={menuRef}
                  className="absolute bottom-10 left-0 bg-black/80 border border-white/30 rounded-lg shadow-2xl min-w-[100px] overflow-hidden md:min-w-[150px]"
                >
                  <button
                    onClick={async () => {
                      await handleDownloadOutput();
                      setShowImageMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-green-500/20 text-sm flex items-center gap-3 transition-colors duration-200 border-b border-white/10 md:text-base md:py-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={async () => {
                      await handleShareOutput();
                      setShowImageMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-blue-500/20 text-sm flex items-center gap-3 transition-colors duration-200 md:text-base md:py-2"
                  >
                    <svg
                      className="w-4 h-4 2xl:w-5 2xl:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z"
                      />
                    </svg>
                    {shareCopied ? "Copied!" : "Share"}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const id = currentHistoryId;
                        if (id) {
                          await axiosInstance.delete(`/api/generations/${id}`);
                        }
                        setOutputs((prev) => ({
                          ...prev,
                          [selectedFeature]: null,
                        }));
                        setShowImageMenu(false);
                      } catch (e) {
                        console.error("Delete failed:", e);
                        setShowImageMenu(false);
                      }
                    }}
                    className="w-full px-4 py-3 text-left text-red-300 hover:bg-red-500/10 text-sm flex items-center gap-3 transition-colors duration-200 border-t border-white/10 md:text-base md:py-2"
                  >
                    <svg
                      className="w-4 h-4 2xl:w-5 2xl:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
          {outputs[selectedFeature] ? (
            <div className="w-full h-full relative flex items-center justify-center min-h-[24rem] md:min-h-[35rem] lg:h-[45rem]">
              <div
                ref={imageContainerRef}
                className={`w-full max-w-xl aspect-[3/2] relative select-none flex items-center justify-center rounded-3xl border border-white/10 bg-black/20 overflow-hidden ${isOutputVideo ? "cursor-default" : "cursor-move"}`}
                onMouseDown={isOutputVideo ? undefined : handleMouseDown}
                onMouseMove={isOutputVideo ? undefined : handleMouseMove}
                onMouseUp={isOutputVideo ? undefined : handleMouseUp}
                onMouseLeave={isOutputVideo ? undefined : handleMouseUp}
                onWheel={isOutputVideo ? undefined : handleWheel}
                onKeyDown={isOutputVideo ? undefined : handleKeyDown}
                tabIndex={isOutputVideo ? -1 : 0}
                style={{ outline: "none" }}
              >
                {isVideoUrl(outputs[selectedFeature]) ? (
                  <video
                    src={outputs[selectedFeature] as string}
                    controls
                    className="w-full h-full object-contain object-top"
                    onLoadedData={(e) => {
                      const video = e.target as HTMLVideoElement;
                      setNaturalSize({
                        width: video.videoWidth,
                        height: video.videoHeight,
                      });
                    }}
                  />
                ) : (
                  <Image
                    ref={imageRef}
                    src={outputs[selectedFeature] as string}
                    alt="Output"
                    fill
                    className="object-contain object-center"
                    style={{
                      transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                      transformOrigin: "center center",
                      objectPosition: "center 55%",
                    }}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      setNaturalSize({
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                      });
                    }}
                    onClick={handleImageClick}
                  />
                )}
                {!isOutputVideo && (
                  <div className="absolute bottom-3 right-3 z-30 2xl:bottom-16 2xl:right-4">
                    <div className="flex items-center gap-1 2xl:gap-1.5 bg-black/80 rounded-lg p-1">
                      <button
                        onClick={() => {
                          const newScale = Math.max(0.1, scale - 0.1);
                          setScale(newScale);
                          setOffset(clampOffset(offset, newScale));
                        }}
                        disabled={scale <= 0.1}
                        className="w-5 h-5 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed 2xl:w-6 2xl:h-6"
                      >
                        −
                      </button>
                      <span className="text-white/80 text-xs px-1.5 2xl:text-sm 2xl:px-2">
                        {Math.round(scale * 100)}%
                      </span>
                      <button
                        onClick={() => {
                          const newScale = Math.min(6, scale + 0.1);
                          setScale(newScale);
                          setOffset(clampOffset(offset, newScale));
                        }}
                        disabled={scale >= 6}
                        className="w-5 h-5 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed 2xl:w-6 2xl:h-6"
                      >
                        +
                      </button>
                      <button
                        onClick={resetZoom}
                        className="w-5 h-5 bg-white/20 hover:bg-white/30 text-white text-xs rounded flex items-center justify-center 2xl:w-6 2xl:h-6"
                      >
                        ⌂
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full relative flex items-center justify-center min-h-[24rem] md:min-h-[35rem] lg:h-[45rem]">
              {inputs[selectedFeature] ? (
                <div className="w-full max-w-xl aspect-[3/2] relative rounded-3xl border border-white/10 bg-black/20 overflow-hidden">
                  {isVideoUrl(inputs[selectedFeature]) ? (
                    <video
                      src={inputs[selectedFeature] as string}
                      controls
                      className="w-full h-full object-contain object-top"
                      onLoadedData={(e) => {
                        const video = e.target as HTMLVideoElement;
                        setInputNaturalSize({
                          width: video.videoWidth,
                          height: video.videoHeight,
                        });
                      }}
                    />
                  ) : (
                    <Image
                      src={inputs[selectedFeature] as string}
                      alt="Input"
                      fill
                      className="object-contain object-center"
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        setInputNaturalSize({
                          width: img.naturalWidth,
                          height: img.naturalHeight,
                        });
                      }}
                    />
                  )}
                </div>
              ) : (
                !inputs[selectedFeature] &&
                !outputs[selectedFeature] && (
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="group relative flex flex-col items-center justify-center w-full max-w-xl aspect-[3/2] rounded-3xl border-2 border-dashed border-white/10 hover:border-white/10 hover:bg-white/4 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      >
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold text-white/90">
                        Drop your video here
                      </h3>
                      <p className="text-sm text-white/40">
                        or{" "}
                        <span className="text-white/60 font-medium">
                          click to browse
                        </span>{" "}
                        from your computer
                      </p>
                    </div>
                    <div className="absolute bottom-6 flex items-center gap-4">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
                          MP4
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
                          MOV
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
                          UP TO 50MB
                        </span>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          )}
          {processing[selectedFeature] && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <img
                src="https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif"
                alt="Generating..."
                className="w-32 h-32 md:w-48 md:h-48 opacity-90"
              />
            </div>
          )}
        </div>
      );
    })();

  const pathname = usePathname();
  const isInline = pathname?.startsWith("/text-to-video/edit-video");

  return (
    <div
      className={`video-edit-theme flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] ${isInline ? "bg-[#0E0E12]" : "bg-[#0E0E12] rounded-2xl border border-white/5"} text-white overflow-hidden`}
    >
      <VideoUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        remainingSlots={1}
        onAdd={(urls: string[]) => {
          const first = urls[0];
          if (first) {
            setInputs({ upscale: first, "remove-bg": first });
            setOutputs({ upscale: null, "remove-bg": null });
            setScale(1);
            setOffset({ x: 0, y: 0 });
          }
        }}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <EditImageSidebar
          imagePreview={renderSidebarImagePreview()}
          parameters={renderSidebarParameters()}
          footer={renderSidebarFooter()}
        />

        <EditImageCanvasArea
          topBar={renderCanvasTopBar()}
          canvas={renderCanvasArea()}
          statusBar={null}
        />
      </div>

      <style jsx>{`
        :global(.video-edit-theme) {
          background: #0e0e12;
          color: rgba(255, 255, 255, 0.85);
        }

        :global(.video-edit-theme [class*="bg-[#1A1A24]"]) {
          background: rgba(14, 14, 18, 0.95) !important;
        }

        :global(.video-edit-theme [class*="bg-white/[0.03]"]) {
          background: rgba(255, 255, 255, 0.03) !important;
        }

        :global(.video-edit-theme [class*="bg-white/[0.05]"]) {
          background: rgba(255, 255, 255, 0.05) !important;
        }

        :global(.video-edit-theme [class*="ring-white/15"]) {
          --tw-ring-color: rgba(255, 255, 255, 0.15) !important;
        }

        :global(.video-edit-theme [class*="border-white/10"]) {
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        :global(.video-edit-theme [class*="text-white/90"]) {
          color: rgba(255, 255, 255, 0.85) !important;
        }

        :global(.video-edit-theme [class*="text-white/80"]) {
          color: rgba(255, 255, 255, 0.75) !important;
        }

        :global(.video-edit-theme [class*="text-white/40"]) {
          color: rgba(255, 255, 255, 0.4) !important;
        }

        :global(.edit-dropdown > button) {
          height: 32px !important;
          border-radius: 10px !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          background: rgba(255, 255, 255, 0.03) !important;
          color: rgba(255, 255, 255, 0.85) !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          line-height: 1.2 !important;
          transition: all 0.2s ease;
        }

        :global(.edit-dropdown > button:hover) {
          border-color: rgba(255, 255, 255, 0.2) !important;
          background: rgba(255, 255, 255, 0.06) !important;
          color: rgba(255, 255, 255, 0.95) !important;
        }

        :global(.edit-dropdown > div) {
          background: rgba(0, 0, 0, 1) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 10px !important;
          backdrop-filter: blur(16px);
        }

        :global(.edit-dropdown > div button) {
          font-size: 12px !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }

        :global(.edit-dropdown > div button:hover) {
          background: rgba(255, 255, 255, 0.08) !important;
        }
      `}</style>
    </div>
  );
};

export default EditVideoInterface;
