"use client";

import React from "react";
import { YakshaganaModal } from "@/components/yakshagana";

export default function YakshaganaFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <YakshaganaModal isOpen={isOpen} onClose={onClose} />;
}
