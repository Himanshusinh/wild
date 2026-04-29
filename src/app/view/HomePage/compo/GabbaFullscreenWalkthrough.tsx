"use client";

import React from "react";
import { GabbaModal } from "@/components/gabba";

export default function GabbaFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <GabbaModal isOpen={isOpen} onClose={onClose} />;
}
