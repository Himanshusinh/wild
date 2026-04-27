"use client";

import React from "react";
import { MotibharatModal } from "@/components/motibharat";

export default function MotibharatFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <MotibharatModal isOpen={isOpen} onClose={onClose} />;
}
