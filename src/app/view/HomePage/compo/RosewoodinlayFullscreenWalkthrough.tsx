"use client";

import React from "react";
import { RosewoodinlayModal } from "@/components/rosewoodinlay";

export default function RosewoodinlayFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <RosewoodinlayModal isOpen={isOpen} onClose={onClose} />;
}
