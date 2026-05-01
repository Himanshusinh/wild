"use client";

import React from "react";
import { KosaModal } from "@/components/kosa";

interface KosaFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KosaFullscreenWalkthrough({
  isOpen,
  onClose,
}: KosaFullscreenWalkthroughProps) {
  return <KosaModal isOpen={isOpen} onClose={onClose} />;
}
