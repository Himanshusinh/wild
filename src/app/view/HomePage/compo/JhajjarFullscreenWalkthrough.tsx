"use client";

import React from "react";
import { JhajjarModal } from "@/components/jhajjar";

export default function JhajjarFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <JhajjarModal isOpen={isOpen} onClose={onClose} />;
}
