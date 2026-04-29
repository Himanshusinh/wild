"use client";

import React from "react";
import { KinhalCraftModal } from "@/components/kinhalcraft";

export default function KinhalCraftFullscreenWalkthrough({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return <KinhalCraftModal isOpen={isOpen} onClose={onClose} />;
}

