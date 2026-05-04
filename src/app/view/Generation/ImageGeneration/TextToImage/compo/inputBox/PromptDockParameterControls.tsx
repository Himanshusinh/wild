"use client";

import React, { memo } from "react";
import type { AppDispatch } from "@/store/index";
import {
  setOutputFormat,
  setNanoBananaResolution,
} from "@/store/slices/generationSlice";
import ImageCountDropdown from "../ImageCountDropdown";
import FrameSizeDropdown from "../FrameSizeDropdown";
import StyleSelector from "../StyleSelector";
import LucidOriginOptions from "../LucidOriginOptions";
import PhoenixOptions from "../PhoenixOptions";
import FileTypeDropdown from "../FileTypeDropdown";
import ResolutionDropdown, {
  type ResolutionType,
} from "../ResolutionDropdown";
import ZTurboOutputFormatDropdown from "../ZTurboOutputFormatDropdown";
import QualityDropdown from "../QualityDropdown";

export type PromptDockParameterControlsProps = {
  layout: "mobile" | "desktop";
  dispatch: AppDispatch;
  selectedModel: string;
  frameSize: string;
  gptImage2CustomWidth: number;
  setGptImage2CustomWidth: React.Dispatch<React.SetStateAction<number>>;
  gptImage2CustomHeight: number;
  setGptImage2CustomHeight: React.Dispatch<React.SetStateAction<number>>;
  nanoBananaProResolution: "1K" | "2K" | "4K";
  setNanoBananaProResolution: (v: "1K" | "2K" | "4K") => void;
  outputFormat: string;
  nanoSupportedOutputFormats: Array<"jpg" | "png" | "webp">;
  nanoBananaProResolutionCredits?: Record<string, number>;
  nanoBananaResolution: string;
  nanoBanana2ResolutionCredits?: Record<string, number>;
  flux2ProResolution: "1K" | "2K";
  setFlux2ProResolution: (v: "1K" | "2K") => void;
  qwenResolution: "1K" | "2K";
  setQwenResolution: (v: "1K" | "2K") => void;
  seedream45Resolution: "2K" | "4K";
  setSeedream45Resolution: (v: "2K" | "4K") => void;
  seedream45ResolutionCredits: Record<string, number> | undefined;
  seedreamSize: "1K" | "2K" | "4K" | "custom";
  setSeedreamSize: (v: "1K" | "2K" | "4K" | "custom") => void;
  seedreamWidth: number;
  setSeedreamWidth: (v: number) => void;
  seedreamHeight: number;
  setSeedreamHeight: (v: number) => void;
  seedream5LiteResolution: "2K" | "3K";
  setSeedream5LiteResolution: (v: "2K" | "3K") => void;
  seedream5LiteResolutionCredits: Record<string, number> | undefined;
  zTurboOutputFormat: "png" | "jpg" | "webp";
  setZTurboOutputFormat: (v: "png" | "jpg" | "webp") => void;
  gptImage15Quality: "low" | "medium" | "high" | "auto";
  setGptImage15Quality: (v: "low" | "medium" | "high" | "auto") => void;
};

