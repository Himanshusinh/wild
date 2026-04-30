"use client";

import React from "react";
import { WoodcarvingModal } from "@/components/woodcarving";

export default function WoodcarvingFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <WoodcarvingModal isOpen={isOpen} onClose={onClose} />;
}
