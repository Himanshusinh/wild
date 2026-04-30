"use client";

import React from "react";
import { BellMetalRitualsModal } from "@/components/bellmetalrituals";

export default function BellMetalRitualsFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <BellMetalRitualsModal isOpen={isOpen} onClose={onClose} />;
}

