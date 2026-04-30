"use client";

import React from "react";
import { KinnauriModal } from "@/components/kinnauri";

interface KinnauriFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KinnauriFullscreenWalkthrough({
  isOpen,
  onClose,
}: KinnauriFullscreenWalkthroughProps) {
  return <KinnauriModal isOpen={isOpen} onClose={onClose} />;
}
