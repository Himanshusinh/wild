"use client";

import React from "react";
import { BastarDhokraModal } from "@/components/bastardhokra";

export default function BastarDhokraFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <BastarDhokraModal isOpen={isOpen} onClose={onClose} />;
}

