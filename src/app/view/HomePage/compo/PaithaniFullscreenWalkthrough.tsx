"use client";

import React from "react";
import { PaithaniModal } from "@/components/paithani";

export default function PaithaniFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <PaithaniModal isOpen={isOpen} onClose={onClose} />;
}

