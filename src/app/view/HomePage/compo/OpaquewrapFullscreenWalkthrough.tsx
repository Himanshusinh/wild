"use client";

import React from "react";
import { OpaquewrapModal } from "@/components/opaquewrap";

export default function OpaquewrapFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <OpaquewrapModal isOpen={isOpen} onClose={onClose} />;
}
