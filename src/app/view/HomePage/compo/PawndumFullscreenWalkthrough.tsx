"use client";

import React from "react";
import { PawndumModal } from "@/components/pawndum";

export default function PawndumFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <PawndumModal isOpen={isOpen} onClose={onClose} />;
}

