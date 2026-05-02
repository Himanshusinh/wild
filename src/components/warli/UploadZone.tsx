"use client";

import React, { useRef } from "react";
import { Upload } from "lucide-react";

interface UploadZoneProps {
  uploadedImage: string | null;
  onUpload: (dataUrl: string) => void;
  disabled?: boolean;
}

export function UploadZone({ uploadedImage, onUpload, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFile = (file: File) => {
    if (disabled) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") onUpload(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        disabled={disabled}
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {uploadedImage ? (
        <div className="relative overflow-hidden rounded-xl border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={uploadedImage} alt="Reference" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => !disabled && onUpload("")}
            disabled={disabled}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white/50 backdrop-blur-sm transition hover:text-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          disabled={disabled}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (disabled) return;
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith("image/")) handleFile(file);
          }}
          className="flex w-full flex-col items-center gap-2.5 rounded-xl border border-dashed border-white/10 bg-transparent px-5 py-7 text-center transition hover:border-[#2F6BFF]/30 hover:bg-[#2F6BFF]/[0.04] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/25">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-white/55">Drop photo or click to upload</p>
            <p className="mt-0.5 text-[11px] text-white/25">PNG, JPG up to 10MB</p>
          </div>
        </button>
      )}
    </div>
  );
}
