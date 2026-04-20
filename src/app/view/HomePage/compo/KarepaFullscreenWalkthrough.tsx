"use client";

import React from "react";
import { KarepaModal } from "@/components/karepa";

interface KarepaFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KarepaFullscreenWalkthrough({
  isOpen,
  onClose,
}: KarepaFullscreenWalkthroughProps) {
  return <KarepaModal isOpen={isOpen} onClose={onClose} />;
}
