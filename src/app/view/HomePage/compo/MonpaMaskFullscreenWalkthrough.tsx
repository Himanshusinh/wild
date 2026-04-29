"use client";

import React from "react";
import { MonpaMaskModal } from "@/components/monpamask";

export default function MonpaMaskFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <MonpaMaskModal isOpen={isOpen} onClose={onClose} />;
}

