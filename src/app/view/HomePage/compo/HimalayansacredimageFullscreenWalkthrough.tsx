"use client";

import React from "react";
import { HimalayansacredimageModal } from "@/components/himalayansacredimage";

export default function HimalayansacredimageFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <HimalayansacredimageModal isOpen={isOpen} onClose={onClose} />;
}
