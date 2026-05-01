"use client";

import React from "react";
import { LambaniEmbroideryModal } from "@/components/lambaniembroidery";

export default function LambaniEmbroideryFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <LambaniEmbroideryModal isOpen={isOpen} onClose={onClose} />;
}

