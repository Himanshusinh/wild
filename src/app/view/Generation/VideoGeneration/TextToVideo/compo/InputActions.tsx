import React from "react";
import Image from "next/image";
import { FilePlus2, FilePlay } from "lucide-react";
import CameraMovementButton from "./CameraMovementButton";

interface InputActionsProps {
  generationMode: string;
  selectedModel: string;
  activeFeature: string;
  currentModelCapabilities: any;
  selectedCameraMovements: string[];
  setSelectedCameraMovements: (movements: string[]) => void;
  onAddMovement: (movement: string) => void;
  references: string[];
  removeReference: (index: number) => void;
  setUploadModalType: (type: "reference" | "image" | "video") => void;
  setUploadModalTarget: (target: "first_frame" | "last_frame") => void;
  setIsUploadModalOpen: (open: boolean) => void;
  uploadedImages: string[];
  lastFrameImage?: string;
  selectedResolution?: string;
  canSwapFrames?: boolean;
  onSwapFrames?: () => void;
}

const InputActions: React.FC<InputActionsProps> = ({
  generationMode,
  selectedModel,
  activeFeature,
  currentModelCapabilities,
  selectedCameraMovements,
  setSelectedCameraMovements,
  onAddMovement,
  references,
  removeReference,
  setUploadModalType,
  setUploadModalTarget,
  setIsUploadModalOpen,
  uploadedImages,
  lastFrameImage,
  selectedResolution,
  canSwapFrames = false,
  onSwapFrames,
}) => {
  const hasImageToVideoSupport =
    currentModelCapabilities?.supportsImageToVideo ||
    currentModelCapabilities?.requiresFirstFrame;
  const isSeedance2ReferenceModel =
    selectedModel === "seedance-2.0-r2v" ||
    selectedModel === "seedance-2.0-fast-r2v";
  const referenceLimit =
    generationMode === "image_to_video" && selectedModel === "S2V-01"
      ? 1
      : generationMode === "video_to_video"
        ? 4
        : isSeedance2ReferenceModel
          ? 9
          : 4;
  const supportsLastFrameUpload =
    ((selectedModel === "MiniMax-Hailuo-02" &&
      (selectedResolution === "768P" || selectedResolution === "1080P")) ||
      selectedModel.includes("veo3.1") ||
      selectedModel === "kling-o1" ||
      selectedModel.startsWith("ltx-2.3-fast") ||
      selectedModel.startsWith("ltx-2.3-pro") ||
      selectedModel === "seedance-2.0-t2v" ||
      selectedModel === "seedance-2.0-fast" ||
      selectedModel === "seedance-2.0-fast-i2v" ||
      (selectedModel.includes("seedance") &&
        selectedModel !== "seedance-2.0-t2v" &&
        !selectedModel.includes("pro-fast") &&
        !selectedModel.includes("i2v"))) &&
    hasImageToVideoSupport;

  return (
    <>
      <div className="flex items-center gap-0 h-[40px]">
        {/* Camera Movements */}
        {((generationMode === "text_to_video" &&
          selectedModel === "T2V-01-Director") ||
          (generationMode === "image_to_video" &&
            selectedModel === "I2V-01-Director")) && (
          <CameraMovementButton
            selectedCameraMovements={selectedCameraMovements}
            setSelectedCameraMovements={setSelectedCameraMovements}
            onAddMovement={onAddMovement}
          />
        )}

        {/* References Upload */}
        {(currentModelCapabilities.requiresReferenceImage ||
          isSeedance2ReferenceModel) && (
          <div className="relative">
            <button
              className={`p-1 rounded-lg transition-all duration-200 cursor-pointer peer relative flex items-center justify-center ${
                (generationMode === "image_to_video" &&
                  selectedModel === "S2V-01" &&
                  references.length >= 1) ||
                references.length >= referenceLimit
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-white/10"
              }`}
              onClick={() => {
                setUploadModalType("reference");
                setIsUploadModalOpen(true);
              }}
              disabled={
                (generationMode === "image_to_video" &&
                  selectedModel === "S2V-01" &&
                  references.length >= 1) ||
                references.length >= referenceLimit
              }
            >
              <FilePlus2
                size={16}
                className={`transition-all duration-200 ${
                  (generationMode === "image_to_video" &&
                    selectedModel === "S2V-01" &&
                    references.length >= 1) ||
                  references.length >= referenceLimit
                    ? "text-gray-400"
                    : "text-green-400"
                }`}
              />
            </button>
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">
              {generationMode === "image_to_video" && selectedModel === "S2V-01"
                ? "Upload character reference (1 max)"
                : isSeedance2ReferenceModel
                  ? `Upload references (${referenceLimit} max)`
                  : "Upload references"}
            </div>

            {/* References Count Badge */}
            {references.length > 0 && (
              <div
                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                  (generationMode === "image_to_video" &&
                    selectedModel === "S2V-01" &&
                    references.length >= 1) ||
                  references.length >= referenceLimit
                    ? "bg-red-500"
                    : "bg-green-500"
                }`}
              >
                <span className="text-xs text-white font-bold">
                  {references.length}
                </span>
              </div>
            )}

            {/* References Preview Popup */}
            {references.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 p-2 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 min-w-[200px]">
                <div className="text-xs text-white/60 mb-2">
                  {generationMode === "image_to_video" &&
                  selectedModel === "S2V-01"
                    ? `Character Reference (${references.length}/1)`
                    : `References (${references.length}/${referenceLimit})`}
                </div>
                <div className="space-y-2">
                  {references.map((ref, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10">
                        <img
                          src={ref}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs text-white/80 flex-1">
                        Reference {index + 1}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeReference(index);
                        }}
                        className="w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Upload */}
        {hasImageToVideoSupport &&
          !selectedModel.includes("MiniMax") &&
          selectedModel !== "I2V-01-Director" &&
          selectedModel !== "S2V-01" && (
            <div className="relative">
              <button
                className="p-1.5 md:p-0 rounded-lg transition-all duration-200 cursor-pointer peer relative flex items-center justify-center hover:bg-white/10"
                onClick={() => {
                  setUploadModalType("image");
                  setUploadModalTarget("first_frame");
                  setIsUploadModalOpen(true);
                }}
              >
                <FilePlus2
                  size={16}
                  className={`text-white transition-all duration-200 ${uploadedImages.length > 0 ? "text-blue-300" : ""}`}
                />
              </button>
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">
                {selectedModel === "seedance-2.0-t2v" ||
                selectedModel === "seedance-2.0-fast" ||
                selectedModel === "seedance-2.0-fast-i2v"
                  ? "Image"
                  : "First Frame"}
              </div>
            </div>
          )}

        {/* MiniMax/I2V Direct Image Upload */}
        {(selectedModel.includes("MiniMax") ||
          selectedModel === "I2V-01-Director") &&
          (currentModelCapabilities.requiresFirstFrame ||
            currentModelCapabilities.supportsImageToVideo) && (
            <div className="relative">
              <button
                className="p-1.5 md:p-0 rounded-lg transition-all duration-200 cursor-pointer peer relative flex items-center justify-center hover:bg-white/10"
                onClick={() => {
                  setUploadModalType("image");
                  setUploadModalTarget("first_frame");
                  setIsUploadModalOpen(true);
                }}
              >
                <FilePlus2
                  size={16}
                  className={`text-white transition-all duration-200 ${uploadedImages.length > 0 ? "text-blue-300" : ""}`}
                />
              </button>
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">
                First Frame
              </div>
            </div>
          )}

        {/* Arrow (First -> Last Frame) */}
        {supportsLastFrameUpload && (
          <div className="relative">
            <button
              type="button"
              aria-label="Swap first and last frame"
              className={`p-1 rounded-lg transition-all duration-200 peer relative flex items-center justify-center ${
                canSwapFrames
                  ? "cursor-pointer hover:bg-white/10"
                  : "cursor-not-allowed opacity-50"
              }`}
              onClick={() => {
                if (canSwapFrames) onSwapFrames?.();
              }}
              disabled={!canSwapFrames}
            >
              <Image
                src="/icons/arrow-right-left.svg"
                alt="Swap first and last frame"
                width={14}
                height={14}
                className="opacity-80 mr-0"
              />
            </button>
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">
              {canSwapFrames
                ? "Swap first and last frame"
                : "Upload both frames to swap"}
            </div>
          </div>
        )}

        {/* Last Frame Upload */}
        {supportsLastFrameUpload && (
          <div className="relative">
            <button
              className="p-1.5 md:p-0 rounded-lg transition-all duration-200 cursor-pointer peer relative flex items-center justify-center hover:bg-white/10"
              onClick={() => {
                setUploadModalType("image");
                setUploadModalTarget("last_frame");
                setIsUploadModalOpen(true);
              }}
            >
              <FilePlus2
                size={16}
                className={`text-white transition-all duration-200 ${lastFrameImage ? "text-blue-300" : ""}`}
              />
            </button>
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">
              Last Frame (optional)
            </div>
          </div>
        )}

        {/* Video Upload */}
        {(currentModelCapabilities.supportsVideoToVideo ||
          selectedModel === "wan-2.2-animate-replace" ||
          selectedModel.startsWith("ltx-2.3-pro") ||
          isSeedance2ReferenceModel) && (
          <div className="relative">
            <button
              className="p-1.5  md:pl-1 rounded-lg transition-all duration-200 cursor-pointer peer relative flex items-center justify-center hover:bg-white/10"
              onClick={() => {
                setUploadModalType("video");
                setIsUploadModalOpen(true);
              }}
            >
              <FilePlay
                size={16}
                className="text-white transition-all duration-200"
              />
            </button>
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">
              {selectedModel === "wan-2.2-animate-replace" &&
              activeFeature === "Animate"
                ? "Upload video (mandatory)"
                : "Upload video"}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InputActions;
