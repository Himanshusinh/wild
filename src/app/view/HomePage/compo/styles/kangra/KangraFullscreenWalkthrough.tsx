"use client";

import React from "react";
import { KangraModal } from "@/components/kangra";

interface KangraFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KangraFullscreenWalkthrough({
  isOpen,
  onClose,
}: KangraFullscreenWalkthroughProps) {
  return <KangraModal isOpen={isOpen} onClose={onClose} />;
}
