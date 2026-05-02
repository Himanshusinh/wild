"use client";

import React from "react";
import { TikuliArtModal } from "@/components/tikuliart";

export default function TikuliArtFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <TikuliArtModal isOpen={isOpen} onClose={onClose} />;
}

