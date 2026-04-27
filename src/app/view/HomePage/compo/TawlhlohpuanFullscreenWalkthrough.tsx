"use client";

import React from "react";
import { TawlhlohpuanModal } from "@/components/tawlhlohpuan";

export default function TawlhlohpuanFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <TawlhlohpuanModal isOpen={isOpen} onClose={onClose} />;
}
