"use client";

import React from "react";
import { BastarWoodcraftModal } from "@/components/bastarwoodcraft";

export default function BastarWoodcraftFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <BastarWoodcraftModal isOpen={isOpen} onClose={onClose} />;
}

