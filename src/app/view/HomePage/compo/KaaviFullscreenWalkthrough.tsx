"use client";

import React from "react";
import { KaaviModal } from "@/components/kaavi";

export default function KaaviFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KaaviModal isOpen={isOpen} onClose={onClose} />;
}
