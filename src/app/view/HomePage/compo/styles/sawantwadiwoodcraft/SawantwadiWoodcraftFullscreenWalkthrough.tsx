"use client";

import React from "react";
import { SawantwadiWoodcraftModal } from "@/components/sawantwadiwoodcraft";

export default function SawantwadiWoodcraftFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <SawantwadiWoodcraftModal isOpen={isOpen} onClose={onClose} />;
}

