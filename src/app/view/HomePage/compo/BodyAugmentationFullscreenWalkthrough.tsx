"use client";

import React from "react";
import { BodyAugmentationModal } from "@/components/bodyaugmentation";

export default function BodyAugmentationFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <BodyAugmentationModal isOpen={isOpen} onClose={onClose} />;
}

