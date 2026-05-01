"use client";

import React from "react";
import { GodnaArtModal } from "@/components/godnaart";

export default function GodnaArtFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <GodnaArtModal isOpen={isOpen} onClose={onClose} />;
}

