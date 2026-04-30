"use client";

import React from "react";
import { WroughtironModal } from "@/components/wroughtiron";

export default function WroughtironFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <WroughtironModal isOpen={isOpen} onClose={onClose} />;
}
