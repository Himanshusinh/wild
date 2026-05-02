"use client";

import React from "react";
import { GharcholaModal } from "@/components/gharchola";

export default function GharcholaFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <GharcholaModal isOpen={isOpen} onClose={onClose} />;
}

