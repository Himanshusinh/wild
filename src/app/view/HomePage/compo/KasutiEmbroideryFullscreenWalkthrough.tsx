"use client";

import React from "react";
import { KasutiEmbroideryModal } from "@/components/kasutiembroidery";

export default function KasutiEmbroideryFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KasutiEmbroideryModal isOpen={isOpen} onClose={onClose} />;
}

