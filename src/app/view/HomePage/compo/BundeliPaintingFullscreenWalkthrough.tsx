"use client";

import React from "react";
import { BundeliPaintingModal } from "@/components/bundelipainting";

export default function BundeliPaintingFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <BundeliPaintingModal isOpen={isOpen} onClose={onClose} />;
}

