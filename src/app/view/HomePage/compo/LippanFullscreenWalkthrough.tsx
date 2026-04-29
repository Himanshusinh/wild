"use client";

import React from "react";
import { LippanModal } from "@/components/lippan";

interface LippanFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LippanFullscreenWalkthrough({
  isOpen,
  onClose,
}: LippanFullscreenWalkthroughProps) {
  return <LippanModal isOpen={isOpen} onClose={onClose} />;
}
