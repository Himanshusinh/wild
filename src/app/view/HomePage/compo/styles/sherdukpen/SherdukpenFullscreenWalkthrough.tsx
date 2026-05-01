"use client";

import React from "react";
import { SherdukpenModal } from "@/components/sherdukpen";

export default function SherdukpenFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <SherdukpenModal isOpen={isOpen} onClose={onClose} />;
}

