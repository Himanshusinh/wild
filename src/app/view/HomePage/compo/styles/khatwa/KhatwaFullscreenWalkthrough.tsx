"use client";

import React from "react";
import { KhatwaModal } from "@/components/khatwa";

interface KhatwaFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KhatwaFullscreenWalkthrough({
  isOpen,
  onClose,
}: KhatwaFullscreenWalkthroughProps) {
  return <KhatwaModal isOpen={isOpen} onClose={onClose} />;
}
