"use client";

import React from "react";
import { GanjifaModal } from "@/components/ganjifa";

export default function GanjifaFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <GanjifaModal isOpen={isOpen} onClose={onClose} />;
}
