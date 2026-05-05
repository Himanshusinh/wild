"use client";

import React, { useState } from "react";
import Image from "next/image";
import LoadingSpinner from "@/components/LoadingSpinner";

export const GifLoader: React.FC<{
  size?: number;
  alt?: string;
  className?: string;
}> = ({ size = 64, alt = "Loading", className }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center ${className || ""}`}
        style={{ width: size, height: size }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Image
      src="/styles/Logo.gif"
      alt={alt}
      width={size}
      height={size}
      className={className || "mx-auto"}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
};
