"use client";

import React from "react";
import dynamic from "next/dynamic";
import { HistoryEntry } from "@/types/history";
import AssetViewerModal from "@/components/AssetViewerModal";
import ImageGenerationGuide from "../ImageGenerationGuide";
import type { Character } from "../CharacterModal";

const ImagePreviewModal = dynamic(() => import("../ImagePreviewModal"), {
  ssr: false,
});
const UpscalePopup = dynamic(() => import("../UpscalePopup"), { ssr: false });
const RemoveBgPopup = dynamic(() => import("../RemoveBgPopup"), { ssr: false });
const EditPopup = dynamic(() => import("../EditPopup"), { ssr: false });
const UploadModal = dynamic(() => import("../UploadModal"), { ssr: false });
const CharacterModal = dynamic(() => import("../CharacterModal"), {
  ssr: false,
});

export type InputBoxLayerModalsProps = {
  preview: { entry: HistoryEntry; image: any } | null;
  onClosePreview: () => void;
  assetViewer: {
    isOpen: boolean;
    assetUrl: string;
    assetType: "image" | "video" | "audio";
    title: string;
  };
  onCloseAssetViewer: () => void;
  isUpscaleOpen: boolean;
  onCloseUpscale: () => void;
  isRemoveBgOpen: boolean;
  onCloseRemoveBg: () => void;
  isInlineEditImagePage: boolean;
  isEditOpen: boolean;
  onCloseEdit: () => void;
  onEditUpscale: () => void;
  onEditRemoveBg: () => void;
  isUploadOpen: boolean;
  onCloseUpload: () => void;
  uploadRemainingSlots: number;
  onUploadAdd: (urls: string[]) => void;
  isCharacterModalOpen: boolean;
  onCloseCharacter: () => void;
  onCharacterAdd: (character: Character) => void;
  onCharacterRemove: (characterId: string) => void;
  selectedCharacters: Character[];
  isGuideModalOpen: boolean;
  onCloseGuide: () => void;
  uploadedImages: string[];
  refreshAllHistory: () => void;
};

export function InputBoxLayerModals({
  preview,
  onClosePreview,
  assetViewer,
  onCloseAssetViewer,
  isUpscaleOpen,
  onCloseUpscale,
  isRemoveBgOpen,
  onCloseRemoveBg,
  isInlineEditImagePage,
  isEditOpen,
  onCloseEdit,
  onEditUpscale,
  onEditRemoveBg,
  isUploadOpen,
  onCloseUpload,
  uploadRemainingSlots,
  onUploadAdd,
  isCharacterModalOpen,
  onCloseCharacter,
  onCharacterAdd,
  onCharacterRemove,
  selectedCharacters,
  isGuideModalOpen,
  onCloseGuide,
  uploadedImages,
  refreshAllHistory,
}: InputBoxLayerModalsProps) {
  return (
    <>
      {/* sentinel moved inside scroll container */}
      {/* Lazy loaded modals - only render when needed for better performance */}
      {preview && (
        <ImagePreviewModal preview={preview} onClose={onClosePreview} />
      )}

      {/* Asset Viewer Modal for uploaded assets */}
      <AssetViewerModal
        isOpen={assetViewer.isOpen}
        onClose={onCloseAssetViewer}
        assetUrl={assetViewer.assetUrl}
        assetType={assetViewer.assetType}
        title={assetViewer.title}
      />
      {isUpscaleOpen && (
        <UpscalePopup
          isOpen={isUpscaleOpen}
          onClose={onCloseUpscale}
          defaultImage={uploadedImages[0] || null}
          onCompleted={refreshAllHistory}
        />
      )}
      {isRemoveBgOpen && (
        <RemoveBgPopup
          isOpen={isRemoveBgOpen}
          onClose={onCloseRemoveBg}
          defaultImage={uploadedImages[0] || null}
          onCompleted={refreshAllHistory}
        />
      )}
      {!isInlineEditImagePage && isEditOpen && (
        <EditPopup
          isOpen={isEditOpen}
          onClose={onCloseEdit}
          onUpscale={onEditUpscale}
          onRemoveBg={onEditRemoveBg}
          onResize={() => {
            const dropdown = document.querySelector(
              "[data-frame-size-dropdown]",
            ) as HTMLElement | null;
            if (dropdown) dropdown.click();
          }}
        />
      )}

      {/* Upload Modal - Lazy loaded */}
      {!isInlineEditImagePage && isUploadOpen && (
        <UploadModal
          isOpen={isUploadOpen}
          onClose={onCloseUpload}
          persistLocalDeviceUploads={true}
          remainingSlots={uploadRemainingSlots}
          onAdd={onUploadAdd}
        />
      )}

      {/* Character Modal - Lazy loaded */}
      {!isInlineEditImagePage && isCharacterModalOpen && (
        <CharacterModal
          isOpen={isCharacterModalOpen}
          onClose={onCloseCharacter}
          onAdd={onCharacterAdd}
          onRemove={onCharacterRemove}
          selectedCharacters={selectedCharacters}
          maxCharacters={10}
        />
      )}

      {/* Guide Modal - shows when info button is clicked */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={onCloseGuide}
          />
          <div className="relative z-10 w-full max-w-[1500px] max-h-[90vh] overflow-y-auto bg-transparent rounded-xl">
            <button
              onClick={onCloseGuide}
              className="absolute md:top-4 -top-0 md:right-4 right-0 z-20 md:w-8 md:h-8 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close guide"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <ImageGenerationGuide />
          </div>
        </div>
      )}
    </>
  );
}
