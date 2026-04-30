"use client";

import React from "react";
import { PrestigePendantsModal } from "@/components/prestigependants";

export default function PrestigePendantsFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <PrestigePendantsModal isOpen={isOpen} onClose={onClose} />;
}

