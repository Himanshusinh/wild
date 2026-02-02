
import React from "react";
import Image from "next/image";
import { FilePlus2, FilePlay } from 'lucide-react';
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
  setUploadModalType: (type: 'reference' | 'image' | 'video') => void;
  setUploadModalTarget: (target: 'first_frame' | 'last_frame') => void;
  setIsUploadModalOpen: (open: boolean) => void;
  uploadedImages: string[];
  lastFrameImage?: string;
  selectedResolution?: string;
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
  selectedResolution
}) => {
  return (
    <>
      <div className="flex items-center gap-1 h-[40px]">
        {/* Camera Movements */}
        {(
          (generationMode === "text_to_video" && selectedModel === "T2V-01-Director") ||
          (generationMode === "image_to_video" && selectedModel === "I2V-01-Director")
        ) && (
            <CameraMovementButton
              selectedCameraMovements={selectedCameraMovements}
              setSelectedCameraMovements={setSelectedCameraMovements}
              onAddMovement={onAddMovement}
            />
          )}

        {/* References Upload */}
        {(currentModelCapabilities.requiresReferenceImage) && (
          <div className="relative">
            <button
              className={`py-2 rounded-xl transition-all duration-200 cursor-pointer group relative ${(generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                (generationMode === "video_to_video" && references.length >= 4)
                ? 'opacity-50 cursor-not-allowed'
                : ''
                }`}
              onClick={() => {
                setUploadModalType('reference');
                setIsUploadModalOpen(true);
              }}
              disabled={(generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                (generationMode === "video_to_video" && references.length >= 4)}
            >
              <FilePlus2
                size={22}
                className={`transition-all duration-200 ${(generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                  (generationMode === "video_to_video" && references.length >= 4)
                  ? 'text-gray-400'
                  : 'text-green-400 hover:text-green-300 hover:scale-110'
                  }`}
              />
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/80 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                {generationMode === "image_to_video" && selectedModel === "S2V-01" ? 'Upload character reference (1 max)' : 'Upload references'}
              </div>

              {/* References Count Badge */}
              {references.length > 0 && (
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${(generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                  (generationMode === "video_to_video" && references.length >= 4)
                  ? 'bg-red-500' : 'bg-green-500'
                  }`}>
                  <span className="text-xs text-white font-bold">{references.length}</span>
                </div>
              )}
            </button>

            {/* References Preview Popup */}
            {references.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 p-2 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 min-w-[200px]">
                <div className="text-xs text-white/60 mb-2">
                  {generationMode === "image_to_video" && selectedModel === "S2V-01"
                    ? `Character Reference (${references.length}/1)`
                    : `References (${references.length}/4)`
                  }
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
                      <span className="text-xs text-white/80 flex-1">Reference {index + 1}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeReference(index);
                        }}
                        className="w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        {currentModelCapabilities.supportsImageToVideo &&
          !selectedModel.includes("MiniMax") &&
          selectedModel !== "I2V-01-Director" &&
          selectedModel !== "S2V-01" && (
            <div className="relative">
              <button
                className="md:p-2 pt-2 pl-1 rounded-xl transition-all duration-200 cursor-pointer group relative"
                onClick={() => {
                  setUploadModalType('image');
                  setUploadModalTarget('first_frame');
                  setIsUploadModalOpen(true);
                }}
              >
                <div className="relative">
                  <FilePlus2 size={30} className={`rounded-md p-1.5 text-white transition-all bg-white/10 duration-200 group-hover:text-blue-300 group-hover:scale-110 ${uploadedImages.length > 0 ? 'text-blue-300 bg-white/20' : ''}`} />
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50"> First Frame </div>
                </div>
              </button>
            </div>
          )}

        {/* MiniMax/I2V Direct Image Upload */}
        {((selectedModel.includes("MiniMax") || selectedModel === "I2V-01-Director") &&
          (currentModelCapabilities.requiresFirstFrame || currentModelCapabilities.supportsImageToVideo)) && (
            <div className="relative">
              <button
                className="py-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                onClick={() => {
                  setUploadModalType('image');
                  setUploadModalTarget('first_frame');
                  setIsUploadModalOpen(true);
                }}
              >
                <div className="relative">
                  <FilePlus2 size={30} className={`rounded-md p-1.5 text-white transition-all bg-white/10 duration-200 group-hover:text-blue-300 group-hover:scale-110 ${uploadedImages.length > 0 ? 'text-blue-300 bg-white/20' : ''}`} />
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50"> First Frame </div>
                </div>
              </button>
            </div>
          )}

        {/* Arrow (First -> Last Frame) */}
        {(((selectedModel === "MiniMax-Hailuo-02") &&
          (selectedResolution === "768P" || selectedResolution === "1080P")) ||
          selectedModel.includes("veo3.1") ||
          selectedModel === "kling-o1" ||
          (selectedModel.includes('seedance') && !selectedModel.includes('pro-fast') && !selectedModel.includes('i2v'))) &&
          currentModelCapabilities.supportsImageToVideo && (
            <div className="flex items-center justify-center">
              <Image
                src="/icons/arrow-right-left.svg"
                alt="Arrow"
                width={14}
                height={14}
                className="opacity-80 mr-0"
              />
            </div>
          )}

        {/* Last Frame Upload */}
        {((((selectedModel === "MiniMax-Hailuo-02") &&
          (selectedResolution === "768P" || selectedResolution === "1080P")) ||
          selectedModel.includes("veo3.1") ||
          selectedModel === "kling-o1" ||
          (selectedModel.includes('seedance') && !selectedModel.includes('pro-fast') && !selectedModel.includes('i2v'))) &&
          currentModelCapabilities.supportsImageToVideo) && (
            <div className="relative">
              <button
                className="py-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                onClick={() => {
                  setUploadModalType('image');
                  setUploadModalTarget('last_frame');
                  setIsUploadModalOpen(true);
                }}
              >
                <div className="relative">
                  <FilePlus2 size={30} className={`rounded-md p-1.5 text-white transition-all bg-white/10 duration-200 group-hover:text-blue-300 group-hover:scale-110 ${lastFrameImage ? 'text-blue-300 bg-white/20' : ''}`} />
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50"> Last Frame (optional)</div>
                </div>
              </button>
            </div>
          )}

        {/* Video Upload */}
        {(currentModelCapabilities.supportsVideoToVideo || selectedModel === "wan-2.2-animate-replace") && (
          <div className="relative">
            <button
              className="py-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
              onClick={() => {
                setUploadModalType('video');
                setIsUploadModalOpen(true);
              }}
            >
              <div className="relative">
                <FilePlay
                  size={30}
                  className="rounded-md p-1.5 text-white transition-all bg-white/10 duration-200 group-hover:text-purple-300 group-hover:scale-110"
                />
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/80 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                  {selectedModel === "wan-2.2-animate-replace" && activeFeature === 'Animate' ? 'Upload video (mandatory)' : 'Upload video'}
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default InputActions;
