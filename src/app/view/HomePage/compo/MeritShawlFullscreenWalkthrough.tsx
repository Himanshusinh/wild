"use client";

import React from "react";
import { MeritShawlModal } from "@/components/meritshawl";

export default function MeritShawlFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <MeritShawlModal isOpen={isOpen} onClose={onClose} />;
}

