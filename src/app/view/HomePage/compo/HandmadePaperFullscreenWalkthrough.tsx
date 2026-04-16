"use client";

import React from "react";
import { HandmadePaperModal } from "@/components/handmadepaper";

export default function HandmadePaperFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <HandmadePaperModal isOpen={isOpen} onClose={onClose} />;
}

