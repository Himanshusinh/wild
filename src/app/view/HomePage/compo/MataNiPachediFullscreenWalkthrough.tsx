"use client";

import React from "react";
import { MataNiPachediModal } from "@/components/matanipachedi";

interface MataNiPachediFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MataNiPachediFullscreenWalkthrough({
  isOpen,
  onClose,
}: MataNiPachediFullscreenWalkthroughProps) {
  return <MataNiPachediModal isOpen={isOpen} onClose={onClose} />;
}
