"use client";

import React from "react";
import { ExposedLateriteModal } from "@/components/exposedlaterite";

export default function ExposedLateriteFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <ExposedLateriteModal isOpen={isOpen} onClose={onClose} />;
}

