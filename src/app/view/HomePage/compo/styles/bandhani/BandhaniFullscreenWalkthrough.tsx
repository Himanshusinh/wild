"use client";

import React from "react";
import { BandhaniModal } from "@/components/bandhani";

export default function BandhaniFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <BandhaniModal isOpen={isOpen} onClose={onClose} />;
}

