"use client";

import React from "react";
import { KhatambandModal } from "@/components/khatamband";

export default function KhatambandFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KhatambandModal isOpen={isOpen} onClose={onClose} />;
}
