"use client";

import React from "react";
import { WoodTempleCarvingModal } from "@/components/woodtemplecarving";

export default function WoodTempleCarvingFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <WoodTempleCarvingModal isOpen={isOpen} onClose={onClose} />;
}

