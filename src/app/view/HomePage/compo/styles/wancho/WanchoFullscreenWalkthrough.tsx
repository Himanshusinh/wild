"use client";

import React from "react";
import { WanchoModal } from "@/components/wancho";

export default function WanchoFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <WanchoModal isOpen={isOpen} onClose={onClose} />;
}

