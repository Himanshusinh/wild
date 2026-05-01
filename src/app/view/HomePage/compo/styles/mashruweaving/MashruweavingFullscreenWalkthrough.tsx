"use client";

import React from "react";
import { MashruweavingModal } from "@/components/mashruweaving";

export default function MashruweavingFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <MashruweavingModal isOpen={isOpen} onClose={onClose} />;
}
