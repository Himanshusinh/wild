"use client";

import React from "react";
import { SankhedaWoodworkModal } from "@/components/sankhedawoodwork";

export default function SankhedaWoodworkFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <SankhedaWoodworkModal isOpen={isOpen} onClose={onClose} />;
}

