"use client";

import React from "react";
import { BorderSignTextileModal } from "@/components/bordersigntextile";

export default function BorderSignTextileFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <BorderSignTextileModal isOpen={isOpen} onClose={onClose} />;
}

