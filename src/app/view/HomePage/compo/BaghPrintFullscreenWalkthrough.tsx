"use client";

import React from "react";
import { BaghPrintModal } from "@/components/baghprint";

export default function BaghPrintFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <BaghPrintModal isOpen={isOpen} onClose={onClose} />;
}

