"use client";

import React from "react";
import { TempleMuralModal } from "@/components/templemural";

export default function TempleMuralFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <TempleMuralModal isOpen={isOpen} onClose={onClose} />;
}

