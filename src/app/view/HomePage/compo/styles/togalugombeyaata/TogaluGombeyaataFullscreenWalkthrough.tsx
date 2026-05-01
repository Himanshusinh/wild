"use client";

import React from "react";
import { TogaluGombeyaataModal } from "@/components/togalugombeyaata";

export default function TogaluGombeyaataFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <TogaluGombeyaataModal isOpen={isOpen} onClose={onClose} />;
}

