"use client";

import React from "react";
import { ChambaMiniatureModal } from "@/components/chambaminiature";

export default function ChambaMiniatureFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <ChambaMiniatureModal isOpen={isOpen} onClose={onClose} />;
}

