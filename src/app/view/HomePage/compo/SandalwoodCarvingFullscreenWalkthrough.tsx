"use client";

import React from "react";
import { SandalwoodCarvingModal } from "@/components/sandalwoodcarving";

export default function SandalwoodCarvingFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <SandalwoodCarvingModal isOpen={isOpen} onClose={onClose} />;
}