function PromptDockParameterControlsComponent(
  props: PromptDockParameterControlsProps,
) {
  const {
    layout,
    dispatch,
    selectedModel,
    frameSize,
    gptImage2CustomWidth,
    setGptImage2CustomWidth,
    gptImage2CustomHeight,
    setGptImage2CustomHeight,
    nanoBananaProResolution,
    setNanoBananaProResolution,
    outputFormat,
    nanoSupportedOutputFormats,
    nanoBananaProResolutionCredits,
    nanoBananaResolution,
    nanoBanana2ResolutionCredits,
    flux2ProResolution,
    setFlux2ProResolution,
    qwenResolution,
    setQwenResolution,
    seedream45Resolution,
    setSeedream45Resolution,
    seedream45ResolutionCredits,
    seedreamSize,
    setSeedreamSize,
    seedreamWidth,
    setSeedreamWidth,
    seedreamHeight,
    setSeedreamHeight,
    seedream5LiteResolution,
    setSeedream5LiteResolution,
    seedream5LiteResolutionCredits,
    zTurboOutputFormat,
    setZTurboOutputFormat,
    gptImage15Quality,
    setGptImage15Quality,
  } = props;

  const isMobile = layout === "mobile";
  const ids = isMobile
    ? {
        nanoProRes: "nanoBananaProResolutionMb",
        nanoOut: "nanoBananaOutputFormatMb",
        nano2Res: "nanoBanana2ResolutionMb",
        nano2Out: "nanoBanana2OutputFormatMb",
        seedream5Lite: "seedream5LiteResolution",
      }
    : {
        nanoProRes: "nanoBananaProResolutionDesk",
        nanoOut: "nanoBananaOutputFormatDesk",
        nano2Res: "nanoBanana2ResolutionDesk",
        nano2Out: "nanoBanana2OutputFormatDesk",
        seedream5Lite: "seedream5LiteResolutionDesk",
      };

  const gpt2CustomInputClassName = isMobile
    ? "h-[22px] md:h-[32px] w-[72px] md:w-24 px-2 md:px-3 rounded-lg text-[10px] md:text-[13px] ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/40"
    : "h-[32px] w-24 px-3 rounded-lg text-[13px] ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/40";

  return (
    <>
      <ImageCountDropdown />
      <FrameSizeDropdown />
      {selectedModel === "openai/gpt-image-2" && frameSize === "custom" && (
        <>
          <input
            type="number"
            min={64}
            max={4096}
            value={gptImage2CustomWidth}
            onChange={(e) =>
              setGptImage2CustomWidth(
                Math.max(
                  64,
                  Math.min(4096, Number(e.target.value) || 1024),
                ),
              )
            }
            placeholder="Width"
            className={gpt2CustomInputClassName}
          />
          <input
            type="number"
            min={64}
            max={4096}
            value={gptImage2CustomHeight}
            onChange={(e) =>
              setGptImage2CustomHeight(
                Math.max(
                  64,
                  Math.min(4096, Number(e.target.value) || 1024),
                ),
              )
            }
            placeholder="Height"
            className={gpt2CustomInputClassName}
          />
        </>
      )}
      <StyleSelector />
      <LucidOriginOptions />
      <PhoenixOptions />
      <FileTypeDropdown />
      {(selectedModel === "google/nano-banana-pro" ||
        selectedModel === "gemini-25-flash-image") && (
        <div className="flex items-center gap-2 relative">
          {selectedModel === "google/nano-banana-pro" && (
            <ResolutionDropdown
              resolution={nanoBananaProResolution}
              onResolutionChange={(val) =>
                setNanoBananaProResolution(val as "1K" | "2K" | "4K")
              }
              options={["1K", "2K", "4K"]}
              dropdownId={ids.nanoProRes}
              optionCredits={nanoBananaProResolutionCredits}
            />
          )}
          <ZTurboOutputFormatDropdown
            outputFormat={
              (outputFormat === "jpeg" ? "jpg" : outputFormat) as
                | "png"
                | "jpg"
                | "webp"
            }
            onOutputFormatChange={(val) => dispatch(setOutputFormat(val))}
            dropdownId={ids.nanoOut}
            options={nanoSupportedOutputFormats}
          />
        </div>
      )}
      {selectedModel === "google/nano-banana-2" && (
        <div className="flex items-center gap-2 relative">
          <ResolutionDropdown
            resolution={nanoBananaResolution as ResolutionType}
            onResolutionChange={(val) =>
              dispatch(
                setNanoBananaResolution(val as "0.5K" | "1K" | "2K" | "4K"),
              )
            }
            options={["0.5K", "1K", "2K", "4K"]}
            dropdownId={ids.nano2Res}
            optionCredits={nanoBanana2ResolutionCredits}
          />
          <ZTurboOutputFormatDropdown
            outputFormat={
              (outputFormat === "jpeg" ? "jpg" : outputFormat) as
                | "png"
                | "jpg"
                | "webp"
            }
            onOutputFormatChange={(val) => dispatch(setOutputFormat(val))}
            dropdownId={ids.nano2Out}
            options={nanoSupportedOutputFormats}
          />
        </div>
      )}
      {selectedModel === "flux-2-pro" && (
        <div className="flex items-center gap-2 relative">
          <ResolutionDropdown
            resolution={flux2ProResolution}
            onResolutionChange={(val) =>
              setFlux2ProResolution(val as "1K" | "2K")
            }
            options={["1K", "2K"]}
            dropdownId="flux2ProResolution"
          />
        </div>
      )}
      {selectedModel === "qwen-image-edit-2512" && (
        <div className="flex items-center gap-2 relative">
          <ResolutionDropdown
            resolution={qwenResolution}
            onResolutionChange={(val) => setQwenResolution(val as "1K" | "2K")}
            options={["1K", "2K"]}
            dropdownId="qwen2512Resolution"
          />
        </div>
      )}
      {selectedModel === "seedream-4.5" && (
        <div className="flex items-center gap-2 relative">
          <ResolutionDropdown
            resolution={seedream45Resolution}
            onResolutionChange={(val) =>
              setSeedream45Resolution(val as "2K" | "4K")
            }
            options={["2K", "4K"]}
            dropdownId="seedream45Resolution"
            optionCredits={seedream45ResolutionCredits as any}
          />
        </div>
      )}
      {selectedModel === "seedream-v4" && (
        <div className="flex items-center gap-2 relative">
          <ResolutionDropdown
            resolution={seedreamSize}
            onResolutionChange={(val) =>
              setSeedreamSize(val as "1K" | "2K" | "4K" | "custom")
            }
            options={["1K", "2K", "4K", "custom"]}
            dropdownId="seedreamSize"
          />
          {seedreamSize === "custom" && (
            <>
              <input
                type="number"
                min={1024}
                max={4096}
                value={seedreamWidth}
                onChange={(e) =>
                  setSeedreamWidth(Number(e.target.value) || 2048)
                }
                placeholder="Width"
                className="h-[32px] w-24 px-3 rounded-lg text-[13px] ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/40"
              />
              <input
                type="number"
                min={1024}
                max={4096}
                value={seedreamHeight}
                onChange={(e) =>
                  setSeedreamHeight(Number(e.target.value) || 2048)
                }
                placeholder="Height"
                className="h-[32px] w-24 px-3 rounded-lg text-[13px] ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/40"
              />
            </>
          )}
        </div>
      )}
      {selectedModel === "seedream-5-lite" && (
        <div className="flex items-center gap-2 relative">
          <ResolutionDropdown
            resolution={seedream5LiteResolution}
            onResolutionChange={(val) =>
              setSeedream5LiteResolution(val as "2K" | "3K")
            }
            options={["2K", "3K"]}
            dropdownId={ids.seedream5Lite}
            optionCredits={seedream5LiteResolutionCredits as any}
          />
        </div>
      )}
      {selectedModel === "new-turbo-model" && (
        <div className="flex items-center gap-2 relative">
          <ZTurboOutputFormatDropdown
            outputFormat={zTurboOutputFormat}
            onOutputFormatChange={(val) => setZTurboOutputFormat(val)}
            dropdownId="zTurboOutputFormat"
          />
        </div>
      )}
      {(selectedModel === "openai/gpt-image-1.5" ||
        selectedModel === "openai/gpt-image-2") && (
        <>
          <div className="flex items-center gap-2 relative">
            <QualityDropdown
              model={
                selectedModel as "openai/gpt-image-1.5" | "openai/gpt-image-2"
              }
              quality={gptImage15Quality}
              onQualityChange={(val) =>
                setGptImage15Quality(val as "low" | "medium" | "high" | "auto")
              }
              dropdownId="gptImage15Quality"
            />
          </div>
        </>
      )}
    </>
  );
}

export const PromptDockParameterControls = memo(PromptDockParameterControlsComponent);
