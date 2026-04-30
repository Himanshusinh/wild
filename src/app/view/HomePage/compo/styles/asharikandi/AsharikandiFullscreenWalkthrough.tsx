"use client";

import React from "react";
import { AsharikandiModal } from "@/components/asharikandi";

export default function AsharikandiFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <AsharikandiModal isOpen={isOpen} onClose={onClose} />;
}

