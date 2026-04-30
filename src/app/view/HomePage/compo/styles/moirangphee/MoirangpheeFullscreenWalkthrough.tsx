"use client";

import React from "react";
import { MoirangpheeModal } from "@/components/moirangphee";

export default function MoirangpheeFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <MoirangpheeModal isOpen={isOpen} onClose={onClose} />;
}
