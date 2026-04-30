"use client";

import React from "react";
import { MonpaModal } from "@/components/monpa";

export default function MonpaFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <MonpaModal isOpen={isOpen} onClose={onClose} />;
}

