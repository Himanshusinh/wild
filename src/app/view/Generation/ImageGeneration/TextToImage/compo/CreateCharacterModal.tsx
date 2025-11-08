"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Character } from "./CharacterModal";
import UploadModal from "./UploadModal";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { loadHistory, loadMoreHistory } from "@/store/slices/historySlice";

type CreateCharacterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: (character: Character) => void;
  initialFrontImage?: string | null;
  initialLeftImage?: string | null;
  initialRightImage?: string | null;
  embedded?: boolean;
};

const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({
  isOpen,
  onClose,
  onCharacterCreated,
  initialFrontImage,
  initialLeftImage,
  initialRightImage,
  embedded = false,
}) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [leftImage, setLeftImage] = useState<string | null>(null);
  const [rightImage, setRightImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Upload modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadModalType, setUploadModalType] = useState<'front' | 'left' | 'right'>('front');
  
  // History entries for UploadModal
  const historyEntries = useAppSelector((state: any) => {
    const allEntries = state.history?.entries || [];
    // Filter to show only text-to-image generations for the upload modal
    return allEntries.filter((entry: any) => entry.generationType === 'text-to-image' && entry.status === 'completed' && entry.images && entry.images.length > 0);
  });
  const hasMore = useAppSelector((state: any) => state.history?.hasMore || false);
  const loading = useAppSelector((state: any) => state.history?.loading || false);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setFrontImage(null);
      setLeftImage(null);
      setRightImage(null);
      setError(null);
      setIsGenerating(false);
      setUploadModalOpen(false);
    }
  }, [isOpen]);

  // Load history entries when modal opens
  useEffect(() => {
    if (isOpen && uploadModalOpen) {
      dispatch(loadHistory({
        filters: { generationType: 'text-to-image' },
        paginationParams: { limit: 20 }
      }) as any);
    }
  }, [isOpen, uploadModalOpen, dispatch]);

  // Prefill when initial images provided
  useEffect(() => {
    if (isOpen) {
      if (typeof initialFrontImage !== "undefined") setFrontImage(initialFrontImage || null);
      if (typeof initialLeftImage !== "undefined") setLeftImage(initialLeftImage || null);
      if (typeof initialRightImage !== "undefined") setRightImage(initialRightImage || null);
    }
  }, [isOpen, initialFrontImage, initialLeftImage, initialRightImage]);

  if (!isOpen) return null;

  const handleOpenUploadModal = (type: 'front' | 'left' | 'right') => {
    setUploadModalType(type);
    setUploadModalOpen(true);
  };

  const handleUploadModalAdd = (urls: string[]) => {
    if (urls.length === 0) return;
    const selectedUrl = urls[0]; // Take first selected image
    
    if (uploadModalType === 'front') {
      setFrontImage(selectedUrl);
    } else if (uploadModalType === 'left') {
      setLeftImage(selectedUrl);
    } else if (uploadModalType === 'right') {
      setRightImage(selectedUrl);
    }
    
    setUploadModalOpen(false);
  };

  const handleGenerate = async () => {
    if (!name.trim()) {
      setError("Character name is required");
      return;
    }
    if (!frontImage) {
      setError("Front image is required");
      return;
    }
    if (!leftImage) {
      setError("Left side image is required");
      return;
    }
    if (!rightImage) {
      setError("Right side image is required");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const characterPrompt = `${name.trim()}, highly realistic and natural-looking portrait, square format, professional photography, detailed facial features, natural lighting, high quality, photorealistic, edge-to-edge character, no borders, no frames, no white padding, no background frames, seamless edges, full frame character, no margins, no white space around subject`;
      const uploadedImages: string[] = [frontImage, leftImage, rightImage];

      const model = "gemini-25-flash-image";
      const api = (await import("@/lib/axiosInstance")).getApiClient();
      const payload = {
        prompt: characterPrompt,
        model,
        n: 1,
        aspect_ratio: "1:1",
        frameSize: "1:1",
        uploadedImages,
        generationType: "text-to-character",
        output_format: "jpeg",
        isPublic: false,
        characterName: name.trim(),
      };

      const { data } = await api.post("/api/fal/generate", payload);
      const result = data?.data || data;

      if (!result.images || result.images.length === 0) throw new Error("No character image generated");

      const character: Character = {
        id: result.historyId || `char-${Date.now()}`,
        name: name.trim(),
        frontImageUrl: result.images[0].url,
        leftImageUrl: leftImage || undefined,
        rightImageUrl: rightImage || undefined,
        createdAt: new Date().toISOString(),
      };

      onCharacterCreated(character);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create character");
    } finally {
      setIsGenerating(false);
    }
  };

  // Inner dialog (no overlay)
  const dialog = (
    <div className="w-auto max-w-3xl bg-black/70 backdrop-blur-xl ring-1 ring-white/20 rounded-lg overflow-hidden shadow-2xl md:min-h-[70vh] min-h-[95vh] overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-white text-lg font-semibold">Create New Character</h2>
        <button className="text-white/80 hover:text-white" onClick={onClose}>✕</button>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-white/90 text-sm font-medium mb-2">
            Character Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter character name"
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>

        <div>
          <label className="block text-white/90 text-sm font-medium mb-2">
            Front Photo <span className="text-red-400">*</span>
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-white/60 transition-colors md:max-h-auto h-auto w-auto md:max-w-full ${
              frontImage ? "border-white/40" : "border-white/30"
            }`}
            onClick={() => handleOpenUploadModal('front')}
          >
            {frontImage ? (
              <div className="relative w-full aspect-square max-w-xs mx-auto rounded-lg overflow-hidden ring-1 ring-white/20 md:max-h-[200px] max-h-[150px] md:max-w-[200px] max-w-[150px]">
                <Image src={frontImage} alt="Front" fill className="object-cover " />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFrontImage(null);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <path d="M3 6h18" />
                    <path d="M8 6v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-white/60">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                <div className="mt-2 text-sm">Click to upload front photo</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Upload from Left Side <span className="text-red-400">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-white/60 transition-colors ${
                leftImage ? "border-white/40" : "border-white/30"
              }`}
              onClick={() => handleOpenUploadModal('left')}
            >
              {leftImage ? (
                <div className="relative w-full aspect-square rounded-lg overflow-hidden ring-1 ring-white/20">
                  <Image src={leftImage} alt="Left" fill className="object-cover" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLeftImage(null);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 flex items-center justify-center"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                      <path d="M3 6h18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-white/60">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  <div className="mt-1 text-xs">Click to upload</div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Upload from Right Side <span className="text-red-400">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-white/60 transition-colors ${
                rightImage ? "border-white/40" : "border-white/30"
              }`}
              onClick={() => handleOpenUploadModal('right')}
            >
              {rightImage ? (
                <div className="relative w-full aspect-square rounded-lg overflow-hidden ring-1 ring-white/20">
                  <Image src={rightImage} alt="Right" fill className="object-cover" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRightImage(null);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 flex items-center justify-center"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                      <path d="M3 6h18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-white/60">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  <div className="mt-1 text-xs">Click to upload</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <button
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGenerate}
            disabled={isGenerating || !name.trim() || !frontImage || !leftImage || !rightImage}
          >
            {isGenerating ? "Creating..." : "Create Character"}
          </button>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <>
        {dialog}
        {/* Upload Modal */}
        <UploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          historyEntries={historyEntries as any}
          remainingSlots={1}
          hasMore={hasMore}
          loading={loading}
          onLoadMore={async () => {
            try {
              if (!hasMore || loading) return;
              await (dispatch as any)(loadMoreHistory({
                filters: { generationType: 'text-to-image' },
                paginationParams: { limit: 20 }
              })).unwrap();
            } catch {}
          }}
          onAdd={handleUploadModalAdd}
        />
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="absolute inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          {dialog}
        </div>
      </div>
      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        historyEntries={historyEntries as any}
        remainingSlots={1}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={async () => {
          try {
            if (!hasMore || loading) return;
            await (dispatch as any)(loadMoreHistory({
              filters: { generationType: 'text-to-image' },
              paginationParams: { limit: 20 }
            })).unwrap();
          } catch {}
        }}
        onAdd={handleUploadModalAdd}
      />
    </>
  );
};

export default CreateCharacterModal;

