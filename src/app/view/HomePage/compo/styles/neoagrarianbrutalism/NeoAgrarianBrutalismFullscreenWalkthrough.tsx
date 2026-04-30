"use client";

import React from "react";
import { NeoAgrarianBrutalismModal } from "@/components/neoAgrarianBrutalism";

export default function NeoAgrarianBrutalismFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <NeoAgrarianBrutalismModal isOpen={isOpen} onClose={onClose} />;
}
