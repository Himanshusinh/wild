"use client";

import React from "react";
import { AgrarianIndustrialModal } from "@/components/agrarianindustrial";

export default function AgrarianIndustrialFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <AgrarianIndustrialModal isOpen={isOpen} onClose={onClose} />;
}

