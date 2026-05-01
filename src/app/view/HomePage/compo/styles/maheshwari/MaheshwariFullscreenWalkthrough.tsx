"use client";

import React from "react";
import { MaheshwariModal } from "@/components/maheshwari";

export default function MaheshwariFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <MaheshwariModal isOpen={isOpen} onClose={onClose} />;
}
