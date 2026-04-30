"use client";

import React from "react";
import { KushmandimaskModal } from "@/components/kushmandimask";

export default function KushmandimaskFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KushmandimaskModal isOpen={isOpen} onClose={onClose} />;
}
