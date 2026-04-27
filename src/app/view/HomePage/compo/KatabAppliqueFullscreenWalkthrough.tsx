"use client";

import React from "react";
import { KatabAppliqueModal } from "@/components/katabapplique";

export default function KatabAppliqueFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KatabAppliqueModal isOpen={isOpen} onClose={onClose} />;
}

