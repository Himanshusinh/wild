"use client";

import React from "react";
import { BhagalpurSilkModal } from "@/components/bhagalpursilk";

export default function BhagalpurSilkFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <BhagalpurSilkModal isOpen={isOpen} onClose={onClose} />;
}

