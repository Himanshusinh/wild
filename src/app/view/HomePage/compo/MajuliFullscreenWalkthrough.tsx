"use client";

import React from "react";
import { MajuliModal } from "@/components/majuli";

interface MajuliFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MajuliFullscreenWalkthrough({
  isOpen,
  onClose,
}: MajuliFullscreenWalkthroughProps) {
  return <MajuliModal isOpen={isOpen} onClose={onClose} />;
}
