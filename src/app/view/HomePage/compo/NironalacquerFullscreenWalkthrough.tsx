"use client";

import React from "react";
import { NironalacquerModal } from "@/components/nironalacquer";

export default function NironalacquerFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <NironalacquerModal isOpen={isOpen} onClose={onClose} />;
}
