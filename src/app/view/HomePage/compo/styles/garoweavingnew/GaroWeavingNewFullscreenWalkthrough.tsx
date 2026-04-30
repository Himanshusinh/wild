"use client";

import React from "react";
import { GaroWeavingNewModal } from "@/components/garoweavingnew";

export default function GaroWeavingNewFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <GaroWeavingNewModal isOpen={isOpen} onClose={onClose} />;
}
