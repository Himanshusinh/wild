"use client";

import React from "react";
import { CoirCraftModal } from "@/components/coircraft";

export default function CoirCraftFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <CoirCraftModal isOpen={isOpen} onClose={onClose} />;
}

