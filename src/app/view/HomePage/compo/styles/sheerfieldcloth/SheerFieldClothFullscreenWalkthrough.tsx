"use client";

import React from "react";
import { SheerFieldClothModal } from "@/components/sheerfieldcloth";

export default function SheerFieldClothFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <SheerFieldClothModal isOpen={isOpen} onClose={onClose} />;
}

