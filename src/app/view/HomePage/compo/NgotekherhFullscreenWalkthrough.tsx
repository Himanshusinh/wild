"use client";

import React from "react";
import { NgotekherhModal } from "@/components/ngotekherh";

export default function NgotekherhFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <NgotekherhModal isOpen={isOpen} onClose={onClose} />;
}
