"use client";

import React from "react";
import { ThangkaModal } from "@/components/thangka";

export default function ThangkaFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <ThangkaModal isOpen={isOpen} onClose={onClose} />;
}

