"use client";

import React from "react";
import { ShapheeLanpheeModal } from "@/components/shapheelanphee";

export default function ShapheeLanpheeFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <ShapheeLanpheeModal isOpen={isOpen} onClose={onClose} />;
}

