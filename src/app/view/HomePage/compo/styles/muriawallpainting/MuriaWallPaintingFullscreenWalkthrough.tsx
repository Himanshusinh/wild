"use client";

import React from "react";
import { MuriaWallPaintingModal } from "@/components/muriawallpainting";

export default function MuriaWallPaintingFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <MuriaWallPaintingModal isOpen={isOpen} onClose={onClose} />;
}

