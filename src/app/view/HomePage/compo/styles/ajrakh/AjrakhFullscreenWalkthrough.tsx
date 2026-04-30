"use client";

import React from "react";
import { AjrakhModal } from "@/components/ajrakh";

export default function AjrakhFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <AjrakhModal isOpen={isOpen} onClose={onClose} />;
}
