"use client";

import React from "react";
import { KutchModal } from "@/components/kutch";

interface KutchFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KutchFullscreenWalkthrough({
  isOpen,
  onClose,
}: KutchFullscreenWalkthroughProps) {
  return <KutchModal isOpen={isOpen} onClose={onClose} />;
}
