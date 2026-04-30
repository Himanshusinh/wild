"use client";

import React from "react";
import { PuancheiModal } from "@/components/puanchei";

export default function PuancheiFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <PuancheiModal isOpen={isOpen} onClose={onClose} />;
}

