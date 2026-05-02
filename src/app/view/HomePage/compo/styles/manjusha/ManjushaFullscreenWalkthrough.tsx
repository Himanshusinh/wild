"use client";

import React from "react";
import { ManjushaModal } from "@/components/manjusha";

interface ManjushaFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManjushaFullscreenWalkthrough({
  isOpen,
  onClose,
}: ManjushaFullscreenWalkthroughProps) {
  return <ManjushaModal isOpen={isOpen} onClose={onClose} />;
}
