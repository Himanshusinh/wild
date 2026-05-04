"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { getInputImageLimitForModel } from "./modelImageLimits";

export type InputBoxReferenceAttachmentsProps = {
  isInlineEditImagePage: boolean;
  uploadedImages: string[];
  selectedCharacters: any[];
  selectedModel: string;
  onRemoveCharacter: (characterId: string) => void;
  onRemoveUploadedImageAtIndex: (index: number) => void;
  onViewUploadedImage: (url: string, zeroBasedIndex: number) => void;
};

/**
 * Mobile + desktop strips for reference images and characters above the prompt dock.
 * Markup and classes match the previous inline InputBox implementation.
 */
export function InputBoxReferenceAttachments({
  isInlineEditImagePage,
  uploadedImages,
  selectedCharacters,
  selectedModel,
  onRemoveCharacter,
  onRemoveUploadedImageAtIndex,
  onViewUploadedImage,
}: InputBoxReferenceAttachmentsProps) {
  if (isInlineEditImagePage) return null;
  if (uploadedImages.length === 0 && selectedCharacters.length === 0)
    return null;

  const limit = getInputImageLimitForModel(selectedModel);

  return (
    <>
      {/* Mobile-only: Selected images/characters grid above input box */}
      <div className="md:hidden fixed bottom-[147px] left-1/2 -translate-x-1/2 w-[96%] max-w-[96%] z-[49] px-2 pb-1">
        <div className="grid grid-cols-5 gap-1 max-h-[100vh] overflow-y-auto overflow-x-hidden pt-3 px-0.5">
          {/* Combine characters and images for display */}
          {[
            ...selectedCharacters.map((char: any, idx: number) => ({
              type: "character" as const,
              data: char,
              index: idx,
            })),
            ...uploadedImages.map((img: string, idx: number) => ({
              type: "image" as const,
              data: img,
              index: idx,
            })),
          ]
            .slice(0, limit)
            .map((item: any) => {
              if (item.type === "character") {
                return (
                  <div
                    key={`char-${item.data.id}`}
                    className="relative group aspect-square flex-shrink-0"
                  >
                    <div
                      className="w-full h-full rounded-md overflow-hidden ring-1 ring-white/20 cursor-pointer transition-transform duration-200 hover:z-20 group-hover:z-20 hover:scale-110"
                      title={`Character: ${item.data.name}`}
                    >
                      <img
                        src={item.data.frontImageUrl}
                        alt={item.data.name}
                        aria-hidden="true"
                        decoding="async"
                        className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
                      />
                    </div>
                    <div className="pointer-events-none absolute -top-1.5 -left-1.5 z-20">
                      <div className="px-1 pl-1.5 pt-1 pb-0.5 rounded-md text-[8px] font-semibold bg-white/90 text-black shadow">
                        C
                      </div>
                    </div>
                    <button
                      aria-label={`Remove character ${item.data.name}`}
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 drop-shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCharacter(item.data.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              }
              return (
                <div
                  key={`img-${item.index}`}
                  className="relative group aspect-square flex-shrink-0"
                >
                  <div
                    data-image-index={item.index}
                    title={`Image ${item.index + 1}`}
                    className="w-full h-full rounded-md overflow-hidden ring-1 ring-white/20 cursor-pointer transition-transform duration-200 hover:z-20 group-hover:z-20 hover:scale-110"
                    onClick={() => {
                      onViewUploadedImage(item.data, item.index);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.data}
                      alt=""
                      aria-hidden="true"
                      decoding="async"
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
                    />
                  </div>
                  <div className="pointer-events-none absolute -top-1.5 -left-1.5 z-20">
                    <div className="px-1 pl-1.5 pt-1 pb-0.5 rounded-md text-[8px] font-semibold bg-white/90 text-black shadow">
                      {item.index + 1}
                    </div>
                  </div>
                  <button
                    aria-label="Remove reference"
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 drop-shadow"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveUploadedImageAtIndex(item.index);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* Desktop-only: Selected images/characters single-row above input box */}
      <div className="hidden md:flex  fixed bottom-[155px] left-1/2 -translate-x-1/2 w-[90%] max-w-[900px] z-[50] pt-3">
        <div
          className={`w-full ${
            [...selectedCharacters, ...uploadedImages].length > 14
              ? "grid [grid-template-columns:repeat(7,3.5rem)] gap-1 justify-start"
              : "flex flex-row gap-2 pl-2 overflow-x-auto no-scrollbar justify-start"
          } pt-3 pb-1`}
        >
          {[
            ...selectedCharacters.map((character: any) => ({
              type: "character" as const,
              data: character,
              key: `char-${character.id}`,
            })),
            ...uploadedImages.map((u: string, i: number) => ({
              type: "image" as const,
              data: u,
              index: i,
              key: `img-${i}`,
            })),
          ]
            .slice(0, limit)
            .map((item: any) => {
              if (item.type === "character") {
                return (
                  <div
                    key={item.key}
                    className="relative group flex-shrink-0"
                  >
                    <div
                      className="w-14 h-14 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer bg-black/40 hover:scale-105 transition-transform"
                      title={`Character: ${item.data.name}`}
                    >
                      <img
                        src={item.data.frontImageUrl}
                        alt={item.data.name}
                        decoding="async"
                        className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
                      />
                    </div>
                    <div className="pointer-events-none absolute -top-1.5 -left-1.5 z-20">
                      <div className="px-1 pl-1.5 pt-1 pb-0.5 rounded-md text-[8px] font-semibold bg-white/90 text-black shadow">
                        C
                      </div>
                    </div>
                    <button
                      aria-label="Remove character"
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 drop-shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCharacter(item.data.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={item.key}
                  className="relative group flex-shrink-0"
                >
                  <div
                    className="w-14 h-14 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer bg-black/40 hover:scale-105 transition-transform"
                    onClick={() => {
                      onViewUploadedImage(item.data, item.index);
                    }}
                  >
                    <img
                      src={item.data}
                      alt=""
                      decoding="async"
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
                    />
                  </div>
                  <div className="pointer-events-none absolute -top-1.5 -left-1.5 z-20">
                    <div className="px-1 pl-1.5 pt-1 pb-0.5 rounded-md text-[8px] font-semibold bg-white/90 text-black shadow">
                      {item.index + 1}
                    </div>
                  </div>
                  <button
                    aria-label="Remove image"
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 drop-shadow"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveUploadedImageAtIndex(item.index);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}
