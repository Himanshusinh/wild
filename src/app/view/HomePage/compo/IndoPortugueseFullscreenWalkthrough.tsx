"use client";

import React from "react";
import { IndoPortugueseModal } from "@/components/indoportuguese";

export default function IndoPortugueseFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <IndoPortugueseModal isOpen={isOpen} onClose={onClose} />;
}

