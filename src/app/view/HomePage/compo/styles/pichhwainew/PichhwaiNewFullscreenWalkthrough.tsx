"use client";

import React from "react";
import { PichhwaiNewModal } from "@/components/pichhwainew";

export default function PichhwaiNewFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <PichhwaiNewModal isOpen={isOpen} onClose={onClose} />;
}
