"use client";

import React from "react";
import { TangaliyaModal } from "@/components/tangaliya";

export default function TangaliyaFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <TangaliyaModal isOpen={isOpen} onClose={onClose} />;
}

